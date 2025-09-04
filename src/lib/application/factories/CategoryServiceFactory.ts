import { CategoryApplicationService } from '../services/CategoryApplicationService.js';
import { RepositoryFactory } from '$lib/infrastructure/factories/RepositoryFactory.js';

export class CategoryServiceFactory {
  static create(): CategoryApplicationService {
    const categoryRepository = RepositoryFactory.createCategoryRepository();
    return new CategoryApplicationService(categoryRepository);
  }
}