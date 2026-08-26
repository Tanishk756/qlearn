/**
 * Q-Learn Nexus - Quantum Mathematical Simulation Engine
 * Rigorous complex arithmetic, statevector transformation, Bloch sphere coordinates,
 * shot-based measurement sampling, and circuit optimization.
 * @license Apache-2.0
 */

import {
  Complex,
  CircuitGate,
  QuantumCircuitIR,
  SimulationResult,
  BlochCoordinate,
} from '../types/quantum';

// Complex Number Utilities
export const C = {
  zero: (): Complex => ({ re: 0, im: 0 }),
  one: (): Complex => ({ re: 1, im: 0 }),
  i: (): Complex => ({ re: 0, im: 1 }),
  new: (re: number, im = 0): Complex => ({ re, im }),

  add: (a: Complex, b: Complex): Complex => ({
    re: a.re + b.re,
    im: a.im + b.im,
  }),

  sub: (a: Complex, b: Complex): Complex => ({
    re: a.re - b.re,
    im: a.im - b.im,
  }),

  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }),

  scale: (a: Complex, s: number): Complex => ({
    re: a.re * s,
    im: a.im * s,
  }),

  conj: (a: Complex): Complex => ({
    re: a.re,
    im: -a.im,
  }),

  abs: (a: Complex): number => Math.hypot(a.re, a.im),

  absSq: (a: Complex): number => a.re * a.re + a.im * a.im,

  phase: (a: Complex): number => Math.atan2(a.im, a.re),

  exp: (theta: number): Complex => ({
    re: Math.cos(theta),
    im: Math.sin(theta),
  }),

  format: (a: Complex, precision = 3): string => {
    const r = Math.abs(a.re) < 1e-6 ? 0 : Number(a.re.toFixed(precision));
    const i = Math.abs(a.im) < 1e-6 ? 0 : Number(a.im.toFixed(precision));
    if (i === 0) return `${r}`;
    if (r === 0) return `${i}i`;
    return `${r} ${i > 0 ? '+' : '-'} ${Math.abs(i)}i`;
  },
};

type Matrix2x2 = [[Complex, Complex], [Complex, Complex]];

// Standard Single Qubit Unitary Matrices
const SQRT1_2 = Math.SQRT1_2;

export const GATES_2X2: Record<string, (params?: { theta?: number; phi?: number; lambda?: number }) => Matrix2x2> = {
  H: () => [
    [C.new(SQRT1_2), C.new(SQRT1_2)],
    [C.new(SQRT1_2), C.new(-SQRT1_2)],
  ],
  X: () => [
    [C.zero(), C.one()],
    [C.one(), C.zero()],
  ],
  Y: () => [
    [C.zero(), C.new(0, -1)],
    [C.new(0, 1), C.zero()],
  ],
  Z: () => [
    [C.one(), C.zero()],
    [C.zero(), C.new(-1, 0)],
  ],
  S: () => [
    [C.one(), C.zero()],
    [C.zero(), C.new(0, 1)],
  ],
  Sdg: () => [
    [C.one(), C.zero()],
    [C.zero(), C.new(0, -1)],
  ],
  T: () => [
    [C.one(), C.zero()],
    [C.zero(), C.exp(Math.PI / 4)],
  ],
  Tdg: () => [
    [C.one(), C.zero()],
    [C.zero(), C.exp(-Math.PI / 4)],
  ],
  Rx: (p) => {
    const theta = p?.theta ?? 0;
    const c = Math.cos(theta / 2);
    const s = Math.sin(theta / 2);
    return [
      [C.new(c, 0), C.new(0, -s)],
      [C.new(0, -s), C.new(c, 0)],
    ];
  },
  Ry: (p) => {
    const theta = p?.theta ?? 0;
    const c = Math.cos(theta / 2);
    const s = Math.sin(theta / 2);
    return [
      [C.new(c, 0), C.new(-s, 0)],
      [C.new(s, 0), C.new(c, 0)],
    ];
  },
  Rz: (p) => {
    const theta = p?.theta ?? 0;
    return [
      [C.exp(-theta / 2), C.zero()],
      [C.zero(), C.exp(theta / 2)],
    ];
  },
};

/**
 * Applies a 1-qubit gate matrix to the multi-qubit statevector
 */
function applySingleQubitGate(
  state: Complex[],
  targetQubit: number,
  totalQubits: number,
  matrix: Matrix2x2
): Complex[] {
  const dim = 1 << totalQubits;
  const nextState = new Array<Complex>(dim);
  const targetMask = 1 << targetQubit;

  const [[u00, u01], [u10, u11]] = matrix;

  for (let i = 0; i < dim; i++) {
    if ((i & targetMask) === 0) {
      const i0 = i;
      const i1 = i | targetMask;
      const psi0 = state[i0];
      const psi1 = state[i1];

      // nextState[i0] = u00*psi0 + u01*psi1
      nextState[i0] = C.add(C.mul(u00, psi0), C.mul(u01, psi1));
      // nextState[i1] = u10*psi0 + u11*psi1
      nextState[i1] = C.add(C.mul(u10, psi0), C.mul(u11, psi1));
    }
  }

  return nextState;
}

