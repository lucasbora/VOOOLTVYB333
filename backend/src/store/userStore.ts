import { prisma } from '../db/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 12;
const JWT_SECRET  = process.env.JWT_SECRET ?? 'fallback-dev-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN ?? '30m';

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  roleCode: string;
  permissions: string[];
}

export interface AuthResult extends SessionUser {
  token: string;
}

function toSessionUser(
  user: { id: string; email: string; username: string },
  role: { code: string; permissions: Array<{ permission: { code: string } }> }
): SessionUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    roleCode: role.code,
    permissions: role.permissions.map((p) => p.permission.code),
  };
}

function signToken(userId: string, roleCode: string): string {
  return jwt.sign({ userId, roleCode }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as jwt.SignOptions);
}

export const userStore = {
  async register(input: {
    email: string;
    username: string;
    password: string;
    roleCode?: string;
  }): Promise<AuthResult | null> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return null;

    const role = await prisma.role.findUnique({
      where: { code: input.roleCode ?? 'USER' },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) return null;

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        password: hashedPassword,
        roleId: role.id,
      },
    });

    const sessionUser = toSessionUser(user, role);
    return { ...sessionUser, token: signToken(user.id, role.code) };
  },

  async login(email: string, password: string): Promise<AuthResult | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user) return null;

    // Support legacy plain-text passwords from before bcrypt migration
    const isStub = user.password === '___STUB___';
    if (isStub) return null;

    let valid = false;
    if (user.password.startsWith('$2')) {
      // bcrypt hash
      valid = await bcrypt.compare(password, user.password);
    } else {
      // legacy plain-text (migrate on success)
      valid = user.password === password;
      if (valid) {
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);
        await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
      }
    }

    if (!valid) return null;

    const sessionUser = toSessionUser(user, user.role);
    return { ...sessionUser, token: signToken(user.id, user.role.code) };
  },

  async getById(id: string): Promise<SessionUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user) return null;
    return toSessionUser(user, user.role);
  },

  verifyToken(token: string): { userId: string; roleCode: string } | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string; roleCode: string };
      return payload;
    } catch {
      return null;
    }
  },
};
