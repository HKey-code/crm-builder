# OpenAPI → SDK Generation Pipeline

## Overview

The CRM License System includes an automated OpenAPI → TypeScript SDK generation pipeline that creates a fully typed, production-ready SDK for frontend applications and third-party integrations.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NestJS App    │───▶│  OpenAPI Spec    │───▶│ TypeScript SDK  │───▶│  NPM Package    │
│   (Controllers) │    │  (JSON Schema)   │    │  (Generated)    │    │  (Published)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components

### 1. OpenAPI Generator (`apps/backend/src/openapi-generator.ts`)
- **Purpose**: Starts NestJS app and generates OpenAPI specification
- **Output**: `openapi-spec.json` file
- **Features**:
  - Loads all controllers with `@ApiTags()` decorators
  - Generates complete OpenAPI 3.0 specification
  - Includes authentication, request/response schemas
  - Saves to root directory for SDK generation

### 2. TypeScript SDK (`libs/sdk/`)
- **Purpose**: Type-safe client library for API consumption
- **Structure**:
  ```
  libs/sdk/
  ├── sdk.ts              # Main SDK implementation
  ├── types.ts            # Generated types from OpenAPI
  ├── package.json        # NPM package configuration
  ├── tsconfig.json       # TypeScript configuration
  ├── README.md           # Documentation
  └── dist/               # Built package (generated)
  ```

### 3. Build Pipeline
- **OpenAPI Generation**: `npm run generate:openapi`
- **Type Generation**: `openapi-typescript` CLI tool
- **SDK Build**: `npm run build:sdk`
- **Package Creation**: Compiled JavaScript + TypeScript definitions

## Usage

### Local Development

```bash
# Generate OpenAPI spec
npm run generate:openapi

# Generate complete SDK
npm run generate:sdk

# Build SDK package
npm run build:sdk
```

### CI/CD Integration

The SDK generation is automatically integrated into the GitHub Actions workflow:

```yaml
# After database seeding
- name: Generate OpenAPI Specification
  run: cd apps/backend && npm run generate:openapi

- name: Generate TypeScript SDK  
  run: cd apps/backend && npm run generate:sdk

- name: Build SDK Package
  run: cd libs/sdk && npm run build

- name: Upload SDK Artifact
  uses: actions/upload-artifact@v4
  with:
    name: crm-license-sdk-${{ environment }}
    path: |
      libs/sdk/dist/
      libs/sdk/package.json
      libs/sdk/README.md
      openapi-spec.json
```

## Generated SDK Features

### Type Safety
```typescript
// All types generated from OpenAPI spec
import type { 
  LicenseResponse,
  AssignLicenseRequest,
  SeatUsageResponse 
} from '@crm-builder/license-sdk';

// Full IntelliSense support
const license: LicenseResponse = await sdk.checkUserLicense({
  userId: 'user-123',
  tenantId: 'tenant-456', 
  licenseType: 'SMART_SERVICE' // Type-safe enum
});
```

### Complete API Coverage
- ✅ **License Management** - All license CRUD operations
- ✅ **Health Monitoring** - SLO metrics and health checks
- ✅ **Cost Guardrails** - Seat usage and alerts
- ✅ **Service Module** - SMART_SERVICE endpoints
- ✅ **Sales Module** - SMART_SALES endpoints
- ✅ **GDPR Compliance** - Data retention and anonymization
- ✅ **Synthetic Probes** - Monitoring and alerting

### Authentication Support
```typescript
// Bearer token authentication
const sdk = new CrmLicenseSDK('https://api.example.com', 'jwt-token');

// Automatic token inclusion in requests
await sdk.checkUserLicense({...}); // Includes Authorization header
```

### Error Handling
```typescript
try {
  const result = await sdk.assignLicense(data);
} catch (error) {
  // Consistent error format
  console.error('API Error:', error.message);
}
```

## Package Structure

### NPM Package (`@crm-builder/license-sdk`)
```json
{
  "name": "@crm-builder/license-sdk",
  "version": "1.0.0",
  "main": "dist/sdk.js",
  "types": "dist/sdk.d.ts",
  "files": ["dist", "README.md"]
}
```

### Distribution
- **Main**: Compiled JavaScript (`dist/sdk.js`)
- **Types**: TypeScript definitions (`dist/sdk.d.ts`)
- **Documentation**: Comprehensive README
- **OpenAPI Spec**: Included for reference

## Development Workflow

### 1. API Changes
```typescript
// Add new endpoint in controller
@ApiTags('licenses')
@Controller('licenses')
export class LicenseController {
  @Post('custom')
  @ApiOperation({ summary: 'Custom license operation' })
  @ApiResponse({ status: 200, type: LicenseResponse })
  async customOperation(@Body() data: CustomRequest): Promise<LicenseResponse> {
    // Implementation
  }
}
```

