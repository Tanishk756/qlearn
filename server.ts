/**
 * Q-Learn Nexus - Production Server Entry Point
 * Hosts the Express REST API and Vite development/production middleware.
 * @license Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createApp } from './server/src/app';
import { createServer as createViteServer } from 'vite';
import { closePool, checkDatabaseHealth, getPoolConfig } from './server/src/database/client';

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log(`[Q-Learn Nexus Server] Starting in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode...`);

  if (isProduction) {
    const config = getPoolConfig();
    console.log(`[Q-Learn Nexus Server] PostgreSQL Target: host=${config.host || 'socket'}, port=${config.port || 5432}, database=${config.database}, user=${config.user}`);
    console.log(`[Q-Learn Nexus Server] Local disk persistence: STRICTLY DISABLED.`);
  }

  const app = createApp();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Mount Vite development middleware or static production handler
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Q-Learn Nexus Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Q-Learn Nexus Server] Health endpoint: http://0.0.0.0:${PORT}/api/v1/health`);
    console.log(`[Q-Learn Nexus Server] Readiness probe: http://0.0.0.0:${PORT}/api/v1/ready`);

    // Verify database connection asynchronously
    checkDatabaseHealth().then((health) => {
      if (health.connected) {
        console.log(`[PostgreSQL] Connection probe succeeded (latency: ${health.latencyMs}ms). Authoritative storage active.`);
      } else {
        console.warn(`[PostgreSQL] Warning: Database connection probe failed (${health.error || 'unreachable'}). Server operating in fail-closed degraded mode.`);
      }
    }).catch(() => {
      console.warn(`[PostgreSQL] Warning: Database connection probe encountered error. Operating in fail-closed degraded mode.`);
    });
  });

  // Graceful shutdown handling for Cloud Run container lifecycle
  const gracefulShutdown = async (signal: string) => {
    console.log(`[Q-Learn Nexus Server] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
      console.log('[Q-Learn Nexus Server] HTTP server closed.');
      await closePool();
      process.exit(0);
    });

    // Hard timeout after 10 seconds if connections fail to close
    setTimeout(() => {
      console.error('[Q-Learn Nexus Server] Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[Q-Learn Nexus Server] Fatal error starting server:', err);
  process.exit(1);
});
