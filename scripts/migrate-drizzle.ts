/**
 * Q-Learn Nexus - Drizzle Database Migration Runner
 * Executes generated Drizzle SQL migrations against PostgreSQL.
 * @license Apache-2.0
 */

import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { pgDb, pool } from '../server/src/database/client';
import path from 'path';

export async function runDrizzleMigrations() {
  console.log('[Drizzle Migration] Connecting to PostgreSQL and executing migrations...');
  const migrationsFolder = path.join(process.cwd(), 'drizzle', 'migrations');
  
  try {
    await migrate(pgDb, { migrationsFolder });
    console.log('[Drizzle Migration] ✅ All Drizzle migrations executed successfully.');
    return { success: true };
  } catch (err: any) {
    console.error('[Drizzle Migration] ❌ Migration failed:', err.message);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].includes('migrate-drizzle')) {
  runDrizzleMigrations()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}
