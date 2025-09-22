#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

// Generate TypeScript SDK from OpenAPI spec
async function generateSDK() {
  console.log('🔧 Generating TypeScript SDK...');

  const sdkContent = `// Auto-generated TypeScript SDK for CRM License System
// Generated from OpenAPI spec at /api

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LicenseCheckQuery {
  userId: string;
  tenantId: string;
  licenseType: 'SMART_SERVICE' | 'SMART_SALES' | 'SMART_GRANTS';
}

export interface AssignLicenseRequest {
  userId: string;
  tenantId: string;
  licenseType: 'SMART_SERVICE' | 'SMART_SALES' | 'SMART_GRANTS';
  roleId: string;
  expiresAt?: string;
  assignedBy?: string;
  notes?: string;
}

export interface AssignLicenseWithOverrideRequest extends AssignLicenseRequest {
  reason: string;
}

export interface RevokeLicenseRequest {
  userId: string;
  tenantId: string;
  licenseType: 'SMART_SERVICE' | 'SMART_SALES' | 'SMART_GRANTS';
}

export interface RenewLicenseRequest {
  userId: string;
  tenantId: string;
  licenseType: 'SMART_SERVICE' | 'SMART_SALES' | 'SMART_GRANTS';
  expiresAt: string;
}

export interface CreateTenantLicenseRequest {
  tenantId: string;
  licenseType: 'SMART_SERVICE' | 'SMART_SALES' | 'SMART_GRANTS';
  status: string;
  activatedAt: string;
  expiresAt?: string;
  metadata?: any;
  totalSeats?: number;
}

export interface LicenseResponse {
  id: string;
  userId: string;
  tenantLicenseId: string;
  roleId: string;
  status: 'active' | 'expired' | 'suspended';
  assignedAt: string;
  expiresAt?: string;
  assignedBy?: string;
  notes?: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  tenantLicense: {
    id: string;
    licenseType: 'SMART_SERVICE' | 'SMART_SALES' | 'SMART_GRANTS';
    status: string;
    totalSeats?: number;
    tenant: {
      id: string;
      name: string;
    };
  };
  role: {
    id: string;
    name: string;
  };
}

export interface SeatUsageResponse {
  licenseType: 'SMART_SERVICE' | 'SMART_SALES' | 'SMART_GRANTS';
  totalSeats?: number;
  activeSeats: number;
  availableSeats?: number;
  usagePercentage?: number;
  status: string;
  expiresAt?: string;
}

export interface ExpiringLicenseResponse {
  day: string;
  count: number;
  licenses: Array<{
    userId: string;
    userEmail: string;
    userName?: string;
    licenseType: 'SMART_SERVICE' | 'SMART_SALES' | 'SMART_GRANTS';
    tenantId: string;
    roleName: string;
    expiresAt: string;
  }>;
}

export interface LicenseHealthResponse {
  status: 'healthy' | 'warning' | 'critical';
  licenseType: 'SMART_SERVICE' | 'SMART_SALES' | 'SMART_GRANTS';
  totalSeats: number;
  activeSeats: number;
  availableSeats: number;
  usagePercentage: number;
  daysUntilExpiration?: number;
  lastChecked: string;
}

export interface LicenseSummaryResponse {
  totalTenants: number;
  totalLicenses: number;
  totalActiveSeats: number;
  totalAvailableSeats: number;
  overallUsagePercentage: number;
  licensesExpiringSoon: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface ErrorResponse {
  code: string;
  message: string;
  detail?: string;
  timestamp: string;
}

export class CrmLicenseSDK {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string, authToken?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.authToken = authToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = \`\${this.baseUrl}\${endpoint}\`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = \`Bearer \${this.authToken}\`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || \`HTTP \${response.status}\`);
    }

    return response.json();
  }

  // License Management
  async checkUserLicense(query: LicenseCheckQuery): Promise<LicenseResponse> {
    const params = new URLSearchParams({
      userId: query.userId,
      tenantId: query.tenantId,
      licenseType: query.licenseType,
    });
    return this.request<LicenseResponse>(\`/licenses/check?\${params}\`);
  }

  async assignLicense(data: AssignLicenseRequest): Promise<{ success: boolean; license: LicenseResponse }> {
    return this.request<{ success: boolean; license: LicenseResponse }>('/licenses/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assignLicenseWithOverride(data: AssignLicenseWithOverrideRequest): Promise<{ success: boolean; license: LicenseResponse }> {
    return this.request<{ success: boolean; license: LicenseResponse }>('/licenses/assign/override', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeLicense(data: RevokeLicenseRequest): Promise<{ success: boolean; result: any }> {
    return this.request<{ success: boolean; result: any }>('/licenses/revoke', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async renewLicense(data: RenewLicenseRequest): Promise<{ success: boolean; license: LicenseResponse }> {
    return this.request<{ success: boolean; license: LicenseResponse }>('/licenses/renew', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Tenant Management
  async getTenantLicenses(tenantId: string): Promise<{ licenses: LicenseResponse[] }> {
    return this.request<{ licenses: LicenseResponse[] }>(\`/licenses/tenant/\${tenantId}\`);
  }

  async createTenantLicense(data: CreateTenantLicenseRequest): Promise<{ success: boolean; license: any }> {
    return this.request<{ success: boolean; license: any }>('/licenses/tenant', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Usage & Analytics
  async getSeatUsage(tenantId: string): Promise<{ seats: SeatUsageResponse[] }> {
    return this.request<{ seats: SeatUsageResponse[] }>(\`/licenses/seats/\${tenantId}\`);
  }

  async getAllSeatUsage(): Promise<{ seats: SeatUsageResponse[] }> {
    return this.request<{ seats: SeatUsageResponse[] }>('/licenses/seats');
  }

  async getExpiringLicenses(days: number = 90): Promise<{ expiring: ExpiringLicenseResponse[] }> {
    return this.request<{ expiring: ExpiringLicenseResponse[] }>(\`/licenses/expiring?days=\${days}\`);
  }

  // Health & Monitoring
  async getLicenseHealth(tenantId: string, licenseType: 'SMART_SERVICE' | 'SMART_SALES' | 'SMART_GRANTS'): Promise<LicenseHealthResponse> {
    const params = new URLSearchParams({
      tenantId,
      licenseType,
    });
    return this.request<LicenseHealthResponse>(\`/health/license?\${params}\`);
  }

  async getLicenseSummary(): Promise<LicenseSummaryResponse> {
    return this.request<LicenseSummaryResponse>('/health/license/summary');
  }

  // Maintenance
  async expireLicenses(): Promise<{ success: boolean; expiredCount: number }> {
    return this.request<{ success: boolean; expiredCount: number }>('/licenses/maintenance/expire', {
      method: 'POST',
    });
  }

  // User Management
  async getUserLicenses(tenantId: string): Promise<{ licenses: LicenseResponse[] }> {
    return this.request<{ licenses: LicenseResponse[] }>(\`/licenses/user/\${tenantId}\`);
  }

  async validateAccess(tenantId: string): Promise<{ valid: boolean }> {
    return this.request<{ valid: boolean }>(\`/licenses/validate/\${tenantId}\`);
  }

  // Service Module (requires SMART_SERVICE license)
  async getServiceTickets(): Promise<any> {
    return this.request<any>('/service/tickets');
  }

  async createServiceTicket(data: any): Promise<any> {
    return this.request<any>('/service/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getServiceCases(): Promise<any> {
    return this.request<any>('/service/cases');
  }

  // Sales Module (requires SMART_SALES license)
  async getSalesOpportunities(): Promise<any> {
    return this.request<any>('/sales/opportunities');
  }

  async createSalesOpportunity(data: any): Promise<any> {
    return this.request<any>('/sales/opportunities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSalesLeads(): Promise<any> {
    return this.request<any>('/sales/leads');
  }
}

// Usage example:
/*
const sdk = new CrmLicenseSDK('https://your-api.azurewebsites.net', 'your-auth-token');

// Check user license
const license = await sdk.checkUserLicense({
  userId: 'user-id',
  tenantId: 'tenant-id',
  licenseType: 'SMART_SERVICE'
});

// Assign license
const result = await sdk.assignLicense({
  userId: 'user-id',
  tenantId: 'tenant-id',
  licenseType: 'SMART_SERVICE',
  roleId: 'role-id',
  expiresAt: '2025-12-31T23:59:59Z'
});

// Get seat usage
const usage = await sdk.getSeatUsage('tenant-id');

// Get health status
const health = await sdk.getLicenseHealth('tenant-id', 'SMART_SERVICE');
*/
`;

  const sdkPath = path.join(__dirname, '..', 'libs', 'sdk', 'crm-license-sdk.ts');
  const sdkDir = path.dirname(sdkPath);
  
  if (!fs.existsSync(sdkDir)) {
    fs.mkdirSync(sdkDir, { recursive: true });
  }

  fs.writeFileSync(sdkPath, sdkContent);
  console.log('✅ TypeScript SDK generated at:', sdkPath);

  // Generate package.json for the SDK
  const packageJson = {
    name: '@crm-builder/license-sdk',
    version: '1.0.0',
    description: 'TypeScript SDK for CRM License System',
    main: 'crm-license-sdk.ts',
    types: 'crm-license-sdk.ts',
    scripts: {
      build: 'tsc',
      test: 'jest'
    },
    dependencies: {},
    devDependencies: {
      typescript: '^5.1.3',
      '@types/node': '^20.3.1'
    },
    peerDependencies: {
      typescript: '>=4.0.0'
    }
  };

  const packagePath = path.join(sdkDir, 'package.json');
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Package.json generated for SDK');

  // Generate README
  const readmeContent = `# CRM License System TypeScript SDK

Auto-generated TypeScript SDK for the CRM License System API.

## Installation

\`\`\`bash
npm install @crm-builder/license-sdk
\`\`\`

## Usage

\`\`\`typescript
import { CrmLicenseSDK } from '@crm-builder/license-sdk';

const sdk = new CrmLicenseSDK('https://your-api.azurewebsites.net', 'your-auth-token');

// Check user license
const license = await sdk.checkUserLicense({
  userId: 'user-id',
  tenantId: 'tenant-id',
  licenseType: 'SMART_SERVICE'
});

// Assign license
const result = await sdk.assignLicense({
  userId: 'user-id',
  tenantId: 'tenant-id',
  licenseType: 'SMART_SERVICE',
  roleId: 'role-id',
  expiresAt: '2025-12-31T23:59:59Z'
});

// Get seat usage
const usage = await sdk.getSeatUsage('tenant-id');

// Get health status
const health = await sdk.getLicenseHealth('tenant-id', 'SMART_SERVICE');
\`\`\`

## API Documentation

Visit \`https://your-api.azurewebsites.net/api\` for complete OpenAPI documentation.

## License

MIT
`;

  const readmePath = path.join(sdkDir, 'README.md');
  fs.writeFileSync(readmePath, readmeContent);
  console.log('✅ README generated for SDK');

  console.log('🎉 SDK generation complete!');
  console.log('📁 SDK location:', sdkPath);
  console.log('📖 OpenAPI docs available at: /api');
}

generateSDK().catch(console.error);
