import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IdentityProviderService } from './identity-provider.service';
import { RolesGuard } from './guards/roles.guard';
import { TenantResolutionMiddleware } from './middleware/tenant-resolution.middleware';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';
import { LicenseGuard } from './license.guard';
import { LicenseMaintenanceService } from './license-maintenance.service';
import { LicenseErrorService } from './license-error.service';
import { LicenseCacheService } from './license-cache.service';
import { SLOService } from '../monitoring/slo.service';
import { SharedModule } from '../shared.module';

@Module({
  imports: [
    SharedModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [LicenseController],
  providers: [
    IdentityProviderService,
    RolesGuard,
    TenantResolutionMiddleware,
    LicenseService,
    LicenseGuard,
    LicenseMaintenanceService,
    LicenseErrorService,
    LicenseCacheService,
    SLOService,
  ],
  exports: [
    IdentityProviderService,
    RolesGuard,
    TenantResolutionMiddleware,
    LicenseService,
    LicenseGuard,
    LicenseMaintenanceService,
    LicenseErrorService,
    LicenseCacheService,
  ],
})
export class AuthModule {} 