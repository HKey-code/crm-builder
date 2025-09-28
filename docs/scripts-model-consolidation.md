## Scripts data model consolidation — inventory & merge plan (no code changes)

This RFC inventories the two script-related Prisma model families currently in-repo and proposes a single, canonical model set and a phased merge plan. No code changes are included here.

Assumptions
- No production data depends on these models yet. If there is data, see Phase C for migration steps and risks.
- Consumers of the existing Guidance APIs are internal only and can tolerate a short compatibility window.

---

### 1) Model inventory (side-by-side)

Legend: schema.modelName — key fields and relations. This table aligns comparable concepts.

| Concept | Existing family | Fields (type, default) | Indexes/unique | Relations | Enums |
|---|---|---|---|---|---|
| Script (authoring) | guidance.Script | id uuid, tenantId String?, key String, title String, description String?, tags String[], latestVersion Int=1, createdAt now, updatedAt updatedAt | unique [tenantId, key], index [tenantId] | versions: ScriptVersion[] | — |
| Script (authoring) | scripts.AuthorScript | id cuid, tenantId String, name String, slug String, description String?, status ScriptStatus=DRAFT, activeVersionId String?, latestVersion Int=0, labels String[]=[], intents String[]=[], languageCodes String[]=[], embeddingKey String?, createdById String, updatedById String, createdAt now, updatedAt updatedAt | unique [tenantId, slug], index [tenantId, status] | versions: AuthorScriptVersion[], auditLogs: AuthorScriptAuditLog[], runs: AuthorScriptRun[] | ScriptStatus |
| Version | guidance.ScriptVersion | id uuid, scriptId String, version Int, status String='DRAFT', entryNodeId String?, notes String?, createdAt now, publishedAt DateTime? | unique [scriptId, version], index [status] | script: Script, nodes: ScriptNode[], edges: ScriptEdge[], variables: ScriptVariable[] | — |
| Version | scripts.AuthorScriptVersion | id cuid, scriptId String, version Int, graphJson Json, variablesDef Json?, changelog String?, isPublished Boolean=false, createdById String, createdAt now | unique [scriptId, version], index [scriptId, isPublished] | script: AuthorScript | — |
| Audit log | guidance (none) | — | — | — | — |
| Audit log | scripts.AuthorScriptAuditLog | id cuid, tenantId String, scriptId String, version Int, actorId String, action ChangeAction, diffJson Json?, note String?, createdAt now | index [tenantId, scriptId, createdAt] | script: AuthorScript | ChangeAction |
| Run (runtime) | guidance.ScriptRun | id uuid, tenantId String?, scriptId String, scriptVersion Int, subjectSchema String?, subjectModel String?, subjectId String?, startedByUserId String?, startedAt now, completedAt DateTime?, state Json? | index [tenantId, scriptId, scriptVersion], index [subjectSchema, subjectModel, subjectId] | answers: ScriptAnswer[] | — |
| Run (runtime) | scripts.AuthorScriptRun | id cuid, tenantId String, scriptId String, version Int, startedById String?, connectorType String?, connectorKey String?, status String='RUNNING', startedAt now, endedAt DateTime? | index [tenantId, scriptId, startedAt], index [status] | vars: RunVariable[], script: AuthorScript | — |
| Run variables/answers | guidance.ScriptAnswer | id uuid, runId String, nodeKey String, value Json, answeredAt now | index [runId, answeredAt] | run: ScriptRun | — |
| Run variables/answers | scripts.RunVariable | id cuid, runId String, key String, strVal String?, numVal Float?, boolVal Boolean?, jsonVal Json? | index [runId, key] | run: AuthorScriptRun | — |
| Graph nodes | guidance.ScriptNode | id uuid, scriptVersionId String, key String, type ScriptNodeType, title String?, prompt String?, uiSchema Json?, config Json?, orderIndex Int=0 | unique [scriptVersionId, key], index [scriptVersionId, orderIndex] | version: ScriptVersion, outgoing: ScriptEdge[], incoming: ScriptEdge[] | ScriptNodeType |
| Graph edges | guidance.ScriptEdge | id uuid, scriptVersionId String, fromNodeId String, toNodeId String, condition Json? | index [scriptVersionId], [fromNodeId], [toNodeId] | version: ScriptVersion, fromNode, toNode | — |
| Variables def | guidance.ScriptVariable | id uuid, scriptVersionId String, key String, type String, enumValues String[], defaultVal String?, required Boolean=false | unique [scriptVersionId, key] | version: ScriptVersion | — |

Notes
- guidance family normalizes the graph across nodes/edges/variables and uses a free-form `status` string on versions.
- scripts family embeds the graph in `graphJson` with `variablesDef` and uses a boolean `isPublished` plus `activeVersionId`/`latestVersion` at the script level. It also adds audit logging and connector metadata on runs and typed `RunVariable` values.

