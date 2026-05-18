import { Router, Request, Response } from 'express';
import { store } from '../store/itemStore';
import { reviewStore } from '../store/reviewStore';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const items = await store.getAll();
  const totalItems = items.length;

  if (totalItems === 0) {
    return res.json({
      totalItems: 0, totalValue: 0, avgPrice: 0, avgRating: 0,
      inStockCount: 0, outOfStockCount: 0, featuredCount: 0,
      categoryBreakdown: {}, colorGroupBreakdown: {}, styleTagBreakdown: {},
      priceRanges: { '$0-50': 0, '$51-80': 0, '$81-120': 0, '$120+': 0 },
      topRated: [],
      reviews: { total: 0, avgRating: 0, topReviewedItems: [] },
    });
  }

  const totalValue = items.reduce((sum, i) => sum + i.price * i.stock, 0);
  const avgPrice = Math.round((items.reduce((sum, i) => sum + i.price, 0) / totalItems) * 100) / 100;
  const avgRating = Math.round((items.reduce((sum, i) => sum + i.rating, 0) / totalItems) * 100) / 100;
  const inStockCount = items.filter(i => i.inStock).length;
  const featuredCount = items.filter(i => i.featured).length;

  const categoryBreakdown = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + 1; return acc;
  }, {});

  const colorGroupBreakdown = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.colorGroup] = (acc[i.colorGroup] ?? 0) + 1; return acc;
  }, {});

  const styleTagBreakdown = items.reduce<Record<string, number>>((acc, i) => {
    i.styleTags.forEach(tag => { acc[tag] = (acc[tag] ?? 0) + 1; }); return acc;
  }, {});

  const priceRanges = {
    '$0-50': items.filter(i => i.price <= 50).length,
    '$51-80': items.filter(i => i.price > 50 && i.price <= 80).length,
    '$81-120': items.filter(i => i.price > 80 && i.price <= 120).length,
    '$120+': items.filter(i => i.price > 120).length,
  };

  const topRated = [...items].sort((a, b) => b.rating - a.rating).slice(0, 5)
    .map(i => ({ id: i.id, name: i.name, rating: i.rating }));

  // Review stats (1-to-many Gold Task 3)
  const allReviews = await reviewStore.getAll();
  const reviewAvg = allReviews.length > 0
    ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length) * 100) / 100
    : 0;
  const reviewCountByItem = allReviews.reduce<Record<string, number>>((acc, r) => {
    acc[r.itemId] = (acc[r.itemId] ?? 0) + 1; return acc;
  }, {});
  const topReviewedItems = Object.entries(reviewCountByItem)
    .sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([itemId, count]) => {
      const item = items.find((i) => i.id === itemId);
      return { id: itemId, name: item?.name ?? 'Unknown', reviewCount: count };
    });

  return res.json({
    totalItems, totalValue, avgPrice, avgRating,
    inStockCount, outOfStockCount: totalItems - inStockCount, featuredCount,
    categoryBreakdown, colorGroupBreakdown, styleTagBreakdown, priceRanges, topRated,
    reviews: { total: allReviews.length, avgRating: reviewAvg, topReviewedItems },
  });
});

export default router;
