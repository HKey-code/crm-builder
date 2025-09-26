-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "catalog";

-- CreateEnum
CREATE TYPE "catalog"."PartyType" AS ENUM ('PERSON', 'ORG');

-- CreateEnum
CREATE TYPE "catalog"."AddressUsage" AS ENUM ('HOME', 'WORK', 'MAILING', 'BILLING');

-- AlterTable
ALTER TABLE "sales"."Opportunity" ADD COLUMN     "partyId" TEXT;

-- AlterTable
ALTER TABLE "service"."Case" ADD COLUMN     "partyId" TEXT;

-- CreateTable
CREATE TABLE "catalog"."Party" (
    "id" TEXT NOT NULL,
    "type" "catalog"."PartyType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."Person" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."Organization" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "orgKind" TEXT,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."Address" (
    "id" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postal" TEXT,
    "country" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."PartyAddress" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "usage" "catalog"."AddressUsage" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "PartyAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."PartyIdentity" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PartyIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."PartySourceRecord" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "matchScore" DOUBLE PRECISION,
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartySourceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog"."PartyMerge" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "intoId" TEXT NOT NULL,
    "reason" TEXT,
    "mergedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartyMerge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_partyId_key" ON "catalog"."Person"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_partyId_key" ON "catalog"."Organization"("partyId");

-- CreateIndex
CREATE INDEX "PartyAddress_partyId_idx" ON "catalog"."PartyAddress"("partyId");

-- CreateIndex
CREATE INDEX "PartyAddress_addressId_idx" ON "catalog"."PartyAddress"("addressId");

-- CreateIndex
CREATE INDEX "PartyIdentity_partyId_idx" ON "catalog"."PartyIdentity"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "PartyIdentity_system_value_key" ON "catalog"."PartyIdentity"("system", "value");

-- CreateIndex
CREATE INDEX "PartySourceRecord_partyId_source_idx" ON "catalog"."PartySourceRecord"("partyId", "source");

-- CreateIndex
CREATE INDEX "PartyMerge_intoId_idx" ON "catalog"."PartyMerge"("intoId");

-- AddForeignKey
ALTER TABLE "sales"."Opportunity" ADD CONSTRAINT "Opportunity_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "catalog"."Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service"."Case" ADD CONSTRAINT "Case_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "catalog"."Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."Person" ADD CONSTRAINT "Person_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "catalog"."Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."Organization" ADD CONSTRAINT "Organization_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "catalog"."Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."PartyAddress" ADD CONSTRAINT "PartyAddress_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "catalog"."Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."PartyAddress" ADD CONSTRAINT "PartyAddress_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "catalog"."Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."PartyIdentity" ADD CONSTRAINT "PartyIdentity_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "catalog"."Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."PartySourceRecord" ADD CONSTRAINT "PartySourceRecord_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "catalog"."Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."PartyMerge" ADD CONSTRAINT "PartyMerge_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "catalog"."Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog"."PartyMerge" ADD CONSTRAINT "PartyMerge_intoId_fkey" FOREIGN KEY ("intoId") REFERENCES "catalog"."Party"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
