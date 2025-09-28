# Multi-stage build for production backend
FROM node:20-alpine AS deps

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package*.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (including workspace dependencies)
RUN pnpm install --frozen-lockfile

# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/package.json ./apps/backend/
COPY pnpm-workspace.yaml package*.json pnpm-lock.yaml ./

# Copy backend source code
COPY apps/backend ./apps/backend

# Generate Prisma client and build
WORKDIR /app/apps/backend
RUN pnpm prisma generate && pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm and additional tools for health checks
RUN npm install -g pnpm && \
    apk add --no-cache wget

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package*.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application and prisma schema
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma

# Create uploads directory
RUN mkdir -p /app/uploads

# Switch to backend directory
WORKDIR /app/apps/backend

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 -G nodejs && \
    chown -R backend:nodejs /app

USER backend

EXPOSE 3004

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

CMD ["pnpm", "start"]