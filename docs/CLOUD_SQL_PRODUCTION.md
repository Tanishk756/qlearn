# Q-Learn Nexus — Cloud SQL Production Architecture & Integration Guide

**Project Owner**: Tanishk Singhal (`tanishksinghal6285@gmail.com` / GitHub: `tanishk756`)  
**Google Cloud Project**: `qlearn-nexus`  
**Region**: `asia-south1` (Mumbai)  
**Cloud SQL Instance**: `qlearn-postgres`  
**Database**: `qlearn_nexus`  
**Application User**: `qlearn_app`  
**Secret Reference**: `qlearn-db-password` (Google Secret Manager)  
**Document Version**: 2.0 (Production Verified)  

---

## 1. System Architecture

```
Internet (Clients / HTTPS)
       │
       ▼
Cloud Run Service (qlearn-nexus-api)
   [Node.js 20 / Express / Drizzle ORM / pg.Pool]
       │
       │ (Encrypted Unix Domain Socket / VPC Direct Egress)
       │ Instance: qlearn-nexus:asia-south1:qlearn-postgres
       │
       ▼
Google Cloud SQL (qlearn-postgres)
   [PostgreSQL 16 Engine / Private Service Access / VPC: default]
       │
       ▼
Database: qlearn_nexus
User: qlearn_app (Least Privilege Role)
```

---

## 2. Production Networking Architecture

- **VPC Network**: `default` in region `asia-south1`.
- **Private Service Access**: `ENABLED` with allocated internal IP range for Google managed services.
- **Private IP**: `ENABLED` on Cloud SQL instance `qlearn-postgres`.
- **Public IP**: Disabled or restricted from public internet access.
- **Cloud Run Connection Path**:
  1. **Primary (Recommended & Native)**: Cloud Run native Cloud SQL Unix domain socket (`/cloudsql/qlearn-nexus:asia-south1:qlearn-postgres`). This utilizes Cloud Run's built-in secure TLS proxy tunnel without opening ports to the public internet.
  2. **Alternative**: Serverless VPC Access Connector / Direct VPC Egress into `default` VPC communicating over internal private IP on port `5432`.

---

## 3. Secret Manager & Credential Isolation

- **Secret Identifier**: `qlearn-db-password` in Google Secret Manager.
- **Access Policy**:
  - Cloud Run Service Account (e.g. `qlearn-nexus-sa@qlearn-nexus.iam.gserviceaccount.com`) is granted `roles/secretmanager.secretAccessor` on `qlearn-db-password`.
  - Secret is injected dynamically at container startup as environment variable `DB_PASSWORD`.
- **Security Boundaries**:
  - The database password is **NEVER** present in source code, Git repositories, Dockerfiles, or client-side JavaScript bundles.
  - The client SPA bundle contains **zero** database connection credentials. All queries are handled server-side via `/api/v1/*` routes.
  - Logs strip and suppress database credentials and connection strings.

---

## 4. Cloud Run Service Configuration

### A. Environment Variables & Secret Bindings

To deploy the Cloud Run service connecting to Cloud SQL via native Unix Socket:

```bash
gcloud run deploy qlearn-nexus-api \
  --project=qlearn-nexus \
  --region=asia-south1 \
  --image=gcr.io/qlearn-nexus/qlearn-nexus-api:latest \
  --platform=managed \
  --set-env-vars="INSTANCE_CONNECTION_NAME=qlearn-nexus:asia-south1:qlearn-postgres,DB_NAME=qlearn_nexus,DB_USER=qlearn_app,DB_POOL_MAX=20,DB_IDLE_TIMEOUT_MS=30000,DB_CONN_TIMEOUT_MS=10000,NODE_ENV=production" \
  --set-secrets="DB_PASSWORD=qlearn-db-password:latest" \
  --add-cloudsql-instances="qlearn-nexus:asia-south1:qlearn-postgres" \
  --service-account="qlearn-nexus-sa@qlearn-nexus.iam.gserviceaccount.com" \
  --allow-unauthenticated
```

---

## 5. PostgreSQL Client & Connection Pooling (`pg.Pool`)

The Node.js server uses `pg.Pool` with `drizzle-orm/node-postgres` in `server/src/database/client.ts`.

### Pool Configuration Highlights:
- **Host / Socket**: `/cloudsql/qlearn-nexus:asia-south1:qlearn-postgres` (Unix socket) or VPC private IP.
- **User**: `qlearn_app`
- **Password**: Injected via `process.env.DB_PASSWORD` (from Secret Manager).
- **Database**: `qlearn_nexus`
- **Max Connections**: `20` per container instance.
- **Idle Timeout**: `30,000ms` (closes stale connections automatically).
- **Connection Timeout**: `10,000ms` (fails fast on network partitions).
- **Health Probing**: Real-time probe endpoint via `checkDatabaseHealth()` executing `SELECT 1 as health_probe`.

---

## 6. Local Development Isolation

Local development is strictly decoupled from production Cloud SQL:
- **Local PostgreSQL**: Developers run `docker compose up -d postgres` which starts PostgreSQL 16 on `localhost:5432`.
- **Environment Fallback**: In local development without an active PostgreSQL service, the application safely utilizes atomic local JSON storage snapshots (`data_storage/nexus_db.json`) ensuring uninterrupted UI and algorithmic development.
- **No Production Credentials Locally**: Local developer environments never require production Cloud SQL passwords.

---

## 7. Migration & Rollback Procedures

### A. Prerequisites Before Running Migrations
1. Verify Cloud SQL Auth Proxy is running or migration runner has VPC network access.
2. Grant `qlearn_app` appropriate DDL permissions (`CREATE TABLE`, `CREATE INDEX`) on `qlearn_nexus`.

### B. Execution Command (DO NOT RUN PREMATURELY)

When instructed to apply migrations:

```bash
# Option 1: Using Drizzle Migration Runner
npx tsx scripts/migrate-drizzle.ts

# Option 2: Using Drizzle Kit CLI
npx drizzle-kit migrate --config=drizzle.config.ts
```

### C. Rollback Procedure
1. Schema versions are tracked in `drizzle/migrations/`.
2. For targeted schema rollbacks, execute the inverse down-migration script using the PostgreSQL migration transaction runner:
```bash
npx tsx scripts/rollback-drizzle.ts --version=<TARGET_VERSION>
```
3. In emergency situations, restore from the latest Cloud SQL automated snapshot.

---

## 8. Backup & Restore Architecture

- **Automated Backups**: Enabled in Cloud SQL with Point-in-Time Recovery (PITR) and binary logging.
- **Backup Window**: 02:00–06:00 UTC (off-peak).
- **Manual Snapshot Command**:
```bash
gcloud sql backups create \
  --instance=qlearn-postgres \
  --project=qlearn-nexus \
  --description="Pre-migration snapshot"
```
- **Restore Command**:
```bash
gcloud sql backups restore <BACKUP_ID> \
  --restore-instance=qlearn-postgres \
  --project=qlearn-nexus
```

---

## 9. Security & Least Privilege Verification

1. **User Segregation**: `qlearn_app` is used for application queries, **never** the default `postgres` superuser.
2. **Access Control**: Application database user privileges are restricted to `qlearn_nexus` database objects.
3. **Defense in Depth**:
   - Parameterized SQL queries across all repositories eliminate SQL injection.
   - Row-level IDOR checks in API middleware enforce user ownership and team permissions.
   - Zero credentials exposed in frontend builds, logs, or error responses.
