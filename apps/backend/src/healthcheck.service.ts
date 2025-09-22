import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { LicenseType } from '@prisma/client';

export interface HealthStatus {
  dbStatus: 'ok' | 'error';
  jwtSecretPresent: boolean;
  azureConfigPresent: boolean;
  databaseUrlPresent: boolean;
  environment: string;
  nodeVersion: string;
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface LicenseHealthStatus {
  status: 'healthy' | 'unhealthy' | 'error';
  licenseType?: LicenseType;
  tenantId?: string;
  message?: string;
  details?: {
    isActive?: boolean;
    isExpired?: boolean;
    totalSeats?: number | null;
    usedSeats?: number;
    usagePercentage?: number | null;
    expiresAt?: Date | null;
  };
  error?: string;
}

@Injectable()
export class HealthcheckService {
  private readonly logger = new Logger(HealthcheckService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkHealth(): Promise<HealthStatus> {
    const healthStatus: HealthStatus = {
      dbStatus: 'error',
      jwtSecretPresent: false,
      azureConfigPresent: false,
      databaseUrlPresent: false,
      environment: process.env.NODE_ENV || 'unknown',
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: this.getMemoryUsage(),
    };

    try {
      // Check database connectivity
      await this.checkDatabase();
      healthStatus.dbStatus = 'ok';
      this.logger.log('Database connection successful');
    } catch (error) {
      this.logger.error('Database connection failed:', error);
      healthStatus.dbStatus = 'error';
    }

    // Check environment variables (without exposing sensitive values)
    healthStatus.jwtSecretPresent = !!process.env.JWT_SECRET;
    healthStatus.azureConfigPresent = !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID);
    healthStatus.databaseUrlPresent = !!process.env.DATABASE_URL;

    this.logger.log('Health check completed', {
      dbStatus: healthStatus.dbStatus,
      envVarsPresent: {
        jwtSecret: healthStatus.jwtSecretPresent,
        azureConfig: healthStatus.azureConfigPresent,
        databaseUrl: healthStatus.databaseUrlPresent,
      },
    });

    return healthStatus;
  }

  /**
   * Check license health for a specific tenant and license type
   */
  async checkLicenseHealth(tenantId: string, licenseType: LicenseType): Promise<LicenseHealthStatus> {
    try {
      const tenantLicense = await this.prisma.tenantLicense.findUnique({
        where: { tenantId_licenseType: { tenantId, licenseType } },
        include: {
          _count: {
            select: {
              userLicenses: {
                where: { status: 'active' }
              }
            }
          }
        }
      });

      if (!tenantLicense) {
        return {
          status: 'error',
          message: 'Tenant license not found',
          details: { tenantId, licenseType }
        };
      }

      const isActive = tenantLicense.status === 'active';
      const isExpired = tenantLicense.expiresAt && tenantLicense.expiresAt < new Date();
      const usagePercentage = tenantLicense.totalSeats 
        ? Math.round((tenantLicense._count.userLicenses / tenantLicense.totalSeats) * 100)
        : null;

      return {
        status: isActive && !isExpired ? 'healthy' : 'unhealthy',
        licenseType,
        tenantId,
        details: {
          isActive,
          isExpired,
          totalSeats: tenantLicense.totalSeats,
          usedSeats: tenantLicense._count.userLicenses,
          usagePercentage,
          expiresAt: tenantLicense.expiresAt,
        }
      };
    } catch (error) {
      this.logger.error(`License health check failed: ${error.message}`);
      return {
        status: 'error',
        message: 'License health check failed',
        error: error.message
      };
    }
  }

  /**
   * Get system-wide license health summary
   */
  async getSystemLicenseSummary() {
    try {
      const [totalTenants, totalLicenses, expiringCount] = await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.tenantLicense.count(),
        this.prisma.userTenantLicense.count({
          where: {
            status: 'active',
            expiresAt: {
              lt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
              gt: new Date(),
            },
          },
        }),
      ]);

      return {
        totalTenants,
        totalLicenses,
        expiringLicenses: expiringCount,
        overallStatus: expiringCount > 0 ? 'warning' : 'healthy',
      };
    } catch (error) {
      this.logger.error(`System license summary failed: ${error.message}`);
      return {
        status: 'error',
        message: 'System license summary failed',
        error: error.message
      };
    }
  }

  private async checkDatabase(): Promise<void> {
    // Simple database query to verify connectivity
    const result = await this.prisma.$queryRaw`SELECT 1 as test`;
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error('Database query returned unexpected result');
    }

    // Additional check: try to count users (if table exists)
    try {
      const userCount = await this.prisma.user.count();
      this.logger.log(`Database user count: ${userCount}`);
    } catch (error) {
      // This is expected if the database hasn't been migrated yet
      this.logger.warn('User table not found - database may not be migrated yet');
    }
  }

  private getMemoryUsage() {
    const memUsage = process.memoryUsage();
    const total = memUsage.heapTotal;
    const used = memUsage.heapUsed;
    const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

    return {
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      percentage,
    };
  }
} 