import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Try to get tenant from various sources
      const tenantId = this.extractTenantId(req);
      
      if (tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: tenantId },
        });

        if (tenant) {
          req.tenant = tenant;
        }
      }

      // If no tenant found, try to get from user context
      if (!req.tenant && req.user?.tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: req.user.tenantId },
        });

        if (tenant) {
          req.tenant = tenant;
        }
      }

      next();
    } catch (error) {
      // Continue without tenant if resolution fails
      console.warn('Tenant resolution failed:', error);
      next();
    }
  }

  private extractTenantId(req: Request): string | null {
    // Check various sources for tenant ID
    return (
      req.headers['x-tenant-id'] as string ||
      req.headers['tenant-id'] as string ||
      req.query.tenantId as string ||
      req.body?.tenantId ||
      null
    );
  }
} 