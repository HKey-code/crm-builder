-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "guidance";

-- CreateEnum
CREATE TYPE "guidance"."ScriptNodeType" AS ENUM ('INFO', 'QUESTION', 'DECISION', 'ACTION', 'END');

-- CreateTable
CREATE TABLE "guidance"."Script" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "latestVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guidance"."ScriptVersion" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "entryNodeId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "ScriptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guidance"."ScriptNode" (
    "id" TEXT NOT NULL,
    "scriptVersionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "guidance"."ScriptNodeType" NOT NULL,
    "title" TEXT,
    "prompt" TEXT,
    "uiSchema" JSONB,
    "config" JSONB,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ScriptNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guidance"."ScriptEdge" (
    "id" TEXT NOT NULL,
    "scriptVersionId" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "condition" JSONB,

    CONSTRAINT "ScriptEdge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guidance"."ScriptVariable" (
    "id" TEXT NOT NULL,
    "scriptVersionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enumValues" TEXT[],
    "defaultVal" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScriptVariable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guidance"."ScriptRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "scriptId" TEXT NOT NULL,
    "scriptVersion" INTEGER NOT NULL,
    "subjectSchema" TEXT,
    "subjectModel" TEXT,
    "subjectId" TEXT,
    "startedByUserId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "state" JSONB,

    CONSTRAINT "ScriptRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guidance"."ScriptAnswer" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "nodeKey" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScriptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Script_tenantId_idx" ON "guidance"."Script"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Script_tenantId_key_key" ON "guidance"."Script"("tenantId", "key");

-- CreateIndex
CREATE INDEX "ScriptVersion_status_idx" ON "guidance"."ScriptVersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ScriptVersion_scriptId_version_key" ON "guidance"."ScriptVersion"("scriptId", "version");

-- CreateIndex
CREATE INDEX "ScriptNode_scriptVersionId_orderIndex_idx" ON "guidance"."ScriptNode"("scriptVersionId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ScriptNode_scriptVersionId_key_key" ON "guidance"."ScriptNode"("scriptVersionId", "key");

-- CreateIndex
CREATE INDEX "ScriptEdge_scriptVersionId_idx" ON "guidance"."ScriptEdge"("scriptVersionId");

-- CreateIndex
CREATE INDEX "ScriptEdge_fromNodeId_idx" ON "guidance"."ScriptEdge"("fromNodeId");

-- CreateIndex
CREATE INDEX "ScriptEdge_toNodeId_idx" ON "guidance"."ScriptEdge"("toNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "ScriptVariable_scriptVersionId_key_key" ON "guidance"."ScriptVariable"("scriptVersionId", "key");

-- CreateIndex
CREATE INDEX "ScriptRun_tenantId_scriptId_scriptVersion_idx" ON "guidance"."ScriptRun"("tenantId", "scriptId", "scriptVersion");

-- CreateIndex
CREATE INDEX "ScriptRun_subjectSchema_subjectModel_subjectId_idx" ON "guidance"."ScriptRun"("subjectSchema", "subjectModel", "subjectId");

-- CreateIndex
CREATE INDEX "ScriptAnswer_runId_answeredAt_idx" ON "guidance"."ScriptAnswer"("runId", "answeredAt");

-- AddForeignKey
ALTER TABLE "guidance"."ScriptVersion" ADD CONSTRAINT "ScriptVersion_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "guidance"."Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guidance"."ScriptNode" ADD CONSTRAINT "ScriptNode_scriptVersionId_fkey" FOREIGN KEY ("scriptVersionId") REFERENCES "guidance"."ScriptVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guidance"."ScriptEdge" ADD CONSTRAINT "ScriptEdge_scriptVersionId_fkey" FOREIGN KEY ("scriptVersionId") REFERENCES "guidance"."ScriptVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guidance"."ScriptEdge" ADD CONSTRAINT "ScriptEdge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "guidance"."ScriptNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guidance"."ScriptEdge" ADD CONSTRAINT "ScriptEdge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "guidance"."ScriptNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guidance"."ScriptVariable" ADD CONSTRAINT "ScriptVariable_scriptVersionId_fkey" FOREIGN KEY ("scriptVersionId") REFERENCES "guidance"."ScriptVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guidance"."ScriptAnswer" ADD CONSTRAINT "ScriptAnswer_runId_fkey" FOREIGN KEY ("runId") REFERENCES "guidance"."ScriptRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
