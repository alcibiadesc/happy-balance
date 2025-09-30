# Production backend using ts-node for simplicity
FROM node:20-alpine AS production

# Install pnpm and additional tools for health checks
RUN npm install -g pnpm && \
    apk add --no-cache wget

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (including dev for ts-node)
RUN pnpm install --frozen-lockfile

# Copy backend source code
COPY apps/backend ./apps/backend

# Generate Prisma client only
WORKDIR /app/apps/backend
RUN pnpm prisma generate

# Create uploads directory
RUN mkdir -p /app/uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 -G nodejs && \
    chown -R backend:nodejs /app

USER backend

EXPOSE 3004

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

# Use ts-node for production to avoid compilation issues
CMD ["pnpm", "dev"]