import { ClothingItem, CreateItemDto, UpdateItemDto } from '../validation/itemSchema';
import { initialItems } from './initialData';
import { prisma } from '../db/prisma';
import { serializeArray, toDomainItem } from '../db/serializers';

function normalizeStock(data: Pick<CreateItemDto, 'stock'> & Partial<CreateItemDto>): CreateItemDto {
  return {
    ...data,
    inStock: data.stock > 0,
  } as CreateItemDto;
}

export const store = {
  async getAll(): Promise<ClothingItem[]> {
    const rows = await prisma.item.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map(toDomainItem);
  },

  async getById(id: string): Promise<ClothingItem | undefined> {
    const row = await prisma.item.findUnique({ where: { id } });
    return row ? toDomainItem(row) : undefined;
  },

  async create(data: CreateItemDto): Promise<ClothingItem> {
    const normalized = normalizeStock(data);
    const row = await prisma.item.create({
      data: {
        ...normalized,
        styleTags: serializeArray(normalized.styleTags),
        sizes: serializeArray(normalized.sizes),
      },
    });
    return toDomainItem(row);
  },

  async replace(id: string, data: CreateItemDto): Promise<ClothingItem | null> {
    const exists = await prisma.item.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;

    const normalized = normalizeStock(data);
    const row = await prisma.item.update({
      where: { id },
      data: {
        ...normalized,
        styleTags: serializeArray(normalized.styleTags),
        sizes: serializeArray(normalized.sizes),
      },
    });
    return toDomainItem(row);
  },

  async update(id: string, data: UpdateItemDto): Promise<ClothingItem | null> {
    const exists = await prisma.item.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return null;

    const payload: Record<string, unknown> = { ...data };
    if (data.styleTags) payload.styleTags = serializeArray(data.styleTags);
    if (data.sizes) payload.sizes = serializeArray(data.sizes);
    if (typeof data.stock === 'number') payload.inStock = data.stock > 0;

    const row = await prisma.item.update({ where: { id }, data: payload });
    return toDomainItem(row);
  },

  async delete(id: string): Promise<boolean> {
    const exists = await prisma.item.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return false;
    await prisma.item.delete({ where: { id } });
    return true;
  },

  async reset(): Promise<void> {
    await prisma.review.deleteMany();
    await prisma.item.deleteMany();

    for (const item of initialItems) {
      await prisma.item.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          category: item.category,
          price: item.price,
          colorHex: item.colorHex,
          colorName: item.colorName,
          colorGroup: item.colorGroup,
          styleTags: serializeArray(item.styleTags),
          rating: item.rating,
          description: item.description,
          material: item.material,
          sizes: serializeArray(item.sizes),
          inStock: item.stock > 0,
          imageUrl: item.imageUrl,
          featured: item.featured,
          stock: item.stock,
        },
        create: {
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          colorHex: item.colorHex,
          colorName: item.colorName,
          colorGroup: item.colorGroup,
          styleTags: serializeArray(item.styleTags),
          rating: item.rating,
          description: item.description,
          material: item.material,
          sizes: serializeArray(item.sizes),
          inStock: item.stock > 0,
          imageUrl: item.imageUrl,
          featured: item.featured,
          stock: item.stock,
        },
      });
    }
  },

  async clear(): Promise<void> {
    await prisma.review.deleteMany();
    await prisma.item.deleteMany();
  },
};
