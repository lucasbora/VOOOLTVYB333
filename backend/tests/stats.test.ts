import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { store } from '../src/store/itemStore';

const newItem = {
  name: 'EXTRA TEE',
  category: 'tee',
  price: 50,
  colorHex: '#FF0000',
  colorName: 'Red',
  colorGroup: 'vibrant',
  styleTags: ['casual'],
  rating: 5.0,
  description: 'An extra item for testing',
  material: '100% Cotton',
  sizes: ['M'],
  inStock: true,
  imageUrl: 'https://example.com/img.jpg',
  featured: false,
  stock: 5,
};

beforeEach(() => {
  store.reset();
});

describe('GET /api/stats', () => {
  it('returns a stats object with all expected fields', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalItems');
    expect(res.body).toHaveProperty('totalValue');
    expect(res.body).toHaveProperty('avgPrice');
    expect(res.body).toHaveProperty('avgRating');
    expect(res.body).toHaveProperty('inStockCount');
    expect(res.body).toHaveProperty('outOfStockCount');
    expect(res.body).toHaveProperty('featuredCount');
    expect(res.body).toHaveProperty('categoryBreakdown');
    expect(res.body).toHaveProperty('colorGroupBreakdown');
    expect(res.body).toHaveProperty('styleTagBreakdown');
    expect(res.body).toHaveProperty('priceRanges');
    expect(res.body).toHaveProperty('topRated');
  });

  it('totalItems is 12 for the initial seed data', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.body.totalItems).toBe(12);
  });

  it('inStockCount + outOfStockCount equals totalItems', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.body.inStockCount + res.body.outOfStockCount).toBe(res.body.totalItems);
  });

  it('avgPrice is a positive number', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.body.avgPrice).toBeGreaterThan(0);
  });

  it('avgRating is between 0 and 5', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.body.avgRating).toBeGreaterThanOrEqual(0);
    expect(res.body.avgRating).toBeLessThanOrEqual(5);
  });

  it('totalValue equals sum of price * stock for all items', async () => {
    const res = await request(app).get('/api/stats');
    const listRes = await request(app).get('/api/items?limit=100');
    const expected = listRes.body.data.reduce(
      (sum: number, i: { price: number; stock: number }) => sum + i.price * i.stock,
      0,
    );
    expect(res.body.totalValue).toBe(expected);
  });

  it('categoryBreakdown counts sum to totalItems', async () => {
    const res = await request(app).get('/api/stats');
    const sum = Object.values(res.body.categoryBreakdown as Record<string, number>).reduce(
      (a, b) => a + b, 0,
    );
    expect(sum).toBe(res.body.totalItems);
  });

  it('colorGroupBreakdown counts sum to totalItems', async () => {
    const res = await request(app).get('/api/stats');
    const sum = Object.values(res.body.colorGroupBreakdown as Record<string, number>).reduce(
      (a, b) => a + b, 0,
    );
    expect(sum).toBe(res.body.totalItems);
  });

  it('priceRanges counts sum to totalItems', async () => {
    const res = await request(app).get('/api/stats');
    const { priceRanges } = res.body;
    const sum = priceRanges['$0-50'] + priceRanges['$51-80'] + priceRanges['$81-120'] + priceRanges['$120+'];
    expect(sum).toBe(res.body.totalItems);
  });

  it('topRated has at most 5 items', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.body.topRated.length).toBeLessThanOrEqual(5);
  });

  it('topRated items are sorted by rating descending', async () => {
    const res = await request(app).get('/api/stats');
    const ratings: number[] = res.body.topRated.map((i: { rating: number }) => i.rating);
    for (let i = 0; i < ratings.length - 1; i++) {
      expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]);
    }
  });

  it('each topRated entry has id, name, and rating', async () => {
    const res = await request(app).get('/api/stats');
    for (const item of res.body.topRated) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('rating');
    }
  });

  it('totalItems updates after adding an item', async () => {
    await request(app).post('/api/items').send(newItem);
    const res = await request(app).get('/api/stats');
    expect(res.body.totalItems).toBe(13);
  });

  it('totalItems updates after deleting an item', async () => {
    await request(app).delete('/api/items/1');
    const res = await request(app).get('/api/stats');
    expect(res.body.totalItems).toBe(11);
  });

  it('returns zero values for an empty store', async () => {
    store.clear();
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalItems).toBe(0);
    expect(res.body.avgPrice).toBe(0);
    expect(res.body.avgRating).toBe(0);
    expect(res.body.totalValue).toBe(0);
    expect(res.body.topRated).toHaveLength(0);
  });

  it('featuredCount matches number of featured items in the list', async () => {
    const listRes = await request(app).get('/api/items?limit=100');
    const expectedFeatured = listRes.body.data.filter((i: { featured: boolean }) => i.featured).length;
    const statsRes = await request(app).get('/api/stats');
    expect(statsRes.body.featuredCount).toBe(expectedFeatured);
  });

  it('styleTagBreakdown includes at least one known tag', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.body.styleTagBreakdown).toHaveProperty('streetwear');
  });
});
