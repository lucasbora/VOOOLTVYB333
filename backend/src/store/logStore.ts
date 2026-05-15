import { prisma } from '../db/prisma';

export interface SuspiciousRuleResult {
  suspiciousScore: number;
  reason: string;
  shouldWatch: boolean;
}

function evaluateSuspiciousPattern(recentActions: string[], action: string): SuspiciousRuleResult {
  const veryRecentDeletes = recentActions.filter((a) => a === 'DELETE_ITEM').length;
  const veryRecentFailedLogins = recentActions.filter((a) => a === 'LOGIN_FAILED').length;

  if (action === 'DELETE_ITEM' && veryRecentDeletes >= 3) {
    return { suspiciousScore: 95, reason: 'Burst delete activity detected', shouldWatch: true };
  }

  if (action === 'LOGIN_FAILED' && veryRecentFailedLogins >= 4) {
    return { suspiciousScore: 90, reason: 'Repeated failed login attempts', shouldWatch: true };
  }

  if (action === 'UPDATE_ITEM' && recentActions.filter((a) => a === 'UPDATE_ITEM').length >= 8) {
    return { suspiciousScore: 70, reason: 'High-frequency update activity', shouldWatch: true };
  }

  return { suspiciousScore: 15, reason: 'Normal activity', shouldWatch: false };
}

export const logStore = {
  async logAction(input: {
    userId: string;
    roleCode: string;
    action: string;
    actionInfo: string;
  }): Promise<void> {
    const recent = await prisma.activityLog.findMany({
      where: { userId: input.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { action: true },
    });

    const analysis = evaluateSuspiciousPattern(recent.map((r) => r.action), input.action);

    await prisma.activityLog.create({
      data: {
        userId: input.userId,
        roleCode: input.roleCode,
        action: input.action,
        actionInfo: input.actionInfo,
        suspiciousScore: analysis.suspiciousScore,
      },
    });

    if (analysis.shouldWatch) {
      await prisma.watchlistUser.upsert({
        where: { userId: input.userId },
        update: {
          reason: analysis.reason,
          status: 'ACTIVE',
          riskScore: analysis.suspiciousScore,
          flaggedByRule: analysis.reason,
          addedAt: new Date(),
        },
        create: {
          userId: input.userId,
          reason: analysis.reason,
          status: 'ACTIVE',
          riskScore: analysis.suspiciousScore,
          flaggedByRule: analysis.reason,
        },
      });
    }
  },

  async getObservationList() {
    return prisma.watchlistUser.findMany({
      where: { status: 'ACTIVE' },
      include: { user: true },
      orderBy: [{ riskScore: 'desc' }, { addedAt: 'desc' }],
    });
  },

  async getRecentLogs(limit = 100) {
    return prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });
  },
};
