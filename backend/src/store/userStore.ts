import { prisma } from '../db/prisma';

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  roleCode: string;
  permissions: string[];
}

export const userStore = {
  async register(input: { email: string; username: string; password: string; roleCode?: string }): Promise<SessionUser | null> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return null;

    const role = await prisma.role.findUnique({
      where: { code: input.roleCode ?? 'USER' },
      include: { permissions: { include: { permission: true } } },
    });

    if (!role) return null;

    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        password: input.password,
        roleId: role.id,
      },
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      roleCode: role.code,
      permissions: role.permissions.map((p) => p.permission.code),
    };
  },

  async login(email: string, password: string): Promise<SessionUser | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user || user.password !== password) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      roleCode: user.role.code,
      permissions: user.role.permissions.map((p) => p.permission.code),
    };
  },

  async getById(id: string): Promise<SessionUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      roleCode: user.role.code,
      permissions: user.role.permissions.map((p) => p.permission.code),
    };
  },
};
