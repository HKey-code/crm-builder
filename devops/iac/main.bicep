@description('The tenant ID for multi-tenant resource naming')
@allowed([
  'dev'
  'staging'
  'prod'
])
param tenantId string

@description('The Azure region where resources will be deployed')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('The name of the CRM application')
param appName string = 'crm-builder'

@description('Database administrator username')
param dbAdminUsername string

@description('Database administrator password')
@secure()
param dbAdminPassword string

@description('Database name')
param dbName string = 'crm_builder'

// Resource naming convention with tenant prefix
var resourcePrefix = '${appName}-${tenantId}'
var resourceGroupName = resourceGroup().name

// Deploy App Service resources
module appService 'app.bicep' = {
  name: '${resourcePrefix}-app-deployment'
  params: {
    location: location
    environment: environment
    appName: appName
    tenantId: tenantId
    resourcePrefix: resourcePrefix
  }
}

// Deploy Database resources
module database 'db.bicep' = {
  name: '${resourcePrefix}-db-deployment'
  params: {
    location: location
    environment: environment
    dbName: dbName
    tenantId: tenantId
    resourcePrefix: resourcePrefix
    adminUsername: dbAdminUsername
    adminPassword: dbAdminPassword
  }
}

// TODO: Uncomment and configure Key Vault module when ready
// module keyVault 'kv.bicep' = {
//   name: '${resourcePrefix}-kv-deployment'
//   params: {
//     location: location
//     environment: environment
//     tenantId: tenantId
//     resourcePrefix: resourcePrefix
//   }
// }

// Outputs for deployment
output appServiceName string = appService.outputs.appServiceName
output appServiceUrl string = appService.outputs.appServiceUrl
output databaseServerName string = database.outputs.databaseServerName
output databaseConnectionString string = database.outputs.databaseConnectionString
output resourceGroupName string = resourceGroupName 