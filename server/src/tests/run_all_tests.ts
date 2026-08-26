/**
 * Q-Learn Nexus - Automated Security, Isolation, & Quantum Canonical Tests
 * Tests Filesystem, Network, Secret isolation, Resource exhaustion, and Qubit Endianness.
 */

import { QuantumSandbox } from '../quantum/sandbox';
import { IsolatedRunner } from '../quantum/isolatedRunner';
import { simulateServerCircuit, CANONICAL_QUBIT_ORDER, QuantumCircuitIR } from '../quantum/engine';
import { SimulationQueue } from '../workers/simulationQueue';

async function runTests() {
  console.log('====================================================');
  console.log('Q-LEARN NEXUS INFRASTRUCTURE & QUANTUM AUDIT VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      failed++;
    }
  }

  // 1. CANONICAL QUBIT ORDERING TESTS
  console.log('\n--- 1. CANONICAL QUBIT ORDERING (LITTLE-ENDIAN) ---');
  assert(CANONICAL_QUBIT_ORDER === 'LITTLE_ENDIAN', 'Canonical Qubit Order is defined as LITTLE_ENDIAN');

  // Test X(q0) -> bit 0 is 1 -> bitstring "01" on 2-qubit register
  const irX0: QuantumCircuitIR = {
    version: '1.0',
    name: 'X_q0_Test',
    qubits: 2,
    classicalBits: 2,
    gates: [{ id: '1', type: 'X', targets: [0], stepIndex: 0 }],
  };
  const resX0 = simulateServerCircuit(irX0, 100);
  assert(resX0.probabilities['01'] === 1.0, 'X(q0) on 2 qubits produces state |01>');
  assert(!resX0.probabilities['10'], 'X(q0) does NOT produce |10>');

  // Test X(q1) -> bit 1 is 1 -> bitstring "10" on 2-qubit register
  const irX1: QuantumCircuitIR = {
    version: '1.0',
    name: 'X_q1_Test',
    qubits: 2,
    classicalBits: 2,
    gates: [{ id: '1', type: 'X', targets: [1], stepIndex: 0 }],
  };
  const resX1 = simulateServerCircuit(irX1, 100);
  assert(resX1.probabilities['10'] === 1.0, 'X(q1) on 2 qubits produces state |10>');
  assert(!resX1.probabilities['01'], 'X(q1) does NOT produce |01>');

  // Test CX(q0, q1) from |01> (q0 is set) -> flips q1 -> |11>
  const irCX: QuantumCircuitIR = {
    version: '1.0',
    name: 'CX_Test',
    qubits: 2,
    classicalBits: 2,
    gates: [
      { id: '1', type: 'X', targets: [0], stepIndex: 0 },
      { id: '2', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
    ],
  };
  const resCX = simulateServerCircuit(irCX, 100);
  assert(resCX.probabilities['11'] === 1.0, 'CX(control=q0, target=q1) with q0=|1> produces state |11>');

  // Test Bell State H(q0) -> CX(q0, q1) -> (|00> + |11>)/sqrt(2)
  const irBell: QuantumCircuitIR = {
    version: '1.0',
    name: 'Bell_State',
    qubits: 2,
    classicalBits: 2,
    gates: [
      { id: '1', type: 'H', targets: [0], stepIndex: 0 },
      { id: '2', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
    ],
  };
  const resBell = simulateServerCircuit(irBell, 2000);
  assert(Math.abs(resBell.probabilities['00'] - 0.5) < 0.05, 'Bell state produces ~50% |00>');
  assert(Math.abs(resBell.probabilities['11'] - 0.5) < 0.05, 'Bell state produces ~50% |11>');
  assert(!resBell.probabilities['01'], 'Bell state has 0% |01>');
  assert(!resBell.probabilities['10'], 'Bell state has 0% |10>');

  // 2. FILESYSTEM ISOLATION TESTS
  console.log('\n--- 2. FILESYSTEM ISOLATION TESTS ---');
  const inspectPasswd = QuantumSandbox.inspectCodeSecurity("with open('/etc/passwd') as f: print(f.read())");
  assert(!inspectPasswd.safe, 'Blocks attempt to open /etc/passwd in Layer 1 AST scan');

  const inspectShadow = QuantumSandbox.inspectCodeSecurity("import os\nprint(os.listdir('/'))");
  assert(!inspectShadow.safe, 'Blocks attempt to import os in Layer 1 AST scan');

  const inspectSubprocess = QuantumSandbox.inspectCodeSecurity("import subprocess\nsubprocess.run(['ls', '-la'])");
  assert(!inspectSubprocess.safe, 'Blocks attempt to import subprocess in Layer 1 AST scan');

  // 3. NETWORK ISOLATION TESTS
  console.log('\n--- 3. NETWORK ISOLATION TESTS ---');
  const inspectSocket = QuantumSandbox.inspectCodeSecurity("import socket\ns = socket.socket()");
  assert(!inspectSocket.safe, 'Blocks attempt to import socket in Layer 1 AST scan');

  const inspectRequests = QuantumSandbox.inspectCodeSecurity("import requests\nr = requests.get('https://example.com')");
  assert(!inspectRequests.safe, 'Blocks attempt to import requests in Layer 1 AST scan');

  const inspectUrllib = QuantumSandbox.inspectCodeSecurity("import urllib.request\nurllib.request.urlopen('https://example.com')");
  assert(!inspectUrllib.safe, 'Blocks attempt to import urllib in Layer 1 AST scan');

  // 4. SECRET ISOLATION TESTS
  console.log('\n--- 4. SECRET ISOLATION (ZERO SECRETS IN WORKER ENV) ---');
  const sanitizedEnv = IsolatedRunner.getSanitizedEnvironment('/tmp/test_dir');
  assert(!sanitizedEnv.DATABASE_URL, 'DATABASE_URL is scrubbed from isolated environment');
  assert(!sanitizedEnv.REDIS_URL, 'REDIS_URL is scrubbed from isolated environment');
  assert(!sanitizedEnv.GEMINI_API_KEY, 'GEMINI_API_KEY is scrubbed from isolated environment');
  assert(!sanitizedEnv.SESSION_SECRET, 'SESSION_SECRET is scrubbed from isolated environment');
  assert(!sanitizedEnv.JWT_SECRET, 'JWT_SECRET is scrubbed from isolated environment');
  assert(sanitizedEnv.QUANTUM_SANDBOX_ISOLATED === 'true', 'QUANTUM_SANDBOX_ISOLATED flag is set');

  // 5. RESOURCE EXHAUSTION & LIMITS
  console.log('\n--- 5. RESOURCE EXHAUSTION & SEPARATE LIMITS ---');
  const inspectLoop = QuantumSandbox.inspectCodeSecurity('while True:\n    pass');
  assert(!inspectLoop.safe, 'Blocks unconstrained while True loop in Layer 1 AST');

  const oversizedCode = 'x = 1\n'.repeat(30000); // > 50KB
  const inspectSize = QuantumSandbox.inspectCodeSecurity(oversizedCode);
  assert(!inspectSize.safe, 'Rejects payload exceeding 50KB limit');

  assert(SimulationQueue.MAX_STATEVECTOR_QUBITS === 16, 'Statevector max qubits set to 16');
  assert(SimulationQueue.MAX_DENSITY_MATRIX_QUBITS === 8, 'Density matrix max qubits strictly bounded to 8 (2^(2n) scaling)');

  // 6. SAFE CODE EXECUTION IN ISOLATED RUNNER
  console.log('\n--- 6. SAFE PROCESS EXECUTION ---');
  const safeCode = `
import math
print(f"PI is approximately {math.pi:.4f}")
print("Quantum Register State: Verified")
`;
  const runResult = await IsolatedRunner.executeCode({
    code: safeCode,
    framework: 'python',
    timeoutMs: 3000,
  });
  assert(runResult.success, 'Safe mathematical code executes successfully in ephemeral environment');
  assert(runResult.output.includes('PI is approximately 3.1416'), 'Output captured correctly from stdout');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
