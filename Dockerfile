# Frontend Dockerfile - Multi-stage build optimizado
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm install -g pnpm && pnpm build:frontend

FROM node:20-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001
WORKDIR /app

# Solo copiar lo necesario para producción
COPY --chown=nodeuser:nodejs --from=builder /app/build ./build
COPY --chown=nodeuser:nodejs package.json ./

# Instalar solo el adaptador necesario
RUN npm install --production @sveltejs/adapter-node

USER nodeuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["node", "build"]