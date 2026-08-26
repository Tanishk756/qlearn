/**
 * Q-Learn Nexus - Server-Side Quantum Mathematical Engine
 * Rigorous statevector manipulation, unitary matrices, Born rule measurements, and Bloch vectors.
 * Implements Canonical Little-Endian Qubit Ordering (Qiskit / OpenQASM standard).
 * @license Apache-2.0
 */

export const CANONICAL_QUBIT_ORDER = 'LITTLE_ENDIAN';
export const MAX_STATEVECTOR_QUBITS = 16;
export const MAX_DENSITY_MATRIX_QUBITS = 8;
export const MAX_GATES = 500;
export const MAX_SHOTS = 100000;

export interface Complex {
  re: number;
  im: number;
}

export interface CircuitGate {
  id: string;
  type: string;
  targets: number[];
  controls?: number[];
  params?: {
    theta?: number;
    phi?: number;
    lambda?: number;
  };
  stepIndex: number;
}

export interface QuantumCircuitIR {
  version: string;
  name: string;
  qubits: number;
  classicalBits: number;
  gates: CircuitGate[];
  canonicalQubitOrder?: 'LITTLE_ENDIAN' | 'BIG_ENDIAN';
}

export interface BlochCoordinate {
  x: number;
  y: number;
  z: number;
  theta: number;
  phi: number;
  qubit?: number;
  p0?: number;
  p1?: number;
}

export interface SimulationResult {
  qubits: number;
  statevector: Complex[];
  probabilities: Record<string, number>;
  counts: Record<string, number>;
  shots: number;
  blochVectors: BlochCoordinate[];
  executionTimeMs: number;
  endianness: string;
}

export const C = {
  zero: (): Complex => ({ re: 0, im: 0 }),
  one: (): Complex => ({ re: 1, im: 0 }),
  i: (): Complex => ({ re: 0, im: 1 }),
  new: (re: number, im = 0): Complex => ({ re, im }),
  add: (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im }),
  sub: (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im }),
  mul: (a: Complex, b: Complex): Complex => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }),
  scale: (a: Complex, s: number): Complex => ({ re: a.re * s, im: a.im * s }),
  conj: (a: Complex): Complex => ({ re: a.re, im: -a.im }),
  abs: (a: Complex): number => Math.hypot(a.re, a.im),
  absSq: (a: Complex): number => a.re * a.re + a.im * a.im,
  exp: (theta: number): Complex => ({ re: Math.cos(theta), im: Math.sin(theta) }),
};

type Matrix2x2 = [[Complex, Complex], [Complex, Complex]];

const SINGLE_QUBIT_GATES: Record<string, (params?: any) => Matrix2x2> = {
  H: () => [
    [C.new(Math.SQRT1_2), C.new(Math.SQRT1_2)],
    [C.new(Math.SQRT1_2), C.new(-Math.SQRT1_2)],
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
    [C.zero(), C.new(Math.SQRT1_2, Math.SQRT1_2)],
  ],
  Tdg: () => [
    [C.one(), C.zero()],
    [C.zero(), C.new(Math.SQRT1_2, -Math.SQRT1_2)],
  ],
  Rx: (p) => {
    const theta = p?.theta ?? 0;
    const half = theta / 2;
    return [
      [C.new(Math.cos(half)), C.new(0, -Math.sin(half))],
      [C.new(0, -Math.sin(half)), C.new(Math.cos(half))],
    ];
  },
  Ry: (p) => {
    const theta = p?.theta ?? 0;
    const half = theta / 2;
    return [
      [C.new(Math.cos(half)), C.new(-Math.sin(half))],
      [C.new(Math.sin(half)), C.new(Math.cos(half))],
    ];
  },
  Rz: (p) => {
    const phi = p?.phi ?? 0;
    const half = phi / 2;
    return [
      [C.new(Math.cos(half), -Math.sin(half)), C.zero()],
      [C.zero(), C.new(Math.cos(half), Math.sin(half))],
    ];
  },
};

