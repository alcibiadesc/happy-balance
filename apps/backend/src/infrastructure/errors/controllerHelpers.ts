import { Response, Request, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { Result } from '@domain/shared/Result';
import { ValidationError, BadRequestError, NotFoundError, InternalError } from './AppError';

/**
 * Standard success response format
 */
export function successResponse<T>(res: Response, data: T, statusCode: number = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Standard created response (201)
 */
export function createdResponse<T>(res: Response, data: T): void {
  successResponse(res, data, 201);
}

/**
 * Standard no content response (204)
 */
export function noContentResponse(res: Response): void {
  res.status(204).send();
}

/**
 * Validate request body/query against a Zod schema
 * Throws ValidationError if validation fails
 */
export function validateSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation error', result.error.errors);
  }
  return result.data;
}

/**
 * Validate request body
 */
export function validateBody<T>(schema: ZodSchema<T>, req: Request): T {
  return validateSchema(schema, req.body);
}

/**
 * Validate request query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>, req: Request): T {
  return validateSchema(schema, req.query);
}

/**
 * Validate request params
 */
export function validateParams<T>(schema: ZodSchema<T>, req: Request): T {
  return validateSchema(schema, req.params);
}

/**
 * Handle Result pattern from domain operations
 * Throws appropriate error if Result is failure
 */
export function handleResult<T>(result: Result<T>, errorMessage?: string): T {
  if (result.isFailure()) {
    const error = result.getError();
    const message = typeof error === 'string' ? error : errorMessage || 'Operation failed';
    throw new BadRequestError(message);
  }
  return result.getValue();
}

/**
 * Handle Result pattern for repository find operations
 * Throws NotFoundError if result is null/undefined
 */
export function handleFindResult<T>(
  result: Result<T | null | undefined>,
  resourceName: string = 'Resource'
): T {
  if (result.isFailure()) {
    const error = result.getError();
    const message = typeof error === 'string' ? error : 'Internal error';
    throw new InternalError(message);
  }
  const value = result.getValue();
  if (!value) {
    throw new NotFoundError(resourceName);
  }
  return value;
}

/**
 * Wrapper to catch async errors and pass to error handler middleware
 * Use this to wrap controller methods
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Type guard to check if error is a Zod error
 */
export function isZodError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}
