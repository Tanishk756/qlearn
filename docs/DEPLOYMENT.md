# Production Deployment Guide — Q-Learn Nexus

**Author:** Tanishk Singhal ([@Tanishk756](https://github.com/Tanishk756))  
**Target Environments:** Google Cloud Run, Cloud SQL (PostgreSQL), Docker  

---

## 1. Google Cloud Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Google Cloud Project                     │
│                                                        │
│  ┌───────────────────────┐   Direct VPC / Unix Socket  │
│  │   Cloud Run Service   │ ──────────────────────────┐ │
│  │   (qlearn-nexus-api)  │                           │ │
│  └───────────────────────┘                           ▼ │
│                                         ┌─────────────────────┐
│  ┌───────────────────────┐              │  Cloud SQL Instance │
│  │    Secret Manager     │ ───────────► │  (qlearn-postgres)  │
│  │ (DATABASE_URL, etc.)  │              │    PostgreSQL 15    │
│  └───────────────────────┘              └─────────────────────┘
└────────────────────────────────────────────────────────┘
```

---

## 2. Step-by-Step Production Deployment

### Step 1: Provision Cloud SQL PostgreSQL
1. Create a Cloud SQL PostgreSQL instance (e.g. `qlearn-postgres`).
2. Create database `qlearn_nexus` and application user `qlearn_app`.

### Step 2: Configure Secret Manager
Store sensitive configuration in Google Cloud Secret Manager:
- `DATABASE_URL`: `postgresql://qlearn_app:<PASSWORD>@localhost:5432/qlearn_nexus?host=/cloudsql/<PROJECT_ID>:<REGION>:<INSTANCE_ID>`
- `SESSION_SECRET`: A secure 64-character random string.

### Step 3: Build & Push Container Image
```bash
# Build production Docker image
gcloud builds submit --tag gcr.io/<PROJECT_ID>/qlearn-nexus-api:latest .
```

### Step 4: Deploy to Cloud Run
```bash
gcloud run deploy qlearn-nexus-api \
  --image gcr.io/<PROJECT_ID>/qlearn-nexus-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 3000 \
  --add-cloudsql-instances <PROJECT_ID>:<REGION>:<INSTANCE_ID> \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest
```

### Step 5: Verify Health Checks
```bash
curl -f https://<YOUR_SERVICE_URL>/api/v1/health
curl -f https://<YOUR_SERVICE_URL>/api/v1/ready
```
