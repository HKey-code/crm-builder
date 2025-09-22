-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "marketing";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ops";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "portal";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "sales";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "service";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ui";

-- CreateEnum
CREATE TYPE "core"."LicenseType" AS ENUM ('SMART_SERVICE', 'SMART_SALES', 'SMART_GRANTS');

-- CreateEnum
CREATE TYPE "core"."UserType" AS ENUM ('HUMAN', 'AI', 'SERVICE');

-- CreateEnum
CREATE TYPE "core"."UserStatus" AS ENUM ('active', 'disabled', 'pending');

-- CreateEnum
CREATE TYPE "core"."SeatStatus" AS ENUM ('active', 'expired', 'suspended');

-- CreateTable
CREATE TABLE "core"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deploymentStack" TEXT,
    "isIsolated" BOOLEAN NOT NULL DEFAULT false,
    "defaultLocale" TEXT DEFAULT 'en',
    "appVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."TenantLicense" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "licenseType" "core"."LicenseType" NOT NULL,
    "status" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "totalSeats" INTEGER,

    CONSTRAINT "TenantLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "tenantId" TEXT,
    "isSystemUser" BOOLEAN NOT NULL DEFAULT false,
    "userType" "core"."UserType" NOT NULL DEFAULT 'HUMAN',
    "status" "core"."UserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."UserTenantLicense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantLicenseId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" "core"."SeatStatus" NOT NULL DEFAULT 'active',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "assignedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "UserTenantLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."PermissionSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "PermissionSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."RolePermissionSet" (
    "roleId" TEXT NOT NULL,
    "permissionSetId" TEXT NOT NULL,

    CONSTRAINT "RolePermissionSet_pkey" PRIMARY KEY ("roleId","permissionSetId")
);

