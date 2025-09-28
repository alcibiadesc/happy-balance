# Backend
FROM node:20-alpine

WORKDIR /app

# Dependencies
COPY package*.json ./
COPY prisma ./prisma
RUN npm install && npx prisma generate

# Source
COPY . .

EXPOSE 3004

CMD ["npm", "run", "dev"]