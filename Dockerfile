# Multi-stage build for production frontend
FROM node:20-alpine AS deps

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/

# Install all dependencies (including workspace dependencies)
RUN pnpm install --frozen-lockfile

# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/package.json ./apps/frontend/
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy frontend source code
COPY apps/frontend ./apps/frontend

# Build the application
WORKDIR /app/apps/frontend
RUN pnpm build

# Production stage - Simple Node.js server for SvelteKit
FROM node:20-alpine AS production

# Install pnpm and wget for health checks
RUN npm install -g pnpm && \
    apk add --no-cache wget

WORKDIR /app

# Copy workspace configuration and package.json
COPY --from=builder /app/apps/frontend/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Copy built application
COPY --from=builder /app/apps/frontend/build ./build

# Install only production dependencies for the built app
RUN pnpm install --prod --frozen-lockfile

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S frontend -u 1001 -G nodejs && \
    chown -R frontend:nodejs /app

USER frontend

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Set environment variable for production
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "build"]