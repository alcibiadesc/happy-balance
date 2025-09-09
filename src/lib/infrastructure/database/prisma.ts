import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client instance
export const prisma = globalThis.__prisma || new PrismaClient({
  log: dev ? ['error', 'warn', 'info'] : ['error']
  // Datasource configuration is handled by Prisma from environment variables
});

if (dev && typeof window === 'undefined') {
  globalThis.__prisma = prisma;
}