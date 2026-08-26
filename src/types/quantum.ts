/**
 * Q-Learn Nexus - Quantum Computing Types and Data Contracts
 * @license Apache-2.0
 */

export interface Complex {
  re: number;
  im: number;
}

export type GateType =
  | 'H'
  | 'X'
  | 'Y'
  | 'Z'
  | 'S'
  | 'Sdg'
  | 'T'
  | 'Tdg'
  | 'Rx'
  | 'Ry'
  | 'Rz'
  | 'CX'
  | 'CZ'
  | 'SWAP'
  | 'CCX'
  | 'M'
  | 'Barrier'
  | 'Reset';

export interface GateParam {
  theta?: number;
  phi?: number;
  lambda?: number;
}

export interface CircuitGate {
  id: string;
  type: GateType;
  targets: number[]; // primary qubit indices
  controls?: number[]; // control qubit indices (for CX, CZ, CCX)
  params?: GateParam;
  stepIndex: number;
  name?: string;
}

export interface QuantumCircuitIR {
  version: string;
  name: string;
  qubits: number;
  classicalBits: number;
  gates: CircuitGate[];
  metadata?: {
    description?: string;
    author?: string;
    created?: string;
  };
}

export interface BlochCoordinate {
  qubit: number;
  x: number;
  y: number;
  z: number;
  theta: number; // in radians [0, pi]
  phi: number;   // in radians [0, 2*pi]
  p0: number;    // |0> probability
  p1: number;    // |1> probability
}

export interface SimulationResult {
  provider: 'nexus_core_sim' | 'qiskit_aer_compat' | 'pennylane_compat' | 'cirq_compat';
  backend: 'statevector' | 'shot_based' | 'density_matrix';
  qubits: number;
  shots: number;
  statevector: Complex[];
  probabilities: Record<string, number>;
  counts: Record<string, number>;
  blochVectors: BlochCoordinate[];
  executionTimeMs: number;
  circuitDepth: number;
  totalGateCount: number;
  twoQubitGateCount: number;
  purity: number;
  entanglementEntropy?: number;
  stepStates?: {
    stepIndex: number;
    gateName: string;
    statevector: Complex[];
    probabilities: Record<string, number>;
  }[];
  noiseModel?: {
    enabled: boolean;
    depolarizingRate: number;
    readoutErrorRate: number;
  };
}

export type QuantumFramework = 'qiskit' | 'pennylane' | 'cirq' | 'qasm';

export interface QuantumAlgorithm {
  id: string;
  title: string;
  category: 'Beginner' | 'Intermediate' | 'Advanced';
  difficulty: '★☆☆' | '★★☆' | '★★★';
  summary: string;
  problemStatement: string;
  intuition: string;
  mathExplanation: string;
  quantumSpeedup: string;
  classicalComplexity: string;
  quantumComplexity: string;
  defaultQubits: number;
  circuitIR: QuantumCircuitIR;
  practicalApplications: string[];
  interactiveControls?: {
    type: 'bitstring' | 'angle' | 'target' | 'oracle';
    label: string;
    options?: string[];
    min?: number;
    max?: number;
    step?: number;
    defaultValue: any;
  }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  explanation: string;
  options: string[];
  correctAnswer: number;
  conceptBadge: string;
}

export interface CourseLesson {
  id: string;
  title: string;
  readTime: string;
  summary: string;
  contentMarkdown: string;
  mathFormula?: string;
  interactiveCircuitIR?: QuantumCircuitIR;
  quiz?: QuizQuestion[];
}

export interface CourseModule {
  id: string;
  number: number;
  title: string;
  description: string;
  iconName: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons: CourseLesson[];
}

export interface CodingChallenge {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  description: string;
  goal: string;
  targetStatevectorDesc: string;
  starterIR: QuantumCircuitIR;
  expectedBehavior: string;
  hints: string[];
  testRunner: (result: SimulationResult) => { passed: boolean; message: string; feedback: string };
  rewardPoints: number;
}

export interface SavedProject {
  id: string;
  title: string;
  description: string;
  circuitIR: QuantumCircuitIR;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  versionHistory: {
    version: number;
    timestamp: string;
    note: string;
    circuitIR: QuantumCircuitIR;
  }[];
}

export interface TutorMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; action: string; payload?: any }[];
  contextSnippet?: string;
}
