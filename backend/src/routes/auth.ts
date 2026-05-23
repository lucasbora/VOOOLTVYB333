import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { userStore } from '../store/userStore';
import { logStore } from '../store/logStore';
import { prisma } from '../db/prisma';
import { requireAuth } from '../middleware/auth';
import { generateSecret, verifyTOTP } from '../utils/totp';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-dev-secret';

const RegisterSchema = z.object({
  email:    z.string().email(),
  username: z.string().min(2).max(50),
  password: z.string().min(6).max(200),
  roleCode: z.enum(['ADMIN', 'USER']).optional(),
});

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });

  const result = await userStore.register(parsed.data);
  if (!result) return res.status(409).json({ error: 'Email already registered or role not found' });

  const { token, ...user } = result;

  await logStore.logAction({
    userId:     user.id,
    roleCode:   user.roleCode,
    action:     'REGISTER',
    actionInfo: `User ${user.email} registered`,
  });

  return res.status(201).json({ token, user });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });

  // Track login attempts (even for unknown emails) for audit purposes
  let existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { role: true },
  });

  if (!existingUser) {
    // Create a stub so we can log the failed attempt
    const role = await prisma.role.findFirst();
    if (role) {
      existingUser = await prisma.user.create({
        data: {
          email:    parsed.data.email,
          username: parsed.data.email.split('@')[0],
          password: '___STUB___',
          roleId:   role.id,
        },
        include: { role: true },
      });
    }
  }

  const result = await userStore.login(parsed.data.email, parsed.data.password);
  if (!result) {
    if (existingUser) {
      await logStore.logAction({
        userId:     existingUser.id,
        roleCode:   existingUser.role?.code ?? 'USER',
        action:     'LOGIN_FAILED',
        actionInfo: `Failed login attempt for ${parsed.data.email}`,
      });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // If the user has MFA enabled, issue a short-lived temp token instead
  const fullUser = await prisma.user.findUnique({ where: { id: result.id } });
  if (fullUser?.totpEnabled) {
    const tempToken = jwt.sign({ userId: result.id, isTemp: true }, JWT_SECRET, { expiresIn: '5m' });
    return res.json({ mfaRequired: true, tempToken });
  }

  const { token, ...user } = result;

  await logStore.logAction({
    userId:     user.id,
    roleCode:   user.roleCode,
    action:     'LOGIN_SUCCESS',
    actionInfo: `User ${user.email} logged in`,
  });

  return res.json({ token, user });
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const u = req.currentUser!;
  await logStore.logAction({
    userId:     u.id,
    roleCode:   u.roleCode,
    action:     'LOGOUT',
    actionInfo: `User ${u.email} logged out`,
  });
  return res.status(204).send();
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req: Request, res: Response) => {
  return res.json(req.currentUser);
});

// ─────────────────────────────────────────────────────────────────────────────
// MFA (3-Way Authentication) Endpoints
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/auth/mfa/status
router.get('/mfa/status', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.currentUser!.id } });
  return res.json({ totpEnabled: user?.totpEnabled ?? false });
});

// POST /api/auth/mfa/setup  — generates a new TOTP secret and returns the otpauth URL
router.post('/mfa/setup', requireAuth, async (req: Request, res: Response) => {
  const u      = req.currentUser!;
  const secret = generateSecret();
  await prisma.user.update({
    where: { id: u.id },
    data:  { totpSecret: secret },
  });
  return res.json({
    secret,
    otpauthUrl: `otpauth://totp/VoltVybe:${u.email}?secret=${secret}&issuer=VoltVybe`,
  });
});

// POST /api/auth/mfa/enable  — verifies a code and marks TOTP as enabled
router.post('/mfa/enable', requireAuth, async (req: Request, res: Response) => {
  const u          = req.currentUser!;
  const { code }   = req.body;
  if (!code) return res.status(400).json({ error: 'MFA code is required.' });

  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user?.totpSecret) return res.status(400).json({ error: 'MFA setup not started. Call /mfa/setup first.' });

  if (!verifyTOTP(code, user.totpSecret))
    return res.status(400).json({ error: 'Invalid verification code.' });

  await prisma.user.update({ where: { id: u.id }, data: { totpEnabled: true } });

  await logStore.logAction({
    userId:     u.id,
    roleCode:   u.roleCode,
    action:     'MFA_ENABLED',
    actionInfo: `User ${u.email} enabled MFA`,
  });

  return res.json({ success: true });
});

