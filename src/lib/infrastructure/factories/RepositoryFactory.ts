import { env } from '$env/dynamic/public';
import type { ITransactionRepository } from '$lib/domain/repositories/ITransactionRepository.js';
import type { ICategoryRepository } from '$lib/domain/repositories/ICategoryRepository.js';
import { PrismaTransactionRepository } from '../repositories/PrismaTransactionRepository.js';
import { PrismaCategoryRepository } from '../repositories/PrismaCategoryRepository.js';
import { DemoTransactionRepository } from '../demo/DemoTransactionRepository.js';
import { DemoCategoryRepository } from '../demo/DemoCategoryRepository.js';

export class RepositoryFactory {
  static createTransactionRepository(): ITransactionRepository {
    const isDemoMode = env.PUBLIC_DEMO_MODE === 'true';
    
    if (isDemoMode) {
      return new DemoTransactionRepository();
    }
    
    return new PrismaTransactionRepository();
  }

  static createCategoryRepository(): ICategoryRepository {
    const isDemoMode = env.PUBLIC_DEMO_MODE === 'true';
    
    if (isDemoMode) {
      return new DemoCategoryRepository();
    }
    
    return new PrismaCategoryRepository();
  }

  static isDemoMode(): boolean {
    return env.PUBLIC_DEMO_MODE === 'true';
  }
}