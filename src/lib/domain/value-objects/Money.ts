import { Result, success, failure } from '$lib/shared/utils/result';
import { DomainError } from '$lib/shared/errors/DomainError.js';

export interface Currency {
	readonly code: string;
	readonly symbol: string;
	readonly decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, Currency> = {
	EUR: { code: 'EUR', symbol: '€', decimals: 2 },
	USD: { code: 'USD', symbol: '$', decimals: 2 },
	GBP: { code: 'GBP', symbol: '£', decimals: 2 },
	JPY: { code: 'JPY', symbol: '¥', decimals: 0 }
} as const;

export class Money {
	private constructor(
		private readonly _amount: number,
		private readonly _currency: Currency
	) {
		Object.freeze(this);
	}

	static create(amount: number, currencyCode: string): Result<Money, DomainError> {
		const currency = SUPPORTED_CURRENCIES[currencyCode.toUpperCase()];
		if (!currency) {
			return failure(
				new DomainError(`Unsupported currency: ${currencyCode}`)
			);
		}

		if (!Number.isFinite(amount)) {
			return failure(
				new DomainError('Amount must be a finite number')
			);
		}

		const roundedAmount = Math.round(amount * Math.pow(10, currency.decimals)) / Math.pow(10, currency.decimals);

		return success(new Money(roundedAmount, currency));
	}

	static zero(currencyCode: string): Result<Money, DomainError> {
		return Money.create(0, currencyCode);
	}

	static parse(value: string, currencyCode: string = 'EUR'): Result<Money, DomainError> {
		const cleanValue = value.replace(/[^\d.-]/g, '');
		const amount = parseFloat(cleanValue);
		
		if (isNaN(amount)) {
			return failure(new DomainError(`Cannot parse amount: ${value}`));
		}
		
		return Money.create(amount, currencyCode);
	}

	get amount(): number {
		return this._amount;
	}

	get currency(): Currency {
		return this._currency;
	}

	get isZero(): boolean {
		return this._amount === 0;
	}

	get isPositive(): boolean {
		return this._amount > 0;
	}

	get isNegative(): boolean {
		return this._amount < 0;
	}

	add(other: Money): Result<Money, DomainError> {
		if (!this.hasSameCurrency(other)) {
			return failure(
				new DomainError(`Cannot add different currencies: ${this._currency.code} and ${other._currency.code}`)
			);
		}

		return Money.create(this._amount + other._amount, this._currency.code);
	}

	subtract(other: Money): Result<Money, DomainError> {
		if (!this.hasSameCurrency(other)) {
			return failure(
				new DomainError(`Cannot subtract different currencies: ${this._currency.code} and ${other._currency.code}`)
			);
		}

		return Money.create(this._amount - other._amount, this._currency.code);
	}

	multiply(factor: number): Result<Money, DomainError> {
		if (!Number.isFinite(factor)) {
			return failure(
				new DomainError('Factor must be a finite number')
			);
		}

		return Money.create(this._amount * factor, this._currency.code);
	}

	divide(divisor: number): Result<Money, DomainError> {
		if (!Number.isFinite(divisor) || divisor === 0) {
			return failure(
				new DomainError('Divisor must be a finite non-zero number')
			);
		}

		return Money.create(this._amount / divisor, this._currency.code);
	}

	abs(): Result<Money, DomainError> {
		return Money.create(Math.abs(this._amount), this._currency.code);
	}

	negate(): Result<Money, DomainError> {
		return Money.create(-this._amount, this._currency.code);
	}

	equals(other: Money): boolean {
		return this._amount === other._amount && this._currency.code === other._currency.code;
	}

	greaterThan(other: Money): boolean {
		this.assertSameCurrency(other);
		return this._amount > other._amount;
	}

	lessThan(other: Money): boolean {
		this.assertSameCurrency(other);
		return this._amount < other._amount;
	}

	greaterThanOrEqual(other: Money): boolean {
		this.assertSameCurrency(other);
		return this._amount >= other._amount;
	}

	lessThanOrEqual(other: Money): boolean {
		this.assertSameCurrency(other);
		return this._amount <= other._amount;
	}

	format(options?: { showSymbol?: boolean; showCode?: boolean }): string {
		const { showSymbol = true, showCode = false } = options || {};
		
		const formattedAmount = new Intl.NumberFormat('en-US', {
			minimumFractionDigits: this._currency.decimals,
			maximumFractionDigits: this._currency.decimals
		}).format(this._amount);

		if (showSymbol && showCode) {
			return `${this._currency.symbol}${formattedAmount} ${this._currency.code}`;
		} else if (showSymbol) {
			return `${this._currency.symbol}${formattedAmount}`;
		} else if (showCode) {
			return `${formattedAmount} ${this._currency.code}`;
		} else {
			return formattedAmount;
		}
	}

	toString(): string {
		return this.format();
	}

	toJSON(): { amount: number; currency: string } {
		return {
			amount: this._amount,
			currency: this._currency.code
		};
	}

	private hasSameCurrency(other: Money): boolean {
		return this._currency.code === other._currency.code;
	}

	private assertSameCurrency(other: Money): void {
		if (!this.hasSameCurrency(other)) {
			throw new DomainError(`Cannot compare different currencies: ${this._currency.code} and ${other._currency.code}`);
		}
	}
}