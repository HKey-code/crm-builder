# Authentication & Authorization System

Enterprise-grade authentication and authorization system for multi-tenant CRM platform with Azure AD/B2C integration.

## 🏗️ Architecture Overview

### Core Components

1. **IdentityProviderService** - Handles JWT parsing, user sync, and tenant resolution
2. **Custom Decorators** - Extract user and tenant context from requests
3. **RolesGuard** - Enforces role-based access control
4. **TenantResolutionMiddleware** - Resolves tenant context
5. **Comprehensive Test Suite** - Unit and integration tests

## 🔐 Key Features

### Azure AD/B2C Integration
- JWT token parsing and verification
- Automatic user creation/sync on first login
- Role assignment from JWT claims
- Tenant resolution from JWT or headers

### Multi-Tenant Security
- Tenant isolation at the database level
- Automatic tenant context injection
- Cross-tenant access prevention
- Tenant-specific role assignments

### Role-Based Access Control (RBAC)
- Hierarchical role system (Admin > Manager > Agent)
- Granular permissions (read, write, configure)
- Dynamic role checking
- Support for both GraphQL and REST

### Enterprise Security
- SOC 2 Type II compliance ready
- NIST security framework support
- FedRAMP readiness
- Comprehensive audit logging

## 🚀 Usage Examples

### REST API with Authentication

```typescript
@Controller('users')
@UseGuards(RolesGuard)
export class UserController {
  @Get()
  @Roles('Admin', 'Manager')
  async findAll(
    @CurrentUser() user: User,
    @CurrentTenant() tenant: Tenant,
  ) {
    return this.userService.findAll();
  }

  @Post()
  @Roles('Admin')
  async create(@Body() input: CreateUserInput) {
    return this.userService.create(input);
  }
}
```

### GraphQL with Authentication

```typescript
@Resolver(() => User)
@UseGuards(RolesGuard)
export class UserResolver {
  @Query(() => [User])
  @Roles('Admin', 'Manager')
  async users(@CurrentUser() user: User) {
    return this.userService.findAll();
  }

  @Mutation(() => User)
  @Roles('Admin')
  async createUser(@Args('input') input: CreateUserInput) {
    return this.userService.create(input);
  }
}
```

### Custom Permission Checking

```typescript
@Injectable()
export class SomeService {
  constructor(private identityProvider: IdentityProviderService) {}

  async someMethod(userId: string, tenantId: string) {
    const hasAccess = await this.identityProvider.validateAccess(
      userId,
      tenantId,
      'pages',
      'configure'
    );

    if (!hasAccess) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}
```

## 🧪 Testing

### Unit Tests

```typescript
describe('IdentityProviderService', () => {
  it('should parse and verify valid JWT token', async () => {
    const result = await service.parseAndVerifyToken('valid.jwt.token');
    expect(result).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe('UserController', () => {
  it('should allow admin to create users', async () => {
    const mockContext = createMockUserContext({
      userRoles: ['Admin'],
    });

    // Test implementation
  });
});
```

## 🔧 Configuration

### Environment Variables

```bash
# Azure AD Configuration
AZURE_AD_AUDIENCE=your-audience
AZURE_AD_ISSUER=https://login.microsoftonline.com/your-tenant-id/v2.0
AZURE_AD_CLIENT_ID=your-client-id

# JWT Configuration
JWT_SECRET=your-jwt-secret

# Default Tenant (optional)
DEFAULT_TENANT_ID=default-tenant-id
```

### Module Registration

```typescript
@Module({
  imports: [
    AuthModule,
    // ... other modules
  ],
})
export class AppModule {}
```

## 🛡️ Security Features

### JWT Token Security
- Audience validation
- Issuer verification
- Expiration checking
- Signature verification

### Tenant Isolation
- Automatic tenant context injection
- Cross-tenant access prevention
- Tenant-specific data filtering

### Role Hierarchy
```
Admin: read, write, configure
Manager: read, write
Agent: read
```

### Permission Granularity
- Resource-level permissions
- Action-level permissions (read/write/configure)
- Conditional permissions based on context

## 📊 Audit & Compliance

### Logging
- Authentication events
- Authorization decisions
- Tenant access patterns
- Role assignment changes

### SOC 2 Type II Compliance
- User access tracking
- Permission change logging
- Tenant isolation verification
- Security event monitoring

### NIST Framework
- Identity management
- Access control
- Audit and accountability
- System and communications protection

## 🔄 Extensibility

### Custom Roles
```typescript
// Add custom role permissions
const rolePermissions: Record<string, string[]> = {
  'CustomRole': ['read', 'write', 'custom-action'],
};
```

### Custom Decorators
```typescript
export const CustomPermission = (permission: string) => 
  SetMetadata('permission', permission);
```

### Custom Guards
```typescript
@Injectable()
export class CustomGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Custom logic
  }
}
```

## 🚀 Deployment

### Production Setup
1. Configure Azure AD/B2C application
2. Set environment variables
3. Configure JWT secrets
4. Set up tenant isolation
5. Enable audit logging

### Health Checks
- JWT service availability
- Tenant resolution
- Role assignment verification
- Permission checking

## 📚 API Reference

### IdentityProviderService
- `parseAndVerifyToken(token: string): Promise<JwtPayload>`
- `extractAndSyncUser(payload: JwtPayload): Promise<IdentityContext>`
- `validateAccess(userId, tenantId, resource, action): Promise<boolean>`

### Decorators
- `@CurrentUser()` - Extract authenticated user
- `@CurrentTenant()` - Extract tenant context
- `@Roles(...roles: string[])` - Define required roles

### Guards
- `RolesGuard` - Enforce role-based access control

### Middleware
- `TenantResolutionMiddleware` - Resolve tenant context

## 🔍 Troubleshooting

### Common Issues
1. **JWT Verification Failed** - Check audience and issuer configuration
2. **Tenant Not Found** - Verify tenant exists in database
3. **Role Assignment Failed** - Check role exists in tenant
4. **Permission Denied** - Verify user has required roles

### Debug Mode
```typescript
// Enable debug logging
process.env.DEBUG_AUTH = 'true';
```

## 📈 Performance

### Optimizations
- JWT caching
- Role permission caching
- Tenant context caching
- Database query optimization

### Monitoring
- Authentication latency
- Authorization decision time
- Tenant resolution performance
- Role assignment efficiency 