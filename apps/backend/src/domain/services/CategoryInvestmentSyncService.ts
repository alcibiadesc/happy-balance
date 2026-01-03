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
  async syncAllInvestmentsToCategories(): Promise<
    Result<{ created: number; linked: number; reactivated: number }>
  > {
    try {
      let created = 0;
      let linked = 0;
      let reactivated = 0;

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

        // Check if a category with same name exists (including inactive)
        const categoryResult = await this.categoryRepository.findByNameAndType(
          snapshot.name,
          CategoryType.INVESTMENT
        );

        if (categoryResult.isFailure()) {
          console.warn(`Failed to find category for ${snapshot.name}:`, categoryResult.getError());
          continue;
        }

        const existingCategory = categoryResult.getValue();

        if (existingCategory) {
          // Category exists - check if it's active
          if (!existingCategory.isActive) {
            // Reactivate the category
            const reactivateResult = await this.categoryRepository.reactivate(existingCategory.id);
            if (reactivateResult.isSuccess()) {
              reactivated++;
            }
          }
          // Link investment to category
          investment.linkToCategory(existingCategory.id.value);
          await this.investmentRepository.update(investment);
          linked++;
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

          const newCategoryResult = Category.fromSnapshot(categorySnapshot);
          if (newCategoryResult.isSuccess()) {
            const category = newCategoryResult.getValue();
            const saveResult = await this.categoryRepository.save(category);

            if (saveResult.isSuccess()) {
              investment.linkToCategory(categoryId);
              await this.investmentRepository.update(investment);
              created++;
            }
          }
        }
      }

      return Result.ok({ created, linked, reactivated });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to sync investments to categories: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sync all investment-type categories to investments - create investments from orphan categories
   */
  async syncAllCategoriesToInvestments(): Promise<
    Result<{
      investmentsCreated: number;
      investmentsLinked: number;
      investmentsReactivated: number;
    }>
  > {
    try {
      let investmentsCreated = 0;
      let investmentsLinked = 0;
      let investmentsReactivated = 0;

      // Get all active investment-type categories
      const categoriesResult = await this.categoryRepository.findWithFilters({
        type: CategoryType.INVESTMENT,
        isActive: true,
      });

      if (categoriesResult.isFailure()) {
        return Result.fail(categoriesResult.getError());
      }

      const categories = categoriesResult.getValue();

      for (const category of categories) {
        const catSnapshot = category.toSnapshot();

        // Check if any investment is already linked to this category
        const linkedInvestmentsResult = await this.investmentRepository.findByCategoryId(
          catSnapshot.id
        );

        if (linkedInvestmentsResult.isSuccess() && linkedInvestmentsResult.getValue().length > 0) {
          // Already has linked investments, skip
          continue;
        }

        // No linked investment - try to find by name or create new
        const investmentsResult = await this.investmentRepository.findWithFilters({
          searchTerm: catSnapshot.name,
        });

        if (investmentsResult.isFailure()) {
          console.warn(
            `Failed to find investment for category ${catSnapshot.name}:`,
            investmentsResult.getError()
          );
          continue;
        }

        const matchingInvestments = investmentsResult
          .getValue()
          .filter((inv) => inv.name.toLowerCase() === catSnapshot.name.toLowerCase());

        if (matchingInvestments.length > 0) {
          // Found matching investment by name
          const investment = matchingInvestments[0];
          const invSnapshot = investment.toSnapshot();

          if (!invSnapshot.isActive) {
            // Reactivate the investment
            investment.activate();
            investmentsReactivated++;
          }

          // Link if not already linked elsewhere
          if (!invSnapshot.categoryId) {
            investment.linkToCategory(catSnapshot.id);
            // Sync color/icon from category
            investment.changeColor(catSnapshot.color);
            investment.changeIcon(catSnapshot.icon);
            await this.investmentRepository.update(investment);
            investmentsLinked++;
          }
        } else {
          // No matching investment - create new one
          const investmentResult = Investment.create(
            catSnapshot.name,
            0, // Initial value is 0
            'EUR',
            this.userId,
            {
              categoryId: catSnapshot.id,
              color: catSnapshot.color,
              icon: catSnapshot.icon,
            }
          );

          if (investmentResult.isSuccess()) {
            const investment = investmentResult.getValue();
            const saveResult = await this.investmentRepository.save(investment);

            if (saveResult.isSuccess()) {
              investmentsCreated++;
            }
          }
        }
      }

      return Result.ok({ investmentsCreated, investmentsLinked, investmentsReactivated });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to sync categories to investments: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Sync metadata (name, color, icon) between linked investments and categories
   * Category is source of truth for name, investment syncs to match
   */
  async syncLinkedMetadata(): Promise<
    Result<{ namesUpdated: number; colorsUpdated: number; iconsUpdated: number }>
  > {
    try {
      let namesUpdated = 0;
      let colorsUpdated = 0;
      let iconsUpdated = 0;

      // Get all active investments with categoryId
      const investmentsResult = await this.investmentRepository.findWithFilters({ isActive: true });
      if (investmentsResult.isFailure()) {
        return Result.fail(investmentsResult.getError());
      }

      const investments = investmentsResult.getValue();

      for (const investment of investments) {
        const invSnapshot = investment.toSnapshot();

        if (!invSnapshot.categoryId) {
          continue;
        }

        // Get linked category
        const categoryIdResult = CategoryId.create(invSnapshot.categoryId);
        if (categoryIdResult.isFailure()) {
          continue;
        }

        const categoryResult = await this.categoryRepository.findById(categoryIdResult.getValue());
        if (categoryResult.isFailure() || !categoryResult.getValue()) {
          continue;
        }

        const category = categoryResult.getValue()!;
        const catSnapshot = category.toSnapshot();

        let investmentNeedsUpdate = false;
        let categoryNeedsUpdate = false;

        // Sync name: category → investment (category is source of truth for display name)
        if (invSnapshot.name !== catSnapshot.name) {
          investment.rename(catSnapshot.name);
          investmentNeedsUpdate = true;
          namesUpdated++;
        }

        // Sync color: bidirectional, prefer the one that's not default
        const defaultColor = '#3B82F6';
        if (invSnapshot.color !== catSnapshot.color) {
          if (catSnapshot.color !== defaultColor) {
            // Category has custom color, apply to investment
            investment.changeColor(catSnapshot.color);
            investmentNeedsUpdate = true;
          } else if (invSnapshot.color !== defaultColor) {
            // Investment has custom color, apply to category
            categoryNeedsUpdate = true;
          }
          colorsUpdated++;
        }

        // Sync icon: bidirectional, prefer the one that's not default
        const defaultIcon = '💰';
        if (invSnapshot.icon !== catSnapshot.icon) {
          if (catSnapshot.icon !== defaultIcon) {
            // Category has custom icon, apply to investment
            investment.changeIcon(catSnapshot.icon);
            investmentNeedsUpdate = true;
          } else if (invSnapshot.icon !== defaultIcon) {
            // Investment has custom icon, apply to category
            categoryNeedsUpdate = true;
          }
          iconsUpdated++;
        }

        // Save updates
        if (investmentNeedsUpdate) {
          await this.investmentRepository.update(investment);
        }

        if (categoryNeedsUpdate) {
          const updatedCategoryResult = Category.fromSnapshot({
            ...catSnapshot,
            color: invSnapshot.color !== defaultColor ? invSnapshot.color : catSnapshot.color,
            icon: invSnapshot.icon !== defaultIcon ? invSnapshot.icon : catSnapshot.icon,
          });

          if (updatedCategoryResult.isSuccess()) {
            await this.categoryRepository.update(updatedCategoryResult.getValue());
          }
        }
      }

      return Result.ok({ namesUpdated, colorsUpdated, iconsUpdated });
    } catch (error) {
      return Result.failWithMessage(
        `Failed to sync linked metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Full bidirectional sync between investments and categories
   * 1. Link unlinked investments to categories (create if needed)
   * 2. Link unlinked categories to investments (create if needed)
   * 3. Sync metadata (name, color, icon) for all linked pairs
   */
  async fullSync(): Promise<Result<FullSyncResult>> {
    try {
      console.log('[CategoryInvestmentSync] Starting full bidirectional sync...');

      // Phase 1: Investments → Categories
      const invToCatResult = await this.syncAllInvestmentsToCategories();
      if (invToCatResult.isFailure()) {
        return Result.fail(invToCatResult.getError());
      }
      const invToCat = invToCatResult.getValue();
      console.log(
        `[CategoryInvestmentSync] Phase 1 complete: ${invToCat.created} categories created, ${invToCat.linked} linked`
      );

      // Phase 2: Categories → Investments
      const catToInvResult = await this.syncAllCategoriesToInvestments();
      if (catToInvResult.isFailure()) {
        return Result.fail(catToInvResult.getError());
      }
      const catToInv = catToInvResult.getValue();
      console.log(
        `[CategoryInvestmentSync] Phase 2 complete: ${catToInv.investmentsCreated} investments created, ${catToInv.investmentsLinked} linked`
      );

      // Phase 3: Sync metadata for linked pairs
      const metadataResult = await this.syncLinkedMetadata();
      if (metadataResult.isFailure()) {
        return Result.fail(metadataResult.getError());
      }
      const metadata = metadataResult.getValue();
      console.log(
        `[CategoryInvestmentSync] Phase 3 complete: ${metadata.namesUpdated} names, ${metadata.colorsUpdated} colors, ${metadata.iconsUpdated} icons updated`
      );

      const result: FullSyncResult = {
        categoriesCreated: invToCat.created,
        categoriesLinked: invToCat.linked,
        categoriesReactivated: invToCat.reactivated,
        investmentsCreated: catToInv.investmentsCreated,
        investmentsLinked: catToInv.investmentsLinked,
        investmentsReactivated: catToInv.investmentsReactivated,
        namesUpdated: metadata.namesUpdated,
        colorsUpdated: metadata.colorsUpdated,
        iconsUpdated: metadata.iconsUpdated,
      };

      console.log('[CategoryInvestmentSync] Full sync complete:', result);

      return Result.ok(result);
    } catch (error) {
      return Result.failWithMessage(
        `Failed to perform full sync: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Result of a full bidirectional sync operation
 */
export interface FullSyncResult {
  // Investments → Categories
  categoriesCreated: number;
  categoriesLinked: number;
  categoriesReactivated: number;
  // Categories → Investments
  investmentsCreated: number;
  investmentsLinked: number;
  investmentsReactivated: number;
  // Metadata sync
  namesUpdated: number;
  colorsUpdated: number;
  iconsUpdated: number;
}
