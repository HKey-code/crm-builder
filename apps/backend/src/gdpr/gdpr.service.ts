import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

export interface RetentionPolicy {
  tableName: string;
  retentionDays: number;
  softDelete: boolean;
  anonymizeOnDelete: boolean;
}

export interface AnonymizationRequest {
  userId: string;
  reason: string;
  requestedBy: string;
  anonymizeData: boolean;
  deleteData: boolean;
}

export interface GDPRConfig {
  auditLogRetentionDays: number;
  userDataRetentionDays: number;
  softDeleteEnabled: boolean;
  anonymizationEnabled: boolean;
  autoCleanupEnabled: boolean;
}

@Injectable()
export class GDPRService {
  private readonly logger = new Logger(GDPRService.name);

  // Default GDPR configuration
  private readonly defaultConfig: GDPRConfig = {
    auditLogRetentionDays: 90,
    userDataRetentionDays: 30,
    softDeleteEnabled: true,
    anonymizationEnabled: true,
    autoCleanupEnabled: true,
  };

  // Retention policies for different tables
  private readonly retentionPolicies: RetentionPolicy[] = [
    {
      tableName: 'AuditLog',
      retentionDays: 90,
      softDelete: true,
      anonymizeOnDelete: false,
    },
    {
      tableName: 'User',
      retentionDays: 30,
      softDelete: true,
      anonymizeOnDelete: true,
    },
    {
      tableName: 'UserTenantLicense',
      retentionDays: 30,
      softDelete: true,
      anonymizeOnDelete: false,
    },
    {
      tableName: 'SLOMetric',
      retentionDays: 30,
      softDelete: true,
      anonymizeOnDelete: true,
    },
    {
      tableName: 'SLOAlert',
      retentionDays: 90,
      softDelete: true,
      anonymizeOnDelete: false,
    },
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Soft delete a user with GDPR compliance
   */
  async softDeleteUser(userId: string, reason: string, requestedBy: string): Promise<void> {
    this.logger.log(`Soft deleting user ${userId} for reason: ${reason}`);

    try {
      // Update user status to deleted
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          status: 'disabled',
          email: `deleted_${userId}@anonymized.local`,
          name: 'Anonymized User',
          // Keep audit trail but anonymize personal data
        },
      });

      // Log the deletion for audit purposes
      await this.auditService.logEvent({
        actorId: requestedBy,
        action: 'USER_SOFT_DELETED',
        targetType: 'User',
        targetId: userId,
      });

