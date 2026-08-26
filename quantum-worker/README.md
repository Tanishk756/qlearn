# Q-Learn Nexus — Quantum Execution Worker Microservice

## Overview
The Quantum Worker is an isolated, unprivileged Python runtime responsible for executing quantum circuits across Qiskit Aer, PennyLane, Cirq, and pure statevector engines.

## Architectural Isolation Boundaries
1. **Network Isolation**: The worker is intended for deployment within an internal VPC or container network without public internet routing.
2. **Secret Isolation**: The worker receives circuit payloads and parameters only; no database URLs, Redis keys, or LLM secrets are injected.
3. **Execution User**: Runs as unprivileged UID `10001` (`quantum`) with dropped Linux capabilities and read-only container rootfs.
4. **Resource Constraints**:
   - Max Statevector Qubits: `16`
   - Max Density Matrix Qubits: `8`
   - Max Gates: `500`
   - Max Shots: `100,000`
   - Execution Timeout: `5000ms`

## Local Development & Testing
```bash
# 1. Install pinned requirements
pip install -r requirements.txt

# 2. Run unit tests
python3 -m unittest discover -s tests

# 3. Start local worker
python3 -m uvicorn app.main:app --port 8080 --reload
```
