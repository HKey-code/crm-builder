import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LicenseType } from '@prisma/client';

@Injectable()
export class LicenseHealthService {
  private readonly logger = new Logger(LicenseHealthService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Check license health for a specific tenant and license type
   */
  async checkLicenseHealth(tenantId: string, licenseType: LicenseType) {
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
   * Get expiring licenses in the next N days
   */
  async getExpiringLicenses(days = 60) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    const expiringLicenses = await this.prisma.userTenantLicense.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: cutoffDate,
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: { email: true, name: true }
        },
        tenantLicense: {
          select: { licenseType: true, tenantId: true }
        },
        role: {
          select: { name: true }
        }
      },
      orderBy: { expiresAt: 'asc' }
    });

    return expiringLicenses.map(license => ({
      userId: license.userId,
      userEmail: license.user.email,
      userName: license.user.name,
      licenseType: license.tenantLicense.licenseType,
      tenantId: license.tenantLicense.tenantId,
      roleName: license.role.name,
      expiresAt: license.expiresAt,
      daysUntilExpiry: Math.ceil((license.expiresAt!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }));
  }

  /**
   * Get license usage statistics
   */
  async getLicenseUsageStats(tenantId: string) {
    const licenses = await this.prisma.tenantLicense.findMany({
      where: { tenantId },
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

    return licenses.map(license => ({
      licenseType: license.licenseType,
      status: license.status,
      totalSeats: license.totalSeats,
      usedSeats: license._count.userLicenses,
      availableSeats: license.totalSeats ? license.totalSeats - license._count.userLicenses : null,
      usagePercentage: license.totalSeats ? Math.round((license._count.userLicenses / license.totalSeats) * 100) : null,
      expiresAt: license.expiresAt,
      isExpired: license.expiresAt ? license.expiresAt < new Date() : false,
    }));
  }

  /**
   * Get system-wide license health summary
   */
  async getSystemHealthSummary() {
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
  }
}
