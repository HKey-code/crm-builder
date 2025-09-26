# Seed Version Management

## Overview

The CRM License System includes a flexible seed version management system that allows operations teams to bump seed versions without code changes. This ensures proper tracking of database seeding operations and enables version-specific rollbacks if needed.

## Version Sources (Priority Order)

The seed version is determined in the following priority order:

1. **Environment Variable** (`SEED_VERSION`) - Highest priority
2. **Package.json** (`seedVersion` field) - Medium priority  
3. **Default** (`"1.0.0"`) - Fallback

## Configuration Methods

### 1. Environment Variable (Recommended for Ops)

```bash
# Set custom seed version via environment variable
SEED_VERSION=1.1.0 npx prisma db seed

# With other environment variables
SEED_VERSION=1.1.0 \
NODE_ENV=production \
ENABLE_DEMO_PROBE_USERS=false \
ENABLE_AUDIT_LOGS=true \
TZ=UTC \
npx prisma db seed
```

### 2. Package.json Configuration

```json
{
  "name": "crm-builder",
  "version": "1.0.0",
  "seedVersion": "1.1.0",
  "workspaces": ["apps/*", "libs/*"]
}
```

**Benefits:**
- Version controlled with code
- Consistent across team
- Easy to track in git history

### 3. GitHub Actions Workflow

```yaml
# Manual trigger with custom seed version
- name: Seed database
  run: |
    if [ -n "${{ github.event.inputs.seed_version }}" ]; then
      export SEED_VERSION="${{ github.event.inputs.seed_version }}"
      echo "📋 Using custom seed version: $SEED_VERSION"
    fi
    npx prisma db seed
```

## Usage Examples

### Development Team

```bash
# Use package.json version (default)
npx prisma db seed

# Override for testing
SEED_VERSION=1.0.0-beta npx prisma db seed
```

### Operations Team

```bash
# Production seeding with custom version
SEED_VERSION=1.2.0 \
NODE_ENV=production \
ENABLE_DEMO_PROBE_USERS=false \
ENABLE_AUDIT_LOGS=true \
TZ=UTC \
npx prisma db seed

# Emergency rollback seeding
SEED_VERSION=1.1.0 \
NODE_ENV=production \
ENABLE_DEMO_PROBE_USERS=false \
ENABLE_AUDIT_LOGS=true \
TZ=UTC \
npx prisma db seed
```

### CI/CD Pipeline

```bash
# Automated seeding with package.json version
npm run db:seed

# Custom version for specific environments
SEED_VERSION=${{ github.sha }} npx prisma db seed
```

## Version Tracking

### Database Tracking

The seed version is automatically tracked in the `seed_version_history` table:

```sql
SELECT 
  "version",
  "environment", 
  "lastRunAt",
  "config"->>'seedVersion' as seed_version,
  "summary"
FROM "seed_version_history" 
WHERE id = 1;
```

### Logging

The seed script logs the version being used:

```bash
🌱 Starting database seed...
📋 Configuration: { enableDemoProbeUsers: true, enableAuditLogs: true, isProduction: false }
✅ Seed version tracked: 1.1.0 (from 1.1.0)
🎉 Database seed completed successfully!
```

## Version Bumping Strategies

### 1. Semantic Versioning (Recommended)

```bash
# Major version for breaking changes
SEED_VERSION=2.0.0 npx prisma db seed

# Minor version for new features
SEED_VERSION=1.2.0 npx prisma db seed

# Patch version for bug fixes
SEED_VERSION=1.1.1 npx prisma db seed
```

### 2. Environment-Specific Versions

```bash
# Development
SEED_VERSION=1.0.0-dev npx prisma db seed

# Staging
SEED_VERSION=1.0.0-staging npx prisma db seed

# Production
SEED_VERSION=1.0.0-prod npx prisma db seed
```

### 3. Timestamp-Based Versions

```bash
# Use timestamp for unique versions
SEED_VERSION=1.0.0-$(date +%Y%m%d-%H%M%S) npx prisma db seed

# Result: 1.0.0-20250115-143022
```

### 4. Git-Based Versions

```bash
# Use git commit hash
SEED_VERSION=1.0.0-$(git rev-parse --short HEAD) npx prisma db seed

# Use git tag
SEED_VERSION=$(git describe --tags --always) npx prisma db seed
```

## Best Practices

### 1. Version Naming

- **Use semantic versioning** for predictable versioning
- **Include environment** in version for clarity
- **Document breaking changes** in version notes

