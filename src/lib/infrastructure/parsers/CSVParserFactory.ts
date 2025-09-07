import { N26CSVParser } from './N26CSVParser.js';
import { GenericCSVParser } from './GenericCSVParser.js';
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
		
		// Detect N26 format
		if (normalizedName.includes('n26') || normalizedName.includes('csv')) {
			// For now, default to N26 parser since it's the main use case
			return new N26CSVParser();
		}

		// Default to generic parser
		return new GenericCSVParser();
	}

	static registerParser(key: string, parserClass: new () => CSVParser): void {
		CSVParserFactory.PARSERS.set(key, parserClass);
	}

	static getAvailableParsers(): string[] {
		return Array.from(CSVParserFactory.PARSERS.keys());
	}
}