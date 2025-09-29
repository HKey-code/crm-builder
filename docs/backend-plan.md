## Backend Plan (Scripts only)

### Short context
- Script editor stores a persistable graphJson + manifest.
- Versions and audit logs track change history.
- Runner will later use ScriptRun + RunVariable.
- We expose a generic commands endpoint and SSE event stream; real integrations come later.
- Do not include workflow models yet.

### Phase 1 — Data model (Prisma)
- Enums: ScriptStatus { DRAFT, PUBLISHED, ARCHIVED }, ChangeAction { CREATE, UPDATE, PUBLISH, ARCHIVE, ROLLBACK }.
- Models: Script, ScriptVersion, ScriptAuditLog, ScriptRun, RunVariable.
- Migration: scripts_core_init.

### Phase 2 — Scripts API
- POST /scripts, GET /scripts, GET /scripts/:id, PATCH /scripts/:id (status changes allowed).
- DTOs with class-validator; return consistent errors.

### Phase 3 — Versions API
- POST /scripts/:id/versions (auto-increment), POST /scripts/:id/versions/:version/publish.
- GET /scripts/:id/versions, GET /scripts/:id/versions/:version.
- Enforce body size limits for graphJson.

### Phase 4 — Audit logging
- Insert ScriptAuditLog on create/update/publish endpoints.
- GET /scripts/:id/audit (paginated).

### Phase 5 — Runs & variables
- POST /runs, POST /runs/:runId/vars (upsert), POST /runs/:runId/finish.
- GET /runs, GET /runs/:runId.

### Phase 6 — Commands endpoint (outbox)
- POST /commands persists to CommandOutbox (PENDING).
- Return 202 with correlationId. No bus yet.

### Phase 7 — SSE events stream
- GET /events/stream (text/event-stream); filter by tenant/correlationId if provided.
- Keep-alive ping every 30s.

### Phase 8 — Dev worker (outbox → SSE)
- Poll outbox; mark PROCESSING; emit fake completion events via SSE; mark COMPLETED.
- Event includes event, correlationId, success, payload.

### Phase 9 — Security shells
- Require Authorization header (stub).
- Support Idempotency-Key on version create + commands; dedupe for 24h.
- Accept and log Correlation-Id.

### Phase 10 — OpenAPI draft
- Document all endpoints; include security headers and example bodies.
- Include /events/stream as SSE.

### Phase 11 — e2e smoke tests
- Create script → create version → publish → read activeVersion.
- Start run → upsert vars → finish.
- Post command → outbox PENDING → dev worker emits SSE → client receives.

### Guardrails
- Tenant-aware via x-tenant-id header (thread through).
- No workflow. No broad refactors.
- Small PRs; keep changes isolated per phase.

---

## Phase 1 — Data model (Prisma): scripts, versions, audit, runs/vars

Prompt for Cursor

Task: Add script authoring + runtime models to Prisma.
File: libs/schema-engine/prisma/schema.prisma

1. Add enums:

```prisma
enum ScriptStatus { DRAFT PUBLISHED ARCHIVED }
enum ChangeAction { CREATE UPDATE PUBLISH ARCHIVE ROLLBACK }
```

2. Add models:

```prisma
model Script {
  id            String   @id @default(cuid())
  tenantId      String
  name          String
  slug          String
  description   String?
  status        ScriptStatus @default(DRAFT)
  activeVersionId String?
  latestVersion Int      @default(0)
  // AI routing/meta
  labels        String[] @default([])
  intents       String[] @default([])
  languageCodes String[] @default([])
  embeddingKey  String?
  createdById   String
  updatedById   String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  versions      ScriptVersion[]
  auditLogs     ScriptAuditLog[]
  @@unique([tenantId, slug])
  @@index([tenantId, status])
}

model ScriptVersion {
  id            String   @id @default(cuid())
  scriptId      String
  version       Int
  graphJson     Json
  variablesDef  Json?
  changelog     String?
  isPublished   Boolean  @default(false)
  createdById   String
  createdAt     DateTime @default(now())
  script        Script   @relation(fields: [scriptId], references: [id])
  @@unique([scriptId, version])
  @@index([scriptId, isPublished])
}

model ScriptAuditLog {
  id        String   @id @default(cuid())
  tenantId  String
  scriptId  String
  version   Int
  actorId   String
  action    ChangeAction
  diffJson  Json?
  note      String?
  createdAt DateTime @default(now())
  script    Script   @relation(fields: [scriptId], references: [id])
  @@index([tenantId, scriptId, createdAt])
}

model ScriptRun {
  id           String   @id @default(cuid())
  tenantId     String
  scriptId     String
  version      Int
  startedById  String?
  connectorType String?
  connectorKey  String?
  status       String   @default("RUNNING") // RUNNING|SUCCEEDED|FAILED|CANCELLED
  startedAt    DateTime @default(now())
  endedAt      DateTime?
  script       Script   @relation(fields: [scriptId], references: [id])
  vars         RunVariable[]
  @@index([tenantId, scriptId, startedAt])
  @@index([status])
}

model RunVariable {
  id      String  @id @default(cuid())
  runId   String
  key     String
  strVal  String?
  numVal  Float?
  boolVal Boolean?
  jsonVal Json?
  run     ScriptRun @relation(fields: [runId], references: [id])
  @@index([runId, key])
}
```

3. Generate Prisma client and create a migration named scripts_core_init.
Do not add workflow-related models.

---

## Phase 2 — Scripts API (create/list/get/update status)

Prompt for Cursor

