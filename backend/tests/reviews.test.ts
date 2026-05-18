/**
 * reviews.test.ts — Bronze: test the Review entity CRUD (1-to-many with Item).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { store } from '../src/store/itemStore';

beforeEach(async () => {
  await store.reset(); // seeds 12 items with known IDs
});

const validReview = {
  author: 'Test User',
  rating: 4,
  comment: 'Great product overall.',
};

// --------------------------------------------------------------------------
// GET /api/items/:itemId/reviews
// --------------------------------------------------------------------------
describe('GET /api/items/:itemId/reviews', () => {
  it('returns an array for a known item', async () => {
    const res = await request(app).get('/api/items/1/reviews');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 404 for an unknown item', async () => {
    const res = await request(app).get('/api/items/9999/reviews');
    expect(res.status).toBe(404);
  });
});

// --------------------------------------------------------------------------
// POST /api/items/:itemId/reviews
// --------------------------------------------------------------------------
describe('POST /api/items/:itemId/reviews', () => {
  it('creates a review and returns 201', async () => {
    const res = await request(app).post('/api/items/1/reviews').send(validReview);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.itemId).toBe('1');
    expect(res.body.author).toBe(validReview.author);
    expect(res.body.rating).toBe(validReview.rating);
  });

  it('review appears in subsequent GET', async () => {
    await request(app).post('/api/items/1/reviews').send(validReview);
    const res = await request(app).get('/api/items/1/reviews');
    expect(res.status).toBe(200);
    expect(res.body.some((r: { author: string }) => r.author === validReview.author)).toBe(true);
  });

  it('returns 404 when creating a review for an unknown item', async () => {
    const res = await request(app).post('/api/items/9999/reviews').send(validReview);
    expect(res.status).toBe(404);
  });

  it('returns 400 for rating > 5', async () => {
    const res = await request(app).post('/api/items/1/reviews').send({ ...validReview, rating: 6 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for rating < 1', async () => {
    const res = await request(app).post('/api/items/1/reviews').send({ ...validReview, rating: 0 });
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing author', async () => {
    const res = await request(app).post('/api/items/1/reviews').send({ rating: 4, comment: 'ok' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing comment', async () => {
    const res = await request(app).post('/api/items/1/reviews').send({ author: 'Me', rating: 4 });
    expect(res.status).toBe(400);
  });
});

// --------------------------------------------------------------------------
// DELETE /api/items/:itemId/reviews/:reviewId
// --------------------------------------------------------------------------
describe('DELETE /api/items/:itemId/reviews/:reviewId', () => {
  it('deletes an existing review and returns 204', async () => {
    const created = await request(app).post('/api/items/1/reviews').send(validReview);
    const reviewId = created.body.id;
    const res = await request(app).delete(`/api/items/1/reviews/${reviewId}`);
    expect(res.status).toBe(204);
  });

  it('deleted review no longer appears in GET', async () => {
    const created = await request(app).post('/api/items/1/reviews').send(validReview);
    const reviewId = created.body.id;
    await request(app).delete(`/api/items/1/reviews/${reviewId}`);
    const listRes = await request(app).get('/api/items/1/reviews');
    expect(listRes.body.every((r: { id: string }) => r.id !== reviewId)).toBe(true);
  });

  it('returns 404 for an unknown reviewId', async () => {
    const res = await request(app).delete('/api/items/1/reviews/fake-id-9999');
    expect(res.status).toBe(404);
  });

  it('returns 404 when itemId does not match the review', async () => {
    const created = await request(app).post('/api/items/1/reviews').send(validReview);
    const reviewId = created.body.id;
    const res = await request(app).delete(`/api/items/2/reviews/${reviewId}`);
    expect(res.status).toBe(404);
  });
});
