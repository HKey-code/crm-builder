-- Scripts v2 tenant-safety hardening (idempotent)
-- - Adds FK scripts."Script"(tenantId) -> core/public."Tenant"(id)
-- - Adds per-tenant unique keys on Script
-- - Adds tenantId to ScriptVersion; backfills; adds composite FK (tenantId, scriptId)
-- - Adds composite FKs for ScriptRun and ScriptAuditLog
-- - Enables RLS and a default tenant policy using app.current_tenant

BEGIN;

-- 1) scripts."Script" -> Tenant FK (detect core vs public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='scripts' AND constraint_name='Script_tenant_fk'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='core' AND table_name='Tenant') THEN
      EXECUTE 'ALTER TABLE scripts."Script" ADD CONSTRAINT "Script_tenant_fk" FOREIGN KEY ("tenantId") REFERENCES core."Tenant"(id);';
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='Tenant') THEN
      EXECUTE 'ALTER TABLE scripts."Script" ADD CONSTRAINT "Script_tenant_fk" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id);';
    END IF;
  END IF;
END $$;

-- Per-tenant uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "Script_tenant_id_unq"   ON scripts."Script"("tenantId","id");
CREATE UNIQUE INDEX IF NOT EXISTS "Script_tenant_name_unq" ON scripts."Script"("tenantId","name");

-- 2) ScriptVersion: add tenantId, backfill, enforce composite FK
ALTER TABLE scripts."ScriptVersion" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
UPDATE scripts."ScriptVersion" v
SET "tenantId" = s."tenantId"
FROM scripts."Script" s
WHERE v."scriptId" = s."id" AND v."tenantId" IS NULL;
ALTER TABLE scripts."ScriptVersion" ALTER COLUMN "tenantId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='scripts' AND constraint_name='ScriptVersion_script_composite_fk'
  ) THEN
    EXECUTE 'ALTER TABLE scripts."ScriptVersion"
             ADD CONSTRAINT "ScriptVersion_script_composite_fk"
             FOREIGN KEY ("tenantId","scriptId")
             REFERENCES scripts."Script"("tenantId","id")
             ON UPDATE CASCADE ON DELETE RESTRICT;';
  END IF;
END $$;

-- 3) ScriptRun: composite FK (tenantId, scriptId)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='scripts' AND constraint_name='ScriptRun_script_composite_fk'
  ) THEN
    EXECUTE 'ALTER TABLE scripts."ScriptRun"
             ADD CONSTRAINT "ScriptRun_script_composite_fk"
             FOREIGN KEY ("tenantId","scriptId")
             REFERENCES scripts."Script"("tenantId","id")
             ON UPDATE CASCADE ON DELETE RESTRICT;';
  END IF;
END $$;

-- 4) ScriptAuditLog: composite FK (tenantId, scriptId)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='scripts' AND constraint_name='ScriptAuditLog_script_composite_fk'
  ) THEN
    EXECUTE 'ALTER TABLE scripts."ScriptAuditLog"
             ADD CONSTRAINT "ScriptAuditLog_script_composite_fk"
             FOREIGN KEY ("tenantId","scriptId")
             REFERENCES scripts."Script"("tenantId","id")
             ON UPDATE CASCADE ON DELETE RESTRICT;';
  END IF;
END $$;

-- 5) RLS enable + tenant policy
ALTER TABLE scripts."Script"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts."ScriptVersion"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts."ScriptRun"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts."ScriptAuditLog"   ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS tenant_isolation_script
  ON scripts."Script" USING ("tenantId" = current_setting('app.current_tenant', true));

CREATE POLICY IF NOT EXISTS tenant_isolation_version
  ON scripts."ScriptVersion" USING ("tenantId" = current_setting('app.current_tenant', true));

CREATE POLICY IF NOT EXISTS tenant_isolation_run
  ON scripts."ScriptRun" USING ("tenantId" = current_setting('app.current_tenant', true));

CREATE POLICY IF NOT EXISTS tenant_isolation_audit
  ON scripts."ScriptAuditLog" USING ("tenantId" = current_setting('app.current_tenant', true));

COMMIT;


