import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RepositoryFactory } from '$lib/infrastructure/factories/RepositoryFactory.js';

const transactionRepository = RepositoryFactory.createTransactionRepository();

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const period = searchParams.get('period') || 'current_month';
    const categoryId = searchParams.get('categoryId');
    
    // Calculate date range based on period
    const { startDate, endDate } = getDateRange(period);
    
    // Get transactions for the period
    const transactions = await transactionRepository.findAll({
      startDate,
      endDate
    });
    
    // Filter out OMIT transactions and group by category
    const includedTransactions = transactions.filter(t => 
      t.category?.name !== 'Omitir' &&
      t.category?.type !== 'OMIT'
    );
    
    // Calculate spending by category
    const categorySpending = new Map<string, { amount: number; count: number; category: any }>();
    
    for (const transaction of includedTransactions) {
      // Only count expenses (negative amounts)
      if (transaction.amount >= 0) continue;
      
      const categoryKey = transaction.categoryId || 'uncategorized';
      const spending = Math.abs(transaction.amount);
      
      if (categorySpending.has(categoryKey)) {
        const existing = categorySpending.get(categoryKey)!;
        existing.amount += spending;
        existing.count += 1;
      } else {
        categorySpending.set(categoryKey, {
          amount: spending,
          count: 1,
          category: transaction.category || { name: 'Sin categoría', type: 'DISCRETIONARY_EXPENSE' }
        });
      }
    }
    
    // Convert to array format
    const spendingData = Array.from(categorySpending.entries())
      .map(([categoryId, data]) => ({
        categoryId: categoryId === 'uncategorized' ? null : categoryId,
        categoryName: data.category.name,
        categoryType: data.category.type,
        amount: data.amount,
        transactionCount: data.count,
        percentage: 0 // Will be calculated on frontend if needed
      }))
      .sort((a, b) => b.amount - a.amount);
    
    // Filter by specific category if requested
    const filteredData = categoryId ? 
      spendingData.filter(item => item.categoryId === categoryId) : 
      spendingData;
    
    return json({
      success: true,
      data: filteredData,
      period,
      dateRange: { startDate, endDate },
      totalSpending: spendingData.reduce((sum, item) => sum + item.amount, 0)
    });

  } catch (error) {
    console.error('Error calculating category spending:', error);
    return json(
      {
        success: false,
        error: 'Failed to calculate category spending',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

function getDateRange(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date, endDate: Date;

  switch (period) {
    case 'current_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'current_quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      startDate = quarterStart;
      endDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
      break;
    case 'last_quarter':
      const lastQuarterMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
      const year = lastQuarterMonth < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const month = lastQuarterMonth < 0 ? 9 : lastQuarterMonth;
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 3, 0);
      break;
    case 'current_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    case 'last_year':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return { startDate, endDate };
}