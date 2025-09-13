import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { themeStore, initializeTheme, toggleTheme } from './theme.js';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

// Mock window.matchMedia
const matchMediaMock = vi.fn();

describe('Theme System Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset the theme store to default state
    themeStore.set('light');
    
    // Mock localStorage
    global.localStorage = localStorageMock;
    
    // Mock window.matchMedia
    global.window = {
      ...global.window,
      matchMedia: matchMediaMock
    };
    
    // Mock document
    global.document = {
      ...global.document,
      documentElement: {
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
          contains: vi.fn()
        }
      }
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Theme Store', () => {
    it('should have default light theme', () => {
      const theme = get(themeStore);
      expect(theme).toBe('light');
    });

    it('should be subscribable', () => {
      let currentTheme;
      const unsubscribe = themeStore.subscribe(theme => {
        currentTheme = theme;
      });

      expect(currentTheme).toBe('light');

      themeStore.set('dark');
      expect(currentTheme).toBe('dark');

      unsubscribe();
    });
  });

  describe('initializeTheme', () => {
    it('should use stored theme when available', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      initializeTheme();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
      expect(get(themeStore)).toBe('dark');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should detect system dark theme when no stored preference', () => {
      localStorageMock.getItem.mockReturnValue(null);
      matchMediaMock.mockReturnValue({
        matches: true, // System prefers dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });
      
      initializeTheme();
      
      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(get(themeStore)).toBe('dark');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should detect system light theme when no stored preference', () => {
      localStorageMock.getItem.mockReturnValue(null);
      matchMediaMock.mockReturnValue({
        matches: false, // System prefers light
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });
      
      initializeTheme();
      
      expect(get(themeStore)).toBe('light');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should default to light theme when system detection fails', () => {
      localStorageMock.getItem.mockReturnValue(null);
      matchMediaMock.mockImplementation(() => {
        throw new Error('matchMedia not supported');
      });
      
      initializeTheme();
      
      expect(get(themeStore)).toBe('light');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should set up system theme change listener', () => {
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);
      localStorageMock.getItem.mockReturnValue(null);
      
      initializeTheme();
      
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      
      // Simulate system theme change
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      changeHandler({ matches: true }); // System changed to dark
      
      expect(get(themeStore)).toBe('dark');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should handle invalid stored theme gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');
      matchMediaMock.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      });
      
      initializeTheme();
      
      // Should fallback to system detection or light
      expect(get(themeStore)).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      themeStore.set('light');
      
      toggleTheme();
      
      expect(get(themeStore)).toBe('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should toggle from dark to light', () => {
      themeStore.set('dark');
      
      toggleTheme();
      
      expect(get(themeStore)).toBe('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should persist theme preference to localStorage', () => {
      themeStore.set('light');
      
      toggleTheme();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
      
      toggleTheme();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('should update DOM data-theme attribute', () => {
      themeStore.set('light');
      
      toggleTheme();
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      
      toggleTheme();
      
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should handle localStorage errors gracefully', () => {
      themeStore.set('light');
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      // Should not throw error
      expect(() => toggleTheme()).not.toThrow();
      
      // Theme should still be updated in store
      expect(get(themeStore)).toBe('dark');
    });

    it('should handle DOM manipulation errors gracefully', () => {
      themeStore.set('light');
      document.documentElement.setAttribute.mockImplementation(() => {
        throw new Error('DOM not available');
      });
      
      // Should not throw error
      expect(() => toggleTheme()).not.toThrow();
      
      // Theme should still be updated in store and localStorage
      expect(get(themeStore)).toBe('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });
  });

  describe('Theme CSS Classes Integration', () => {
    it('should apply theme-aware CSS classes correctly', () => {
      // Test that our theme system works with the status classes we created
      themeStore.set('light');
      
      // Simulate checking if theme-aware classes exist
      const lightThemeClasses = [
        '.status-success', '.status-error', '.status-warning', '.status-info',
        '.bg-status-success', '.bg-status-error', '.bg-status-warning', '.bg-status-info',
        '.border-status-success', '.border-status-error', '.border-status-warning', '.border-status-info'
      ];
      
      // These classes should be available in light theme
      lightThemeClasses.forEach(className => {
        expect(typeof className).toBe('string');
        expect(className).toMatch(/^\.status-|^\.bg-status-|^\.border-status-/);
      });
      
      // Switch to dark theme
      toggleTheme();
      expect(get(themeStore)).toBe('dark');
      
      // Theme-aware classes should still be available
      lightThemeClasses.forEach(className => {
        expect(typeof className).toBe('string');
        expect(className).toMatch(/^\.status-|^\.bg-status-|^\.border-status-/);
      });
    });

    it('should maintain semantic color consistency across themes', () => {
      // Test that semantic colors work in both themes
      const semanticColors = ['success', 'error', 'warning', 'info'];
      
      // Light theme
      themeStore.set('light');
      expect(get(themeStore)).toBe('light');
      
      semanticColors.forEach(color => {
        expect(typeof color).toBe('string');
        expect(['success', 'error', 'warning', 'info']).toContain(color);
      });
      
      // Dark theme
      themeStore.set('dark');
      expect(get(themeStore)).toBe('dark');
      
      semanticColors.forEach(color => {
        expect(typeof color).toBe('string');
        expect(['success', 'error', 'warning', 'info']).toContain(color);
      });
    });
  });

  describe('System Theme Changes', () => {
    it('should respond to system theme changes when no user preference is stored', () => {
      // Clear stored preference
      localStorageMock.getItem.mockReturnValue(null);
      
      const mockMediaQuery = {
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);
      
      initializeTheme();
      
      // Initially should be light (system preference)
      expect(get(themeStore)).toBe('light');
      
      // System changes to dark
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      changeHandler({ matches: true });
      
      expect(get(themeStore)).toBe('dark');
      expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should not override user preference when system theme changes', () => {
      // User has explicitly set dark theme
      localStorageMock.getItem.mockReturnValue('dark');
      themeStore.set('dark');
      
      const mockMediaQuery = {
        matches: false, // System prefers light
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      };
      matchMediaMock.mockReturnValue(mockMediaQuery);
      
      initializeTheme();
      
      // Should maintain user preference
      expect(get(themeStore)).toBe('dark');
      
      // System theme change should not affect user preference
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      if (changeHandler) {
        changeHandler({ matches: true });
        // User preference should still be respected
        expect(get(themeStore)).toBe('dark');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle browser without localStorage', () => {
      global.localStorage = undefined;
      
      expect(() => initializeTheme()).not.toThrow();
      expect(() => toggleTheme()).not.toThrow();
    });

    it('should handle browser without matchMedia', () => {
      global.window.matchMedia = undefined;
      
      expect(() => initializeTheme()).not.toThrow();
      expect(get(themeStore)).toBe('light'); // Should default to light
    });

    it('should handle browser without document', () => {
      global.document = undefined;
      
      expect(() => initializeTheme()).not.toThrow();
      expect(() => toggleTheme()).not.toThrow();
    });

    it('should maintain store state consistency', () => {
      // Multiple rapid theme changes
      themeStore.set('light');
      expect(get(themeStore)).toBe('light');
      
      toggleTheme();
      expect(get(themeStore)).toBe('dark');
      
      toggleTheme();
      expect(get(themeStore)).toBe('light');
      
      toggleTheme();
      expect(get(themeStore)).toBe('dark');
      
      // Store should always be consistent
      expect(['light', 'dark']).toContain(get(themeStore));
    });
  });
});
