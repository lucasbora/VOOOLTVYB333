"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../src/app"));
const itemStore_1 = require("../src/store/itemStore");
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
(0, vitest_1.beforeEach)(() => {
    itemStore_1.store.reset();
});
(0, vitest_1.describe)('GET /api/stats', () => {
    (0, vitest_1.it)('returns a stats object with all expected fields', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body).toHaveProperty('totalItems');
        (0, vitest_1.expect)(res.body).toHaveProperty('totalValue');
        (0, vitest_1.expect)(res.body).toHaveProperty('avgPrice');
        (0, vitest_1.expect)(res.body).toHaveProperty('avgRating');
        (0, vitest_1.expect)(res.body).toHaveProperty('inStockCount');
        (0, vitest_1.expect)(res.body).toHaveProperty('outOfStockCount');
        (0, vitest_1.expect)(res.body).toHaveProperty('featuredCount');
        (0, vitest_1.expect)(res.body).toHaveProperty('categoryBreakdown');
        (0, vitest_1.expect)(res.body).toHaveProperty('colorGroupBreakdown');
        (0, vitest_1.expect)(res.body).toHaveProperty('styleTagBreakdown');
        (0, vitest_1.expect)(res.body).toHaveProperty('priceRanges');
        (0, vitest_1.expect)(res.body).toHaveProperty('topRated');
    });
    (0, vitest_1.it)('totalItems is 12 for the initial seed data', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        (0, vitest_1.expect)(res.body.totalItems).toBe(12);
    });
    (0, vitest_1.it)('inStockCount + outOfStockCount equals totalItems', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        (0, vitest_1.expect)(res.body.inStockCount + res.body.outOfStockCount).toBe(res.body.totalItems);
    });
    (0, vitest_1.it)('avgPrice is a positive number', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        (0, vitest_1.expect)(res.body.avgPrice).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('avgRating is between 0 and 5', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        (0, vitest_1.expect)(res.body.avgRating).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(res.body.avgRating).toBeLessThanOrEqual(5);
    });
    (0, vitest_1.it)('totalValue equals sum of price * stock for all items', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        const listRes = await (0, supertest_1.default)(app_1.default).get('/api/items?limit=100');
        const expected = listRes.body.data.reduce((sum, i) => sum + i.price * i.stock, 0);
        (0, vitest_1.expect)(res.body.totalValue).toBe(expected);
    });
    (0, vitest_1.it)('categoryBreakdown counts sum to totalItems', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        const sum = Object.values(res.body.categoryBreakdown).reduce((a, b) => a + b, 0);
        (0, vitest_1.expect)(sum).toBe(res.body.totalItems);
    });
    (0, vitest_1.it)('colorGroupBreakdown counts sum to totalItems', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        const sum = Object.values(res.body.colorGroupBreakdown).reduce((a, b) => a + b, 0);
        (0, vitest_1.expect)(sum).toBe(res.body.totalItems);
    });
    (0, vitest_1.it)('priceRanges counts sum to totalItems', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        const { priceRanges } = res.body;
        const sum = priceRanges['$0-50'] + priceRanges['$51-80'] + priceRanges['$81-120'] + priceRanges['$120+'];
        (0, vitest_1.expect)(sum).toBe(res.body.totalItems);
    });
    (0, vitest_1.it)('topRated has at most 5 items', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        (0, vitest_1.expect)(res.body.topRated.length).toBeLessThanOrEqual(5);
    });
    (0, vitest_1.it)('topRated items are sorted by rating descending', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        const ratings = res.body.topRated.map((i) => i.rating);
        for (let i = 0; i < ratings.length - 1; i++) {
            (0, vitest_1.expect)(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]);
        }
    });
    (0, vitest_1.it)('each topRated entry has id, name, and rating', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        for (const item of res.body.topRated) {
            (0, vitest_1.expect)(item).toHaveProperty('id');
            (0, vitest_1.expect)(item).toHaveProperty('name');
            (0, vitest_1.expect)(item).toHaveProperty('rating');
        }
    });
    (0, vitest_1.it)('totalItems updates after adding an item', async () => {
        await (0, supertest_1.default)(app_1.default).post('/api/items').send(newItem);
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        (0, vitest_1.expect)(res.body.totalItems).toBe(13);
    });
    (0, vitest_1.it)('totalItems updates after deleting an item', async () => {
        await (0, supertest_1.default)(app_1.default).delete('/api/items/1');
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        (0, vitest_1.expect)(res.body.totalItems).toBe(11);
    });
    (0, vitest_1.it)('returns zero values for an empty store', async () => {
        itemStore_1.store.clear();
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        (0, vitest_1.expect)(res.status).toBe(200);
        (0, vitest_1.expect)(res.body.totalItems).toBe(0);
        (0, vitest_1.expect)(res.body.avgPrice).toBe(0);
        (0, vitest_1.expect)(res.body.avgRating).toBe(0);
        (0, vitest_1.expect)(res.body.totalValue).toBe(0);
        (0, vitest_1.expect)(res.body.topRated).toHaveLength(0);
    });
    (0, vitest_1.it)('featuredCount matches number of featured items in the list', async () => {
        const listRes = await (0, supertest_1.default)(app_1.default).get('/api/items?limit=100');
        const expectedFeatured = listRes.body.data.filter((i) => i.featured).length;
        const statsRes = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        (0, vitest_1.expect)(statsRes.body.featuredCount).toBe(expectedFeatured);
    });
    (0, vitest_1.it)('styleTagBreakdown includes at least one known tag', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/stats');
        (0, vitest_1.expect)(res.body.styleTagBreakdown).toHaveProperty('streetwear');
    });
});
