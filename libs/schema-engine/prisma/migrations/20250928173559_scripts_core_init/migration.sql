-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "scripts";

-- CreateEnum
CREATE TYPE "scripts"."ScriptStatus" AS ENUM (DRAFT, PUBLISHED, ARCHIVED);

-- CreateEnum
CREATE TYPE "scripts"."ChangeAction" AS ENUM (CREATE, UPDATE, PUBLISH, ARCHIVE, ROLLBACK);

-- CreateTable
CREATE TABLE "scripts"."AuthorScript" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "scripts"."ScriptStatus" NOT NULL DEFAULT DRAFT,
    "activeVersionId" TEXT,
    "latestVersion" INTEGER NOT NULL DEFAULT 0,
    "labels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "intents" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "languageCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "embeddingKey" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorScript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripts"."AuthorScriptVersion" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "graphJson" JSONB NOT NULL,
    "variablesDef" JSONB,
    "changelog" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorScriptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripts"."AuthorScriptAuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "scripts"."ChangeAction" NOT NULL,
    "diffJson" JSONB,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthorScriptAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripts"."AuthorScriptRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "startedById" TEXT,
    "connectorType" TEXT,
    "connectorKey" TEXT,
    "status" TEXT NOT NULL DEFAULT RUNNING,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AuthorScriptRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripts"."RunVariable" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "strVal" TEXT,
    "numVal" DOUBLE PRECISION,
    "boolVal" BOOLEAN,
    "jsonVal" JSONB,

    CONSTRAINT "RunVariable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthorScript_tenantId_slug_key" ON "scripts"."AuthorScript"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "AuthorScript_tenantId_status_idx" ON "scripts"."AuthorScript"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorScriptVersion_scriptId_version_key" ON "scripts"."AuthorScriptVersion"("scriptId", "version");

-- CreateIndex
CREATE INDEX "AuthorScriptVersion_scriptId_isPublished_idx" ON "scripts"."AuthorScriptVersion"("scriptId", "isPublished");

-- CreateIndex
CREATE INDEX "AuthorScriptAuditLog_tenantId_scriptId_createdAt_idx" ON "scripts"."AuthorScriptAuditLog"("tenantId", "scriptId", "createdAt");

-- CreateIndex
CREATE INDEX "AuthorScriptRun_tenantId_scriptId_startedAt_idx" ON "scripts"."AuthorScriptRun"("tenantId", "scriptId", "startedAt");

-- CreateIndex
CREATE INDEX "AuthorScriptRun_status_idx" ON "scripts"."AuthorScriptRun"("status");

-- CreateIndex
CREATE INDEX "RunVariable_runId_key_idx" ON "scripts"."RunVariable"("runId", "key");

-- AddForeignKey
ALTER TABLE "scripts"."AuthorScriptVersion" ADD CONSTRAINT "AuthorScriptVersion_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "scripts"."AuthorScript"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scripts"."AuthorScriptAuditLog" ADD CONSTRAINT "AuthorScriptAuditLog_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "scripts"."AuthorScript"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scripts"."AuthorScriptRun" ADD CONSTRAINT "AuthorScriptRun_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "scripts"."AuthorScript"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scripts"."RunVariable" ADD CONSTRAINT "RunVariable_runId_fkey" FOREIGN KEY ("runId") REFERENCES "scripts"."AuthorScriptRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
