import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { SLOService } from './slo.service';
import { AuditService } from '../audit/audit.service';

export interface ProbeResult {
  success: boolean;
  latency: number;
  errorMessage?: string;
  timestamp: Date;
  endpoint: string;
  userId: string;
  tenantId: string;
  licenseType: string;
}

export interface ProbeConfig {
  userId: string;
  tenantId: string;
  licenseType: string;
  endpoint: string;
  expectedStatus: number;
  timeoutMs: number;
}

@Injectable()
export class SyntheticProbeService {
  private readonly logger = new Logger(SyntheticProbeService.name);
  private readonly probeResults: ProbeResult[] = [];
  private readonly maxResultsHistory = 100; // Keep last 100 results

  // Default probe configurations
  private readonly defaultProbes: ProbeConfig[] = [
    {
      userId: 'probe@system.com', // Use email as identifier
      tenantId: 'SYSTEM-PROBE-TENANT',
      licenseType: 'SMART_SERVICE',
      endpoint: '/health/license',
      expectedStatus: 200,
      timeoutMs: 5000,
    },
    {
      userId: 'probe@system.com', // Use email as identifier
      tenantId: 'SYSTEM-PROBE-TENANT',
      licenseType: 'SMART_SALES',
      endpoint: '/health/license',
      expectedStatus: 200,
      timeoutMs: 5000,
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly sloService: SLOService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Run synthetic probe tests
   */
  async runProbes(): Promise<ProbeResult[]> {
    this.logger.log('🔍 Starting synthetic probe tests...');
    
    const results: ProbeResult[] = [];
    
    for (const probe of this.defaultProbes) {
      try {
        const result = await this.runSingleProbe(probe);
        results.push(result);
        
        // Store result
        this.probeResults.push(result);
        if (this.probeResults.length > this.maxResultsHistory) {
          this.probeResults.splice(0, this.probeResults.length - this.maxResultsHistory);
        }

        // Log result
        if (result.success) {
          this.logger.log(`✅ Probe passed: ${result.endpoint} (${result.latency}ms)`);
        } else {
          this.logger.warn(`❌ Probe failed: ${result.endpoint} - ${result.errorMessage}`);
        }

        // Check for consecutive failures
        await this.checkConsecutiveFailures(probe);

      } catch (error) {
        this.logger.error(`💥 Probe error for ${probe.endpoint}: ${error.message}`);
        
        const failedResult: ProbeResult = {
          success: false,
          latency: 0,
          errorMessage: error.message,
          timestamp: new Date(),
          endpoint: probe.endpoint,
          userId: probe.userId,
          tenantId: probe.tenantId,
          licenseType: probe.licenseType,
        };
        
        results.push(failedResult);
        this.probeResults.push(failedResult);
      }
    }

    this.logger.log(`📊 Probe summary: ${results.filter(r => r.success).length}/${results.length} passed`);
    return results;
  }

  /**
   * Run a single probe test
   */
  private async runSingleProbe(config: ProbeConfig): Promise<ProbeResult> {
    const startTime = Date.now();
    
    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email: config.userId },
        select: { id: true },
      });

      if (!user) {
        return {
          success: false,
          latency: Date.now() - startTime,
          errorMessage: 'Probe user not found',
          timestamp: new Date(),
          endpoint: config.endpoint,
          userId: config.userId,
          tenantId: config.tenantId,
          licenseType: config.licenseType,
        };
      }

      // Find tenant by name
      const tenant = await this.prisma.tenant.findUnique({
        where: { name: config.tenantId },
        select: { id: true },
      });

      if (!tenant) {
        return {
          success: false,
          latency: Date.now() - startTime,
          errorMessage: 'Probe tenant not found',
          timestamp: new Date(),
          endpoint: config.endpoint,
          userId: config.userId,
          tenantId: config.tenantId,
          licenseType: config.licenseType,
        };
      }

      // Simulate license check by querying the database
      const licenseCheck = await this.prisma.userTenantLicense.findFirst({
        where: {
          userId: user.id,
          status: 'active',
          expiresAt: { gt: new Date() },
          tenantLicense: {
            tenantId: tenant.id,
            licenseType: config.licenseType as any,
            status: 'active',
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
        select: { id: true, roleId: true },
      });

      const latency = Date.now() - startTime;
      
      if (!licenseCheck) {
        return {
          success: false,
          latency,
          errorMessage: 'License not found or expired',
          timestamp: new Date(),
          endpoint: config.endpoint,
          userId: config.userId,
          tenantId: config.tenantId,
          licenseType: config.licenseType,
        };
      }

      // Simulate health check response
      const healthResponse = await this.simulateHealthCheck(config);
      
      return {
        success: healthResponse.success,
        latency,
        errorMessage: healthResponse.errorMessage,
        timestamp: new Date(),
        endpoint: config.endpoint,
        userId: config.userId,
        tenantId: config.tenantId,
        licenseType: config.licenseType,
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        success: false,
        latency,
        errorMessage: error.message,
        timestamp: new Date(),
        endpoint: config.endpoint,
        userId: config.userId,
        tenantId: config.tenantId,
        licenseType: config.licenseType,
      };
    }
  }

