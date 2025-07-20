import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { IdentityProviderService } from './identity-provider.service';
import { RolesGuard } from './guards/roles.guard';
import { TenantResolutionMiddleware } from './middleware/tenant-resolution.middleware';
import { SharedModule } from '../shared.module';

@Module({
  imports: [
    SharedModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [
    IdentityProviderService,
    RolesGuard,
    TenantResolutionMiddleware,
  ],
  exports: [
    IdentityProviderService,
    RolesGuard,
    TenantResolutionMiddleware,
  ],
})
export class AuthModule {} 