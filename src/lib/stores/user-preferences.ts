import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";

export interface UserPreferences {
  id?: string;
  userId: string;
  currency: string;
  language: string;
  theme: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Default preferences
const DEFAULT_PREFERENCES: UserPreferences = {
  userId: "default",
  currency: "EUR",
  language: "en",
  theme: "light",
};

// Create writable store
function createUserPreferencesStore() {
  const { subscribe, set, update } =
    writable<UserPreferences>(DEFAULT_PREFERENCES);

  return {
    subscribe,

    // Load preferences from database or localStorage fallback
    async load() {
      if (!browser) return;

      try {
        // Try to load from database first
        const response = await fetch(`${API_BASE}/preferences/default`);
        if (response.ok) {
          const preferences = await response.json();
          set(preferences);

          // Sync with localStorage to maintain fallback
          localStorage.setItem("userPreferences", JSON.stringify(preferences));
        } else {
          // Fallback to localStorage
          const stored = localStorage.getItem("userPreferences");
          if (stored) {
            const preferences = JSON.parse(stored);
            set(preferences);
          } else {
            // Create default preferences in database if none exist
            await this.save(DEFAULT_PREFERENCES);
          }
        }
      } catch (error) {
        console.warn(
          "Failed to load preferences from database, using localStorage fallback",
        );

        // Fallback to localStorage
        const stored = localStorage.getItem("userPreferences");
        if (stored) {
          const preferences = JSON.parse(stored);
          set(preferences);
        }
      }
    },

    // Save preferences to both database and localStorage
    async save(preferences: Partial<UserPreferences>) {
      try {
        // Update database
        const response = await fetch(`${API_BASE}/preferences/default`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preferences),
        });

        if (response.ok) {
          const updatedPreferences = await response.json();
          set(updatedPreferences);

          // Keep localStorage in sync
          localStorage.setItem(
            "userPreferences",
            JSON.stringify(updatedPreferences),
          );
        } else {
          throw new Error("Failed to save to database");
        }
      } catch (error) {
        console.warn(
          "Failed to save preferences to database, updating localStorage only",
        );

        // Fallback to localStorage update only
        update((current) => {
          const updated = { ...current, ...preferences };
          localStorage.setItem("userPreferences", JSON.stringify(updated));
          return updated;
        });
      }
    },

    // Update specific preference
    async updateCurrency(currency: string) {
      await this.save({ currency });
    },

    async updateLanguage(language: string) {
      await this.save({ language });
    },

    async updateTheme(theme: string) {
      await this.save({ theme });
    },
  };
}

export const userPreferences = createUserPreferencesStore();

// Derived stores for easy access to individual preferences
export const currency = derived(userPreferences, ($prefs) => $prefs.currency);
export const language = derived(userPreferences, ($prefs) => $prefs.language);
export const theme = derived(userPreferences, ($prefs) => $prefs.theme);
