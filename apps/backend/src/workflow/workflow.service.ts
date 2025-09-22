import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { WorkflowRunner } from './workflow.runner';
const prisma = new PrismaClient();

@Injectable()
export class WorkflowService {
  async start(opts: { workflowId: string; tenantId?: string; subjectSchema: string; subjectModel: string; subjectId: string; entryStateKey: string; actorId?: string }) {
    const inst = await WorkflowRunner.startInstance({
      workflowId: opts.workflowId,
      tenantId: opts.tenantId,
      subjectSchema: opts.subjectSchema,
      subjectModel: opts.subjectModel,
      subjectId: opts.subjectId,
      stateKey: opts.entryStateKey,
    });
    await prisma.auditLog.create({
      data: {
        actorId: opts.actorId ?? 'system',
        action: 'WORKFLOW_START',
        targetType: 'WorkflowInstance',
        targetId: inst.id,
        timestamp: new Date(),
      },
    });
    return inst;
  }

  async advance(instanceId: string, actorId?: string, eventPayload?: any) {
    const inst = await WorkflowRunner.advance({ instanceId, eventPayload });
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? 'system',
        action: 'WORKFLOW_ADVANCE',
        targetType: 'WorkflowInstance',
        targetId: inst.id,
        timestamp: new Date(),
      },
    });
    return inst;
  }
}

