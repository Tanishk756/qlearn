/**
 * Q-Learn Nexus - End-to-End Authentication & Persistence Verification Suite
 * Verifies real PostgreSQL round-trip operations for Auth, Projects, Circuits, and Simulations.
 * @license Apache-2.0
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { checkDatabaseHealth } from '../server/src/database/client';
import { UserRepository } from '../server/src/database/repositories/UserRepository';
import { SessionRepository } from '../server/src/database/repositories/SessionRepository';
import { ProjectRepository } from '../server/src/database/repositories/ProjectRepository';
import { SimulationRepository } from '../server/src/database/repositories/SimulationRepository';
import { NotificationRepository } from '../server/src/database/repositories/NotificationRepository';
import { AuditRepository } from '../server/src/database/repositories/AuditRepository';

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

async function runE2E() {
  console.log('\n======================================================');
  console.log('Q-LEARN NEXUS: POSTGRESQL AUTHORITATIVE PERSISTENCE E2E');
  console.log('======================================================\n');

  // STEP 1: Database Health Probe
  await it('STEP 1: Database connection probe returns healthy and ready', async () => {
    const health = await checkDatabaseHealth();
    assert.strictEqual(health.connected, true, 'PostgreSQL connection must be live');
    assert.ok(health.latencyMs >= 0, 'Latency must be measurable');
  });

  const uniqueSuffix = crypto.randomBytes(4).toString('hex');
  const testUserId = `usr_e2e_${uniqueSuffix}`;
  const testEmail = `e2e_user_${uniqueSuffix}@example.com`;
  const plainPassword = `SecurePass_${uniqueSuffix}!`;
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  // STEP 2: User Registration & Persistence
  await it('STEP 2: Create and persist new user in PostgreSQL', async () => {
    const created = await UserRepository.create({
      id: testUserId,
      email: testEmail,
      username: `user_${uniqueSuffix}`,
      password_hash: passwordHash,
      name: `E2E Test User ${uniqueSuffix}`,
      role: 'STUDENT',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    assert.strictEqual(created.id, testUserId);
    assert.strictEqual(created.email, testEmail);

    const fetched = await UserRepository.findById(testUserId);
    assert.ok(fetched, 'User must be retrievable from PostgreSQL');
    assert.strictEqual(fetched?.email, testEmail);
  });

  // STEP 3: Authentication & Password Verification
  await it('STEP 3: Verify user credentials via bcrypt against PostgreSQL hash', async () => {
    const user = await UserRepository.findByEmail(testEmail);
    assert.ok(user, 'User must be found by email');
    const isMatch = await bcrypt.compare(plainPassword, user.password_hash);
    assert.strictEqual(isMatch, true, 'Password match must succeed');
  });

  // STEP 4: Session Creation & Persistence
  const sessionId = `sess_${uniqueSuffix}`;
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await it('STEP 4: Create and persist user session in PostgreSQL', async () => {
    await SessionRepository.create({
      id: sessionId,
      user_id: testUserId,
      token_hash: tokenHash,
      ip_address: '127.0.0.1',
      user_agent: 'E2E-Verifier/1.0',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });

    const result = await SessionRepository.findByTokenHash(tokenHash);
    assert.ok(result, 'Session must validate successfully');
    assert.strictEqual(result?.session.user_id, testUserId);
  });

  // STEP 5: Project & Circuit Creation
  const projectId = `proj_${uniqueSuffix}`;
  const circuitId = `circ_${uniqueSuffix}`;

  await it('STEP 5: Create and persist Quantum Project & Circuit', async () => {
    const project = await ProjectRepository.create(
      {
        id: projectId,
        user_id: testUserId,
        title: 'E2E Quantum Teleportation Study',
        description: 'Authoritative PostgreSQL persistence verification project.',
        tags_json: JSON.stringify(['quantum', 'teleportation', 'e2e']),
        circuit_id: circuitId,
        is_public: false,
        visibility: 'PRIVATE',
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        name: 'Bell_State_Circuit',
        qubits: 2,
        classical_bits: 2,
        gates_json: JSON.stringify([
          { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
          { id: 'g1', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
        ]),
      }
    );

    assert.strictEqual(project.id, projectId);
    assert.strictEqual(project.circuit_id, circuitId);

    const retrieved = await ProjectRepository.findById(projectId);
    assert.ok(retrieved, 'Project must be found in PostgreSQL');
    assert.strictEqual(retrieved?.title, 'E2E Quantum Teleportation Study');
  });

  // STEP 6: Circuit Versioning & Mutation
  await it('STEP 6: Update Circuit and verify version snapshot history in PostgreSQL', async () => {
    const success = await ProjectRepository.update(
      projectId,
      {
        title: 'GHZ Quantum State Study',
      },
      {
        name: 'GHZ_State_Circuit',
        qubits: 3,
        classicalBits: 3,
        gates: [
          { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
          { id: 'g1', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
          { id: 'g2', type: 'CX', controls: [1], targets: [2], stepIndex: 2 },
        ],
      }
    );

    assert.strictEqual(success, true, 'Project update must succeed');

    const circuit = await ProjectRepository.getCircuit(circuitId);
    assert.strictEqual(circuit.name, 'GHZ_State_Circuit');
    assert.strictEqual(circuit.qubits, 3);
    assert.strictEqual(circuit.version, 2);
  });

  // STEP 7: Simulation Job Queue & Results
  const jobId = `sim_${uniqueSuffix}`;
  await it('STEP 7: Enqueue and record Simulation Job execution in PostgreSQL', async () => {
    await SimulationRepository.createJob({
      id: jobId,
      userId: testUserId,
      circuitId,
      circuitIr: JSON.stringify({
        version: '1.0',
        name: 'GHZ_State_Circuit',
        qubits: 3,
        classicalBits: 3,
        gates: [],
      }),
      provider: 'NEXUS_SIM',
      shots: 1024,
    });

    const job = await SimulationRepository.getJobById(jobId, testUserId);
    assert.ok(job, 'Simulation job must be retrievable from PostgreSQL');
    assert.strictEqual(job?.status, 'QUEUED');

    await SimulationRepository.updateJobStatus({
      id: jobId,
      status: 'COMPLETED',
      resultsJson: JSON.stringify({ probabilities: { '000': 0.5, '111': 0.5 } }),
      durationMs: 4,
    });

    const completed = await SimulationRepository.getJobById(jobId, testUserId);
    assert.strictEqual(completed?.status, 'COMPLETED');
    assert.ok(completed?.resultsJson?.includes('000'));
  });

  // STEP 8: Security Audit & Notification Persistence
  await it('STEP 8: Record Audit Log & Notification in PostgreSQL', async () => {
    await AuditRepository.logAudit({
      id: `aud_${uniqueSuffix}`,
      userId: testUserId,
      action: 'E2E_VERIFICATION_COMPLETE',
      resourceType: 'PROJECT',
      resourceId: projectId,
      ipAddress: '127.0.0.1',
      userAgent: 'E2E-Verifier/1.0',
      status: 'SUCCESS',
      metadata: JSON.stringify({ testId: uniqueSuffix }),
    });

    await NotificationRepository.create({
      id: `notif_${uniqueSuffix}`,
      userId: testUserId,
      title: 'E2E Test Notification',
      message: 'Verification passed successfully.',
      type: 'SIMULATION_COMPLETED',
      actionLink: `/lab?project=${projectId}`,
    });

    const notifs = await NotificationRepository.listByUser(testUserId);
    assert.ok(notifs.length >= 1, 'Notification must be stored in PostgreSQL');
  });

  // STEP 9: Verify Zero Filesystem Side-Effects
  await it('STEP 9: Assert zero local files or data_storage directories created', async () => {
    const dataDir = path.join(process.cwd(), 'data_storage');
    const dbFile = path.join(dataDir, 'nexus_db.json');
    assert.strictEqual(fs.existsSync(dataDir), false, 'data_storage directory must never exist');
    assert.strictEqual(fs.existsSync(dbFile), false, 'nexus_db.json must never exist');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runE2E().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