### 2. Production Safety

```bash
# Always specify version for production
SEED_VERSION=1.2.0 \
NODE_ENV=production \
ENABLE_DEMO_PROBE_USERS=false \
ENABLE_AUDIT_LOGS=true \
TZ=UTC \
npx prisma db seed
```

### 3. Rollback Strategy

```bash
# Keep previous version available for rollback
SEED_VERSION=1.1.0 \
NODE_ENV=production \
ENABLE_DEMO_PROBE_USERS=false \
ENABLE_AUDIT_LOGS=true \
TZ=UTC \
npx prisma db seed
```

### 4. Documentation

- **Document version changes** in release notes
- **Track version history** in database
- **Maintain rollback procedures**

## Troubleshooting

### Common Issues

#### 1. Version Not Being Used

```bash
# Check if environment variable is set
echo $SEED_VERSION

# Check package.json seedVersion field
cat package.json | grep seedVersion

# Check seed script logs
npx prisma db seed 2>&1 | grep "Seed version"
```

#### 2. SeedVersionHistory Table Not Found

If you get errors about `seedVersionHistory` not existing, apply the migration:

```bash
# Apply migration to your Azure database
./scripts/apply-seed-version-migration.sh [environment]

# Examples:
./scripts/apply-seed-version-migration.sh development
./scripts/apply-seed-version-migration.sh staging
./scripts/apply-seed-version-migration.sh production
```

**Note**: The migration will be applied automatically in GitHub Actions workflows.

#### 2. Package.json Not Found

```bash
# Verify package.json exists
ls -la package.json

# Check file permissions
ls -la package.json

# Try absolute path
SEED_VERSION=1.1.0 npx prisma db seed
```

#### 3. Version Tracking Issues

```sql
-- Check if seed_version_history table exists
SELECT * FROM "seed_version_history" WHERE id = 1;

-- Check latest version
SELECT "version", "lastRunAt", "environment" 
FROM "seed_version_history" 
ORDER BY "lastRunAt" DESC 
LIMIT 5;
```

### Debug Steps

1. **Check environment variables**
   ```bash
   env | grep SEED
   ```

2. **Verify package.json**
   ```bash
   cat package.json | grep -A 5 -B 5 seedVersion
   ```

3. **Test version resolution**
   ```bash
   SEED_VERSION=test-version npx prisma db seed
   ```

4. **Check database tracking**
   ```sql
   SELECT "version", "config"->>'seedVersion' as env_version 
   FROM "seed_version_history" 
   WHERE id = 1;
   ```

## Integration with CI/CD

### GitHub Actions

```yaml
# Manual trigger with version input
- name: Seed database
  run: |
    if [ -n "${{ github.event.inputs.seed_version }}" ]; then
      export SEED_VERSION="${{ github.event.inputs.seed_version }}"
    fi
    npx prisma db seed
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL_DEV }}
```

### Azure DevOps

```yaml
# Pipeline variable
variables:
  SEED_VERSION: '1.2.0'

steps:
- script: |
    export SEED_VERSION=$(SEED_VERSION)
    npx prisma db seed
```

### Jenkins

```groovy
// Pipeline parameter
parameters {
  string(name: 'SEED_VERSION', defaultValue: '1.0.0', description: 'Seed version to use')
}

steps {
  sh '''
    export SEED_VERSION=${SEED_VERSION}
    npx prisma db seed
  '''
}
```

## Future Enhancements

### 1. Version Validation

```typescript
// Validate version format
function validateSeedVersion(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
  return semverRegex.test(version);
}
```

### 2. Version Comparison

```sql
-- Compare versions across environments
SELECT 
  "environment",
  "version",
  "lastRunAt"
FROM "seed_version_history" 
WHERE "version" != '1.0.0'
ORDER BY "lastRunAt" DESC;
```

### 3. Automated Version Bumping

```bash
# Auto-increment patch version
SEED_VERSION=$(npm version patch --no-git-tag-version) npx prisma db seed
```

## Conclusion

The seed version management system provides:

- ✅ **Flexible versioning** - Environment variables, package.json, or defaults
- ✅ **Ops-friendly** - No code changes required for version bumps
- ✅ **Complete tracking** - Database logging of all seed operations
- ✅ **Rollback support** - Easy version-specific rollbacks
- ✅ **CI/CD integration** - Works with all major CI/CD platforms

**Status**: ✅ **Production Ready** - Ops teams can manage seed versions without developer involvement!
