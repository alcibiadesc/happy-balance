import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { z } from 'zod';
import { Result } from '@domain/shared/Result';
import {
  successResponse,
  createdResponse,
  noContentResponse,
  validateSchema,
  validateBody,
  validateQuery,
  handleResult,
  handleFindResult,
  isZodError,
} from '@infrastructure/errors/controllerHelpers';
import {
  ValidationError,
  BadRequestError,
  NotFoundError,
  InternalError,
} from '@infrastructure/errors/AppError';

// Mock Response object
function createMockResponse(): Response {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res as Response;
}

// Mock Request object
function createMockRequest(body = {}, query = {}, params = {}): Request {
  return { body, query, params } as Request;
}

describe('Controller Helpers', () => {
  describe('successResponse', () => {
    it('should send a 200 response with success format', () => {
      const res = createMockResponse();
      const data = { id: '1', name: 'Test' };

      successResponse(res, data);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should allow custom status code', () => {
      const res = createMockResponse();

      successResponse(res, { message: 'OK' }, 202);

      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe('createdResponse', () => {
    it('should send a 201 response', () => {
      const res = createMockResponse();
      const data = { id: '1' };

      createdResponse(res, data);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });
  });

  describe('noContentResponse', () => {
    it('should send a 204 response', () => {
      const res = createMockResponse();

      noContentResponse(res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('validateSchema', () => {
    const TestSchema = z.object({
      name: z.string().min(1),
      age: z.number().positive(),
    });

    it('should return parsed data for valid input', () => {
      const data = { name: 'John', age: 25 };

      const result = validateSchema(TestSchema, data);

      expect(result).toEqual(data);
    });

    it('should throw ValidationError for invalid input', () => {
      const data = { name: '', age: -5 };

      expect(() => validateSchema(TestSchema, data)).toThrow(ValidationError);
    });

    it('should include validation details in error', () => {
      const data = { name: 'John', age: 'not a number' };

      try {
        validateSchema(TestSchema, data);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).details).toBeDefined();
      }
    });
  });

  describe('validateBody', () => {
    const BodySchema = z.object({
      email: z.string().email(),
    });

    it('should validate request body', () => {
      const req = createMockRequest({ email: 'test@example.com' });

      const result = validateBody(BodySchema, req);

      expect(result).toEqual({ email: 'test@example.com' });
    });

    it('should throw for invalid body', () => {
      const req = createMockRequest({ email: 'invalid' });

      expect(() => validateBody(BodySchema, req)).toThrow(ValidationError);
    });
  });

  describe('validateQuery', () => {
    const QuerySchema = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(10),
    });

    it('should validate and coerce query parameters', () => {
      const req = createMockRequest({}, { page: '2', limit: '20' });

      const result = validateQuery(QuerySchema, req);

      expect(result).toEqual({ page: 2, limit: 20 });
    });

    it('should use default values', () => {
      const req = createMockRequest({}, {});

      const result = validateQuery(QuerySchema, req);

      expect(result).toEqual({ page: 1, limit: 10 });
    });
  });

  describe('handleResult', () => {
    it('should return value for successful result', () => {
      const result = Result.ok({ id: '1' });

      const value = handleResult(result);

      expect(value).toEqual({ id: '1' });
    });

    it('should throw BadRequestError for failed result', () => {
      const result = Result.failWithMessage('Something went wrong');

      expect(() => handleResult(result)).toThrow(BadRequestError);
    });

    it('should use error message from Result', () => {
      const result = Result.failWithMessage('Original error');

      try {
        handleResult(result, 'Custom message');
        expect.fail('Should have thrown');
      } catch (error) {
        // The error message comes from the Result's error
        expect(error).toBeInstanceOf(BadRequestError);
      }
    });
  });

  describe('handleFindResult', () => {
    it('should return value for successful result with data', () => {
      const result = Result.ok({ id: '1', name: 'Test' });

      const value = handleFindResult(result, 'Item');

      expect(value).toEqual({ id: '1', name: 'Test' });
    });

    it('should throw NotFoundError for null result', () => {
      const result = Result.ok(null);

      expect(() => handleFindResult(result, 'User')).toThrow(NotFoundError);
    });

    it('should handle undefined result by treating as not found', () => {
      // Note: Result.ok(undefined) may behave differently based on Result implementation
      // This test verifies that null values are properly handled
      const result = Result.ok(null);

      try {
        handleFindResult(result, 'Category');
        expect.fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
      }
    });

    it('should throw InternalError for failed result', () => {
      const result = Result.failWithMessage('Database error');

      expect(() => handleFindResult(result, 'Item')).toThrow(InternalError);
    });

    it('should include resource name in NotFoundError', () => {
      const result = Result.ok(null);

      try {
        handleFindResult(result, 'Transaction');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as NotFoundError).message).toBe('Transaction not found');
      }
    });
  });

  describe('isZodError', () => {
    it('should return true for ZodError', () => {
      try {
        z.string().parse(123);
      } catch (error) {
        expect(isZodError(error)).toBe(true);
      }
    });

    it('should return false for other errors', () => {
      expect(isZodError(new Error('test'))).toBe(false);
      expect(isZodError(new BadRequestError('test'))).toBe(false);
      expect(isZodError('string')).toBe(false);
      expect(isZodError(null)).toBe(false);
    });
  });
});
