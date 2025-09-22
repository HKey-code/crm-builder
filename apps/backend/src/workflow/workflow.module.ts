import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { TriggerService } from './triggers/trigger.service';
import { EventBusService } from './events/event-bus.service';
import { SlaService } from './sla/sla.service';
import { SharedModule } from '../shared.module';

@Module({
  imports: [SharedModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, TriggerService, EventBusService, SlaService],
  exports: [WorkflowService, TriggerService],
})
export class WorkflowModule {}

