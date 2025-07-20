# Azure Infrastructure as Code (IaC)

This directory contains Bicep templates for deploying the CRM Builder infrastructure to Azure with multi-tenant support.

## Architecture Overview

The infrastructure is designed to support multiple tenants with isolated resources:

- **App Service Plan & Web App**: Hosts the CRM application
- **PostgreSQL Flexible Server**: Database with private networking
- **Application Insights**: Monitoring and logging
- **Key Vault**: Secure secret management (future implementation)

## Prerequisites

1. **Azure CLI** installed and authenticated
2. **Bicep CLI** (included with Azure CLI 2.20.0+)
3. **Azure Subscription** with appropriate permissions
4. **Resource Group** created in your target region

## Parameters

### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `tenantId` | Tenant identifier for resource naming | `dev`, `staging`, `prod` |
| `dbAdminUsername` | PostgreSQL admin username | `crmadmin` |
| `dbAdminPassword` | PostgreSQL admin password | `SecurePassword123!` |

### Optional Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `location` | Azure region | Resource group location |
| `environment` | Environment name | `dev` |
| `appName` | Application name | `crm-builder` |
| `dbName` | Database name | `crm_builder` |

## Deployment Commands

### 1. Create Resource Group (if not exists)

```bash
az group create \
  --name "rg-crm-builder-dev" \
  --location "East US"
```

### 2. Deploy Infrastructure

#### Development Environment
```bash
az deployment group create \
  --resource-group "rg-crm-builder-dev" \
  --template-file "main.bicep" \
  --parameters \
    tenantId=dev \
    environment=dev \
    dbAdminUsername=crmadmin \
    dbAdminPassword="YourSecurePassword123!" \
  --verbose
```

#### Staging Environment
```bash
az deployment group create \
  --resource-group "rg-crm-builder-staging" \
  --template-file "main.bicep" \
  --parameters \
    tenantId=staging \
    environment=staging \
    dbAdminUsername=crmadmin \
    dbAdminPassword="YourSecurePassword123!" \
  --verbose
```

#### Production Environment
```bash
az deployment group create \
  --resource-group "rg-crm-builder-prod" \
  --template-file "main.bicep" \
  --parameters \
    tenantId=prod \
    environment=prod \
    dbAdminUsername=crmadmin \
    dbAdminPassword="YourSecurePassword123!" \
  --verbose
```

### 3. Using Parameter Files

Create a parameter file for easier management:

**parameters-dev.json:**
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "tenantId": {
      "value": "dev"
    },
    "environment": {
      "value": "dev"
    },
    "dbAdminUsername": {
      "value": "crmadmin"
    },
    "dbAdminPassword": {
      "value": "YourSecurePassword123!"
    }
  }
}
```

Then deploy with:
```bash
az deployment group create \
  --resource-group "rg-crm-builder-dev" \
  --template-file "main.bicep" \
  --parameters "@parameters-dev.json" \
  --verbose
```

## Resource Naming Convention

Resources follow this naming pattern:
- `{appName}-{tenantId}-{resourceType}`

Examples:
- `crm-builder-dev-app` (Web App)
- `crm-builder-dev-plan` (App Service Plan)
- `crm-builder-dev-db` (PostgreSQL Server)
- `crm-builder-dev-kv` (Key Vault)

## Outputs

After successful deployment, you'll get these outputs:

- `appServiceName`: Name of the deployed web app
- `appServiceUrl`: URL to access the web app
- `databaseServerName`: PostgreSQL server name
- `databaseConnectionString`: Connection string for the database
- `resourceGroupName`: Name of the resource group

## Security Considerations

### TODO Items for Production

1. **Key Vault Integration**
   - Uncomment Key Vault module in `main.bicep`
   - Store sensitive values in Key Vault
   - Configure App Service to read from Key Vault

2. **Network Security**
   - Configure private endpoints for database
   - Restrict App Service access to database
   - Implement proper firewall rules

3. **Secrets Management**
   - Store database connection string in Key Vault
   - Store JWT secrets in Key Vault
   - Store API keys in Key Vault

4. **Monitoring & Logging**
   - Configure Application Insights alerts
   - Set up Log Analytics workspace
   - Implement proper logging

## Troubleshooting

### Common Issues

1. **Resource Name Conflicts**
   - Ensure unique tenant IDs
   - Check for existing resources with same names

2. **Database Connection Issues**
   - Verify firewall rules
   - Check network configuration
   - Ensure SSL is enabled

3. **App Service Deployment**
   - Verify Node.js version compatibility
   - Check application settings
   - Review deployment logs

### Validation Commands

```bash
# Validate template syntax
az bicep build --file main.bicep

# Validate deployment (dry run)
az deployment group validate \
  --resource-group "rg-crm-builder-dev" \
  --template-file "main.bicep" \
  --parameters "@parameters-dev.json"
```

## Next Steps

1. **Configure CI/CD Pipeline**
   - Set up GitHub Actions or Azure DevOps
   - Automate deployments per environment

2. **Implement Key Vault**
   - Uncomment Key Vault module
   - Configure secret rotation

3. **Add Monitoring**
   - Configure Application Insights alerts
   - Set up health checks

4. **Security Hardening**
   - Implement private endpoints
   - Configure network security groups
   - Enable audit logging 