# Seed Version Tracking

## Overview

The `SeedVersion` table provides operations teams with visibility into seed script execution history, configuration, and outcomes.

## Schema

```prisma
model SeedVersionHistory {
  id          Int      @id @default(1) // Single row for global seed tracking
  version     String   // Semantic version of the seed script
  lastRunAt   DateTime @default(now())
  environment String   // 'development', 'staging', 'production'
  config      Json?    // Store the configuration used for this seed run
  summary     Json?    // Store summary of what was created/updated

  @@map("seed_version_history") // Use snake_case for table name
}
```

## Features

### **1. Version Tracking**
- ✅ **Semantic versioning** - Track seed script versions
- ✅ **Last run timestamp** - Know when seed was last executed
- ✅ **Environment detection** - Automatic dev/staging/prod identification

### **2. Configuration Storage**
- ✅ **Environment variables** - Store all configuration used
- ✅ **Tenant customization** - Track custom tenant/user names
- ✅ **Feature flags** - Record probe users and audit logs settings

### **3. Execution Summary**
- ✅ **Created entities count** - Track what was created/updated
- ✅ **Feature enablement** - Record which features were enabled
- ✅ **Idempotent tracking** - Safe to run multiple times

## Usage

### **Database Query**
```sql
-- Check last seed run
SELECT * FROM "seed_version_history" WHERE id = 1;

-- Check seed history (if you add more rows in future)
SELECT "version", "lastRunAt", "environment", "config", "summary" 
FROM "seed_version_history" 
ORDER BY "lastRunAt" DESC;
```

### **Prisma Query**
```typescript
// Get current seed version info
const seedInfo = await prisma.seedVersion.findUnique({
  where: { id: 1 }
});

// Check if seed has been run
const hasBeenSeeded = await prisma.seedVersion.count() > 0;
```

## Example Output

### **Development Environment**
```json
{
  "id": 1,
  "version": "1.0.0",
  "lastRunAt": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "config": {
    "enableDemoProbeUsers": true,
    "enableAuditLogs": true,
    "tenantName": "Dev Corp",
    "adminEmail": "admin@dev.com",
    "serviceEmail": "service@dev.com",
    "salesEmail": "sales@dev.com",
    "probeEmail": "probe@dev.com",
    "probeTenantName": "DEV-PROBE-TENANT"
  },
  "summary": {
    "tenantsCreated": 1,
    "usersCreated": 3,
    "licensesCreated": 2,
    "licenseAssignmentsCreated": 2,
    "customersCreated": 2,
    "contactsCreated": 2,
    "auditLogsCreated": 2,
    "probeUsersEnabled": true
  }
}
```

### **Production Environment**
```json
{
  "id": 1,
  "version": "1.0.0",
  "lastRunAt": "2024-01-15T14:00:00.000Z",
  "environment": "production",
  "config": {
    "enableDemoProbeUsers": false,
    "enableAuditLogs": true,
    "tenantName": "Production Corp",
    "adminEmail": "admin@production.com",
    "serviceEmail": "service@production.com",
    "salesEmail": "sales@production.com",
    "probeEmail": "probe@production.com",
    "probeTenantName": "SYSTEM-PROBE-TENANT"
  },
  "summary": {
    "tenantsCreated": 1,
    "usersCreated": 2,
    "licensesCreated": 2,
    "licenseAssignmentsCreated": 2,
    "customersCreated": 2,
    "contactsCreated": 2,
    "auditLogsCreated": 2,
    "probeUsersEnabled": false
  }
}
```

## Operations Benefits

### **1. Deployment Verification**
```bash
# Check if seed ran successfully
psql -d your_database -c "SELECT \"version\", \"lastRunAt\", \"environment\" FROM \"seed_version_history\" WHERE id = 1;"
```

### **2. Configuration Audit**
```bash
# Verify what configuration was used
psql -d your_database -c "SELECT \"config\" FROM \"seed_version_history\" WHERE id = 1;"
```

### **3. Troubleshooting**
```bash
# Check if probe users were enabled in production (should be false)
psql -d your_database -c "SELECT \"config\"->>'enableDemoProbeUsers' as probe_users_enabled FROM \"seed_version_history\" WHERE id = 1;"
```

## Migration

### **1. Generate Migration**
```bash
npx prisma migrate dev --name add_seed_version_tracking
```

### **2. Apply Migration**
```bash
npx prisma migrate deploy
```

### **3. Regenerate Client**
```bash
npx prisma generate
```

## Seed Script Integration

The seed script automatically tracks:

### **Configuration Tracking**
- Environment variables used
- Feature flags enabled/disabled
- Custom tenant and user names
- Timezone settings

### **Execution Summary**
- Number of entities created
- Which features were enabled
- Environment detection
- UTC timestamp of execution

### **Console Output**
```
✅ Seed version tracked: 1.0.0

📊 Seed Version Info:
- Version: 1.0.0
- Environment: development
- Last Run: 2024-01-15T10:30:00.000Z
```

## Best Practices

### **1. Version Management**
- ✅ **Increment version** when seed script changes
- ✅ **Semantic versioning** - MAJOR.MINOR.PATCH
- ✅ **Document changes** in version history

### **2. Configuration Validation**
- ✅ **Verify environment** - Ensure correct environment detected
- ✅ **Check feature flags** - Confirm probe users disabled in production
- ✅ **Validate timestamps** - Ensure UTC timezone used

### **3. Operations Monitoring**
- ✅ **Regular checks** - Monitor seed execution frequency
- ✅ **Configuration audits** - Verify correct settings used
- ✅ **Troubleshooting aid** - Use for debugging seed issues

## Future Enhancements

### **1. Multiple Version Tracking**
```prisma
// Future: Track multiple seed runs
model SeedVersion {
  id          Int      @id @default(autoincrement())
  version     String
  lastRunAt   DateTime @default(now())
  environment String
  config      Json?
  summary     Json?
  
  @@index([environment, lastRunAt])
}
```

### **2. Rollback Tracking**
```json
{
  "summary": {
    "entitiesCreated": 10,
    "entitiesUpdated": 5,
    "entitiesDeleted": 0,
    "rollbackAvailable": true
  }
}
```

### **3. Performance Metrics**
```json
{
  "summary": {
    "executionTimeMs": 1250,
    "databaseQueries": 15,
    "memoryUsageMB": 45
  }
}
```

## Conclusion

The `SeedVersion` table provides essential visibility for operations teams, enabling:

- ✅ **Deployment verification** - Confirm seed execution
- ✅ **Configuration auditing** - Track settings used
- ✅ **Troubleshooting** - Debug seed-related issues
- ✅ **Compliance** - Audit trail for data seeding
- ✅ **Monitoring** - Track seed execution patterns

**Status:** ✅ **Ready for implementation** - Add migration and regenerate Prisma client.
