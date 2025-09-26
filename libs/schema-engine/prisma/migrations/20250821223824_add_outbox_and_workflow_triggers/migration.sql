-- CreateTable
CREATE TABLE "ops"."OutboxEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "topic" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow"."WorkflowTrigger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "subjectSchema" TEXT NOT NULL,
    "subjectModel" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "condition" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "WorkflowTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboxEvent_processedAt_createdAt_idx" ON "ops"."OutboxEvent"("processedAt", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowTrigger_tenantId_subjectSchema_subjectModel_eventKe_idx" ON "workflow"."WorkflowTrigger"("tenantId", "subjectSchema", "subjectModel", "eventKey", "active");

-- AddForeignKey
ALTER TABLE "workflow"."WorkflowTrigger" ADD CONSTRAINT "WorkflowTrigger_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflow"."Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
