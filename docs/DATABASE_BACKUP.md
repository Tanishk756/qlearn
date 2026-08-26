# Q-Learn Nexus — Database Backup, Disaster Recovery & Replication Policy

## Infrastructure Implementation Status Declaration
- **Logical Backup & Dump Scripts (`pg_dump`)**: `CONFIGURED` & `DOCUMENTED`
- **Point-in-Time Recovery (PITR) & WAL Archiving Architecture**: `DOCUMENTED`
- **Live Connection Failover & Pool Recovery**: `CONFIGURED` & `TESTED`
- **Transactional Rollbacks & Atomic Consistency**: `CONFIGURED` & `TESTED`

---

## 1. Backup Strategy Overview

For high availability and multi-tenant data safety, Q-Learn Nexus implements a tiered backup architecture:

```
[ Active PostgreSQL 16+ Primary ]
        │
        ├──> Streaming WAL Replication ──> [ Read Replica / Warm Standby ]
        │
        ├──> Continuous WAL Archiving  ──> [ Encrypted Object Storage / GCS Bucket ]
        │
        └──> Scheduled Daily Snapshots ──> [ pg_dump / Volume Snapshots ]
```

---

## 2. Automated Daily Snapshot Procedure

### Full Logical Dump
Executed nightly at `02:00 UTC` via cron / Cloud Scheduler:
```bash
#!/bin/bash
set -eo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/postgres"
FILENAME="qlearn_nexus_${TIMESTAMP}.sql.gz"

pg_dump -h "${SQL_HOST:-localhost}" \
        -U "${SQL_USER:-postgres}" \
        -d "${SQL_DB_NAME:-qlearn_nexus}" \
        -F c \
        -b -v \
        | gzip > "${BACKUP_DIR}/${FILENAME}"

echo "[Backup Completed] Stored at ${BACKUP_DIR}/${FILENAME}"
```

---

## 3. Continuous Point-in-Time Recovery (PITR)

### WAL Archiving Configuration (`postgresql.conf`)
```ini
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /mnt/wal_archive/%f && cp %p /mnt/wal_archive/%f'
archive_timeout = 300
```

### Restoration to a Specific Timestamp
To recover to an exact point in time (e.g., prior to an accidental data drop):
1. Stop the PostgreSQL service.
2. Restore the latest full base backup.
3. Configure `recovery.signal` with target time:
```ini
restore_command = 'cp /mnt/wal_archive/%f %p'
recovery_target_time = '2026-08-26 03:00:00 UTC'
recovery_target_action = 'promote'
```
4. Start PostgreSQL to replay WAL logs up to the specified boundary.

---

## 4. Disaster Recovery & Failover Objectives

- **Recovery Point Objective (RPO)**: < 1 minute (via continuous WAL streaming).
- **Recovery Time Objective (RTO)**: < 5 minutes (automated container restart / replica promotion).
- **Retention Schedule**:
  - Daily snapshots retained for 30 days.
  - Weekly snapshots retained for 90 days.
  - Monthly snapshots retained for 1 year.
