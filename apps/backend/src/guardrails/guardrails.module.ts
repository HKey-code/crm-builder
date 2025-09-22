import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GuardrailsService } from './guardrails.service';
import { GuardrailsController } from './guardrails.controller';
import { GuardrailsSchedulerService } from './guardrails-scheduler.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [GuardrailsController],
  providers: [GuardrailsService, GuardrailsSchedulerService, PrismaService, AuditService],
  exports: [GuardrailsService],
})
export class GuardrailsModule {}
