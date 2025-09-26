import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LicenseType, SeatStatus } from '@prisma/client';
import { SLOService } from '../monitoring/slo.service';

@Injectable()
export class LicenseGuard implements CanActivate {
  private readonly logger = new Logger(LicenseGuard.name);

  constructor(
    private prisma: PrismaService,
    private sloService: SLOService,
    private required: LicenseType,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const startTime = Date.now();
    const req = ctx.switchToHttp().getRequest();
    const { user, tenantId } = req; // assume set by auth middleware

    // System users bypass all license checks
    if (user?.isSystemUser) {
      this.logger.log(`System user ${user.id} bypassing license check for ${this.required}`);
      return true;
    }

    if (!user?.id || !tenantId) {
      this.logger.warn(`Missing user or tenantId for license validation`);
      throw new ForbiddenException('Authentication required for license validation.');
    }

    let licenseCheckSuccess = false;
    let errorCode: string | undefined;

    try {
      const utl = await this.prisma.userTenantLicense.findFirst({
        where: {
          userId: user.id,
          status: SeatStatus.active,
          expiresAt: { gt: new Date() },
          tenantLicense: {
            tenantId,
            licenseType: this.required,
            status: 'active',
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
        select: { id: true, roleId: true },
      });

      if (!utl) {
        errorCode = 'LICENSE_NOT_ASSIGNED';
        this.logger.warn(`License validation failed for user ${user.id}, tenant ${tenantId}, license ${this.required}`);
        
        // Log to audit trail
        try {
          await this.prisma.auditLog.create({
            data: {
              actorId: user.id,
              action: 'LICENSE_VALIDATION_FAILED',
              targetType: 'License',
              targetId: `${tenantId}-${this.required}`,
            },
          });
        } catch (auditError) {
          this.logger.error(`Failed to log audit event: ${auditError.message}`);
        }

        throw new ForbiddenException(`License expired or not assigned for ${this.required}.`);
      }

      // Stash context for handlers (role-aware UI/permissions)
      req.context = { 
        roleId: utl.roleId, 
        licenseType: this.required,
        userLicenseId: utl.id,
      };

      licenseCheckSuccess = true;
      this.logger.log(`License validation successful for user ${user.id}, license ${this.required}`);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        // Already handled above
        throw error;
      }
      
      errorCode = 'DATABASE_ERROR';
      this.logger.error(`Database error during license validation: ${error.message}`);
      throw new ForbiddenException('License validation failed due to system error.');
    } finally {
      // Record SLO metrics
      const latency = Date.now() - startTime;
      await this.sloService.recordLicenseCheck({
        licenseCheckLatency: latency,
        licenseCheckSuccess,
        errorCode,
        userId: user?.id,
        tenantId,
        licenseType: this.required,
        timestamp: new Date(),
      });
    }

    return true;
  }
}
