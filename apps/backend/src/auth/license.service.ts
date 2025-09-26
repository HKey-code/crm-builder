import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LicenseType, SeatStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LicenseService {
  private readonly logger = new Logger(LicenseService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Get current time in UTC
   */
  private getCurrentTimeUTC(): Date {
    return new Date();
  }

  /**
   * Check if a user has active access to a tenant through a valid license
   */
  async validateUserAccess(userId: string, tenantId: string): Promise<boolean> {
    try {
      const now = this.getCurrentTimeUTC();
      
      // Find active user license for this tenant
      const userLicense = await this.prisma.userTenantLicense.findFirst({
        where: {
          userId,
          status: 'active',
          expiresAt: {
            gte: now, // Not expired
          },
          tenantLicense: {
            tenantId,
            status: 'active',
            expiresAt: {
              gte: now, // Tenant license not expired
            },
          },
        },
        include: {
          tenantLicense: true,
          role: true,
        },
      });

      if (!userLicense) {
        this.logger.warn(`User ${userId} has no active license for tenant ${tenantId}`);
        return false;
      }

      this.logger.log(`User ${userId} has active license for tenant ${tenantId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error validating user access: ${error.message}`);
      return false;
    }
  }

  /**
   * Check user license for specific license type
   */
  async checkUserLicense(userId: string, tenantId: string, licenseType: LicenseType) {
    const now = this.getCurrentTimeUTC();
    
    return this.prisma.userTenantLicense.findFirst({
      where: {
        userId,
        status: SeatStatus.active,
        expiresAt: { gt: now },
        tenantLicense: {
          tenantId,
          licenseType,
          status: 'active',
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      },
      include: {
        tenantLicense: true,
        role: true,
      },
    });
  }

  /**
   * Assign a license seat to a user with seat capacity enforcement
   */
  async assignUserLicense(params: {
    userId: string;
    tenantId: string;
    licenseType: LicenseType;
    roleId: string;
    expiresAt?: Date;
    assignedBy?: string;
    notes?: string;
    overrideSeatLimit?: boolean;
  }) {
    const { userId, tenantId, licenseType, roleId, expiresAt, assignedBy, notes, overrideSeatLimit } = params;

    const tl = await this.prisma.tenantLicense.findUnique({
      where: { tenantId_licenseType: { tenantId, licenseType } },
      select: { 
        id: true, 
        status: true, 
        expiresAt: true, 
        totalSeats: true,
        _count: { 
          select: { 
            userLicenses: { 
              where: { status: 'active' } 
            } 
          } 
        } 
      },
    });

    if (!tl || tl.status !== 'active') {
      throw new BadRequestException('Tenant license not active.');
    }

    if (tl.expiresAt && tl.expiresAt < this.getCurrentTimeUTC()) {
      throw new BadRequestException('Tenant license expired.');
    }

    // Enforce seat capacity if configured and not overridden
    if (tl.totalSeats && tl._count.userLicenses >= tl.totalSeats && !overrideSeatLimit) {
      throw new BadRequestException(`No seats available. Maximum ${tl.totalSeats} seats already assigned.`);
    }

    // Log admin override if used
    if (overrideSeatLimit && assignedBy) {
      await this.auditService.logEvent(
        assignedBy,
        'SEAT_LIMIT_OVERRIDE',
        'UserTenantLicense',
        `${userId}-${tl.id}`
      );
      this.logger.warn(`Admin ${assignedBy} overrode seat limit for user ${userId}, license ${licenseType}`);
    }

    return this.prisma.userTenantLicense.upsert({
      where: { userId_tenantLicenseId: { userId, tenantLicenseId: tl.id } },
      update: { 
        roleId, 
        status: 'active', 
        expiresAt, 
        assignedBy,
        notes,
      },
      create: {
        userId,
        tenantLicenseId: tl.id,
        roleId,
        status: 'active',
        expiresAt,
        assignedBy,
        notes,
      },
      include: {
        user: true,
        tenantLicense: {
          include: {
            tenant: true,
          },
        },
        role: true,
      },
    });
  }

  /**
   * Admin override to exceed seat limits
   */
  async assignUserLicenseWithOverride(params: {
    userId: string;
    tenantId: string;
    licenseType: LicenseType;
    roleId: string;
    expiresAt?: Date;
    assignedBy: string;
    notes?: string;
    reason: string;
  }) {
    const { reason, ...assignParams } = params;
    
    // Log the override reason
    await this.auditService.logEvent(
      params.assignedBy,
      'SEAT_LIMIT_OVERRIDE_REQUESTED',
      'UserTenantLicense',
      `${params.userId}-${params.licenseType}`
    );

    this.logger.log(`Admin ${params.assignedBy} requested seat override for user ${params.userId}: ${reason}`);

    return this.assignUserLicense({
      ...assignParams,
      overrideSeatLimit: true,
    });
  }

  /**
   * Revoke a user's license access
   */
  async revokeUserLicense(userId: string, tenantId: string, licenseType: LicenseType) {
    const tl = await this.prisma.tenantLicense.findUnique({
      where: { tenantId_licenseType: { tenantId, licenseType } },
      select: { id: true },
    });

    if (!tl) {
      this.logger.warn(`Tenant license not found for tenant ${tenantId}, license ${licenseType}`);
      return null;
    }

    const result = await this.prisma.userTenantLicense.updateMany({
      where: { userId, tenantLicenseId: tl.id, status: 'active' },
      data: { status: 'suspended' as SeatStatus },
    });

    this.logger.log(`Revoked license for user ${userId}, tenant ${tenantId}, license ${licenseType}`);
    return result;
  }

  /**
   * Renew a user's license with new expiry date
   */
  async renewUserLicense(userId: string, tenantId: string, licenseType: LicenseType, newExpiry: Date) {
    const tl = await this.prisma.tenantLicense.findUnique({
      where: { tenantId_licenseType: { tenantId, licenseType } },
      select: { id: true },
    });

    if (!tl) {
      throw new BadRequestException('Tenant license not found.');
    }

    return this.prisma.userTenantLicense.update({
      where: { userId_tenantLicenseId: { userId, tenantLicenseId: tl.id } },
      data: { expiresAt: newExpiry, status: 'active' },
      include: {
        user: true,
        tenantLicense: {
          include: {
            tenant: true,
          },
        },
        role: true,
      },
    });
  }

  /**
   * Get user's active licenses and roles for a tenant
   */
  async getUserLicenses(userId: string, tenantId: string) {
    const now = this.getCurrentTimeUTC();
    
    return this.prisma.userTenantLicense.findMany({
      where: {
        userId,
        status: 'active',
        expiresAt: {
          gte: now,
        },
        tenantLicense: {
          tenantId,
          status: 'active',
          expiresAt: {
            gte: now,
          },
        },
      },
      include: {
        tenantLicense: {
          include: {
            tenant: true,
          },
        },
        role: true,
      },
    });
  }

  /**
   * Get all active licenses for a tenant
   */
  async getTenantLicenses(tenantId: string) {
    const now = this.getCurrentTimeUTC();
    
    return this.prisma.tenantLicense.findMany({
      where: {
        tenantId,
        status: 'active',
        expiresAt: {
          gte: now,
        },
      },
      include: {
        userLicenses: {
          where: {
            status: 'active',
          },
          include: {
            user: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Create a new tenant license
   */
  async createTenantLicense(
    tenantId: string,
    licenseType: LicenseType,
    status: string,
    activatedAt: Date,
    expiresAt?: Date,
    metadata?: any,
    totalSeats?: number,
  ) {
    return this.prisma.tenantLicense.create({
      data: {
        tenantId,
        licenseType,
        status,
        activatedAt,
        expiresAt,
        metadata,
        totalSeats,
      },
      include: {
        tenant: true,
      },
    });
  }

  /**
   * Get license usage statistics for a tenant
   */
  async getLicenseUsage(tenantId: string) {
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
      usedSeats: license._count.userLicenses,
      availableSeats: license.totalSeats ? license.totalSeats - license._count.userLicenses : null,
      status: license.status,
      expiresAt: license.expiresAt,
    }));
  }
}
