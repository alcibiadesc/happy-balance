import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import {
  userPreferences,
  currency,
  language,
  theme,
} from "../user-preferences";

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock browser environment
vi.mock("$app/environment", () => ({
  browser: true,
}));

describe("User Preferences Store", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("should have default preferences", () => {
    const prefs = get(userPreferences);
    expect(prefs.currency).toBe("EUR");
    expect(prefs.language).toBe("en");
    expect(prefs.theme).toBe("light");
  });

  it("should provide derived stores", () => {
    expect(get(currency)).toBe("EUR");
    expect(get(language)).toBe("en");
    expect(get(theme)).toBe("light");
  });

  it("should load preferences from localStorage when API fails", async () => {
    // Mock API failure
    (global.fetch as any).mockRejectedValue(new Error("API unavailable"));

    // Set up localStorage
    const storedPrefs = {
      userId: "default",
      currency: "USD",
      language: "es",
      theme: "dark",
    };
    localStorageMock.setItem("userPreferences", JSON.stringify(storedPrefs));

    await userPreferences.load();

    const prefs = get(userPreferences);
    expect(prefs.currency).toBe("USD");
    expect(prefs.language).toBe("es");
    expect(prefs.theme).toBe("dark");
  });

  it("should save preferences to localStorage when API fails", async () => {
    // Mock API failure
    (global.fetch as any).mockRejectedValue(new Error("API unavailable"));

    await userPreferences.save({ currency: "GBP" });

    const stored = JSON.parse(
      localStorageMock.getItem("userPreferences") || "{}",
    );
    expect(stored.currency).toBe("GBP");
  });

  it("should update individual preference types", async () => {
    // Mock successful API response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          userId: "default",
          currency: "JPY",
          language: "en",
          theme: "light",
        }),
    });

    await userPreferences.updateCurrency("JPY");

    const prefs = get(userPreferences);
    expect(prefs.currency).toBe("JPY");
  });

  it("should sync preferences with API and localStorage", async () => {
    const mockPrefs = {
      id: "1",
      userId: "default",
      currency: "USD",
      language: "es",
      theme: "dark",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock successful API responses
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPrefs),
    });

    await userPreferences.load();

    const prefs = get(userPreferences);
    expect(prefs.currency).toBe("USD");
    expect(prefs.language).toBe("es");
    expect(prefs.theme).toBe("dark");

    // Check localStorage sync
    const stored = JSON.parse(
      localStorageMock.getItem("userPreferences") || "{}",
    );
    expect(stored.currency).toBe("USD");
    expect(stored.language).toBe("es");
    expect(stored.theme).toBe("dark");
  });
});
