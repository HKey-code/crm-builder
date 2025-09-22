import { Module } from '@nestjs/common';
import { GDPRService } from './gdpr.service';
import { GDPRController } from './gdpr.controller';
import { GDPRSchedulerService } from './gdpr-scheduler.service';

@Module({
  controllers: [GDPRController],
  providers: [GDPRService, GDPRSchedulerService],
  exports: [GDPRService, GDPRSchedulerService],
})
export class GDPRModule {}
