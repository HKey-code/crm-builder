# GitHub Actions Database Seeding

## Overview

The `seed-database.yml` workflow automatically seeds non-production databases with test data, providing a consistent and reliable way to populate development, staging, and QA environments.

## Features

### **1. Automated Seeding**
- ✅ **Trigger on code changes** - Automatic seeding when Prisma schema or backend code changes
- ✅ **Manual triggering** - On-demand seeding with custom parameters
- ✅ **Environment-specific** - Different configurations for dev/staging/qa
- ✅ **Production safety** - Never seeds production databases

### **2. Flexible Configuration**
- ✅ **Environment selection** - Choose dev/staging/qa
- ✅ **Feature toggles** - Enable/disable probe users and audit logs
- ✅ **Custom tenant names** - Override default tenant configuration
- ✅ **Custom admin emails** - Set specific admin user emails

### **3. Verification & Health Checks**
- ✅ **Seed completion verification** - Confirm seed version was recorded
- ✅ **Entity count validation** - Verify expected data was created
- ✅ **Environment validation** - Confirm correct environment detected
- ✅ **Configuration audit** - Log all settings used

## Setup

### **1. GitHub Secrets**

Add the following secrets to your GitHub repository:

```bash
# Development database
DATABASE_URL_DEV=postgresql://user:pass@host:5432/dev_db

# Staging database  
DATABASE_URL_STAGING=postgresql://user:pass@host:5432/staging_db

# QA database (optional)
DATABASE_URL_QA=postgresql://user:pass@host:5432/qa_db
```

**Environment Mapping:**
- **`development`** → `DATABASE_URL_DEV`
- **`qa`** → `DATABASE_URL_QA` (if provided, otherwise falls back to `DATABASE_URL_DEV`)
- **`staging`** → `DATABASE_URL_STAGING` (handled by separate `seed-staging` job)

### **2. Repository Settings**

1. Go to **Settings** → **Actions** → **General**
2. Enable **"Allow GitHub Actions to create and approve pull requests"**
3. Enable **"Read and write permissions"** for Actions

### **3. Branch Protection (Optional)**

For additional safety, protect the `main` branch:
1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Enable **"Require status checks to pass before merging"**
4. Select the seed workflow as a required check

## Usage

### **1. Automatic Triggering**

The workflow runs automatically when:
- ✅ **Push to `develop`** - Seeds development database
- ✅ **Push to `main`** - Seeds staging database (if configured)
- ✅ **Prisma schema changes** - Any changes to `libs/schema-engine/prisma/**`
- ✅ **Backend code changes** - Any changes to `apps/backend/**`

### **2. Safety Conditions**

The workflow includes safety conditions to prevent production seeding:

```yaml
if: github.event.inputs.environment != 'production' && github.ref != 'refs/heads/main'
```

**Important Behavior Notes:**
- **`pull_request` events**: `github.event.inputs` is `null`, so `null != 'production'` evaluates to `true`
- **`push` events**: `github.event.inputs` is `null`, so `null != 'production'` evaluates to `true`
- **`workflow_dispatch` events**: `github.event.inputs.environment` contains the actual input value
- **Main branch protection**: `github.ref != 'refs/heads/main'` prevents seeding on main branch pushes

**Result:** The workflow runs on PRs and manual dispatches (except production), which matches the intended behavior.

### **3. Manual Triggering**

1. Go to **Actions** → **Database Seed**
2. Click **"Run workflow"**
3. Configure parameters:
   - **Environment**: `development`, `staging`, or `qa`
   - **Enable probe users**: `true`/`false`
   - **Enable audit logs**: `true`/`false`
   - **Custom tenant name**: Optional override
   - **Custom admin email**: Optional override

### **4. Example Manual Runs**

#### **Development with Probe Users**
```yaml
Environment: development
Enable probe users: true
Enable audit logs: true
Custom tenant name: "Dev Team Corp"
Custom admin email: "dev-admin@company.com"
```

#### **QA Environment**
```yaml
Environment: qa
Enable probe users: true
Enable audit logs: true
Custom tenant name: "QA Test Environment"
Custom admin email: "qa-admin@company.com"
```

#### **Staging (Minimal)**
```yaml
Environment: staging
Enable probe users: false
Enable audit logs: true
Custom tenant name: "Staging Environment"
```

## Workflow Jobs

### **1. seed-database**
- **Purpose**: Seed the primary development/qa database
- **Triggers**: Manual, push to develop, PR changes
- **Environment**: Non-production only
- **Steps**:
  - Checkout code
  - Setup Node.js
  - Install dependencies
  - Generate Prisma client
  - Run migrations
  - Execute seed script
  - Verify completion
  - Health checks

### **2. seed-staging**
- **Purpose**: Seed staging database after successful development seed
- **Triggers**: Push to develop branch only
- **Dependencies**: Requires `seed-database` success
- **Steps**:
  - Same as seed-database but with staging configuration
  - Uses staging-specific environment variables

### **3. notify-seed-completion**
- **Purpose**: Provide feedback on seeding results
- **Triggers**: Always runs after seeding jobs
- **Dependencies**: Both seeding jobs
- **Output**: Success/failure notifications

