import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SeatStatus } from '@prisma/client';

@Injectable()
export class LicenseMaintenanceService {
  private readonly logger = new Logger(LicenseMaintenanceService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Daily job to expire licenses that have passed their expiry date
   */
  async expireExpiredLicenses() {
    try {
      const result = await this.prisma.userTenantLicense.updateMany({
        where: {
          status: SeatStatus.active,
          expiresAt: {
            lt: new Date(),
          },
        },
        data: {
          status: SeatStatus.expired,
        },
      });

      this.logger.log(`Expired ${result.count} user licenses`);
      return result.count;
    } catch (error) {
      this.logger.error(`Failed to expire licenses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get seat usage statistics for all tenant licenses
   */
  async getSeatUsageStats() {
    const licenses = await this.prisma.tenantLicense.findMany({
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
      tenantId: license.tenantId,
      licenseType: license.licenseType,
      totalSeats: license.totalSeats,
      activeSeats: license._count.userLicenses,
      availableSeats: license.totalSeats ? license.totalSeats - license._count.userLicenses : null,
      usagePercentage: license.totalSeats ? Math.round((license._count.userLicenses / license.totalSeats) * 100) : null,
      status: license.status,
      expiresAt: license.expiresAt,
    }));
  }

  /**
   * Get seat usage for a specific tenant
   */
  async getTenantSeatUsage(tenantId: string) {
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
      totalSeats: license.totalSeats,
      activeSeats: license._count.userLicenses,
      availableSeats: license.totalSeats ? license.totalSeats - license._count.userLicenses : null,
      usagePercentage: license.totalSeats ? Math.round((license._count.userLicenses / license.totalSeats) * 100) : null,
      status: license.status,
      expiresAt: license.expiresAt,
    }));
  }

  /**
   * Get expiring licenses grouped by day for the next N days
   */
  async getExpiringLicensesByDay(days = 90) {
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

    // Group by day
    const groupedByDay = expiringLicenses.reduce((acc, license) => {
      const day = license.expiresAt!.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(license);
      return acc;
    }, {} as Record<string, typeof expiringLicenses>);

    return Object.entries(groupedByDay).map(([day, licenses]) => ({
      day,
      count: licenses.length,
      licenses: licenses.map(license => ({
        userId: license.userId,
        userEmail: license.user.email,
        userName: license.user.name,
        licenseType: license.tenantLicense.licenseType,
        tenantId: license.tenantLicense.tenantId,
        roleName: license.role.name,
        expiresAt: license.expiresAt,
      }))
    }));
  }

  /**
   * Get license usage trends over time
   */
  async getLicenseUsageTrends(tenantId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // This would require additional audit logging or historical data
    // For now, return current usage stats
    return this.getTenantSeatUsage(tenantId);
  }
}
