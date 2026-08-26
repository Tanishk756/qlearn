/**
 * Q-Learn Nexus - Comprehensive Quantum Curriculum & Interactive Checkpoints
 * @license Apache-2.0
 */

import { CourseModule } from '../types/quantum';

export const COURSE_MODULES: CourseModule[] = [
  {
    id: 'module_1_foundations',
    number: 1,
    title: 'Foundations of Quantum Information & Qubits',
    description: 'Understand how qubits transcend classical binary bits through linear superposition and the geometry of the Bloch sphere.',
    iconName: 'Atom',
    level: 'Beginner',
    lessons: [
      {
        id: 'lesson_1_1',
        title: 'Classical Bits vs. Quantum Bits',
        readTime: '4 min',
        summary: 'Explore the fundamental mathematical difference between deterministic 0/1 bits and continuous complex 2-state vectors.',
        contentMarkdown: `A classical bit is strictly binary: it exists deterministically in state 0 or state 1.

A **qubit** (quantum bit) is a two-level quantum mechanical system whose state $|\psi\rangle$ is a linear superposition of computational basis states $|0\rangle$ and $|1\rangle$:

$$|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle$$

Where $\\alpha, \\beta \\in \\mathbb{C}$ are complex probability amplitudes satisfying the normalization constraint:

$$|\\alpha|^2 + |\\beta|^2 = 1$$

Here, $|\\alpha|^2$ represents the probability of measuring the qubit in state $|0\\rangle$, and $|\\beta|^2$ represents the probability of measuring state $|1\\rangle$.`,
        mathFormula: '|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle, \\quad |\\alpha|^2 + |\\beta|^2 = 1',
        quiz: [
          {
            id: 'q1_1',
            question: 'If a qubit is in state |ψ⟩ = (1/2)|0⟩ + (√3/2)|1⟩, what is the probability of measuring |1⟩?',
            explanation: 'According to the Born rule, P(1) = |β|² = (√3/2)² = 3/4 = 0.75 (75%).',
            options: ['25% (0.25)', '50% (0.50)', '75% (0.75)', '86.6% (0.866)'],
            correctAnswer: 2,
            conceptBadge: 'Born Rule Probability',
          },
          {
            id: 'q1_2',
            question: 'Which of the following describes the physical state of an unmeasured qubit in superposition (|0⟩ + |1⟩)/√2?',
            explanation: 'The qubit genuinely exists in a simultaneous coherent superposition state, not an unknown classical probability until measured.',
            options: [
              'It is secretly 0 or 1, we just do not know yet.',
              'It is in a physical superposition of both eigenstates with definite relative phase.',
              'It alternates extremely fast between 0 and 1.',
              'It has zero energy.',
            ],
            correctAnswer: 1,
            conceptBadge: 'Quantum Superposition',
          },
        ],
      },
      {
        id: 'lesson_1_2',
        title: 'The Bloch Sphere Representation',
        readTime: '6 min',
        summary: 'Visualize pure single-qubit quantum states as points on the surface of a unit sphere in 3D Euclidean space.',
        contentMarkdown: `Because the global phase $e^{i\\gamma}$ of a quantum state is physically unobservable, any pure single-qubit state can be uniquely parameterized by two spherical angles $\\theta \\in [0, \\pi]$ and $\\phi \\in [0, 2\\pi)$:

$$|\\psi\\rangle = \\cos\\left(\\frac{\\theta}{2}\\right)|0\\rangle + e^{i\\phi}\\sin\\left(\\frac{\\theta}{2}\\right)|1\\rangle$$

- **North Pole** ($\\theta = 0$): Basis state $|0\\rangle$
- **South Pole** ($\\theta = \\pi$): Basis state $|1\\rangle$
- **Equator** ($\\theta = \\pi/2$): Superposition states such as $|+\\rangle = (|0\\rangle + |1\\rangle)/\\sqrt{2}$ (where $\\phi=0$) and $|-\\rangle = (|0\\rangle - |1\\rangle)/\\sqrt{2}$ (where $\\phi=\\pi$).`,
        mathFormula: '\\vec{r} = (\\sin\\theta\\cos\\phi, \\; \\sin\\theta\\sin\\phi, \\; \\cos\\theta)',
        quiz: [
          {
            id: 'q1_3',
            question: 'Where is the state |+⟩ = (|0⟩ + |1⟩)/√2 located on the Bloch sphere?',
            explanation: '|+⟩ has θ = π/2 and φ = 0, which corresponds to the point (x=1, y=0, z=0) on the positive X-axis.',
            options: ['North Pole (Z = +1)', 'South Pole (Z = -1)', 'Positive X-axis (X = +1)', 'Positive Y-axis (Y = +1)'],
            correctAnswer: 2,
            conceptBadge: 'Bloch Sphere Geometry',
          },
        ],
      },
    ],
  },
  {
    id: 'module_2_gates',
    number: 2,
    title: 'Quantum Logic Gates & Unitary Dynamics',
    description: 'Master single-qubit and multi-qubit unitary operators, reversible computation, and rotation operations.',
    iconName: 'Cpu',
    level: 'Beginner',
    lessons: [
      {
        id: 'lesson_2_1',
        title: 'Pauli Gates & The Hadamard Transformation',
        readTime: '5 min',
        summary: 'Learn the primary building blocks of quantum circuits: X (NOT), Y, Z (Phase Flip), and H (Superposition Creator).',
        contentMarkdown: `Quantum operations must preserve total probability ($100\\%$). Therefore, all quantum gates are represented by **unitary matrices** $U$ satisfying $U^\\dagger U = I$.

1. **Pauli-X (Quantum NOT)**: Flips $|0\\rangle \\leftrightarrow |1\\rangle$.
$$X = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}$$

2. **Pauli-Z (Phase Flip)**: Leaves $|0\\rangle$ unchanged and negates $|1\\rangle \\rightarrow -|1\\rangle$.
$$Z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$$

3. **Hadamard Gate ($H$)**: Maps computational basis states to equal superpositions.
$$H = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 & 1 \\\\ 1 & -1 \\end{pmatrix}$$
$$H|0\\rangle = |+\\rangle, \\quad H|1\\rangle = |-\\rangle$$`,
        mathFormula: 'H = \\frac{1}{\\sqrt{2}}(X + Z), \\quad H^2 = I',
        quiz: [
          {
            id: 'q2_1',
            question: 'What is the outcome of applying two consecutive Hadamard gates (H · H) to state |0⟩?',
            explanation: 'H is self-inverse (H = H† = H⁻¹), so H · H = I (Identity). The state returns to |0⟩.',
            options: ['|1⟩', '|0⟩', '(|0⟩ + |1⟩)/√2', 'Undefined / Measurement collapse'],
            correctAnswer: 1,
            conceptBadge: 'Self-Inverse Unitaries',
          },
        ],
      },
      {
        id: 'lesson_2_2',
        title: 'Arbitrary Rotations & Phase Gates (S, T, Rx, Ry, Rz)',
        readTime: '5 min',
        summary: 'Discover continuous rotations around the X, Y, and Z axes of the Bloch sphere.',
        contentMarkdown: `Continuous single-qubit rotations are generated by exponentiating the Pauli operators:

$$R_x(\\theta) = e^{-i\\theta X/2} = \\cos(\\theta/2)I - i\\sin(\\theta/2)X$$
$$R_y(\\theta) = e^{-i\\theta Y/2} = \\cos(\\theta/2)I - i\\sin(\\theta/2)Y$$
$$R_z(\\theta) = e^{-i\\theta Z/2} = \\begin{pmatrix} e^{-i\\theta/2} & 0 \\\\ 0 & e^{i\\theta/2} \\end{pmatrix}$$

The $S$ gate is a rotation by $\\pi/2$ around Z ($S = R_z(\\pi/2)$ up to global phase), and the $T$ gate is the $\\pi/4$ rotation ($T = \\sqrt{S}$). The set $\\{H, T, \\text{CNOT}\\}$ is approximately universal for quantum computing.`,
        mathFormula: 'T = \\begin{pmatrix} 1 & 0 \\\\ 0 & e^{i\\pi/4} \\end{pmatrix}, \\quad T^4 = Z',
        quiz: [
          {
            id: 'q2_2',
            question: 'How many T gates applied consecutively are equal to a single Pauli-Z gate?',
            explanation: 'Each T gate adds a phase of π/4. Applying 4 T gates gives a phase of 4 × (π/4) = π, which corresponds to the Z gate.',
            options: ['2', '4', '8', '16'],
            correctAnswer: 1,
            conceptBadge: 'Phase Gates',
          },
        ],
      },
    ],
  },
  {
    id: 'module_3_entanglement',
    number: 3,
    title: 'Multi-Qubit Systems & Entanglement',
    description: 'Explore the tensor product of Hilbert spaces, the CNOT gate, Bell states, and the No-Cloning Theorem.',
    iconName: 'Network',
    level: 'Intermediate',
    lessons: [
      {
        id: 'lesson_3_1',
        title: 'Controlled-NOT (CNOT) & Bell States',
        readTime: '6 min',
        summary: 'Learn how conditional multi-qubit interactions generate non-local quantum correlations.',
        contentMarkdown: `A multi-qubit register of $n$ qubits lives in a $2^n$-dimensional Hilbert space $\\mathcal{H} = \\mathcal{H}_1 \\otimes \\mathcal{H}_2 \\otimes \\dots \\otimes \\mathcal{H}_n$.

The **CNOT (CX)** gate applies a Pauli-X gate to the target qubit if and only if the control qubit is $|1\\rangle$:

$$\\text{CNOT} = \\begin{pmatrix} 1 & 0 & 0 & 0 \\\\ 0 & 1 & 0 & 0 \\\\ 0 & 0 & 0 & 1 \\\\ 0 & 0 & 1 & 0 \\end{pmatrix}$$

Applying a Hadamard to qubit 0 followed by CNOT(0 $\\rightarrow$ 1) transforms $|00\\rangle$ into the maximally entangled **Bell state**:

$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$

This state cannot be factored into independent product states $(a|0\\rangle + b|1\\rangle) \\otimes (c|0\\rangle + d|1\\rangle)$.`,
        mathFormula: '|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}, \\quad |\\Psi^-\\rangle = \\frac{|01\\rangle - |10\\rangle}{\\sqrt{2}}',
        quiz: [
          {
            id: 'q3_1',
            question: 'If two qubits are in the Bell state (|00⟩ + |11⟩)/√2 and you measure the first qubit as 1, what will the second qubit measurement yield?',
            explanation: 'The wavefunction instantaneously collapses to |11⟩, meaning the second qubit is guaranteed to be 1 with 100% certainty.',
            options: ['0 with 50% probability', '1 with 100% certainty', '0 with 100% certainty', 'Random state'],
            correctAnswer: 1,
            conceptBadge: 'Quantum Entanglement Collapse',
          },
        ],
      },
      {
        id: 'lesson_3_2',
        title: 'The No-Cloning Theorem',
        readTime: '4 min',
        summary: 'Understand why unknown quantum states cannot be copied, forming the basis of quantum cryptography.',
        contentMarkdown: `The **No-Cloning Theorem** (Wootters & Zurek, 1982) states that it is physically impossible to create an identical copy of an arbitrary unknown quantum state $|\\psi\\rangle$.

**Proof by contradiction using linearity of quantum mechanics:**
Suppose a unitary operator $U$ copies any state:
$$U(|\\psi\\rangle \\otimes |0\\rangle) = |\\psi\\rangle \\otimes |\\psi\\rangle$$
$$U(|\\phi\\rangle \\otimes |0\\rangle) = |\\phi\\rangle \\otimes |\\phi\\rangle$$

Taking the inner product:
$$\\langle \\psi | \\phi \\rangle = (\\langle \\psi | \\phi \\rangle)^2$$

This equation holds only if $\\langle \\psi | \\phi \\rangle = 0$ (orthogonal) or $\\langle \\psi | \\phi \\rangle = 1$ (identical). Thus, a general quantum copier is mathematically impossible!`,
        mathFormula: 'U(|\\psi\\rangle|0\\rangle) = |\\psi\\rangle|\\psi\\rangle \\implies \\langle\\psi|\\phi\\rangle = \\langle\\psi|\\phi\\rangle^2',
        quiz: [
          {
            id: 'q3_2',
            question: 'Why can classical bits be copied easily whereas quantum states cannot?',
            explanation: 'Classical copying involves non-destructive measurement. Quantum cloning would require a non-linear operator, violating the fundamental linearity and unitarity of quantum mechanics.',
            options: [
              'Classical bits are larger in physical size.',
              'Linearity of unitary quantum operations forbids a universal cloning transformation.',
              'Quantum hardware is too noisy.',
              'Qubits have negative probabilities.',
            ],
            correctAnswer: 1,
            conceptBadge: 'No-Cloning Theorem',
          },
        ],
      },
    ],
  },
  {
    id: 'module_4_algorithms',
    number: 4,
    title: 'Quantum Speedups & Core Algorithms',
    description: 'Explore the theoretical foundations of quantum speedup: Phase kickback, Grover search, and Quantum Fourier Transform.',
    iconName: 'Zap',
    level: 'Advanced',
    lessons: [
      {
        id: 'lesson_4_1',
        title: 'Phase Kickback & Oracle Circuits',
        readTime: '6 min',
        summary: 'Discover the mechanism where an operation on a target qubit changes the phase of the control qubit.',
        contentMarkdown: `**Phase kickback** is the cornerstone of almost all quantum algorithms (Deutsch-Jozsa, Bernstein-Vazirani, Shor, Grover).

When an oracle operator $U_f |x\\rangle |y\\rangle = |x\\rangle |y \\oplus f(x)\\rangle$ acts on a target qubit prepared in the $|-\\rangle = (|0\\rangle - |1\\rangle)/\\sqrt{2}$ eigenstate of the Pauli-X operator:

$$U_f |x\\rangle |-\\rangle = (-1)^{f(x)} |x\\rangle |-\\rangle$$

The eigenvalue $(-1)^{f(x)}$ is "kicked back" into the phase of the control register $|x\\rangle$!`,
        mathFormula: 'U_f |x\\rangle|-\\rangle = (-1)^{f(x)} |x\\rangle|-\\rangle',
        quiz: [
          {
            id: 'q4_1',
            question: 'What state must the ancilla target qubit be prepared in to produce phase kickback with a standard boolean oracle?',
            explanation: 'The state |−⟩ = (|0⟩ − |1⟩)/√2 is an eigenstate of the X gate with eigenvalue −1, enabling (-1)^{f(x)} phase kickback.',
            options: ['|0⟩', '|1⟩', '|−⟩ = (|0⟩ − |1⟩)/√2', '|+⟩ = (|0⟩ + |1⟩)/√2'],
            correctAnswer: 2,
            conceptBadge: 'Phase Kickback',
          },
        ],
      },
      {
        id: 'lesson_4_2',
        title: 'Grover’s Quadratic Search & Amplitude Amplification',
        readTime: '7 min',
        summary: 'How constructive and destructive wave interference amplifies the target state probability to ~100%.',
        contentMarkdown: `Grover's algorithm searches an unsorted space of $N = 2^n$ items in $O(\\sqrt{N})$ queries instead of $O(N)$ classical queries.

Each iteration consists of two geometric reflection operations:
1. **Phase Oracle $R_\\omega$**: Inverts the sign of target item $|\\omega\\rangle$:
$$R_\\omega = I - 2|\\omega\\rangle\\langle\\omega|$$
2. **Diffusion Operator $D$**: Inverts all state amplitudes about their average mean:
$$D = 2|s\\rangle\\langle s| - I$$

Applying the Grover operator $\\mathcal{G} = D R_\\omega$ exactly $\\approx \\frac{\\pi}{4}\\sqrt{N}$ times rotates the quantum state vector directly onto the marked target state $|\\omega\\rangle$.`,
        mathFormula: '\\mathcal{G} = (2|s\\rangle\\langle s| - I)(I - 2|\\omega\\rangle\\langle\\omega|), \\quad k \\approx \\frac{\\pi}{4}\\sqrt{N}',
        quiz: [
          {
            id: 'q4_2',
            question: 'How many Grover iterations are needed to find a marked item with 100% probability in a 2-qubit (N=4) database?',
            explanation: 'For N = 4 (2 qubits), exactly 1 Grover iteration rotates the uniform state (|00⟩+|01⟩+|10⟩+|11⟩)/2 directly to the target state with 100% probability.',
            options: ['1 iteration', '2 iterations', '4 iterations', '8 iterations'],
            correctAnswer: 0,
            conceptBadge: 'Grover Amplification',
          },
        ],
      },
    ],
  },
];
