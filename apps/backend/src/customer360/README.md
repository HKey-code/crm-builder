# Customer360View Feature

## Overview

The Customer360View feature provides a unified, 360-degree view of customer information aggregated across multiple CRM modules (Sales, Service, Marketing, Portal) while respecting module-based license separation and role-based access control (RBAC).

## Architecture

### Core Components

1. **Customer360Service** - Main aggregation service that:
   - Validates user permissions and module licenses
   - Queries data from multiple modules
   - Normalizes and aggregates results
   - Applies RBAC and tenant isolation

2. **Customer360Resolver** - GraphQL resolver that:
   - Exposes aggregated data via GraphQL queries
   - Handles authentication and authorization
   - Provides type-safe data access

3. **Module License System** - Controls access to different modules:
   - `ModuleLicense` model tracks active licenses per tenant
   - License expiration and feature management
   - Role-based access within licensed modules

### Data Models

```typescript
// Core customer identity
Contact {
  id: string
  customerId: string
  firstName: string
  lastName: string
  email: string
  // ... other fields
}

// Module-specific data
Opportunity { /* Sales module */ }
Case { /* Service module */ }
MarketingCampaign { /* Marketing module */ }
PortalActivity { /* Portal module */ }

// License management
ModuleLicense {
  moduleName: 'sales' | 'service' | 'marketing' | 'portal'
  isActive: boolean
  expiresAt?: Date
  features?: Json
}
```

## Features

### 🔐 Multi-Tenant Security
- **Tenant Isolation**: All data queries are scoped to the current tenant
- **RBAC Enforcement**: Role-based access control at module and data level
- **License Validation**: Only shows data from modules the tenant has licensed

### 🧩 Modular Design
- **Module Separation**: Each module (Sales, Service, Marketing, Portal) has its own data models
- **License-Based Access**: Users only see data from modules their tenant has purchased
- **Role-Based Permissions**: Different roles have different access levels within modules

### 📊 Unified Data View
- **Cross-Module Aggregation**: Combines data from all accessible modules
- **Normalized Output**: Consistent data structure regardless of source module
- **Real-Time Updates**: Reflects current state across all modules

### 🎯 User-Centric Design
- **Contact-Based Identity**: Uses contactId as the primary key across all modules
- **Seamless Navigation**: No app launcher needed - unified view of all customer data
- **Contextual Information**: Shows relevant data based on user's role and permissions

## Usage

### GraphQL Query

```graphql
query GetCustomer360($input: Customer360Input!) {
  customer360(input: $input) {
    id
    fullName
    email
    phone
    title
    department
    
    # Sales module data (if licensed)
    opportunities {
      id
      name
      amount
      stage
      probability
      expectedCloseDate
    }
    
    # Service module data (if licensed)
    cases {
      id
      caseNumber
      subject
      priority
      status
      assignedTo
    }
    
    # Marketing module data (if licensed)
    marketingCampaigns {
      id
      name
      type
      status
      startDate
      endDate
    }
    
    # Portal module data (if licensed)
    portalActivity {
      id
      activityType
      description
      createdAt
    }
  }
}
```

### Example Usage

```typescript
// Query with variables
const result = await graphqlClient.query({
  query: GET_CUSTOMER_360,
  variables: {
    input: {
      id: "contact-123"
    }
  }
});

// Result includes only data from modules user has access to
console.log(result.data.customer360);
```

## Security & Compliance

### 🔒 Access Control Matrix

| Role | Sales | Service | Marketing | Portal |
|------|-------|---------|-----------|---------|
| admin | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| sales_manager | ✅ Full | ❌ None | ❌ None | ❌ None |
| sales_rep | ✅ Read | ❌ None | ❌ None | ❌ None |
| service_manager | ❌ None | ✅ Full | ❌ None | ❌ None |
| service_rep | ❌ None | ✅ Read | ❌ None | ❌ None |
| marketing_manager | ❌ None | ❌ None | ✅ Full | ❌ None |
| marketing_rep | ❌ None | ❌ None | ✅ Read | ❌ None |
| portal_user | ❌ None | ❌ None | ❌ None | ✅ Read |

### 🛡️ Security Features

1. **Tenant Isolation**: All queries include tenantId filter
2. **Role-Based Access**: Module access controlled by user roles
3. **License Validation**: Only licensed modules return data
4. **Data Sanitization**: Sensitive data filtered based on permissions
5. **Audit Trail**: All access logged for compliance

### 📋 Compliance Standards

- **SOC 2 Type II**: Multi-tenant data isolation
- **NIST 800-53**: Role-based access control
- **GDPR**: Data minimization and purpose limitation
- **ISO 27001**: Information security management

