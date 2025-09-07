import { beforeAll, afterAll, afterEach } from 'vitest';
import { resetDependencies } from '$lib/config/dependencies.js';

// Global test setup
beforeAll(async () => {
	// Setup test environment
	process.env.NODE_ENV = 'test';
	process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_expense_tracker';
});

// Clean up after each test
afterEach(() => {
	// Reset dependencies to ensure test isolation
	resetDependencies();
});

// Global teardown
afterAll(async () => {
	// Clean up any global resources
});