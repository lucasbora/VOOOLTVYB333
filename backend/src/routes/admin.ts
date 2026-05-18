import { Router, Request, Response } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { logStore } from '../store/logStore';

const router = Router();

router.get('/logs', requireAuth, requirePermission('LOG_VIEW'), async (_req: Request, res: Response) => {
  const logs = await logStore.getRecentLogs(200);
  return res.json(logs);
});

router.get('/observation-list', requireAuth, requirePermission('LOG_VIEW'), async (_req: Request, res: Response) => {
  const list = await logStore.getObservationList();
  return res.json(list.map((x) => ({
    userId: x.userId,
    email: x.user.email,
    username: x.user.username,
    reason: x.reason,
    status: x.status,
    riskScore: x.riskScore,
    flaggedByRule: x.flaggedByRule,
    addedAt: x.addedAt,
  })));
});

export default router;
