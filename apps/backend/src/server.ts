import express from 'express';
import { prisma } from '@infrastructure/database/prisma';
import {
  initializeBackupScheduler,
  stopBackupScheduler,
} from '@infrastructure/jobs/backupScheduler';
import { seedAdminUser } from './scripts/seed-admin';

const DEFAULT_PORT = 14040;

/**
 * Start the Express server with database connection and graceful shutdown
 */
export async function startServer(app: express.Application): Promise<void> {
  const preferredPort = process.env.PORT ? parseInt(process.env.PORT) : DEFAULT_PORT;

  try {
    await prisma.$connect();
    await seedAdminUser();
    initializeBackupScheduler();

    const server = app.listen(preferredPort, () => {
      const actualPort = (server.address() as any)?.port || preferredPort;
      console.log('Server is running!');
      console.log(`Port: ${actualPort}`);
      console.log(`Health check: http://localhost:${actualPort}/health`);
      console.log(`API Base: http://localhost:${actualPort}/api`);
      console.log(`API Docs: http://localhost:${actualPort}/api-docs`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`Port ${preferredPort} is in use, finding another...`);
        const fallbackServer = app.listen(0, () => {
          const actualPort = (fallbackServer.address() as any)?.port;
          console.log('Server is running on fallback port!');
          console.log(`Port: ${actualPort}`);
          console.log(`Health check: http://localhost:${actualPort}/health`);
          console.log(`API Base: http://localhost:${actualPort}/api`);
        });
      } else {
        throw error;
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Register graceful shutdown handlers
 */
export function registerShutdownHandlers(): void {
  const shutdown = async () => {
    stopBackupScheduler();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