export function simulateServerCircuit(ir: QuantumCircuitIR, shots = 1024): SimulationResult {
  const startTime = Date.now();
  const numQubits = Math.max(1, Math.min(ir.qubits, MAX_STATEVECTOR_QUBITS));
  const dim = 1 << numQubits;

  // Initialize state |00...0>
  let state: Complex[] = new Array(dim).fill(0).map(() => C.zero());
  state[0] = C.one();

  // Sort gates by stepIndex
  const sortedGates = [...ir.gates].sort((a, b) => a.stepIndex - b.stepIndex);

  for (const gate of sortedGates) {
    if (gate.type === 'CX' || gate.type === 'CNOT') {
      const ctrl = gate.controls?.[0] ?? 0;
      const tgt = gate.targets[0];
      state = applyCX(state, numQubits, ctrl, tgt);
    } else if (gate.type === 'CZ') {
      const ctrl = gate.controls?.[0] ?? 0;
      const tgt = gate.targets[0];
      state = applyCZ(state, numQubits, ctrl, tgt);
    } else if (gate.type === 'SWAP') {
      const q1 = gate.targets[0];
      const q2 = gate.targets[1] ?? (gate.controls ? gate.controls[0] : 1);
      state = applySWAP(state, numQubits, q1, q2);
    } else if (gate.type === 'CCX' || gate.type === 'Toffoli') {
      const ctrl1 = gate.controls?.[0] ?? 0;
      const ctrl2 = gate.controls?.[1] ?? 1;
      const tgt = gate.targets[0];
      state = applyCCX(state, numQubits, ctrl1, ctrl2, tgt);
    } else if (SINGLE_QUBIT_GATES[gate.type]) {
      const tgt = gate.targets[0];
      const matrix = SINGLE_QUBIT_GATES[gate.type](gate.params);
      state = applySingleQubitGate(state, numQubits, tgt, matrix);
    }
  }

  // Calculate Born Rule probabilities (Little-Endian: bit q0 is at index 1 << 0, rightmost in binary string)
  const probabilities: Record<string, number> = {};
  for (let i = 0; i < dim; i++) {
    const prob = C.absSq(state[i]);
    if (prob > 1e-7) {
      const bitstring = i.toString(2).padStart(numQubits, '0');
      probabilities[bitstring] = prob;
    }
  }

  // Sample measurement shots
  const counts = sampleShots(probabilities, shots);

  // Compute single-qubit Bloch coordinates
  const blochVectors = computeBlochVectors(state, numQubits);

  const duration = Date.now() - startTime;

  return {
    qubits: numQubits,
    statevector: state,
    probabilities,
    counts,
    shots,
    blochVectors,
    executionTimeMs: duration,
    endianness: 'little-endian',
  };
}

// Little-Endian Bit Operations (q0 is bit 0 -> 1 << target)
function applySingleQubitGate(state: Complex[], n: number, target: number, u: Matrix2x2): Complex[] {
  const dim = 1 << n;
  const next = new Array(dim).fill(0).map(() => C.zero());
  const bit = 1 << target;

  for (let i = 0; i < dim; i++) {
    if ((i & bit) === 0) {
      const i0 = i;
      const i1 = i | bit;
      const v0 = state[i0];
      const v1 = state[i1];

      next[i0] = C.add(C.mul(u[0][0], v0), C.mul(u[0][1], v1));
      next[i1] = C.add(C.mul(u[1][0], v0), C.mul(u[1][1], v1));
    }
  }
  return next;
}

function applyCX(state: Complex[], n: number, ctrl: number, target: number): Complex[] {
  const dim = 1 << n;
  const next = [...state];
  const ctrlBit = 1 << ctrl;
  const tgtBit = 1 << target;

  for (let i = 0; i < dim; i++) {
    if ((i & ctrlBit) !== 0 && (i & tgtBit) === 0) {
      const partner = i | tgtBit;
      const temp = next[i];
      next[i] = next[partner];
      next[partner] = temp;
    }
  }
  return next;
}

