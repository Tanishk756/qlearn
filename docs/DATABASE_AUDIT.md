# Q-Learn Nexus — Database Architecture & Integrity Audit Report

**Audit Date**: August 26, 2026  
**Audited Subsystem**: Persistence & Enterprise Database Engine  
**Project Owner**: Tanishk Singhal (<tanishksinghal6285@gmail.com>)  
**Target Database**: PostgreSQL 16+ via Drizzle ORM  

---

## 1. Database Reality Declaration

```ini
DATABASE_ENGINE=PostgreSQL 16+ with Drizzle ORM
ORM_LAYER=drizzle-orm (v0.38+)
PERSISTENCE_MODEL=PostgreSQL Relational Storage with WAL Durability & Connection Pooling (pg.Pool)
TRANSACTION_SUPPORT=ACID Transactions (BEGIN ... COMMIT / ROLLBACK) via withTransaction
CONCURRENCY_SUPPORT=Multi-Process & Multi-Instance Safe via PostgreSQL MVCC & pg.Pool
MIGRATION_SUPPORT=Drizzle Kit Migrations (drizzle-kit generate & migrate)
BACKUP_SUPPORT=Automated pg_dump Snapshots & Continuous Point-in-Time Recovery (PITR)
MULTI_PROCESS_SAFETY=Enterprise Multi-Process Safe (Connection Pooled)
MULTI_INSTANCE_SAFETY=Cloud Run & Kubernetes Horizontal Scaling Ready
SHARING_SECURITY=Cryptographic SHA-256 Tokens for Unlisted Workspaces
```

---

## 2. Relational Architecture & Migration Status

### 2.1 Core Relational Tables (36 Tables)
1. **Identity & Authentication**: `users`, `profiles`, `sessions`, `roles`, `user_roles`, `password_resets`
2. **Curriculum & Gamification**: `courses`, `modules`, `lessons`, `quizzes`, `questions`, `quiz_attempts`, `quiz_answers`, `lesson_progress`, `coding_challenges`, `challenge_submissions`, `achievements`, `user_achievements`, `learning_profiles`, `learning_events`
3. **Workspace, Circuits & Sharing**: `projects`, `circuits`, `circuit_versions`, `project_members`, `project_versions`, `shared_projects`, `share_tokens`
4. **Simulation, AI & Auditing**: `simulation_jobs`, `simulation_results`, `ai_conversations`, `ai_messages`, `notifications`, `notification_preferences`, `audit_logs`, `security_events`, `system_settings`

### 2.2 Connection Pooling & Health Monitoring
- Configured with `pg.Pool` (`server/src/database/client.ts`) supporting `DATABASE_URL` and `SQL_*` variables.
- Dynamic pool configuration (`DB_POOL_MAX`, `DB_IDLE_TIMEOUT_MS`, `DB_CONN_TIMEOUT_MS`).
- Health probes via `checkDatabaseHealth()`.

### 2.3 ACID Transactions & Rollback
- Implemented `withTransaction` in `server/src/database/transactions.ts` ensuring atomic multi-table mutations (e.g. creating project + circuit + initial version).
- In the event of an error, automatic database rollback triggers with zero orphaned rows.

### 2.4 Project Sharing & Security Controls
- **Private**: Accessible exclusively to the project owner and administrators.
- **Unlisted**: Accessible only with a valid 256-bit cryptographically secure token (`crypto.randomBytes(32)`), stored as a SHA-256 hash.
- **Public**: Discoverable and viewable across the platform.
- **OpenQASM Exports**: Enforces strict matching access control before releasing circuit code.
