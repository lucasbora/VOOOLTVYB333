"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const itemStore_1 = require("../src/store/itemStore");
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
(0, vitest_1.beforeEach)(() => {
    itemStore_1.store.reset();
});
// ---------------------------------------------------------------------------
// GET /api/items
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('GET /api/items', () => {
    (0, vitest_1.it)('returns paginated list with defaults (page=1, limit=10)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.page).toBe(1);
        (0, vitest_1.expect)(res.body.limit).toBe(10);
        (0, vitest_1.expect)(res.body.total).toBe(12);
        (0, vitest_1.expect)(res.body.totalPages).toBe(2);
        (0, vitest_1.expect)(res.body.data).toHaveLength(10);
    });
    (0, vitest_1.it)('returns page 2 with remaining items', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items?page=2&limit=10');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.page).toBe(2);
        (0, vitest_1.expect)(res.body.data).toHaveLength(2);
    });
    (0, vitest_1.it)('respects a custom limit', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items?limit=5');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data).toHaveLength(5);
        (0, vitest_1.expect)(res.body.totalPages).toBe(3);
    });
    (0, vitest_1.it)('returns empty data array for an out-of-range page', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items?page=999');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data).toHaveLength(0);
        (0, vitest_1.expect)(res.body.total).toBe(12);
    });
    (0, vitest_1.it)('filters by category', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items?category=tee');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.every((i) => i.category === 'tee')).toBe(true);
    });
    (0, vitest_1.it)('filters by inStock=true', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items?inStock=true');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.every((i) => i.inStock === true)).toBe(true);
    });
    (0, vitest_1.it)('filters by inStock=false', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items?inStock=false');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.every((i) => i.inStock === false)).toBe(true);
    });
    (0, vitest_1.it)('filters by colorGroup', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items?colorGroup=dark');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.data.every((i) => i.colorGroup === 'dark')).toBe(true);
    });
    (0, vitest_1.it)('returns 400 for page=0 (invalid)', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items?page=0');
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body).toHaveProperty('errors');
    });
    (0, vitest_1.it)('returns 400 for limit > 100', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items?limit=200');
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body).toHaveProperty('errors');
    });
    (0, vitest_1.it)('returns 400 for limit=0', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items?limit=0');
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('pagination metadata is correct after creating an item', async () => {
        await (0, supertest_1.default)(app_1.default).post('/api/items').send(validItem);
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items?limit=10');
        (0, vitest_1.expect)(res.body.total).toBe(13);
        (0, vitest_1.expect)(res.body.totalPages).toBe(2);
    });
});
// ---------------------------------------------------------------------------
// GET /api/items/:id
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('GET /api/items/:id', () => {
    (0, vitest_1.it)('returns an item by id', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items/1');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.id).toBe('1');
        (0, vitest_1.expect)(res.body.name).toBe('NEON SURGE TEE');
    });
    (0, vitest_1.it)('returns 404 for an unknown id', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items/9999');
        (0, vitest_1.expect)(res.status).toBe(404);
        (0, vitest_1.expect)(res.body).toHaveProperty('error');
    });
});
// ---------------------------------------------------------------------------
// POST /api/items
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('POST /api/items', () => {
    (0, vitest_1.it)('creates an item and returns 201 with the new item', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send(validItem);
        (0, vitest_1.expect)(res.status).toBe(201);
        (0, vitest_1.expect)(res.body).toMatchObject(validItem);
        (0, vitest_1.expect)(res.body.id).toBeDefined();
    });
    (0, vitest_1.it)('assigns a unique id to the created item', async () => {
        const r1 = await (0, supertest_1.default)(app_1.default).post('/api/items').send(validItem);
        const r2 = await (0, supertest_1.default)(app_1.default).post('/api/items').send(validItem);
        (0, vitest_1.expect)(r1.body.id).not.toBe(r2.body.id);
    });
    (0, vitest_1.it)('persists the created item so it appears in the list', async () => {
        await (0, supertest_1.default)(app_1.default).post('/api/items').send(validItem);
        const listRes = await (0, supertest_1.default)(app_1.default).get('/api/items?limit=100');
        (0, vitest_1.expect)(listRes.body.total).toBe(13);
    });
    (0, vitest_1.it)('returns 400 when required fields are missing', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ name: 'Incomplete' });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body).toHaveProperty('errors');
    });
    (0, vitest_1.it)('returns 400 for an invalid category', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, category: 'invalid' });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for a negative price', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, price: -10 });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for price = 0', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, price: 0 });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for an invalid hex color', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, colorHex: 'notahex' });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for an invalid imageUrl', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, imageUrl: 'not-a-url' });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for rating > 5', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, rating: 6 });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for rating < 0', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, rating: -1 });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for an empty styleTags array', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, styleTags: [] });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for an invalid style tag value', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, styleTags: ['not-a-tag'] });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for negative stock', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, stock: -1 });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for an empty sizes array', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, sizes: [] });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for an invalid colorGroup', async () => {
        const res = await (0, supertest_1.default)(app_1.default).post('/api/items').send({ ...validItem, colorGroup: 'rainbow' });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
});
// ---------------------------------------------------------------------------
// PUT /api/items/:id
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('PUT /api/items/:id', () => {
    (0, vitest_1.it)('replaces an item completely', async () => {
        const updated = { ...validItem, name: 'REPLACED TEE', price: 99 };
        const res = await (0, supertest_1.default)(app_1.default).put('/api/items/1').send(updated);
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.name).toBe('REPLACED TEE');
        (0, vitest_1.expect)(res.body.price).toBe(99);
        (0, vitest_1.expect)(res.body.id).toBe('1');
    });
    (0, vitest_1.it)('preserves the original id after replace', async () => {
        const res = await (0, supertest_1.default)(app_1.default).put('/api/items/3').send(validItem);
        (0, vitest_1.expect)(res.body.id).toBe('3');
    });
    (0, vitest_1.it)('returns 404 for an unknown id', async () => {
        const res = await (0, supertest_1.default)(app_1.default).put('/api/items/9999').send(validItem);
        (0, vitest_1.expect)(res.status).toBe(404);
        (0, vitest_1.expect)(res.body).toHaveProperty('error');
    });
    (0, vitest_1.it)('returns 400 when the body is missing required fields', async () => {
        const res = await (0, supertest_1.default)(app_1.default).put('/api/items/1').send({ name: 'Only a name' });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body).toHaveProperty('errors');
    });
    (0, vitest_1.it)('returns 400 for invalid field values', async () => {
        const res = await (0, supertest_1.default)(app_1.default).put('/api/items/1').send({ ...validItem, price: -5 });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
});
// ---------------------------------------------------------------------------
// PATCH /api/items/:id
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('PATCH /api/items/:id', () => {
    (0, vitest_1.it)('partially updates only the provided fields', async () => {
        const res = await (0, supertest_1.default)(app_1.default).patch('/api/items/1').send({ price: 99.99 });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.price).toBe(99.99);
        (0, vitest_1.expect)(res.body.name).toBe('NEON SURGE TEE');
        (0, vitest_1.expect)(res.body.id).toBe('1');
    });
    (0, vitest_1.it)('can update inStock status', async () => {
        const res = await (0, supertest_1.default)(app_1.default).patch('/api/items/1').send({ inStock: false, stock: 0 });
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.inStock).toBe(false);
    });
    (0, vitest_1.it)('returns 404 for an unknown id', async () => {
        const res = await (0, supertest_1.default)(app_1.default).patch('/api/items/9999').send({ price: 10 });
        (0, vitest_1.expect)(res.status).toBe(404);
        (0, vitest_1.expect)(res.body).toHaveProperty('error');
    });
    (0, vitest_1.it)('returns 400 for an invalid price value', async () => {
        const res = await (0, supertest_1.default)(app_1.default).patch('/api/items/1').send({ price: -5 });
        (0, vitest_1.expect)(res.status).toBe(400);
        (0, vitest_1.expect)(res.body).toHaveProperty('errors');
    });
    (0, vitest_1.it)('returns 400 for an invalid category', async () => {
        const res = await (0, supertest_1.default)(app_1.default).patch('/api/items/1').send({ category: 'not_a_category' });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
    (0, vitest_1.it)('returns 400 for an invalid rating', async () => {
        const res = await (0, supertest_1.default)(app_1.default).patch('/api/items/1').send({ rating: 10 });
        (0, vitest_1.expect)(res.status).toBe(400);
    });
});
// ---------------------------------------------------------------------------
// DELETE /api/items/:id
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('DELETE /api/items/:id', () => {
    (0, vitest_1.it)('deletes an existing item and returns 204', async () => {
        const res = await (0, supertest_1.default)(app_1.default).delete('/api/items/1');
        (0, vitest_1.expect)(res.status).toBe(204);
    });
    (0, vitest_1.it)('item is no longer accessible after deletion', async () => {
        await (0, supertest_1.default)(app_1.default).delete('/api/items/1');
        const res = await (0, supertest_1.default)(app_1.default).get('/api/items/1');
        (0, vitest_1.expect)(res.status).toBe(404);
    });
    (0, vitest_1.it)('total count decreases after deletion', async () => {
        await (0, supertest_1.default)(app_1.default).delete('/api/items/1');
        const listRes = await (0, supertest_1.default)(app_1.default).get('/api/items?limit=100');
        (0, vitest_1.expect)(listRes.body.total).toBe(11);
    });
    (0, vitest_1.it)('returns 404 for an unknown id', async () => {
        const res = await (0, supertest_1.default)(app_1.default).delete('/api/items/9999');
        (0, vitest_1.expect)(res.status).toBe(404);
        (0, vitest_1.expect)(res.body).toHaveProperty('error');
    });
});
// ---------------------------------------------------------------------------
// Unknown routes
// ---------------------------------------------------------------------------
(0, vitest_1.describe)('Unknown routes', () => {
    (0, vitest_1.it)('returns 404 for an unregistered route', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/unknown-route');
        (0, vitest_1.expect)(res.status).toBe(404);
        (0, vitest_1.expect)(res.body).toHaveProperty('error');
    });
});
