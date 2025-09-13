import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { PrismaCategoryRepository } from '$lib/infrastructure/repositories/PrismaCategoryRepository.js';
import { PrismaSavingsAccountRepository } from '$lib/infrastructure/repositories/PrismaSavingsAccountRepository.js';

const transactionRepository = new PrismaTransactionRepository();
const categoryRepository = new PrismaCategoryRepository();
const savingsAccountRepository = new PrismaSavingsAccountRepository();

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const period = searchParams.get('period') || 'current_month';
    
    // Calculate date range based on period
    const { startDate, endDate } = getDateRange(period);
    
    // Get transactions for the period
    const transactions = await transactionRepository.findAll({
      startDate,
      endDate
    });
    
    // Get transactions for comparison (previous period)
    const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousDateRange(period);
    const previousTransactions = await transactionRepository.findAll({
      startDate: prevStartDate,
      endDate: prevEndDate
    });
    
    // Calculate basic metrics
    const currentMetrics = calculateMetrics(transactions);
    const previousMetrics = calculateMetrics(previousTransactions);
    
    // Calculate trends with NaN protection
    const trends = calculateTrends(currentMetrics, previousMetrics);
    
    // Get category breakdown
    const categoryBreakdown = await getCategoryBreakdown(transactions);
    
    // Get monthly breakdown for trend analysis
    const monthlyBreakdown = await getMonthlyBreakdown(period);
    
    // Get savings data
    const savingsAccounts = await savingsAccountRepository.findActive();
    const totalSavings = savingsAccounts.reduce((sum, account) => sum + account.balance.amount, 0);
    
    // Enhanced financial freedom calculations
    const enhancedFinancialFreedom = calculateEnhancedFinancialFreedom(currentMetrics, totalSavings);
    
    // Calculate safe values with comprehensive NaN protection
    const safeIncome = Number(currentMetrics.income) || 0;
    const safeExpenses = Math.abs(Number(currentMetrics.expenses) || 0);
    
    // Calculate savings rate with protection
    let savingsRate = 0;
    if (safeIncome > 0) {
      const netSavings = safeIncome - safeExpenses;
      savingsRate = Math.max(0, Math.min(1, netSavings / safeIncome));
    }
    
    // Calculate expense ratio with protection
    let expenseRatio = 0;
    if (safeIncome > 0) {
      expenseRatio = Math.max(0, Math.min(1, safeExpenses / safeIncome));
    }

    const analyticsData = {
      monthlyIncome: safeIncome,
      monthlyExpenses: safeExpenses,
      savingsRate: isFinite(savingsRate) ? savingsRate : 0,
      expenseRatio: isFinite(expenseRatio) ? expenseRatio : 0,
      financialFreedomProgress: Number(enhancedFinancialFreedom.progress) || 0,
      monthlyBreakdown,
      categoryBreakdown,
      trends,
      savingsData: {
        totalSavings: Number(totalSavings) || 0,
        accountCount: Number(savingsAccounts.length) || 0,
        monthlyWithdrawCapacity: Number(enhancedFinancialFreedom.monthlyWithdrawCapacity) || 0,
        yearsOfExpensesCovered: Number(enhancedFinancialFreedom.yearsOfExpensesCovered) || 0,
        targetAmount: Number(enhancedFinancialFreedom.targetAmount) || 0,
        remainingToTarget: Number(enhancedFinancialFreedom.remainingToTarget) || 0
      }
    };
    
    return json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Error calculating dashboard analytics:', error);
    return json(
      {
        success: false,
        error: 'Failed to calculate analytics',
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
    case 'last_3_months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'last_6_months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return { startDate, endDate };
}

function getPreviousDateRange(period: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  let startDate: Date, endDate: Date;

  switch (period) {
    case 'current_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() - 1, 0);
      break;
    case 'last_3_months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() - 3, 0);
      break;
    case 'last_6_months':
      startDate = new Date(now.getFullYear() - 1, now.getMonth() - 6, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() - 6, 0);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
  }

  return { startDate, endDate };
}

function calculateMetrics(transactions: any[]): {
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
} {
  // Filter out OMIT transactions and hidden transactions
  const includedTransactions = transactions.filter(t => 
    !t.isHidden && // Exclude hidden transactions
    t.category?.name !== 'Omitir' && 
    t.category?.type !== 'OMIT'
  );

  const income = includedTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const expenses = includedTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Ensure all values are finite numbers
  const safeIncome = isFinite(income) ? income : 0;
  const safeExpenses = isFinite(expenses) ? expenses : 0;
  const safeBalance = safeIncome + safeExpenses;

  return {
    income: safeIncome,
    expenses: safeExpenses,
    balance: isFinite(safeBalance) ? safeBalance : 0,
    transactionCount: includedTransactions.length
  };
}

function calculateTrends(current: any, previous: any): {
  incomeGrowth: number;
  expenseGrowth: number;
  savingsGrowth: number;
} {
  // Protect against NaN and Infinity values
  const safeIncomeGrowth = previous.income > 0 
    ? Math.max(-1, Math.min(10, (current.income - previous.income) / previous.income))
    : 0;

  const safeExpenseGrowth = previous.expenses !== 0 
    ? Math.max(-1, Math.min(10, (Math.abs(current.expenses) - Math.abs(previous.expenses)) / Math.abs(previous.expenses)))
    : 0;

  const currentSavings = current.income - Math.abs(current.expenses);
  const previousSavings = previous.income - Math.abs(previous.expenses);
  const safeSavingsGrowth = previousSavings !== 0 
    ? Math.max(-1, Math.min(10, (currentSavings - previousSavings) / Math.abs(previousSavings)))
    : 0;

  return {
    incomeGrowth: isFinite(safeIncomeGrowth) ? safeIncomeGrowth : 0,
    expenseGrowth: isFinite(safeExpenseGrowth) ? safeExpenseGrowth : 0,
    savingsGrowth: isFinite(safeSavingsGrowth) ? safeSavingsGrowth : 0
  };
}

async function getCategoryBreakdown(transactions: any[]): Promise<any[]> {
  const categoryTotals = new Map<string, { amount: number; count: number; category: any }>();

  // Filter out OMIT transactions and hidden transactions, then group by category
  const includedTransactions = transactions.filter(t => 
    !t.isHidden && // Exclude hidden transactions
    t.category?.name !== 'Omitir' &&
    t.category?.type !== 'OMIT'
  );

  for (const transaction of includedTransactions) {
    const categoryId = transaction.categoryId || 'uncategorized';
    const categoryName = transaction.category?.name || 'Sin categoría';
    
    if (categoryTotals.has(categoryId)) {
      const existing = categoryTotals.get(categoryId)!;
      existing.amount += Math.abs(transaction.amount);
      existing.count += 1;
    } else {
      categoryTotals.set(categoryId, {
        amount: Math.abs(transaction.amount),
        count: 1,
        category: transaction.category || { name: 'Sin categoría', type: 'DISCRETIONARY_EXPENSE' }
      });
    }
  }

  // Convert to array and sort by amount
  return Array.from(categoryTotals.entries())
    .map(([id, data]) => ({
      categoryId: id,
      categoryName: data.category.name,
      categoryType: data.category.type,
      amount: data.amount,
      transactionCount: data.count,
      percentage: 0 // Will be calculated on frontend
    }))
    .sort((a, b) => b.amount - a.amount);
}

function calculateEnhancedFinancialFreedom(metrics: any, totalSavings: number): {
  progress: number;
  monthlyWithdrawCapacity: number;
  yearsOfExpensesCovered: number;
  targetAmount: number;
  remainingToTarget: number;
} {
  const monthlyExpenses = Math.abs(metrics.expenses);
  const annualExpenses = monthlyExpenses * 12;
  
  // 4% rule: need 25x annual expenses
  const targetAmount = annualExpenses * 25;
  
  // Current withdrawal capacity (4% of savings annually)
  const annualWithdrawCapacity = totalSavings * 0.04;
  const monthlyWithdrawCapacity = annualWithdrawCapacity / 12;
  
  // Years of expenses covered by current savings
  const yearsOfExpensesCovered = annualExpenses > 0 ? totalSavings / annualExpenses : 0;
  
  // Progress toward financial freedom
  const progress = targetAmount > 0 ? Math.min(1, totalSavings / targetAmount) : 0;
  
  // Remaining amount to reach target
  const remainingToTarget = Math.max(0, targetAmount - totalSavings);
  
  return {
    progress: isFinite(progress) ? progress : 0,
    monthlyWithdrawCapacity: isFinite(monthlyWithdrawCapacity) ? monthlyWithdrawCapacity : 0,
    yearsOfExpensesCovered: isFinite(yearsOfExpensesCovered) ? yearsOfExpensesCovered : 0,
    targetAmount: isFinite(targetAmount) ? targetAmount : 0,
    remainingToTarget: isFinite(remainingToTarget) ? remainingToTarget : 0
  };
}

async function getMonthlyBreakdown(period: string): Promise<any[]> {
  try {
    const now = new Date();
    let months: { startDate: Date; endDate: Date; label: string }[] = [];
    
    // Generate monthly data based on the period
    switch (period) {
      case 'current_month':
      case 'last_month':
        // For single month periods, show the last 6 months
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          months.push({
            startDate: monthStart,
            endDate: monthEnd,
            label: monthStart.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
          });
        }
        break;
        
      case 'last_3_months':
        // Show the last 3 months
        for (let i = 2; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          months.push({
            startDate: monthStart,
            endDate: monthEnd,
            label: monthStart.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
          });
        }
        break;
        
      case 'last_6_months':
        // Show the last 6 months
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          months.push({
            startDate: monthStart,
            endDate: monthEnd,
            label: monthStart.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
          });
        }
        break;
        
      case 'this_year':
        // Show all months in the current year
        for (let i = 0; i < now.getMonth() + 1; i++) {
          const monthStart = new Date(now.getFullYear(), i, 1);
          const monthEnd = new Date(now.getFullYear(), i + 1, 0);
          months.push({
            startDate: monthStart,
            endDate: monthEnd,
            label: monthStart.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
          });
        }
        break;
        
      default:
        // Default to last 6 months
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
          months.push({
            startDate: monthStart,
            endDate: monthEnd,
            label: monthStart.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
          });
        }
    }
    
    // Calculate metrics for each month
    const monthlyData = await Promise.all(
      months.map(async (month) => {
        const transactions = await transactionRepository.findAll({
          startDate: month.startDate,
          endDate: month.endDate
        });
        
        const metrics = calculateMetrics(transactions);
        
        return {
          month: month.label,
          income: Number(metrics.income) || 0,
          expenses: Math.abs(Number(metrics.expenses) || 0),
          balance: Number(metrics.balance) || 0,
          transactionCount: Number(metrics.transactionCount) || 0,
          savingsRate: metrics.income > 0 ? Math.max(0, (metrics.income - Math.abs(metrics.expenses)) / metrics.income) : 0
        };
      })
    );
    
    return monthlyData;
    
  } catch (error) {
    console.error('Error calculating monthly breakdown:', error);
    return [];
  }
}