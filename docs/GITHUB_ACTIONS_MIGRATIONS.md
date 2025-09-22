# GitHub Actions: Prisma Migration Management

This document explains how to use the GitHub Actions workflows for managing Prisma database migrations safely.

## Overview

We have two main workflows for managing database migrations:

1. **Prisma Migration Check** - Runs on PRs to prevent uncommitted schema changes
2. **Prisma Migration Deploy** - Runs on main with manual approval for production deployments

## Workflow 1: Prisma Migration Check

**Trigger**: Pull requests to `main` or `develop` branches
**Purpose**: Prevents merging PRs with uncommitted schema changes

### What it does:

1. **Validates Schema**: Checks if the Prisma schema is valid
2. **Generates Client**: Ensures Prisma client can be generated
3. **Checks for Uncommitted Changes**: Detects schema changes that need migrations
4. **Comments on PR**: Provides feedback on migration status

### When it runs:

- On any PR that modifies `libs/schema-engine/prisma/schema.prisma`
- On any PR that adds migration files
- On any PR that modifies the workflow itself

### Success Criteria:

✅ Schema validation passes  
✅ Prisma client generates successfully  
✅ No uncommitted schema changes detected  

### Failure Actions:

If the check fails, you'll see a comment like:

```
## ❌ Prisma Migration Check Failed

This PR contains uncommitted schema changes that need to be migrated before merging.

### Required Actions:
1. **Generate Migration**: Run `npx prisma migrate dev --name your_migration_name`
2. **Commit Migration**: Add and commit the generated migration files
3. **Push Changes**: Push the migration files to this PR
```

## Workflow 2: Prisma Migration Deploy

**Trigger**: Manual workflow dispatch or pushes to main with migration files
**Purpose**: Safely deploys migrations to production with manual approval

### What it does:

1. **Validates Migration**: Checks schema and generates client
2. **Dry Run**: Shows what SQL will be executed (on push to main)
3. **Manual Approval**: Requires explicit confirmation for production deployment
4. **Deploys Migration**: Applies migrations to the target database
5. **Verifies Deployment**: Checks migration status after deployment

### Manual Deployment Process:

1. **Go to Actions**: Navigate to GitHub Actions tab
2. **Select Workflow**: Choose "Prisma Migration Deploy"
3. **Click "Run workflow"**: Start the manual deployment process
4. **Configure Options**:
   - **Environment**: Choose `production` or `staging`
   - **Confirm Migration**: Set to `true` to proceed
5. **Review and Deploy**: The workflow will apply migrations

### Safety Features:

- **Manual Approval**: Requires explicit confirmation
- **Environment Protection**: Uses GitHub environments for secrets
- **Dry Run**: Shows SQL before execution
- **Verification**: Checks migration status after deployment
- **Rollback Plan**: Includes rollback instructions if needed

## Usage Examples

### Scenario 1: Adding a New Field

1. **Modify Schema**: Update `schema.prisma`
2. **Create Migration**: Run `npx prisma migrate dev --name add_user_field`
3. **Commit Changes**: Add both schema and migration files
4. **Push PR**: Create pull request
5. **Check Passes**: Migration check validates the changes
6. **Merge PR**: After review, merge to main
7. **Deploy**: Use manual workflow to deploy to production

### Scenario 2: Emergency Schema Change

1. **Create Hotfix Branch**: From main
2. **Modify Schema**: Make necessary changes
3. **Generate Migration**: `npx prisma migrate dev --name emergency_fix`
4. **Test Locally**: Verify migration works
5. **Create PR**: Push changes
6. **Review**: Ensure migration check passes
7. **Merge**: Merge to main
8. **Deploy**: Use manual workflow with extra caution

## Configuration

### Required Secrets:

- `DATABASE_URL`: Production database connection string

### Environment Setup:

1. **Create Environments**: In GitHub repository settings
   - `production`
   - `staging`
2. **Add Protection Rules**: Require manual approval
3. **Configure Secrets**: Add `DATABASE_URL` to each environment

### Branch Protection:

Enable branch protection on `main`:
- Require status checks to pass
- Require PR reviews
- Include the migration check workflow

## Troubleshooting

### Common Issues:

1. **Schema Validation Fails**
   - Check for syntax errors in `schema.prisma`
   - Verify all relationships are properly defined
   - Run `npx prisma validate` locally

2. **Migration Conflicts**
   - Check for conflicting migration files
   - Reset migration history if needed: `npx prisma migrate reset`
   - Generate fresh migration: `npx prisma migrate dev`

3. **Deployment Fails**
   - Check database connectivity
   - Verify `DATABASE_URL` secret is correct
   - Review migration logs for specific errors

### Rollback Process:

If a migration deployment fails:

1. **Stop the Workflow**: Cancel any running deployments
2. **Assess Damage**: Check database state
3. **Manual Rollback**: If needed, manually revert the migration
4. **Fix Issues**: Address the root cause
5. **Re-deploy**: Use the workflow again with fixes

## Best Practices

### Before Creating Migrations:

1. **Test Locally**: Always test migrations in development
2. **Backup Data**: Ensure you have database backups
3. **Review Changes**: Double-check schema modifications
4. **Consider Impact**: Think about downtime and data loss

### During Deployment:

1. **Use Staging**: Test migrations in staging first
2. **Monitor Closely**: Watch the deployment logs
3. **Have Rollback Plan**: Know how to revert if needed
4. **Communicate**: Notify team about database changes

### After Deployment:

1. **Verify Application**: Test the application works
2. **Check Data**: Verify data integrity
3. **Monitor Performance**: Watch for any performance impacts
4. **Document Changes**: Update documentation if needed

## Commands Reference

### Local Development:

```bash
# Generate migration
npx prisma migrate dev --name migration_name

# Reset migrations (development only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status

# Generate client
npx prisma generate
```

### Production Deployment:

```bash
# Deploy migrations (production)
npx prisma migrate deploy

# Check production status
npx prisma migrate status
```

## Security Considerations

1. **Secrets Management**: Never commit `DATABASE_URL` to code
2. **Environment Protection**: Use GitHub environments for production
3. **Access Control**: Limit who can trigger production deployments
4. **Audit Trail**: All deployments are logged and tracked
5. **Rollback Capability**: Always have a rollback plan

## Support

If you encounter issues with the migration workflows:

1. **Check Logs**: Review the GitHub Actions logs
2. **Test Locally**: Reproduce the issue locally
3. **Consult Team**: Discuss with the development team
4. **Document Issues**: Update this documentation with solutions
