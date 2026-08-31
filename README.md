# Q-Learn Nexus

> **A Collaborative Quantum Computing Learning, Experimentation, Circuit Design, Simulation, Research, and Project Management Platform.**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-336791?logo=postgresql)](https://www.postgresql.org/)
[![Google Cloud Run](https://img.shields.io/badge/Google_Cloud-Run_%26_Cloud_SQL-4285F4?logo=googlecloud)](https://cloud.google.com/run)

**Author:** Tanishk Singhal ([@Tanishk756](https://github.com/Tanishk756))  
**Repository:** [https://github.com/Tanishk756/qlearn](https://github.com/Tanishk756/qlearn)

---

## 🌌 Overview

**Q-Learn Nexus** is a unified quantum computing platform engineered for students, educators, independent quantum developers, researchers, university laboratories, and enterprise R&D teams.

Unlike isolated toy visualizers or fragmented code snippets, Q-Learn Nexus provides a complete end-to-end scientific workflow:
1. **Interactive Quantum Curriculum**: Master foundational and advanced quantum mechanics (superposition, entanglement, phase kickback, Grover's search, Quantum Fourier Transform, Shor's algorithm, VQE, and QAOA) with interactive code labs and real-time math notation.
2. **Visual & Programmatic Circuit Builder**: Design multi-qubit circuits with an extensible gate architecture (Pauli $X, Y, Z$, Hadamard $H$, Phase $S, T$, Rotations $R_x, R_y, R_z$, Entangling $CX, CZ$, and $SWAP$).
3. **Classical Statevector & Density Matrix Simulator**: Fast, canonical little-endian statevector evolution, measurement sampling, Bloch sphere coordinate calculation, and amplitude visualization.
4. **Reproducible Experiment Management & Version Control**: Track circuit versions, simulation configurations, shot counts, and execution provenance with full rollback and diffing.
5. **Multi-User Collaboration & Fine-Grained RBAC**: Isolated private workspaces, team sharing via cryptographically signed share tokens, and role-based access control.
6. **Authoritative PostgreSQL Persistence**: Zero filesystem fallbacks in production, parameterized Drizzle ORM queries, fail-closed readiness checks, and ACID transactional integrity.

---

## 🏛️ System Architecture

```text
                        ┌─────────────────────────────────────────┐
                        │             Quantum Users               │
                        │ (Students, Researchers, Engineers, Labs)│
                        └────────────────────┬────────────────────┘
                                             │ HTTPS
                                             ▼
                        ┌─────────────────────────────────────────┐
                        │        Modern React 19 Client           │
                        │  (Tailwind CSS, Motion, Bloch Spheres)  │
                        └────────────────────┬────────────────────┘
                                             │ REST API / Session Auth
                                             ▼
                        ┌─────────────────────────────────────────┐
                        │         Cloud Run API Server            │
                        │       (Express + TypeScript Engine)     │
                        ├─────────────────────────────────────────┤
                        │ • Identity & RBAC (Bcrypt, Sessions)    │
                        │ • Project & Circuit Versioning          │
                        │ • Quantum Provider Engine (Sim / Queue) │
                        │ • Audit Logging & Security Monitor      │
                        │ • QASM 2.0 & Qiskit Python Exporters    │
                        └──────────────┬──────────────────┬───────┘
                                       │                  │
                    Fail-Closed Query  │                  │ Ephemeral Worker
                                       ▼                  ▼
                    ┌─────────────────────────┐ ┌───────────────────┐
                    │ PostgreSQL (Cloud SQL)  │ │ Quantum Sandbox   │
                    │   Authoritative State   │ │ (AST Scrubbed     │
                    │  (Drizzle ORM Engine)   │ │  Isolated Engine) │
                    └─────────────────────────┘ └───────────────────┘
```

---

## 🔬 Key Capabilities

### 1. Quantum Circuit Workspace & Extensible Gate Engine
- **Supported Gates**: $X, Y, Z, H, S, T, R_x(\theta), R_y(\theta), R_z(\theta), CX, CZ, SWAP$, and Measurement.
- **Canonical Little-Endian Ordering**: Standard quantum computing convention ($q_0$ is least significant bit: $|q_1 q_0\rangle$).
- **Interoperability**: One-click bidirectional export to **OpenQASM 2.0** and **Qiskit-compatible Python**.

### 2. Statevector Simulation & Bloch Sphere Visualizer
- Multi-qubit statevector calculation with probability distribution histograms.
- Real-time 3D Bloch sphere vector projection $(\theta, \phi)$ for individual qubits in product states.
- Shot-based measurement sampling (100 to 8192 shots) simulating real quantum hardware readouts.

### 3. Experiment Reproducibility & Lineage
- Complete experiment record preserving exact circuit IR, version snapshot, parameters, provider backend, random seeds, and timestamped outcome.
- Version history with linear versioning, notes, and instant restoration.

### 4. Enterprise-Grade Multi-Tenant Isolation
- Complete logical isolation across users and teams.
- Cryptographically signed share tokens (SHA-256) for unlisted project collaborations.
- In-depth audit logging tracking authentication, project mutations, and simulations.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **PostgreSQL**: `v15+` (local instance or Cloud SQL)

### Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Tanishk756/qlearn.git
   cd qlearn
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Set your PostgreSQL connection credentials:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qlearn_nexus
   SESSION_SECRET=your_development_session_secret_key
   ```

4. **Run Database Migrations / Schema Sync**:
   ```bash
   npx drizzle-kit push
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🧪 Testing Suite

Q-Learn Nexus maintains a rigorous test pyramid covering database persistence, multi-tenant isolation, quantum canonical mathematics, AST security, and end-to-end user workflows:

```bash
# Run full automated test suite
npm test
```

### Test Coverage Breakdown
- **Production Persistence**: `tests/production-persistence.test.ts` (Asserts zero filesystem writes and fail-closed database posture).
- **Multi-User Isolation**: `tests/multi-user-isolation.test.ts` (Validates tenant boundaries, IDOR prevention, and session lifecycle).
- **Quantum & Security AST**: `server/src/tests/run_all_tests.ts` (Validates little-endian statevector math, Bell states, GHZ states, AST sandbox isolation, and secret scrubbing).
- **End-to-End PostgreSQL**: `tests/e2e-persistence-verification.ts` (Validates full user registration, bcrypt check, project creation, circuit versioning, and job queue).

---

## 📦 Production Deployment

### Cloud Run & Cloud SQL (Google Cloud)
Build and deploy the self-contained container:

```bash
# Build the production bundle
npm run build

# Start production server
npm start
```

### Docker Container Build
```bash
docker build -t qlearn-nexus:latest .
docker run -p 3000:3000 --env-file .env qlearn-nexus:latest
```

---

## 📖 Documentation Index

- [Architecture Guide](docs/ARCHITECTURE.md) — Detailed system components, data flows, and concurrency.
- [Database Schema & Migrations](docs/DATABASE.md) — Relational schema design, indexes, and fail-closed contracts.
- [Quantum Engine & Conventions](docs/QUANTUM_ENGINE.md) — Mathematics, gate matrices, little-endian ordering, and QASM specifications.
- [API Reference](docs/API.md) — Complete REST API endpoint documentation with schemas and error codes.
- [Security Policy](docs/SECURITY.md) — Sandbox AST inspection, token hashing, CSRF/XSS mitigations, and vulnerability reporting.
- [Deployment Guide](docs/DEPLOYMENT.md) — Cloud Run, Cloud SQL, Secret Manager, and VPC connector configuration.
- [Product Roadmap](docs/ROADMAP.md) — Planned features, quantum hardware provider integrations, and research notebooks.
- [Technical Debt](docs/TECHNICAL_DEBT.md) — Transparent backlog and audit log.

---

## 🛡️ Security & Responsible Disclosure

Please review our [SECURITY.md](SECURITY.md) for vulnerability reporting procedures. All sensitive operations use parameterized SQL, hashed tokens (SHA-256), salted password hashing (Bcrypt), and strictly scrubbed worker environments.

---

## 🤝 Contributing

Contributions from the quantum physics, computer science, and open-source communities are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before submitting Pull Requests.

---

## 📄 License

This project is licensed under the **Apache License 2.0** — see the [LICENSE](LICENSE) file for details.

**Author**: Tanishk Singhal ([@Tanishk756](https://github.com/Tanishk756))
