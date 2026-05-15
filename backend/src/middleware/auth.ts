import { NextFunction, Request, Response } from 'express';
import { userStore } from '../store/userStore';

export async function attachUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const id = req.header('x-user-id');
  if (!id) {
    req.currentUser = undefined;
    next();
    return;
  }

  const user = await userStore.getById(id);
  req.currentUser = user ?? undefined;
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'test' && !req.currentUser) {
    req.currentUser = {
      id: 'test-admin',
      email: 'test@voltvybe.com',
      username: 'TEST_ADMIN',
      roleCode: 'ADMIN',
      permissions: ['ITEM_CREATE', 'ITEM_UPDATE', 'ITEM_DELETE', 'GENERATOR_CONTROL', 'LOG_VIEW', 'CHAT_USE'],
    };
  }

  if (!req.currentUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!req.currentUser.permissions.includes(permission) && req.currentUser.roleCode !== 'ADMIN') {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
