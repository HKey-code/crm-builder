#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   DATABASE_URL_LOCAL='postgres://...' \
#   DATABASE_URL_AZURE='postgres://...' \
#   ./compare_db.sh
#
# Outputs:
#   ./out/local.tables.tsv
#   ./out/azure.tables.tsv
#   ./out/local.columns.tsv
#   ./out/azure.columns.tsv
#   plus human-readable diffs

SCHEMAS="'core','ui','ops','service','sales','marketing','portal'"

mkdir -p out

sql_tables=$(
cat <<'SQL'
WITH t AS (
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_type='BASE TABLE'
    AND table_schema IN (SCHEMAS)
)
SELECT t.table_schema,
       t.table_name,
       COALESCE(s.n_live_tup, 0)::bigint AS rows
FROM t
LEFT JOIN pg_stat_user_tables s
  ON s.relname = t.table_name
ORDER BY 1,2;
SQL
)

sql_columns=$(
cat <<'SQL'
SELECT c.table_schema,
       c.table_name,
       md5(
         string_agg(
           format('%s:%s:%s:%s',
                  c.column_name,
                  c.data_type,
                  c.is_nullable,
                  COALESCE(c.character_maximum_length::text,'-'))
           , '|' ORDER BY c.ordinal_position
         )
       ) AS colsig,
       string_agg(
         format('%s %s%s',
                c.column_name,
                c.data_type,
                CASE
                  WHEN c.character_maximum_length IS NOT NULL
                    THEN '('||c.character_maximum_length||')'
                  ELSE ''
                END),
         ', ' ORDER BY c.ordinal_position
       ) AS coldef
FROM information_schema.columns c
WHERE c.table_schema IN (SCHEMAS)
GROUP BY c.table_schema, c.table_name
ORDER BY 1,2;
SQL
)

# Replace placeholder
sql_tables="${sql_tables/SCHEMAS/$SCHEMAS}"
sql_columns="${sql_columns/SCHEMAS/$SCHEMAS}"

run_psql () {
  local url="$1"
  local sql="$2"
  local outfile="$3"
  PSQLRC=/dev/null psql "$url" -At -F $'\t' -c "$sql" > "$outfile"
}

echo "▶ Pulling metadata from LOCAL…"
run_psql "${DATABASE_URL_LOCAL:?Missing DATABASE_URL_LOCAL}" "$sql_tables"  "out/local.tables.tsv"
run_psql "${DATABASE_URL_LOCAL}"                                     "$sql_columns" "out/local.columns.tsv"

echo "▶ Pulling metadata from AZURE…"
run_psql "${DATABASE_URL_AZURE:?Missing DATABASE_URL_AZURE}" "$sql_tables"  "out/azure.tables.tsv"
run_psql "${DATABASE_URL_AZURE}"                              "$sql_columns" "out/azure.columns.tsv"

echo
echo "──────── TABLE PRESENCE & ROWCOUNT DIFF ────────"
# Normalize keys as "schema.table"
awk -F'\t' '{print $1"."$2"\t"$3}' out/local.tables.tsv | sort > out/local.tables.norm.tsv
awk -F'\t' '{print $1"."$2"\t"$3}' out/azure.tables.tsv | sort > out/azure.tables.norm.tsv

# Show presence differences
echo "• Tables only in LOCAL:"
comm -23 out/local.tables.norm.tsv out/azure.tables.norm.tsv | cut -f1 | sed 's/^/   - /' || true
echo
echo "• Tables only in AZURE:"
comm -13 out/local.tables.norm.tsv out/azure.tables.norm.tsv | cut -f1 | sed 's/^/   - /' || true
echo

# Rowcount differences for common tables
echo "• Rowcount changes (LOCAL vs AZURE):"
join -t $'\t' -j 1 \
  out/local.tables.norm.tsv \
  out/azure.tables.norm.tsv \
  | awk -F'\t' '$2 != $3 {printf "   - %-40s local=%s  azure=%s\n", $1, $2, $3}'

echo
echo "──────── COLUMN SHAPE DIFF (SCHEMA) ────────"
awk -F'\t' '{print $1"."$2"\t"$3"\t"$4}' out/local.columns.tsv | sort > out/local.columns.norm.tsv
awk -F'\t' '{print $1"."$2"\t"$3"\t"$4}' out/azure.columns.tsv | sort > out/azure.columns.norm.tsv

echo "• Tables only in LOCAL (by column sig):"
comm -23 <(cut -f1 out/local.columns.norm.tsv) <(cut -f1 out/azure.columns.norm.tsv) | sed 's/^/   - /' || true
echo
echo "• Tables only in AZURE (by column sig):"
comm -13 <(cut -f1 out/local.columns.norm.tsv) <(cut -f1 out/azure.columns.norm.tsv) | sed 's/^/   - /' || true
echo

echo "• Column signature differences:"
join -t $'\t' -j 1 \
  <(cut -f1-2 out/local.columns.norm.tsv) \
  <(cut -f1-2 out/azure.columns.norm.tsv) \
  | awk -F'\t' '$2 != $3 {printf "   - %-40s local_sig=%s  azure_sig=%s\n", $1, $2, $3}'

echo
echo "Tip: see full column definitions in:"
echo "  - out/local.columns.tsv"
echo "  - out/azure.columns.tsv"
echo
echo "✅ Done."
