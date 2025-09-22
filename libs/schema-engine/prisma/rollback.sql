-- Rollback script for CRM license system
-- Run this if you need to revert the schema changes

-- Drop new tables in reverse dependency order
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "StyleTemplate" CASCADE;
DROP TABLE IF EXISTS "MenuItem" CASCADE;
DROP TABLE IF EXISTS "Menu" CASCADE;
DROP TABLE IF EXISTS "UIConfig" CASCADE;
DROP TABLE IF EXISTS "RolePermissionSet" CASCADE;
DROP TABLE IF EXISTS "PermissionSet" CASCADE;
DROP TABLE IF EXISTS "UserTenantLicense" CASCADE;
DROP TABLE IF EXISTS "TenantLicense" CASCADE;

-- Drop new enums
DROP TYPE IF EXISTS "LicenseType" CASCADE;
DROP TYPE IF EXISTS "UserType" CASCADE;
DROP TYPE IF EXISTS "UserStatus" CASCADE;
DROP TYPE IF EXISTS "SeatStatus" CASCADE;

-- Remove new columns from existing tables
ALTER TABLE "User" DROP COLUMN IF EXISTS "isSystemUser";
ALTER TABLE "User" DROP COLUMN IF EXISTS "userType";
ALTER TABLE "User" DROP COLUMN IF EXISTS "status";
ALTER TABLE "User" DROP COLUMN IF EXISTS "updatedAt";

ALTER TABLE "Role" DROP COLUMN IF EXISTS "isGlobal";
ALTER TABLE "Role" DROP COLUMN IF EXISTS "updatedAt";

ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "updatedAt";

-- Remove unique constraints
ALTER TABLE "Tenant" DROP CONSTRAINT IF EXISTS "Tenant_name_key";

-- Note: This rollback script removes all license-related functionality
-- Make sure to backup any important data before running this