Enums
- scripts.ScriptStatus, scripts.ChangeAction are defined under the `scripts` schema.
- guidance has `ScriptNodeType` (under guidance schema) but no formal status enum for versions.

Source reference
- All model definitions live in `libs/schema-engine/prisma/schema.prisma` with `@@schema("guidance")` and `@@schema("scripts")`.

---

### 2) Usage map (code references)

Backend (NestJS)
- Guidance module (authoring/runtime prototype using `guidance.*`):
  - `apps/backend/src/guidance/guidance.controller.ts`
    - GET `/guidance/scripts/:key` → fetch active script version by key.
    - POST `/guidance/scripts/:key/run` → start a run.
    - POST `/guidance/runs/:id/answer` → store an answer.
    - POST `/guidance/runs/:id/advance` → advance cursor and optionally dispatch an ACTION.
    - POST `/guidance/scripts/:id/publish` → mark a version ACTIVE.
  - `apps/backend/src/guidance/guidance.service.ts`
    - Prisma reads/writes against `script`, `scriptVersion`, `scriptRun`, `scriptAnswer` (all guidance models).
    - Uses `ops.AuditLog` for coarse audit events (not per-change authoring audit).
    - Evaluates node conditions via `apps/backend/src/guidance/runner/json-logic.ts`.
  - DTOs: `apps/backend/src/guidance/dto/{start-run.dto.ts, answer.dto.ts, publish.dto.ts}` assume guidance shapes (node keys, status strings, etc.).

- New scripts family usages:
  - No runtime usages yet; models exist only in Prisma schema and migration added in `feat/prisma-scripts-core`.

Migrations/seed
- Guidance models were introduced in earlier migrations (see `libs/schema-engine/prisma/migrations/*`).
- Scripts models were added by `*_scripts_core_init/migration.sql` under the new branch; no seeds yet.

Summary of functional coverage
- guidance: authoring via normalized graph; publishing via status string; runtime via `ScriptRun` + `ScriptAnswer`; basic audit to ops.AuditLog.
- scripts: authoring via `graphJson` + `variablesDef`; version publishing via `isPublished`/`activeVersionId`; runtime via `AuthorScriptRun` + `RunVariable`; dedicated authoring `AuditLog` with `ChangeAction`.

---

### 3) Conflict & overlap analysis

Duplicates
- Script entities exist in both families (guidance.Script vs scripts.AuthorScript).
- Versioning exists in both (guidance.ScriptVersion vs scripts.AuthorScriptVersion) but state tracking differs (`status` string vs boolean + activeVersion pointer).
- Runtime exists in both (guidance.ScriptRun/ScriptAnswer vs scripts.AuthorScriptRun/RunVariable) with different data shapes (answers by nodeKey vs key/value variables).

Important differences
- Graph representation: normalized (guidance) vs embedded JSON (scripts). The normalized model eases querying per node; the embedded model simplifies version payload persistence and diffing.
- Audit: scripts family has first-class `AuthorScriptAuditLog` with `ChangeAction`; guidance relies on generic ops audit.
- Publishing model: scripts uses `isPublished` and `activeVersionId` on Script; guidance uses a free-form `status` string on versions and fetches where status='ACTIVE'.
- Naming collisions: model names `Script`, `ScriptVersion`, `ScriptRun` exist already under guidance; new family used `AuthorScript*` to avoid Prisma model name collision.

Impact on migrations/seed
- If guidance data exists, merging requires translating nodes/edges/variables into a single `graphJson` and `variablesDef`, preserving version numbers and published status.

---

### 4) Recommendation: single target model set

Canonical choice
- Keep the new `scripts` schema as canonical for authoring and runtime, using neutral model names: `Script`, `ScriptVersion`, `ScriptAuditLog`, `ScriptRun`, `RunVariable`.
- Rationale: embedded `graphJson` aligns with the React/@xyflow editor, audit is first-class, publish state is explicit, and runtime variables support typed values.

