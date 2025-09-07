export class DomainError extends Error {
	constructor(message: string, public readonly code?: string) {
		super(message);
		this.name = 'DomainError';
	}
}

export class ValidationError extends DomainError {
	constructor(message: string, public readonly field?: string) {
		super(message, 'VALIDATION_ERROR');
		this.name = 'ValidationError';
	}
}

export class NotFoundError extends DomainError {
	constructor(resource: string, identifier?: string) {
		const message = identifier 
			? `${resource} with identifier '${identifier}' not found`
			: `${resource} not found`;
		super(message, 'NOT_FOUND_ERROR');
		this.name = 'NotFoundError';
	}
}

export class ConflictError extends DomainError {
	constructor(message: string) {
		super(message, 'CONFLICT_ERROR');
		this.name = 'ConflictError';
	}
}

export class InvariantViolationError extends DomainError {
	constructor(message: string) {
		super(message, 'INVARIANT_VIOLATION');
		this.name = 'InvariantViolationError';
	}
}