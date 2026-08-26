/**
 * Q-Learn Nexus - Redis Client & Health Probe
 * Connection management for Redis caching, rate limiting, and queue orchestration.
 * @license Apache-2.0
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getCleanRedisUrl(): { url: string; useTls: boolean } | null {
  const raw = process.env.REDIS_URL;
  if (!raw) return null;
  const match = raw.match(/(rediss?:\/\/[^\s"']+)/);
  const url = match ? match[1] : raw;
  const useTls = raw.includes('--tls') || url.startsWith('rediss://');
  return { url, useTls };
}

export function getRedisClient(): Redis | null {
  const parsed = getCleanRedisUrl();
  if (!parsed) {
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(parsed.url, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectTimeout: 8000,
        lazyConnect: false,
        tls: parsed.useTls ? { rejectUnauthorized: false } : undefined,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 200, 1000);
        },
      });

      redisClient.on('error', (err) => {
        // Safe logging without exposing secrets
        console.warn('[Redis] Connection event notice:', err.message);
      });
    } catch (err: any) {
      console.warn('[Redis] Initialization notice:', err.message);
      return null;
    }
  }

  return redisClient;
}

export async function checkRedisHealth(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const parsed = getCleanRedisUrl();
  if (!parsed) {
    return {
      connected: false,
      error: 'REDIS_URL not configured',
    };
  }

  const client = getRedisClient();
  if (!client) {
    return {
      connected: false,
      error: 'Redis client initialization failed',
    };
  }

  const startTime = Date.now();
  try {
    const pingRes = await client.ping();
    const latencyMs = Date.now() - startTime;
    if (pingRes === 'PONG') {
      return {
        connected: true,
        latencyMs,
      };
    }
    return {
      connected: false,
      error: 'Unexpected ping response',
    };
  } catch (err: any) {
    return {
      connected: false,
      error: 'Redis unreachable or connection failed',
    };
  }
}

