import { describe, it, expect } from 'vitest';
import { Money, SUPPORTED_CURRENCIES } from './Money.js';

describe('Money Value Object', () => {
	describe('Creation', () => {
		it('should create Money with valid amount and currency', () => {
			const result = Money.create(100.50, 'EUR');
			
			expect(result.isSuccess()).toBe(true);
			if (result.isSuccess()) {
				expect(result.value.amount).toBe(100.50);
				expect(result.value.currency.code).toBe('EUR');
				expect(result.value.currency.symbol).toBe('€');
			}
		});

		it('should create zero Money', () => {
			const result = Money.zero('USD');
			
			expect(result.isSuccess()).toBe(true);
			if (result.isSuccess()) {
				expect(result.value.amount).toBe(0);
				expect(result.value.currency.code).toBe('USD');
				expect(result.value.isZero).toBe(true);
			}
		});

		it('should fail with invalid currency', () => {
			const result = Money.create(100, 'INVALID');
			
			expect(result.isFailure()).toBe(true);
			if (result.isFailure()) {
				expect(result.error.message).toContain('Unsupported currency');
			}
		});

		it('should fail with invalid amount', () => {
			const result = Money.create(NaN, 'EUR');
			
			expect(result.isFailure()).toBe(true);
			if (result.isFailure()) {
				expect(result.error.message).toContain('Amount must be a finite number');
			}
		});

		it('should round to appropriate decimal places', () => {
			const eurResult = Money.create(100.999, 'EUR');
			const jpyResult = Money.create(100.999, 'JPY');
			
			expect(eurResult.isSuccess()).toBe(true);
			expect(jpyResult.isSuccess()).toBe(true);
			
			if (eurResult.isSuccess()) {
				expect(eurResult.value.amount).toBe(101.00); // EUR has 2 decimals
			}
			
			if (jpyResult.isSuccess()) {
				expect(jpyResult.value.amount).toBe(101); // JPY has 0 decimals
			}
		});
	});

	describe('Parsing', () => {
		it('should parse valid string amounts', () => {
			const result = Money.parse('123.45', 'EUR');
			
			expect(result.isSuccess()).toBe(true);
			if (result.isSuccess()) {
				expect(result.value.amount).toBe(123.45);
			}
		});

		it('should fail parsing invalid strings', () => {
			const result = Money.parse('invalid', 'EUR');
			
			expect(result.isFailure()).toBe(true);
		});
	});

	describe('Properties', () => {
		it('should correctly identify positive amounts', () => {
			const result = Money.create(100, 'EUR');
			
			expect(result.isSuccess()).toBe(true);
			if (result.isSuccess()) {
				expect(result.value.isPositive).toBe(true);
				expect(result.value.isNegative).toBe(false);
				expect(result.value.isZero).toBe(false);
			}
		});

		it('should correctly identify negative amounts', () => {
			const result = Money.create(-100, 'EUR');
			
			expect(result.isSuccess()).toBe(true);
			if (result.isSuccess()) {
				expect(result.value.isPositive).toBe(false);
				expect(result.value.isNegative).toBe(true);
				expect(result.value.isZero).toBe(false);
			}
		});

		it('should correctly identify zero amounts', () => {
			const result = Money.create(0, 'EUR');
			
			expect(result.isSuccess()).toBe(true);
			if (result.isSuccess()) {
				expect(result.value.isPositive).toBe(false);
				expect(result.value.isNegative).toBe(false);
				expect(result.value.isZero).toBe(true);
			}
		});
	});

	describe('Arithmetic Operations', () => {
		it('should add Money with same currency', () => {
			const money1Result = Money.create(100, 'EUR');
			const money2Result = Money.create(50, 'EUR');
			
			expect(money1Result.isSuccess()).toBe(true);
			expect(money2Result.isSuccess()).toBe(true);
			
			if (money1Result.isSuccess() && money2Result.isSuccess()) {
				const addResult = money1Result.value.add(money2Result.value);
				
				expect(addResult.isSuccess()).toBe(true);
				if (addResult.isSuccess()) {
					expect(addResult.value.amount).toBe(150);
				}
			}
		});

		it('should fail adding Money with different currencies', () => {
			const eurResult = Money.create(100, 'EUR');
			const usdResult = Money.create(50, 'USD');
			
			expect(eurResult.isSuccess()).toBe(true);
			expect(usdResult.isSuccess()).toBe(true);
			
			if (eurResult.isSuccess() && usdResult.isSuccess()) {
				const addResult = eurResult.value.add(usdResult.value);
				
				expect(addResult.isFailure()).toBe(true);
				if (addResult.isFailure()) {
					expect(addResult.error.message).toContain('Cannot add different currencies');
				}
			}
		});

		it('should subtract Money with same currency', () => {
			const money1Result = Money.create(100, 'EUR');
			const money2Result = Money.create(30, 'EUR');
			
			expect(money1Result.isSuccess()).toBe(true);
			expect(money2Result.isSuccess()).toBe(true);
			
			if (money1Result.isSuccess() && money2Result.isSuccess()) {
				const subtractResult = money1Result.value.subtract(money2Result.value);
				
				expect(subtractResult.isSuccess()).toBe(true);
				if (subtractResult.isSuccess()) {
					expect(subtractResult.value.amount).toBe(70);
				}
			}
		});

		it('should multiply Money by factor', () => {
			const moneyResult = Money.create(100, 'EUR');
			
			expect(moneyResult.isSuccess()).toBe(true);
			
			if (moneyResult.isSuccess()) {
				const multiplyResult = moneyResult.value.multiply(1.5);
				
				expect(multiplyResult.isSuccess()).toBe(true);
				if (multiplyResult.isSuccess()) {
					expect(multiplyResult.value.amount).toBe(150);
				}
			}
		});

		it('should divide Money by divisor', () => {
			const moneyResult = Money.create(100, 'EUR');
			
			expect(moneyResult.isSuccess()).toBe(true);
			
			if (moneyResult.isSuccess()) {
				const divideResult = moneyResult.value.divide(4);
				
				expect(divideResult.isSuccess()).toBe(true);
				if (divideResult.isSuccess()) {
					expect(divideResult.value.amount).toBe(25);
				}
			}
		});

		it('should fail dividing by zero', () => {
			const moneyResult = Money.create(100, 'EUR');
			
			expect(moneyResult.isSuccess()).toBe(true);
			
			if (moneyResult.isSuccess()) {
				const divideResult = moneyResult.value.divide(0);
				
				expect(divideResult.isFailure()).toBe(true);
			}
		});

		it('should get absolute value', () => {
			const moneyResult = Money.create(-100, 'EUR');
			
			expect(moneyResult.isSuccess()).toBe(true);
			
			if (moneyResult.isSuccess()) {
				const absResult = moneyResult.value.abs();
				
				expect(absResult.isSuccess()).toBe(true);
				if (absResult.isSuccess()) {
					expect(absResult.value.amount).toBe(100);
					expect(absResult.value.isPositive).toBe(true);
				}
			}
		});

		it('should negate value', () => {
			const moneyResult = Money.create(100, 'EUR');
			
			expect(moneyResult.isSuccess()).toBe(true);
			
			if (moneyResult.isSuccess()) {
				const negateResult = moneyResult.value.negate();
				
				expect(negateResult.isSuccess()).toBe(true);
				if (negateResult.isSuccess()) {
					expect(negateResult.value.amount).toBe(-100);
					expect(negateResult.value.isNegative).toBe(true);
				}
			}
		});
	});

	describe('Comparison Operations', () => {
		it('should compare equal Money objects', () => {
			const money1Result = Money.create(100, 'EUR');
			const money2Result = Money.create(100, 'EUR');
			
			expect(money1Result.isSuccess()).toBe(true);
			expect(money2Result.isSuccess()).toBe(true);
			
			if (money1Result.isSuccess() && money2Result.isSuccess()) {
				expect(money1Result.value.equals(money2Result.value)).toBe(true);
			}
		});

		it('should compare greater than', () => {
			const money1Result = Money.create(100, 'EUR');
			const money2Result = Money.create(50, 'EUR');
			
			expect(money1Result.isSuccess()).toBe(true);
			expect(money2Result.isSuccess()).toBe(true);
			
			if (money1Result.isSuccess() && money2Result.isSuccess()) {
				expect(money1Result.value.greaterThan(money2Result.value)).toBe(true);
				expect(money2Result.value.greaterThan(money1Result.value)).toBe(false);
			}
		});

		it('should compare less than', () => {
			const money1Result = Money.create(50, 'EUR');
			const money2Result = Money.create(100, 'EUR');
			
			expect(money1Result.isSuccess()).toBe(true);
			expect(money2Result.isSuccess()).toBe(true);
			
			if (money1Result.isSuccess() && money2Result.isSuccess()) {
				expect(money1Result.value.lessThan(money2Result.value)).toBe(true);
				expect(money2Result.value.lessThan(money1Result.value)).toBe(false);
			}
		});
	});

	describe('Formatting', () => {
		it('should format with symbol by default', () => {
			const moneyResult = Money.create(1234.56, 'EUR');
			
			expect(moneyResult.isSuccess()).toBe(true);
			
			if (moneyResult.isSuccess()) {
				const formatted = moneyResult.value.format();
				expect(formatted).toBe('€1,234.56');
			}
		});

		it('should format with custom options', () => {
			const moneyResult = Money.create(1234.56, 'EUR');
			
			expect(moneyResult.isSuccess()).toBe(true);
			
			if (moneyResult.isSuccess()) {
				const withCode = moneyResult.value.format({ showSymbol: false, showCode: true });
				expect(withCode).toBe('1,234.56 EUR');
				
				const both = moneyResult.value.format({ showSymbol: true, showCode: true });
				expect(both).toBe('€1,234.56 EUR');
			}
		});

		it('should format JPY correctly (no decimals)', () => {
			const moneyResult = Money.create(1234, 'JPY');
			
			expect(moneyResult.isSuccess()).toBe(true);
			
			if (moneyResult.isSuccess()) {
				const formatted = moneyResult.value.format();
				expect(formatted).toBe('¥1,234');
			}
		});
	});

	describe('Serialization', () => {
		it('should serialize to JSON', () => {
			const moneyResult = Money.create(100.50, 'EUR');
			
			expect(moneyResult.isSuccess()).toBe(true);
			
			if (moneyResult.isSuccess()) {
				const json = moneyResult.value.toJSON();
				expect(json).toEqual({
					amount: 100.50,
					currency: 'EUR'
				});
			}
		});

		it('should convert to string', () => {
			const moneyResult = Money.create(100.50, 'EUR');
			
			expect(moneyResult.isSuccess()).toBe(true);
			
			if (moneyResult.isSuccess()) {
				const str = moneyResult.value.toString();
				expect(str).toBe('€100.50');
			}
		});
	});
});