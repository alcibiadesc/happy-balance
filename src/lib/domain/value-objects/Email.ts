import { Result } from '$lib/shared/utils/result';
import { ValidationError } from '$lib/shared/errors/DomainError.js';

export class Email {
	private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	private static readonly MAX_LENGTH = 254;

	private constructor(private readonly _value: string) {
		Object.freeze(this);
	}

	static create(value: string): Result<Email, ValidationError> {
		if (!value || typeof value !== 'string') {
			return Result.failure(new ValidationError('Email is required'));
		}

		const trimmed = value.trim().toLowerCase();

		if (trimmed.length === 0) {
			return Result.failure(new ValidationError('Email cannot be empty'));
		}

		if (trimmed.length > Email.MAX_LENGTH) {
			return Result.failure(new ValidationError(`Email cannot exceed ${Email.MAX_LENGTH} characters`));
		}

		if (!Email.EMAIL_REGEX.test(trimmed)) {
			return Result.failure(new ValidationError('Invalid email format'));
		}

		return Result.success(new Email(trimmed));
	}

	get value(): string {
		return this._value;
	}

	get localPart(): string {
		return this._value.split('@')[0];
	}

	get domain(): string {
		return this._value.split('@')[1];
	}

	equals(other: Email): boolean {
		return this._value === other._value;
	}

	toString(): string {
		return this._value;
	}

	toJSON(): string {
		return this._value;
	}
}