/**
 * Q-Learn Nexus - Production Server Entry Point
 * Hosts the Express REST API and Vite development/production middleware.
 * @license Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createApp } from './server/src/app';
import { createServer as createViteServer } from 'vite';
import { closePool } from './server/src/database/client';

async function startServer() {
  const app = createApp();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Mount Vite development middleware or static production handler
  if (process.env.NODE_ENV !== 'production') {
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
    console.log(`[Q-Learn Nexus Server] Running on port ${PORT}`);
    console.log(`[Q-Learn Nexus Server] API Root: /api/v1`);
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