// POST /api/auth/mfa/disable  — verifies code and disables TOTP
router.post('/mfa/disable', requireAuth, async (req: Request, res: Response) => {
  const u        = req.currentUser!;
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'MFA code is required.' });

  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user?.totpEnabled) return res.status(400).json({ error: 'MFA is not enabled.' });
  if (!user.totpSecret)   return res.status(400).json({ error: 'MFA secret is missing.' });

  if (!verifyTOTP(code, user.totpSecret))
    return res.status(400).json({ error: 'Invalid verification code.' });

  await prisma.user.update({
    where: { id: u.id },
    data:  { totpEnabled: false, totpSecret: null },
  });

  await logStore.logAction({
    userId:     u.id,
    roleCode:   u.roleCode,
    action:     'MFA_DISABLED',
    actionInfo: `User ${u.email} disabled MFA`,
  });

  return res.json({ success: true });
});

// POST /api/auth/mfa/verify  — called during login to exchange temp token for full JWT
router.post('/mfa/verify', async (req: Request, res: Response) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code)
    return res.status(400).json({ error: 'Temporary token and verification code are required.' });

  try {
    const payload = jwt.verify(tempToken, JWT_SECRET) as { userId: string; isTemp?: boolean };
    if (!payload.isTemp) return res.status(400).json({ error: 'Invalid temporary token.' });

    const user = await prisma.user.findUnique({
      where:   { id: payload.userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user?.totpEnabled || !user.totpSecret)
      return res.status(400).json({ error: 'MFA is not enabled for this user.' });

    if (!verifyTOTP(code, user.totpSecret))
      return res.status(401).json({ error: 'Invalid verification code.' });

    const token = jwt.sign(
      { userId: user.id, roleCode: user.role.code },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '30m' } as jwt.SignOptions,
    );

    await logStore.logAction({
      userId:     user.id,
      roleCode:   user.role.code,
      action:     'LOGIN_SUCCESS',
      actionInfo: `User ${user.email} logged in with MFA (TOTP)`,
    });

    const sessionUser = {
      id:          user.id,
      email:       user.email,
      username:    user.username,
      roleCode:    user.role.code,
      permissions: user.role.permissions.map((p) => p.permission.code),
    };

    return res.json({ token, user: sessionUser });
  } catch {
    return res.status(401).json({ error: 'MFA session expired or invalid.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Password Recovery Endpoints
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  // Always return success to prevent email enumeration
  const successMsg = 'If that email is registered, a password recovery link has been logged to the server console.';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.json({ message: successMsg });

  const resetToken   = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data:  { resetToken, resetExpires },
  });

  // In a real app, this would send an email. For the lab demo we log it to the console.
  const proto     = process.env.HTTPS === 'true' ? 'https' : 'http';
  const resetLink = `${proto}://localhost:5173/reset-password?token=${resetToken}`;

  console.log('\n================================================================');
  console.log('✉️   PASSWORD RECOVERY LINK (simulated email — copy into browser):');
  console.log(`     Account: ${email}`);
  console.log(`     Link   : ${resetLink}`);
  console.log('================================================================\n');

  await logStore.logAction({
    userId:     user.id,
    roleCode:   'USER',
    action:     'FORGOT_PASSWORD_REQUEST',
    actionInfo: `Password reset requested for ${email}`,
  });

  return res.json({ message: successMsg });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password are required.' });
  if (password.length < 6)  return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const user = await prisma.user.findFirst({
    where: {
      resetToken:   token,
      resetExpires: { gt: new Date() },
    },
    include: { role: true },
  });

  if (!user) return res.status(400).json({ error: 'Invalid or expired password recovery token.' });

  const bcrypt        = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data:  { password: hashedPassword, resetToken: null, resetExpires: null },
  });

  await logStore.logAction({
    userId:     user.id,
    roleCode:   user.role?.code ?? 'USER',
    action:     'PASSWORD_RESET_SUCCESS',
    actionInfo: `Password reset completed for ${user.email}`,
  });

  return res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

export default router;
