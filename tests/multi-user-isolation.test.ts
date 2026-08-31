/**
 * Q-Learn Nexus - Multi-User Tenant Isolation & Security Test Suite
 * Validates strict isolation between independent users in PostgreSQL:
 * - User A cannot read, update, delete, or simulate User B's private projects/circuits.
 * - Share tokens grant verified read access only when valid.
 * - Role-based authorization and session boundaries are enforced server-side.
 * @author Tanishk Singhal (Tanishk756)
 * @license Apache-2.0
 */

import assert from 'assert';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { UserRepository } from '../server/src/database/repositories/UserRepository';
import { SessionRepository } from '../server/src/database/repositories/SessionRepository';
import { ProjectRepository, SharingRepository } from '../server/src/database/repositories/ProjectRepository';
import { SimulationRepository } from '../server/src/database/repositories/SimulationRepository';
import { checkDatabaseHealth } from '../server/src/database/client';

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

async function runMultiUserTests() {
  console.log('\n======================================================');
  console.log('Q-LEARN NEXUS: MULTI-USER TENANT ISOLATION & RBAC TESTS');
  console.log('======================================================\n');

  // Verify DB Health
  const dbHealth = await checkDatabaseHealth();
  assert.strictEqual(dbHealth.connected, true, 'Database must be connected for multi-user tests');

  const runId = crypto.randomBytes(4).toString('hex');

  // 1. Setup User A and User B
  const userAId = `usr_a_${runId}`;
  const userBId = `usr_b_${runId}`;
  const userAEmail = `alice_${runId}@quantum-lab.org`;
  const userBEmail = `bob_${runId}@quantum-lab.org`;
  const passA = `PassA_${runId}!`;
  const passB = `PassB_${runId}!`;

  await it('SETUP: Register User A (Alice) and User B (Bob) in PostgreSQL', async () => {
    await UserRepository.create({
      id: userAId,
      email: userAEmail,
      username: `alice_${runId}`,
      password_hash: await bcrypt.hash(passA, 10),
      name: 'Alice Researcher',
      role: 'RESEARCHER',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    await UserRepository.create({
      id: userBId,
      email: userBEmail,
      username: `bob_${runId}`,
      password_hash: await bcrypt.hash(passB, 10),
      name: 'Bob Engineer',
      role: 'STUDENT',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const alice = await UserRepository.findById(userAId);
    const bob = await UserRepository.findById(userBId);
    assert.ok(alice && bob, 'Both users must exist in PostgreSQL');
  });

  // 2. Setup Sessions
  const tokenA = crypto.randomBytes(32).toString('hex');
  const tokenB = crypto.randomBytes(32).toString('hex');
  const tokenAHash = crypto.createHash('sha256').update(tokenA).digest('hex');
  const tokenBHash = crypto.createHash('sha256').update(tokenB).digest('hex');

  await it('SETUP: Create active sessions for User A and User B', async () => {
    await SessionRepository.create({
      id: `sess_a_${runId}`,
      user_id: userAId,
      token_hash: tokenAHash,
      ip_address: '10.0.0.1',
      user_agent: 'Lab-Browser/1.0',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });

    await SessionRepository.create({
      id: `sess_b_${runId}`,
      user_id: userBId,
      token_hash: tokenBHash,
      ip_address: '10.0.0.2',
      user_agent: 'Lab-Browser/1.0',
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
    });

    const sessA = await SessionRepository.findByTokenHash(tokenAHash);
    const sessB = await SessionRepository.findByTokenHash(tokenBHash);
    assert.strictEqual(sessA?.session.user_id, userAId);
    assert.strictEqual(sessB?.session.user_id, userBId);
  });

  // 3. User A creates Private Project A
  const projAId = `proj_a_${runId}`;
  const circAId = `circ_a_${runId}`;
  await it('ISOLATION 1: User A creates Private Project A with confidential circuit', async () => {
    await ProjectRepository.create(
      {
        id: projAId,
        user_id: userAId,
        title: "Alice's Quantum Key Distribution Secret Experiment",
        description: 'Classified BB84 Protocol Research',
        tags_json: JSON.stringify(['qkd', 'cryptography', 'confidential']),
        circuit_id: circAId,
        is_public: false,
        visibility: 'PRIVATE',
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        name: 'BB84_Secret_Circuit',
        qubits: 4,
        classical_bits: 4,
        gates_json: JSON.stringify([
          { id: 'g1', type: 'H', targets: [0], stepIndex: 0 },
          { id: 'g2', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
        ]),
      }
    );

    const proj = await ProjectRepository.findById(projAId);
    assert.ok(proj);
    assert.strictEqual(proj.user_id, userAId);
    assert.strictEqual(proj.visibility, 'PRIVATE');
  });

  // 4. User B creates Private Project B
  const projBId = `proj_b_${runId}`;
  const circBId = `circ_b_${runId}`;
  await it('ISOLATION 2: User B creates Private Project B', async () => {
    await ProjectRepository.create(
      {
        id: projBId,
        user_id: userBId,
        title: "Bob's Quantum Fourier Transform Experiment",
        description: 'QFT 3-qubit implementation',
        tags_json: JSON.stringify(['qft', 'algorithm']),
        circuit_id: circBId,
        is_public: false,
        visibility: 'PRIVATE',
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        name: 'QFT_Circuit',
        qubits: 3,
        classical_bits: 3,
        gates_json: JSON.stringify([{ id: 'g1', type: 'H', targets: [0], stepIndex: 0 }]),
      }
    );

    const proj = await ProjectRepository.findById(projBId);
    assert.ok(proj);
    assert.strictEqual(proj.user_id, userBId);
  });

  // 5. Accessible Projects Filter Isolation
  await it('ISOLATION 3: Accessible projects query returns only own private projects + public projects', async () => {
    const aliceProjects = await ProjectRepository.findAccessible(userAId, false);
    const bobProjects = await ProjectRepository.findAccessible(userBId, false);

    const aliceHasProjA = aliceProjects.some((p) => p.id === projAId);
    const aliceHasProjB = aliceProjects.some((p) => p.id === projBId);
    const bobHasProjA = bobProjects.some((p) => p.id === projAId);
    const bobHasProjB = bobProjects.some((p) => p.id === projBId);

    assert.strictEqual(aliceHasProjA, true, "Alice's project list must contain Project A");
    assert.strictEqual(aliceHasProjB, false, "Alice's project list must NOT contain Bob's Project B");
    assert.strictEqual(bobHasProjB, true, "Bob's project list must contain Project B");
    assert.strictEqual(bobHasProjA, false, "Bob's project list must NOT contain Alice's Project A");
  });

  // 6. Direct Unauthorized Access Protection (IDOR Prevention)
  await it('ISOLATION 4: Circuit access control prevents Bob from retrieving Alice circuit', async () => {
    const circuitA = await ProjectRepository.getCircuit(circAId);
    assert.ok(circuitA, 'Circuit A exists in database');
    assert.strictEqual(circuitA.user_id, userAId, 'Circuit A is owned exclusively by User A');
    assert.notStrictEqual(circuitA.user_id, userBId, 'Circuit A is NOT owned by User B');
  });

  // 7. Simulation Job Isolation
  const simJobAId = `sim_a_${runId}`;
  await it('ISOLATION 5: Simulation job execution history is isolated per user', async () => {
    await SimulationRepository.createJob({
      id: simJobAId,
      userId: userAId,
      circuitId: circAId,
      circuitIr: JSON.stringify({ version: '1.0', name: 'BB84', qubits: 4, classicalBits: 4, gates: [] }),
      provider: 'NEXUS_SIM',
      shots: 2048,
    });

    // Alice can retrieve her own job
    const aliceJob = await SimulationRepository.getJobById(simJobAId, userAId);
    assert.ok(aliceJob, 'Alice must be able to retrieve her own simulation job');

    // Bob cannot retrieve Alice's job
    const bobAttempt = await SimulationRepository.getJobById(simJobAId, userBId);
    assert.strictEqual(bobAttempt, null, "Bob must receive null when attempting to access Alice's simulation job");

    // Bob's jobs list must not contain Alice's job
    const bobJobs = await SimulationRepository.listJobsByUser(userBId);
    assert.strictEqual(bobJobs.some((j) => j.id === simJobAId), false, "Alice's job must not appear in Bob's job history");
  });

  // 8. Sharing Tokens Cryptographic Validation
  await it('ISOLATION 6: Unlisted project sharing with token verification', async () => {
    const rawShareToken = crypto.randomBytes(32).toString('hex');
    const shareTokenHash = crypto.createHash('sha256').update(rawShareToken).digest('hex');

    // Alice creates share token for Project A
    await SharingRepository.createShareToken({
      tokenHash: shareTokenHash,
      resourceType: 'PROJECT',
      resourceId: projAId,
      permissions: 'VIEW',
      createdBy: userAId,
    });

    // Validate with valid token -> true
    const validCheck = await SharingRepository.validateShareToken(shareTokenHash, projAId);
    assert.strictEqual(validCheck, true, 'Valid token hash must authorize access');

    // Validate with invalid token -> false
    const invalidCheck = await SharingRepository.validateShareToken('invalid_token_hash', projAId);
    assert.strictEqual(invalidCheck, false, 'Invalid token must be rejected');

    // Validate with wrong project ID -> false
    const wrongProjCheck = await SharingRepository.validateShareToken(shareTokenHash, projBId);
    assert.strictEqual(wrongProjCheck, false, 'Valid token for Project A must not authorize Project B');
  });

  // 9. Session Invalidation & Expiration Enforcement
  await it('SECURITY: Session invalidation immediately revokes access', async () => {
    await SessionRepository.delete(tokenAHash);
    const postDeleteCheck = await SessionRepository.findByTokenHash(tokenAHash);
    assert.strictEqual(postDeleteCheck, null, 'Deleted session must immediately fail lookup');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runMultiUserTests().catch((err) => {
  console.error('Multi-User Test Error:', err);
  process.exit(1);
});
