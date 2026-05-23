import { Request, Response, NextFunction } from 'express';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message: string;
}

interface RateRecord {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter (no external deps).
 * Counts requests per IP address in a sliding window.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, max, message } = options;
  const store = new Map<string, RateRecord>();

  // Clean up expired entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now >= record.resetAt) store.delete(key);
    }
  }, 60_000);

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    // Skip rate limiting in test environment
    if (process.env.NODE_ENV === 'test') {
      next();
      return;
    }

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
      ?? req.socket.remoteAddress
      ?? 'unknown';

    const now = Date.now();
    const record = store.get(ip);

    if (!record || now >= record.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    record.count += 1;

    if (record.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((record.resetAt - now) / 1000)));
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}
