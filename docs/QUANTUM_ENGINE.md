# Quantum Computing Engine & Mathematical Conventions

**Author:** Tanishk Singhal ([@Tanishk756](https://github.com/Tanishk756))  
**Platform:** Q-Learn Nexus  

---

## 1. Bit Ordering & Conventions

Q-Learn Nexus adheres strictly to the canonical **little-endian** quantum bit ordering adopted by Qiskit, OpenQASM, and IBM Quantum:
- For an $n$-qubit register, qubit $q_0$ represents the **least significant bit** (LSB), and qubit $q_{n-1}$ represents the **most significant bit** (MSB).
- In Dirac notation, basis states are written as:
  $$|q_{n-1} q_{n-2} \dots q_1 q_0\rangle$$
- For example, applying $X$ to $q_0$ on the state $|00\rangle$ produces $|01\rangle$ (index 1), whereas applying $X$ to $q_1$ produces $|10\rangle$ (index 2).

---

## 2. Supported Unitary Quantum Gates

### Single-Qubit Gates

| Gate | Symbol | Unitary Matrix | Description |
| :--- | :---: | :---: | :--- |
| **Pauli-X** | $X$ | $\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$ | Bit-flip ($\pi$ rotation about X-axis) |
| **Pauli-Y** | $Y$ | $\begin{pmatrix} 0 & -i \\ i & 0 \end{pmatrix}$ | Bit & phase-flip ($\pi$ rotation about Y-axis) |
| **Pauli-Z** | $Z$ | $\begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}$ | Phase-flip ($\pi$ rotation about Z-axis) |
| **Hadamard** | $H$ | $\frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$ | Creates equal superposition state |
| **Phase (S)** | $S$ | $\begin{pmatrix} 1 & 0 \\ 0 & i \end{pmatrix}$ | $\pi/2$ phase rotation about Z-axis |
| **$\pi/8$ (T)** | $T$ | $\begin{pmatrix} 1 & 0 \\ 0 & e^{i\pi/4} \end{pmatrix}$ | $\pi/4$ phase rotation about Z-axis |
| **Rotation-X** | $R_x(\theta)$ | $\begin{pmatrix} \cos(\theta/2) & -i\sin(\theta/2) \\ -i\sin(\theta/2) & \cos(\theta/2) \end{pmatrix}$ | Arbitrary angle rotation about X-axis |
| **Rotation-Y** | $R_y(\theta)$ | $\begin{pmatrix} \cos(\theta/2) & -\sin(\theta/2) \\ \sin(\theta/2) & \cos(\theta/2) \end{pmatrix}$ | Arbitrary angle rotation about Y-axis |
| **Rotation-Z** | $R_z(\theta)$ | $\begin{pmatrix} e^{-i\theta/2} & 0 \\ 0 & e^{i\theta/2} \end{pmatrix}$ | Arbitrary angle rotation about Z-axis |

### Multi-Qubit Entangling Gates

| Gate | Symbol | Matrix ($4 \times 4$) | Description |
| :--- | :---: | :---: | :--- |
| **Controlled-NOT** | $CX$ | $\begin{pmatrix} 1 & 0 & 0 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 1 \\ 0 & 0 & 1 & 0 \end{pmatrix}$ | Flips target qubit if control qubit is $\|1\rangle$ |
| **Controlled-Z** | $CZ$ | $\text{diag}(1, 1, 1, -1)$ | Applies phase-flip if both qubits are $\|1\rangle$ |
| **SWAP** | $SWAP$ | $\begin{pmatrix} 1 & 0 & 0 & 0 \\ 0 & 0 & 1 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 1 \end{pmatrix}$ | Exchanges states of two qubits |

---

## 3. Simulation Mathematics & Bloch Sphere

### Statevector Evolution
For a circuit with $N$ steps, the initial state $|\psi_0\rangle = |0\rangle^{\otimes n}$ evolves as:
$$|\psi\rangle = U_N U_{N-1} \dots U_1 |\psi_0\rangle$$

### Bloch Sphere Coordinates
For single qubits in product states $|\psi\rangle = \cos(\theta/2)|0\rangle + e^{i\phi}\sin(\theta/2)|1\rangle$, coordinates $(x,y,z)$ on the Bloch sphere are calculated as:
$$x = \sin\theta\cos\phi, \quad y = \sin\theta\sin\phi, \quad z = \cos\theta$$

---

## 4. Interoperability Exporters

### OpenQASM 2.0
Circuits are serialized into compliant OpenQASM 2.0 text:
```qasm
OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
measure q[0] -> c[0];
measure q[1] -> c[1];
```

### Qiskit Python Export
Circuits export directly to standard executable Qiskit code:
```python
from qiskit import QuantumCircuit

qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])
```
