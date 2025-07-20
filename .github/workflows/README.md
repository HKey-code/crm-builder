# GitHub Actions Workflows

This directory contains GitHub Actions workflows for testing, building, and deploying the CRM Builder application to Azure.

## Workflows

### `test.yml`
Runs automated tests for both backend and frontend applications with coverage reporting and badge generation.

### `deploy-infra.yml`
Automates the deployment of Azure infrastructure using Bicep templates with multi-tenant support.

### `deploy-app.yml`
Automates the deployment of NestJS backend and React frontend applications to Azure App Services.

## Setup Instructions

### 1. Azure Service Principal Setup

Create a service principal with appropriate permissions:

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "github-actions-crm-builder" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --sdk-auth

# Or for specific resource groups:
az ad sp create-for-rbac \
  --name "github-actions-crm-builder" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/rg-crm-builder-* \
  --sdk-auth
```

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add these repository secrets:

#### Infrastructure Deployment Secrets:
- **Name**: `AZURE_CREDENTIALS`
- **Value**: The JSON output from the service principal creation

#### Application Deployment Secrets:
- **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND_DEV`
- **Value**: Publish profile for backend dev App Service

- **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND_STAGING`
- **Value**: Publish profile for backend staging App Service

- **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND_PROD`
- **Value**: Publish profile for backend production App Service

- **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND_DEV`
- **Value**: Publish profile for frontend dev App Service

- **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND_STAGING`
- **Value**: Publish profile for frontend staging App Service

- **Name**: `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND_PROD`
- **Value**: Publish profile for frontend production App Service

### 3. Environment Protection Rules (Optional)

For production deployments, consider setting up environment protection rules:

1. Go to Settings → Environments
2. Create environments: `dev`, `staging`, `prod`
3. Add protection rules (required reviewers, wait timers, etc.)

## Workflow Details

### Testing (`test.yml`)

**Triggers:**
- Push to any branch
- Pull requests to main/develop
- Manual trigger

**Features:**
- **Separate Jobs**: Backend and frontend tests run independently
- **Coverage Reporting**: Collects and uploads coverage reports
- **E2E Testing**: Supports Playwright for frontend E2E tests
- **Test Artifacts**: Uploads test results and coverage reports
- **PR Comments**: Automatically comments test results on PRs
- **Badge Generation**: Creates coverage badges for README

**Test Commands:**
- **Backend**: `npm run test:cov` → `npm run test -- --coverage` → `npm test`
- **Frontend**: `npm run test:cov` → `npm run test -- --coverage` → `npm run test:unit` → `npm test`
- **E2E**: `npm run test:e2e` → `npm run test:playwright` (if Playwright is configured)

### Infrastructure Deployment (`deploy-infra.yml`)

**Triggers:**
- Push to main (deploys to dev)
- Pull requests (validation only)
- Manual trigger with custom parameters

**Features:**
- Multi-tenant support (dev, staging, prod)
- Bicep template validation
- Comprehensive error handling
- Deployment artifact preservation

### Application Deployment (`deploy-app.yml`)

**Triggers:**
- Push to main (deploys changed apps to all environments)
- Manual trigger with selective deployment options

**Features:**
- **Change Detection**: Only deploys apps that have changed
- **Environment Matrix**: Deploys to dev, staging, and prod
- **Selective Deployment**: Manual trigger allows choosing which apps to deploy
- **Build Process**: Uses `npm ci` and `npm run build`
- **Testing**: Runs tests before deployment (continues if tests fail)
- **Deployment Summary**: Comprehensive status reporting

## Usage

### Automatic Testing

#### Test Workflow:
- **Push to any branch**: Runs tests automatically
- **Pull requests**: Runs tests and comments results
- **Manual trigger**: Run tests on demand

#### Test Results:
- Individual test results for backend and frontend
- Coverage reports uploaded as artifacts
- PR comments with test summary
- Coverage badges generated

### Automatic Deployment

#### Infrastructure:
- **Push to main**: Deploys infrastructure to dev environment
- **Pull requests**: Validates templates without deployment

#### Applications:
- **Push to main**: Detects changes and deploys to all environments
- **Path-based triggers**: Only runs when relevant files change

### Manual Deployment

#### Infrastructure:
1. Go to Actions → Deploy Azure Infrastructure
2. Click "Run workflow"
3. Fill in parameters (tenant ID, environment, location, resource group)

#### Applications:
1. Go to Actions → Deploy Application
2. Click "Run workflow"
3. Choose:
   - **Environment**: dev, staging, or prod
   - **Deploy Backend**: true/false
   - **Deploy Frontend**: true/false

