import { vi } from 'vitest';

// Mock Chart.js
vi.mock('chart.js/auto', () => ({
  default: vi.fn(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    resize: vi.fn(),
    data: {
      labels: [],
      datasets: []
    },
    options: {
      scales: {
        x: { ticks: {} },
        y: { ticks: {}, grid: {} }
      },
      plugins: {
        legend: { labels: {} }
      }
    }
  }))
}));

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop: string) => {
      const mockValues: Record<string, string> = {
        '--text-muted': '#666',
        '--text-secondary': '#888',
        '--text-primary': '#000',
        '--acapulco': '#7abaa5'
      };
      return mockValues[prop] || '';
    }
  })
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock document.documentElement for theme testing
Object.defineProperty(document.documentElement, 'classList', {
  value: {
    contains: vi.fn((className: string) => className === 'dark'),
    add: vi.fn(),
    remove: vi.fn(),
    toggle: vi.fn()
  }
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});