      this.logger.log(`User ${userId} soft deleted successfully`);
    } catch (error) {
      this.logger.error(`Failed to soft delete user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Anonymize user data for GDPR compliance
   */
  async anonymizeUser(userId: string, request: AnonymizationRequest): Promise<void> {
    this.logger.log(`Anonymizing user ${userId}`);

    try {
      // Anonymize user data
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `anonymized_${userId}@gdpr.local`,
          name: 'Anonymized User',
          // Keep ID for audit purposes but remove personal data
        },
      });

      // Anonymize related data
      await this.prisma.userTenantLicense.updateMany({
        where: { userId },
        data: {
          // Keep relationship but remove personal identifiers
        },
      });

      // Anonymize SLO metrics
      await this.prisma.sLOMetric.updateMany({
        where: { userId },
        data: {
          userId: `anonymized_${userId}`,
        },
      });

      // Log anonymization request
      await this.auditService.logEvent({
        actorId: request.requestedBy,
        action: 'USER_ANONYMIZED',
        targetType: 'User',
        targetId: userId,
      });

      this.logger.log(`User ${userId} anonymized successfully`);
    } catch (error) {
      this.logger.error(`Failed to anonymize user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process GDPR deletion request
   */
  async processGDPRDeletionRequest(request: AnonymizationRequest): Promise<void> {
    this.logger.log(`Processing GDPR deletion request for user ${request.userId}`);

    try {
      if (request.anonymizeData) {
        await this.anonymizeUser(request.userId, request);
      }

      if (request.deleteData) {
        await this.softDeleteUser(request.userId, request.reason, request.requestedBy);
      }

      // Log the GDPR request
      await this.auditService.logEvent({
        actorId: request.requestedBy,
        action: 'GDPR_DELETION_REQUEST',
        targetType: 'User',
        targetId: request.userId,
      });

      this.logger.log(`GDPR deletion request processed for user ${request.userId}`);
    } catch (error) {
      this.logger.error(`Failed to process GDPR deletion request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up expired data based on retention policies
   */
  async cleanupExpiredData(): Promise<{
    auditLogsCleaned: number;
    usersCleaned: number;
    metricsCleaned: number;
    alertsCleaned: number;
  }> {
    this.logger.log('Starting GDPR data cleanup...');

    const results = {
      auditLogsCleaned: 0,
      usersCleaned: 0,
      metricsCleaned: 0,
      alertsCleaned: 0,
    };

    try {
      // Clean up expired audit logs
      const auditLogRetentionDate = new Date();
      auditLogRetentionDate.setDate(auditLogRetentionDate.getDate() - this.defaultConfig.auditLogRetentionDays);

      const deletedAuditLogs = await this.prisma.auditLog.deleteMany({
        where: {
          timestamp: {
            lt: auditLogRetentionDate,
          },
        },
      });
      results.auditLogsCleaned = deletedAuditLogs.count;

      // Clean up expired SLO metrics
      const metricsRetentionDate = new Date();
      metricsRetentionDate.setDate(metricsRetentionDate.getDate() - 30);

      const deletedMetrics = await this.prisma.sLOMetric.deleteMany({
        where: {
          timestamp: {
            lt: metricsRetentionDate,
          },
        },
      });
      results.metricsCleaned = deletedMetrics.count;

      // Clean up expired SLO alerts
      const alertsRetentionDate = new Date();
      alertsRetentionDate.setDate(alertsRetentionDate.getDate() - this.defaultConfig.auditLogRetentionDays);

      const deletedAlerts = await this.prisma.sLOAlert.deleteMany({
        where: {
          timestamp: {
            lt: alertsRetentionDate,
          },
        },
      });
      results.alertsCleaned = deletedAlerts.count;

      // Clean up soft-deleted users after retention period
      const userRetentionDate = new Date();
      userRetentionDate.setDate(userRetentionDate.getDate() - this.defaultConfig.userDataRetentionDays);

      const deletedUsers = await this.prisma.user.deleteMany({
        where: {
          status: 'disabled',
          updatedAt: {
            lt: userRetentionDate,
          },
          email: {
            contains: 'anonymized',
          },
        },
      });
      results.usersCleaned = deletedUsers.count;

      this.logger.log(`GDPR cleanup completed: ${JSON.stringify(results)}`);

      // Log cleanup activity
      await this.auditService.logEvent({
        actorId: 'system',
        action: 'GDPR_CLEANUP_COMPLETED',
        targetType: 'System',
        targetId: 'cleanup',
      });

      return results;
    } catch (error) {
      this.logger.error(`Failed to cleanup expired data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get GDPR compliance report
   */
  async getGDPRComplianceReport(): Promise<{
    totalUsers: number;
    anonymizedUsers: number;
    deletedUsers: number;
    auditLogsCount: number;
    retentionPolicies: RetentionPolicy[];
    config: GDPRConfig;
  }> {
    const [
      totalUsers,
      anonymizedUsers,
      deletedUsers,
      auditLogsCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          email: {
            contains: 'anonymized',
          },
        },
      }),
      this.prisma.user.count({
        where: {
          status: 'disabled',
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      totalUsers,
      anonymizedUsers,
      deletedUsers,
      auditLogsCount,
      retentionPolicies: this.retentionPolicies,
      config: this.defaultConfig,
    };
  }

  /**
   * Export user data for GDPR right to data portability
   */
  async exportUserData(userId: string): Promise<{
    user: any;
    licenses: any[];
    auditLogs: any[];
    metrics: any[];
  }> {
    this.logger.log(`Exporting user data for ${userId}`);

    try {
      const [user, licenses, auditLogs, metrics] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            userType: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.userTenantLicense.findMany({
          where: { userId },
          include: {
            tenantLicense: {
              include: {
                tenant: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            role: {
              select: {
                name: true,
                description: true,
              },
            },
          },
        }),
        this.prisma.auditLog.findMany({
          where: { actorId: userId },
          orderBy: { timestamp: 'desc' },
          take: 100, // Limit to last 100 entries
        }),
        this.prisma.sLOMetric.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          take: 100, // Limit to last 100 entries
        }),
      ]);

      // Log data export for audit
      await this.auditService.logEvent({
        actorId: userId,
        action: 'GDPR_DATA_EXPORT',
        targetType: 'User',
        targetId: userId,
      });

      return {
        user,
        licenses,
        auditLogs,
        metrics,
      };
    } catch (error) {
      this.logger.error(`Failed to export user data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update GDPR configuration
   */
  async updateGDPRConfig(config: Partial<GDPRConfig>): Promise<void> {
    this.logger.log('Updating GDPR configuration');

    // Update configuration
    Object.assign(this.defaultConfig, config);

    // Log configuration change
    await this.auditService.logEvent({
      actorId: 'system',
      action: 'GDPR_CONFIG_UPDATED',
      targetType: 'System',
      targetId: 'config',
    });

    this.logger.log('GDPR configuration updated successfully');
  }

  /**
   * Get retention policy for a specific table
   */
  getRetentionPolicy(tableName: string): RetentionPolicy | undefined {
    return this.retentionPolicies.find(policy => policy.tableName === tableName);
  }

  /**
   * Check if data should be cleaned up based on retention policy
   */
  async shouldCleanupData(tableName: string, recordDate: Date): Promise<boolean> {
    const policy = this.getRetentionPolicy(tableName);
    if (!policy) return false;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    return recordDate < cutoffDate;
  }

  /**
   * Get GDPR configuration
   */
  getGDPRConfig(): GDPRConfig {
    return { ...this.defaultConfig };
  }
}
