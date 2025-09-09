import { Result } from '$lib/shared/utils/result';
import { DomainError, ValidationError } from '$lib/shared/errors/DomainError.js';
import { ParsedTransaction, CSVColumn } from '$lib/shared/types/ParsedTransaction.js';
import { Money } from '$lib/domain/value-objects/Money.js';
import { TransactionDate } from '$lib/domain/value-objects/TransactionDate.js';
import { CSVParser } from './CSVParserFactory.js';

export class GenericCSVParser implements CSVParser {
	private static readonly COLUMNS: CSVColumn[] = [
		{
			name: 'date',
			required: true,
			aliases: ['date', 'transaction_date', 'booking_date', 'value_date', 'fecha']
		},
		{
			name: 'amount',
			required: true,
			aliases: ['amount', 'value', 'importe', 'monto', 'cantidad']
		},
		{
			name: 'description',
			required: true,
			aliases: ['description', 'concept', 'concepto', 'details', 'partner_name']
		},
		{
			name: 'reference',
			required: false,
			aliases: ['reference', 'payment_reference', 'referencia', 'ref']
		},
		{
			name: 'counterparty',
			required: false,
			aliases: ['counterparty', 'partner', 'beneficiary', 'contraparte', 'destinatario']
		}
	];

	async parse(csvContent: string): Promise<Result<ParsedTransaction[], DomainError>> {
		try {
			const lines = csvContent.trim().split('\n');
			
			if (lines.length < 2) {
				return Result.failure(new ValidationError('CSV must contain at least headers and one data row'));
			}

			// Parse headers
			const headers = this.parseCSVRow(lines[0]);
			const columnMapping = this.mapColumns(headers);

			// Validate required columns
			const missingColumns = this.validateRequiredColumns(columnMapping);
			if (missingColumns.length > 0) {
				return Result.failure(
					new ValidationError(`Missing required columns: ${missingColumns.join(', ')}`)
				);
			}

			// Parse data rows
			const transactions: ParsedTransaction[] = [];
			const errors: string[] = [];

			for (let i = 1; i < lines.length; i++) {
				const row = this.parseCSVRow(lines[i]);
				
				if (row.length === 0 || row.every(cell => !cell.trim())) {
					continue; // Skip empty rows
				}

				try {
					const transaction = await this.parseTransaction(row, columnMapping, headers);
					if (transaction.isSuccess()) {
						transactions.push(transaction.value);
					} else {
						errors.push(`Row ${i + 1}: ${transaction.error.message}`);
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
					errors.push(`Row ${i + 1}: ${errorMessage}`);
				}
			}

			if (transactions.length === 0) {
				return Result.failure(new ValidationError('No valid transactions found in CSV'));
			}

			if (errors.length > 0) {
				// Log errors but don't fail completely if we have some valid transactions
				console.warn('CSV parsing errors:', errors);
			}

			return Result.success(transactions);

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV';
			return Result.failure(new DomainError(errorMessage));
		}
	}

	private parseCSVRow(row: string): string[] {
		const cells: string[] = [];
		let current = '';
		let inQuotes = false;
		
		for (let i = 0; i < row.length; i++) {
			const char = row[i];
			
			if (char === '"') {
				if (inQuotes && row[i + 1] === '"') {
					// Escaped quote
					current += '"';
					i++; // Skip next quote
				} else {
					// Toggle quote state
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				// End of cell
				cells.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		
		// Add last cell
		cells.push(current.trim());
		
		return cells;
	}

	private mapColumns(headers: string[]): Map<string, number> {
		const mapping = new Map<string, number>();
		
		for (const column of GenericCSVParser.COLUMNS) {
			for (let i = 0; i < headers.length; i++) {
				const header = headers[i].toLowerCase().trim();
				
				if (column.aliases.some(alias => header.includes(alias))) {
					mapping.set(column.name, i);
					break;
				}
			}
		}
		
		return mapping;
	}

	private validateRequiredColumns(columnMapping: Map<string, number>): string[] {
		const missing: string[] = [];
		
		for (const column of GenericCSVParser.COLUMNS) {
			if (column.required && !columnMapping.has(column.name)) {
				missing.push(column.name);
			}
		}
		
		return missing;
	}

	private async parseTransaction(
		row: string[], 
		columnMapping: Map<string, number>, 
		headers: string[]
	): Promise<Result<ParsedTransaction, DomainError>> {
		try {
			// Extract values using column mapping
			const dateStr = this.getColumnValue(row, columnMapping, 'date');
			const amountStr = this.getColumnValue(row, columnMapping, 'amount');
			const description = this.getColumnValue(row, columnMapping, 'description');
			const reference = this.getColumnValue(row, columnMapping, 'reference');
			const counterparty = this.getColumnValue(row, columnMapping, 'counterparty');

			// Parse date
			const transactionDateResult = TransactionDate.create(new Date(dateStr));
			if (transactionDateResult.isFailure()) {
				return Result.failure(new ValidationError(`Invalid date: ${dateStr}`));
			}

			// Parse amount
			const cleanAmount = amountStr.replace(/[^\d.,-]/g, '').replace(',', '.');
			const amountValue = parseFloat(cleanAmount);
			
			if (isNaN(amountValue)) {
				return Result.failure(new ValidationError(`Invalid amount: ${amountStr}`));
			}

			const moneyResult = Money.create(amountValue, 'EUR');
			if (moneyResult.isFailure()) {
				return Result.failure(moneyResult.error);
			}

			// Build raw data object
			const rawData: Record<string, string> = {};
			headers.forEach((header, index) => {
				if (index < row.length) {
					rawData[header] = row[index];
				}
			});

			const transaction: ParsedTransaction = {
				amount: moneyResult.value,
				description: description || 'Unknown transaction',
				transactionDate: transactionDateResult.value,
				paymentReference: reference || undefined,
				counterparty: counterparty || undefined,
				rawData
			};

			return Result.success(transaction);

		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to parse transaction';
			return Result.failure(new ValidationError(errorMessage));
		}
	}

	private getColumnValue(row: string[], columnMapping: Map<string, number>, columnName: string): string {
		const columnIndex = columnMapping.get(columnName);
		if (columnIndex !== undefined && columnIndex < row.length) {
			return row[columnIndex].trim();
		}
		return '';
	}
}