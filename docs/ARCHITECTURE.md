# Architecture Overview — Q-Learn Nexus

**Author:** Tanishk Singhal ([@Tanishk756](https://github.com/Tanishk756))  
**Repository:** [https://github.com/Tanishk756/qlearn](https://github.com/Tanishk756/qlearn)

---

## 1. High-Level Architecture

Q-Learn Nexus is structured as a cloud-native full-stack application deployed on Google Cloud Run and backed by Cloud SQL (PostgreSQL):

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                               │
│  React 19 (SPA) + Vite 6 + Tailwind CSS 4 + Lucide Icons + Motion       │
│  • Visual Interactive Quantum Circuit Builder & Canvas                  │
│  • 3D Bloch Sphere Visualizer & Statevector Probability Histograms      │
│  • Quantum Algorithm Sandbox & Interactive Curriculum                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / Cookies / JSON
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                             API GATEWAY                                 │
│  Node.js / Express 4 / TypeScript 5.8 Server                            │
│  • Security Middlewares (Helmet, CORS, Rate Limiters, Cookie Parser)    │
│  • Session Authentication & Cryptographic Token Validation              │
│  • Multi-Tenant Authorization & RBAC Checks                             │
└───────────┬────────────────────────┬────────────────────────┬───────────┘
            │                        │                        │
            ▼                        ▼                        ▼
┌───────────────────────┐┌───────────────────────┐┌───────────────────────┐
│   DOMAIN ROUTERS      ││   QUANTUM RUNNER      ││   AUDIT & OBSERV.     │
│ • Auth & Profiles     ││ • Classical Sim       ││ • Structured Logging  │
│ • Projects & Circuits ││ • Little-Endian Engine││ • Security Events     │
│ • Version History     ││ • AST Python Sandbox  ││ • Health/Ready Probes │
│ • Curriculum & XP     ││ • QASM / Qiskit Export││ • Metrics & Latency   │
└───────────┬───────────┘└───────────────────────┘└───────────┬───────────┘
            │                                                 │
            └────────────────────────┬────────────────────────┘
                                     │ Parameterized Drizzle Queries
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     AUTHORITATIVE DATA LAYER                            │
│  Cloud SQL PostgreSQL (Drizzle ORM Relational Schema)                   │
│  • Users, Profiles, Sessions, User Roles                                │
│  • Projects, Circuits, Circuit Versions, Project Members, Share Tokens  │
│  • Simulation Jobs, Simulation Results, AI Conversations                │
│  • Courses, Modules, Lessons, Lesson Progress, Quizzes, Challenges      │
│  • Notifications, Audit Logs, Security Events                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### Frontend (SPA)
- **Framework**: React 19 with TypeScript.
- **Styling**: Tailwind CSS v4 with custom scientific warm natural palettes.
- **Routing**: Client-side view state machine with deep linking (`?project=<id>`, `?token=<hash>`).
- **Visual Circuit Engine**: Drag-and-drop circuit canvas with live statevector recalculation.
- **State Management**: React context providers (`AuthContext`, `CircuitContext`, `NotificationContext`).

### Backend (REST API Server)
- **Runtime**: Node.js 22 LTS in Docker container.
- **HTTP Engine**: Express 4 with modular sub-routers (`/api/v1/*`).
- **Security**: Rate limiting on sensitive endpoints, constant-time token comparison, Bcrypt password hashing.
- **Concurrency**: Ephemeral simulation execution with queue status tracking (`QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`).

### Database (PostgreSQL)
- **Engine**: PostgreSQL 15 via Cloud SQL.
- **ORM**: Drizzle ORM for type-safe, parameterized SQL queries with zero runtime query generation overhead.
- **Fail-Closed Contract**: When PostgreSQL is disconnected, `/api/v1/health` and `/api/v1/ready` return HTTP 503, and all state-changing endpoints fail closed without falling back to local files or memory.

---

## 3. Data Flow Example: Circuit Execution & Versioning

1. **User Edit**: User adds a Hadamard gate $H(q_0)$ and a $CX(q_0, q_1)$ gate on the circuit builder.
2. **Local Preview**: In-browser simulation calculates the Bell state $|\Phi^+\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}$.
3. **Persist Mutation**: Client dispatches `PUT /api/v1/projects/:id` with updated Circuit IR.
4. **Authorization & Snapshot**: API server verifies user ownership, writes the updated circuit to PostgreSQL, and automatically increments the version counter in `circuit_versions`.
5. **Simulation Job Queue**: Client requests a 2048-shot hardware simulation. Server creates a `simulation_jobs` record (`QUEUED`), runs the job via the classical simulator, stores the results in `simulation_results`, updates status to `COMPLETED`, and emits an audit event.
