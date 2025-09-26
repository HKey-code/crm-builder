import { Module } from '@nestjs/common';
import { GuidanceController } from './guidance.controller';
import { GuidanceService } from './guidance.service';
import { SharedModule } from '../shared.module';

@Module({
  imports: [SharedModule],
  controllers: [GuidanceController],
  providers: [GuidanceService],
  exports: [GuidanceService],
})
export class GuidanceModule {}
