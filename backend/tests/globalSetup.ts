import { execSync } from 'child_process';
import path from 'path';

export async function setup() {
  // Push schema to the test database (creates it fresh every run)
  execSync('npx prisma migrate reset --force --skip-seed --schema=prisma/schema.prisma', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: 'file:./test.db', NODE_ENV: 'test' },
    stdio: 'inherit',
  });

  // Seed roles, permissions and demo users into the test DB
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient({
    datasources: { db: { url: 'file:./test.db' } },
  });

  try {
    const permissions = [
      { code: 'ITEM_READ',        name: 'Read items' },
      { code: 'ITEM_CREATE',      name: 'Create items' },
      { code: 'ITEM_UPDATE',      name: 'Update items' },
      { code: 'ITEM_DELETE',      name: 'Delete items' },
      { code: 'GENERATOR_CONTROL',name: 'Control fake generator' },
      { code: 'LOG_VIEW',         name: 'View system logs' },
      { code: 'CHAT_USE',         name: 'Use realtime chat' },
    ];

    for (const p of permissions) {
      await prisma.permission.upsert({
        where: { code: p.code },
        update: {},
        create: p,
      });
    }

    const adminRole = await prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: {},
      create: { code: 'ADMIN', name: 'Administrator' },
    });
    const userRole = await prisma.role.upsert({
      where: { code: 'USER' },
      update: {},
      create: { code: 'USER', name: 'Normal User' },
    });

    const allPermissions = await prisma.permission.findMany();

    for (const perm of allPermissions) {
      await prisma.rolePermissionLink.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: adminRole.id, permissionId: perm.id },
      });
    }

    for (const code of ['ITEM_READ', 'ITEM_CREATE', 'ITEM_UPDATE', 'CHAT_USE']) {
      const perm = allPermissions.find((x) => x.code === code)!;
      await prisma.rolePermissionLink.upsert({
        where: { roleId_permissionId: { roleId: userRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: userRole.id, permissionId: perm.id },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

export async function teardown() {
  // Nothing needed – test.db is reset at the start of each run
}
