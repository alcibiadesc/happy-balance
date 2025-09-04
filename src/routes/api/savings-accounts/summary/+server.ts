import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaSavingsAccountRepository } from '../../../../lib/infrastructure/repositories/PrismaSavingsAccountRepository.js';

const savingsAccountRepository = new PrismaSavingsAccountRepository();

export const GET: RequestHandler = async ({ url }) => {
	try {
		const currency = url.searchParams.get('currency') || 'EUR';
		
		// Get all active savings accounts
		const savingsAccounts = await savingsAccountRepository.findActive();
		
		// Filter by currency
		const accountsInCurrency = savingsAccounts.filter(account => account.currency === currency);
		
		// Calculate totals
		const totalBalance = accountsInCurrency.reduce(
			(sum, account) => sum + account.balance.amount, 
			0
		);
		
		const totalGoalAmount = accountsInCurrency.reduce(
			(sum, account) => sum + (account.goalAmount?.amount || 0), 
			0
		);
		
		// Calculate overall progress
		const overallProgress = totalGoalAmount > 0 ? Math.min(totalBalance / totalGoalAmount, 1) : 0;
		
		// Financial freedom calculations (4% rule)
		const annualWithdrawCapacity = totalBalance * 0.04;
		const monthlyWithdrawCapacity = annualWithdrawCapacity / 12;
		
		// Group by account type
		const accountsByType = accountsInCurrency.reduce((acc, account) => {
			const typeName = account.getTypeDisplayName();
			if (!acc[typeName]) {
				acc[typeName] = {
					count: 0,
					totalBalance: 0,
					totalGoal: 0
				};
			}
			acc[typeName].count++;
			acc[typeName].totalBalance += account.balance.amount;
			acc[typeName].totalGoal += account.goalAmount?.amount || 0;
			return acc;
		}, {} as Record<string, { count: number; totalBalance: number; totalGoal: number }>);
		
		return json({
			currency,
			totalAccounts: accountsInCurrency.length,
			totalBalance,
			totalGoalAmount,
			remainingToGoal: Math.max(0, totalGoalAmount - totalBalance),
			overallProgress,
			financialFreedom: {
				annualWithdrawCapacity,
				monthlyWithdrawCapacity,
				yearsOfExpensesCovered: 0 // Will be calculated with actual expense data
			},
			accountsByType,
			accounts: accountsInCurrency.map(account => account.toPlainObject())
		});
	} catch (error) {
		console.error('Error fetching savings summary:', error);
		return json({ error: 'Failed to fetch savings summary' }, { status: 500 });
	}
};