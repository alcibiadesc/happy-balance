import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

// Global is used here to maintain a single PrismaClient instance across hot reloads
// in development.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: dev ? ['query'] : ['error'],
  });

if (dev) globalForPrisma.prisma = prisma;