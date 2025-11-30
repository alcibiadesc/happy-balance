import '@testing-library/jest-dom/vitest';

// Mock SvelteKit modules
vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
  afterNavigate: vi.fn(),
  beforeNavigate: vi.fn(),
}));

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn(),
  },
  navigating: {
    subscribe: vi.fn(),
  },
  updated: {
    subscribe: vi.fn(),
    check: vi.fn(),
  },
}));

vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
  building: false,
}));

// Global test utilities
beforeEach(() => {
  vi.clearAllMocks();
});
