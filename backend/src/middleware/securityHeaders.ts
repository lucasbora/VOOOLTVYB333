import { Request, Response, NextFunction } from 'express';

/**
 * Applies a set of security-focused HTTP response headers.
 * These harden the app against common web vulnerabilities.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent browsers from MIME-sniffing the content type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Block the page from being framed (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS filter in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Force HTTPS for all future requests (1 year)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Restrict referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy — restrict resource origins
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' wss: ws:;"
  );

  // Don't expose the server technology
  res.removeHeader('X-Powered-By');

  next();
}