  /**
   * Simulate health check endpoint
   */
  private async simulateHealthCheck(config: ProbeConfig): Promise<{ success: boolean; errorMessage?: string }> {
    try {
      // Check if the system is healthy by running a basic license validation
      const user = await this.prisma.user.findUnique({
        where: { email: config.userId },
        select: { id: true, isSystemUser: true },
      });

      if (!user) {
        return { success: false, errorMessage: 'Probe user not found' };
      }

      // Check SLO status
      const sloStatus = await this.sloService.getSLOStatus();
      
      if (!sloStatus.isHealthy) {
        return { success: false, errorMessage: 'SLO thresholds exceeded' };
      }

      return { success: true };
    } catch (error) {
      return { success: false, errorMessage: error.message };
    }
  }

  /**
   * Check for consecutive failures and trigger alerts
   */
  private async checkConsecutiveFailures(config: ProbeConfig): Promise<void> {
    const recentResults = this.probeResults
      .filter(r => r.endpoint === config.endpoint)
      .slice(-3); // Last 3 results

    const failures = recentResults.filter(r => !r.success);
    
    if (failures.length >= 2) {
      this.logger.error(`🚨 ALERT: ${failures.length} consecutive probe failures for ${config.endpoint}`);
      
      // Create alert
      await this.createProbeAlert(config, failures);
      
      // Log to audit trail
      await this.auditService.logEvent({
        actorId: 'system',
        action: 'SYNTHETIC_PROBE_FAILURE',
        targetType: 'HealthCheck',
        targetId: config.endpoint,
      });
    }
  }

  /**
   * Create probe alert
   */
  private async createProbeAlert(config: ProbeConfig, failures: ProbeResult[]): Promise<void> {
    const alertMessage = `Synthetic probe failed ${failures.length} consecutive times for ${config.endpoint}`;
    
    // Store alert in database
    await this.prisma.sLOAlert.create({
      data: {
        type: 'SYNTHETIC_PROBE_FAILURE',
        message: alertMessage,
        severity: 'CRITICAL',
        timestamp: new Date(),
        metrics: {
          endpoint: config.endpoint,
          userId: config.userId,
          tenantId: config.tenantId,
          licenseType: config.licenseType,
          failureCount: failures.length,
          lastFailure: failures[failures.length - 1],
        },
      },
    });

    this.logger.error(`🚨 CRITICAL ALERT: ${alertMessage}`);
  }

  /**
   * Get probe statistics
   */
  async getProbeStats(): Promise<{
    totalProbes: number;
    successfulProbes: number;
    failedProbes: number;
    successRate: number;
    averageLatency: number;
    recentResults: ProbeResult[];
  }> {
    const totalProbes = this.probeResults.length;
    const successfulProbes = this.probeResults.filter(r => r.success).length;
    const failedProbes = totalProbes - successfulProbes;
    const successRate = totalProbes > 0 ? successfulProbes / totalProbes : 1;
    
    const latencies = this.probeResults.map(r => r.latency);
    const averageLatency = latencies.length > 0 
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length 
      : 0;

    return {
      totalProbes,
      successfulProbes,
      failedProbes,
      successRate,
      averageLatency,
      recentResults: this.probeResults.slice(-10), // Last 10 results
    };
  }

  /**
   * Get probe results for a time range
   */
  async getProbeResults(startTime: Date, endTime: Date): Promise<ProbeResult[]> {
    return this.probeResults.filter(r => 
      r.timestamp >= startTime && r.timestamp <= endTime
    );
  }

  /**
   * Add custom probe configuration
   */
  async addProbe(config: ProbeConfig): Promise<void> {
    this.defaultProbes.push(config);
    this.logger.log(`➕ Added custom probe: ${config.endpoint}`);
  }

  /**
   * Remove probe configuration
   */
  async removeProbe(endpoint: string): Promise<void> {
    const index = this.defaultProbes.findIndex(p => p.endpoint === endpoint);
    if (index !== -1) {
      this.defaultProbes.splice(index, 1);
      this.logger.log(`➖ Removed probe: ${endpoint}`);
    }
  }

  /**
   * Clear probe results history
   */
  async clearProbeHistory(): Promise<void> {
    this.probeResults.length = 0;
    this.logger.log('🧹 Cleared probe results history');
  }

  /**
   * Scheduled probe execution (hourly)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledProbeExecution(): Promise<void> {
    this.logger.log('⏰ Running scheduled synthetic probes...');
    await this.runProbes();
  }

  /**
   * Manual probe execution
   */
  async runManualProbe(): Promise<ProbeResult[]> {
    this.logger.log('🔧 Running manual synthetic probes...');
    return await this.runProbes();
  }
}
