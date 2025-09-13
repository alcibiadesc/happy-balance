import { vi } from 'vitest';

// Mock SvelteKit environment variables
vi.mock('$env/dynamic/public', () => ({
  env: {
    NODE_ENV: 'test',
    PUBLIC_LOG_LEVEL: 'info'
  }
}));

vi.mock('$env/static/private', () => ({
  DATABASE_URL: 'file:./test.db'
}));

vi.mock('$env/static/public', () => ({}));

// Mock SvelteKit app module
vi.mock('$app/environment', () => ({
  browser: false,
  dev: true,
  building: false,
  version: 'test'
}));

// Mock Prisma Client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    transaction: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      findByDateRange: vi.fn()
    },
    account: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    $disconnect: vi.fn()
  }))
}));
