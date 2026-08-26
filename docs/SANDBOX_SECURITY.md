# Q-Learn Nexus — Sandbox Security Architecture & Isolation Model

## 1. Threat Model & Isolation Principles

User-submitted quantum programs (whether handwritten in Python or generated via generative AI) represent untrusted, potentially hostile code. The Q-Learn Nexus architecture strictly separates API presentation from code execution using a **multi-layered defense-in-depth model**.

```
[Browser Client]
       │  (HTTPS / JWT Auth)
       ▼
[Express API Gateway] ──── Layer 1: Rate Limiting & Auth Check
       │
       ▼
[AST & Token Security Scanner] ──── Layer 1: Static AST Lexical Filter
       │
       ▼
[Resource Validator] ──── Validates Statevector (≤16Q) vs Density Matrix (≤8Q)
       │
       ▼
[Ephemeral Isolated Worker] ──── Layer 2: Dedicated Tempdir, Scrubbed Env, Hard Timeouts
       │
       ▼
[Result Sanitizer & Logger] ──── Strips host paths, catches non-zero exit codes
       │
       ▼
[Client Response / DB Store]
```

---

## 2. Layer 1: Static AST & Lexical Validation

Before any child process or runtime invocation is initialized, the source code string passes through AST inspection (`QuantumSandbox.inspectCodeSecurity` / `validate_python_code`).

### Prohibited Constructs:
1. **System & OS Modules**: `os`, `sys`, `subprocess`, `shutil`, `pathlib`, `ctypes`, `pty`, `posix`
2. **Network Modules**: `socket`, `http`, `urllib`, `requests`, `aiohttp`, `asyncio`
3. **Dynamic Evaluation & Reflection**: `eval()`, `exec()`, `compile()`, `__import__()`, `getattr()`, `globals()`, `locals()`, `vars()`, `__subclasses__`, `__dict__`
4. **Filesystem IO**: `open()`, `file()`, `/etc/passwd`, `/etc/shadow`, `/proc/`
5. **Concurrency & IPC**: `threading`, `multiprocessing`, `gc`, `signal`
6. **Payload Size**: Strict limit of 50KB / 100,000 characters.

---

## 3. Layer 2: Ephemeral Workspace & Process Isolation

Even if an obfuscated payload bypasses lexical scanning, the second layer guarantees operating system containment:

1. **Ephemeral Workspace**:
   - Every execution run receives a freshly minted directory `/tmp/qsbx_<timestamp>_<random_hex>/` with restricted permissions `0700`.
   - The workspace is guaranteed to be deleted in a `finally` block upon execution completion.
2. **Zero-Secret Scrubbed Environment**:
   - The execution process does **NOT** inherit `process.env`.
   - Explicit stripping of all sensitive keys: `DATABASE_URL`, `REDIS_URL`, `GEMINI_API_KEY`, `SESSION_SECRET`, `JWT_SECRET`, `GCP_*`, `AWS_*`, `AZURE_*`, `IBM_QUANTUM_TOKEN`.
   - Injected environment is limited strictly to `PATH`, `PYTHONUNBUFFERED=1`, `PYTHONDONTWRITEBYTECODE=1`, and `TMPDIR`.
3. **Execution Timeouts & Process Tree Termination**:
   - Hard execution timeout: **5,000 ms** (5 seconds).
   - If timeout expires, `SIGKILL` is issued directly to terminate the child process.
4. **Buffer & Memory Clamping**:
   - Stdout/stderr buffers are capped at **64 KB** to prevent memory exhaustion / log flooding attacks.
   - Max memory allocation ceiling: **256 MB**.

---

## 4. Resource Boundary: Statevector vs Density Matrix

Quantum simulation algorithms scale exponentially with qubit count:
- **Statevector Simulation ($2^N$ elements)**:
  - 16 qubits $\to 2^{16} = 65,536$ complex numbers $\approx 1 \text{ MB}$.
  - Server Maximum: **16 Qubits**.
- **Density Matrix Simulation ($2^{2N}$ elements)**:
  - 8 qubits $\to 2^{16} = 65,536$ complex numbers $\approx 1 \text{ MB}$.
  - 16 qubits $\to 2^{32} = 4,294,967,296$ complex numbers $\approx 64 \text{ GB}$ (Causes fatal Out-Of-Memory).
  - Server Maximum: **8 Qubits** (Strictly enforced in `SimulationQueue`).

---

## 5. Standard Error Codes

All sandbox failures produce structured errors without leaking host paths:

| Error Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `SANDBOX_POLICY_VIOLATION` | 400 | Code contains prohibited imports, system calls, or tokens |
| `SANDBOX_UNBOUNDED_LOOP` | 400 | Unbounded while/infinite loop pattern detected |
| `SANDBOX_PAYLOAD_TOO_LARGE` | 400 | Code size exceeds 50KB limit |
| `SANDBOX_TIMEOUT` | 400 | Execution exceeded maximum 5,000ms wall-clock limit |
| `SANDBOX_OUTPUT_LIMIT_EXCEEDED` | 400 | Stdout output exceeded 64KB ceiling |
| `SANDBOX_EXECUTION_ERROR` | 400 | Cleaned compiler or runtime exception |
| `SANDBOX_RESOURCE_EXHAUSTED` | 400 | Qubit or gate count exceeded hardware tier |
