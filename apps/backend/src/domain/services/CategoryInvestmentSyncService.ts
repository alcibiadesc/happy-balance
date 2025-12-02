import { Result } from '@domain/shared/Result';
import { IInvestmentRepository } from '@domain/repositories/IInvestmentRepository';
import { ICategoryRepository } from '@domain/repositories/ICategoryRepository';
import { Investment } from '@domain/entities/Investment';
import { Category, CategoryId, CategorySnapshot } from '@domain/entities/Category';
import { CategoryType } from '@domain/entities/CategoryType';

/**
 * Service that keeps Categories (type=INVESTMENT) and Investments in sync
 * Bidirectional: Creating one creates the other automatically
 */
export class CategoryInvestmentSyncService {
  constructor(
    private readonly investmentRepository: IInvestmentRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly userId: string
  ) {}

  /**
   * When a Category with type=INVESTMENT is created, create corresponding Investment
   */
  async onCategoryCreated(category: Category): Promise<Result<Investment | null>> {
    try {
      // Only sync if it's an investment category
      if (category.type !== CategoryType.INVESTMENT) {
        return Result.ok(null);
      }

      const snapshot = category.toSnapshot();

      // Check if investment already exists with same name
      const existsResult = await this.investmentRepository.existsByName(snapshot.name);
      if (existsResult.isFailure()) {
        return Result.fail(existsResult.getError());
      }

      if (existsResult.getValue()) {
        // Investment already exists, just link them
        const investmentsResult = await this.investmentRepository.findWithFilters({
          searchTerm: snapshot.name,
        });
        if (investmentsResult.isSuccess() && investmentsResult.getValue().length > 0) {
          const investment = investmentsResult.getValue()[0];
          if (!investment.categoryId) {
            investment.linkToCategory(snapshot.id);
            await this.investmentRepository.update(investment);
          }
          return Result.ok(investment);
        }
        return Result.ok(null);
      }

      // Create new investment linked to this category
      const investmentResult = Investment.create(
        snapshot.name,
        0, // Initial value is 0
        'EUR',
        this.userId,
        {
          categoryId: snapshot.id,
          color: snapshot.color,
          icon: snapshot.icon,
        }
      );

      if (investmentResult.isFailure()) {
        return Result.fail(investmentResult.getError());
      }

      const investment = investmentResult.getValue();
      const saveResult = await this.investmentRepository.save(investment);

      if (saveResult.isFailure()) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok(investment);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to sync investment from category: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * When an Investment is created, create corresponding Category if it doesn't exist
   */
  async onInvestmentCreated(investment: Investment): Promise<Result<Category | null>> {
    try {
      const snapshot = investment.toSnapshot();

      // If already linked to a category, no need to create
      if (snapshot.categoryId) {
        return Result.ok(null);
      }

      // Check if a category with same name and type=investment already exists
      const existsResult = await this.categoryRepository.existsByName(
        snapshot.name,
        CategoryType.INVESTMENT
      );

      if (existsResult.isFailure()) {
        return Result.fail(existsResult.getError());
      }

      if (existsResult.getValue()) {
        // Category already exists, link the investment to it
        const categoriesResult = await this.categoryRepository.findWithFilters({
          type: CategoryType.INVESTMENT,
          searchTerm: snapshot.name,
        });

        if (categoriesResult.isSuccess() && categoriesResult.getValue().length > 0) {
          const category = categoriesResult.getValue()[0];
          investment.linkToCategory(category.id.value);
          await this.investmentRepository.update(investment);
          return Result.ok(category);
        }
        return Result.ok(null);
      }

      // Create new category of type investment
      const categoryId = crypto.randomUUID();
      const categorySnapshot: CategorySnapshot = {
        id: categoryId,
        name: snapshot.name,
        type: CategoryType.INVESTMENT,
        color: snapshot.color,
        icon: snapshot.icon,
        isActive: true,
        annualBudget: 0,
        createdAt: new Date().toISOString(),
      };

      const categoryResult = Category.fromSnapshot(categorySnapshot);

      if (categoryResult.isFailure()) {
        return Result.fail(categoryResult.getError());
      }

      const category = categoryResult.getValue();
      const saveResult = await this.categoryRepository.save(category);

      if (saveResult.isFailure()) {
        return Result.fail(saveResult.getError());
      }

      // Link investment to new category
      investment.linkToCategory(categoryId);
      await this.investmentRepository.update(investment);

      return Result.ok(category);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to sync category from investment: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * When a Category is updated, update the linked Investment
   */
  async onCategoryUpdated(category: Category): Promise<Result<void>> {
    try {
      if (category.type !== CategoryType.INVESTMENT) {
        return Result.ok(undefined);
      }

      const snapshot = category.toSnapshot();

      // Find investments linked to this category
      const investmentsResult = await this.investmentRepository.findByCategoryId(snapshot.id);

      if (investmentsResult.isFailure()) {
        return Result.fail(investmentsResult.getError());
      }

      const investments = investmentsResult.getValue();

      // Update each linked investment
      for (const investment of investments) {
        let needsUpdate = false;

        if (investment.color !== snapshot.color) {
          investment.changeColor(snapshot.color);
          needsUpdate = true;
        }

        if (investment.icon !== snapshot.icon) {
          investment.changeIcon(snapshot.icon);
          needsUpdate = true;
        }

        // Optionally sync name if investment name matches old category name
        // (Skip this to allow investments to have different names)

        if (needsUpdate) {
          await this.investmentRepository.update(investment);
        }
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to sync investments from category update: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * When an Investment is updated, update the linked Category
   */
  async onInvestmentUpdated(investment: Investment): Promise<Result<void>> {
    try {
      const snapshot = investment.toSnapshot();

      if (!snapshot.categoryId) {
        return Result.ok(undefined);
      }

      const categoryIdResult = CategoryId.create(snapshot.categoryId);
      if (categoryIdResult.isFailure()) {
        return Result.fail(categoryIdResult.getError());
      }

      const categoryResult = await this.categoryRepository.findById(categoryIdResult.getValue());

      if (categoryResult.isFailure()) {
        return Result.fail(categoryResult.getError());
      }

      const category = categoryResult.getValue();
      if (!category || category.type !== CategoryType.INVESTMENT) {
        return Result.ok(undefined);
      }

      // Update category color/icon to match investment
      const categorySnapshot = category.toSnapshot();
      let needsUpdate = false;

      if (categorySnapshot.color !== snapshot.color) {
        needsUpdate = true;
      }

      if (categorySnapshot.icon !== snapshot.icon) {
        needsUpdate = true;
      }

      if (needsUpdate) {
        const updatedCategoryResult = Category.fromSnapshot({
          ...categorySnapshot,
          color: snapshot.color,
          icon: snapshot.icon,
        });

        if (updatedCategoryResult.isSuccess()) {
          await this.categoryRepository.update(updatedCategoryResult.getValue());
        }
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to sync category from investment update: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * When a Category is deleted (soft), deactivate linked Investments
   */
  async onCategoryDeleted(categoryId: string): Promise<Result<void>> {
    try {
      const investmentsResult = await this.investmentRepository.findByCategoryId(categoryId);

      if (investmentsResult.isFailure()) {
        return Result.fail(investmentsResult.getError());
      }

      const investments = investmentsResult.getValue();

      for (const investment of investments) {
        investment.deactivate();
        await this.investmentRepository.update(investment);
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to deactivate investments on category deletion: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * When an Investment is deleted (soft), deactivate linked Category if no other investments use it
   */
  async onInvestmentDeleted(investment: Investment): Promise<Result<void>> {
    try {
      const snapshot = investment.toSnapshot();

      if (!snapshot.categoryId) {
        return Result.ok(undefined);
      }

      // Check if other active investments use this category
      const investmentsResult = await this.investmentRepository.findByCategoryId(
        snapshot.categoryId
      );

      if (investmentsResult.isFailure()) {
        return Result.fail(investmentsResult.getError());
      }

      const activeInvestments = investmentsResult
        .getValue()
        .filter((inv) => inv.isActive && inv.id.value !== snapshot.id);

      // If no other active investments use this category, deactivate it
      if (activeInvestments.length === 0) {
        const categoryIdResult = CategoryId.create(snapshot.categoryId);
        if (categoryIdResult.isSuccess()) {
          await this.categoryRepository.delete(categoryIdResult.getValue());
        }
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to handle category on investment deletion: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sync all existing investments without categories - create categories for them
   */
  async syncAllInvestmentsToCategories(): Promise<Result<{ created: number; linked: number }>> {
    try {
      let created = 0;
      let linked = 0;

      // Get all active investments
      const investmentsResult = await this.investmentRepository.findWithFilters({ isActive: true });
      if (investmentsResult.isFailure()) {
        return Result.fail(investmentsResult.getError());
      }

      const investments = investmentsResult.getValue();

      for (const investment of investments) {
        const snapshot = investment.toSnapshot();

        // Skip if already linked
        if (snapshot.categoryId) {
          continue;
        }

        // Check if a category with same name exists
        const existsResult = await this.categoryRepository.existsByName(
          snapshot.name,
          CategoryType.INVESTMENT
        );

        if (existsResult.isFailure()) {
          console.warn(
            `Failed to check category existence for ${snapshot.name}:`,
            existsResult.getError()
          );
          continue;
        }

        if (existsResult.getValue()) {
          // Category exists, link them
          const categoriesResult = await this.categoryRepository.findWithFilters({
            type: CategoryType.INVESTMENT,
            searchTerm: snapshot.name,
            isActive: true,
          });

          if (categoriesResult.isSuccess() && categoriesResult.getValue().length > 0) {
            const category = categoriesResult.getValue()[0];
            investment.linkToCategory(category.id.value);
            await this.investmentRepository.update(investment);
            linked++;
          }
        } else {
          // Create new category
          const categoryId = crypto.randomUUID();
          const categorySnapshot: CategorySnapshot = {
            id: categoryId,
            name: snapshot.name,
            type: CategoryType.INVESTMENT,
            color: snapshot.color,
            icon: snapshot.icon,
            isActive: true,
            annualBudget: 0,
            createdAt: new Date().toISOString(),
          };

          const categoryResult = Category.fromSnapshot(categorySnapshot);
          if (categoryResult.isSuccess()) {
            const category = categoryResult.getValue();
            const saveResult = await this.categoryRepository.save(category);

            if (saveResult.isSuccess()) {
              investment.linkToCategory(categoryId);
              await this.investmentRepository.update(investment);
              created++;
            }
          }
        }
      }

      return Result.ok({ created, linked });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to sync investments to categories: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
