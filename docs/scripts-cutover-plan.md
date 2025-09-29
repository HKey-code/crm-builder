## Scripts cutover plan (backend-first, feature-flagged)

Background (short)
- We are consolidating two script model families (legacy `guidance.*` vs new `scripts.*`).
- Consolidate on `scripts` schema with neutral names: `Script`, `ScriptVersion`, `ScriptRun`, `RunVariable`, `ScriptAuditLog`.
- Keep `graphJson` in versions; deprecate normalized `guidance.ScriptNode`/`ScriptEdge` (export-only bridge).
- Phased cut-over behind a feature flag.

Repo paths used below (adapted to this mono-repo):
- Prisma schema: `libs/schema-engine/prisma/schema.prisma`
- Backend: `apps/backend/src`
- Frontend (author app): `apps/frontend/mockup-frontend`

---

### 1) Define the unified models (no behavior) — Prisma only

Task: Create unified Prisma models under the `scripts` schema with neutral names. Do not delete legacy models yet. Use `@@map`/`@map` to map to existing `AuthorScript*` tables where possible; keep enums compatible (`ScriptStatus`, `ChangeAction`).

Where
- `libs/schema-engine/prisma/schema.prisma`

Models to add (neutral names; mapped to existing tables if present)
- `scripts.Script (id uuid/cuid, tenantId, name, slug, status enum DRAFT/PUBLISHED/ARCHIVED, createdAt, updatedAt)`
- `scripts.ScriptVersion (id, scriptId, version int, status enum or isPublished boolean, graphJson Json, variablesDef Json?, entryNodeId String?, notes String?, createdAt, publishedAt?)`
- `scripts.ScriptRun (id, tenantId, scriptId, version int, subjectSchema String?, subjectId String?, startedByUserId String?, startedAt, completedAt?, state Json?)`
- `scripts.RunVariable (id cuid, runId, key String, jsonVal Json?, strVal?, numVal?, boolVal?, createdAt)`
- `scripts.ScriptAuditLog (id, tenantId, scriptId, version int, actorId String?, action enum {CREATED, UPDATED, PUBLISHED, UNPUBLISHED, ARCHIVED, RESTORED}, diffJson Json?, note String?, createdAt)`

Indexes
- Mirror those defined in the consolidation doc (e.g., unique `[scriptId, version]`, helpful compound indexes on tenant/status, etc.).

Acceptance
- `pnpm prisma validate` and `pnpm prisma generate` pass.
- No migrations yet (mapping only).

---

### 2) Add a thin repository + service layer (read/write) behind a feature flag

Task: Add a new scripts service with repositories for the unified models, guarded by a flag.

Where
- `apps/backend/src/modules/scripts/*`

Create
- `ScriptsRepo` (CRUD for `Script`, `ScriptVersion`, `ScriptRun`, `RunVariable`, `ScriptAuditLog`).
- `ScriptsService` with methods:
  - `createScript(dto)`, `updateScript(id, dto)`
  - `createVersion(scriptId, dto)`, `publishVersion(scriptId, ver)`, `unpublishVersion(...)`
  - `startRun(scriptId, version, subject)`, `completeRun(runId, state?)`
  - `putRunVars(runId, vars[])` (upsert by `[runId, key]`)
- DTOs + schema validation; minimal error handling.
- Feature flag: `SCRIPTS_BACKEND=v2` switches controller binding to this service (otherwise no-op).

Acceptance
- Unit tests with in-memory Prisma/sqlite cover happy paths.
- No routes yet; existing guidance code paths untouched.

---

### 3) Expose minimal REST endpoints for authoring + runs (Phase-2 endpoints)

Task: Add REST endpoints for the new scripts service (behind flag).

Where
- `apps/backend/src/modules/scripts/scripts.controller.ts`

Endpoints (v1)
- `POST /api/scripts` → create script
- `GET /api/scripts/:id`
- `POST /api/scripts/:id/versions` → create version `{ graphJson, variablesDef, notes }`
- `POST /api/scripts/:id/versions/:ver/publish` and `/unpublish`
- `POST /api/runs` → `{ scriptId, version, subject }` startRun
- `POST /api/runs/:runId/vars` → upsert run variables
- `POST /api/runs/:runId/complete`

Include
- OpenAPI decorators or `openapi.yaml` generation for Gemini later.

Acceptance
- Controller wired to `ScriptsService`.
- Swagger shows endpoints when `SCRIPTS_BACKEND=v2`.
- 2–3 supertest e2e tests: create → publish → startRun → vars → complete.

---

### 4) Export bridge (read-only) from legacy guidance → new graphJson

Task: Implement an exporter that reads a legacy `guidance.ScriptVersion` and produces consolidated `graphJson`.

Where
- `apps/backend/src/modules/scripts/bridges/guidance-exporter.ts`

Do
- Walk `guidance.ScriptNode` / `guidance.ScriptEdge` to create `graphJson` with node type, key, prompt, config, uischema.
- Function: `exportLegacyVersion(scriptId, version) => { graphJson, variablesDef, entryNodeId }`.
- Admin endpoint (flagged): `POST /api/scripts/bridge/guidance/export` with `{ legacyScriptId, version }` returns JSON (no DB write).

Acceptance
- Deterministic export (stable ordering) + unit tests.

---

### 5) Data migration (optional dry-run first)

Task: Add a dry-run migration script and a guarded import.

Where
- `tools/scripts/migrate-guidance-preview.ts`
- `tools/scripts/migrate-guidance-import.ts`

Do
- Preview: list legacy guidance scripts and latest published version; export to `tmp/scripts-migration/`.
- Import (with `--confirm`): create `scripts.Script` (slug from name), `ScriptVersion` with exported `graphJson`, preserve published status.

Acceptance
- Dry-run produces preview files; import with `--confirm` writes chosen samples.

---

### 6) Frontend author app: wire minimal author + version APIs (no runner yet)

Task: Add a tiny API client + hooks in the frontend to save graph JSON into the new endpoints (feature flag).

Where
- `apps/frontend/mockup-frontend/src/api/scriptsClient.ts` (+ React hooks)

Do
- `createScript(name)`
- `createVersion(scriptId, { graphJson, variablesDef, notes })`
- `publishVersion(scriptId, version)`
- Provide `saveToNewBackend()` the canvas can call when the flag is set.
- Add a menu item “Save (new backend)” that calls the new API when `NEXT_PUBLIC_SCRIPTS_BACKEND=v2`.

Acceptance
- From the canvas, saving creates `Script` + `ScriptVersion` in the new backend.

---

### 7) Clean-up plan (tracked, not executed yet)

Task: Author a follow-up checklist with:
- Steps to rename tables from `AuthorScript*` → neutral `Script*` (or keep mapped).
- Steps to retire legacy `guidance.*` reads with a read-only view or exporter route.
- Rollback notes and backups.
- Final removal PR list.

Where
- `docs/scripts-cutover-checklist.md`

Acceptance
- Checklist file exists and references the PRs from steps 1–6.

---

Notes / guardrails
- Treat any code examples as guidance, not verbatim; match our folder structure and lint rules.
- Keep workflow schema out for now; focus on scripts authoring + runs.
- Keep all new code behind `SCRIPTS_BACKEND=v2` until ready to flip.

