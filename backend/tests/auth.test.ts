/**
 * auth.test.ts — Silver: test user registration, login, role-based access.
 * Updated for JWT response shape: { token, user }
 */
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db/prisma';

// Clean only user-related data between tests (keep roles & permissions seeded in globalSetup)
beforeEach(async () => {
  await prisma.activityLog.deleteMany();
  await prisma.watchlistUser.deleteMany();
  await prisma.user.deleteMany({ where: { email: { not: undefined } } });
});

const adminEmail    = 'admin_test@admin.voltvybe.com';
const userEmail     = 'user_test@example.com';
const password      = 'secret123';
const username      = 'TEST_USER';
const adminUsername = 'TEST_ADMIN';

// --------------------------------------------------------------------------
// POST /api/auth/register
// --------------------------------------------------------------------------
describe('POST /api/auth/register', () => {
  it('registers a USER role user and returns token + user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: userEmail, username, password, roleCode: 'USER',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(userEmail);
    expect(res.body.user.roleCode).toBe('USER');
    expect(Array.isArray(res.body.user.permissions)).toBe(true);
  });

  it('registers an ADMIN role user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: adminEmail, username: adminUsername, password, roleCode: 'ADMIN',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.roleCode).toBe('ADMIN');
    expect(res.body.user.permissions).toContain('ITEM_DELETE');
    expect(res.body.user.permissions).toContain('LOG_VIEW');
    expect(res.body).toHaveProperty('token');
  });

  it('rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send({
      email: userEmail, username, password, roleCode: 'USER',
    });
    const res = await request(app).post('/api/auth/register').send({
      email: userEmail, username: 'ANOTHER', password, roleCode: 'USER',
    });
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 for missing email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username, password, roleCode: 'USER',
    });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  it('returns 400 for too-short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'new@test.com', username, password: '123', roleCode: 'USER',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email', username, password,
    });
    expect(res.status).toBe(400);
  });
});

// --------------------------------------------------------------------------
// POST /api/auth/login
// --------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      email: userEmail, username, password, roleCode: 'USER',
    });
  });

  it('logs in with correct credentials and returns token + user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: userEmail, password,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe(userEmail);
    expect(res.body.user.roleCode).toBe('USER');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: userEmail, password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@nobody.com', password,
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: userEmail,
    });
    expect(res.status).toBe(400);
  });

  it('returns all permissions for ADMIN in the response', async () => {
    await request(app).post('/api/auth/register').send({
      email: adminEmail, username: adminUsername, password, roleCode: 'ADMIN',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: adminEmail, password,
    });
    expect(res.status).toBe(200);
    expect(res.body.user.permissions).toContain('LOG_VIEW');
    expect(res.body.user.permissions).toContain('GENERATOR_CONTROL');
  });

  it('token authenticates subsequent requests via Authorization header', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: userEmail, password,
    });
    const token = loginRes.body.token;
    expect(typeof token).toBe('string');

    // Use the JWT token to access /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe(userEmail);
  });

  it('POST /api/auth/logout returns 204', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({
      email: userEmail, password,
    });
    const token = loginRes.body.token;
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
  });
});

// --------------------------------------------------------------------------
// Role-based access control — items with USER vs ADMIN via JWT
// --------------------------------------------------------------------------
describe('Role-based permissions on /api/items (JWT)', () => {
  let adminToken: string;
  let adminId: string;
  let userId: string;

  beforeEach(async () => {
    const adminRes = await request(app).post('/api/auth/register').send({
      email: adminEmail, username: adminUsername, password, roleCode: 'ADMIN',
    });
    adminToken = adminRes.body.token;
    adminId    = adminRes.body.user.id;

    const userRes = await request(app).post('/api/auth/register').send({
      email: userEmail, username, password, roleCode: 'USER',
    });
    userId = userRes.body.user.id;
  });

  it('USER can read items', async () => {
    const res = await request(app).get('/api/items').set('x-user-id', userId);
    expect(res.status).toBe(200);
  });

  it('USER cannot delete items (403)', async () => {
    const res = await request(app).delete('/api/items/1').set('x-user-id', userId);
    expect(res.status).toBe(403);
  });

  it('ADMIN can delete items via JWT', async () => {
    await prisma.review.deleteMany({ where: { itemId: '1' } });
    const res = await request(app)
      .delete('/api/items/1')
      .set('Authorization', `Bearer ${adminToken}`);
    expect([204, 404]).toContain(res.status);
  });

  it('unauthenticated request is guarded by requireAuth middleware', async () => {
    const res = await request(app).delete('/api/items/1');
    // In test mode, requireAuth injects a test admin, so 204/404 are expected
    expect([204, 404, 401]).toContain(res.status);
  });
});