## Test Coverage and Badges

### Coverage Reports

The test workflow generates coverage reports for both applications:

- **Backend Coverage**: Jest coverage reports in `apps/backend/coverage/`
- **Frontend Coverage**: Test coverage reports in `apps/frontend/coverage/`
- **E2E Reports**: Playwright reports in `apps/frontend/playwright-report/`

### Badge Support

Coverage badges are automatically generated and can be added to your README:

```markdown
![Test Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)
![Tests](https://github.com/{owner}/{repo}/workflows/Run%20Tests/badge.svg)
```

### Test Artifacts

All test artifacts are uploaded and available for 30 days:
- Test results and logs
- Coverage reports
- E2E test reports
- JUnit XML reports

## Environment Matrix

All workflows support environment-specific deployments:

| Environment | Backend App Service | Frontend App Service | Publish Profile Secrets |
|-------------|---------------------|----------------------|------------------------|
| Dev | `crm-builder-dev-app` | `crm-builder-dev-app` | `AZURE_WEBAPP_PUBLISH_PROFILE_*_DEV` |
| Staging | `crm-builder-staging-app` | `crm-builder-staging-app` | `AZURE_WEBAPP_PUBLISH_PROFILE_*_STAGING` |
| Prod | `crm-builder-prod-app` | `crm-builder-prod-app` | `AZURE_WEBAPP_PUBLISH_PROFILE_*_PROD` |

## Build Process

### Backend (NestJS):
1. Install dependencies: `npm ci`
2. Run tests: `npm test` (with coverage)
3. Build application: `npm run build`
4. Deploy `dist/` folder to Azure App Service

### Frontend (React):
1. Install dependencies: `npm ci`
2. Run tests: `npm test` (with coverage)
3. Run E2E tests: `npm run test:e2e` (if configured)
4. Build application: `npm run build`
5. Deploy `dist/` folder to Azure App Service

## Troubleshooting

### Common Issues

1. **Test Failures**
   - Check test configuration in package.json
   - Verify all dependencies are installed
   - Review test logs for specific failures

2. **Coverage Issues**
   - Ensure test scripts include coverage flags
   - Check if coverage reporters are configured
   - Verify test files are properly structured

3. **E2E Test Issues**
   - Check if Playwright is properly installed
   - Verify browser dependencies are available
   - Review E2E test configuration

4. **Authentication Failed**
   - Verify `AZURE_CREDENTIALS` secret is correctly set
   - Check service principal permissions
   - Ensure subscription is active

5. **Publish Profile Issues**
   - Verify publish profile secrets are correctly set
   - Download fresh publish profiles from Azure portal
   - Check App Service is running and accessible

6. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are properly installed
   - Review build scripts in package.json

7. **Deployment Failures**
   - Check Azure App Service logs
   - Verify App Service is not in stopped state
   - Ensure build artifacts are generated correctly

### Debugging Commands

```bash
# Test locally
cd apps/backend && npm ci && npm test
cd apps/frontend && npm ci && npm test

# Check test coverage
cd apps/backend && npm run test:cov
cd apps/frontend && npm run test:cov

# Run E2E tests
cd apps/frontend && npm run test:e2e

# Check Azure CLI version
az version

# Validate Bicep templates
az bicep build --file devops/iac/main.bicep
```

## Security Best Practices

1. **Service Principal Permissions**
   - Use least privilege principle
   - Scope to specific resource groups
   - Rotate credentials regularly

2. **Environment Isolation**
   - Use separate resource groups per environment
   - Implement environment protection rules
   - Require approvals for production

3. **Secret Management**
   - Store sensitive values in Azure Key Vault
   - Use managed identities where possible
   - Avoid hardcoding secrets in parameter files

4. **Build Security**
   - Use `npm ci` for reproducible builds
   - Run tests before deployment
   - Scan dependencies for vulnerabilities

5. **Test Security**
   - Run tests in isolated environments
   - Use coverage thresholds
   - Implement security testing

## Next Steps

1. **Configure Environment Protection**
   - Set up required reviewers for production
   - Add deployment approvals
   - Configure branch protection rules

2. **Add Monitoring**
   - Configure deployment notifications
   - Set up failure alerts
   - Add deployment metrics

3. **Implement Security Scanning**
   - Add dependency vulnerability scanning
   - Implement code quality checks
   - Add compliance scanning

4. **Optimize Performance**
   - Implement build caching
   - Add parallel deployment strategies
   - Optimize build times

5. **Enhance Testing**
   - Add performance testing
   - Implement security testing
   - Add visual regression testing 