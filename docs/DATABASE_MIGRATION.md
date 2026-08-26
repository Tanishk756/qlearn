# Q-Learn Nexus — Database Migration Architecture Report

## 1. Executive Summary
This document provides the formal architectural report for migrating the Q-Learn Nexus platform from its legacy JSON flat-file storage engine (`nexus_db.json`) to a production-grade **PostgreSQL** relational database architecture using **Drizzle ORM** with connection pooling (`pg.Pool`), strict foreign keys, multi-tenant row-level access control, and transaction isolation.

---

## 2. Current Model vs. Target PostgreSQL Architecture

| Dimension | Legacy System (`nexus_db.json`) | Target Architecture (PostgreSQL + Drizzle ORM) |
| :--- | :--- | :--- |
| **Storage Engine** | Synchronous Map memory + atomic JSON file writes | PostgreSQL 16+ engine with WAL logging |
| **Concurrency** | Single-process atomic rename (`fs.renameSync`) | Multi-process connection pooling (`pg.Pool`), MVCC |
| **Integrity Enforcement** | Application code only | DB-enforced Foreign Keys (`ON DELETE CASCADE`), Constraints |
| **Schema Migrations** | Ad-hoc object hydration | Versioned Drizzle migrations (`drizzle-kit`) |
| **Transactions & Rollback** | None (failed writes lose state or abort) | ACID transactions (`BEGIN ... COMMIT / ROLLBACK`) |
| **Multi-Tenancy & RBAC** | In-memory ID checks | Parameterized relational queries, ownership verification |
| **Sharing Security** | Static boolean `is_public` | Cryptographic SHA-256 tokens for `UNLISTED` projects |

---

## 3. Relational Schema Mapping (36 Relational Tables)

### A. Identity, Authentication & Roles
- `users`: User identity, password hash (`bcrypt`), account status, role (`STUDENT`, `RESEARCHER`, `INSTRUCTOR`, `ADMIN`).
- `profiles`: Granular user metadata, avatar presets, bio, quantum proficiency, UI preferences.
- `sessions`: Bearer token hashes, user ID, IP address, user-agent, expiry timestamp, active status.
- `roles`: Role definitions and capabilities.
- `user_roles`: Many-to-many user role mappings.
- `password_resets`: Secure time-bounded reset tokens with SHA-256 hashes.

### B. Quantum Curriculum & Gamification
- `courses`: Course definitions, difficulty, category, author relation, ordering.
- `modules`: Course modules and curriculum chapters.
- `lessons`: Lesson content (Markdown + LaTeX math formulas + interactive circuit templates).
- `lesson_progress`: User lesson completion tracking with unique user-lesson compound key.
- `quizzes`: Knowledge checks per lesson with JSON options and correct indices.
- `questions`: Quiz item questions and explanations.
- `quiz_attempts`: User quiz submissions and accuracy scores.
- `quiz_answers`: Individual answers per question per attempt.
- `coding_challenges`: Algorithm problem statements, starter templates, and test cases.
- `challenge_submissions`: User code solutions, execution output, latency benchmarks.
- `achievements`: Badge definitions and criteria.
- `user_achievements`: Unlocked user achievements and timestamps.
- `learning_profiles`: XP, streaks, and proficiency tiers.
- `learning_events`: Telemetry event stream.

### C. Projects, Circuits & Cryptographic Sharing
- `projects`: Workspace containers with explicit `owner_id`, title, tags, and visibility (`PRIVATE`, `UNLISTED`, `PUBLIC`).
- `circuits`: Quantum circuit definitions, qubit counts, classical register count, gate arrays.
- `circuit_versions`: Historical snapshots of quantum circuits for rollback.
- `project_members`: Workspace collaborators with roles (`VIEWER`, `EDITOR`, `ADMIN`).
- `project_versions`: Project revision tree.
- `shared_projects`: Project sharing links with token hashes, permissions, and expirations.
- `share_tokens`: Cryptographically random 256-bit share tokens stored via SHA-256 hash.

### D. Simulation Engine, AI & Auditing
- `simulation_jobs`: Job queue tracking with execution status (`QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`).
- `simulation_results`: Quantum state vectors, probability amplitudes, measurement shot histograms.
- `ai_conversations`: Q-Nova tutoring threads and session contexts.
- `ai_messages`: User and assistant conversational turns.
- `notifications`: User notification inbox with delivery status.
- `notification_preferences`: Channel and alert type subscriptions.
- `audit_logs`: Immutable security audit trails for compliance.
- `security_events`: High-priority threat detection logs.
- `system_settings`: Key-value runtime platform configuration.

---

## 4. Migration Plan & Safety Procedures

1. **Pre-Migration Integrity Audit**:
   - Parse `nexus_db.json`.
   - Validate foreign key references (e.g. `circuit_id` -> `circuits.id`, `user_id` -> `users.id`).
2. **Atomic Ingestion**:
   - Run `scripts/migrate-json-to-postgres.ts`.
   - Enforce transactional wrapper: any relational violation rolls back the migration completely without corrupting data.
3. **Data Verification**:
   - Verify record counts across all migrated tables.
   - Run integration sanity checks against the PostgreSQL connection pool.
4. **Zero-Downtime Cutover**:
   - Transition API route queries to execute against Drizzle ORM repositories.

---

## 5. Security & IDOR Mitigation
- **Ownership Verification**: All private resource operations (`GET`, `PUT`, `DELETE`) check `resource.user_id === currentUserId || isAdmin`.
- **Share Tokens**: Unlisted sharing uses 32-byte cryptographically secure random tokens (`crypto.randomBytes(32)`), hashed with SHA-256 before database storage to prevent secret exposure.
- **Timing Attack Mitigation**: Dummy bcrypt evaluation ensures consistent response latency across invalid email/password inputs.
