import { Money } from '$lib/domain/value-objects/Money.js';
import { TransactionDate } from '$lib/domain/value-objects/TransactionDate.js';

export interface ParsedTransaction {
	readonly amount: Money;
	readonly description: string;
	readonly transactionDate: TransactionDate;
	readonly paymentReference?: string;
	readonly counterparty?: string;
	readonly category?: string;
	readonly rawData: Record<string, string>;
}

export interface CSVParseResult {
	readonly transactions: ParsedTransaction[];
	readonly warnings: string[];
	readonly skippedRows: number;
}

export interface CSVColumn {
	readonly name: string;
	readonly required: boolean;
	readonly aliases: string[];
	readonly parser?: (value: string) => any;
}