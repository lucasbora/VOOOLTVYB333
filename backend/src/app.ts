import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { createHandler } from 'graphql-http/lib/use/express';
import itemsRouter from './routes/items';
import statsRouter from './routes/stats';
import generatorRouter from './routes/generator';
import reviewsRouter from './routes/reviews';
import authRouter from './routes/auth';
import adminRouter from './routes/admin';
import chatRouter from './routes/chat';
import { schema } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { attachUser } from './middleware/auth';
import { createRateLimiter } from './middleware/rateLimiter';
import { securityHeaders } from './middleware/securityHeaders';

const app = express();

// Apply security headers first (HSTS, CSP, X-Frame-Options, etc.)
app.use(securityHeaders);

// Allow cross-origin requests from any origin (required for LAN cross-machine access).
// In production, restrict this to specific origins.
app.use(cors({
  origin: true,             // reflect the request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
}));
app.options('*', cors());  // pre-flight for all routes

app.use(express.json());
app.use(attachUser);

// General rate limiter for all API endpoints (max 100 requests/min)
const generalLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 100,
  message: 'Too many requests from this IP. Please try again in a minute.',
});
app.use('/api', generalLimiter);

// Strict rate limiter for sensitive authentication endpoints (max 20 attempts/min)
const authLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  message: 'Too many authentication attempts. Please try again in a minute.',
});
app.use('/api/auth/login',          authLimiter);
app.use('/api/auth/register',       authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

app.use('/api/auth',              authRouter);
app.use('/api/items',             itemsRouter);
app.use('/api/items/:itemId/reviews', reviewsRouter);
app.use('/api/stats',             statsRouter);
app.use('/api/generator',         generatorRouter);
app.use('/api/admin',             adminRouter);
app.use('/api/chat',              chatRouter);

app.use('/graphql', createHandler({ schema, rootValue: resolvers }));

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
