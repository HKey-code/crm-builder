import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class WorkflowRunner {
  static async startInstance(params: {
    workflowId: string; tenantId?: string;
    subjectSchema: string; subjectModel: string; subjectId: string; stateKey: string;
  }) {
    return prisma.workflowInstance.create({
      data: {
        workflowId: params.workflowId,
        tenantId: params.tenantId ?? null,
        subjectSchema: params.subjectSchema,
        subjectModel: params.subjectModel,
        subjectId: params.subjectId,
        stateKey: params.stateKey,
      },
    });
  }

  static async advance(params: { instanceId: string; eventPayload?: any }) {
    const inst = await prisma.workflowInstance.findUnique({ where: { id: params.instanceId }});
    if (!inst) throw new Error('Instance not found');

    const wf = await prisma.workflow.findUnique({
      where: { id: inst.workflowId },
      include: { states: true, transitions: true },
    });
    const outgoing = wf!.transitions.filter((t) => t.fromStateKey === inst.stateKey);
    const next = outgoing[0];
    if (!next) return inst;

    const newStateKey = next.toStateKey;
    return prisma.workflowInstance.update({
      where: { id: inst.id },
      data: { stateKey: newStateKey, updatedAt: new Date() },
    });
  }
}

