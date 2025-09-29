## Scripts cutover checklist (tracked, not executed)

Prereqs
- Feature flag available: `SCRIPTS_BACKEND=v2` (off by default).
- Unified models defined under `scripts` schema with neutral names.

Cutover steps
1) Tables
   - Decide: rename `AuthorScript*` → `Script*` or keep mapped via `@@map`/`@map`.
   - If renaming: create migration with `ALTER TABLE ... RENAME TO ...` inside `scripts` schema.
2) Read paths
   - Switch backend reads to `scripts.*` service when flag on.
   - Keep `/guidance` endpoints as thin adapters during deprecation period.
3) Data migration (if any legacy data)
   - Run preview exporter; validate JSON snapshots.
   - Run import with `--confirm`; verify counts and spot-check samples.
   - Preserve published status and active version pointers.
4) Frontend
   - Enable “Save (new backend)” behind `NEXT_PUBLIC_SCRIPTS_BACKEND=v2`.
   - After cutover, flip default and remove legacy save code.
5) Observability
   - Add Correlation-Id per request; basic timings for create/publish.
6) Rollback
   - Keep legacy tables/views intact; toggle feature flag off to revert reads.
   - Restore from backup if table renames were applied.
7) Cleanup
   - Remove legacy `guidance.*` models and endpoints.
   - Drop compatibility views.
   - Final migration to prune unused columns/indexes.

PRs to track
- PR A: Prisma unified models (mapping only)
- PR B: Scripts repo/service behind flag
- PR C: REST controller + e2e (flagged)
- PR D: Guidance exporter + tests
- PR E: Migration scripts (preview/import)
- PR F: Frontend API client + Save (new backend)
- PR G: Final cleanup removal


