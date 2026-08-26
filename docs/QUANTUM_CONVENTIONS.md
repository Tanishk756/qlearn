# Q-Learn Nexus — Quantum Conventions & Canonical IR Specification

## 1. Executive Summary

Quantum software frameworks historically exhibit differences in qubit indexing, tensor product ordering, and bitstring representation (e.g. Qiskit versus Cirq vs textbook Dirac notation). To prevent synchronization failures, race conditions, or misinterpretation of quantum measurement probabilities across client, server, and worker microservices, Q-Learn Nexus enforces a single standard: **Canonical Little-Endian Ordering**.

---

## 2. Canonical Qubit Ordering (`CANONICAL_QUBIT_ORDER = 'LITTLE_ENDIAN'`)

### Standard Definition:
- **Bit Indexing**: Qubit $q_0$ corresponds to the least-significant bit ($2^0$), positioned as the **rightmost** character in measurement bitstrings.
- **Register Representation**: For an $n$-qubit register $q_{n-1}, q_{n-2}, \dots, q_1, q_0$, the basis state is written as:
  $$|q_{n-1} q_{n-2} \dots q_1 q_0\rangle$$
- **Integer State Index to Bitstring**:
  $$\text{Index } i = \sum_{k=0}^{n-1} q_k \cdot 2^k$$
  The bit $q_k$ is computed via `(i >> k) & 1`.

### Canonical Verification Table:

| Quantum Circuit Operation | Initial State | Final State Vector | Canonical Bitstring | Probability |
| :--- | :--- | :--- | :--- | :--- |
| $X(q_0)$ on 2 qubits | $\|00\rangle$ | $\|01\rangle$ | `"01"` | 100% |
| $X(q_1)$ on 2 qubits | $\|00\rangle$ | $\|10\rangle$ | `"10"` | 100% |
| $X(q_0) X(q_1)$ | $\|00\rangle$ | $\|11\rangle$ | `"11"` | 100% |
| $H(q_0) \to CX(q_0, q_1)$ | $\|00\rangle$ | $\frac{\|00\rangle + \|11\rangle}{\sqrt{2}}$ | `"00"`: 50%, `"11"`: 50% | 100% total |
| $CX(q_0, q_1)$ applied to $\|01\rangle$ | $\|01\rangle$ | $\|11\rangle$ | `"11"` | 100% |

---

## 3. Standard Gate Matrix Definitions

All matrices are defined in the computational basis $\{|0\rangle, |1\rangle\}$:

- **Pauli-X**: $\begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$
- **Pauli-Y**: $\begin{pmatrix} 0 & -i \\ i & 0 \end{pmatrix}$
- **Pauli-Z**: $\begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}$
- **Hadamard (H)**: $\frac{1}{\sqrt{2}} \begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$
- **Phase (S)**: $\begin{pmatrix} 1 & 0 \\ 0 & i \end{pmatrix}$, **Sdg**: $\begin{pmatrix} 1 & 0 \\ 0 & -i \end{pmatrix}$
- **$\pi/8$ (T)**: $\begin{pmatrix} 1 & 0 \\ 0 & e^{i\pi/4} \end{pmatrix}$, **Tdg**: $\begin{pmatrix} 1 & 0 \\ 0 & e^{-i\pi/4} \end{pmatrix}$
- **Parametric Rotations**:
  - $R_x(\theta) = \begin{pmatrix} \cos(\theta/2) & -i\sin(\theta/2) \\ -i\sin(\theta/2) & \cos(\theta/2) \end{pmatrix}$
  - $R_y(\theta) = \begin{pmatrix} \cos(\theta/2) & -\sin(\theta/2) \\ \sin(\theta/2) & \cos(\theta/2) \end{pmatrix}$
  - $R_z(\phi) = \begin{pmatrix} e^{-i\phi/2} & 0 \\ 0 & e^{i\phi/2} \end{pmatrix}$

---

## 4. Single-Qubit Reduced Density Matrix & Bloch Coordinates

Given a multi-qubit pure statevector $|\psi\rangle = \sum_{i=0}^{2^n - 1} c_i |i\rangle$, the single-qubit reduced density matrix $\rho^{(q)}$ for qubit $q$ is extracted via partial trace:

$$\rho_{00}^{(q)} = \sum_{i, (i \gg q) \& 1 = 0} |c_i|^2, \quad \rho_{11}^{(q)} = \sum_{i, (i \gg q) \& 1 = 1} |c_i|^2$$
$$\rho_{01}^{(q)} = \sum_{i, (i \gg q) \& 1 = 0} c_i \cdot c_{i \mid (1 \ll q)}^*$$

From $\rho^{(q)}$, the Bloch sphere vector $(u_x, u_y, u_z)$ is uniquely computed:
$$u_x = 2 \cdot \text{Re}(\rho_{01}^{(q)})$$
$$u_y = -2 \cdot \text{Im}(\rho_{01}^{(q)})$$
$$u_z = \rho_{00}^{(q)} - \rho_{11}^{(q)}$$
$$\theta = \arccos(u_z / r), \quad \phi = \text{atan2}(u_y, u_x)$$

---

## 5. Circuit IR Schema Specification

The standardized circuit IR JSON transmitted across API endpoints conforms to:

```json
{
  "version": "1.0",
  "name": "Bell State Circuit",
  "qubits": 2,
  "classicalBits": 2,
  "canonicalQubitOrder": "LITTLE_ENDIAN",
  "gates": [
    {
      "id": "gate_1",
      "type": "H",
      "targets": [0],
      "stepIndex": 0
    },
    {
      "id": "gate_2",
      "type": "CX",
      "controls": [0],
      "targets": [1],
      "stepIndex": 1
    }
  ]
}
```
