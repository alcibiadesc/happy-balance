import { describe, it, expect } from 'vitest';
import {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalError,
} from '@infrastructure/errors/AppError';

describe('AppError Classes', () => {
  describe('AppError', () => {
    it('should create an error with default values', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.details).toBeUndefined();
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should create an error with custom values', () => {
      const details = { field: 'email', issue: 'invalid' };
      const error = new AppError('Custom error', 422, false, details);

      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(422);
      expect(error.isOperational).toBe(false);
      expect(error.details).toEqual(details);
    });

    it('should have a proper stack trace', () => {
      const error = new AppError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('BadRequestError', () => {
    it('should create a 400 error', () => {
      const error = new BadRequestError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(BadRequestError);
      expect(error).toBeInstanceOf(AppError);
    });

    it('should use default message when not provided', () => {
      const error = new BadRequestError();

      expect(error.message).toBe('Bad Request');
    });

    it('should include details when provided', () => {
      const details = [{ field: 'name', error: 'required' }];
      const error = new BadRequestError('Validation failed', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('ValidationError', () => {
    it('should create a 400 validation error', () => {
      const details = [{ path: ['email'], message: 'Invalid email format' }];
      const error = new ValidationError('Validation error', details);

      expect(error.message).toBe('Validation error');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(BadRequestError);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error', () => {
      const error = new UnauthorizedError('Token expired');

      expect(error.message).toBe('Token expired');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(UnauthorizedError);
    });

    it('should use default message', () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe('Unauthorized');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a 403 error', () => {
      const error = new ForbiddenError('Access denied');

      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error).toBeInstanceOf(ForbiddenError);
    });

    it('should use default message', () => {
      const error = new ForbiddenError();

      expect(error.message).toBe('Forbidden');
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error with resource name', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should use default resource name', () => {
      const error = new NotFoundError();

      expect(error.message).toBe('Resource not found');
    });
  });

  describe('ConflictError', () => {
    it('should create a 409 error', () => {
      const error = new ConflictError('Email already exists');

      expect(error.message).toBe('Email already exists');
      expect(error.statusCode).toBe(409);
      expect(error).toBeInstanceOf(ConflictError);
    });

    it('should use default message', () => {
      const error = new ConflictError();

      expect(error.message).toBe('Resource conflict');
    });
  });

  describe('InternalError', () => {
    it('should create a 500 error', () => {
      const error = new InternalError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false); // Non-operational by default
      expect(error).toBeInstanceOf(InternalError);
    });

    it('should use default message', () => {
      const error = new InternalError();

      expect(error.message).toBe('Internal server error');
    });
  });

  describe('Error inheritance chain', () => {
    it('should maintain proper instanceof checks', () => {
      const validationError = new ValidationError('Test');
      const badRequestError = new BadRequestError('Test');
      const notFoundError = new NotFoundError('Test');

      // ValidationError is a BadRequestError
      expect(validationError instanceof BadRequestError).toBe(true);
      expect(validationError instanceof AppError).toBe(true);
      expect(validationError instanceof Error).toBe(true);

      // BadRequestError is an AppError
      expect(badRequestError instanceof AppError).toBe(true);
      expect(badRequestError instanceof Error).toBe(true);
      expect(badRequestError instanceof ValidationError).toBe(false);

      // NotFoundError is not a BadRequestError
      expect(notFoundError instanceof BadRequestError).toBe(false);
      expect(notFoundError instanceof AppError).toBe(true);
    });
  });
});
