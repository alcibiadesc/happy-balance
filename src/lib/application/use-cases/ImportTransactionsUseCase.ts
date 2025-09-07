import { Result } from '$lib/shared/utils/result.js';
import { DomainError } from '$lib/shared/errors/DomainError.js';
import { ImportTransactionsCommand, ImportTransactionsCommandValidator, ImportTransactionsResult } from '../commands/ImportTransactionsCommand.js';
import { TransactionRepository } from '$lib/domain/repositories/TransactionRepository.js';
import { AccountRepository } from '$lib/domain/repositories/IAccountRepository.js';
import { CSVParserFactory } from '$lib/infrastructure/parsers/CSVParserFactory.js';
import { Logger } from '$lib/shared/utils/logger.js';
import { Transaction } from '$lib/domain/entities/Transaction.js';

export interface ImportTransactionsUseCaseDependencies {
	transactionRepository: TransactionRepository;
	accountRepository: AccountRepository;
	csvParserFactory: CSVParserFactory;
	logger: Logger;
}

export class ImportTransactionsUseCase {
	constructor(private readonly deps: ImportTransactionsUseCaseDependencies) {}

	async execute(command: ImportTransactionsCommand): Promise<Result<ImportTransactionsResult, DomainError>> {
		this.deps.logger.info('Starting transaction import', { accountId: command.accountId, fileName: command.fileName });

		// 1. Validate command
		const validationResult = ImportTransactionsCommandValidator.validate(command);
		if (validationResult.isFailure()) {
			return Result.failure(validationResult.error);
		}

		try {
			// 2. Verify account exists
			const account = await this.deps.accountRepository.findById(command.accountId);
			if (!account) {
				return Result.failure(new DomainError(`Account with ID ${command.accountId} not found`));
			}

			// 3. Parse CSV content
			const parser = this.deps.csvParserFactory.createParser(command.fileName);
			const parseResult = await parser.parse(command.csvContent);
			
			if (parseResult.isFailure()) {
				return Result.failure(parseResult.error);
			}

			const parsedTransactions = parseResult.value;
			this.deps.logger.info(`Parsed ${parsedTransactions.length} transactions from CSV`);

			// 4. Process transactions
			let imported = 0;
			let skipped = 0;
			const errors: string[] = [];
			const warnings: string[] = [];

			for (const parsedTx of parsedTransactions) {
				try {
					// Check if transaction already exists (prevent duplicates)
					if (!command.overwriteExisting) {
						const existing = await this.deps.transactionRepository.findByReference(
							parsedTx.paymentReference || parsedTx.description,
							parsedTx.transactionDate,
							parsedTx.amount
						);

						if (existing) {
							skipped++;
							warnings.push(`Transaction already exists: ${parsedTx.description}`);
							continue;
						}
					}

					// Create domain transaction
					const transactionResult = Transaction.create({
						amount: parsedTx.amount,
						description: parsedTx.description,
						accountId: account.id,
						transactionDate: parsedTx.transactionDate,
						paymentReference: parsedTx.paymentReference,
						counterparty: parsedTx.counterparty
					});

					if (transactionResult.isFailure()) {
						errors.push(`Failed to create transaction: ${transactionResult.error.message}`);
						continue;
					}

					// Save transaction
					await this.deps.transactionRepository.save(transactionResult.value);
					imported++;

				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					errors.push(`Error processing transaction: ${errorMessage}`);
					this.deps.logger.error('Transaction processing error', error);
				}
			}

			// 5. Update account balance if needed
			if (imported > 0) {
				try {
					await this.updateAccountBalance(account.id);
				} catch (error) {
					warnings.push('Failed to update account balance');
					this.deps.logger.error('Account balance update error', error);
				}
			}

			const result: ImportTransactionsResult = {
				imported,
				skipped,
				errors,
				warnings
			};

			this.deps.logger.info('Transaction import completed', result);
			return Result.success(result);

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error during import';
			this.deps.logger.error('Import process failed', error);
			return Result.failure(new DomainError(errorMessage));
		}
	}

	private async updateAccountBalance(accountId: string): Promise<void> {
		// Calculate new balance based on all transactions
		const totalAmount = await this.deps.transactionRepository.calculateTotalByAccount(accountId);
		
		const account = await this.deps.accountRepository.findById(accountId);
		if (!account) {
			throw new Error('Account not found during balance update');
		}

		const balanceResult = account.setBalance(totalAmount);
		if (balanceResult.isFailure()) {
			throw new Error(`Failed to set account balance: ${balanceResult.error.message}`);
		}

		await this.deps.accountRepository.update(account);
	}
}