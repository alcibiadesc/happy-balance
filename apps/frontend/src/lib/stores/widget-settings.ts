import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { authStore } from '$lib/modules/auth/presentation/stores/authStore.svelte';
import { getApiUrl } from '$lib/utils/api-url';

export interface WidgetSettings<T = Record<string, unknown>> {
  id?: string;
  userId?: string;
  widgetId: string;
  settings: T;
  createdAt?: Date;
  updatedAt?: Date;
}

const API_BASE = getApiUrl();

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = authStore.getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// Cache for widget settings
const settingsCache = writable<Map<string, Record<string, unknown>>>(new Map());

// Debounce timers
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const widgetSettings = {
  subscribe: settingsCache.subscribe,

  /**
   * Get settings for a specific widget
   */
  async get<T = Record<string, unknown>>(widgetId: string): Promise<T | null> {
    if (!browser) return null;

    // Check cache first
    const cache = get(settingsCache);
    if (cache.has(widgetId)) {
      return cache.get(widgetId) as T;
    }

    try {
      const response = await fetch(`${API_BASE}/widgets/${widgetId}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const settings = data.settings || {};

        // Update cache
        settingsCache.update((c) => {
          c.set(widgetId, settings);
          return c;
        });

        // Also save to localStorage as backup
        localStorage.setItem(`widget_${widgetId}`, JSON.stringify(settings));

        return settings as T;
      }
    } catch (error) {
      console.warn(`Failed to load widget settings for ${widgetId}, using localStorage fallback`);
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(`widget_${widgetId}`);
    if (stored) {
      const settings = JSON.parse(stored);
      settingsCache.update((c) => {
        c.set(widgetId, settings);
        return c;
      });
      return settings as T;
    }

    return null;
  },

  /**
   * Save settings for a widget (debounced)
   */
  async save<T = Record<string, unknown>>(
    widgetId: string,
    settings: T,
    debounceMs = 500
  ): Promise<void> {
    if (!browser) return;

    // Update cache immediately
    settingsCache.update((c) => {
      c.set(widgetId, settings as Record<string, unknown>);
      return c;
    });

    // Save to localStorage immediately
    localStorage.setItem(`widget_${widgetId}`, JSON.stringify(settings));

    // Clear existing timer
    const existingTimer = saveTimers.get(widgetId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Debounce the API call
    const timer = setTimeout(async () => {
      try {
        await fetch(`${API_BASE}/widgets/${widgetId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ settings }),
        });
      } catch (error) {
        console.warn(`Failed to save widget settings for ${widgetId}`);
      }
      saveTimers.delete(widgetId);
    }, debounceMs);

    saveTimers.set(widgetId, timer);
  },

  /**
   * Delete settings for a widget
   */
  async delete(widgetId: string): Promise<void> {
    if (!browser) return;

    // Clear cache
    settingsCache.update((c) => {
      c.delete(widgetId);
      return c;
    });

    localStorage.removeItem(`widget_${widgetId}`);

    try {
      await fetch(`${API_BASE}/widgets/${widgetId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.warn(`Failed to delete widget settings for ${widgetId}`);
    }
  },

  /**
   * Load all widget settings for the current user
   */
  async loadAll(): Promise<void> {
    if (!browser) return;

    try {
      const response = await fetch(`${API_BASE}/widgets`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        settingsCache.update((c) => {
          for (const item of data) {
            c.set(item.widgetId, item.settings);
            localStorage.setItem(`widget_${item.widgetId}`, JSON.stringify(item.settings));
          }
          return c;
        });
      }
    } catch (error) {
      console.warn('Failed to load all widget settings');
    }
  },
};
