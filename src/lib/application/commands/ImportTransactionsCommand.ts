import { Result, failure, success } from '$lib/shared/utils/result.js';
import { DomainError, ValidationError } from '$lib/shared/errors/DomainError.js';

export interface ImportTransactionsCommand {
	readonly csvContent: string;
	readonly accountId: string;
	readonly fileName: string;
	readonly overwriteExisting?: boolean;
}

export interface ImportTransactionsResult {
	readonly imported: number;
	readonly skipped: number;
	readonly errors: string[];
	readonly warnings: string[];
}

export class ImportTransactionsCommandValidator {
	static validate(command: ImportTransactionsCommand): Result<void, ValidationError> {
		if (!command.csvContent || command.csvContent.trim().length === 0) {
			return failure(new ValidationError('CSV content is required'));
		}

		if (!command.accountId || command.accountId.trim().length === 0) {
			return failure(new ValidationError('Account ID is required'));
		}

		if (!command.fileName || command.fileName.trim().length === 0) {
			return failure(new ValidationError('File name is required'));
		}

		if (!command.fileName.toLowerCase().endsWith('.csv')) {
			return failure(new ValidationError('File must be a CSV file'));
		}

		// Basic CSV validation - should have headers
		const lines = command.csvContent.trim().split('\n');
		if (lines.length < 2) {
			return failure(new ValidationError('CSV file must contain at least headers and one data row'));
		}

		return success(undefined);
	}
}