import { Request } from 'express';
import { logStore } from '../store/logStore';

export async function audit(req: Request, action: string, actionInfo: string): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;
  if (!req.currentUser) return;
  await logStore.logAction({
    userId: req.currentUser.id,
    roleCode: req.currentUser.roleCode,
    action,
    actionInfo,
  });
}
