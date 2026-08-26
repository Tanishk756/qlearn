/**
 * Q-Learn Nexus - Request Logger & Observability Middleware
 * Generates unique request IDs, measures latency, and logs structured telemetry.
 * @license Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface ObservableRequest extends Request {
  requestId?: string;
  startTime?: number;
}

export function requestLogger(req: ObservableRequest, res: Response, next: NextFunction): void {
  const reqId = `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  req.requestId = reqId;
  req.startTime = Date.now();

  res.setHeader('X-Request-ID', reqId);

  res.on('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    const statusCode = res.statusCode;
    const method = req.method;
    const url = req.originalUrl || req.url;

    if (!url.startsWith('/@') && !url.includes('node_modules') && !url.includes('.vite')) {
      console.log(`[HTTP] ${method} ${url} ${statusCode} - ${duration}ms [${reqId}]`);
    }
  });

  next();
}
