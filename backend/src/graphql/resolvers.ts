import { store } from '../store/itemStore';

interface ItemsArgs { page?: number; limit?: number; category?: string; colorGroup?: string; }
interface ItemArg { id: string; }
interface CreateArgs { input: Record<string, unknown>; }
interface UpdateArgs { id: string; input: Record<string, unknown>; }
interface DeleteArg { id: string; }

export const resolvers = {
  async items({ page = 1, limit = 10, category, colorGroup }: ItemsArgs) {
    let items = await store.getAll();
    if (category) items = items.filter(i => i.category === category);
    if (colorGroup) items = items.filter(i => i.colorGroup === colorGroup);
    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    return { data: items.slice((page - 1) * limit, page * limit), page, limit, total, totalPages };
  },

  async item({ id }: ItemArg) {
    return await store.getById(id) ?? null;
  },

  async stats() {
    const items = await store.getAll();
    const n = items.length;
    if (n === 0) return { totalItems: 0, totalValue: 0, avgPrice: 0, avgRating: 0, inStockCount: 0, outOfStockCount: 0, featuredCount: 0, topRated: [] };
    const round = (v: number) => Math.round(v * 100) / 100;
    const inStockCount = items.filter(i => i.inStock).length;
    return {
      totalItems: n,
      totalValue: items.reduce((s, i) => s + i.price * i.stock, 0),
      avgPrice: round(items.reduce((s, i) => s + i.price, 0) / n),
      avgRating: round(items.reduce((s, i) => s + i.rating, 0) / n),
      inStockCount,
      outOfStockCount: n - inStockCount,
      featuredCount: items.filter(i => i.featured).length,
      topRated: [...items].sort((a, b) => b.rating - a.rating).slice(0, 5).map(i => ({ id: i.id, name: i.name, rating: i.rating })),
    };
  },

  async createItem({ input }: CreateArgs) {
    return await store.create(input as any);
  },

  async updateItem({ id, input }: UpdateArgs) {
    return await store.update(id, input as any) ?? null;
  },

  async deleteItem({ id }: DeleteArg) {
    return await store.delete(id);
  },
};
