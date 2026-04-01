import { TransactionSnapshot } from '../../domain/entities/Transaction';
import { Category, CategoryId } from '../../domain/entities/Category';
import { SmartCategorizationService } from '../../domain/services/SmartCategorizationService';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';

export interface GetCategorySuggestionsRequest {
  userId: string;
  limit?: number; // default 50
}

export interface CategorySuggestionItem {
  transaction: TransactionSnapshot;
  suggestion: {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    categoryType: string;
    confidence: number;
    matchedOn: 'alias' | 'pattern';
  } | null;
}

export interface GetCategorySuggestionsResponse {
  suggestions: CategorySuggestionItem[];
  totalUncategorized: number;
}

export class GetCategorySuggestionsUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly smartCategorizationService: SmartCategorizationService
  ) {}

  async execute(request: GetCategorySuggestionsRequest): Promise<GetCategorySuggestionsResponse> {
    const limit = request.limit ?? 50;

    // Fetch uncategorized transactions
    const result = await this.transactionRepository.findWithFilters(
      { categoryId: null as any, includeHidden: false },
      { offset: 0, limit: 10000 }
    );

    const allUncategorized = result.isSuccess() ? result.getValue().transactions : [];
    const totalUncategorized = allUncategorized.length;

    // Take only up to the requested limit
    const transactions = allUncategorized.slice(0, limit);

    // Build suggestions with category details
    const suggestions: CategorySuggestionItem[] = [];
    // Cache category lookups to avoid repeated DB calls
    const categoryCache = new Map<string, Category | null>();

    for (const transaction of transactions) {
      const categorySuggestion = await this.smartCategorizationService.suggestCategory(
        transaction,
        request.userId
      );

      let suggestionItem: CategorySuggestionItem['suggestion'] = null;

      if (categorySuggestion) {
        let category = categoryCache.get(categorySuggestion.categoryId);
        if (category === undefined) {
          const catIdResult = CategoryId.create(categorySuggestion.categoryId);
          if (catIdResult.isSuccess()) {
            const catResult = await this.categoryRepository.findById(catIdResult.getValue());
            category = catResult.isSuccess() ? catResult.getValue() : null;
          } else {
            category = null;
          }
          categoryCache.set(categorySuggestion.categoryId, category);
        }

        if (category) {
          const catSnapshot = category.toSnapshot();
          suggestionItem = {
            categoryId: catSnapshot.id,
            categoryName: catSnapshot.name,
            categoryIcon: catSnapshot.icon,
            categoryColor: catSnapshot.color,
            categoryType: catSnapshot.type,
            confidence: categorySuggestion.confidence,
            matchedOn: categorySuggestion.matchedOn,
          };
        }
      }

      suggestions.push({
        transaction: transaction.toSnapshot(),
        suggestion: suggestionItem,
      });
    }

    return {
      suggestions,
      totalUncategorized,
    };
  }
}
