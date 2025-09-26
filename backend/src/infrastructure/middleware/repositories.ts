import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaTransactionRepository } from '../repositories/PrismaTransactionRepository';
import { PrismaCategoryRepository } from '../repositories/PrismaCategoryRepository';
import { PrismaUserPreferencesRepository } from '../repositories/PrismaUserPreferencesRepository';
import { PrismaDashboardRepository } from '../repositories/PrismaDashboardRepository';

// Extend Express Request type to include repositories
declare global {
  namespace Express {
    interface Request {
      repositories?: {
        transaction: PrismaTransactionRepository;
        category: PrismaCategoryRepository;
        userPreferences: PrismaUserPreferencesRepository;
        dashboard: PrismaDashboardRepository;
      };
    }
  }
}

/**
 * Middleware that creates repository instances with the correct userId
 * from the authenticated user
 */
export function createRepositoriesMiddleware(prisma: PrismaClient) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get userId from authenticated user or use 'default' for unauthenticated routes
    const userId = req.user?.userId || 'default';

    // Create repository instances with the userId
    req.repositories = {
      transaction: new PrismaTransactionRepository(prisma, userId),
      category: new PrismaCategoryRepository(prisma, userId),
      userPreferences: new PrismaUserPreferencesRepository(prisma),
      dashboard: new PrismaDashboardRepository(prisma, userId),
    };

    next();
  };
}