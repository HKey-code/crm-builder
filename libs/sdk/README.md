# CRM License System TypeScript SDK

Auto-generated TypeScript SDK for the CRM License System API, providing type-safe access to all license management, monitoring, and compliance features.

## Features

- ✅ **Type-safe API calls** - Generated from OpenAPI specification
- ✅ **Complete coverage** - All endpoints from the CRM License System
- ✅ **Modern TypeScript** - Full type definitions and IntelliSense support
- ✅ **Authentication support** - Bearer token authentication
- ✅ **Error handling** - Consistent error responses
- ✅ **Modular design** - Organized by feature areas

## Installation

```bash
npm install @crm-builder/license-sdk
```

## Quick Start

```typescript
import { CrmLicenseSDK } from '@crm-builder/license-sdk';

// Initialize SDK
const sdk = new CrmLicenseSDK('https://your-api.azurewebsites.net', 'your-auth-token');

// Check user license
const license = await sdk.checkUserLicense({
  userId: 'user-123',
  tenantId: 'tenant-456',
  licenseType: 'SMART_SERVICE'
});

// Assign license
const result = await sdk.assignLicense({
  userId: 'user-123',
  tenantId: 'tenant-456',
  licenseType: 'SMART_SERVICE',
  roleId: 'role-789',
  expiresAt: '2025-12-31T23:59:59Z'
});

// Get seat usage
const usage = await sdk.getSeatUsage('tenant-456');

// Get health status
const health = await sdk.getLicenseHealth('tenant-456', 'SMART_SERVICE');
```

## API Categories

### License Management
- `checkUserLicense()` - Check if user has valid license
- `assignLicense()` - Assign license to user
- `assignLicenseWithOverride()` - Admin override for seat limits
- `revokeLicense()` - Revoke user license
- `renewLicense()` - Renew expiring license
- `getTenantLicenses()` - Get all licenses for tenant
- `createTenantLicense()` - Create new tenant license

### Usage & Analytics
- `getSeatUsage()` - Get seat usage for tenant
- `getAllSeatUsage()` - Get seat usage across all tenants
- `getExpiringLicenses()` - Get licenses expiring soon

### Health & Monitoring
- `getLicenseHealth()` - Get health status for license
- `getLicenseSummary()` - Get system-wide license summary
- `getSLOStatus()` - Get SLO monitoring status
- `getSLOMetrics()` - Get SLO performance metrics

### Service Module (SMART_SERVICE license required)
- `getServiceTickets()` - Get service tickets
- `createServiceTicket()` - Create new service ticket
- `getServiceCases()` - Get service cases

### Sales Module (SMART_SALES license required)
- `getSalesOpportunities()` - Get sales opportunities
- `createSalesOpportunity()` - Create new opportunity
- `getSalesLeads()` - Get sales leads

### Cost Guardrails
- `getDashboardData()` - Get guardrail dashboard data
- `getSeatUsageMetrics()` - Get seat usage metrics
- `getGuardrailConfig()` - Get guardrail configuration

### GDPR Compliance
- `anonymizeUser()` - Anonymize user data
- `getDataRetentionStatus()` - Get data retention status

## Type Definitions

The SDK includes comprehensive TypeScript definitions:

```typescript
import type { 
  LicenseType, 
  UserStatus, 
  SeatStatus,
  LicenseResponse,
  AssignLicenseRequest,
  SeatUsageResponse,
  LicenseHealthResponse
} from '@crm-builder/license-sdk';

// Use types for your own interfaces
interface MyLicenseData extends LicenseResponse {
  customField?: string;
}
```

## Error Handling

```typescript
try {
  const license = await sdk.checkUserLicense({
    userId: 'user-123',
    tenantId: 'tenant-456',
    licenseType: 'SMART_SERVICE'
  });
} catch (error) {
  if (error instanceof Error) {
    console.error('License check failed:', error.message);
  }
}
```

## Authentication

```typescript
// Initialize with auth token
const sdk = new CrmLicenseSDK('https://api.example.com', 'your-jwt-token');

// Or set token later
sdk.authToken = 'new-jwt-token';
```

## Environment Configuration

```typescript
// Development
const devSdk = new CrmLicenseSDK('https://dev-api.azurewebsites.net', devToken);

// Staging
const stagingSdk = new CrmLicenseSDK('https://staging-api.azurewebsites.net', stagingToken);

// Production
const prodSdk = new CrmLicenseSDK('https://prod-api.azurewebsites.net', prodToken);
```

## Advanced Usage

### Batch Operations
```typescript
// Check multiple licenses
const licenseChecks = await Promise.all([
  sdk.checkUserLicense({ userId: 'user1', tenantId: 'tenant1', licenseType: 'SMART_SERVICE' }),
  sdk.checkUserLicense({ userId: 'user2', tenantId: 'tenant1', licenseType: 'SMART_SALES' }),
  sdk.checkUserLicense({ userId: 'user3', tenantId: 'tenant2', licenseType: 'SMART_GRANTS' })
]);
```

### Monitoring Integration
```typescript
// Set up health monitoring
setInterval(async () => {
  try {
    const health = await sdk.getLicenseHealth('tenant-456', 'SMART_SERVICE');
    if (health.status === 'critical') {
      console.error('License health critical:', health);
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }
}, 60000); // Check every minute
```

## Development

### Building from Source
```bash
# Clone repository
git clone https://github.com/your-org/crm-builder.git
cd crm-builder

# Install dependencies
npm install

# Generate OpenAPI spec and SDK
npm run generate:sdk

# Build SDK
cd libs/sdk
npm run build
```

### Contributing
1. Make changes to the API endpoints
2. Update OpenAPI decorators in controllers
3. Regenerate SDK: `npm run generate:sdk`
4. Test with your frontend application
5. Submit pull request

## API Documentation

For complete API documentation, visit:
- **Development**: `https://dev-api.azurewebsites.net/api`
- **Staging**: `https://staging-api.azurewebsites.net/api`
- **Production**: `https://prod-api.azurewebsites.net/api`

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 **Documentation**: [API Docs](https://your-api.azurewebsites.net/api)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-org/crm-builder/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-org/crm-builder/discussions)