Task: Add NestJS Scripts module/service/controller.
Endpoints:
- POST /scripts (body: tenantId, name, slug, description?, labels[], intents[], languageCodes[]) → creates Script with status=DRAFT, latestVersion=0.
- GET /scripts?tenantId=&q=&status= → search by tenant; filter q on name/slug; status optional.
- GET /scripts/:id → return Script and activeVersion (if any).
- PATCH /scripts/:id → update metadata and/or status; when setting status=PUBLISHED/ARCHIVED do not create versions yet.
Validation: class-validator DTOs. Return consistent error shapes. Auth guard stub OK (we’ll wire real auth later).

---

## Phase 3 — Versions API (create/publish/list/get)

Prompt for Cursor

Task: Add ScriptVersions endpoints.
- POST /scripts/:id/versions (body: graphJson, variablesDef?, changelog?)
- Auto-increment version = script.latestVersion + 1, persist, update script.latestVersion.
- POST /scripts/:id/versions/:version/publish
- Set isPublished = true, update script.activeVersionId to this version’s id.
- GET /scripts/:id/versions → list versions (id, version, isPublished, createdAt, changelog).
- GET /scripts/:id/versions/:version → return a specific version with graphJson and variablesDef.
Add basic size limits (e.g., 2–5 MB body) and reject if too large.

---

## Phase 4 — Audit logging hooks

Prompt for Cursor

Task: Add audit log inserts for script/version changes.
On each of: POST /scripts, PATCH /scripts/:id, POST /scripts/:id/versions, POST /scripts/:id/versions/:version/publish
- Insert ScriptAuditLog with: tenantId, scriptId, version (new/current), actorId (stub), action (CREATE/UPDATE/PUBLISH), optional diffJson (changed fields), optional note from request.
Endpoint: GET /scripts/:id/audit (paginated).

---

## Phase 5 — Runs & variables endpoints (for the future runner)

Prompt for Cursor

Task: Add ScriptRuns endpoints (simple).
- POST /runs → body: { tenantId, scriptId, version, startedById?, connectorType?, connectorKey? } → returns { runId }.
- POST /runs/:runId/vars → body: [{ key, strVal? | numVal? | boolVal? | jsonVal? }] (upsert by key).
- POST /runs/:runId/finish → body: { status } (SUCCEEDED/FAILED/CANCELLED) sets endedAt.
- GET /runs?tenantId=&scriptId=&status=&from=&to= → list; GET /runs/:runId → details (+ vars).
Validation, pagination, and errors per our existing style.

---

## Phase 6 — Command endpoint (generic “Action” surface)

Prompt for Cursor

Task: Add a generic commands endpoint (no bus yet).
- POST /commands
Body:

```json
{
  "command": "Contacts.UpsertAndLink.v1",
  "correlationId": "uuid",
  "actor": { "userId": "u_123" },
  "context": { "projectId": "prj_001" },
  "payload": {}
}
```

- For now: validate and persist the envelope to a commands_outbox table (Prisma model), status=PENDING.
- Return 202 Accepted with the same correlationId.
- Create the Prisma model CommandOutbox { id, command, correlationId, actorJson, contextJson, payloadJson, status, createdAt }.
No queue/bus integration yet.

---

## Phase 7 — SSE events stream (frontend listener)

Prompt for Cursor

Task: Add SSE endpoint for frontend to receive events later.
- GET /events/stream → keeps connection open, sets correct SSE headers.
- Implement a minimal in-memory EventHub that can publish(eventName, data) and emits to connected clients filtered by tenantId and/or correlationId if query params are provided.
- Add a quick health ping event every 30s to keep streams alive (configurable).
(We’ll wire the outbox → events later.)

---

## Phase 8 — Connect outbox to events (dev-mode)

Prompt for Cursor

Task: Add a dev-mode worker that polls CommandOutbox every N seconds and:
- Marks a row as PROCESSING → emits a fake completed event after 1–2s via EventHub.publish using the same correlationId.
- Marks row as COMPLETED.
- Event shape:

```json
{
  "event":"Contacts.Upserted.v1",
  "correlationId":"uuid",
  "success":true,
  "payload":{ "contacts":[{"role":"applicant","contactId":"cnt_1"}] }
}
```

This is only to allow frontend await logic to be exercised; no real integrations yet.

---

## Phase 9 — Security shells (headers, idempotency)

Prompt for Cursor

Task: Add middleware guards (without full auth yet):
- Require Authorization header on all routes (accept placeholder token).
- Support Idempotency-Key header on POST /scripts/:id/versions and POST /commands. Maintain a small table to ignore duplicate keys in the last 24h.
- Add Correlation-Id header support (if present, log with request).

---

## Phase 10 — OpenAPI draft (for Gemini later)

Prompt for Cursor

Task: Generate OpenAPI (no codegen yet) documenting:
- /scripts, /scripts/:id, /scripts/:id/versions, /scripts/:id/versions/:version/publish, /scripts/:id/audit
- /runs, /runs/:runId/vars, /runs/:runId/finish
- /commands
- /events/stream (as text/event-stream)
Include security headers (Authorization, Idempotency-Key, Correlation-Id) and example bodies.
Do not implement clients; we’ll let Gemini use this later.

---

## Phase 11 — Minimal e2e smoke tests

Prompt for Cursor

Task: Add e2e smoke tests to validate the surface:
- Create script → create version (graphJson {nodes:[],edges:[]}) → publish → check GET /scripts/:id returns activeVersionId.
- Start run → upsert vars → finish.
- Post command → confirm outbox row PENDING → dev worker emits SSE event → client receives matching correlationId.

---

### Notes / guardrails (optional)
- Keep workflow out of this phase entirely.
- All endpoints should be tenant-aware by parameter or header (you can accept x-tenant-id header now and thread it through).
- No heavy refactors; new modules only.
- Use DTOs + class-validator; consistent error format { code, message, details? }.
- Keep PRs under ~300 lines where possible; split by phase.


