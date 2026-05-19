import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { userStore } from '../store/userStore';
import { logStore } from '../store/logStore';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(200),
  roleCode: z.enum(['ADMIN', 'USER']).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });

  const result = await userStore.register(parsed.data);
  if (!result) return res.status(409).json({ error: 'Email already registered or role missing' });

  const { token, ...user } = result;

  await logStore.logAction({
    userId: user.id,
    roleCode: user.roleCode,
    action: 'REGISTER',
    actionInfo: `User ${user.email} registered`,
  });

  return res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });

  // Track login attempts for unknown emails (audit purposes)
  let existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { role: true },
  });

  if (!existingUser) {
    // Create a stub record so we can log the failed attempt
    const role = await prisma.role.findFirst();
    if (role) {
      existingUser = await prisma.user.create({
        data: {
          email: parsed.data.email,
          username: parsed.data.email.split('@')[0],
          password: '___STUB___',
          roleId: role.id,
        },
        include: { role: true },
      });
    }
  }

  const result = await userStore.login(parsed.data.email, parsed.data.password);
  if (!result) {
    if (existingUser) {
      await logStore.logAction({
        userId: existingUser.id,
        roleCode: existingUser.role?.code ?? 'USER',
        action: 'LOGIN_FAILED',
        actionInfo: `Failed login attempt for ${parsed.data.email}`,
      });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { token, ...user } = result;

  await logStore.logAction({
    userId: user.id,
    roleCode: user.roleCode,
    action: 'LOGIN_SUCCESS',
    actionInfo: `User ${user.email} logged in`,
  });

  return res.json({ token, user });
});

// POST /api/auth/logout  (client just drops the token; this endpoint logs the event)
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const u = req.currentUser!;
  await logStore.logAction({
    userId: u.id,
    roleCode: u.roleCode,
    action: 'LOGOUT',
    actionInfo: `User ${u.email} logged out`,
  });
  return res.status(204).send();
});

// GET /api/auth/me  (verify current token and return user info)
router.get('/me', requireAuth, (req: Request, res: Response) => {
  return res.json(req.currentUser);
});

export default router;
