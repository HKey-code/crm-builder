import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleResolver } from './role.resolver';
import { SharedModule } from '../shared.module';

@Module({
  imports: [SharedModule],
  providers: [RoleService, RoleResolver],
  exports: [RoleService],
})
export class RoleModule {} 