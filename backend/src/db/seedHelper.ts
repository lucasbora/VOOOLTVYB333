import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { initialItems } from '../store/initialData';
import { seedReviews } from '../store/reviewSeed';

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

/**
 * Seeds the database with initial roles, permissions, users, items and reviews
 * only if the database is currently empty (no roles exist).
 */
export async function seedDatabaseIfNeeded(): Promise<void> {
  const roleCount = await prisma.role.count();
  if (roleCount > 0) {
    // DB already seeded — but let's ensure the demo users have the correct default passwords
    const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
    const userRole = await prisma.role.findUnique({ where: { code: 'USER' } });
    if (adminRole && userRole) {
      const demoHash  = await bcrypt.hash('demo1234', SALT_ROUNDS);
      const adminHash = await bcrypt.hash('admin1234', SALT_ROUNDS);
      await prisma.user.upsert({
        where: { email: 'demo@voltvybe.com' },
        update: { password: demoHash },
        create: {
          email:    'demo@voltvybe.com',
          username: 'VOLT_DEMO',
          password: demoHash,
          roleId:   adminRole.id,
        },
      });
      await prisma.user.upsert({
        where: { email: 'admin@voltvybe.com' },
        update: { password: adminHash },
        create: {
          email:    'admin@voltvybe.com',
          username: 'VOLT_ADMIN',
          password: adminHash,
          roleId:   adminRole.id,
        },
      });
      await prisma.user.upsert({
        where: { email: 'user@voltvybe.com' },
        update: { password: demoHash },
        create: {
          email:    'user@voltvybe.com',
          username: 'VOLT_USER',
          password: demoHash,
          roleId:   userRole.id,
        },
      });
    }
    return;
  }

  console.log('🌱  Seeding database with initial data...');

  // ── Permissions ────────────────────────────────────────────────────────────
  const permissionDefs = [
    { code: 'ITEM_READ',         name: 'Read items' },
    { code: 'ITEM_CREATE',       name: 'Create items' },
    { code: 'ITEM_UPDATE',       name: 'Update items' },
    { code: 'ITEM_DELETE',       name: 'Delete items' },
    { code: 'GENERATOR_CONTROL', name: 'Control fake generator' },
    { code: 'LOG_VIEW',          name: 'View system logs' },
    { code: 'CHAT_USE',          name: 'Use realtime chat' },
  ];

  for (const p of permissionDefs) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  const allPerms = await prisma.permission.findMany();
  const perm = (code: string) => allPerms.find((p) => p.code === code)!;

  // ── Roles ──────────────────────────────────────────────────────────────────
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

  // ADMIN gets all permissions
  for (const p of allPerms) {
    await prisma.rolePermissionLink.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: p.id },
    });
  }

  // USER gets read/create/update items and chat
  for (const code of ['ITEM_READ', 'ITEM_CREATE', 'ITEM_UPDATE', 'CHAT_USE']) {
    const p = perm(code);
    await prisma.rolePermissionLink.upsert({
      where: { roleId_permissionId: { roleId: userRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: userRole.id, permissionId: p.id },
    });
  }

  // ── Demo Users ─────────────────────────────────────────────────────────────
  const demoHash  = await bcrypt.hash('demo1234', SALT_ROUNDS);
  const adminHash = await bcrypt.hash('admin1234', SALT_ROUNDS);

  await prisma.user.upsert({
    where: { email: 'demo@voltvybe.com' },
    update: {},
    create: {
      email:    'demo@voltvybe.com',
      username: 'VOLT_DEMO',
      password: demoHash,
      roleId:   adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@voltvybe.com' },
    update: {},
    create: {
      email:    'admin@voltvybe.com',
      username: 'VOLT_ADMIN',
      password: adminHash,
      roleId:   adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@voltvybe.com' },
    update: {},
    create: {
      email:    'user@voltvybe.com',
      username: 'VOLT_USER',
      password: demoHash,
      roleId:   userRole.id,
    },
  });

  // ── Items & Reviews ────────────────────────────────────────────────────────
  for (const item of initialItems) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id:          item.id,
        name:        item.name,
        category:    item.category,
        price:       item.price,
        colorHex:    item.colorHex,
        colorName:   item.colorName,
        colorGroup:  item.colorGroup,
        styleTags:   JSON.stringify(item.styleTags),
        rating:      item.rating,
        description: item.description,
        material:    item.material,
        sizes:       JSON.stringify(item.sizes),
        inStock:     item.stock > 0,
        imageUrl:    item.imageUrl,
        featured:    item.featured,
        stock:       item.stock,
      },
    });
  }

  for (const review of seedReviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      update: {},
      create: {
        id:        review.id,
        itemId:    review.itemId,
        author:    review.author,
        rating:    review.rating,
        comment:   review.comment,
        createdAt: new Date(review.createdAt),
      },
    });
  }

  console.log('✅  Database seeded successfully.');
  console.log('    Demo accounts:');
  console.log('      ADMIN  →  demo@voltvybe.com  / demo1234');
  console.log('      ADMIN  →  admin@voltvybe.com / admin1234');
  console.log('      USER   →  user@voltvybe.com  / demo1234');
}
