# Security Policy

## 🛡️ Supported Versions

Only the latest release branch receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## 🔒 Security Architecture Overview

Q-Learn Nexus enforces defense-in-depth across the entire application stack:

1. **Authentication & Session Security**:
   - Passwords hashed using standard salted **Bcrypt** ($cost \ge 10$).
   - Session tokens generated via cryptographically secure random bytes (256-bit entropy) and stored as **SHA-256 hashes** in PostgreSQL.
   - HTTP-only, secure, `SameSite=Lax` cookie flags in production.
   - Constant-time string comparisons to prevent timing attacks.

2. **Authorization & Tenant Isolation**:
   - Multi-tenant boundary checks executed server-side on every REST route.
   - Insecure Direct Object Reference (IDOR) prevention across projects, circuits, simulations, and profiles.

3. **Quantum Code AST Sandbox**:
   - Multi-layer AST parsing to block dangerous built-ins (`open`, `subprocess`, `os`, `socket`, `eval`, `exec`).
   - Ephemeral process execution in isolated workers with zero persistent credentials in the environment.

4. **Database Security**:
   - Fully parameterized queries through Drizzle ORM.
   - Zero production seeding of plaintext credentials.
   - Comprehensive audit logging (`audit_logs` table) recording security-relevant state transitions.

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability in Q-Learn Nexus, **please do not open a public issue.**

Instead, please report security vulnerabilities directly to:
- **Maintainer:** Tanishk Singhal
- **Email:** `tanishksinghal6285@gmail.com`
- **GitHub:** [@Tanishk756](https://github.com/Tanishk756)

Please include:
- A description of the vulnerability.
- Steps to reproduce or proof-of-concept code.
- Impact assessment.

We strive to acknowledge receipt of security reports within 48 hours and provide a resolution timeline.
