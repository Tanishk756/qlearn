/**
 * Q-Learn Nexus - Transaction Management Layer
 * Provides atomic execution scopes with automatic rollback on error.
 * @license Apache-2.0
 */

import { pgDb, pool } from './client';

/**
 * Runs a transactional callback using Drizzle ORM's transaction runner.
 * Automatically commits on success and rolls back on unhandled error.
 */
export async function withTransaction<T>(
  callback: (tx: Parameters<Parameters<typeof pgDb.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  try {
    return await pgDb.transaction(async (tx) => {
      return await callback(tx);
    });
  } catch (err: any) {
    console.error('[Database Transaction Failed]:', err.message);
    throw err;
  }
}

/**
 * Runs a raw client transaction using the pg connection pool directly.
 */
export async function withRawTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
