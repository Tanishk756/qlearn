/**
 * Q-Learn Nexus - Production Error Handling Middleware
 * Suppresses internal stack traces and secrets in production responses while logging structured debug details.
 * @license Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { ObservableRequest } from './requestLogger';

export function errorHandler(
  err: any,
  req: ObservableRequest,
  res: Response,
  next: NextFunction
): void {
  const reqId = req.requestId || 'unknown';
  const statusCode = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  console.error(`[ERROR][${reqId}] Unhandled server exception:`, err);

  res.status(statusCode).json({
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: isProd && statusCode === 500
      ? 'An internal error occurred while processing your quantum request. Please try again later.'
      : err.message || 'An error occurred',
    requestId: reqId,
    timestamp: new Date().toISOString(),
  });
}
