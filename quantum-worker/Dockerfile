# Multi-Stage Secure Dockerfile for Q-Learn Nexus Quantum Worker
FROM python:3.10-slim AS builder

WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final Minimal Unprivileged Runtime
FROM python:3.10-slim AS runner

# Security: Create non-root unprivileged worker user (UID 10001)
RUN groupadd -g 10001 quantum && \
    useradd -u 10001 -g quantum -m -s /sbin/nologin -d /home/quantum quantum

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /root/.local /home/quantum/.local
COPY --chown=quantum:quantum app/ /app/app/

# Configure path and non-root environment
ENV PATH="/home/quantum/.local/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH="/app"

# Drop all privileges and run as non-root user
USER quantum

# Security constraints: Non-root, no capabilities
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health').read()" || exit 1

ENTRYPOINT ["python3", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2"]