/**
 * Applies a Controlled-Single-Qubit gate (e.g. CX, CZ)
 */
function applyControlledGate(
  state: Complex[],
  controlQubit: number,
  targetQubit: number,
  totalQubits: number,
  matrix: Matrix2x2
): Complex[] {
  const dim = 1 << totalQubits;
  const nextState = [...state];
  const controlMask = 1 << controlQubit;
  const targetMask = 1 << targetQubit;

  const [[u00, u01], [u10, u11]] = matrix;

  for (let i = 0; i < dim; i++) {
    // If control bit is 1 and target bit is 0, process (i0, i1) pair
    if ((i & controlMask) !== 0 && (i & targetMask) === 0) {
      const i0 = i;
      const i1 = i | targetMask;
      const psi0 = state[i0];
      const psi1 = state[i1];

      nextState[i0] = C.add(C.mul(u00, psi0), C.mul(u01, psi1));
      nextState[i1] = C.add(C.mul(u10, psi0), C.mul(u11, psi1));
    }
  }

  return nextState;
}

/**
 * Applies a 2-control gate (Toffoli / CCX)
 */
function applyToffoliGate(
  state: Complex[],
  c1: number,
  c2: number,
  target: number,
  totalQubits: number
): Complex[] {
  const dim = 1 << totalQubits;
  const nextState = [...state];
  const maskC1 = 1 << c1;
  const maskC2 = 1 << c2;
  const maskT = 1 << target;

  for (let i = 0; i < dim; i++) {
    if ((i & maskC1) !== 0 && (i & maskC2) !== 0 && (i & maskT) === 0) {
      const i0 = i;
      const i1 = i | maskT;
      const tmp = nextState[i0];
      nextState[i0] = nextState[i1];
      nextState[i1] = tmp;
    }
  }

  return nextState;
}

/**
 * Applies a SWAP gate
 */
function applySwapGate(
  state: Complex[],
  q1: number,
  q2: number,
  totalQubits: number
): Complex[] {
  const dim = 1 << totalQubits;
  const nextState = new Array<Complex>(dim);
  const mask1 = 1 << q1;
  const mask2 = 1 << q2;

  for (let i = 0; i < dim; i++) {
    const bit1 = (i & mask1) !== 0 ? 1 : 0;
    const bit2 = (i & mask2) !== 0 ? 1 : 0;

    if (bit1 === bit2) {
      nextState[i] = state[i];
    } else {
      // swap bits q1 and q2 in index i
      const swappedIndex = (i ^ mask1) ^ mask2;
      nextState[swappedIndex] = state[i];
    }
  }

  return nextState;
}

/**
 * Calculates single-qubit reduced density matrix and extracts Bloch sphere coordinates:
 * x = 2*Re(rho_01), y = 2*Im(rho_10) = -2*Im(rho_01), z = rho_00 - rho_11
 */
export function calculateBlochCoordinates(state: Complex[], totalQubits: number): BlochCoordinate[] {
  const dim = 1 << totalQubits;
  const coords: BlochCoordinate[] = [];

  for (let q = 0; q < totalQubits; q++) {
    const mask = 1 << q;
    let rho00 = 0;
    let rho11 = 0;
    let rho01_re = 0;
    let rho01_im = 0;

    for (let i = 0; i < dim; i++) {
      if ((i & mask) === 0) {
        const i0 = i;
        const i1 = i | mask;
        const a = state[i0];
        const b = state[i1];

        // |a|^2 contributes to rho00
        rho00 += C.absSq(a);
        // |b|^2 contributes to rho11
        rho11 += C.absSq(b);
        // a * b* contributes to rho01
        const term = C.mul(a, C.conj(b));
        rho01_re += term.re;
        rho01_im += term.im;
      }
    }

    const x = 2 * rho01_re;
    const y = -2 * rho01_im;
    const z = rho00 - rho11;
    const r = Math.min(1, Math.sqrt(x * x + y * y + z * z));

    let theta = 0;
    let phi = 0;
    if (r > 1e-7) {
      theta = Math.acos(Math.max(-1, Math.min(1, z / r)));
      phi = Math.atan2(y, x);
      if (phi < 0) phi += 2 * Math.PI;
    }

    coords.push({
      qubit: q,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      z: Number(z.toFixed(4)),
      theta: Number(theta.toFixed(4)),
      phi: Number(phi.toFixed(4)),
      p0: Number(rho00.toFixed(4)),
      p1: Number(rho11.toFixed(4)),
    });
  }

  return coords;
}

