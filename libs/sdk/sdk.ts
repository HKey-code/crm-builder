import type { paths } from './types';

// Type definitions for common request/response patterns
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type LicenseType = 'SMART_SERVICE' | 'SMART_SALES' | 'SMART_GRANTS';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export type SeatStatus = 'active' | 'expired' | 'suspended';

// Extract types from OpenAPI spec
export type LicenseResponse = paths['/licenses/check']['get']['responses']['200']['content']['application/json'];
export type AssignLicenseRequest = paths['/licenses/assign']['post']['requestBody']['content']['application/json'];
export type AssignLicenseResponse = paths['/licenses/assign']['post']['responses']['200']['content']['application/json'];
export type SeatUsageResponse = paths['/licenses/seats/{tenantId}']['get']['responses']['200']['content']['application/json'];
export type LicenseHealthResponse = paths['/health/license']['get']['responses']['200']['content']['application/json'];
export type LicenseSummaryResponse = paths['/health/license/summary']['get']['responses']['200']['content']['application/json'];

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
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // License Management
  async checkUserLicense(params: {
    userId: string;
    tenantId: string;
    licenseType: LicenseType;
  }): Promise<LicenseResponse> {
    const queryParams = new URLSearchParams({
      userId: params.userId,
      tenantId: params.tenantId,
      licenseType: params.licenseType,
    });
    return this.request<LicenseResponse>(`/licenses/check?${queryParams}`);
  }

  async assignLicense(data: AssignLicenseRequest): Promise<AssignLicenseResponse> {
    return this.request<AssignLicenseResponse>('/licenses/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assignLicenseWithOverride(data: AssignLicenseRequest & { reason: string }): Promise<AssignLicenseResponse> {
    return this.request<AssignLicenseResponse>('/licenses/assign/override', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeLicense(data: {
    userId: string;
    tenantId: string;
    licenseType: LicenseType;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/licenses/revoke', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async renewLicense(data: {
    userId: string;
    tenantId: string;
    licenseType: LicenseType;
    expiresAt: string;
  }): Promise<AssignLicenseResponse> {
    return this.request<AssignLicenseResponse>('/licenses/renew', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Tenant Management
  async getTenantLicenses(tenantId: string): Promise<{ licenses: LicenseResponse[] }> {
    return this.request<{ licenses: LicenseResponse[] }>(`/licenses/tenant/${tenantId}`);
  }

  async createTenantLicense(data: {
    tenantId: string;
    licenseType: LicenseType;
    status: string;
    activatedAt: string;
    expiresAt?: string;
    metadata?: any;
    totalSeats?: number;
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>('/licenses/tenant', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Usage & Analytics
  async getSeatUsage(tenantId: string): Promise<SeatUsageResponse> {
    return this.request<SeatUsageResponse>(`/licenses/seats/${tenantId}`);
  }

  async getAllSeatUsage(): Promise<SeatUsageResponse> {
    return this.request<SeatUsageResponse>('/licenses/seats');
  }

  async getExpiringLicenses(days: number = 90): Promise<{
    expiring: Array<{
      day: string;
      count: number;
      licenses: Array<{
        userId: string;
        userEmail: string;
        userName?: string;
        licenseType: LicenseType;
        tenantId: string;
        roleName: string;
        expiresAt: string;
      }>;
    }>;
  }> {
    return this.request(`/licenses/expiring?days=${days}`);
  }

  // Health & Monitoring
  async getLicenseHealth(tenantId: string, licenseType: LicenseType): Promise<LicenseHealthResponse> {
    const queryParams = new URLSearchParams({
      tenantId,
      licenseType,
    });
    return this.request<LicenseHealthResponse>(`/health/license?${queryParams}`);
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
    return this.request<{ licenses: LicenseResponse[] }>(`/licenses/user/${tenantId}`);
  }

  async validateAccess(tenantId: string): Promise<{ valid: boolean }> {
    return this.request<{ valid: boolean }>(`/licenses/validate/${tenantId}`);
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

  // Guardrails
  async getDashboardData(): Promise<any> {
    return this.request<any>('/guardrails/dashboard');
  }

  async getSeatUsageMetrics(): Promise<any> {
    return this.request<any>('/guardrails/seats');
  }

  async getGuardrailConfig(): Promise<any> {
    return this.request<any>('/guardrails/config');
  }

  // Monitoring
  async getSLOStatus(): Promise<any> {
    return this.request<any>('/monitoring/slo/status');
  }

  async getSLOMetrics(): Promise<any> {
    return this.request<any>('/monitoring/slo/metrics');
  }

  // GDPR
  async anonymizeUser(userId: string): Promise<any> {
    return this.request<any>(`/gdpr/anonymize/${userId}`, {
      method: 'POST',
    });
  }

  async getDataRetentionStatus(): Promise<any> {
    return this.request<any>('/gdpr/retention/status');
  }
}

// Export types for consumers
export type { paths } from './types';
