# Deployment Guide

This guide explains how to deploy the CRM Builder backend and frontend as separate Azure Web App Services.

## Overview

The CRM Builder is structured as a monorepo with separate backend and frontend applications:
- **Backend**: NestJS application in `apps/backend/`
- **Frontend**: Web application in `apps/frontend/`

Each application has its own GitHub Actions workflow for independent deployment to Azure Web App Services.

## Prerequisites

1. **Azure Web App Services**: Create two separate Azure Web App Services:
   - `new-smart-crm-backend-dev` (for backend)
   - `new-smart-crm-frontend-dev` (for frontend)

2. **GitHub Secrets**: Add the following secrets to your GitHub repository:
   - `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND`: Publish profile for backend app
   - `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND`: Publish profile for frontend app

## GitHub Actions Workflows

### Backend Deployment (`backend-deploy.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Changes in `apps/backend/`, `libs/`, or workflow file

**Process:**
1. Sets up Node.js 18
2. Installs dependencies in `apps/backend/`
3. Generates Prisma client
4. Builds the NestJS application
5. Deploys `dist/` folder to Azure Web App

### Frontend Deployment (`frontend-deploy.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Changes in `apps/frontend/` or workflow file

**Process:**
1. Sets up Node.js 18
2. Installs dependencies in `apps/frontend/`
3. Builds the frontend application
4. Deploys `dist/` folder to Azure Web App

## Setup Instructions

### 1. Create Azure Web App Services

Create two separate Azure Web App Services:

```bash
# Backend App Service
az webapp create \
  --resource-group your-resource-group \
  --plan your-app-service-plan \
  --name new-smart-crm-backend-dev \
  --runtime "NODE|18-lts"

# Frontend App Service  
az webapp create \
  --resource-group your-resource-group \
  --plan your-app-service-plan \
  --name new-smart-crm-frontend-dev \
  --runtime "NODE|18-lts"
```

### 2. Configure Environment Variables

**Backend App Service:**
```bash
az webapp config appsettings set \
  --resource-group your-resource-group \
  --name new-smart-crm-backend-dev \
  --settings \
    DATABASE_URL="your-postgresql-connection-string" \
    JWT_SECRET="your-jwt-secret" \
    NODE_ENV="production" \
    TZ="UTC" \
    ENABLE_DEMO_PROBE_USERS="false" \
    ENABLE_AUDIT_LOGS="true"
```

**Frontend App Service:**
```bash
az webapp config appsettings set \
  --resource-group your-resource-group \
  --name new-smart-crm-frontend-dev \
  --settings \
    NODE_ENV="production"
```

### 3. Seed Configuration (Production Safety)

The seed script is configured for production safety with the following environment variables:

**Production Environment (Recommended):**
```bash
NODE_ENV=production
TZ=UTC
ENABLE_DEMO_PROBE_USERS=false
ENABLE_AUDIT_LOGS=true
```

**Development Environment:**
```bash
NODE_ENV=development
ENABLE_DEMO_PROBE_USERS=true
ENABLE_AUDIT_LOGS=true
```

**Key Safety Features:**
- ✅ **Probe users disabled by default in production** - Prevents synthetic monitoring users in production
- ✅ **UTC timezone enforcement** - Prevents timezone-related issues
- ✅ **Audit logs enabled** - Maintains compliance and debugging capability
- ✅ **Environment-aware defaults** - Automatically detects production vs development

**Optional Customization:**
```bash
# Custom tenant and user names (optional)
SEED_TENANT_NAME="Your Company Name"
SEED_ADMIN_EMAIL="admin@yourcompany.com"
SEED_SERVICE_EMAIL="service@yourcompany.com"
SEED_SALES_EMAIL="sales@yourcompany.com"
SEED_PROBE_EMAIL="probe@yourcompany.com"
SEED_PROBE_TENANT_NAME="YOUR-PROBE-TENANT"
```

**Complete Environment Variable Reference:**
```bash
# Core Configuration
NODE_ENV=production|staging|development
TZ=UTC
ENABLE_DEMO_PROBE_USERS=false|true
ENABLE_AUDIT_LOGS=true|false

# Tenant Configuration
SEED_TENANT_NAME="Your Company Name"
SEED_ADMIN_EMAIL="admin@yourcompany.com"
SEED_SERVICE_EMAIL="service@yourcompany.com"
SEED_SALES_EMAIL="sales@yourcompany.com"

# Probe User Configuration (for synthetic monitoring)
SEED_PROBE_EMAIL="probe@yourcompany.com"
SEED_PROBE_TENANT_NAME="YOUR-PROBE-TENANT"
```

### 4. Get Publish Profiles

Download the publish profiles for both apps:

```bash
# Backend publish profile
az webapp deployment list-publishing-profiles \
  --resource-group your-resource-group \
  --name new-smart-crm-backend-dev \
  --xml > backend-publish-profile.xml

# Frontend publish profile
az webapp deployment list-publishing-profiles \
  --resource-group your-resource-group \
  --name new-smart-crm-frontend-dev \
  --xml > frontend-publish-profile.xml
```

### 5. Add GitHub Secrets

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND`: Content of `backend-publish-profile.xml`
   - `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND`: Content of `frontend-publish-profile.xml`

### 6. Configure Startup Commands

**Backend App Service:**
```bash
az webapp config set \
  --resource-group your-resource-group \
  --name new-smart-crm-backend-dev \
  --startup-file "npm start"
```

**Frontend App Service:**
```bash
az webapp config set \
  --resource-group your-resource-group \
  --name new-smart-crm-frontend-dev \
  --startup-file "npm start"
```

## Deployment Process

### Automatic Deployment

1. **Backend Changes**: When you push changes to `apps/backend/` or `libs/`, the backend workflow will automatically:
   - Build the NestJS application
   - Deploy to `new-smart-crm-backend-dev`

2. **Frontend Changes**: When you push changes to `apps/frontend/`, the frontend workflow will automatically:
   - Build the frontend application
   - Deploy to `new-smart-crm-frontend-dev`

### Manual Deployment

You can manually trigger deployments:

1. Go to your GitHub repository → Actions
2. Select the workflow you want to run (`backend-deploy.yml` or `frontend-deploy.yml`)
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## Monitoring

### Backend Health Checks

After deployment, verify the backend is running:

```bash
# Health check
curl https://new-smart-crm-backend-dev.azurewebsites.net/health

# Healthcheck endpoint
curl https://new-smart-crm-backend-dev.azurewebsites.net/healthcheck
```

### Frontend Access

Access your frontend at:
```
https://new-smart-crm-frontend-dev.azurewebsites.net
```

## Troubleshooting

### Common Issues

1. **Build Failures**: Check the GitHub Actions logs for build errors
2. **Deployment Failures**: Verify publish profiles are correct
3. **Runtime Errors**: Check Azure Web App logs in the Azure portal
4. **Environment Variables**: Ensure all required environment variables are set

### Logs

**GitHub Actions Logs:**
- Go to repository → Actions → Select workflow run → View logs

**Azure Web App Logs:**
```bash
# Backend logs
az webapp log tail --resource-group your-resource-group --name new-smart-crm-backend-dev

# Frontend logs  
az webapp log tail --resource-group your-resource-group --name new-smart-crm-frontend-dev
```

## Security Notes

- Never commit publish profiles or secrets to the repository
- Use Azure Key Vault for sensitive environment variables
- Regularly rotate JWT secrets and database credentials
- Enable HTTPS-only access for production deployments 