/**
 * Calculates Von Neumann Entanglement Entropy for bipartite split of qubit 0 vs rest
 */
function calculateEntanglementEntropy(state: Complex[], totalQubits: number): number {
  if (totalQubits < 2) return 0;
  const bloch = calculateBlochCoordinates(state, totalQubits)[0];
  const r = Math.sqrt(bloch.x * bloch.x + bloch.y * bloch.y + bloch.z * bloch.z);
  if (r >= 0.9999) return 0;
  const lambda1 = (1 + r) / 2;
  const lambda2 = (1 - r) / 2;
  const s1 = lambda1 > 1e-9 ? -lambda1 * Math.log2(lambda1) : 0;
  const s2 = lambda2 > 1e-9 ? -lambda2 * Math.log2(lambda2) : 0;
  return Number((s1 + s2).toFixed(4));
}

/**
 * Samples measurement shot counts based on state probabilities + optional noise
 */
export function sampleMeasurements(
  probabilities: Record<string, number>,
  shots = 1024,
  readoutErrorRate = 0
): Record<string, number> {
  const counts: Record<string, number> = {};
  const basisStates = Object.keys(probabilities);

  if (basisStates.length === 0) return counts;

  // Initialize counts
  for (const b of basisStates) {
    counts[b] = 0;
  }

  // Sample using cumulative distribution
  const cumulative: { state: string; cumProb: number }[] = [];
  let sum = 0;
  for (const state of basisStates) {
    sum += probabilities[state] || 0;
    cumulative.push({ state, cumProb: sum });
  }

  for (let s = 0; s < shots; s++) {
    const r = Math.random() * (sum > 0 ? sum : 1);
    let chosen = basisStates[0];
    for (const item of cumulative) {
      if (r <= item.cumProb) {
        chosen = item.state;
        break;
      }
    }

    // Apply readout noise if enabled
    if (readoutErrorRate > 0) {
      let noisyState = '';
      for (let charIndex = 0; charIndex < chosen.length; charIndex++) {
        const bit = chosen[charIndex];
        if (Math.random() < readoutErrorRate) {
          noisyState += bit === '0' ? '1' : '0';
        } else {
          noisyState += bit;
        }
      }
      chosen = noisyState;
    }

    counts[chosen] = (counts[chosen] || 0) + 1;
  }

  return counts;
}

export const sampleMeasurementCounts = sampleMeasurements;

/**
 * Main Quantum Simulation Engine Execution
 */
