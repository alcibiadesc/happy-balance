import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaTransactionRepository } from '$lib/infrastructure/repositories/PrismaTransactionRepository.js';
import { PrismaCategoryRepository } from '$lib/infrastructure/repositories/PrismaCategoryRepository.js';

const transactionRepository = new PrismaTransactionRepository();
const categoryRepository = new PrismaCategoryRepository();

// GET /api/analytics/flows - Get flow analysis data
export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    
    // Parse date range (default to last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    
    const period = searchParams.get('period') || '30d';
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default: // 30d
        startDate.setDate(endDate.getDate() - 30);
    }

    // Get all transactions in date range
    const transactions = await transactionRepository.findByDateRange(startDate, endDate);
    
    // Separate income and expenses
    const incomeTransactions = transactions.filter(t => t.amount > 0);
    const expenseTransactions = transactions.filter(t => t.amount < 0);
    
    // Calculate totals
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(expenseTransactions.reduce((sum, t) => sum + t.amount, 0));
    const netFlow = totalIncome - totalExpenses;
    
    // Get category totals
    const categoryTotals = await transactionRepository.getCategoryTotals(startDate, endDate);
    const categories = await categoryRepository.findAll();
    
    // Process income sources
    const incomeBySource = new Map<string, { amount: number; count: number }>();
    incomeTransactions.forEach(t => {
      const category = categories.find(c => c.id.value === t.categoryId);
      const sourceName = category?.name || 'Sin categoría';
      
      if (!incomeBySource.has(sourceName)) {
        incomeBySource.set(sourceName, { amount: 0, count: 0 });
      }
      
      const source = incomeBySource.get(sourceName)!;
      source.amount += t.amount;
      source.count += 1;
    });

    const incomeData = Array.from(incomeBySource.entries())
      .map(([source, data]) => ({
        source,
        amount: data.amount,
        percentage: totalIncome > 0 ? Math.round((data.amount / totalIncome) * 100) : 0,
        trend: 'stable' // TODO: Calculate trend by comparing with previous period
      }))
      .sort((a, b) => b.amount - a.amount);

    // Process expense categories
    const expenseByCategory = new Map<string, { amount: number; count: number }>();
    expenseTransactions.forEach(t => {
      const category = categories.find(c => c.id.value === t.categoryId);
      const categoryName = category?.name || 'Sin categoría';
      
      if (!expenseByCategory.has(categoryName)) {
        expenseByCategory.set(categoryName, { amount: 0, count: 0 });
      }
      
      const expense = expenseByCategory.get(categoryName)!;
      expense.amount += Math.abs(t.amount);
      expense.count += 1;
    });

    const expenseData = Array.from(expenseByCategory.entries())
      .map(([category, data]) => {
        const categoryInfo = categories.find(c => c.name === category);
        const isEssential = categoryInfo?.type === 'ESSENTIAL_EXPENSE';
        
        return {
          category,
          amount: data.amount,
          percentage: totalExpenses > 0 ? Math.round((data.amount / totalExpenses) * 100) : 0,
          essential: isEssential
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Get top merchants/partners
    const topMerchants = await transactionRepository.findTopPartners(10, startDate, endDate);
    
    // Process merchants data (only expenses for merchant analysis)
    const merchantData = topMerchants
      .filter(m => m.total < 0) // Only expenses
      .map(m => ({
        name: m.partnerName,
        amount: Math.abs(m.total),
        transactions: m.count
      }))
      .slice(0, 5); // Top 5 merchants

    return json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          netFlow,
          transactionCount: transactions.length,
          period
        },
        incomeData: incomeData.slice(0, 10), // Top 10 income sources
        expenseData: expenseData.slice(0, 10), // Top 10 expense categories
        topMerchants: merchantData
      }
    });

  } catch (error) {
    console.error('Error fetching flow analytics:', error);
    return json(
      { 
        success: false, 
        error: 'Failed to fetch flow analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};