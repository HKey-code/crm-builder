import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

export interface SeatUsageMetrics {
  tenantId: string;
  tenantName: string;
  licenseType: string;
  activeSeats: number;
  totalSeats: number;
  usagePercentage: number;
  lastUpdated: Date;
}

export interface GuardrailAlert {
  tenantId: string;
  tenantName: string;
  licenseType: string;
  currentUsage: number;
  threshold: number;
  alertType: 'WARNING' | 'CRITICAL';
  message: string;
  timestamp: Date;
}

export interface CostGuardrailConfig {
  warningThreshold: number; // Default: 85%
  criticalThreshold: number; // Default: 95%
  emailEnabled: boolean;
  weeklyReportEnabled: boolean;
  alertRecipients: string[];
}

@Injectable()
export class GuardrailsService {
  private readonly logger = new Logger(GuardrailsService.name);

  // Default guardrail configuration
  private readonly defaultConfig: CostGuardrailConfig = {
    warningThreshold: 85,
    criticalThreshold: 95,
    emailEnabled: true,
    weeklyReportEnabled: true,
    alertRecipients: ['admin@company.com', 'finance@company.com'],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get seat usage metrics for all tenants
   */
  async getSeatUsageMetrics(): Promise<SeatUsageMetrics[]> {
    this.logger.log('Calculating seat usage metrics for all tenants...');

    try {
      const tenantLicenses = await this.prisma.tenantLicense.findMany({
        where: {
          status: 'active',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          tenant: {
            select: {
              name: true,
            },
          },
          userLicenses: {
            where: {
              status: 'active',
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        },
      });

      const metrics: SeatUsageMetrics[] = tenantLicenses.map((tl) => {
        const activeSeats = tl.userLicenses.length;
        const totalSeats = tl.totalSeats || 0;
        const usagePercentage = totalSeats > 0 ? (activeSeats / totalSeats) * 100 : 0;

        return {
          tenantId: tl.tenantId,
          tenantName: tl.tenant.name,
          licenseType: tl.licenseType,
          activeSeats,
          totalSeats,
          usagePercentage: Math.round(usagePercentage * 100) / 100,
          lastUpdated: new Date(),
        };
      });

      this.logger.log(`Calculated metrics for ${metrics.length} tenant licenses`);
      return metrics;
    } catch (error) {
      this.logger.error(`Failed to calculate seat usage metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get seat usage metrics for a specific tenant
   */
  async getTenantSeatUsage(tenantId: string): Promise<SeatUsageMetrics[]> {
    this.logger.log(`Calculating seat usage metrics for tenant: ${tenantId}`);

    try {
      const tenantLicenses = await this.prisma.tenantLicense.findMany({
        where: {
          tenantId,
          status: 'active',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          tenant: {
            select: {
              name: true,
            },
          },
          userLicenses: {
            where: {
              status: 'active',
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        },
      });

      const metrics: SeatUsageMetrics[] = tenantLicenses.map((tl) => {
        const activeSeats = tl.userLicenses.length;
        const totalSeats = tl.totalSeats || 0;
        const usagePercentage = totalSeats > 0 ? (activeSeats / totalSeats) * 100 : 0;

        return {
          tenantId: tl.tenantId,
          tenantName: tl.tenant.name,
          licenseType: tl.licenseType,
          activeSeats,
          totalSeats,
          usagePercentage: Math.round(usagePercentage * 100) / 100,
          lastUpdated: new Date(),
        };
      });

      return metrics;
    } catch (error) {
      this.logger.error(`Failed to calculate seat usage for tenant ${tenantId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check for guardrail violations
   */
  async checkGuardrailViolations(): Promise<GuardrailAlert[]> {
    this.logger.log('Checking for guardrail violations...');

    try {
      const metrics = await this.getSeatUsageMetrics();
      const alerts: GuardrailAlert[] = [];

      for (const metric of metrics) {
        if (metric.usagePercentage >= this.defaultConfig.criticalThreshold) {
          alerts.push({
            tenantId: metric.tenantId,
            tenantName: metric.tenantName,
            licenseType: metric.licenseType,
            currentUsage: metric.usagePercentage,
            threshold: this.defaultConfig.criticalThreshold,
            alertType: 'CRITICAL',
            message: `CRITICAL: Tenant ${metric.tenantName} has reached ${metric.usagePercentage}% seat usage for ${metric.licenseType} license. Immediate action required.`,
            timestamp: new Date(),
          });
        } else if (metric.usagePercentage >= this.defaultConfig.warningThreshold) {
          alerts.push({
            tenantId: metric.tenantId,
            tenantName: metric.tenantName,
            licenseType: metric.licenseType,
            currentUsage: metric.usagePercentage,
            threshold: this.defaultConfig.warningThreshold,
            alertType: 'WARNING',
            message: `WARNING: Tenant ${metric.tenantName} has reached ${metric.usagePercentage}% seat usage for ${metric.licenseType} license. Consider expanding capacity.`,
            timestamp: new Date(),
          });
        }
      }

      this.logger.log(`Found ${alerts.length} guardrail violations`);
      return alerts;
    } catch (error) {
      this.logger.error(`Failed to check guardrail violations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send email alerts for guardrail violations
   */
  async sendGuardrailAlerts(alerts: GuardrailAlert[]): Promise<void> {
    if (!this.defaultConfig.emailEnabled || alerts.length === 0) {
      return;
    }

    this.logger.log(`Sending ${alerts.length} guardrail alerts...`);

    try {
      for (const alert of alerts) {
        await this.sendEmailAlert(alert);
        
        // Log alert for audit trail
        await this.auditService.logEvent({
          actorId: 'system',
          action: 'GUARDRAIL_ALERT_SENT',
          targetType: 'Tenant',
          targetId: alert.tenantId,
        });
      }

      this.logger.log('Guardrail alerts sent successfully');
    } catch (error) {
      this.logger.error(`Failed to send guardrail alerts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send individual email alert
   */
  private async sendEmailAlert(alert: GuardrailAlert): Promise<void> {
    // This would integrate with your email service
    // For now, we'll log the alert
    this.logger.log(`Email Alert: ${alert.message}`);
    
    // Example email integration:
    // await this.emailService.send({
    //   to: this.defaultConfig.alertRecipients,
    //   subject: `Guardrail Alert: ${alert.alertType} - ${alert.tenantName}`,
    //   body: alert.message,
    // });
  }

  /**
   * Generate weekly seat usage report
   */
  async generateWeeklyReport(): Promise<{
    reportDate: Date;
    totalTenants: number;
    totalLicenses: number;
    averageUsage: number;
    highUsageTenants: SeatUsageMetrics[];
    alerts: GuardrailAlert[];
  }> {
    this.logger.log('Generating weekly seat usage report...');

    try {
      const metrics = await this.getSeatUsageMetrics();
      const alerts = await this.checkGuardrailViolations();

      const totalTenants = new Set(metrics.map(m => m.tenantId)).size;
      const totalLicenses = metrics.length;
      const averageUsage = metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + m.usagePercentage, 0) / metrics.length 
        : 0;

      const highUsageTenants = metrics.filter(m => m.usagePercentage >= 70);

      const report = {
        reportDate: new Date(),
        totalTenants,
        totalLicenses,
        averageUsage: Math.round(averageUsage * 100) / 100,
        highUsageTenants,
        alerts,
      };

      this.logger.log(`Weekly report generated: ${totalTenants} tenants, ${totalLicenses} licenses, ${alerts.length} alerts`);

      // Log report generation for audit
      await this.auditService.logEvent({
        actorId: 'system',
        action: 'WEEKLY_REPORT_GENERATED',
        targetType: 'System',
        targetId: 'guardrails',
      });

      return report;
    } catch (error) {
      this.logger.error(`Failed to generate weekly report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send weekly report email
   */
  async sendWeeklyReport(): Promise<void> {
    if (!this.defaultConfig.weeklyReportEnabled) {
      return;
    }

    this.logger.log('Sending weekly seat usage report...');

    try {
      const report = await this.generateWeeklyReport();
      
      // Generate email content
      const emailContent = this.generateWeeklyReportEmail(report);
      
      // Send email
      await this.sendWeeklyReportEmail(emailContent);

      this.logger.log('Weekly report sent successfully');
    } catch (error) {
      this.logger.error(`Failed to send weekly report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate weekly report email content
   */
  private generateWeeklyReportEmail(report: any): string {
    const date = report.reportDate.toLocaleDateString();
    
    let content = `
Weekly Seat Usage Report - ${date}

SUMMARY:
- Total Tenants: ${report.totalTenants}
- Total Licenses: ${report.totalLicenses}
- Average Usage: ${report.averageUsage}%

HIGH USAGE TENANTS (>70%):
`;

    for (const tenant of report.highUsageTenants) {
      content += `
${tenant.tenantName} (${tenant.licenseType}):
  - Active Seats: ${tenant.activeSeats}/${tenant.totalSeats}
  - Usage: ${tenant.usagePercentage}%
`;
    }

    if (report.alerts.length > 0) {
      content += `
ALERTS:
`;
      for (const alert of report.alerts) {
        content += `- ${alert.message}
`;
      }
    }

    return content;
  }

  /**
   * Send weekly report email
   */
  private async sendWeeklyReportEmail(content: string): Promise<void> {
    // This would integrate with your email service
    this.logger.log(`Weekly Report Email Content:\n${content}`);
    
    // Example email integration:
    // await this.emailService.send({
    //   to: this.defaultConfig.alertRecipients,
    //   subject: 'Weekly Seat Usage Report',
    //   body: content,
    // });
  }

  /**
   * Get dashboard data for seat usage
   */
  async getDashboardData(): Promise<{
    totalTenants: number;
    totalLicenses: number;
    averageUsage: number;
    highUsageCount: number;
    criticalCount: number;
    recentAlerts: GuardrailAlert[];
  }> {
    this.logger.log('Generating dashboard data...');

    try {
      const metrics = await this.getSeatUsageMetrics();
      const alerts = await this.checkGuardrailViolations();

      const totalTenants = new Set(metrics.map(m => m.tenantId)).size;
      const totalLicenses = metrics.length;
      const averageUsage = metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + m.usagePercentage, 0) / metrics.length 
        : 0;

      const highUsageCount = metrics.filter(m => m.usagePercentage >= this.defaultConfig.warningThreshold).length;
      const criticalCount = metrics.filter(m => m.usagePercentage >= this.defaultConfig.criticalThreshold).length;

      // Get recent alerts (last 7 days)
      const recentAlerts = alerts.filter(a => 
        a.timestamp.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      );

      return {
        totalTenants,
        totalLicenses,
        averageUsage: Math.round(averageUsage * 100) / 100,
        highUsageCount,
        criticalCount,
        recentAlerts,
      };
    } catch (error) {
      this.logger.error(`Failed to generate dashboard data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update guardrail configuration
   */
  async updateGuardrailConfig(config: Partial<CostGuardrailConfig>): Promise<void> {
    this.logger.log('Updating guardrail configuration...');

    try {
      Object.assign(this.defaultConfig, config);

      // Log configuration change
      await this.auditService.logEvent({
        actorId: 'system',
        action: 'GUARDRAIL_CONFIG_UPDATED',
        targetType: 'System',
        targetId: 'guardrails',
      });

      this.logger.log('Guardrail configuration updated successfully');
    } catch (error) {
      this.logger.error(`Failed to update guardrail configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current guardrail configuration
   */
  getGuardrailConfig(): CostGuardrailConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Get seat usage trends for a tenant
   */
  async getSeatUsageTrends(tenantId: string, days: number = 30): Promise<{
    date: string;
    activeSeats: number;
    totalSeats: number;
    usagePercentage: number;
  }[]> {
    this.logger.log(`Getting seat usage trends for tenant ${tenantId} (${days} days)`);

    try {
      // This would typically query historical data
      // For now, we'll return current data as a placeholder
      const currentMetrics = await this.getTenantSeatUsage(tenantId);
      
      const trends = currentMetrics.map(metric => ({
        date: new Date().toISOString().split('T')[0],
        activeSeats: metric.activeSeats,
        totalSeats: metric.totalSeats,
        usagePercentage: metric.usagePercentage,
      }));

      return trends;
    } catch (error) {
      this.logger.error(`Failed to get seat usage trends: ${error.message}`);
      throw error;
    }
  }
}
