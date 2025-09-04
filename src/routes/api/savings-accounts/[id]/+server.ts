import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaSavingsAccountRepository } from '../../../../lib/infrastructure/repositories/PrismaSavingsAccountRepository.js';
import { SavingsAccount, SavingsAccountType } from '../../../../lib/domain/entities/SavingsAccount.js';
import { SavingsAccountId } from '../../../../lib/domain/value-objects/SavingsAccountId.js';
import { Money } from '../../../../lib/domain/value-objects/Money.js';

const savingsAccountRepository = new PrismaSavingsAccountRepository();

export const GET: RequestHandler = async ({ params }) => {
	try {
		const id = new SavingsAccountId(params.id);
		const savingsAccount = await savingsAccountRepository.findById(id);
		
		if (!savingsAccount) {
			return json({ error: 'Savings account not found' }, { status: 404 });
		}

		return json({
			savingsAccount: savingsAccount.toPlainObject()
		});
	} catch (error) {
		console.error('Error fetching savings account:', error);
		return json({ error: 'Failed to fetch savings account' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const id = new SavingsAccountId(params.id);
		const body = await request.json();
		
		// Find existing account
		const existingAccount = await savingsAccountRepository.findById(id);
		if (!existingAccount) {
			return json({ error: 'Savings account not found' }, { status: 404 });
		}

		// Apply updates
		let updatedAccount = existingAccount;

		if (body.balance !== undefined) {
			const newBalance = new Money(Number(body.balance), existingAccount.currency);
			updatedAccount = updatedAccount.updateBalance(newBalance);
		}

		if (body.goalAmount !== undefined) {
			if (body.goalAmount === null) {
				// Remove goal
				updatedAccount = new SavingsAccount({
					...updatedAccount,
					goalAmount: undefined,
					updatedAt: new Date()
				});
			} else {
				const goalAmount = new Money(Number(body.goalAmount), existingAccount.currency);
				updatedAccount = updatedAccount.setGoal(goalAmount);
			}
		}

		if (body.isActive !== undefined) {
			updatedAccount = body.isActive ? updatedAccount.activate() : updatedAccount.deactivate();
		}

		// Update other fields
		if (body.name || body.description || body.type) {
			updatedAccount = new SavingsAccount({
				...updatedAccount,
				name: body.name || updatedAccount.name,
				description: body.description !== undefined ? body.description : updatedAccount.description,
				type: body.type || updatedAccount.type,
				updatedAt: new Date()
			});
		}

		const savedAccount = await savingsAccountRepository.update(updatedAccount);

		return json({
			savingsAccount: savedAccount.toPlainObject()
		});
	} catch (error) {
		console.error('Error updating savings account:', error);
		return json({ error: 'Failed to update savings account' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const id = new SavingsAccountId(params.id);
		
		// Check if account exists
		const existingAccount = await savingsAccountRepository.findById(id);
		if (!existingAccount) {
			return json({ error: 'Savings account not found' }, { status: 404 });
		}

		await savingsAccountRepository.delete(id);

		return json({ message: 'Savings account deleted successfully' });
	} catch (error) {
		console.error('Error deleting savings account:', error);
		return json({ error: 'Failed to delete savings account' }, { status: 500 });
	}
};