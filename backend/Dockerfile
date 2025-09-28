# Backend Dockerfile - Optimizado con auto-inicialización
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache python3 make g++

# Copiar archivos de dependencias
COPY package.json ./
COPY prisma ./prisma

# Instalar todas las dependencias y generar Prisma Client
RUN npm install && npx prisma generate

# Copiar código fuente
COPY . .

# Compilar TypeScript si existe build script
RUN npm run build 2>/dev/null || echo "No build step needed"

FROM node:20-alpine AS production
WORKDIR /app

# Instalar herramientas necesarias
RUN apk add --no-cache netcat-openbsd

# Copiar aplicación compilada
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/dist ./dist 2>/dev/null || true

# Copiar y dar permisos al entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD nc -z localhost 3004 || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]