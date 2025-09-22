import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ActionInput = {
  tenantId: string;
  runId: string;
  userId?: string;
  args?: any;
};

export async function dispatchAction(action: string, input: ActionInput) {
  switch (action) {
    case 'service.createCase': {
      const { tenantId, userId, args } = input;
      const caseNumber = args?.caseNumber ?? `SR-${Date.now()}`;
      const subjectPartyId = args?.subjectPartyId ?? null;
      const kase = await prisma.case.create({
        data: {
          tenantId,
          caseNumber,
          caseType: 'GENERIC',
          subjectPartyId,
          status: 'open',
          details: args?.details ?? {},
          openedByUserId: userId ?? null,
        },
      });
      return { createdCaseId: kase.id, caseNumber: kase.caseNumber };
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}


