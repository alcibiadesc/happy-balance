import { N26CSVParser } from './N26CSVParser.js';
import { GenericCSVParser } from './GenericCSVParser.js';
import { SimpleCSVParser } from './SimpleCSVParser.js';
import { UniversalCSVParser } from './UniversalCSVParser.js';
import { DomainError } from '$lib/shared/errors/DomainError.js';

export interface CSVParser {
	parse(csvContent: string): Promise<import('$lib/shared/types/ParsedTransaction.js').ParsedTransaction[]>;
}

export class CSVParserFactory {
	private static readonly PARSERS = new Map([
		['n26', N26CSVParser],
		['generic', GenericCSVParser]
	]);

	createParser(fileName: string): CSVParser {
		const normalizedName = fileName.toLowerCase();
		
		// Use the universal parser that handles both N26 and generic formats
		return new UniversalCSVParser();
	}

	static registerParser(key: string, parserClass: new () => CSVParser): void {
		CSVParserFactory.PARSERS.set(key, parserClass);
	}

	static getAvailableParsers(): string[] {
		return Array.from(CSVParserFactory.PARSERS.keys());
	}
}