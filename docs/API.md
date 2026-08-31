# Q-Learn Nexus — REST API Reference

**Base URL**: `/api/v1`  
**Authentication**: Session cookie (`nexus_session`) or Bearer token header (`Authorization: Bearer <sessionId>.<token>`).

---

## 1. System Health & Readiness

### `GET /api/v1/health`
Checks database connectivity and server status.
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-08-31T10:00:00.000Z",
    "database": {
      "connected": true,
      "latencyMs": 3
    },
    "uptime": 1240.5
  }
  ```
- **Response `503 Service Unavailable`** (when DB unreachable):
  ```json
  {
    "status": "unhealthy",
    "database": { "connected": false, "error": "connection timeout" }
  }
  ```

### `GET /api/v1/ready`
Readiness probe for Cloud Run and Kubernetes ingress.
- **Response `200 OK`**:
  ```json
  {
    "status": "ready",
    "dependencies": { "database": "connected" }
  }
  ```

---

## 2. Authentication (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Creates a new user account and authenticates session.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "Jane Quantum",
    "username": "jane_q",
    "affiliation": "Quantum Lab",
    "quantumLevel": "Intermediate"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "user": { "id": "usr_...", "email": "user@example.com", "name": "Jane Quantum", "role": "STUDENT" },
    "token": "sess_....raw_token"
  }
  ```

### `POST /api/v1/auth/login`
Authenticates existing credentials and sets session cookie.
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
  ```

### `POST /api/v1/auth/logout`
Revokes active session from PostgreSQL.

### `GET /api/v1/auth/me`
Retrieves current user identity and profile.

---

## 3. Projects & Circuits (`/api/v1/projects`)

### `GET /api/v1/projects`
Lists all projects accessible to the authenticated user (owned + public).

### `POST /api/v1/projects`
Creates a new project and initial circuit.
- **Request Body**:
  ```json
  {
    "title": "Quantum Teleportation Protocol",
    "description": "3-qubit teleportation circuit implementation",
    "tags": ["teleportation", "entanglement"],
    "isPublic": false,
    "circuitIR": {
      "name": "Teleportation",
      "qubits": 3,
      "classicalBits": 3,
      "gates": [
        { "id": "g1", "type": "H", "targets": [1], "stepIndex": 0 },
        { "id": "g2", "type": "CX", "controls": [1], "targets": [2], "stepIndex": 1 }
      ]
    }
  }
  ```

### `GET /api/v1/projects/:id`
Retrieves a project by ID. Enforces ownership and checks share tokens.

### `PUT /api/v1/projects/:id`
Updates project metadata or circuit definition. Creates a new version snapshot.

### `DELETE /api/v1/projects/:id`
Deletes a project and all associated circuits and version records.

### `GET /api/v1/projects/:id/qasm`
Exports the circuit as an OpenQASM 2.0 file download.

### `POST /api/v1/projects/:id/share`
Generates a SHA-256 cryptographic share token for unlisted sharing.

---

## 4. Simulation Engine (`/api/v1/simulations`)

### `POST /api/v1/simulations/run`
Enqueues a circuit simulation job.
- **Request Body**:
  ```json
  {
    "circuitIR": { ... },
    "shots": 1024,
    "provider": "NEXUS_SIM"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "jobId": "sim_...",
    "status": "COMPLETED",
    "results": {
      "probabilities": { "00": 0.5, "11": 0.5 },
      "counts": { "00": 512, "11": 512 },
      "statevector": [ ... ],
      "blochVectors": [ ... ]
    }
  }
  ```

### `GET /api/v1/simulations/jobs/:id`
Retrieves execution status and results of a simulation job.

---

## 5. Courses & Learning (`/api/v1/courses`)

### `GET /api/v1/courses`
Lists all available curriculum courses and user progress.

### `GET /api/v1/courses/:slug`
Retrieves course details, modules, and lessons.

### `POST /api/v1/courses/lessons/:id/complete`
Records lesson completion and awards XP.
