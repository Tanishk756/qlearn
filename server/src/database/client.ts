/**
 * Q-Learn Nexus - PostgreSQL Client & Connection Pool
 * Configures connection pooling, health probes, Drizzle ORM binding, and error isolation.
 * @license Apache-2.0
 */

import { Pool, PoolConfig } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/schema';

declare global {
  var _postgresPool: Pool | undefined;
}

/**
 * Builds standard connection pool parameters from environment variables.
 * Supports:
 * 1. Direct DATABASE_URL
 * 2. Cloud Run native Cloud SQL Unix Domain Socket (/cloudsql/INSTANCE_CONNECTION_NAME)
 * 3. VPC Private IP / TCP Direct Connect (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
 * 4. Local Development Fallback
 */
export function getPoolConfig(): PoolConfig {
  const max = parseInt(process.env.DB_POOL_MAX || '20', 10);
  const idleTimeoutMillis = parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10);
  const connectionTimeoutMillis = parseInt(process.env.DB_CONN_TIMEOUT_MS || '10000', 10);

  // 1. Direct DATABASE_URL
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    return {
      connectionString,
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
    };
  }

  const user = process.env.DB_USER || process.env.SQL_USER || 'qlearn_app';
  const password = process.env.DB_PASSWORD || process.env.SQL_PASSWORD || process.env.DB_PASS;
  const database = process.env.DB_NAME || process.env.SQL_DB_NAME || 'qlearn_nexus';

  // 2. Direct TCP / VPC Private IP (DB_HOST takes top precedence when set, such as 172.22.160.3)
  if (process.env.DB_HOST || process.env.SQL_HOST) {
    const host = process.env.DB_HOST || process.env.SQL_HOST || 'localhost';
    const port = parseInt(process.env.DB_PORT || process.env.SQL_PORT || '5432', 10);
    const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

    return {
      host,
      port,
      user,
      password,
      database,
      ssl,
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
    };
  }

  // 3. Cloud SQL Unix Domain Socket (Used when DB_SOCKET_PATH is set or INSTANCE_CONNECTION_NAME without DB_HOST)
  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME || process.env.CLOUD_SQL_INSTANCE;
  const dbSocketPath = process.env.DB_SOCKET_PATH || (instanceConnectionName ? `/cloudsql/${instanceConnectionName}` : undefined);

  if (dbSocketPath) {
    return {
      host: dbSocketPath,
      user,
      password,
      database,
      max,
      idleTimeoutMillis,
      connectionTimeoutMillis,
    };
  }

  // 4. Default Localhost Fallback
  return {
    host: 'localhost',
    port: 5432,
    user,
    password,
    database,
    max,
    idleTimeoutMillis,
    connectionTimeoutMillis,
  };
}

/**
 * Creates or retrieves the singleton PostgreSQL connection pool.
 */
export function getPool(forceNew = false): Pool {
  if (forceNew && global._postgresPool) {
    global._postgresPool.end().catch(() => {});
    global._postgresPool = undefined;
  }

  if (!global._postgresPool) {
    const config = getPoolConfig();
    global._postgresPool = new Pool(config);

    global._postgresPool.on('error', (err) => {
      console.error('[PostgreSQL Pool] Unexpected error on idle client:', err.message);
    });

    global._postgresPool.on('connect', () => {
      // Lazy connection established
    });
  }

  return global._postgresPool;
}

export async function resetPool(): Promise<void> {
  if (global._postgresPool) {
    try {
      await global._postgresPool.end();
    } catch {
      // Ignore
    }
    global._postgresPool = undefined;
  }
}

export const pool = getPool();
export const pgDb = drizzle(pool, { schema });

/**
 * Health check evaluator for database connectivity and connection pool metrics.
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  poolTotal: number;
  poolIdle: number;
  poolWaiting: number;
  latencyMs?: number;
  error?: string;
}> {
  const p = getPool();
  const startTime = Date.now();

  try {
    const client = await p.connect();
    try {
      await client.query('SELECT 1 as health_probe');
      const latencyMs = Date.now() - startTime;
      return {
        connected: true,
        poolTotal: p.totalCount,
        poolIdle: p.idleCount,
        poolWaiting: p.waitingCount,
        latencyMs,
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      connected: false,
      poolTotal: p.totalCount,
      poolIdle: p.idleCount,
      poolWaiting: p.waitingCount,
      error: 'Database connection probe failed',
    };
  }
}

/**
 * Gracefully shuts down the PostgreSQL connection pool.
 */
export async function closePool(): Promise<void> {
  if (global._postgresPool) {
    try {
      await global._postgresPool.end();
      global._postgresPool = undefined;
      console.log('[PostgreSQL Pool] Connection pool cleanly terminated.');
    } catch (err: any) {
      console.error('[PostgreSQL Pool] Error shutting down connection pool:', err.message);
    }
  }
}