Brief target definitions (Prisma sketch; not code to apply yet)
```
// @@schema("scripts") for all
enum ScriptStatus { DRAFT PUBLISHED ARCHIVED }
enum ChangeAction { CREATE UPDATE PUBLISH ARCHIVE ROLLBACK }

model Script { id String @id @default(cuid()) tenantId String name String slug String description String? status ScriptStatus @default(DRAFT) activeVersionId String? latestVersion Int @default(0) labels String[] @default([]) intents String[] @default([]) languageCodes String[] @default([]) embeddingKey String? createdById String updatedById String createdAt DateTime @default(now()) updatedAt DateTime @updatedAt versions ScriptVersion[] auditLogs ScriptAuditLog[] runs ScriptRun[] @@unique([tenantId, slug]) @@index([tenantId, status]) }

model ScriptVersion { id String @id @default(cuid()) scriptId String version Int graphJson Json variablesDef Json? changelog String? isPublished Boolean @default(false) createdById String createdAt DateTime @default(now()) script Script @relation(fields: [scriptId], references: [id]) @@unique([scriptId, version]) @@index([scriptId, isPublished]) }

model ScriptAuditLog { id String @id @default(cuid()) tenantId String scriptId String version Int actorId String action ChangeAction diffJson Json? note String? createdAt DateTime @default(now()) script Script @relation(fields: [scriptId], references: [id]) @@index([tenantId, scriptId, createdAt]) }

model ScriptRun { id String @id @default(cuid()) tenantId String scriptId String version Int startedById String? connectorType String? connectorKey String? status String @default("RUNNING") startedAt DateTime @default(now()) endedAt DateTime? script Script @relation(fields: [scriptId], references: [id]) vars RunVariable[] @@index([tenantId, scriptId, startedAt]) @@index([status]) }

model RunVariable { id String @id @default(cuid()) runId String key String strVal String? numVal Float? boolVal Boolean? jsonVal Json? run ScriptRun @relation(fields: [runId], references: [id]) @@index([runId, key]) }
```

---

### 5) Merge strategy (phased)

Phase A — Rename/mapping (no behavioral changes)
- Introduce neutral Prisma models in `scripts` schema with the desired names, using `@@map`/`@map` to point to the current `AuthorScript*` table names, then run a no-op migration (or rename tables if desired). This keeps the DB stable while code adopts neutral names.
- Optionally create SQL views under `guidance` that map to `scripts` tables for a short read-only compatibility period, e.g. `guidance.Script` view selects from `scripts.Script` with column aliasing.
- Freeze new writes to guidance models; gate via feature flag in the Guidance service.

Phase B — Code changes (adopt scripts family)
- Replace usages in:
  - Services: `apps/backend/src/guidance/guidance.service.ts` → new `scripts` service (or update to use `scripts.*` models and `graphJson`).
  - Controllers: `apps/backend/src/guidance/guidance.controller.ts` → new `/scripts` routes, keep old `/guidance` routes as thin adapters for a deprecation window.
  - DTOs: update shapes to `graphJson` + `variablesDef`, explicit publish endpoints, and typed variables where applicable.
  - Tests: update e2e/unit to use the new models and endpoints.

Phase C — Data migration (if any guidance data exists)
- For each guidance.Script:
  1) Create `scripts.Script` with slug = guidance.key, name = guidance.title, copy description/tags → labels, set latestVersion to max(version).
  2) For each guidance.ScriptVersion:
     - Build `graphJson` by exporting nodes/edges (and prompts/config) into a single JSON structure compatible with the editor/runner.
     - Derive `variablesDef` from guidance.ScriptVariable.
     - Set `isPublished` based on `status='ACTIVE'` and set `activeVersionId` on the parent accordingly.
  3) For runtime: migrate `guidance.ScriptRun` to `scripts.ScriptRun` and translate `state` and `ScriptAnswer` rows to `RunVariable` by flattening `answers` or using `nodeKey` → `key` with JSON values.
- Order of operations
  - Put API into maintenance/dual-read mode.
  - Copy data into `scripts.*` tables (idempotent migration script).
  - Validate counts and spot-check a few scripts/versions/runs.
  - Flip read path to `scripts.*` and disable writes to `guidance.*`.
  - Rollback plan: flip reads back and keep old tables intact; migration is additive.

Phase D — Cleanup
- Remove `guidance.*` models from Prisma schema and drop legacy tables/views in a final migration.
- Remove compatibility endpoints and DTOs; delete dead code under `apps/backend/src/guidance` if superseded.

---

### 6) Risk & impact
- API surface change: moving from node/edge–centric endpoints to `graphJson` payloads; mitigate by offering compatibility adapters during a deprecation window.
- Enum scope conflicts: Ensure `ScriptStatus`/`ChangeAction` only exist under `scripts` schema; avoid name collisions.
- Data migration complexity: Translating normalized graphs into JSON; mitigate with a tested export routine and backfill script, plus dual-read verification.
- Client expectations: DTOs/validators tied to old shapes; mitigate with typed mappers and clear versioned routes.
- Operational: New indexes and tables under `scripts` schema; ensure migration ordering and zero-downtime apply.

---

### 7) Decision summary (TL;DR)
- Keep: `scripts` schema with neutral models `Script`, `ScriptVersion`, `ScriptAuditLog`, `ScriptRun`, `RunVariable`, enums `ScriptStatus`, `ChangeAction`.
- Deprecate: `guidance.*` models and endpoints after a short compatibility period.
- Migrate: Data from `guidance` to `scripts` via additive copy + validation, then cutover and clean up.
- Steps: Phase A (rename/mapping), Phase B (code updates), Phase C (data migration), Phase D (cleanup).

Links
- Models: `libs/schema-engine/prisma/schema.prisma`
- Guidance module: `apps/backend/src/guidance/*`