## Environment Configurations

### **Development**
```bash
NODE_ENV=development
TZ=UTC
ENABLE_DEMO_PROBE_USERS=true
ENABLE_AUDIT_LOGS=true
SEED_TENANT_NAME="Development Environment"
SEED_ADMIN_EMAIL="admin@dev.local"
```

### **Staging**
```bash
NODE_ENV=staging
TZ=UTC
ENABLE_DEMO_PROBE_USERS=true
ENABLE_AUDIT_LOGS=true
SEED_TENANT_NAME="Staging Environment"
SEED_ADMIN_EMAIL="admin@staging.local"
SEED_PROBE_TENANT_NAME="STAGING-PROBE-TENANT"
```

### **QA**
```bash
NODE_ENV=qa
TZ=UTC
ENABLE_DEMO_PROBE_USERS=true
ENABLE_AUDIT_LOGS=true
SEED_TENANT_NAME="QA Test Environment"
SEED_ADMIN_EMAIL="admin@qa.local"
```

## Verification Queries

### **Check Seed Version**
```sql
SELECT 
  "version",
  "environment",
  "lastRunAt",
  "config"->>'enableDemoProbeUsers' as probe_users_enabled,
  "config"->>'enableAuditLogs' as audit_logs_enabled
FROM "seed_version_history" 
WHERE id = 1;
```

### **Verify Entity Counts**
```sql
SELECT 
  (SELECT COUNT(*) FROM \"Tenant\") as tenant_count,
  (SELECT COUNT(*) FROM \"User\") as user_count,
  (SELECT COUNT(*) FROM \"TenantLicense\") as license_count,
  (SELECT COUNT(*) FROM \"Customer\") as customer_count,
  (SELECT COUNT(*) FROM \"Contact\") as contact_count;
```

### **Check Probe Users**
```sql
SELECT 
  email,
  name,
  is_system_user,
  user_type
FROM "user" 
WHERE email LIKE '%probe%' OR email LIKE '%system%';
```

## Troubleshooting

### **Common Issues**

#### **1. Database Connection Failed**
```bash
# Check DATABASE_URL secret
echo $DATABASE_URL_DEV

# Verify database is accessible
psql $DATABASE_URL_DEV -c "SELECT 1;"
```

#### **2. Migration Failed**
```bash
# Check migration status
npx prisma migrate status

# Reset if needed (development only)
npx prisma migrate reset
```

#### **3. Seed Version Not Recorded**
```bash
# Check if table exists
npx prisma db execute --stdin <<< "SELECT * FROM \"seed_version_history\";"

# Verify Prisma client includes new model
npx prisma generate
```

### **Debug Steps**

1. **Check workflow logs** - Go to Actions → Database Seed → View logs
2. **Verify secrets** - Ensure DATABASE_URL secrets are set correctly
3. **Test locally** - Run seed script locally with same environment variables
4. **Check database** - Connect directly to verify database state

## Security Considerations

### **1. Production Safety**
- ✅ **Never seeds production** - Workflow explicitly excludes production
- ✅ **Branch protection** - Main branch changes don't trigger seeding
- ✅ **Environment validation** - Confirms non-production environment

### **2. Secret Management**
- ✅ **Encrypted secrets** - Database URLs stored as GitHub secrets
- ✅ **Environment-specific** - Different secrets for different environments
- ✅ **Access control** - Only repository admins can modify secrets

### **3. Audit Trail**
- ✅ **Seed version tracking** - Every seed run is recorded
- ✅ **Configuration logging** - All settings used are logged
- ✅ **Execution history** - Complete audit trail in GitHub Actions

## Best Practices

### **1. Regular Seeding**
- ✅ **Automated on changes** - Seed when schema changes
- ✅ **Manual for testing** - Use manual trigger for specific scenarios
- ✅ **Consistent environments** - Same data across all non-prod environments

### **2. Monitoring**
- ✅ **Watch workflow runs** - Monitor for failures
- ✅ **Check seed versions** - Verify correct version deployed
- ✅ **Validate data** - Confirm expected entities created

### **3. Maintenance**
- ✅ **Update secrets** - Keep database URLs current
- ✅ **Review configurations** - Periodically review environment settings
- ✅ **Clean old data** - Reset databases when needed

## Future Enhancements

### **1. Multi-Environment Support**
- Add support for multiple QA environments
- Environment-specific seed configurations
- Parallel seeding for multiple databases

### **2. Advanced Verification**
- Data integrity checks
- Performance validation
- Automated testing after seeding

### **3. Integration**
- Slack/Teams notifications
- Integration with deployment pipelines
- Automated rollback on failures

## Conclusion

The GitHub Actions database seeding workflow provides:

- ✅ **Automated consistency** - Same data across environments
- ✅ **Production safety** - Never affects production databases
- ✅ **Flexible configuration** - Customizable for different needs
- ✅ **Complete audit trail** - Full visibility into seeding operations
- ✅ **Easy troubleshooting** - Clear logs and verification steps

**Status:** ✅ **Ready for use** - Configure secrets and start seeding!
