import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaSavingsAccountRepository } from '../../../lib/infrastructure/repositories/PrismaSavingsAccountRepository.js';
import { SavingsAccount, SavingsAccountType } from '../../../lib/domain/entities/SavingsAccount.js';
import { SavingsAccountId } from '../../../lib/domain/value-objects/SavingsAccountId.js';
import { Money } from '../../../lib/domain/value-objects/Money.js';

const savingsAccountRepository = new PrismaSavingsAccountRepository();

export const GET: RequestHandler = async ({ url }) => {
	try {
		const activeOnly = url.searchParams.get('active') === 'true';
		
		const savingsAccounts = activeOnly 
			? await savingsAccountRepository.findActive()
			: await savingsAccountRepository.findAll();

		return json({
			savingsAccounts: savingsAccounts.map(account => account.toPlainObject())
		});
	} catch (error) {
		console.error('Error fetching savings accounts:', error);
		return json({ error: 'Failed to fetch savings accounts' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		
		// Validate required fields
		if (!body.name || !body.type || !body.balance || !body.currency) {
			return json({ error: 'Missing required fields: name, type, balance, currency' }, { status: 400 });
		}

		// Validate savings account type
		if (!Object.values(SavingsAccountType).includes(body.type)) {
			return json({ error: 'Invalid savings account type' }, { status: 400 });
		}

		// Create domain entity
		const savingsAccountData = {
			id: SavingsAccountId.generate(),
			name: body.name,
			type: body.type as SavingsAccountType,
			balance: new Money(Number(body.balance), body.currency),
			goalAmount: body.goalAmount ? new Money(Number(body.goalAmount), body.currency) : undefined,
			currency: body.currency,
			isActive: body.isActive !== undefined ? body.isActive : true,
			description: body.description,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		const savingsAccount = new SavingsAccount(savingsAccountData);
		const savedAccount = await savingsAccountRepository.save(savingsAccount);

		return json({
			savingsAccount: savedAccount.toPlainObject()
		}, { status: 201 });
	} catch (error) {
		console.error('Error creating savings account:', error);
		return json({ error: 'Failed to create savings account' }, { status: 500 });
	}
};