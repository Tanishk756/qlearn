import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config();

const user = process.env.DB_USER || process.env.SQL_USER || 'qlearn_app';
const password = process.env.DB_PASSWORD || process.env.SQL_PASSWORD || '';
const database = process.env.DB_NAME || process.env.SQL_DB_NAME || 'qlearn_nexus';
const host = process.env.DB_HOST || process.env.SQL_HOST || 'localhost';
const port = process.env.DB_PORT || process.env.SQL_PORT || '5432';

const connectionString = process.env.DATABASE_URL || (
  password ? `postgresql://${user}:${password}@${host}:${port}/${database}` : undefined
);

export default defineConfig({
  schema: './server/src/database/schema/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: {
    url: connectionString || `postgresql://${user}:postgres@localhost:5432/${database}`,
  },
  verbose: true,
  strict: true,
});
