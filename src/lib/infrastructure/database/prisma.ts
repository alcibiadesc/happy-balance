import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances during development hot-reload
export const prisma = globalThis.__prisma || new PrismaClient();

if (dev) {
  globalThis.__prisma = prisma;
}