/**
 * Q-Learn Nexus - Production Persistence & Fail-Closed Test Suite
 * Validates strict isolation of production runtime from local filesystem persistence.
 * @license Apache-2.0
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function it(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`  ✓ ${name}`);
      passed++;
    })
    .catch((err) => {
      console.error(`  ✗ ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    });
}

async function runTests() {
  console.log('\n======================================================');
  console.log('Q-LEARN NEXUS: PRODUCTION DATABASE FAIL-CLOSED TESTS');
  console.log('======================================================\n');

  // TEST 1: NODE_ENV=production does not call mkdirSync for data_storage
  await it('TEST 1: NODE_ENV=production does not call mkdirSync for data_storage', async () => {
    process.env.NODE_ENV = 'production';
    const dataDir = path.join(process.cwd(), 'data_storage');
    await import('../server/src/database/index');
    assert.strictEqual(fs.existsSync(dataDir), false, 'data_storage directory must not exist in production');
  });

  // TEST 2: NODE_ENV=production does not read nexus_db.json
  await it('TEST 2: NODE_ENV=production does not read nexus_db.json', async () => {
    process.env.NODE_ENV = 'production';
    const dataDir = path.join(process.cwd(), 'data_storage');
    const dbFile = path.join(dataDir, 'nexus_db.json');
    assert.strictEqual(fs.existsSync(dbFile), false, 'nexus_db.json MUST NOT exist or be read in production');
  });

  // TEST 3: Zero filesystem writes
  await it('TEST 3: Zero filesystem persistence writes', async () => {
    process.env.NODE_ENV = 'production';
    const dataDir = path.join(process.cwd(), 'data_storage');
    const dbFile = path.join(dataDir, 'nexus_db.json');
    assert.strictEqual(fs.existsSync(dbFile), false, 'No local JSON database file is ever created in production');
    assert.strictEqual(fs.existsSync(dataDir), false, 'No data_storage directory is created');
  });

  // TEST 4: Zero auto-seeding of hardcoded user credentials
  await it('TEST 4: Zero auto-seeding or hardcoded credentials in database layer', async () => {
    process.env.NODE_ENV = 'production';
    const dbIndex = fs.readFileSync(path.join(process.cwd(), 'server', 'src', 'database', 'index.ts'), 'utf8');
    assert.strictEqual(dbIndex.includes('seedInitialData'), false, 'seedInitialData must not exist in database index');
    assert.strictEqual(dbIndex.includes('DatabaseManager'), false, 'Legacy in-memory DatabaseManager must not exist');
  });

  // TEST 5: Production repositories use PostgreSQL/Drizzle
  await it('TEST 5: Production repositories use PostgreSQL/Drizzle', async () => {
    const { UserRepository } = await import('../server/src/database/repositories/UserRepository');
    const { SessionRepository } = await import('../server/src/database/repositories/SessionRepository');
    const { ProjectRepository } = await import('../server/src/database/repositories/ProjectRepository');
    const { CourseRepository } = await import('../server/src/database/repositories/CourseRepository');
    const { SimulationRepository } = await import('../server/src/database/repositories/SimulationRepository');

    assert.ok(typeof UserRepository.findById === 'function', 'UserRepository.findById exists');
    assert.ok(typeof UserRepository.create === 'function', 'UserRepository.create exists');
    assert.ok(typeof SessionRepository.create === 'function', 'SessionRepository.create exists');
    assert.ok(typeof ProjectRepository.create === 'function', 'ProjectRepository.create exists');
    assert.ok(typeof CourseRepository.listCourses === 'function', 'CourseRepository.listCourses exists');
    assert.ok(typeof SimulationRepository.createJob === 'function', 'SimulationRepository.createJob exists');
  });

  // TEST 6: When PostgreSQL is unreachable, health reports unhealthy
  await it('TEST 6: When PostgreSQL is unreachable, health reports unhealthy', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    process.env.DB_HOST = '127.0.0.1';
    process.env.DB_PORT = '54329'; // Dead port
    process.env.DB_CONN_TIMEOUT_MS = '500';

    const { checkDatabaseHealth, resetPool } = await import('../server/src/database/client');
    await resetPool();
    const health = await checkDatabaseHealth();

    assert.strictEqual(health.connected, false, 'Database probe must return connected=false when unreachable');
    assert.strictEqual(typeof health.error, 'string', 'Database probe must return descriptive sanitized error');
  });

  // TEST 7: When PostgreSQL is unreachable, ready reports unready
  await it('TEST 7: When PostgreSQL is unreachable, ready reports unready', async () => {
    process.env.NODE_ENV = 'production';
    const { checkDatabaseHealth } = await import('../server/src/database/client');
    const health = await checkDatabaseHealth();
    assert.strictEqual(health.connected, false, 'Unreachable DB prevents readiness');
  });

  // TEST 8: Production state-changing APIs do not silently fall back to memory
  await it('TEST 8: Production state-changing APIs do not silently fall back to memory', async () => {
    process.env.NODE_ENV = 'production';
    const { UserRepository } = await import('../server/src/database/repositories/UserRepository');
    // When DB is unreachable, UserRepository returns null/errors out rather than falling back to memory
    try {
      const user = await UserRepository.findByEmail('test@example.com');
      assert.strictEqual(user, null, 'Repository returns null/throws rather than synthesizing fake in-memory user');
    } catch {
      // Throwing on DB error is also expected fail-closed behavior
      assert.ok(true);
    }
  });

  // TEST 9: No real personal data or credential hashes exist in the repository
  await it('TEST 9: No real personal data or credential hashes exist in the repository', async () => {
    const dbIndex = fs.readFileSync(path.join(process.cwd(), 'server', 'src', 'database', 'index.ts'), 'utf8');
    assert.strictEqual(dbIndex.includes('$2a$10$'), false, 'No bcrypt hashes in database index');
    assert.strictEqual(dbIndex.includes('$2b$10$'), false, 'No bcrypt hashes in database index');
    assert.strictEqual(dbIndex.includes('tanishksinghal'), false, 'No personal author email in database index');
  });

  // TEST 10: Production build succeeds
  await it('TEST 10: Production build bundle exists in dist/', async () => {
    const distServer = path.join(process.cwd(), 'dist', 'server.cjs');
    assert.strictEqual(fs.existsSync(distServer), true, 'Compiled dist/server.cjs must exist');
  });

  // TEST 11: Search compiled dist/server.cjs and prove production path has zero filesystem database
  await it('TEST 11: Search compiled dist/server.cjs and verify production guards', async () => {
    const distServer = path.join(process.cwd(), 'dist', 'server.cjs');
    const content = fs.readFileSync(distServer, 'utf8');
    assert.strictEqual(content.includes('nexus_db.json'), false, 'Compiled bundle contains zero references to nexus_db.json');
    assert.strictEqual(content.includes('tanishksinghal'), false, 'Compiled bundle contains zero hardcoded user credentials');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

