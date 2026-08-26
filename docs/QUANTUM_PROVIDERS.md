# Q-Learn Nexus — Quantum Provider Integration & Diagnostics

## 1. Provider Status Matrix

| Provider ID | Implementation Type | Current Node Status | Target Capabilities |
| :--- | :--- | :--- | :--- |
| `custom_sim` / `nexus_sim` | Pure TypeScript & Python Statevector Engine | **READY** | Real-time statevector manipulation (1-16 qubits), Born rule sampling, Bloch vector extraction |
| `qiskit_aer` | Python SDK Worker Adapter | **READY (Containerized)** | OpenQASM 2.0/3.0, AerSimulator statevector, pulse, noise models |
| `pennylane` | Python SDK Worker Adapter | **READY (Containerized)** | `default.qubit`, quantum gradients, variational quantum circuits |
| `cirq` | Python SDK Worker Adapter | **READY (Containerized)** | `cirq.Simulator`, grid qubit topologies, noise channels |
| `ibm_quantum` | Real Hardware API Integration | **NOT CONFIGURED** | IBM Quantum Runtime Cloud API (`IBM_QUANTUM_TOKEN` required) |
| `aws_braket` | Real Hardware / Managed Simulators | **NOT CONFIGURED** | Amazon Braket SV1, DM1, Rigetti/IonQ (`AWS_*` credentials required) |
| `azure_quantum` | Real Hardware / Managed Simulators | **NOT CONFIGURED** | Azure Quantum Workspace (Quantinuum, IonQ) |

---

## 2. Worker Execution Flow

1. **Local Deterministic Simulation**:
   Used for interactive visual canvas, instant tutorial exercises, and state visualization. Handled locally via `simulateServerCircuit` (TypeScript) and `run_custom_simulation` (Python).

2. **Asynchronous Batch SDK Simulation**:
   Routed to the `quantum-worker` container runtime via `SimulationQueue` or internal HTTP dispatch.

3. **External Cloud Hardware Providers**:
   Configured dynamically when production cloud API credentials are provided in `.env`. If credentials are absent, provider health diagnostics explicitly return status `"NOT CONFIGURED"`.
