# Frontend Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

WORKDIR /app

# Copy built application and necessary files
COPY --chown=nodeuser:nodejs --from=base /app/build ./build
COPY --chown=nodeuser:nodejs --from=base /app/package.json ./
COPY --chown=nodeuser:nodejs --from=base /app/node_modules/@sveltejs/adapter-node ./node_modules/@sveltejs/adapter-node

# Install only production dependencies for the adapter
RUN pnpm install --prod --frozen-lockfile @sveltejs/adapter-node

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "build"]