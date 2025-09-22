import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { evalCondition } from './runner/json-logic';
import { dispatchAction } from './actions/dispatcher';

@Injectable()
export class GuidanceService {
  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma as any;
  }

  private async audit(actorId: string | null, action: string, targetType: string, targetId: string, meta?: any) {
    await this.db.auditLog.create({
      data: {
        actorId: actorId ?? 'system',
        action,
        targetType,
        targetId,
        timestamp: new Date(),
      },
    });
  }

  async getActiveScriptByKey(tenantId: string, key: string) {
    const script = await this.db.script.findFirst({
      where: { key, tenantId: tenantId ?? undefined },
      include: {
        versions: { where: { status: 'ACTIVE' }, include: { nodes: true, edges: true, variables: true } },
      },
    });
    if (!script || script.versions.length === 0) throw new NotFoundException('No ACTIVE version');
    return { script, version: script.versions[0] };
  }

  async startRun(tenantId: string, key: string, subjectSchema: string, subjectModel: string, subjectId: string, userId?: string) {
    const { script, version } = await this.getActiveScriptByKey(tenantId, key);
    if (!version.entryNodeId) throw new BadRequestException('Script missing entry node');
    const run = await this.db.scriptRun.create({
      data: {
        tenantId,
        scriptId: script.id,
        scriptVersion: version.version,
        subjectSchema,
        subjectModel,
        subjectId,
        startedByUserId: userId ?? null,
        state: { cursor: this.findNodeKey(version, version.entryNodeId), answers: {} },
      },
    });
    await this.audit(userId ?? null, 'GUIDANCE_RUN_START', 'ScriptRun', run.id, { scriptId: script.id, version: version.version });
    return run;
  }

  async answer(runId: string, nodeKey: string, value: any) {
    const run = await this.db.scriptRun.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('Run not found');
    if (run.completedAt) throw new ForbiddenException('Run is completed');

    const version = await this.db.scriptVersion.findFirst({
      where: { scriptId: run.scriptId, version: run.scriptVersion },
      include: { nodes: true },
    });
    const node = version?.nodes.find((n: any) => n.key === nodeKey);
    if (!node) throw new BadRequestException('Node not in this script');
    if (node.type !== 'QUESTION') throw new BadRequestException('Only QUESTION nodes accept answers');

    const answer = await this.db.scriptAnswer.create({ data: { runId, nodeKey, value } });

    const state = ((run.state as any) ?? { cursor: nodeKey, answers: {} });
    state.answers[nodeKey] = value;

    await this.db.scriptRun.update({ where: { id: runId }, data: { state } });
    return answer;
  }

  async advance(runId: string) {
    const run = await this.db.scriptRun.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('Run not found');
    if (run.completedAt) throw new ForbiddenException('Run is completed');

    const version = await this.db.scriptVersion.findFirst({
      where: { scriptId: run.scriptId, version: run.scriptVersion },
      include: { nodes: true, edges: true },
    });
    const state = ((run.state as any) ?? { cursor: null, answers: {} });
    const cursorKey = state.cursor;
    const cursorNode = version?.nodes.find((n: any) => n.key === cursorKey);
    if (!cursorNode) throw new BadRequestException('Invalid cursor');

    const outgoing = version!.edges.filter((e: any) => e.fromNodeId === cursorNode.id);
    const ctx = { answers: state.answers ?? {} };
    const candidate = outgoing.find((e: any) => evalCondition(e.condition as any, ctx)) || outgoing[0];
    if (!candidate) throw new BadRequestException('No valid transition from current node');

    const nextNode = version!.nodes.find((n: any) => n.id === candidate.toNodeId)!;
    state.cursor = nextNode.key;

    // If ACTION, dispatch
    if (nextNode.type === 'ACTION') {
      const action = (nextNode.config as any)?.action;
      if (!action) throw new BadRequestException('ACTION node missing config.action');
      await dispatchAction(action, {
        tenantId: run.tenantId ?? '',
        runId: run.id,
        userId: (run as any).startedByUserId ?? undefined,
        args: (nextNode.config as any)?.args ?? {},
      });
    }

    const completedAt = nextNode.type === 'END' ? new Date() : null;
    const update = await this.db.scriptRun.update({
      where: { id: runId },
      data: { state, completedAt },
    });

    if (completedAt) await this.audit((run as any).startedByUserId ?? null, 'GUIDANCE_RUN_COMPLETE', 'ScriptRun', run.id);

    return update;
  }

  async publishScript(scriptId: string, version: number, actorId?: string | null) {
    await this.db.scriptVersion.updateMany({ where: { scriptId, status: 'ACTIVE' }, data: { status: 'RETIRED' } });
    const updated = await this.db.scriptVersion.update({
      where: { scriptId_version: { scriptId, version } as any },
      data: { status: 'ACTIVE', publishedAt: new Date() },
    });
    await this.audit(actorId ?? null, 'GUIDANCE_PUBLISH', 'Script', scriptId, { version });
    return updated;
  }

  private findNodeKey(version: any, nodeId: string) {
    const node = version.nodes.find((n: any) => n.id === nodeId);
    return node?.key;
  }
}
