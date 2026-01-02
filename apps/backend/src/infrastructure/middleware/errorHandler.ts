import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@infrastructure/errors/AppError';
import { logger } from '@infrastructure/logging/logger';

/**
 * Global error handler middleware
 * Handles all errors thrown in the application and returns consistent responses
 */
export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction) => {
  // Build log context
  const logContext = {
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userId: (req as any).user?.id,
  };

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    logger.warn({ ...logContext, errors: error.errors }, 'Validation error');

    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors,
    });
    return;
  }

  // Handle custom application errors
  if (error instanceof AppError) {
    // Only log stack trace for non-operational (unexpected) errors
    if (!error.isOperational) {
      logger.error(
        { ...logContext, message: error.message, stack: error.stack },
        'Application error'
      );
    } else {
      logger.warn(
        { ...logContext, message: error.message, statusCode: error.statusCode },
        'Operational error'
      );
    }

    const responseBody: Record<string, unknown> = {
      success: false,
      error: error.message,
    };

    if (error.details) {
      responseBody.details = error.details;
    }

    if (process.env.NODE_ENV === 'development' && !error.isOperational) {
      responseBody.stack = error.stack;
    }

    res.status(error.statusCode).json(responseBody);
    return;
  }

  // Handle unknown errors
  logger.error(
    {
      ...logContext,
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    'Unhandled error'
  );

  const responseBody: Record<string, unknown> = {
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  };

  if (process.env.NODE_ENV === 'development') {
    responseBody.stack = error.stack;
    responseBody.name = error.name;
  }

  res.status(500).json(responseBody);
};

/**
 * 404 Not Found handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
