@description('Azure region for resources')
param location string

@description('Environment name')
param environment string

@description('Tenant ID for resource naming')
param tenantId string

@description('Resource prefix for naming convention')
param resourcePrefix string

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: '${resourcePrefix}-kv'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: environment == 'prod'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
  tags: {
    Environment: environment
    Tenant: tenantId
  }
}

// TODO: Add secrets to Key Vault
// These should be added after deployment or through separate automation
// resource databaseConnectionSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
//   parent: keyVault
//   name: 'database-connection-string'
//   properties: {
//     value: '' // TODO: Get from database module output
//   }
// }
// 
// resource jwtSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
//   parent: keyVault
//   name: 'jwt-secret'
//   properties: {
//     value: '' // TODO: Generate secure random string
//   }
// }
// 
// resource openaiApiKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
//   parent: keyVault
//   name: 'openai-api-key'
//   properties: {
//     value: '' // TODO: Add actual OpenAI API key
//   }
// }

// Outputs
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri 