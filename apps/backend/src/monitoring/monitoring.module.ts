import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SLOService } from './slo.service';
import { SLOController } from './slo.controller';
import { SyntheticProbeService } from './synthetic-probe.service';
import { SyntheticProbeController } from './synthetic-probe.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [SLOController, SyntheticProbeController],
  providers: [SLOService, SyntheticProbeService],
  exports: [SLOService, SyntheticProbeService],
})
export class MonitoringModule {}
