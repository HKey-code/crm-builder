-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "automation";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "security";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "training";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "workflow";

-- CreateEnum
CREATE TYPE "automation"."JobType" AS ENUM ('SCHEDULED', 'WEBHOOK', 'ETL', 'INDEXER');

-- CreateEnum
CREATE TYPE "security"."DataClass" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'PHI', 'PII');

-- CreateTable
CREATE TABLE "workflow"."Workflow" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."WorkflowState" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "WorkflowState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."WorkflowTransition" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "fromStateKey" TEXT NOT NULL,
    "toStateKey" TEXT NOT NULL,
    "guard" JSONB,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."WorkflowInstance" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "tenantId" TEXT,
    "subjectSchema" TEXT NOT NULL,
    "subjectModel" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "stateKey" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."WorkflowTask" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "assigneeUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."SLA" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetMs" INTEGER NOT NULL,
    "rule" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SLA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."SLABreach" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "slaId" TEXT NOT NULL,
    "breachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" JSONB,

    CONSTRAINT "SLABreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation"."Job" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" "automation"."JobType" NOT NULL,
    "key" TEXT NOT NULL,
    "schedule" TEXT,
    "config" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation"."JobRun" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "details" JSONB,

    CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation"."WebhookSubscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "eventKey" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training"."PromptTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training"."PromptVersion" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training"."FineTuneDataset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "storageUri" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FineTuneDataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training"."EvalSet" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvalSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training"."EvalRun" (
    "id" TEXT NOT NULL,
    "evalSetId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "metrics" JSONB,

    CONSTRAINT "EvalRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security"."Policy" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "class" "security"."DataClass" NOT NULL,
    "rules" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security"."PolicyTarget" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "tenantId" TEXT,
    "roleId" TEXT,
    "userId" TEXT,
    "objectType" TEXT,
    "objectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security"."DataAccessLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB,

    CONSTRAINT "DataAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowState_workflowId_key_key" ON "workflow"."WorkflowState"("workflowId", "key");

-- CreateIndex
CREATE INDEX "WorkflowTransition_workflowId_idx" ON "workflow"."WorkflowTransition"("workflowId");

-- CreateIndex
CREATE INDEX "WorkflowInstance_workflowId_subjectSchema_subjectModel_subj_idx" ON "workflow"."WorkflowInstance"("workflowId", "subjectSchema", "subjectModel", "subjectId");

-- CreateIndex
CREATE INDEX "WorkflowTask_instanceId_idx" ON "workflow"."WorkflowTask"("instanceId");

-- CreateIndex
CREATE INDEX "SLA_workflowId_idx" ON "workflow"."SLA"("workflowId");

-- CreateIndex
CREATE INDEX "SLABreach_instanceId_slaId_idx" ON "workflow"."SLABreach"("instanceId", "slaId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_tenantId_key_key" ON "automation"."Job"("tenantId", "key");

-- CreateIndex
CREATE INDEX "JobRun_jobId_startedAt_idx" ON "automation"."JobRun"("jobId", "startedAt");

-- CreateIndex
CREATE INDEX "WebhookSubscription_tenantId_eventKey_idx" ON "automation"."WebhookSubscription"("tenantId", "eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTemplate_tenantId_key_key" ON "training"."PromptTemplate"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "PromptVersion_templateId_version_key" ON "training"."PromptVersion"("templateId", "version");

-- CreateIndex
CREATE INDEX "EvalRun_evalSetId_startedAt_idx" ON "training"."EvalRun"("evalSetId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_code_key" ON "security"."Policy"("code");

-- CreateIndex
CREATE INDEX "PolicyTarget_policyId_idx" ON "security"."PolicyTarget"("policyId");

-- CreateIndex
CREATE INDEX "PolicyTarget_tenantId_roleId_userId_idx" ON "security"."PolicyTarget"("tenantId", "roleId", "userId");

-- CreateIndex
CREATE INDEX "DataAccessLog_tenantId_actorUserId_occurredAt_idx" ON "security"."DataAccessLog"("tenantId", "actorUserId", "occurredAt");

-- AddForeignKey
ALTER TABLE "workflow"."WorkflowState" ADD CONSTRAINT "WorkflowState_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"."Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"."Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."WorkflowInstance" ADD CONSTRAINT "WorkflowInstance_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"."Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."WorkflowTask" ADD CONSTRAINT "WorkflowTask_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow"."WorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow"."SLA" ADD CONSTRAINT "SLA_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"."Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation"."JobRun" ADD CONSTRAINT "JobRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "automation"."Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training"."PromptVersion" ADD CONSTRAINT "PromptVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "training"."PromptTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training"."EvalRun" ADD CONSTRAINT "EvalRun_evalSetId_fkey" FOREIGN KEY ("evalSetId") REFERENCES "training"."EvalSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security"."PolicyTarget" ADD CONSTRAINT "PolicyTarget_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "security"."Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
