# Changelog

All notable changes to **Q-Learn Nexus** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-31

### Added
- **PostgreSQL Authoritative Persistence**: Full migration of users, profiles, sessions, projects, circuits, circuit versions, simulation jobs, learning progress, and audit logs to Cloud SQL PostgreSQL via Drizzle ORM.
- **Quantum Circuit Builder**: Interactive multi-qubit visual circuit editor supporting Pauli ($X, Y, Z$), Hadamard ($H$), Phase ($S, T$), Arbitrary Angle Rotations ($R_x, R_y, R_z$), Controlled ($CX, CZ$), and $SWAP$ gates.
- **Classical Simulation Engine**: Canonical little-endian statevector calculation, measurement sampling (up to 8192 shots), and Bloch sphere coordinate calculation.
- **Circuit Version Control**: Transactionally safe version snapshot history with message notes and restore capabilities.
- **Multi-Tenant Authorization & RBAC**: Tenant isolation preventing unauthorized cross-user project or simulation reads/mutations; SHA-256 share tokens for unlisted sharing.
- **Interoperability Exporters**: Direct OpenQASM 2.0 and Qiskit Python code generation from circuit IR.
- **AST Security Sandbox**: AST validation scanner blocking unauthorized system/network access in user-supplied quantum Python scripts.
- **Production Health & Readiness Probes**: `/api/v1/health` and `/api/v1/ready` endpoints verifying live database connections.
- **Automated Verification Suites**: Complete automated test suites covering fail-closed persistence, multi-user isolation, quantum engine math, and end-to-end user flows.

---

## [Unreleased]
- External Quantum Provider SDK bindings (IBM Quantum / AWS Braket adapters).
- Distributed multi-worker simulation queue.
- Interactive experiment notebooks with inline visualization.
