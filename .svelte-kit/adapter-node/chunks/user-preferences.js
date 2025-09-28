import { G as sanitize_props, I as spread_props, J as slot } from "./index2.js";
import { I as Icon } from "./x.js";
import { d as derived, w as writable } from "./index.js";
function Upload($$payload, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.542.0 - ISC
   *
   * ISC License
   *
   * Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2023 as part of Feather (MIT). All other copyright (c) for Lucide are held by Lucide Contributors 2025.
   *
   * Permission to use, copy, modify, and/or distribute this software for any
   * purpose with or without fee is hereby granted, provided that the above
   * copyright notice and this permission notice appear in all copies.
   *
   * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
   * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
   * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
   * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
   * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
   * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
   * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * ---
   *
   * The MIT License (MIT) (for portions derived from Feather)
   *
   * Copyright (c) 2013-2023 Cole Bemis
   *
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   *
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   *
   */
  const iconNode = [
    ["path", { "d": "M12 3v12" }],
    ["path", { "d": "m17 8-5-5-5 5" }],
    ["path", { "d": "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }]
  ];
  Icon($$payload, spread_props([
    { name: "upload" },
    $$sanitized_props,
    {
      /**
       * @component @name Upload
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgM3YxMiIgLz4KICA8cGF0aCBkPSJtMTcgOC01LTUtNSA1IiAvPgogIDxwYXRoIGQ9Ik0yMSAxNXY0YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0ydi00IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/upload
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$payload2) => {
        $$payload2.out.push(`<!---->`);
        slot($$payload2, $$props, "default", {}, null);
        $$payload2.out.push(`<!---->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function getSystemTheme() {
  return "light";
}
function getInitialTheme() {
  return "system";
}
const theme = writable(getInitialTheme());
const effectiveTheme = derived(theme, ($theme) => {
  if ($theme === "system") {
    return getSystemTheme();
  }
  return $theme;
});
function setTheme(newTheme) {
  theme.set(newTheme);
}
const API_BASE = "http://localhost:3008/api";
const DEFAULT_PREFERENCES = {
  userId: "default",
  currency: "EUR",
  language: "en",
  theme: "light"
};
function createUserPreferencesStore() {
  const { subscribe, set, update } = writable(DEFAULT_PREFERENCES);
  return {
    subscribe,
    // Load preferences from database or localStorage fallback
    async load() {
      return;
    },
    // Save preferences to both database and localStorage
    async save(preferences) {
      try {
        const response = await fetch(`${API_BASE}/preferences/default`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(preferences)
        });
        if (response.ok) {
          const updatedPreferences = await response.json();
          set(updatedPreferences);
          localStorage.setItem(
            "userPreferences",
            JSON.stringify(updatedPreferences)
          );
        } else {
          throw new Error("Failed to save to database");
        }
      } catch (error) {
        console.warn(
          "Failed to save preferences to database, updating localStorage only"
        );
        update((current) => {
          const updated = { ...current, ...preferences };
          localStorage.setItem("userPreferences", JSON.stringify(updated));
          return updated;
        });
      }
    },
    // Update specific preference
    async updateCurrency(currency2) {
      await this.save({ currency: currency2 });
    },
    async updateLanguage(language2) {
      await this.save({ language: language2 });
    },
    async updateTheme(theme2) {
      await this.save({ theme: theme2 });
    }
  };
}
const userPreferences = createUserPreferencesStore();
derived(userPreferences, ($prefs) => $prefs.currency);
derived(userPreferences, ($prefs) => $prefs.language);
derived(userPreferences, ($prefs) => $prefs.theme);
export {
  Upload as U,
  effectiveTheme as e,
  setTheme as s,
  theme as t,
  userPreferences as u
};
