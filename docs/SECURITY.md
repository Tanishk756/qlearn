# Security Architecture & Threat Model — Q-Learn Nexus

**Author:** Tanishk Singhal ([@Tanishk756](https://github.com/Tanishk756))  

---

## 1. Threat Model & Mitigations

### 1.1 Insecure Direct Object References (IDOR)
- **Threat**: An authenticated user accesses another user's private circuit or simulation job by manipulating URL parameters.
- **Mitigation**: All database queries enforce strict tenant boundary checks (`where: and(eq(projects.id, id), eq(projects.userId, currentUserId))`) or verify explicit membership / cryptographic share tokens.

### 1.2 Untrusted Quantum Code Execution
- **Threat**: A user executes malicious Python code (e.g. attempting to read `/etc/passwd` or query Cloud metadata APIs).
- **Mitigation**: Multi-stage AST parsing rejects unauthorized system calls, imports (`os`, `sys`, `socket`, `subprocess`), and dangerous built-ins before execution. The ephemeral worker environment is completely scrubbed of all backend credentials.

### 1.3 Credential Stuffing & Brute Force
- **Threat**: Automated password guessing against login endpoints.
- **Mitigation**: IP-based rate limiting via express rate limiters and constant-time bcrypt verification with simulated delay against nonexistent usernames to prevent timing attacks.

---

## 2. Cryptographic Standards

- **Password Hashing**: Bcrypt with minimum work factor of 10.
- **Session Tokens**: 256-bit cryptographically secure pseudorandom numbers generated via `crypto.randomBytes(32)` and persisted exclusively as SHA-256 hashes.
- **Sharing Links**: SHA-256 hashed unique share tokens with optional expiry dates and permission levels (`VIEW` or `EDIT`).
