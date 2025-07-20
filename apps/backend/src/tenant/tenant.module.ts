import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantResolver } from './tenant.resolver';
import { TenantController } from './tenant.controller';
import { SharedModule } from '../shared.module';

@Module({
  imports: [SharedModule],
  providers: [TenantService, TenantResolver],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {}