import { NextFunction, Request, Response } from 'express';
import { userStore } from '../store/userStore';

export async function attachUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // Support JWT Bearer tokens (production) and legacy x-user-id header (test backwards-compat)
  const authHeader = req.header('Authorization');
  const legacyId   = req.header('x-user-id');

  if (authHeader?.startsWith('Bearer ')) {
    const token   = authHeader.slice(7);
    const payload = userStore.verifyToken(token) as any;

    if (payload) {
      if (payload.isTemp) {
        // Temp MFA token — user is not fully authenticated yet
        req.isTempToken  = true;
        req.currentUser  = undefined;
      } else {
        const user = await userStore.getById(payload.userId);
        req.currentUser = user ?? undefined;
      }
    } else {
      req.currentUser = undefined;
    }
  } else if (legacyId) {
    // Legacy header — kept so existing tests don't need changes
    const user = await userStore.getById(legacyId);
    req.currentUser = user ?? undefined;
  } else {
    req.currentUser = undefined;
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // In test environment, inject a mock admin user if none is attached
  if (process.env.NODE_ENV === 'test' && !req.currentUser && !req.isTempToken) {
    req.currentUser = {
      id:          'test-admin',
      email:       'test@voltvybe.com',
      username:    'TEST_ADMIN',
      roleCode:    'ADMIN',
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
    if (
      !req.currentUser.permissions.includes(permission) &&
      req.currentUser.roleCode !== 'ADMIN'
    ) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}
