/**
 * Q-Learn Nexus - Express Application Configuration
 * Security middleware, JSON body parsing, cookies, API routing, and error handlers.
 * @license Apache-2.0
 */

import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { configureSecurityHeaders, configureCors } from './security/headers';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './api/routes';

export function createApp(): Express {
  const app = express();

  // 1. Trust proxy for Cloud Run reverse proxies
  app.set('trust proxy', 1);

  // 2. Security headers & CORS
  app.use(configureSecurityHeaders());
  app.use(configureCors());

  // 3. Request parsers
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cookieParser());

  // 4. Observability & Logging
  app.use(requestLogger);

  // 5. Mount API routes
  app.use('/api', apiRouter);

  // 6. Global error handler
  app.use(errorHandler);

  return app;
}
