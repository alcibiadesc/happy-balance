/**
 * Request validation middleware using Zod schemas
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createLogger } from '../logging/logger';

const logger = createLogger('validation');

interface ValidationTarget {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Formats Zod errors into a user-friendly structure
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}

/**
 * Middleware factory for validating request body, query, and params
 *
 * @example
 * router.post('/users',
 *   validateRequest({ body: createUserSchema }),
 *   userController.create
 * );
 *
 * @example
 * router.get('/users/:id',
 *   validateRequest({ params: idParamSchema, query: paginationSchema }),
 *   userController.getById
 * );
 */
export function validateRequest(schemas: ValidationTarget) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate body
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          logger.warn({ errors: result.error.issues }, 'Body validation failed');
          res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid request body',
            details: formatZodErrors(result.error),
          });
          return;
        }
        req.body = result.data;
      }

      // Validate query parameters
      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          logger.warn({ errors: result.error.issues }, 'Query validation failed');
          res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid query parameters',
            details: formatZodErrors(result.error),
          });
          return;
        }
        req.query = result.data as typeof req.query;
      }

      // Validate route parameters
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          logger.warn({ errors: result.error.issues }, 'Params validation failed');
          res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid route parameters',
            details: formatZodErrors(result.error),
          });
          return;
        }
        req.params = result.data as typeof req.params;
      }

      next();
    } catch (error) {
      logger.error({ error }, 'Unexpected validation error');
      next(error);
    }
  };
}

/**
 * Simple body validation helper for common use case
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return validateRequest({ body: schema });
}

/**
 * Simple query validation helper
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return validateRequest({ query: schema });
}

/**
 * Simple params validation helper
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return validateRequest({ params: schema });
}
