import { PrismaClient } from '@prisma/client';
import { initialItems } from '../src/store/initialData';
import { seedReviews } from '../src/store/reviewSeed';

const prisma = new PrismaClient();

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.watchlistUser.deleteMany();
  await prisma.review.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermissionLink.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.item.deleteMany();

  const permissions = [
    { code: 'ITEM_READ', name: 'Read items' },
    { code: 'ITEM_CREATE', name: 'Create items' },
    { code: 'ITEM_UPDATE', name: 'Update items' },
    { code: 'ITEM_DELETE', name: 'Delete items' },
    { code: 'GENERATOR_CONTROL', name: 'Control fake generator' },
    { code: 'LOG_VIEW', name: 'View system logs' },
    { code: 'CHAT_USE', name: 'Use realtime chat' },
  ];

  for (const p of permissions) {
    await prisma.permission.create({ data: p });
  }

  const adminRole = await prisma.role.create({ data: { code: 'ADMIN', name: 'Administrator' } });
  const userRole = await prisma.role.create({ data: { code: 'USER', name: 'Normal User' } });

  const allPermissions = await prisma.permission.findMany();

  for (const perm of allPermissions) {
    await prisma.rolePermissionLink.create({
      data: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  for (const code of ['ITEM_READ', 'ITEM_CREATE', 'ITEM_UPDATE', 'CHAT_USE']) {
    const perm = allPermissions.find((x) => x.code === code)!;
    await prisma.rolePermissionLink.create({
      data: { roleId: userRole.id, permissionId: perm.id },
    });
  }

  for (const item of initialItems) {
    await prisma.item.create({
      data: {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        colorHex: item.colorHex,
        colorName: item.colorName,
        colorGroup: item.colorGroup,
        styleTags: JSON.stringify(item.styleTags),
        rating: item.rating,
        description: item.description,
        material: item.material,
        sizes: JSON.stringify(item.sizes),
        inStock: item.stock > 0,
        imageUrl: item.imageUrl,
        featured: item.featured,
        stock: item.stock,
      },
    });
  }

  for (const review of seedReviews) {
    await prisma.review.create({
      data: {
        id: review.id,
        itemId: review.itemId,
        author: review.author,
        rating: review.rating,
        comment: review.comment,
        createdAt: new Date(review.createdAt),
      },
    });
  }

  await prisma.user.create({
    data: {
      email: 'demo@voltvybe.com',
      username: 'VOLT_DEMO',
      password: 'demo1234',
      roleId: adminRole.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'user@voltvybe.com',
      username: 'VOLT_USER',
      password: 'demo1234',
      roleId: userRole.id,
    },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
