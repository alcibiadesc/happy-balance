import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { theme, toggleTheme } from './theme.js';

// Mock browser environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock document
Object.defineProperty(document, 'documentElement', {
  value: {
    setAttribute: vi.fn(),
    classList: {
      remove: vi.fn(),
      add: vi.fn(),
    },
  },
});

describe('Theme Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Initial Theme Detection', () => {
    it('should default to light theme when no preference is stored', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      // Re-import to trigger initialization
      vi.resetModules();
      const { theme } = require('./theme.js');
      
      expect(get(theme)).toBe('light');
    });

    it('should use stored preference when available', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      vi.resetModules();
      const { theme } = require('./theme.js');
      
      expect(get(theme)).toBe('dark');
    });

    it('should use system preference when no stored preference', () => {
      localStorageMock.getItem.mockReturnValue(null);
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      
      vi.resetModules();
      const { theme } = require('./theme.js');
      
      expect(get(theme)).toBe('dark');
    });
  });

  describe('Theme Toggle Functionality', () => {
    it('should toggle from light to dark', () => {
      // Set initial theme to light
      const currentTheme = get(theme);
      expect(currentTheme).toBe('light');
      
      toggleTheme();
      
      const newTheme = get(theme);
      expect(newTheme).toBe('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should update DOM with DaisyUI data-theme attribute', () => {
      toggleTheme();
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', expect.any(String));
    });

    it('should update DOM classes for backward compatibility', () => {
      toggleTheme();
      
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(document.documentElement.classList.add).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe('DOM Integration', () => {
    it('should set data-theme attribute on initialization', () => {
      // The theme system should set data-theme on load
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', expect.any(String));
    });

    it('should set class for backward compatibility on initialization', () => {
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('light', 'dark');
      expect(document.documentElement.classList.add).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe('System Theme Change Handling', () => {
    it('should listen for system theme changes', () => {
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should update theme when system preference changes and no manual preference is stored', () => {
      // Mock no stored preference
      localStorageMock.getItem.mockReturnValue(null);
      
      // Mock system preference change
      const mockMatchMedia = {
        matches: true,
        addEventListener: vi.fn()
      };
      window.matchMedia = vi.fn().mockReturnValue(mockMatchMedia);
      
      vi.resetModules();
      require('./theme.js');
      
      // Verify event listener was added
      expect(mockMatchMedia.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  describe('Theme Values Validation', () => {
    it('should only allow valid theme values', () => {
      const currentTheme = get(theme);
      expect(['light', 'dark']).toContain(currentTheme);
    });

    it('should handle invalid stored theme values gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');
      
      vi.resetModules();
      const { theme } = require('./theme.js');
      
      // Should fall back to system preference or default
      expect(['light', 'dark']).toContain(get(theme));
    });
  });
});