## Module Integration

### Adding New Modules

1. **Create Module Models**:
```typescript
// New module data model
model NewModuleData {
  id: string
  contactId: string
  contact: Contact @relation(fields: [contactId], references: [id])
  // ... module-specific fields
  tenantId: string
  tenant: Tenant @relation(fields: [tenantId], references: [id])
}
```

2. **Update Service Logic**:
```typescript
// In Customer360Service.aggregateModuleData()
if (moduleAccess.newModule) {
  aggregationPromises.push(
    this.prisma.newModuleData.findMany({
      where: { contactId, tenantId },
      orderBy: { createdAt: 'desc' },
    })
  );
}
```

3. **Add DTO**:
```typescript
@ObjectType()
export class NewModuleDataDto {
  @Field(() => ID)
  id!: string;
  // ... module-specific fields
}
```

4. **Update Role Access Rules**:
```typescript
const moduleAccessRules: Record<string, string[]> = {
  'newModule': ['new_module_role', 'admin'],
};
```

### Module License Management

```typescript
// Create module license
await prisma.moduleLicense.create({
  data: {
    tenantId: 'tenant-1',
    moduleName: 'newModule',
    isActive: true,
    features: { premium: true, api: true },
  },
});

// Check module access
const hasAccess = await customer360Service.validateModuleAccess(
  userId,
  tenantId,
  'newModule'
);
```

## Performance Considerations

### 🚀 Optimization Strategies

1. **Parallel Queries**: Module data fetched concurrently
2. **Selective Loading**: Only load modules user has access to
3. **Caching**: Redis cache for frequently accessed data
4. **Pagination**: Large datasets paginated for performance
5. **Indexing**: Database indexes on contactId and tenantId

### 📈 Scalability

- **Horizontal Scaling**: Stateless service design
- **Database Sharding**: Tenant-based data distribution
- **CDN Integration**: Static data caching
- **Load Balancing**: Multiple service instances

## Testing

### Unit Tests

```bash
# Run Customer360Service tests
npm test customer360.service.spec.ts

# Run with coverage
npm test -- --coverage customer360
```

### Integration Tests

```bash
# Test GraphQL queries
npm test customer360.resolver.spec.ts

# Test with real database
npm run test:e2e customer360
```

### Test Scenarios

1. **Module Access Control**: Verify only licensed modules return data
2. **Role-Based Permissions**: Test different role access levels
3. **Tenant Isolation**: Ensure cross-tenant data isolation
4. **Data Aggregation**: Verify correct data combination
5. **Error Handling**: Test invalid inputs and edge cases

## Monitoring & Observability

### 📊 Metrics

- **Query Performance**: Response times by module
- **Access Patterns**: Most accessed customer profiles
- **License Usage**: Module access frequency
- **Error Rates**: Failed queries and reasons

### 🔍 Logging

```typescript
// Structured logging for compliance
logger.info('Customer360View accessed', {
  contactId,
  userId,
  tenantId,
  modulesAccessed: ['sales', 'service'],
  accessTime: new Date(),
});
```

### 📈 Dashboards

- **Real-time Usage**: Active users and queries
- **Performance Metrics**: Response times and throughput
- **Security Events**: Access violations and alerts
- **Business Intelligence**: Module usage analytics

## Future Enhancements

### 🚀 Planned Features

1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Filtering**: Complex query capabilities
3. **Data Export**: PDF/Excel export functionality
4. **Custom Dashboards**: User-configurable views
5. **AI Insights**: Predictive analytics integration

### 🔧 Technical Improvements

1. **GraphQL Subscriptions**: Real-time data streaming
2. **Advanced Caching**: Redis cluster for high availability
3. **Microservice Architecture**: Module-specific services
4. **API Versioning**: Backward-compatible changes
5. **Performance Optimization**: Query optimization and indexing

## Troubleshooting

### Common Issues

1. **No Data Returned**: Check module licenses and user roles
2. **Performance Issues**: Verify database indexes and query optimization
3. **Permission Errors**: Validate user roles and module access
4. **Tenant Isolation**: Ensure proper tenant context

### Debug Mode

```typescript
// Enable debug logging
const debugResult = await customer360Service.aggregateCustomerView(
  contactId,
  user,
  tenant,
  { debug: true }
);
```

## Support

For questions or issues with the Customer360View feature:

1. **Documentation**: Check this README and inline code comments
2. **Tests**: Review test cases for usage examples
3. **Logs**: Check application logs for error details
4. **Team**: Contact the backend development team

---

*This feature is the anchor of our platform's user-centric design and scales with additional modules.* 