### 2. Regenerate SDK
```bash
# Generate new OpenAPI spec
npm run generate:openapi

# Generate updated SDK
npm run generate:sdk

# Build updated package
npm run build:sdk
```

### 3. Test Integration
```typescript
// Test new endpoint
const result = await sdk.customOperation(data);
console.log('New endpoint works:', result);
```

## Environment-Specific SDKs

### Development
- **Artifact**: `crm-license-sdk-development`
- **Base URL**: `https://dev-api.azurewebsites.net`
- **Features**: Full debugging, probe users enabled

### Staging  
- **Artifact**: `crm-license-sdk-staging`
- **Base URL**: `https://staging-api.azurewebsites.net`
- **Features**: Production-like testing

### Production
- **Artifact**: `crm-license-sdk-production`
- **Base URL**: `https://prod-api.azurewebsites.net`
- **Features**: Optimized, no debug features

## Integration Examples

### Frontend Application
```typescript
// React/Vue/Angular integration
import { CrmLicenseSDK } from '@crm-builder/license-sdk';

const sdk = new CrmLicenseSDK(process.env.API_URL, authToken);

// Use in components
const LicenseChecker = () => {
  const [license, setLicense] = useState<LicenseResponse | null>(null);
  
  useEffect(() => {
    sdk.checkUserLicense({...}).then(setLicense);
  }, []);
  
  return <div>License: {license?.status}</div>;
};
```

### Node.js Backend
```typescript
// Server-side integration
import { CrmLicenseSDK } from '@crm-builder/license-sdk';

const sdk = new CrmLicenseSDK('https://api.example.com', serviceToken);

// License validation middleware
app.use(async (req, res, next) => {
  const license = await sdk.checkUserLicense({
    userId: req.user.id,
    tenantId: req.tenant.id,
    licenseType: 'SMART_SERVICE'
  });
  
  if (!license.valid) {
    return res.status(403).json({ error: 'License required' });
  }
  
  next();
});
```

### Monitoring Integration
```typescript
// Health monitoring
setInterval(async () => {
  try {
    const health = await sdk.getLicenseHealth('tenant-123', 'SMART_SERVICE');
    
    if (health.status === 'critical') {
      // Send alert
      await notifyTeam('License health critical', health);
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }
}, 60000);
```

## Best Practices

### 1. Version Management
- SDK version matches API version
- Semantic versioning for breaking changes
- Changelog for each release

### 2. Type Safety
- Always use generated types
- Avoid `any` types in SDK usage
- Leverage TypeScript strict mode

### 3. Error Handling
- Consistent error format across all endpoints
- Proper HTTP status codes
- Detailed error messages for debugging

### 4. Performance
- Request caching where appropriate
- Batch operations for multiple calls
- Connection pooling for high-volume usage

## Troubleshooting

### Common Issues

#### 1. OpenAPI Generation Fails
```bash
# Check if NestJS app starts correctly
cd apps/backend
npm run start:dev

# Verify database connection
npx prisma db push
```

#### 2. Type Generation Issues
```bash
# Regenerate Prisma client
npx prisma generate

# Clear TypeScript cache
rm -rf node_modules/.cache
```

#### 3. SDK Build Errors
```bash
# Check TypeScript configuration
cd libs/sdk
npx tsc --noEmit

# Verify dependencies
npm install
```

### Debug Steps

1. **Check OpenAPI Spec**: Verify `openapi-spec.json` is generated correctly
2. **Validate Types**: Ensure `libs/sdk/types.ts` contains expected types
3. **Test SDK**: Use SDK in a simple test script
4. **Check Artifacts**: Verify GitHub Actions artifacts are uploaded

## Future Enhancements

### 1. Multi-Language Support
- Generate SDKs for Python, Java, C#
- Language-specific optimizations
- Framework integrations (React hooks, Vue composables)

### 2. Advanced Features
- Request/response interceptors
- Automatic retry logic
- Rate limiting support
- WebSocket support for real-time updates

### 3. Documentation
- Auto-generated API documentation
- Interactive examples
- Integration guides for popular frameworks

## Conclusion

The OpenAPI → SDK pipeline provides:

- ✅ **Type Safety** - Full TypeScript support with generated types
- ✅ **Automation** - CI/CD integration for consistent SDK generation
- ✅ **Completeness** - All API endpoints covered
- ✅ **Maintainability** - Single source of truth from OpenAPI spec
- ✅ **Developer Experience** - Excellent IntelliSense and error handling

**Status**: ✅ **Production Ready** - Automated pipeline generates SDKs for all environments!
