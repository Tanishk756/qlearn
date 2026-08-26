/**
 * Q-Learn Nexus - Comprehensive Standard Quantum Algorithms Suite
 * Fully functional circuits, mathematical formulations, complexity comparisons, and interactive parameters.
 * @license Apache-2.0
 */

import { QuantumAlgorithm, QuantumCircuitIR } from '../types/quantum';

export const QUANTUM_ALGORITHMS: QuantumAlgorithm[] = [
  {
    id: 'bell_state',
    title: 'Bell State Generation (|Φ⁺⟩)',
    category: 'Beginner',
    difficulty: '★☆☆',
    summary: 'The quintessential 2-qubit maximally entangled state demonstrating quantum non-locality.',
    problemStatement:
      'Create a maximally entangled two-qubit EPR pair such that measuring one qubit instantaneously determines the state of the other, with correlations violating Bell inequalities.',
    intuition:
      'Applying a Hadamard gate to qubit 0 places it in equal superposition (|0⟩ + |1⟩)/√2. The subsequent CNOT gate uses qubit 0 to flip qubit 1 only when qubit 0 is |1⟩, producing (|00⟩ + |11⟩)/√2.',
    mathExplanation:
      '|ψ₀⟩ = |00⟩\n|ψ₁⟩ = (H ⊗ I)|00⟩ = 1/√2 (|00⟩ + |10⟩)\n|ψ₂⟩ = CNOT₁₀ |ψ₁⟩ = 1/√2 (|00⟩ + |11⟩) = |Φ⁺⟩',
    quantumSpeedup: 'N/A (Foundational Resource for Teleportation & Cryptography)',
    classicalComplexity: 'Local Hidden Variable correlations bounded by Bell-CHSH ≤ 2',
    quantumComplexity: 'Quantum entanglement achieves CHSH correlation up to 2√2 ≈ 2.828 (Tsirelson bound)',
    defaultQubits: 2,
    circuitIR: {
      version: '1.0',
      name: 'Bell State |Φ⁺⟩',
      qubits: 2,
      classicalBits: 2,
      gates: [
        { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
        { id: 'g1', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
      ],
    },
    practicalApplications: [
      'Quantum Teleportation',
      'Quantum Key Distribution (E91 Protocol)',
      'Superdense Coding',
      'Quantum Repeater Networks',
    ],
  },
  {
    id: 'ghz_state',
    title: '3-Qubit Greenberger-Horne-Zeilinger (GHZ) State',
    category: 'Beginner',
    difficulty: '★☆☆',
    summary: 'Tripartite maximally entangled state (|000⟩ + |111⟩)/√2.',
    problemStatement:
      'Create a three-qubit entangled state exhibiting all-or-nothing non-classical correlations, fundamentally disproving local hidden variable theories without statistical inequalities.',
    intuition:
      'Qubit 0 enters superposition via H. Two cascading CNOTs entangle qubit 1 and qubit 2 with qubit 0, yielding a state where all three qubits are either simultaneously 0 or simultaneously 1.',
    mathExplanation:
      '|ψ⟩ = (CNOT₂₀)(CNOT₁₀)(H ⊗ I ⊗ I)|000⟩ = 1/√2 (|000⟩ + |111⟩)',
    quantumSpeedup: 'Multi-party quantum networking and fault-tolerant stabilizer codes',
    classicalComplexity: 'Classical shared randomness requires 3 separate coin tosses',
    quantumComplexity: 'Single coherent multi-qubit wavefunction with 0% probability of mixed parity',
    defaultQubits: 3,
    circuitIR: {
      version: '1.0',
      name: '3-Qubit GHZ State',
      qubits: 3,
      classicalBits: 3,
      gates: [
        { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
        { id: 'g1', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
        { id: 'g2', type: 'CX', controls: [1], targets: [2], stepIndex: 2 },
      ],
    },
    practicalApplications: [
      'Quantum Secret Sharing',
      'Clock Synchronization Protocols',
      'Quantum Error Detection Codes',
    ],
  },
  {
    id: 'deutsch_jozsa',
    title: 'Deutsch-Jozsa Algorithm',
    category: 'Beginner',
    difficulty: '★★☆',
    summary: 'Determines whether an unknown boolean oracle is Constant (all 0 or all 1) or Balanced (equal 0s and 1s) in a single query.',
    problemStatement:
      'Given a black-box oracle function f: {0,1}ⁿ → {0,1} that is guaranteed to be either constant (returns same bit for all inputs) or balanced (returns 1 for exactly half the inputs), determine its category.',
    intuition:
      'Quantum parallelism evaluates all inputs simultaneously. Phase kickback encodes the function output into quantum phases. Interference cancels out all amplitude on |0...0⟩ if balanced, or concentrates 100% on |0...0⟩ if constant.',
    mathExplanation:
      '|ψ_final⟩ = 1/2ⁿ ∑_{x,y} (-1)^{x·y + f(x)} |y⟩\nFor Constant f: Amplitude of |0...0⟩ is ±1 (100% probability).\nFor Balanced f: Amplitude of |0...0⟩ is 1/2ⁿ ∑ (-1)^{f(x)} = 0 (0% probability).',
    quantumSpeedup: 'Exponential Speedup: O(1) query vs O(2ⁿ⁻¹ + 1) classical queries in the worst case.',
    classicalComplexity: 'O(2ⁿ⁻¹ + 1) evaluations required to guarantee determination with certainty',
    quantumComplexity: 'O(1) exact query with deterministic certainty',
    defaultQubits: 3,
    circuitIR: {
      version: '1.0',
      name: 'Deutsch-Jozsa (Balanced Oracle)',
      qubits: 3,
      classicalBits: 2,
      gates: [
        { id: 'g0', type: 'X', targets: [2], stepIndex: 0 }, // ancilla |1>
        { id: 'g1', type: 'H', targets: [0], stepIndex: 1 },
        { id: 'g2', type: 'H', targets: [1], stepIndex: 1 },
        { id: 'g3', type: 'H', targets: [2], stepIndex: 1 }, // ancilla |->
        // Balanced Oracle: f(x) = x0 ^ x1
        { id: 'g4', type: 'CX', controls: [0], targets: [2], stepIndex: 2 },
        { id: 'g5', type: 'CX', controls: [1], targets: [2], stepIndex: 3 },
        // Final Hadamards
        { id: 'g6', type: 'H', targets: [0], stepIndex: 4 },
        { id: 'g7', type: 'H', targets: [1], stepIndex: 4 },
        { id: 'g8', type: 'M', targets: [0], stepIndex: 5 },
        { id: 'g9', type: 'M', targets: [1], stepIndex: 5 },
      ],
    },
    practicalApplications: [
      'Exact quantum query complexity foundation',
      'Demonstration of quantum supremacy over deterministic classical oracles',
    ],
  },
  {
    id: 'bernstein_vazirani',
    title: 'Bernstein-Vazirani Algorithm',
    category: 'Intermediate',
    difficulty: '★★☆',
    summary: 'Finds a hidden n-bit secret string s with a single quantum oracle evaluation.',
    problemStatement:
      'Given an oracle computing the inner product f(x) = s · x = s₀x₀ ⊕ s₁x₁ ⊕ ... ⊕ sₙ₋₁xₙ₋₁ mod 2, discover the secret string s ∈ {0,1}ⁿ.',
    intuition:
      'While a classical computer must query the oracle n times with basis vectors eᵢ = (00..1..00) to find each bit of s, the quantum algorithm queries all superpositions once. Phase kickback directly writes the bitstring s into the phase of the register, decoded into measurement by Hadamards.',
    mathExplanation:
      'H^{⊗n} ∑_x (-1)^{s·x} |x⟩ = |s⟩\nMeasuring the input register yields the exact secret bitstring s with 100% probability.',
    quantumSpeedup: 'Polynomial Speedup: 1 quantum query vs n classical queries.',
    classicalComplexity: 'O(n) oracle evaluations',
    quantumComplexity: 'O(1) single oracle evaluation',
    defaultQubits: 3,
    circuitIR: {
      version: '1.0',
      name: 'Bernstein-Vazirani (Secret s = "11")',
      qubits: 3,
      classicalBits: 2,
      gates: [
        { id: 'g0', type: 'X', targets: [2], stepIndex: 0 },
        { id: 'g1', type: 'H', targets: [0], stepIndex: 1 },
        { id: 'g2', type: 'H', targets: [1], stepIndex: 1 },
        { id: 'g3', type: 'H', targets: [2], stepIndex: 1 },
        // Oracle for s = 11 (CNOT on q0->q2 and q1->q2)
        { id: 'g4', type: 'CX', controls: [0], targets: [2], stepIndex: 2 },
        { id: 'g5', type: 'CX', controls: [1], targets: [2], stepIndex: 3 },
        // Decode
        { id: 'g6', type: 'H', targets: [0], stepIndex: 4 },
        { id: 'g7', type: 'H', targets: [1], stepIndex: 4 },
      ],
    },
    practicalApplications: [
      'Subroutine in Shor’s algorithm and quantum learning theory',
      'Database secret-key extraction',
    ],
  },
  {
    id: 'quantum_teleportation',
    title: 'Quantum Teleportation Protocol',
    category: 'Intermediate',
    difficulty: '★★☆',
    summary: 'Transfers an arbitrary unknown single-qubit quantum state |ψ⟩ from Alice to Bob using entanglement and 2 classical bits.',
    problemStatement:
      'Transmit unknown state |ψ⟩ = α|0⟩ + β|1⟩ from Alice (q0) to Bob (q2) without physically sending the qubit itself or violating the No-Cloning theorem.',
    intuition:
      'Alice and Bob share an entangled Bell pair (q1 and q2). Alice performs a Bell-state measurement on her unknown qubit (q0) and half the Bell pair (q1). Depending on her 2-bit classical measurement outcome (00, 01, 10, 11), Bob applies a corresponding Pauli correction (I, X, Z, or ZX) to q2, perfectly reconstructing |ψ⟩.',
    mathExplanation:
      '|ψ⟩_{Total} = (α|0⟩ + β|1⟩) ⊗ 1/√2(|00⟩ + |11⟩)_{12}\n= 1/2 [ |Φ⁺⟩(α|0⟩+β|1⟩) + |Φ⁻⟩(α|0⟩-β|1⟩) + |Ψ⁺⟩(β|0⟩+α|1⟩) + |Ψ⁻⟩(-β|0⟩+α|1⟩) ]',
    quantumSpeedup: 'Enables disembodied quantum state transfer across arbitrary distances.',
    classicalComplexity: 'Impossible to transfer unknown quantum state with finite classical bits due to continuous degrees of freedom (α, β)',
    quantumComplexity: '1 entangled Bell pair + 2 classical bits (Exact fidelity 1.0)',
    defaultQubits: 3,
    circuitIR: {
      version: '1.0',
      name: 'Quantum Teleportation of State |1⟩',
      qubits: 3,
      classicalBits: 2,
      gates: [
        // Prepare arbitrary state on q0 (here we flip to |1>)
        { id: 'g0', type: 'X', targets: [0], stepIndex: 0 },
        // Create Bell pair between q1 and q2
        { id: 'g1', type: 'H', targets: [1], stepIndex: 1 },
        { id: 'g2', type: 'CX', controls: [1], targets: [2], stepIndex: 2 },
        { id: 'g3', type: 'Barrier', targets: [0, 1, 2], stepIndex: 3 },
        // Alice Bell measurement on q0, q1
        { id: 'g4', type: 'CX', controls: [0], targets: [1], stepIndex: 4 },
        { id: 'g5', type: 'H', targets: [0], stepIndex: 5 },
        // Classical correction (Bob applies X if q1=1, Z if q0=1)
        { id: 'g6', type: 'CX', controls: [1], targets: [2], stepIndex: 6 },
        { id: 'g7', type: 'CZ', controls: [0], targets: [2], stepIndex: 7 },
      ],
    },
    practicalApplications: [
      'Quantum Internet & Repeater Networks',
      'Distributed Quantum Computing',
      'Fault-Tolerant Gate Teleportation',
    ],
  },
  {
    id: 'superdense_coding',
    title: 'Superdense Coding',
    category: 'Intermediate',
    difficulty: '★★☆',
    summary: 'Transmits two classical bits of information using only a single transmitted qubit and shared entanglement.',
    problemStatement:
      'Transmit 2 classical bits (00, 01, 10, or 11) from Alice to Bob by physically transporting only 1 physical qubit.',
    intuition:
      'Alice and Bob share a Bell pair. Alice applies one of four local unitary operations {I, X, Z, ZX} to her qubit depending on the 2-bit message, mapping the global state to one of the 4 orthogonal Bell states. Bob performs a Bell measurement on both qubits, distinguishing the 4 states with 100% accuracy.',
    mathExplanation:
      '00 → (I ⊗ I)|Φ⁺⟩ = |Φ⁺⟩\n01 → (X ⊗ I)|Φ⁺⟩ = |Ψ⁺⟩\n10 → (Z ⊗ I)|Φ⁺⟩ = |Φ⁻⟩\n11 → (iY ⊗ I)|Φ⁺⟩ = |Ψ⁻⟩',
    quantumSpeedup: 'Doubles classical communication capacity per transmitted physical carrier.',
    classicalComplexity: '1 physical bit can convey at most 1 bit of information (Holevo’s bound)',
    quantumComplexity: '1 transmitted qubit conveys 2 classical bits',
    defaultQubits: 2,
    circuitIR: {
      version: '1.0',
      name: 'Superdense Coding (Sending "11")',
      qubits: 2,
      classicalBits: 2,
      gates: [
        // Step 1: Bell pair generation
        { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
        { id: 'g1', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
        { id: 'g2', type: 'Barrier', targets: [0, 1], stepIndex: 2 },
        // Step 2: Alice encodes message "11" (Applies Z then X)
        { id: 'g3', type: 'Z', targets: [0], stepIndex: 3 },
        { id: 'g4', type: 'X', targets: [0], stepIndex: 4 },
        { id: 'g5', type: 'Barrier', targets: [0, 1], stepIndex: 5 },
        // Step 3: Bob decodes via Bell Measurement
        { id: 'g6', type: 'CX', controls: [0], targets: [1], stepIndex: 6 },
        { id: 'g7', type: 'H', targets: [0], stepIndex: 7 },
      ],
    },
    practicalApplications: [
      'High-throughput Quantum Communication Channels',
      'Entanglement-assisted Classical Capacity',
    ],
  },
  {
    id: 'grover_search',
    title: 'Grover’s Quantum Search Algorithm (2-Qubit Target |11⟩)',
    category: 'Intermediate',
    difficulty: '★★★',
    summary: 'Finds a target item in an unsorted database of N items with quadratic speedup O(√N).',
    problemStatement:
      'Given an unstructured search space of N = 2ⁿ elements with a marked element ω, find ω in O(√N) oracle queries.',
    intuition:
      'Grover search rotates the statevector in the 2D plane spanned by the target state |ω⟩ and the uniform superposition |s⟩. Each iteration consists of: 1) Phase Oracle (flips the sign of |ω⟩), 2) Grover Diffusion Operator (inverts all amplitudes about the average mean), boosting |ω⟩ amplitude to ~100%.',
    mathExplanation:
      'Grover Operator: G = (2|s⟩⟨s| - I) O_ω\nFor N=4 (2 qubits): Exactly 1 iteration achieves 100% probability of measuring |11⟩.',
    quantumSpeedup: 'Quadratic Speedup: O(√N) vs Classical O(N) evaluations.',
    classicalComplexity: 'O(N) queries (average N/2 queries on unstructured data)',
    quantumComplexity: 'O(√N) queries (π/4 √N optimal iterations)',
    defaultQubits: 2,
    circuitIR: {
      version: '1.0',
      name: 'Grover’s Search (Target |11⟩)',
      qubits: 2,
      classicalBits: 2,
      gates: [
        // Uniform Superposition |s>
        { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
        { id: 'g1', type: 'H', targets: [1], stepIndex: 0 },
        // Phase Oracle for |11> (Controlled-Z)
        { id: 'g2', type: 'CZ', controls: [0], targets: [1], stepIndex: 1 },
        // Diffusion Operator (Inversion about mean: H -> X -> CZ -> X -> H)
        { id: 'g3', type: 'H', targets: [0], stepIndex: 2 },
        { id: 'g4', type: 'H', targets: [1], stepIndex: 2 },
        { id: 'g5', type: 'X', targets: [0], stepIndex: 3 },
        { id: 'g6', type: 'X', targets: [1], stepIndex: 3 },
        { id: 'g7', type: 'CZ', controls: [0], targets: [1], stepIndex: 4 },
        { id: 'g8', type: 'X', targets: [0], stepIndex: 5 },
        { id: 'g9', type: 'X', targets: [1], stepIndex: 5 },
        { id: 'g10', type: 'H', targets: [0], stepIndex: 6 },
        { id: 'g11', type: 'H', targets: [1], stepIndex: 6 },
      ],
    },
    practicalApplications: [
      'Unstructured Database Lookup',
      'Boolean Satisfiability (SAT) Solvers',
      'Collision and Pre-image Attacks in Cryptography',
      'Constraint Satisfaction Optimization',
    ],
  },
  {
    id: 'qft_3qubit',
    title: 'Quantum Fourier Transform (QFT - 3 Qubit)',
    category: 'Advanced',
    difficulty: '★★★',
    summary: 'The quantum analogue of the discrete Fourier transform; core engine of Shor’s algorithm and Phase Estimation.',
    problemStatement:
      'Transform quantum state from computational basis |j⟩ to frequency Fourier basis 1/√N ∑_k e^{2πi jk / N} |k⟩ in polynomial time.',
    intuition:
      'Performs phase factorization across all qubits using Hadamards and Controlled Phase Rotation gates (S and T gates), followed by SWAP operations to reverse the bit order.',
    mathExplanation:
      '|j₁j₂...jₙ⟩ → 1/√2ⁿ (|0⟩ + e^{2πi 0.jₙ}|1⟩) ⊗ ... ⊗ (|0⟩ + e^{2πi 0.j₁j₂...jₙ}|1⟩)',
    quantumSpeedup: 'Exponential Speedup: O(n²) quantum gates vs O(n 2ⁿ) classical Fast Fourier Transform (FFT).',
    classicalComplexity: 'O(N log N) = O(n 2ⁿ) operations for N = 2ⁿ vector',
    quantumComplexity: 'O(n²) = O((log N)²) quantum gates',
    defaultQubits: 3,
    circuitIR: {
      version: '1.0',
      name: '3-Qubit Quantum Fourier Transform',
      qubits: 3,
      classicalBits: 3,
      gates: [
        // Qubit 0
        { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
        { id: 'g1', type: 'S', targets: [0], params: { theta: Math.PI / 2 }, stepIndex: 1 },
        { id: 'g2', type: 'T', targets: [0], params: { theta: Math.PI / 4 }, stepIndex: 2 },
        // Qubit 1
        { id: 'g3', type: 'H', targets: [1], stepIndex: 3 },
        { id: 'g4', type: 'S', targets: [1], params: { theta: Math.PI / 2 }, stepIndex: 4 },
        // Qubit 2
        { id: 'g5', type: 'H', targets: [2], stepIndex: 5 },
        // Reversal SWAP
        { id: 'g6', type: 'SWAP', targets: [0, 2], stepIndex: 6 },
      ],
    },
    practicalApplications: [
      'Shor’s Factoring Algorithm',
      'Quantum Phase Estimation (QPE)',
      'Quantum Period Finding',
      'Solving Discrete Logarithms',
    ],
  },
  {
    id: 'vqe_ansatz',
    title: 'Variational Quantum Eigensolver (VQE Ansatz)',
    category: 'Advanced',
    difficulty: '★★★',
    summary: 'Hybrid quantum-classical algorithm that computes the ground state molecular energy of chemical Hamiltonians.',
    problemStatement:
      'Find the lowest eigenvalue (ground state energy E₀) of Hamiltonian H = ⟨ψ(θ)|H|ψ(θ)⟩ using a parameterized ansatz circuit.',
    intuition:
      'A quantum computer prepares trial wavefunction |ψ(θ)⟩ with rotation parameter θ and measures energy expectation values. A classical optimizer updates θ iteratively until energy E(θ) converges to the Rayleigh-Ritz minimum.',
    mathExplanation:
      'E(θ) = ⟨ψ(θ)|H|ψ(θ)⟩ ≥ E₀ (Variational Principle)\nAnsatz: |ψ(θ)⟩ = CNOT · (Ry(θ) ⊗ I) · (H ⊗ H)|00⟩',
    quantumSpeedup: 'Enables polynomial-time simulation of strongly correlated quantum chemistry systems.',
    classicalComplexity: 'Exponentially hard O(2ⁿ) configuration interaction matrix diagonalization',
    quantumComplexity: 'Polynomial O(n⁴) scaling on noisy intermediate-scale quantum (NISQ) devices',
    defaultQubits: 2,
    circuitIR: {
      version: '1.0',
      name: 'VQE 2-Qubit Molecular Ansatz',
      qubits: 2,
      classicalBits: 2,
      gates: [
        { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
        { id: 'g1', type: 'H', targets: [1], stepIndex: 0 },
        { id: 'g2', type: 'Ry', targets: [0], params: { theta: 1.25 }, stepIndex: 1 },
        { id: 'g3', type: 'CX', controls: [0], targets: [1], stepIndex: 2 },
        { id: 'g4', type: 'Rz', targets: [1], params: { theta: 0.785 }, stepIndex: 3 },
      ],
    },
    practicalApplications: [
      'Molecular Ground State Energy & Reaction Pathways (H₂, LiH, FeMoco)',
      'High-Temperature Superconductivity Simulation',
      'Drug Discovery and Polymer Design',
    ],
  },
  {
    id: 'qaoa_maxcut',
    title: 'Quantum Approximate Optimization Algorithm (QAOA Max-Cut)',
    category: 'Advanced',
    difficulty: '★★★',
    summary: 'Solves NP-hard combinatorial optimization problems such as Graph Max-Cut on NISQ hardware.',
    problemStatement:
      'Partition the vertices of a graph into two sets such that the number of cut edges between them is maximized.',
    intuition:
      'Applies alternating unitary operators: the Cost Hamiltonian U(C, γ) = e^{-iγ C} encodes the problem graph edges, and the Mixer Hamiltonian U(B, β) = e^{-iβ ∑ X_i} explores graph cut combinations.',
    mathExplanation:
      '|γ, β⟩ = e^{-iβ B} e^{-iγ C} |+⟩^{⊗n}\nCost Hamiltonian for edge (u,v): H_{uv} = 1/2(I - Z_u Z_v)',
    quantumSpeedup: 'Near-optimal approximation ratio for hard NP-complete combinatorial graphs.',
    classicalComplexity: 'NP-Hard (Exact Max-Cut is NP-complete, best classical approximation ratio 0.878 via Goemans-Williamson)',
    quantumComplexity: 'Tunable depth p achieves arbitrarily close approximation to global optimum',
    defaultQubits: 3,
    circuitIR: {
      version: '1.0',
      name: 'QAOA Max-Cut (3-Node Triangle Graph)',
      qubits: 3,
      classicalBits: 3,
      gates: [
        // Initial superposition
        { id: 'g0', type: 'H', targets: [0], stepIndex: 0 },
        { id: 'g1', type: 'H', targets: [1], stepIndex: 0 },
        { id: 'g2', type: 'H', targets: [2], stepIndex: 0 },
        // Problem Hamiltonian (ZZ interactions for edges (0,1), (1,2), (0,2))
        { id: 'g3', type: 'CX', controls: [0], targets: [1], stepIndex: 1 },
        { id: 'g4', type: 'Rz', targets: [1], params: { theta: 1.05 }, stepIndex: 2 },
        { id: 'g5', type: 'CX', controls: [0], targets: [1], stepIndex: 3 },
        { id: 'g6', type: 'CX', controls: [1], targets: [2], stepIndex: 4 },
        { id: 'g7', type: 'Rz', targets: [2], params: { theta: 1.05 }, stepIndex: 5 },
        { id: 'g8', type: 'CX', controls: [1], targets: [2], stepIndex: 6 },
        // Mixer Hamiltonian (Rx on all qubits)
        { id: 'g9', type: 'Rx', targets: [0], params: { theta: 0.8 }, stepIndex: 7 },
        { id: 'g10', type: 'Rx', targets: [1], params: { theta: 0.8 }, stepIndex: 7 },
        { id: 'g11', type: 'Rx', targets: [2], params: { theta: 0.8 }, stepIndex: 7 },
      ],
    },
    practicalApplications: [
      'Portfolio Optimization & Financial Arbitrage',
      'Logistics & Vehicle Routing',
      'Circuit Layout & Chip Placement',
    ],
  },
];
