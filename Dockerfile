# Frontend
FROM node:20-alpine

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci --only=production

# Build
COPY . .
RUN npm run build:frontend

EXPOSE 3000

CMD ["node", "build"]