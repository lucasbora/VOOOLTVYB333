import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { store } from '../src/store/itemStore';

const validItem = {
  name: 'TEST TEE',
  category: 'tee',
  price: 49.99,
  colorHex: '#FF0000',
  colorName: 'Red',
  colorGroup: 'vibrant',
  styleTags: ['casual'],
  rating: 4.0,
  description: 'A test tee shirt',
  material: '100% Cotton',
  sizes: ['S', 'M', 'L'],
  inStock: true,
  imageUrl: 'https://example.com/image.jpg',
  featured: false,
  stock: 10,
};

beforeEach(async () => {
  await store.reset();
});

// ---------------------------------------------------------------------------
// GET /api/items
// ---------------------------------------------------------------------------

describe('GET /api/items', () => {
  it('returns paginated list with defaults (page=1, limit=10)', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
    expect(res.body.total).toBe(12);
    expect(res.body.totalPages).toBe(2);
    expect(res.body.data).toHaveLength(10);
  });

  it('returns page 2 with remaining items', async () => {
    const res = await request(app).get('/api/items?page=2&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.data).toHaveLength(2);
  });

  it('respects a custom limit', async () => {
    const res = await request(app).get('/api/items?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.totalPages).toBe(3);
  });

  it('returns empty data array for an out-of-range page', async () => {
    const res = await request(app).get('/api/items?page=999');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(12);
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/items?category=tee');
    expect(res.status).toBe(200);
    expect(res.body.data.every((i: { category: string }) => i.category === 'tee')).toBe(true);
  });

  it('filters by inStock=true', async () => {
    const res = await request(app).get('/api/items?inStock=true');
    expect(res.status).toBe(200);
    expect(res.body.data.every((i: { inStock: boolean }) => i.inStock === true)).toBe(true);
  });

  it('filters by inStock=false', async () => {
    const res = await request(app).get('/api/items?inStock=false');
    expect(res.status).toBe(200);
    expect(res.body.data.every((i: { inStock: boolean }) => i.inStock === false)).toBe(true);
  });

  it('filters by colorGroup', async () => {
    const res = await request(app).get('/api/items?colorGroup=dark');
    expect(res.status).toBe(200);
    expect(res.body.data.every((i: { colorGroup: string }) => i.colorGroup === 'dark')).toBe(true);
  });

  it('returns 400 for page=0 (invalid)', async () => {
    const res = await request(app).get('/api/items?page=0');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 for limit > 100', async () => {
    const res = await request(app).get('/api/items?limit=200');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 for limit=0', async () => {
    const res = await request(app).get('/api/items?limit=0');
    expect(res.status).toBe(400);
  });

  it('pagination metadata is correct after creating an item', async () => {
    await request(app).post('/api/items').send(validItem);
    const res = await request(app).get('/api/items?limit=10');
    expect(res.body.total).toBe(13);
    expect(res.body.totalPages).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// GET /api/items/:id
// ---------------------------------------------------------------------------

describe('GET /api/items/:id', () => {
  it('returns an item by id', async () => {
    const res = await request(app).get('/api/items/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('1');
    expect(res.body.name).toBe('NEON SURGE TEE');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/items/9999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// POST /api/items
// ---------------------------------------------------------------------------

describe('POST /api/items', () => {
  it('creates an item and returns 201 with the new item', async () => {
    const res = await request(app).post('/api/items').send(validItem);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(validItem);
    expect(res.body.id).toBeDefined();
  });

  it('assigns a unique id to the created item', async () => {
    const r1 = await request(app).post('/api/items').send(validItem);
    const r2 = await request(app).post('/api/items').send(validItem);
    expect(r1.body.id).not.toBe(r2.body.id);
  });

  it('persists the created item so it appears in the list', async () => {
    await request(app).post('/api/items').send(validItem);
    const listRes = await request(app).get('/api/items?limit=100');
    expect(listRes.body.total).toBe(13);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/items').send({ name: 'Incomplete' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 for an invalid category', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, category: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for a negative price', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, price: -10 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for price = 0', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, price: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid hex color', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, colorHex: 'notahex' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid imageUrl', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, imageUrl: 'not-a-url' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for rating > 5', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, rating: 6 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for rating < 0', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, rating: -1 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for an empty styleTags array', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, styleTags: [] });
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid style tag value', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, styleTags: ['not-a-tag'] });
    expect(res.status).toBe(400);
  });

  it('returns 400 for negative stock', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, stock: -1 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for an empty sizes array', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, sizes: [] });
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid colorGroup', async () => {
    const res = await request(app).post('/api/items').send({ ...validItem, colorGroup: 'rainbow' });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/items/:id
// ---------------------------------------------------------------------------

describe('PUT /api/items/:id', () => {
  it('replaces an item completely', async () => {
    const updated = { ...validItem, name: 'REPLACED TEE', price: 99 };
    const res = await request(app).put('/api/items/1').send(updated);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('REPLACED TEE');
    expect(res.body.price).toBe(99);
    expect(res.body.id).toBe('1');
  });

  it('preserves the original id after replace', async () => {
    const res = await request(app).put('/api/items/3').send(validItem);
    expect(res.body.id).toBe('3');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).put('/api/items/9999').send(validItem);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when the body is missing required fields', async () => {
    const res = await request(app).put('/api/items/1').send({ name: 'Only a name' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 for invalid field values', async () => {
    const res = await request(app).put('/api/items/1').send({ ...validItem, price: -5 });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/items/:id
// ---------------------------------------------------------------------------

describe('PATCH /api/items/:id', () => {
  it('partially updates only the provided fields', async () => {
    const res = await request(app).patch('/api/items/1').send({ price: 99.99 });
    expect(res.status).toBe(200);
    expect(res.body.price).toBe(99.99);
    expect(res.body.name).toBe('NEON SURGE TEE');
    expect(res.body.id).toBe('1');
  });

  it('can update inStock status', async () => {
    const res = await request(app).patch('/api/items/1').send({ inStock: false, stock: 0 });
    expect(res.status).toBe(200);
    expect(res.body.inStock).toBe(false);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).patch('/api/items/9999').send({ price: 10 });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 for an invalid price value', async () => {
    const res = await request(app).patch('/api/items/1').send({ price: -5 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 for an invalid category', async () => {
    const res = await request(app).patch('/api/items/1').send({ category: 'not_a_category' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for an invalid rating', async () => {
    const res = await request(app).patch('/api/items/1').send({ rating: 10 });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/items/:id
// ---------------------------------------------------------------------------

describe('DELETE /api/items/:id', () => {
  it('deletes an existing item and returns 204', async () => {
    const res = await request(app).delete('/api/items/1');
    expect(res.status).toBe(204);
  });

  it('item is no longer accessible after deletion', async () => {
    await request(app).delete('/api/items/1');
    const res = await request(app).get('/api/items/1');
    expect(res.status).toBe(404);
  });

  it('total count decreases after deletion', async () => {
    await request(app).delete('/api/items/1');
    const listRes = await request(app).get('/api/items?limit=100');
    expect(listRes.body.total).toBe(11);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).delete('/api/items/9999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ---------------------------------------------------------------------------
// Unknown routes
// ---------------------------------------------------------------------------

describe('Unknown routes', () => {
  it('returns 404 for an unregistered route', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
