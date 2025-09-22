import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WorkflowService } from '../workflow.service';
const prisma = new PrismaClient();

@Injectable()
export class TriggerService {
  constructor(private readonly wf: WorkflowService) {}

  async handleDomainEvent(evt: { tenantId?: string; topic: string; payload: any }) {
    const subjectSchema = evt.payload?.subjectSchema;
    const subjectModel = evt.payload?.subjectModel;
    const subjectId = evt.payload?.subjectId;
    const triggers = await prisma.workflowTrigger.findMany({
      where: { tenantId: evt.tenantId ?? null, subjectSchema, subjectModel, eventKey: evt.topic, active: true },
      include: { workflow: true },
    });
    for (const t of triggers) {
      const entryStateKey = (t as any).workflow?.definition?.entry ?? 'open';
      await this.wf.start({
        workflowId: t.workflowId,
        tenantId: evt.tenantId,
        subjectSchema,
        subjectModel,
        subjectId,
        entryStateKey,
      });
    }
  }
}

