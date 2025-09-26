/*
  Warnings:

  - You are about to drop the column `assignedTo` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `partyId` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `resolvedAt` on the `Case` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `Case` table. All the data in the column will be lost.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "permits";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public_health";

-- CreateEnum
CREATE TYPE "service"."CaseType" AS ENUM ('GENERIC', 'PERMIT', 'NEWBORN', 'DMV', 'OTHER');

-- CreateEnum
CREATE TYPE "permits"."InspectionStatus" AS ENUM ('SCHEDULED', 'PASSED', 'FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "service"."Case" DROP CONSTRAINT "Case_contactId_fkey";

-- DropForeignKey
ALTER TABLE "service"."Case" DROP CONSTRAINT "Case_partyId_fkey";

-- AlterTable
ALTER TABLE "service"."Case" DROP COLUMN "assignedTo",
DROP COLUMN "description",
DROP COLUMN "partyId",
DROP COLUMN "resolvedAt",
DROP COLUMN "subject",
ADD COLUMN     "assignedToUserId" TEXT,
ADD COLUMN     "caseType" "service"."CaseType" NOT NULL DEFAULT 'GENERIC',
ADD COLUMN     "channel" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "details" JSONB,
ADD COLUMN     "jurisdiction" TEXT,
ADD COLUMN     "openedByUserId" TEXT,
ADD COLUMN     "subjectPartyId" TEXT,
ALTER COLUMN "contactId" DROP NOT NULL,
ALTER COLUMN "priority" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'open';

-- CreateTable
CREATE TABLE "service"."CaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service"."CaseAttachment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permits"."PermitType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PermitType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permits"."PermitCaseExt" (
    "caseId" TEXT NOT NULL,
    "permitTypeId" TEXT NOT NULL,
    "siteAddressId" TEXT,
    "valuation" DECIMAL(12,2),
    "notes" TEXT,

    CONSTRAINT "PermitCaseExt_pkey" PRIMARY KEY ("caseId")
);

-- CreateTable
CREATE TABLE "permits"."Inspection" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "inspectorUserId" TEXT,
    "status" "permits"."InspectionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permits"."Fee" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unpaid',

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permits"."Payment" (
    "id" TEXT NOT NULL,
    "feeId" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_createdAt_idx" ON "service"."CaseEvent"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "CaseAttachment_caseId_idx" ON "service"."CaseAttachment"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "PermitType_code_key" ON "permits"."PermitType"("code");

-- CreateIndex
CREATE INDEX "Inspection_caseId_status_idx" ON "permits"."Inspection"("caseId", "status");

-- CreateIndex
CREATE INDEX "Fee_caseId_status_idx" ON "permits"."Fee"("caseId", "status");

-- CreateIndex
CREATE INDEX "Payment_feeId_paidAt_idx" ON "permits"."Payment"("feeId", "paidAt");

-- CreateIndex
CREATE INDEX "Case_tenantId_caseType_status_idx" ON "service"."Case"("tenantId", "caseType", "status");

-- CreateIndex
CREATE INDEX "Case_subjectPartyId_idx" ON "service"."Case"("subjectPartyId");

-- AddForeignKey
ALTER TABLE "service"."Case" ADD CONSTRAINT "Case_subjectPartyId_fkey" FOREIGN KEY ("subjectPartyId") REFERENCES "catalog"."Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service"."Case" ADD CONSTRAINT "Case_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "core"."Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service"."CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "service"."Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service"."CaseAttachment" ADD CONSTRAINT "CaseAttachment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "service"."Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permits"."PermitCaseExt" ADD CONSTRAINT "PermitCaseExt_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "service"."Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permits"."PermitCaseExt" ADD CONSTRAINT "PermitCaseExt_permitTypeId_fkey" FOREIGN KEY ("permitTypeId") REFERENCES "permits"."PermitType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permits"."Inspection" ADD CONSTRAINT "Inspection_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "permits"."PermitCaseExt"("caseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permits"."Fee" ADD CONSTRAINT "Fee_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "permits"."PermitCaseExt"("caseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permits"."Payment" ADD CONSTRAINT "Payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "permits"."Fee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
