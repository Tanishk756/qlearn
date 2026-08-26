/**
 * Q-Learn Nexus - Interactive Quantum Circuit Challenges & Automated Evaluators
 * @license Apache-2.0
 */

import { CodingChallenge } from '../types/quantum';
import { C } from '../quantum/engine';

export const CODING_CHALLENGES: CodingChallenge[] = [
  {
    id: 'challenge_bell_phi_plus',
    title: 'Generate Bell State |Φ⁺⟩ = (|00⟩ + |11⟩)/√2',
    difficulty: 'Easy',
    category: 'Entanglement',
    description: 'Construct a 2-qubit circuit that transforms the initial state |00⟩ into the maximally entangled Bell state |Φ⁺⟩.',
    goal: 'Ensure P(00) ≈ 50%, P(11) ≈ 50%, and P(01) = P(10) = 0 with 0 relative phase.',
    targetStatevectorDesc: '[0.7071, 0, 0, 0.7071]',
    starterIR: {
      version: '1.0',
      name: 'Challenge: Bell State',
      qubits: 2,
      classicalBits: 2,
      gates: [],
    },
    expectedBehavior: 'Hadamard on qubit 0 followed by CNOT from qubit 0 to qubit 1.',
    hints: [
      'Start by placing a Hadamard (H) gate on qubit 0 to put it into superposition.',
      'Next, use a CNOT (CX) gate with qubit 0 as the control and qubit 1 as the target.',
    ],
    rewardPoints: 100,
    testRunner: (result) => {
      const p00 = result.probabilities['00'] || 0;
      const p11 = result.probabilities['11'] || 0;
      const p01 = result.probabilities['01'] || 0;
      const p10 = result.probabilities['10'] || 0;

      if (Math.abs(p00 - 0.5) < 0.05 && Math.abs(p11 - 0.5) < 0.05 && p01 < 0.01 && p10 < 0.01) {
        return {
          passed: true,
          message: 'Excellent! Bell state |Φ⁺⟩ verified successfully with fidelity > 99.9%.',
          feedback: 'You generated a maximally entangled Einstein-Podolsky-Rosen (EPR) pair.',
        };
      }
      return {
        passed: false,
        message: `Probabilities do not match |Φ⁺⟩. Expected P(00)≈0.5, P(11)≈0.5. Received P(00)=${(p00 * 100).toFixed(1)}%, P(11)=${(p11 * 100).toFixed(1)}%.`,
        feedback: 'Make sure H is on qubit 0, followed by CNOT with control q0 and target q1.',
      };
    },
  },
  {
    id: 'challenge_bell_psi_minus',
    title: 'Generate Bell Singlet State |Ψ⁻⟩ = (|01⟩ - |10⟩)/√2',
    difficulty: 'Easy',
    category: 'Entanglement',
    description: 'Construct a 2-qubit circuit that produces the anti-symmetric singlet state |Ψ⁻⟩.',
    goal: 'Ensure P(01) ≈ 50%, P(10) ≈ 50%, P(00) = P(11) = 0, with a π relative phase between components.',
    targetStatevectorDesc: '[0, 0.7071, -0.7071, 0]',
    starterIR: {
      version: '1.0',
      name: 'Challenge: Singlet State |Ψ⁻⟩',
      qubits: 2,
      classicalBits: 2,
      gates: [],
    },
    expectedBehavior: 'X on q0 and q1, H on q0, CNOT(0->1), or X then H on q0, Z on q0, CNOT.',
    hints: [
      'Recall that |Ψ⁻⟩ has opposite bits (01 and 10) and a negative phase.',
      'Try applying Pauli-X to both qubits before generating the Bell pair, or use Pauli-Z to flip the phase.',
    ],
    rewardPoints: 120,
    testRunner: (result) => {
      const p01 = result.probabilities['01'] || 0;
      const p10 = result.probabilities['10'] || 0;
      const p00 = result.probabilities['00'] || 0;
      const p11 = result.probabilities['11'] || 0;

      const sv = result.statevector;
      const amp01 = sv[1] || C.zero();
      const amp10 = sv[2] || C.zero();

      // Check opposite sign for |01> vs |10>
      const phaseDiff = Math.abs(C.phase(amp01) - C.phase(amp10));
      const hasPiPhase = Math.abs(phaseDiff - Math.PI) < 0.2;

      if (Math.abs(p01 - 0.5) < 0.05 && Math.abs(p10 - 0.5) < 0.05 && p00 < 0.01 && p11 < 0.01 && hasPiPhase) {
        return {
          passed: true,
          message: 'Singlet State |Ψ⁻⟩ successfully generated and relative π phase verified!',
          feedback: 'This anti-symmetric state is invariant under global SU(2) rotations.',
        };
      }
      return {
        passed: false,
        message: `State did not match |Ψ⁻⟩. Received P(01)=${(p01 * 100).toFixed(1)}%, P(10)=${(p10 * 100).toFixed(1)}%.`,
        feedback: 'Ensure you have anti-correlated bit outcomes and a negative phase between |01⟩ and |10⟩.',
      };
    },
  },
  {
    id: 'challenge_swap_via_cnot',
    title: 'Synthesize SWAP Gate from 3 CNOT Gates',
    difficulty: 'Medium',
    category: 'Circuit Synthesis',
    description: 'Without using the native SWAP gate, swap the states of two qubits using exactly 3 CNOT gates.',
    goal: 'Given an input where qubit 0 is |1⟩ and qubit 1 is |0⟩, swap them so the final state is |01⟩ (meaning q0=0, q1=1).',
    targetStatevectorDesc: 'State |10⟩ transferred to |01⟩ with 100% fidelity.',
    starterIR: {
      version: '1.0',
      name: 'Challenge: SWAP via CNOTs',
      qubits: 2,
      classicalBits: 2,
      gates: [
        { id: 'init', type: 'X', targets: [0], stepIndex: 0 }, // Prepare |10>
      ],
    },
    expectedBehavior: 'CNOT(0->1), CNOT(1->0), CNOT(0->1)',
    hints: [
      'A classical XOR swap algorithm uses 3 XOR operations: a ^= b; b ^= a; a ^= b;',
      'Since CNOT acts as quantum XOR, use 3 alternating CNOT gates between qubit 0 and qubit 1.',
    ],
    rewardPoints: 150,
    testRunner: (result) => {
      const p01 = result.probabilities['01'] || 0;
      const usesSwapGate = result.totalGateCount > 0 && result.stepStates?.some((s) => s.gateName.includes('SWAP'));

      if (usesSwapGate) {
        return {
          passed: false,
          message: 'Native SWAP gate detected! You must synthesize it using CNOT gates only.',
          feedback: 'Remove the SWAP gate and construct it from 3 alternating CNOTs.',
        };
      }

      if (p01 > 0.95) {
        return {
          passed: true,
          message: 'Brilliant! SWAP identity synthesized using 3 alternating CNOT gates.',
          feedback: 'CX(0→1) followed by CX(1→0) followed by CX(0→1) successfully performs a full state swap.',
        };
      }
      return {
        passed: false,
        message: `Output was not |01⟩. Measured P(01) = ${(p01 * 100).toFixed(1)}%.`,
        feedback: 'Check the control and target order of your 3 CNOT gates.',
      };
    },
  },
  {
    id: 'challenge_ghz_3qubit',
    title: '3-Qubit GHZ State Preparation',
    difficulty: 'Medium',
    category: 'Entanglement',
    description: 'Construct a 3-qubit circuit that produces the tripartite GHZ state (|000⟩ + |111⟩)/√2.',
    goal: 'Achieve P(000) ≈ 50%, P(111) ≈ 50%, with all other 6 basis states at 0%.',
    targetStatevectorDesc: '[0.7071, 0, 0, 0, 0, 0, 0, 0.7071]',
    starterIR: {
      version: '1.0',
      name: 'Challenge: 3-Qubit GHZ',
      qubits: 3,
      classicalBits: 3,
      gates: [],
    },
    expectedBehavior: 'H on q0, CNOT(0->1), CNOT(1->2) or CNOT(0->2).',
    hints: [
      'First create superposition on qubit 0 with Hadamard.',
      'Then propagate entanglement to qubit 1 and qubit 2 using CNOT gates.',
    ],
    rewardPoints: 150,
    testRunner: (result) => {
      const p000 = result.probabilities['000'] || 0;
      const p111 = result.probabilities['111'] || 0;

      if (Math.abs(p000 - 0.5) < 0.05 && Math.abs(p111 - 0.5) < 0.05) {
        return {
          passed: true,
          message: 'GHZ state (|000⟩ + |111⟩)/√2 prepared with 100% coherence!',
          feedback: '3-qubit maximal entanglement verified.',
        };
      }
      return {
        passed: false,
        message: `Probabilities do not match GHZ. P(000)=${(p000 * 100).toFixed(1)}%, P(111)=${(p111 * 100).toFixed(1)}%.`,
        feedback: 'Ensure both q1 and q2 are entangled to q0.',
      };
    },
  },
  {
    id: 'challenge_phase_flip_oracle',
    title: 'Implement Phase Flip Oracle for State |11⟩',
    difficulty: 'Medium',
    category: 'Oracles',
    description: 'Construct a 2-qubit phase oracle that leaves states |00⟩, |01⟩, |10⟩ unchanged, but inverts the phase of |11⟩ to -|11⟩.',
    goal: 'When applied to equal superposition (|+⟩|+⟩), the state should become (|00⟩ + |01⟩ + |10⟩ - |11⟩)/2.',
    targetStatevectorDesc: '[0.5, 0.5, 0.5, -0.5]',
    starterIR: {
      version: '1.0',
      name: 'Challenge: Phase Flip Oracle',
      qubits: 2,
      classicalBits: 2,
      gates: [
        { id: 'h0', type: 'H', targets: [0], stepIndex: 0 },
        { id: 'h1', type: 'H', targets: [1], stepIndex: 0 },
      ],
    },
    expectedBehavior: 'Controlled-Z (CZ) gate between qubit 0 and qubit 1.',
    hints: [
      'Think about which two-qubit gate naturally flips the phase only when both control and target are 1.',
      'Controlled-Z (CZ) has matrix diag(1, 1, 1, -1).',
    ],
    rewardPoints: 130,
    testRunner: (result) => {
      const sv = result.statevector;
      const amp11 = sv[3] || C.zero();
      const isNegative = amp11.re < -0.4;

      if (isNegative && Math.abs(C.absSq(amp11) - 0.25) < 0.05) {
        return {
          passed: true,
          message: 'Phase Flip Oracle for |11⟩ successfully verified!',
          feedback: 'This is the exact oracle used in 2-qubit Grover search.',
        };
      }
      return {
        passed: false,
        message: 'State |11⟩ was not inverted with negative phase.',
        feedback: 'Try using a Controlled-Z (CZ) gate or H-CX-H decomposition.',
      };
    },
  },
];
