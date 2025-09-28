# Backend Dockerfile - With auto-initialization
FROM node:20-alpine

# Install tools including netcat for health checks
RUN apk add --no-cache curl netcat-openbsd

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install ALL dependencies using npm
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code and entrypoint
COPY . .
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Expose port
EXPOSE 3004

# Use entrypoint for initialization
ENTRYPOINT ["/app/docker-entrypoint.sh"]