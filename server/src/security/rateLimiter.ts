/**
 * Q-Learn Nexus - Server-Side Rate Limiter
 * Sliding-window in-memory rate limiter with per-IP / per-User token buckets.
 * @license Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { logSecurityEvent } from './auditLogger';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  limiterName: string;
}) {
  const store = new Map<string, RateLimitRecord>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = (req.ip || '127.0.0.1') + '_' + options.limiterName;
    const now = Date.now();
    const record = store.get(key);

    if (!record || record.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    record.count++;

    if (record.count > options.maxRequests) {
      logSecurityEvent({
        eventType: 'RATE_LIMIT_EXCEEDED',
        severity: 'LOW',
        details: `Exceeded rate limit for ${options.limiterName}: ${record.count} requests in ${options.windowMs}ms`,
        ipAddress: req.ip,
      });

      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded for ${options.limiterName}. Please wait ${retryAfter} seconds before retrying.`,
      });
      return;
    }

    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  maxRequests: 10,
  limiterName: 'auth_endpoints',
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  limiterName: 'password_reset',
});

export const aiQueryRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  limiterName: 'ai_tutor',
});

export const simulationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  limiterName: 'quantum_simulation',
});

export const sandboxRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20,
  limiterName: 'sandbox_execution',
});
