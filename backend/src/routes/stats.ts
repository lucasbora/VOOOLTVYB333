import { Router, Request, Response } from 'express';
import { store } from '../store/itemStore';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const items = store.getAll();
  const totalItems = items.length;

  if (totalItems === 0) {
    return res.json({
      totalItems: 0,
      totalValue: 0,
      avgPrice: 0,
      avgRating: 0,
      inStockCount: 0,
      outOfStockCount: 0,
      featuredCount: 0,
      categoryBreakdown: {},
      colorGroupBreakdown: {},
      styleTagBreakdown: {},
      priceRanges: { '$0-50': 0, '$51-80': 0, '$81-120': 0, '$120+': 0 },
      topRated: [],
    });
  }

  const totalValue = items.reduce((sum, i) => sum + i.price * i.stock, 0);
  const avgPrice = Math.round((items.reduce((sum, i) => sum + i.price, 0) / totalItems) * 100) / 100;
  const avgRating = Math.round((items.reduce((sum, i) => sum + i.rating, 0) / totalItems) * 100) / 100;
  const inStockCount = items.filter(i => i.inStock).length;
  const featuredCount = items.filter(i => i.featured).length;

  const categoryBreakdown = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + 1;
    return acc;
  }, {});

  const colorGroupBreakdown = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.colorGroup] = (acc[i.colorGroup] ?? 0) + 1;
    return acc;
  }, {});

  const styleTagBreakdown = items.reduce<Record<string, number>>((acc, i) => {
    i.styleTags.forEach(tag => { acc[tag] = (acc[tag] ?? 0) + 1; });
    return acc;
  }, {});

  const priceRanges = {
    '$0-50': items.filter(i => i.price <= 50).length,
    '$51-80': items.filter(i => i.price > 50 && i.price <= 80).length,
    '$81-120': items.filter(i => i.price > 80 && i.price <= 120).length,
    '$120+': items.filter(i => i.price > 120).length,
  };

  const topRated = [...items]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map(i => ({ id: i.id, name: i.name, rating: i.rating }));

  return res.json({
    totalItems,
    totalValue,
    avgPrice,
    avgRating,
    inStockCount,
    outOfStockCount: totalItems - inStockCount,
    featuredCount,
    categoryBreakdown,
    colorGroupBreakdown,
    styleTagBreakdown,
    priceRanges,
    topRated,
  });
});

export default router;
