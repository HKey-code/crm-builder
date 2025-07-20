# Healthcheck Endpoint

## Overview

This is a **temporary healthcheck endpoint** to validate Azure App Service deployment, database connectivity, and Azure Key Vault integration.

## Endpoints

- `GET /healthcheck` - Main healthcheck endpoint
- `GET /health` - Alias for healthcheck

## Response Format

### Success Response
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "dbStatus": "ok",
  "jwtSecretPresent": true,
  "azureConfigPresent": true,
  "databaseUrlPresent": true,
  "environment": "production",
  "nodeVersion": "v22.0.0",
  "uptime": 3600,
  "memoryUsage": {
    "used": 128,
    "total": 512,
    "percentage": 25
  }
}
```

### Error Response
```json
{
  "status": "error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "error": "Database connection failed"
}
```

## What It Validates

### ✅ Database Connectivity
- Executes `SELECT 1` query to verify Prisma can connect to PostgreSQL
- Attempts to count users (gracefully handles if table doesn't exist yet)
- Reports `dbStatus: "ok"` or `dbStatus: "error"`

### ✅ Environment Variables
- **JWT Secret**: Checks if `JWT_SECRET` is present (from Azure Key Vault)
- **Azure Config**: Checks if `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID` are present
- **Database URL**: Checks if `DATABASE_URL` is present
- **Security**: Never exposes actual secret values

### ✅ System Information
- **Environment**: Current NODE_ENV
- **Node Version**: Running Node.js version
- **Uptime**: Application uptime in seconds
- **Memory Usage**: Current memory consumption

## Testing Your Azure Deployment

### 1. Test the Endpoint
```bash
# Using curl
curl https://new-smart-crm-backend.azurewebsites.net/healthcheck

# Using browser
# Navigate to: https://new-smart-crm-backend.azurewebsites.net/healthcheck
```

### 2. Expected Results

#### ✅ All Systems Working
```json
{
  "status": "ok",
  "dbStatus": "ok",
  "jwtSecretPresent": true,
  "azureConfigPresent": true,
  "databaseUrlPresent": true
}
```

#### ❌ Database Issues
```json
{
  "status": "ok",
  "dbStatus": "error",
  "jwtSecretPresent": true,
  "azureConfigPresent": true,
  "databaseUrlPresent": true
}
```

#### ❌ Key Vault Issues
```json
{
  "status": "ok",
  "dbStatus": "ok",
  "jwtSecretPresent": false,
  "azureConfigPresent": false,
  "databaseUrlPresent": false
}
```

## Troubleshooting

### Database Connection Issues
1. **Check DATABASE_URL**: Verify the connection string in Azure Key Vault
2. **Network Access**: Ensure App Service can reach PostgreSQL flexible server
3. **Firewall Rules**: Check if PostgreSQL allows connections from App Service
4. **Database Migration**: Run `npx prisma migrate deploy` if tables don't exist

### Key Vault Issues
1. **App Service Identity**: Ensure App Service has access to Key Vault
2. **Secret Names**: Verify secret names match exactly
3. **Key Vault Access Policy**: Check RBAC permissions

### Environment Variable Issues
1. **App Settings**: Verify environment variables are set in App Service
2. **Key Vault Integration**: Check if Key Vault references are configured correctly

## Removal

This is a **temporary feature** for validation. To remove:

1. Delete `apps/backend/src/healthcheck.service.ts`
2. Delete `apps/backend/src/healthcheck.service.spec.ts`
3. Remove `AppController` and `HealthcheckService` from `app.module.ts`
4. Delete `apps/backend/src/app.controller.ts` (if not needed for other routes)

## Security Notes

- ✅ **No sensitive data exposed**: Only boolean flags for secret presence
- ✅ **No database queries**: Only simple connectivity tests
- ✅ **No authentication required**: Public endpoint for health monitoring
- ✅ **Temporary use only**: Remove after validation complete 