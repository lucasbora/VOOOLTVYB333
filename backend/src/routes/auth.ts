import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { userStore } from '../store/userStore';
import { logStore } from '../store/logStore';

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

router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });

  const user = await userStore.register(parsed.data);
  if (!user) return res.status(409).json({ error: 'Email already registered or role missing' });

  await logStore.logAction({
    userId: user.id,
    roleCode: user.roleCode,
    action: 'REGISTER',
    actionInfo: `User ${user.email} registered`,
  });

  return res.status(201).json(user);
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });

  const user = await userStore.login(parsed.data.email, parsed.data.password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  await logStore.logAction({
    userId: user.id,
    roleCode: user.roleCode,
    action: 'LOGIN_SUCCESS',
    actionInfo: `User ${user.email} logged in`,
  });

  return res.json(user);
});

export default router;
