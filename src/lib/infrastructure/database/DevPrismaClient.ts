import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  var __prisma: PrismaClient | undefined;
}

// Singleton pattern for development
if (process.env.NODE_ENV === 'development') {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'file:./prisma/dev.db'
        }
      },
      log: ['query', 'info', 'warn', 'error']
    });
  }
  prisma = global.__prisma;
} else {
  prisma = new PrismaClient();
}

export { prisma };
export default prisma;