# Technical Debt & Architecture Audit Log — Q-Learn Nexus

**Author:** Tanishk Singhal ([@Tanishk756](https://github.com/Tanishk756))  

---

## 1. Resolved Technical Debt (v1.0.0)

| Area | Former State | Current Production State |
| :--- | :--- | :--- |
| **Data Persistence** | Dual/hybrid mode with local JSON fallback | **Authoritative PostgreSQL**: Strict fail-closed posture; zero filesystem persistence writes in production. |
| **Qubit Ordering** | Potential ambiguity in bit significance | **Canonical Little-Endian**: Explicitly normalized to standard $q_0$ = LSB across simulator and UI. |
| **Tenant Isolation** | Basic ID matching | **Server-Side Verified RBAC**: Strict ownership verification, SHA-256 share tokens, and session token hashing. |
| **Code Sandbox** | Unsanitized execution | **AST Security Scanner**: Multi-stage AST parsing blocking malicious modules, syscalls, and secrets. |

---

## 2. Monitored Items for Future Cycles

1. **Simulator Qubit Scale**: The classical statevector simulator operates in $O(2^n)$ memory. Circuits $\le 16$ qubits execute instantaneously in browser/Node. For circuits with $n > 16$ qubits, tensor network or sparse state representations will be introduced.
2. **Database Connection Pool Sizing**: Monitor connection spikes under heavy classroom concurrency; configure PgBouncer connection pooling when scaling past 100 concurrent Cloud Run instances.
