/**
 * Q-Learn Nexus - Health, Readiness & Version Endpoints
 * @license Apache-2.0
 */

import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../database/client';
import { checkRedisHealth } from '../database/redis';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  const isHealthy = dbHealth.connected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbHealth.connected ? 'healthy' : 'unhealthy',
      latency_ms: dbHealth.latencyMs ?? null,
      pool: {
        total: dbHealth.poolTotal,
        idle: dbHealth.poolIdle,
        waiting: dbHealth.poolWaiting,
      },
    },
    redis: {
      status: redisHealth.connected ? 'healthy' : 'unavailable',
      latency_ms: redisHealth.latencyMs ?? null,
    },
  });
});

router.get('/ready', async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  if (dbHealth.connected) {
    res.json({ status: 'ready', database: 'connected' });
  } else {
    res.status(503).json({ status: 'unready', database: 'disconnected' });
  }
});

router.get('/version', (req: Request, res: Response) => {
  res.json({
    name: 'Q-Learn Nexus Quantum Simulation & Educational Platform',
    version: '1.0.0-production',
    engine: 'Nexus-Statevector-v1.4',
    aiIntegration: 'Google Gemini 3.7 Flash Server-Side',
    projectOwner: 'Tanishk Singhal (tanishk756)',
  });
});

export default router;
