export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ValidationResult {
  private constructor(
    public readonly isValid: boolean,
    public readonly errors: ValidationError[] = []
  ) {}

  static valid(): ValidationResult {
    return new ValidationResult(true, []);
  }

  static invalid(errors: ValidationError[]): ValidationResult {
    return new ValidationResult(false, errors);
  }

  static singleError(error: ValidationError): ValidationResult {
    return new ValidationResult(false, [error]);
  }

  addError(error: ValidationError): ValidationResult {
    return new ValidationResult(false, [...this.errors, error]);
  }

  combine(other: ValidationResult): ValidationResult {
    if (this.isValid && other.isValid) {
      return ValidationResult.valid();
    }
    
    return ValidationResult.invalid([...this.errors, ...other.errors]);
  }

  getFirstError(): ValidationError | null {
    return this.errors.length > 0 ? this.errors[0] : null;
  }

  getErrorsForField(field: string): ValidationError[] {
    return this.errors.filter(error => error.field === field);
  }
}