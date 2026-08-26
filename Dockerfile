# =============================================================================
# Q-Learn Nexus - Production Multi-Stage Dockerfile
# Optimized for Google Cloud Run & Security Hardening
# =============================================================================

# --- Stage 1: Build & Bundle ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Compile frontend static assets (dist/client) and backend server bundle (dist/server.cjs)
ENV NODE_ENV=production
RUN npm run build

# --- Stage 2: Production Minimal Runtime ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Security: Run as non-privileged 'node' user (UID 1000)
USER node

# Expose default Cloud Run port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/v1/health || exit 1

# Production Start Command
CMD ["node", "dist/server.cjs"]
