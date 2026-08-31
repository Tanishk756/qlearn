# Database Architecture & PostgreSQL Schema — Q-Learn Nexus

**Author:** Tanishk Singhal ([@Tanishk756](https://github.com/Tanishk756))  
**Engine:** PostgreSQL 15+ (Cloud SQL / Self-Hosted)  
**ORM / Query Builder:** Drizzle ORM  

---

## 1. Authoritative Persistence Policy

Q-Learn Nexus implements an **authoritative, single-source-of-truth database contract**:
1. **Zero Filesystem Reliance**: No local JSON files or directories (`data_storage/`, `nexus_db.json`) are ever used or created in production.
2. **Fail-Closed Stance**: If PostgreSQL is unavailable, the application immediately returns HTTP 503 rather than operating on volatile in-memory mock data.
3. **Transactional Guarantees**: Relational foreign keys with cascading updates/deletions maintain referential integrity.
4. **Parameterized Queries**: All queries are constructed using Drizzle's parameterized SQL builders.

---

## 2. Relational Schema Summary

### Core Identity & Sessions
- `users`: Primary user accounts (ID, email, password hash, role, status flags).
- `user_profiles`: Extended metadata (bio, affiliation, quantum proficiency, theme preferences).
- `sessions`: Ephemeral authenticated sessions (token hash, expiry, IP, user agent).
- `password_resets`: Cryptographically hashed single-use password recovery tokens.

### Quantum Projects & Circuit Storage
- `projects`: Top-level quantum projects (title, description, visibility, circuit reference, tags).
- `circuits`: Quantum circuit definitions (qubit count, classical bit count, serialized gates, version).
- `circuit_versions`: Immutable audit snapshots of circuit history with author notes.
- `project_members`: Multi-user team collaboration mappings with permissions (`VIEW`, `EDIT`, `ADMIN`).
- `share_tokens`: Cryptographically signed unlisted access tokens.

### Simulation Jobs & Results
- `simulation_jobs`: Asynchronous quantum execution jobs (status, shots, provider, duration).
- `simulation_results`: Execution output payloads (statevectors, measurement histograms, Bloch vectors).

### Education, Community & Observability
- `courses`, `course_modules`, `lessons`: Curriculum structure.
- `user_lesson_progress`, `user_quizzes`: Student mastery tracking and XP.
- `notifications`, `notification_preferences`: Real-time user updates.
- `audit_logs`, `security_events`: Immutable security and compliance log trail.

---

## 3. Migration & Schema Synchronization

To sync the schema with your PostgreSQL instance:
```bash
# Push schema updates directly
npx drizzle-kit push

# Generate SQL migration files
npx drizzle-kit generate
```