-- CreateTable
CREATE TABLE "core"."RoleAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "preferredLanguage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."Contact" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "title" TEXT,
    "department" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales"."Opportunity" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "stage" TEXT NOT NULL,
    "probability" INTEGER NOT NULL,
    "expectedCloseDate" TIMESTAMP(3),
    "actualCloseDate" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service"."Case" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing"."MarketingCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal"."PortalActivity" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "PortalActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."SLOMetric" (
    "id" TEXT NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "success" BOOLEAN NOT NULL,
    "errorCode" TEXT,
    "userId" TEXT,
    "tenantId" TEXT,
    "licenseType" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SLOMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."SLOAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metrics" JSONB,

    CONSTRAINT "SLOAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."seed_version_history" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "version" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "environment" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "summary" JSONB NOT NULL,

    CONSTRAINT "seed_version_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."Page" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "layoutId" TEXT,
    "dataSourceId" TEXT,
    "visibilityConditions" JSONB,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."Layout" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "breakpoints" JSONB NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Layout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "layoutArea" TEXT NOT NULL,
    "visibilityConditions" JSONB,
    "pageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."ComponentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inputSchema" JSONB NOT NULL,
    "defaultProps" JSONB NOT NULL,
    "allowedDataTypes" JSONB NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComponentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."ComponentInstance" (
    "id" TEXT NOT NULL,
    "componentTypeId" TEXT NOT NULL,
    "props" JSONB NOT NULL,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComponentInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."FieldDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "validationRules" JSONB,
    "defaultValue" JSONB,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."DataSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "params" JSONB,
    "authContext" JSONB,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."BindingConfig" (
    "id" TEXT NOT NULL,
    "sourceField" TEXT NOT NULL,
    "targetProp" TEXT NOT NULL,
    "transform" JSONB,
    "defaultFallback" JSONB,
    "componentInstanceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BindingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."Interaction" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetComponentId" TEXT,
    "params" JSONB,
    "conditions" JSONB,
    "componentInstanceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."PermissionRule" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "permission" TEXT NOT NULL,
    "condition" TEXT,
    "tenantId" TEXT NOT NULL,
    "pageId" TEXT,
    "sectionId" TEXT,
    "componentInstanceId" TEXT,
    "fieldDefinitionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."UIConfig" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "configJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UIConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."Menu" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."MenuItem" (
    "id" TEXT NOT NULL,
    "menuId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "pageId" TEXT NOT NULL,
    "order" INTEGER,
    "visibleIfRole" TEXT,
    "visibleIfLicense" "core"."LicenseType",

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ui"."StyleTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokens" JSONB NOT NULL,

    CONSTRAINT "StyleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ops"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."_ContactToMarketingCampaign" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ui"."_PermissionRuleToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_name_key" ON "core"."Tenant"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TenantLicense_tenantId_licenseType_key" ON "core"."TenantLicense"("tenantId", "licenseType");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "core"."User"("email");

-- CreateIndex
CREATE INDEX "UserTenantLicense_userId_status_expiresAt_idx" ON "core"."UserTenantLicense"("userId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "UserTenantLicense_tenantLicenseId_idx" ON "core"."UserTenantLicense"("tenantLicenseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTenantLicense_userId_tenantLicenseId_key" ON "core"."UserTenantLicense"("userId", "tenantLicenseId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "core"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_tenantId_key" ON "core"."Contact"("email", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseNumber_key" ON "service"."Case"("caseNumber");

-- CreateIndex
CREATE INDEX "SLOMetric_timestamp_idx" ON "core"."SLOMetric"("timestamp");

-- CreateIndex
CREATE INDEX "SLOMetric_success_timestamp_idx" ON "core"."SLOMetric"("success", "timestamp");

-- CreateIndex
CREATE INDEX "SLOMetric_errorCode_timestamp_idx" ON "core"."SLOMetric"("errorCode", "timestamp");

-- CreateIndex
CREATE INDEX "SLOAlert_timestamp_idx" ON "core"."SLOAlert"("timestamp");

-- CreateIndex
CREATE INDEX "SLOAlert_type_timestamp_idx" ON "core"."SLOAlert"("type", "timestamp");

-- CreateIndex
CREATE INDEX "SLOAlert_severity_timestamp_idx" ON "core"."SLOAlert"("severity", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_tenantId_key" ON "ui"."Page"("slug", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "BindingConfig_componentInstanceId_key" ON "ui"."BindingConfig"("componentInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "UIConfig_roleId_key" ON "ui"."UIConfig"("roleId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "ops"."AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "ops"."AuditLog"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "_ContactToMarketingCampaign_AB_unique" ON "core"."_ContactToMarketingCampaign"("A", "B");

-- CreateIndex
CREATE INDEX "_ContactToMarketingCampaign_B_index" ON "core"."_ContactToMarketingCampaign"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionRuleToRole_AB_unique" ON "ui"."_PermissionRuleToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionRuleToRole_B_index" ON "ui"."_PermissionRuleToRole"("B");

-- AddForeignKey
ALTER TABLE "core"."TenantLicense" ADD CONSTRAINT "TenantLicense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "core"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "core"."Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."UserTenantLicense" ADD CONSTRAINT "UserTenantLicense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "core"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."UserTenantLicense" ADD CONSTRAINT "UserTenantLicense_tenantLicenseId_fkey" FOREIGN KEY ("tenantLicenseId") REFERENCES "core"."TenantLicense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."UserTenantLicense" ADD CONSTRAINT "UserTenantLicense_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "core"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."RolePermissionSet" ADD CONSTRAINT "RolePermissionSet_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "core"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."RolePermissionSet" ADD CONSTRAINT "RolePermissionSet_permissionSetId_fkey" FOREIGN KEY ("permissionSetId") REFERENCES "core"."PermissionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "core"."Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "core"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."RoleAssignment" ADD CONSTRAINT "RoleAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "core"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "core"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."Contact" ADD CONSTRAINT "Contact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "core"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales"."Opportunity" ADD CONSTRAINT "Opportunity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "core"."Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service"."Case" ADD CONSTRAINT "Case_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "core"."Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal"."PortalActivity" ADD CONSTRAINT "PortalActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "core"."Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."Page" ADD CONSTRAINT "Page_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "ui"."Layout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."Page" ADD CONSTRAINT "Page_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "ui"."DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."Section" ADD CONSTRAINT "Section_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ui"."Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."ComponentInstance" ADD CONSTRAINT "ComponentInstance_componentTypeId_fkey" FOREIGN KEY ("componentTypeId") REFERENCES "ui"."ComponentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."ComponentInstance" ADD CONSTRAINT "ComponentInstance_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ui"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."BindingConfig" ADD CONSTRAINT "BindingConfig_componentInstanceId_fkey" FOREIGN KEY ("componentInstanceId") REFERENCES "ui"."ComponentInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."Interaction" ADD CONSTRAINT "Interaction_componentInstanceId_fkey" FOREIGN KEY ("componentInstanceId") REFERENCES "ui"."ComponentInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."PermissionRule" ADD CONSTRAINT "PermissionRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "core"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."PermissionRule" ADD CONSTRAINT "PermissionRule_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "ui"."Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."PermissionRule" ADD CONSTRAINT "PermissionRule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ui"."Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."PermissionRule" ADD CONSTRAINT "PermissionRule_componentInstanceId_fkey" FOREIGN KEY ("componentInstanceId") REFERENCES "ui"."ComponentInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."PermissionRule" ADD CONSTRAINT "PermissionRule_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "ui"."FieldDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."MenuItem" ADD CONSTRAINT "MenuItem_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "ui"."Menu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."_ContactToMarketingCampaign" ADD CONSTRAINT "_ContactToMarketingCampaign_A_fkey" FOREIGN KEY ("A") REFERENCES "core"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."_ContactToMarketingCampaign" ADD CONSTRAINT "_ContactToMarketingCampaign_B_fkey" FOREIGN KEY ("B") REFERENCES "marketing"."MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."_PermissionRuleToRole" ADD CONSTRAINT "_PermissionRuleToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "ui"."PermissionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ui"."_PermissionRuleToRole" ADD CONSTRAINT "_PermissionRuleToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "core"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