export function simulateCircuit(
  circuitIR: QuantumCircuitIR,
  options: {
    shots?: number;
    backend?: 'statevector' | 'shot_based';
    noiseModel?: { enabled: boolean; depolarizingRate: number; readoutErrorRate: number };
  } = {}
): SimulationResult {
  const startTime = performance.now();
  const numQubits = Math.max(1, Math.min(8, circuitIR.qubits || 2));
  const dim = 1 << numQubits;
  const shots = options.shots ?? 1024;

  // Initial state |0...0>
  let state = new Array<Complex>(dim);
  for (let i = 0; i < dim; i++) {
    state[i] = i === 0 ? C.one() : C.zero();
  }

  // Track step-by-step state snapshots
  const stepStates: {
    stepIndex: number;
    gateName: string;
    statevector: Complex[];
    probabilities: Record<string, number>;
  }[] = [];

  // Record initial |00...0> state snapshot
  const initialProb: Record<string, number> = {};
  for (let i = 0; i < dim; i++) {
    const bitstring = i.toString(2).padStart(numQubits, '0');
    initialProb[bitstring] = i === 0 ? 1 : 0;
  }
  stepStates.push({
    stepIndex: 0,
    gateName: 'Init |0⟩',
    statevector: [...state],
    probabilities: initialProb,
  });

  // Sort gates by stepIndex
  const sortedGates = [...(circuitIR.gates || [])].sort((a, b) => a.stepIndex - b.stepIndex);

  let twoQubitCount = 0;
  let maxStep = 0;

  for (const gate of sortedGates) {
    maxStep = Math.max(maxStep, gate.stepIndex);
    const target = gate.targets?.[0] ?? 0;
    const control = gate.controls?.[0];

    if (gate.type === 'Barrier' || gate.type === 'M') {
      // Visual / measurement checkpoint
      continue;
    }

    if (gate.type === 'CX' && control !== undefined) {
      twoQubitCount++;
      state = applyControlledGate(state, control, target, numQubits, GATES_2X2.X());
    } else if (gate.type === 'CZ' && control !== undefined) {
      twoQubitCount++;
      state = applyControlledGate(state, control, target, numQubits, GATES_2X2.Z());
    } else if (gate.type === 'CCX' && gate.controls && gate.controls.length >= 2) {
      twoQubitCount += 2;
      state = applyToffoliGate(state, gate.controls[0], gate.controls[1], target, numQubits);
    } else if (gate.type === 'SWAP' && gate.targets.length >= 2) {
      twoQubitCount++;
      state = applySwapGate(state, gate.targets[0], gate.targets[1], numQubits);
    } else if (GATES_2X2[gate.type]) {
      const mat = GATES_2X2[gate.type](gate.params);
      state = applySingleQubitGate(state, target, numQubits, mat);
    }

    // Capture step snapshot
    const currentProb: Record<string, number> = {};
    for (let i = 0; i < dim; i++) {
      const bitstring = i.toString(2).padStart(numQubits, '0');
      const p = C.absSq(state[i]);
      if (p > 1e-6) {
        currentProb[bitstring] = Number(p.toFixed(5));
      }
    }

    stepStates.push({
      stepIndex: gate.stepIndex,
      gateName: `${gate.type} (q${target}${control !== undefined ? `, c${control}` : ''})`,
      statevector: [...state],
      probabilities: currentProb,
    });
  }

  // Calculate final probabilities
  const finalProbabilities: Record<string, number> = {};
  for (let i = 0; i < dim; i++) {
    const bitstring = i.toString(2).padStart(numQubits, '0');
    const p = C.absSq(state[i]);
    if (p > 1e-6) {
      finalProbabilities[bitstring] = Number(p.toFixed(5));
    }
  }

  // Generate shots counts
  const counts = sampleMeasurements(
    finalProbabilities,
    shots,
    options.noiseModel?.enabled ? options.noiseModel.readoutErrorRate : 0
  );

  // Calculate Bloch coordinates for all qubits
  const blochVectors = calculateBlochCoordinates(state, numQubits);
  const entanglementEntropy = calculateEntanglementEntropy(state, numQubits);

  const endTime = performance.now();

  return {
    provider: 'nexus_core_sim',
    backend: options.backend ?? 'statevector',
    qubits: numQubits,
    shots,
    statevector: state,
    probabilities: finalProbabilities,
    counts,
    blochVectors,
    executionTimeMs: Number((endTime - startTime).toFixed(2)),
    circuitDepth: maxStep + 1,
    totalGateCount: sortedGates.filter((g) => g.type !== 'Barrier').length,
    twoQubitGateCount: twoQubitCount,
    purity: 1.0,
    entanglementEntropy,
    stepStates,
    noiseModel: options.noiseModel,
  };
}

/**
 * Circuit Optimization Analyzer
 * Detects redundant gates like H-H = I, X-X = I, and recommends depth reduction
 */
export function analyzeAndOptimizeCircuit(ir: QuantumCircuitIR): {
  redundantGatesFound: number;
  depthSavings: number;
  recommendations: string[];
  optimizedIR: QuantumCircuitIR;
} {
  const recommendations: string[] = [];
  const gates = [...ir.gates];
  let redundantFound = 0;

  // Check consecutive self-inverse gates on same qubit
  const optimizedGates: CircuitGate[] = [];
  const qubitLastGate: Record<number, { gate: CircuitGate; index: number } | null> = {};

  for (const gate of gates) {
    if (gate.type === 'Barrier') continue;

    if (['H', 'X', 'Y', 'Z'].includes(gate.type) && gate.targets.length === 1 && !gate.controls) {
      const q = gate.targets[0];
      const prev = qubitLastGate[q];

      if (prev && prev.gate.type === gate.type && prev.gate.stepIndex === gate.stepIndex - 1) {
        // Redundant cancellation! (e.g. H followed by H)
        recommendations.push(
          `Eliminated paired ${gate.type}-${gate.type} on qubit ${q} (Self-inverse identity gate cancellation).`
        );
        redundantFound += 2;
        // remove prev
        const removeIdx = optimizedGates.findIndex((g) => g.id === prev.gate.id);
        if (removeIdx >= 0) optimizedGates.splice(removeIdx, 1);
        qubitLastGate[q] = null;
        continue;
      }
    }

    optimizedGates.push(gate);
    if (gate.targets.length === 1) {
      qubitLastGate[gate.targets[0]] = { gate, index: optimizedGates.length - 1 };
    }
  }

  const depthSavings = ir.gates.length - optimizedGates.length;

  return {
    redundantGatesFound: redundantFound,
    depthSavings,
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ['Circuit is already compact. No obvious redundant inverse pairs detected.'],
    optimizedIR: {
      ...ir,
      gates: optimizedGates,
    },
  };
}
