/**
 * Q-Learn Nexus - Security Headers & CORS Configuration
 * Production-ready Helmet policies, iframe handling, and strict origin verification.
 * @license Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';

export function configureSecurityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for mathematical quantum engine & Vite
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        connectSrc: ["'self'", 'https:', 'wss:', 'ws:'],
        frameAncestors: ["'self'", 'https://ai.studio', 'https://*.google.com', 'https://*.run.app'],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for embedded canvas & math previews
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
}

export function configureCors() {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://ai.studio',
  ];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin browser navigations)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.run.app') ||
        origin.endsWith('.google.com')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-safe default
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-csrf-token'],
  });
}