function applyCZ(state: Complex[], n: number, ctrl: number, target: number): Complex[] {
  const dim = 1 << n;
  const next = [...state];
  const ctrlBit = 1 << ctrl;
  const tgtBit = 1 << target;

  for (let i = 0; i < dim; i++) {
    if ((i & ctrlBit) !== 0 && (i & tgtBit) !== 0) {
      next[i] = C.scale(next[i], -1);
    }
  }
  return next;
}

function applySWAP(state: Complex[], n: number, q1: number, q2: number): Complex[] {
  const dim = 1 << n;
  const next = [...state];
  const bit1 = 1 << q1;
  const bit2 = 1 << q2;

  for (let i = 0; i < dim; i++) {
    const has1 = (i & bit1) !== 0;
    const has2 = (i & bit2) !== 0;
    if (has1 !== has2 && !has1) {
      const partner = (i | bit1) & ~bit2;
      const temp = next[i];
      next[i] = next[partner];
      next[partner] = temp;
    }
  }
  return next;
}

function applyCCX(state: Complex[], n: number, c1: number, c2: number, target: number): Complex[] {
  const dim = 1 << n;
  const next = [...state];
  const c1Bit = 1 << c1;
  const c2Bit = 1 << c2;
  const tgtBit = 1 << target;

  for (let i = 0; i < dim; i++) {
    if ((i & c1Bit) !== 0 && (i & c2Bit) !== 0 && (i & tgtBit) === 0) {
      const partner = i | tgtBit;
      const temp = next[i];
      next[i] = next[partner];
      next[partner] = temp;
    }
  }
  return next;
}

function sampleShots(probabilities: Record<string, number>, shots: number): Record<string, number> {
  const counts: Record<string, number> = {};
  const entries = Object.entries(probabilities);
  if (entries.length === 0) return { '0': shots };

  for (let s = 0; s < shots; s++) {
    const rand = Math.random();
    let cumulative = 0;
    let selected = entries[0][0];

    for (const [bitstring, prob] of entries) {
      cumulative += prob;
      if (rand <= cumulative) {
        selected = bitstring;
        break;
      }
    }
    counts[selected] = (counts[selected] || 0) + 1;
  }
  return counts;
}

function computeBlochVectors(state: Complex[], n: number): BlochCoordinate[] {
  const coords: BlochCoordinate[] = [];
  const dim = 1 << n;

  for (let q = 0; q < n; q++) {
    const bit = 1 << q;
    let rho00 = 0;
    let rho11 = 0;
    let rho01 = C.zero();

    for (let i = 0; i < dim; i++) {
      if ((i & bit) === 0) {
        const i0 = i;
        const i1 = i | bit;
        rho00 += C.absSq(state[i0]);
        rho11 += C.absSq(state[i1]);
        rho01 = C.add(rho01, C.mul(state[i0], { re: state[i1].re, im: -state[i1].im }));
      }
    }

    const x = 2 * rho01.re;
    const y = -2 * rho01.im;
    const z = rho00 - rho11;

    const r = Math.min(1.0, Math.hypot(x, y, z));
    const theta = r < 1e-6 ? 0 : Math.acos(Math.max(-1, Math.min(1, z / (r || 1))));
    const phi = Math.atan2(y, x);

    coords.push({
      qubit: q,
      x: Number(x.toFixed(6)),
      y: Number(y.toFixed(6)),
      z: Number(z.toFixed(6)),
      theta: Number(theta.toFixed(6)),
      phi: Number(phi.toFixed(6)),
      p0: Number(rho00.toFixed(6)),
      p1: Number(rho11.toFixed(6)),
    });
  }

  return coords;
}
