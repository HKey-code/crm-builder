@description('Azure region for resources')
param location string

@description('Environment name')
param environment string

@description('Application name')
param appName string

@description('Tenant ID for resource naming')
param tenantId string

@description('Resource prefix for naming convention')
param resourcePrefix string

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${resourcePrefix}-plan'
  location: location
  sku: {
    name: environment == 'prod' ? 'P1v3' : 'B1'
    tier: environment == 'prod' ? 'PremiumV3' : 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true // Required for Linux App Service
  }
  tags: {
    Environment: environment
    Tenant: tenantId
    Application: appName
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: '${resourcePrefix}-app'
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts'
      appSettings: [
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
        {
          name: 'NODE_ENV'
          value: environment
        }
        {
          name: 'TENANT_ID'
          value: tenantId
        }
        // TODO: Add database connection string from Key Vault
        // {
        //   name: 'DATABASE_URL'
        //   value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/database-connection-string/)'
        // }
        // TODO: Add other environment variables from Key Vault
        // {
        //   name: 'JWT_SECRET'
        //   value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/jwt-secret/)'
        // }
        // {
        //   name: 'OPENAI_API_KEY'
        //   value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/openai-api-key/)'
        // }
      ]
    }
  }
  tags: {
    Environment: environment
    Tenant: tenantId
    Application: appName
  }
}

// Application Insights (optional but recommended)
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${resourcePrefix}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: '' // TODO: Add Log Analytics workspace if needed
  }
  tags: {
    Environment: environment
    Tenant: tenantId
    Application: appName
  }
}

// Outputs
output appServiceName string = webApp.name
output appServiceUrl string = 'https://${webApp.properties.defaultHostName}'
output appServicePlanName string = appServicePlan.name
output appInsightsKey string = appInsights.properties.InstrumentationKey 