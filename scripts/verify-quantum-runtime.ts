/**
 * Comprehensive Quantum Runtime & Sandbox Security Verification Suite
 * Executes real mathematical statevector calculations, gate verification,
 * Bell / GHZ / Teleportation / Grover algorithms, Bloch coordinate derivations,
 * density matrices, Qubit ordering analysis, Sandbox security evaluation, and resource limits.
 */

import { simulateServerCircuit, Complex, C, QuantumCircuitIR, CircuitGate } from '../server/src/quantum/engine';
import { QuantumAdapters } from '../server/src/quantum/adapters';
import { QuantumSandbox } from '../server/src/quantum/sandbox';
import { SimulationQueue } from '../server/src/workers/simulationQueue';
import { qasmToIR } from '../src/quantum/converters';
import { simulateCircuit as simulateClientCircuit } from '../src/quantum/engine';

const TOLERANCE = 1e-5;

function approxEqual(a: number, b: number, tol = TOLERANCE): boolean {
  return Math.abs(a - b) <= tol;
}

function complexNormSq(c: Complex): number {
  return c.re * c.re + c.im * c.im;
}

async function runQuantumAudit() {
  console.log('================================================================');
  console.log('⚡ Q-LEARN NEXUS: QUANTUM RUNTIME & SANDBOX AUDIT SUITE ⚡');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(title: string, condition: boolean, details?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${title}${details ? ` (${details})` : ''}`);
    } else {
      console.error(`❌ [FAIL] ${title}${details ? ` (${details})` : ''}`);
    }
  }

  // ==========================================
  // 1. GATE UNIT TESTS ON CUSTOM SIMULATOR
  // ==========================================
  console.log('--- 1. Single & Multi-Qubit Gate Mathematical Verifications ---');

  // Helper to run 1-qubit gate
  function testSingleGate(gateType: string, params?: any): Complex[] {
    const ir: QuantumCircuitIR = {
      version: '1.0',
      name: `Test_${gateType}`,
      qubits: 1,
      classicalBits: 1,
      gates: [{ id: 'g1', type: gateType, targets: [0], stepIndex: 0, params }],
    };
    return simulateServerCircuit(ir, 100).statevector;
  }

  // Identity / No-op
  const idState = simulateServerCircuit({
    version: '1.0',
    name: 'Id',
    qubits: 1,
    classicalBits: 1,
    gates: [],
  }, 100).statevector;
  assert('Identity Gate', approxEqual(idState[0].re, 1) && approxEqual(idState[1].re, 0), '|0> unchanged');

  // Pauli X: |0> -> |1>
  const xState = testSingleGate('X');
  assert('Pauli-X Gate', approxEqual(xState[0].re, 0) && approxEqual(xState[1].re, 1), '|0> -> |1>');

  // Pauli Y: |0> -> i|1>
  const yState = testSingleGate('Y');
  assert('Pauli-Y Gate', approxEqual(yState[0].re, 0) && approxEqual(yState[1].im, 1), '|0> -> i|1>');

  // Pauli Z: |0> -> |0>, and on |1> -> -|1>
  const zState0 = testSingleGate('Z');
  const zState1 = simulateServerCircuit({
    version: '1.0',
    name: 'Z1',
    qubits: 1,
    classicalBits: 1,
    gates: [
      { id: 'g1', type: 'X', targets: [0], stepIndex: 0 },
      { id: 'g2', type: 'Z', targets: [0], stepIndex: 1 },
    ],
  }, 100).statevector;
  assert('Pauli-Z Gate', approxEqual(zState0[0].re, 1) && approxEqual(zState1[1].re, -1), 'Z|0>=|0>, Z|1>=-|1>');

  // Hadamard H: |0> -> (|0> + |1>)/sqrt(2)
  const hState = testSingleGate('H');
  assert('Hadamard Gate', approxEqual(hState[0].re, Math.SQRT1_2) && approxEqual(hState[1].re, Math.SQRT1_2), 'Equal superposition');

  // S Gate: |0> -> |0>, S|1> -> i|1>
  const sState1 = simulateServerCircuit({
    version: '1.0',
    name: 'S1',
    qubits: 1,
    classicalBits: 1,
    gates: [
      { id: 'g1', type: 'X', targets: [0], stepIndex: 0 },
      { id: 'g2', type: 'S', targets: [0], stepIndex: 1 },
    ],
  }, 100).statevector;
  assert('Phase S Gate', approxEqual(sState1[1].re, 0) && approxEqual(sState1[1].im, 1), 'S|1> = i|1>');

  // T Gate: T|1> -> exp(i*pi/4)|1> = (cos(pi/4) + i*sin(pi/4))|1>
  const tState1 = simulateServerCircuit({
    version: '1.0',
    name: 'T1',
    qubits: 1,
    classicalBits: 1,
    gates: [
      { id: 'g1', type: 'X', targets: [0], stepIndex: 0 },
      { id: 'g2', type: 'T', targets: [0], stepIndex: 1 },
    ],
  }, 100).statevector;
  assert('T Gate Phase', approxEqual(tState1[1].re, Math.cos(Math.PI / 4)) && approxEqual(tState1[1].im, Math.sin(Math.PI / 4)), 'T|1> = exp(i*pi/4)|1>');

  // Rotations Rx, Ry, Rz (theta = pi/2)
  const rxState = testSingleGate('Rx', { theta: Math.PI / 2 });
  assert('Rx(pi/2) Gate', approxEqual(rxState[0].re, Math.cos(Math.PI / 4)) && approxEqual(rxState[1].im, -Math.sin(Math.PI / 4)), 'Rx rotation valid');

  const ryState = testSingleGate('Ry', { theta: Math.PI / 2 });
  assert('Ry(pi/2) Gate', approxEqual(ryState[0].re, Math.cos(Math.PI / 4)) && approxEqual(ryState[1].re, Math.sin(Math.PI / 4)), 'Ry rotation valid');

  const rzState = simulateServerCircuit({
    version: '1.0',
    name: 'Rz',
    qubits: 1,
    classicalBits: 1,
    gates: [
      { id: 'g1', type: 'H', targets: [0], stepIndex: 0 },
      { id: 'g2', type: 'Rz', targets: [0], stepIndex: 1, params: { phi: Math.PI } },
    ],
  }, 100).statevector;
  assert('Rz(pi) Gate', approxEqual(complexNormSq(rzState[0]), 0.5) && approxEqual(complexNormSq(rzState[1]), 0.5), 'Rz phase rotation verified');

  // Controlled Gates (CX, CZ, SWAP, CCX)
  // CX: |10> -> |11>
  const cxState = simulateServerCircuit({
    version: '1.0',
    name: 'CX_test',
    qubits: 2,
    classicalBits: 2,
    gates: [
      { id: 'g1', type: 'X', targets: [0], stepIndex: 0 }, // q0=1
      { id: 'g2', type: 'CX', controls: [0], targets: [1], stepIndex: 1 }, // target q1 flipped
    ],
  }, 100);
  assert('CX Gate', approxEqual(cxState.probabilities['11'] || 0, 1.0), 'CX|10> = |11>');

  // CZ: |11> -> -|11>
  const czState = simulateServerCircuit({
    version: '1.0',
    name: 'CZ_test',
    qubits: 2,
    classicalBits: 2,
    gates: [
      { id: 'g1', type: 'X', targets: [0], stepIndex: 0 },
      { id: 'g2', type: 'X', targets: [1], stepIndex: 1 },
      { id: 'g3', type: 'CZ', controls: [0], targets: [1], stepIndex: 2 },
    ],
  }, 100);
  assert('CZ Gate', approxEqual(czState.statevector[3].re, -1.0), 'CZ|11> = -|11>');

  // SWAP: |10> -> |01>
  const swapState = simulateServerCircuit({
    version: '1.0',
    name: 'SWAP_test',
    qubits: 2,
    classicalBits: 2,
    gates: [
      { id: 'g1', type: 'X', targets: [0], stepIndex: 0 },
      { id: 'g2', type: 'SWAP', targets: [0, 1], stepIndex: 1 },
    ],
  }, 100);
  assert('SWAP Gate', approxEqual(swapState.probabilities['01'] || 0, 1.0), 'SWAP|10> = |01>');

  // CCX (Toffoli): |110> -> |111>, but |100> remains |100>
  const ccxState110 = simulateServerCircuit({
    version: '1.0',
    name: 'CCX_test1',
    qubits: 3,
    classicalBits: 3,
    gates: [
      { id: 'g1', type: 'X', targets: [0], stepIndex: 0 },
      { id: 'g2', type: 'X', targets: [1], stepIndex: 1 },
      { id: 'g3', type: 'CCX', controls: [0, 1], targets: [2], stepIndex: 2 },
    ],
  }, 100);
  const ccxState100 = simulateServerCircuit({
    version: '1.0',
    name: 'CCX_test2',
    qubits: 3,
    classicalBits: 3,
    gates: [
      { id: 'g1', type: 'X', targets: [0], stepIndex: 0 },
      { id: 'g2', type: 'CCX', controls: [0, 1], targets: [2], stepIndex: 1 },
    ],
  }, 100);
  assert('CCX (Toffoli) Gate', approxEqual(ccxState110.probabilities['111'] || 0, 1.0) && approxEqual(ccxState100.probabilities['100'] || 0, 1.0), 'CCX|110>=|111> and CCX|100>=|100>');

  // ==========================================
  // 2. BELL STATE VERIFICATION
  // ==========================================
  console.log('\n--- 2. Bell State (|Phi+> = (|00> + |11>)/sqrt(2)) Verification ---');
  const bellRes = simulateServerCircuit({
    version: '1.0',
    name: 'Bell_State',
    qubits: 2,
    classicalBits: 2,
    gates: [
      { id: 'g1', type: 'H', targets: [0], stepIndex: 0 },
      { id: 'g2', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
    ],
  }, 10000);

  const p00 = bellRes.probabilities['00'] || 0;
  const p11 = bellRes.probabilities['11'] || 0;
  const p01 = bellRes.probabilities['01'] || 0;
  const p10 = bellRes.probabilities['10'] || 0;

  assert('Bell State Probabilities', approxEqual(p00, 0.5) && approxEqual(p11, 0.5) && approxEqual(p01, 0) && approxEqual(p10, 0), `P(00)=${p00.toFixed(4)}, P(11)=${p11.toFixed(4)}`);
  assert('Bell Statevector Amplitude', approxEqual(bellRes.statevector[0].re, Math.SQRT1_2) && approxEqual(bellRes.statevector[3].re, Math.SQRT1_2), 'psi = [0.7071, 0, 0, 0.7071]');

  // ==========================================
  // 3. GHZ STATE VERIFICATION
  // ==========================================
  console.log('\n--- 3. 3-Qubit GHZ State (|000> + |111>)/sqrt(2) ---');
  const ghzRes = simulateServerCircuit({
    version: '1.0',
    name: 'GHZ_State',
    qubits: 3,
    classicalBits: 3,
    gates: [
      { id: 'g1', type: 'H', targets: [0], stepIndex: 0 },
      { id: 'g2', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
      { id: 'g3', type: 'CX', controls: [1], targets: [2], stepIndex: 2 },
    ],
  }, 10000);

  const p000 = ghzRes.probabilities['000'] || 0;
  const p111 = ghzRes.probabilities['111'] || 0;
  const otherProbs = Object.entries(ghzRes.probabilities)
    .filter(([k]) => k !== '000' && k !== '111')
    .reduce((sum, [, v]) => sum + v, 0);

  assert('GHZ State Probabilities', approxEqual(p000, 0.5) && approxEqual(p111, 0.5) && approxEqual(otherProbs, 0), `P(000)=${p000.toFixed(4)}, P(111)=${p111.toFixed(4)}, other=${otherProbs}`);

  // ==========================================
  // 4. QUANTUM TELEPORTATION
  // ==========================================
  console.log('\n--- 4. Quantum Teleportation Protocol ---');
  // Protocol:
  // Alice has q0 (state to teleport)
  // Alice & Bob share EPR pair on q1, q2
  // Alice applies CX(q0, q1), H(q0)
  // Standard teleportation test across states |0>, |1>, |+>, |->

  function testTeleportationState(prepGates: CircuitGate[], expectedP0: number, expectedP1: number, stateName: string) {
    // 3 qubits: q0 = source, q1 = Alice helper, q2 = Bob destination
    const gates: CircuitGate[] = [
      ...prepGates,
      // Create Bell pair on q1, q2
      { id: 't_bell_h', type: 'H', targets: [1], stepIndex: 10 },
      { id: 't_bell_cx', type: 'CX', controls: [1], targets: [2], stepIndex: 11 },
      // Alice Bell-measurement operations
      { id: 't_alice_cx', type: 'CX', controls: [0], targets: [1], stepIndex: 12 },
      { id: 't_alice_h', type: 'H', targets: [0], stepIndex: 13 },
      // Deferred classical corrections using quantum controlled gates
      // If q1=1 -> apply X on q2
      { id: 't_corr_x', type: 'CX', controls: [1], targets: [2], stepIndex: 14 },
      // If q0=1 -> apply Z on q2
      { id: 't_corr_z', type: 'CZ', controls: [0], targets: [2], stepIndex: 15 },
    ];

    const sim = simulateServerCircuit({
      version: '1.0',
      name: `Teleport_${stateName}`,
      qubits: 3,
      classicalBits: 3,
      gates,
    }, 10000);

    // Reduced density matrix / Bloch vector on qubit 2 (destination)
    const bobBloch = sim.blochVectors[2];
    const pBob0 = (1 + bobBloch.z) / 2;
    const pBob1 = (1 - bobBloch.z) / 2;

    const pass = approxEqual(pBob0, expectedP0, 0.05) && approxEqual(pBob1, expectedP1, 0.05);
    assert(`Teleportation of ${stateName}`, pass, `Bob q2: P(0)=${pBob0.toFixed(3)}, P(1)=${pBob1.toFixed(3)}, Bloch=(x:${bobBloch.x.toFixed(2)}, y:${bobBloch.y.toFixed(2)}, z:${bobBloch.z.toFixed(2)})`);
  }

  testTeleportationState([], 1.0, 0.0, '|0>');
  testTeleportationState([{ id: 'p_x', type: 'X', targets: [0], stepIndex: 0 }], 0.0, 1.0, '|1>');
  testTeleportationState([{ id: 'p_h', type: 'H', targets: [0], stepIndex: 0 }], 0.5, 0.5, '|+>');
  testTeleportationState([
    { id: 'p_x', type: 'X', targets: [0], stepIndex: 0 },
    { id: 'p_h', type: 'H', targets: [0], stepIndex: 1 },
  ], 0.5, 0.5, '|->');

  // ==========================================
  // 5. GROVER SEARCH ALGORITHM (2 Qubits)
  // ==========================================
  console.log('\n--- 5. Grover Search Algorithm (Marked State: |11>) ---');
  // For N=4, 1 Grover iteration yields 100% probability for marked state |11>
  const groverRes = simulateServerCircuit({
    version: '1.0',
    name: 'Grover_2Qubit',
    qubits: 2,
    classicalBits: 2,
    gates: [
      // 1. Equal superposition
      { id: 'g_h0', type: 'H', targets: [0], stepIndex: 0 },
      { id: 'g_h1', type: 'H', targets: [1], stepIndex: 1 },
      // 2. Oracle for |11>: CZ(0, 1)
      { id: 'g_oracle', type: 'CZ', controls: [0], targets: [1], stepIndex: 2 },
      // 3. Diffusion operator (H - X - CZ - X - H)
      { id: 'g_d_h0', type: 'H', targets: [0], stepIndex: 3 },
      { id: 'g_d_h1', type: 'H', targets: [1], stepIndex: 4 },
      { id: 'g_d_x0', type: 'X', targets: [0], stepIndex: 5 },
      { id: 'g_d_x1', type: 'X', targets: [1], stepIndex: 6 },
      { id: 'g_d_cz', type: 'CZ', controls: [0], targets: [1], stepIndex: 7 },
      { id: 'g_d_x0b', type: 'X', targets: [0], stepIndex: 8 },
      { id: 'g_d_x1b', type: 'X', targets: [1], stepIndex: 9 },
      { id: 'g_d_h0b', type: 'H', targets: [0], stepIndex: 10 },
      { id: 'g_d_h1b', type: 'H', targets: [1], stepIndex: 11 },
    ],
  }, 10000);

  const pMarked = groverRes.probabilities['11'] || 0;
  assert('Grover Amplification', approxEqual(pMarked, 1.0, 0.01), `Marked state |11> probability = ${(pMarked * 100).toFixed(1)}%`);

  // ==========================================
  // 6. DENSITY MATRIX & PURITY
  // ==========================================
  console.log('\n--- 6. Density Matrix Properties & Bloch Coordinates ---');
  // Verify Tr(rho) = 1, rho is Hermitian, eigenvalues in [0, 1]
  function verifyDensityMatrix(stateName: string, state: Complex[], numQubits: number) {
    const dim = 1 << numQubits;
    // Construct full rho = |psi><psi|
    let trace = 0;
    let isHermitian = true;
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        // rho_ij = state[i] * conj(state[j])
        const rho_ij = C.mul(state[i], C.conj(state[j]));
        const rho_ji = C.mul(state[j], C.conj(state[i]));
        if (i === j) trace += rho_ij.re;
        if (!approxEqual(rho_ij.re, rho_ji.re) || !approxEqual(rho_ij.im, -rho_ji.im)) {
          isHermitian = false;
        }
      }
    }
    assert(`Density Matrix for ${stateName}`, approxEqual(trace, 1.0) && isHermitian, `Tr(rho)=${trace.toFixed(4)}, Hermitian=${isHermitian}`);
  }

  verifyDensityMatrix('|0>', [C.one(), C.zero()], 1);
  verifyDensityMatrix('|1>', [C.zero(), C.one()], 1);
  verifyDensityMatrix('|+>', [C.new(Math.SQRT1_2), C.new(Math.SQRT1_2)], 1);
  verifyDensityMatrix('Bell State', [C.new(Math.SQRT1_2), C.zero(), C.zero(), C.new(Math.SQRT1_2)], 2);

  // ==========================================
  // 7. BLOCH VECTORS DERIVATION
  // ==========================================
  console.log('\n--- 7. Bloch Vector Coordinate Verification ---');
  // Test Bloch vectors for canonical pure states
  const statesToTest: { name: string; gates: CircuitGate[]; exp: { x: number; y: number; z: number } }[] = [
    { name: '|0>', gates: [], exp: { x: 0, y: 0, z: 1 } },
    { name: '|1>', gates: [{ id: '1', type: 'X', targets: [0], stepIndex: 0 }], exp: { x: 0, y: 0, z: -1 } },
    { name: '|+>', gates: [{ id: '1', type: 'H', targets: [0], stepIndex: 0 }], exp: { x: 1, y: 0, z: 0 } },
    {
      name: '|->',
      gates: [
        { id: '1', type: 'X', targets: [0], stepIndex: 0 },
        { id: '2', type: 'H', targets: [0], stepIndex: 1 },
      ],
      exp: { x: -1, y: 0, z: 0 },
    },
    {
      name: '|+i>',
      gates: [
        { id: '1', type: 'H', targets: [0], stepIndex: 0 },
        { id: '2', type: 'S', targets: [0], stepIndex: 1 },
      ],
      exp: { x: 0, y: 1, z: 0 },
    },
    {
      name: '|-i>',
      gates: [
        { id: '1', type: 'H', targets: [0], stepIndex: 0 },
        { id: '2', type: 'Sdg', targets: [0], stepIndex: 1 },
      ],
      exp: { x: 0, y: -1, z: 0 },
    },
  ];

  for (const item of statesToTest) {
    const res = simulateServerCircuit({
      version: '1.0',
      name: `Bloch_${item.name}`,
      qubits: 1,
      classicalBits: 1,
      gates: item.gates,
    }, 100);
    const bv = res.blochVectors[0];
    const match = approxEqual(bv.x, item.exp.x, 0.02) && approxEqual(bv.y, item.exp.y, 0.02) && approxEqual(bv.z, item.exp.z, 0.02);
    assert(`Bloch Vector for ${item.name}`, match, `Observed (x:${bv.x.toFixed(2)}, y:${bv.y.toFixed(2)}, z:${bv.z.toFixed(2)}) vs Expected (${item.exp.x}, ${item.exp.y}, ${item.exp.z})`);
  }

  // ==========================================
  // 8. QUBIT ORDERING ANALYSIS
  // ==========================================
  console.log('\n--- 8. Qubit Ordering Convention Analysis ---');
  // Test X(q0) vs X(q1) on 2 qubits
  const resX0 = simulateServerCircuit({
    version: '1.0',
    name: 'X_q0',
    qubits: 2,
    classicalBits: 2,
    gates: [{ id: '1', type: 'X', targets: [0], stepIndex: 0 }],
  }, 100);

  const resX1 = simulateServerCircuit({
    version: '1.0',
    name: 'X_q1',
    qubits: 2,
    classicalBits: 2,
    gates: [{ id: '1', type: 'X', targets: [1], stepIndex: 0 }],
  }, 100);

  const x0Key = Object.keys(resX0.probabilities)[0];
  const x1Key = Object.keys(resX1.probabilities)[0];
  console.log(`[Qubit Ordering] Server Engine: X(q0) -> bitstring "${x0Key}", X(q1) -> bitstring "${x1Key}"`);
  assert('Server Engine Qubit Ordering (Big-Endian)', x0Key === '10' && x1Key === '01', 'q0 is leftmost MSB');

  // Client engine comparison
  const clientX0 = simulateClientCircuit({
    version: '1.0',
    name: 'Client_X0',
    qubits: 2,
    classicalBits: 2,
    gates: [{ id: '1', type: 'X', targets: [0], stepIndex: 0 }],
  });
  const clientX1 = simulateClientCircuit({
    version: '1.0',
    name: 'Client_X1',
    qubits: 2,
    classicalBits: 2,
    gates: [{ id: '1', type: 'X', targets: [1], stepIndex: 0 }],
  });
  const clientX0Key = Object.keys(clientX0.probabilities)[0];
  const clientX1Key = Object.keys(clientX1.probabilities)[0];
  console.log(`[Qubit Ordering] Client Engine: X(q0) -> bitstring "${clientX0Key}", X(q1) -> bitstring "${clientX1Key}"`);

  // ==========================================
  // 9. OPENQASM TRANSLATION & PARSING
  // ==========================================
  console.log('\n--- 9. OpenQASM Transpilation & Parsing ---');
  const testIR: QuantumCircuitIR = {
    version: '1.0',
    name: 'QASM_Test_Circuit',
    qubits: 2,
    classicalBits: 2,
    gates: [
      { id: '1', type: 'H', targets: [0], stepIndex: 0 },
      { id: '2', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
    ],
  };

  const qasmOutput = QuantumAdapters.toOpenQASM(testIR);
  assert('OpenQASM 3.0 Generation', qasmOutput.includes('OPENQASM 3.0') && qasmOutput.includes('h q[0];') && qasmOutput.includes('cx q[0], q[1];'), 'Valid QASM 3.0 produced');

  const qasm2Sample = `
    OPENQASM 2.0;
    include "qelib1.inc";
    qreg q[2];
    creg c[2];
    h q[0];
    cx q[0], q[1];
  `;
  const parsedIR = qasmToIR(qasm2Sample);
  assert('OpenQASM 2.0 Parsing to IR', parsedIR.qubits === 2 && parsedIR.gates.length === 2 && parsedIR.gates[0].type === 'H' && parsedIR.gates[1].type === 'CX', 'Parsed into equivalent IR');

  const parsedSim = simulateServerCircuit(parsedIR, 1000);
  assert('Parsed QASM Semantic Equivalence', approxEqual(parsedSim.probabilities['00'] || 0, 0.5) && approxEqual(parsedSim.probabilities['11'] || 0, 0.5), 'Produces Bell state');

  // ==========================================
  // 10. MEASUREMENT & SHOT COUNTS
  // ==========================================
  console.log('\n--- 10. Measurement Sampling & Shot Counting ---');
  for (const s of [1, 10, 100, 1024]) {
    const shotSim = simulateServerCircuit(testIR, s);
    const sumCounts = Object.values(shotSim.counts).reduce((a, b) => a + b, 0);
    assert(`Shot Sum for shots=${s}`, sumCounts === s, `Total samples count: ${sumCounts}`);
  }

  // ==========================================
  // 11. RESOURCE LIMITS ENFORCEMENT
  // ==========================================
  console.log('\n--- 11. Server Resource Limits Enforcement ---');
  // Attempt oversized qubits
  let qubitOverRejected = false;
  try {
    await SimulationQueue.enqueueJob({
      userId: 'test_user',
      circuitIR: { version: '1.0', name: 'Huge', qubits: 32, classicalBits: 32, gates: [] },
    });
  } catch (err: any) {
    qubitOverRejected = err.message.includes('exceeds server maximum');
  }
  assert('Qubit Limit Enforcement (>16 qubits)', qubitOverRejected, 'Over-limit circuit blocked before execution');

  // Attempt oversized gates
  let gateOverRejected = false;
  try {
    const hugeGates: CircuitGate[] = [];
    for (let i = 0; i < 600; i++) {
      hugeGates.push({ id: `g_${i}`, type: 'H', targets: [0], stepIndex: i });
    }
    await SimulationQueue.enqueueJob({
      userId: 'test_user',
      circuitIR: { version: '1.0', name: 'ManyGates', qubits: 2, classicalBits: 2, gates: hugeGates },
    });
  } catch (err: any) {
    gateOverRejected = err.message.includes('exceeds server maximum');
  }
  assert('Gate Limit Enforcement (>500 gates)', gateOverRejected, 'Over-limit gate depth blocked before execution');

  // ==========================================
  // 12. MALICIOUS CODE PATTERNS & SANDBOX TESTING
  // ==========================================
  console.log('\n--- 12. Malicious Code & Sandbox Security Testing ---');

  const maliciousSnippets = [
    { name: 'import os', code: 'import os\nos.system("id")' },
    { name: 'import subprocess', code: 'import subprocess\nsubprocess.run(["id"])' },
    { name: 'import socket', code: 'import socket\nsocket.create_connection(("example.com", 80))' },
    { name: 'open(/etc/passwd)', code: 'data = open("/etc/passwd").read()' },
    { name: 'while True', code: 'while True:\n    pass' },
    { name: 'multiprocessing', code: 'import multiprocessing\nmultiprocessing.cpu_count()' },
    { name: 'ctypes', code: 'import ctypes\nctypes.CDLL(None)' },
    { name: 'pathlib', code: 'import pathlib\np = pathlib.Path("/etc")' },
  ];

  for (const item of maliciousSnippets) {
    const inspectRes = QuantumSandbox.inspectCodeSecurity(item.code, 'security_auditor', '127.0.0.1');
    assert(`Malicious Pattern Blocked: ${item.name}`, !inspectRes.safe, inspectRes.reason?.substring(0, 45) + '...');
  }

  // ==========================================
  // 13. SECRET & ENVIRONMENT ISOLATION
  // ==========================================
  console.log('\n--- 13. Secret & Environment Variable Exposure Audit ---');
  const testRun = await QuantumSandbox.execute('qc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)', 'qiskit');
  const leaksSecrets =
    testRun.output.includes('DATABASE_URL') ||
    testRun.output.includes('REDIS_URL') ||
    testRun.output.includes('GEMINI_API_KEY') ||
    testRun.output.includes('SESSION_SECRET') ||
    testRun.output.includes('postgres://');
  assert('Sandbox Secret Isolation', !leaksSecrets, 'Output free of environment variables and secrets');

  console.log('\n================================================================');
  console.log(`🏁 AUDIT COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

runQuantumAudit().catch(console.error);
