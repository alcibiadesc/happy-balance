import { Result } from '$lib/shared/utils/result.js';
import { DomainError } from '$lib/shared/errors/DomainError.js';
import { Money } from '$lib/domain/value-objects/Money.js';
import { TransactionDate } from '$lib/domain/value-objects/TransactionDate.js';
import { TransactionRepository } from '$lib/domain/repositories/TransactionRepository.js';
import { AccountRepository } from '$lib/domain/repositories/IAccountRepository.js';
import { CategoryRepository } from '$lib/domain/repositories/CategoryRepository.js';
import { Logger } from '$lib/shared/utils/logger.js';

export interface DashboardMetrics {
	readonly totalIncome: Money;
	readonly totalExpenses: Money;
	readonly netIncome: Money;
	readonly savingsRate: number;
	readonly accountBalances: AccountBalance[];
	readonly topCategories: CategorySpending[];
	readonly monthlyTrends: MonthlyTrend[];
	readonly period: {
		readonly start: TransactionDate;
		readonly end: TransactionDate;
	};
}

export interface AccountBalance {
	readonly accountId: string;
	readonly accountName: string;
	readonly balance: Money;
	readonly isActive: boolean;
}

export interface CategorySpending {
	readonly categoryId: string;
	readonly categoryName: string;
	readonly amount: Money;
	readonly percentage: number;
	readonly transactionCount: number;
}

export interface MonthlyTrend {
	readonly month: string;
	readonly year: number;
	readonly income: Money;
	readonly expenses: Money;
	readonly net: Money;
}

export interface DashboardQueryParams {
	readonly startDate?: Date;
	readonly endDate?: Date;
	readonly accountIds?: string[];
	readonly currency?: string;
}

export interface DashboardQueryDependencies {
	transactionRepository: TransactionRepository;
	accountRepository: AccountRepository;
	categoryRepository: CategoryRepository;
	logger: Logger;
}

export class DashboardQuery {
	constructor(private readonly deps: DashboardQueryDependencies) {}

	async execute(params: DashboardQueryParams = {}): Promise<Result<DashboardMetrics, DomainError>> {
		this.deps.logger.info('Executing dashboard query', params);

		try {
			const currency = params.currency || 'EUR';
			
			// Default to current month if no dates provided
			const endDate = params.endDate || new Date();
			const startDate = params.startDate || new Date(endDate.getFullYear(), endDate.getMonth(), 1);

			const period = {
				start: TransactionDate.create(startDate).value,
				end: TransactionDate.create(endDate).value
			};

			// Execute queries in parallel for better performance
			const [
				totalIncome,
				totalExpenses,
				accountBalances,
				categorySpending,
				monthlyTrends
			] = await Promise.all([
				this.calculateTotalIncome(period, params.accountIds, currency),
				this.calculateTotalExpenses(period, params.accountIds, currency),
				this.getAccountBalances(params.accountIds, currency),
				this.getTopCategories(period, params.accountIds, currency),
				this.getMonthlyTrends(period, params.accountIds, currency)
			]);

			// Calculate derived metrics
			const netIncomeResult = totalIncome.subtract(totalExpenses);
			if (netIncomeResult.isFailure()) {
				return Result.failure(netIncomeResult.error);
			}

			const netIncome = netIncomeResult.value;
			const savingsRate = totalIncome.isZero 
				? 0 
				: (netIncome.amount / totalIncome.amount) * 100;

			const metrics: DashboardMetrics = {
				totalIncome,
				totalExpenses,
				netIncome,
				savingsRate: Math.round(savingsRate * 100) / 100, // Round to 2 decimals
				accountBalances,
				topCategories: categorySpending,
				monthlyTrends,
				period
			};

			this.deps.logger.info('Dashboard query completed', { 
				income: totalIncome.format(), 
				expenses: totalExpenses.format(),
				savingsRate: `${savingsRate.toFixed(2)}%`
			});

			return Result.success(metrics);

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error in dashboard query';
			this.deps.logger.error('Dashboard query failed', error);
			return Result.failure(new DomainError(errorMessage));
		}
	}

	private async calculateTotalIncome(
		period: { start: TransactionDate; end: TransactionDate }, 
		accountIds?: string[], 
		currency: string = 'EUR'
	): Promise<Money> {
		const total = await this.deps.transactionRepository.sumByAmountRange(
			period.start.value,
			period.end.value,
			{ minAmount: 0, accountIds }
		);
		return total || Money.zero(currency).value;
	}

	private async calculateTotalExpenses(
		period: { start: TransactionDate; end: TransactionDate }, 
		accountIds?: string[], 
		currency: string = 'EUR'
	): Promise<Money> {
		const total = await this.deps.transactionRepository.sumByAmountRange(
			period.start.value,
			period.end.value,
			{ maxAmount: 0, accountIds }
		);
		
		if (total) {
			const absResult = total.abs();
			return absResult.isSuccess() ? absResult.value : Money.zero(currency).value;
		}
		
		return Money.zero(currency).value;
	}

	private async getAccountBalances(accountIds?: string[], currency: string = 'EUR'): Promise<AccountBalance[]> {
		const accounts = await this.deps.accountRepository.findAll({ 
			isActive: true, 
			ids: accountIds 
		});

		return accounts.map(account => ({
			accountId: account.id.value,
			accountName: account.name,
			balance: account.balance,
			isActive: account.isActive
		}));
	}

	private async getTopCategories(
		period: { start: TransactionDate; end: TransactionDate }, 
		accountIds?: string[], 
		currency: string = 'EUR',
		limit: number = 10
	): Promise<CategorySpending[]> {
		const categoryStats = await this.deps.transactionRepository.groupByCategory(
			period.start.value,
			period.end.value,
			{ accountIds, limit }
		);

		const categories = await this.deps.categoryRepository.findByIds(
			categoryStats.map(stat => stat.categoryId).filter(Boolean)
		);

		const categoryMap = new Map(categories.map(cat => [cat.id.value, cat]));
		const totalExpenses = categoryStats.reduce((sum, stat) => sum + Math.abs(stat.amount.amount), 0);

		return categoryStats.map(stat => {
			const category = categoryMap.get(stat.categoryId);
			const percentage = totalExpenses > 0 
				? (Math.abs(stat.amount.amount) / totalExpenses) * 100 
				: 0;

			return {
				categoryId: stat.categoryId,
				categoryName: category?.name || 'Uncategorized',
				amount: stat.amount,
				percentage: Math.round(percentage * 100) / 100,
				transactionCount: stat.count
			};
		});
	}

	private async getMonthlyTrends(
		period: { start: TransactionDate; end: TransactionDate }, 
		accountIds?: string[], 
		currency: string = 'EUR'
	): Promise<MonthlyTrend[]> {
		const monthlyData = await this.deps.transactionRepository.groupByMonth(
			period.start.value,
			period.end.value,
			{ accountIds }
		);

		return monthlyData.map(data => {
			const expensesAbs = data.expenses.abs();
			const netResult = data.income.subtract(expensesAbs.isSuccess() ? expensesAbs.value : data.expenses);

			return {
				month: data.month,
				year: data.year,
				income: data.income,
				expenses: expensesAbs.isSuccess() ? expensesAbs.value : Money.zero(currency).value,
				net: netResult.isSuccess() ? netResult.value : Money.zero(currency).value
			};
		});
	}
}