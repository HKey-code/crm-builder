import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TriggerService } from '../triggers/trigger.service';
const prisma = new PrismaClient();

@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(private readonly triggers: TriggerService) {}

  onModuleInit() {
    this.timer = setInterval(() => this.drain().catch(() => {}), 3000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async drain() {
    const batch = await prisma.outboxEvent.findMany({ where: { processedAt: null }, orderBy: { createdAt: 'asc' }, take: 50 });
    for (const evt of batch) {
      try {
        await this.triggers.handleDomainEvent({ tenantId: evt.tenantId ?? undefined, topic: evt.topic, payload: evt.payload });
        await prisma.outboxEvent.update({ where: { id: evt.id }, data: { processedAt: new Date(), attempts: { increment: 1 } } });
      } catch (e: any) {
        await prisma.outboxEvent.update({ where: { id: evt.id }, data: { attempts: { increment: 1 }, lastError: String(e) } });
      }
    }
  }
}

