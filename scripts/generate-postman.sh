#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
OUT_DIR="$ROOT_DIR/scripts/postman"
# Prefer local generated spec; otherwise use live API JSON (Nest defaults to /api-json)
LOCAL_SPEC_PATH="$ROOT_DIR/openapi-spec.json"
API_URL=${API_URL:-"http://localhost:3000/api-json"}
# Derive base URL (scheme://host[:port]) from API_URL unless BASE_URL is provided
BASE_URL=${BASE_URL:-$(printf "%s\n" "$API_URL" | sed -E 's#(https?://[^/]+).*#\1#')}

mkdir -p "$OUT_DIR"

# Resolve OpenAPI spec source
SPEC_PATH=""
if [ -s "$LOCAL_SPEC_PATH" ]; then
  SPEC_PATH="$LOCAL_SPEC_PATH"
  echo "Using local OpenAPI spec: $SPEC_PATH"
else
  echo "Local OpenAPI spec not found. Attempting to generate via npm..."
  if command -v npm >/dev/null 2>&1; then
    (cd "$ROOT_DIR" && npm run generate:openapi) | cat || true
  fi
  if [ -s "$LOCAL_SPEC_PATH" ]; then
    SPEC_PATH="$LOCAL_SPEC_PATH"
    echo "Generated OpenAPI spec: $SPEC_PATH"
  else
    echo "Falling back to fetching OpenAPI from: $API_URL"
    if command -v curl >/dev/null 2>&1; then
      if curl -fsSL "$API_URL" -o "$OUT_DIR/openapi.json"; then
        SPEC_PATH="$OUT_DIR/openapi.json"
      else
        echo "Warning: could not fetch OpenAPI from $API_URL; proceeding with fallback collection."
      fi
    else
      echo "Warning: curl not found; proceeding with fallback collection."
    fi
  fi
fi

# Write Postman environment
cat > "$OUT_DIR/environment.json" <<ENV
{
  "variable": [
    {"key": "baseUrl", "value": "$BASE_URL"},
    {"key": "token", "value": "<paste_jwt>"},
    {"key": "tenantId", "value": "<tenant_id>"},
    {"key": "workflowId", "value": "<workflow_id>"},
    {"key": "caseId", "value": "<case_id>"},
    {"key": "instanceId", "value": "<instance_id>"}
  ]
}
ENV

# Try to convert OpenAPI → Postman collection via npx openapi2postmanv2 if spec exists
if [ -n "${SPEC_PATH:-}" ] && [ -s "$SPEC_PATH" ] && npx -y openapi-to-postmanv2 -s "$SPEC_PATH" -o "$OUT_DIR/collection.json" -p >/dev/null 2>&1; then
  echo "Generated Postman collection from OpenAPI: $OUT_DIR/collection.json"
else
  echo "openapi2postmanv2 failed or unavailable; writing minimal fallback collection."
  cat > "$OUT_DIR/collection.json" << 'JSON'
{
  "info": { "name": "CRM Builder API", "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" },
  "item": [
    {
      "name": "Create Case",
      "request": {
        "method": "POST",
        "header": [ {"key": "Authorization", "value": "Bearer {{token}}"}, {"key": "Content-Type", "value": "application/json"} ],
        "url": { "raw": "{{baseUrl}}/service/cases", "host": ["{{baseUrl}}"], "path": ["service","cases"] },
        "body": { "mode": "raw", "raw": "{\n  \"tenantId\": \"{{tenantId}}\",\n  \"caseNumber\": \"PRM-POSTMAN-1\",\n  \"caseType\": \"PERMIT\",\n  \"status\": \"open\"\n}" }
      },
      "event": [{
        "listen": "test",
        "script": {"exec": [
          "var json = pm.response.json();",
          "pm.collectionVariables.set('caseId', json.id || json.case?.id || '');",
          "pm.test('Case created', function(){ pm.expect(pm.response.code).to.be.oneOf([200,201]); });"
        ], "type": "text/javascript"}
      }]
    },
    {
      "name": "Find Workflow Instance by Subject",
      "request": {
        "method": "GET",
        "header": [ {"key": "Authorization", "value": "Bearer {{token}}"} ],
        "url": { "raw": "{{baseUrl}}/workflow/instances?subjectSchema=service&subjectModel=Case&subjectId={{caseId}}",
          "host": ["{{baseUrl}}"], "path": ["workflow","instances"],
          "query": [ {"key":"subjectSchema","value":"service"},{"key":"subjectModel","value":"Case"},{"key":"subjectId","value":"{{caseId}}"} ] }
      },
      "event": [{
        "listen": "test",
        "script": {"exec": [
          "var arr = pm.response.json();",
          "if (Array.isArray(arr) && arr.length) { pm.collectionVariables.set('instanceId', arr[0].id); }",
          "pm.test('Instances fetched', function(){ pm.expect(pm.response.code).to.be.oneOf([200]); });"
        ], "type": "text/javascript"}
      }]
    },
    {
      "name": "Advance Workflow Instance",
      "request": {
        "method": "POST",
        "header": [ {"key": "Authorization", "value": "Bearer {{token}}"}, {"key": "Content-Type", "value": "application/json"} ],
        "url": { "raw": "{{baseUrl}}/workflow/instances/{{instanceId}}/advance", "host": ["{{baseUrl}}"], "path": ["workflow","instances","{{instanceId}}","advance"] },
        "body": { "mode": "raw", "raw": "{}" }
      },
      "event": [{
        "listen": "test",
        "script": {"exec": [
          "pm.test('Advanced or terminal', function(){ pm.expect(pm.response.code).to.be.oneOf([200]); });"
        ], "type": "text/javascript"}
      }]
    }
  ]
}
JSON
fi

echo "Postman assets written to $OUT_DIR"

