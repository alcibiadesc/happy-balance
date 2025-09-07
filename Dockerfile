# Multi-stage Dockerfile for optimized builds

# Base image with Node.js and Alpine for smaller size
FROM node:22-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S expense-tracker -u 1001

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm globally
RUN npm install -g pnpm@9.0.0

# Development stage
FROM base AS development

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Change ownership
RUN chown -R expense-tracker:nodejs /app

# Switch to non-root user
USER expense-tracker

# Expose port
EXPOSE 5173

# Start development server
CMD ["dumb-init", "pnpm", "dev"]

# Builder stage
FROM base AS builder

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN pnpm build

# Remove dev dependencies
RUN pnpm prune --prod

# Production stage
FROM node:22-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    curl \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S expense-tracker -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=expense-tracker:nodejs /app/build ./build
COPY --from=builder --chown=expense-tracker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expense-tracker:nodejs /app/package.json ./package.json
COPY --from=builder --chown=expense-tracker:nodejs /app/prisma ./prisma

# Create logs directory
RUN mkdir -p /app/logs && chown expense-tracker:nodejs /app/logs

# Switch to non-root user
USER expense-tracker

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start production server
CMD ["dumb-init", "node", "build"]