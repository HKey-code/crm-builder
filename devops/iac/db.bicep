@description('Azure region for resources')
param location string

@description('Environment name')
param environment string

@description('Database name')
param dbName string

@description('Tenant ID for resource naming')
param tenantId string

@description('Resource prefix for naming convention')
param resourcePrefix string

@description('Database administrator username')
param adminUsername string

@description('Database administrator password')
@secure()
param adminPassword string

// Virtual Network for database
resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: '${resourcePrefix}-vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.0.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'default'
        properties: {
          addressPrefix: '10.0.0.0/24'
        }
      }
    ]
  }
  tags: {
    Environment: environment
    Tenant: tenantId
  }
}

// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: '${resourcePrefix}-db'
  location: location
  sku: {
    name: environment == 'prod' ? 'Standard_D2s_v3' : 'Standard_B1ms'
    tier: environment == 'prod' ? 'GeneralPurpose' : 'Burstable'
  }
  properties: {
    version: '14'
    administratorLogin: adminUsername
    administratorLoginPassword: adminPassword
    storage: {
      storageSizeGB: environment == 'prod' ? 128 : 32
    }
    network: {
      delegatedSubnetResourceId: virtualNetwork.properties.subnets[0].id
    }
    backup: {
      backupRetentionDays: environment == 'prod' ? 30 : 7
      geoRedundantBackup: environment == 'prod' ? 'Enabled' : 'Disabled'
    }
    highAvailability: {
      mode: environment == 'prod' ? 'ZoneRedundant' : 'Disabled'
    }
  }
  tags: {
    Environment: environment
    Tenant: tenantId
  }
}

// Database within the server
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: dbName
  properties: {
    charset: 'utf8'
    collation: 'en_US.utf8'
  }
}

// Firewall rule to allow Azure services
resource firewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Private DNS Zone for private endpoint (optional)
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2023-05-01' = {
  name: 'privatelink.postgres.database.azure.com'
  location: 'global'
  properties: {
  }
}

// Private DNS Zone VNet Link
resource privateDnsZoneVNetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2023-05-01' = {
  parent: privateDnsZone
  name: '${resourcePrefix}-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: virtualNetwork.id
    }
  }
}

// Outputs
output databaseServerName string = postgresServer.name
output databaseServerFqdn string = postgresServer.properties.fullyQualifiedDomainName
output databaseName string = database.name
output databaseConnectionString string = 'postgresql://${adminUsername}:${adminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/${dbName}?sslmode=require'
output virtualNetworkName string = virtualNetwork.name 