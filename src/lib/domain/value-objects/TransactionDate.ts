import { Result } from '$lib/shared/utils/result.js';
import { ValidationError } from '$lib/shared/errors/DomainError.js';

export class TransactionDate {
	private constructor(private readonly _date: Date) {
		Object.freeze(this);
	}

	static create(date: Date | string): Result<TransactionDate, ValidationError> {
		let parsedDate: Date;

		if (typeof date === 'string') {
			parsedDate = new Date(date);
		} else {
			parsedDate = new Date(date);
		}

		if (isNaN(parsedDate.getTime())) {
			return Result.failure(
				new ValidationError('Invalid date provided')
			);
		}

		const now = new Date();
		const oneYearFromNow = new Date();
		oneYearFromNow.setFullYear(now.getFullYear() + 1);

		if (parsedDate > oneYearFromNow) {
			return Result.failure(
				new ValidationError('Transaction date cannot be more than one year in the future')
			);
		}

		const tenYearsAgo = new Date();
		tenYearsAgo.setFullYear(now.getFullYear() - 10);

		if (parsedDate < tenYearsAgo) {
			return Result.failure(
				new ValidationError('Transaction date cannot be more than ten years in the past')
			);
		}

		return Result.success(new TransactionDate(parsedDate));
	}

	static now(): TransactionDate {
		return new TransactionDate(new Date());
	}

	static today(): TransactionDate {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return new TransactionDate(today);
	}

	get value(): Date {
		return new Date(this._date);
	}

	get year(): number {
		return this._date.getFullYear();
	}

	get month(): number {
		return this._date.getMonth() + 1; // 1-based month
	}

	get day(): number {
		return this._date.getDate();
	}

	get isToday(): boolean {
		const today = new Date();
		return this.isSameDay(today);
	}

	get isThisMonth(): boolean {
		const now = new Date();
		return this._date.getFullYear() === now.getFullYear() && 
		       this._date.getMonth() === now.getMonth();
	}

	get isThisYear(): boolean {
		const now = new Date();
		return this._date.getFullYear() === now.getFullYear();
	}

	isBefore(other: TransactionDate): boolean {
		return this._date < other._date;
	}

	isAfter(other: TransactionDate): boolean {
		return this._date > other._date;
	}

	isSameDay(other: Date | TransactionDate): boolean {
		const otherDate = other instanceof TransactionDate ? other._date : other;
		return this._date.getFullYear() === otherDate.getFullYear() &&
		       this._date.getMonth() === otherDate.getMonth() &&
		       this._date.getDate() === otherDate.getDate();
	}

	isInRange(start: TransactionDate, end: TransactionDate): boolean {
		return this._date >= start._date && this._date <= end._date;
	}

	addDays(days: number): TransactionDate {
		const newDate = new Date(this._date);
		newDate.setDate(newDate.getDate() + days);
		return new TransactionDate(newDate);
	}

	subtractDays(days: number): TransactionDate {
		return this.addDays(-days);
	}

	startOfMonth(): TransactionDate {
		const date = new Date(this._date);
		date.setDate(1);
		date.setHours(0, 0, 0, 0);
		return new TransactionDate(date);
	}

	endOfMonth(): TransactionDate {
		const date = new Date(this._date);
		date.setMonth(date.getMonth() + 1, 0);
		date.setHours(23, 59, 59, 999);
		return new TransactionDate(date);
	}

	format(options?: { locale?: string; style?: 'short' | 'medium' | 'long' | 'full' }): string {
		const { locale = 'en-US', style = 'medium' } = options || {};
		
		let formatOptions: Intl.DateTimeFormatOptions;
		
		switch (style) {
			case 'short':
				formatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
				break;
			case 'medium':
				formatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
				break;
			case 'long':
				formatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
				break;
			case 'full':
				formatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
				break;
			default:
				formatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
		}
		
		return this._date.toLocaleDateString(locale, formatOptions);
	}

	toISOString(): string {
		return this._date.toISOString();
	}

	toDateString(): string {
		return this._date.toDateString();
	}

	toString(): string {
		return this.format();
	}

	toJSON(): string {
		return this._date.toISOString();
	}

	equals(other: TransactionDate): boolean {
		return this._date.getTime() === other._date.getTime();
	}
}