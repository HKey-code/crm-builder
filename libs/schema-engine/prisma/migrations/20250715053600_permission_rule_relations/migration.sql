-- CreateTable
CREATE TABLE "PermissionRule" (
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
CREATE TABLE "_PermissionRuleToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionRuleToRole_AB_unique" ON "_PermissionRuleToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionRuleToRole_B_index" ON "_PermissionRuleToRole"("B");

-- AddForeignKey
ALTER TABLE "PermissionRule" ADD CONSTRAINT "PermissionRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRule" ADD CONSTRAINT "PermissionRule_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRule" ADD CONSTRAINT "PermissionRule_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRule" ADD CONSTRAINT "PermissionRule_componentInstanceId_fkey" FOREIGN KEY ("componentInstanceId") REFERENCES "ComponentInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRule" ADD CONSTRAINT "PermissionRule_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "FieldDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionRuleToRole" ADD CONSTRAINT "_PermissionRuleToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "PermissionRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionRuleToRole" ADD CONSTRAINT "_PermissionRuleToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
