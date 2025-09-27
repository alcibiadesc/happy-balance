import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";

// Tipo para el tema
export type Theme = "light" | "dark" | "system";

// Función para obtener el tema del sistema
function getSystemTheme(): "light" | "dark" {
  if (!browser) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Función para obtener el tema inicial
function getInitialTheme(): Theme {
  if (!browser) return "system";

  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark" || saved === "system") {
    return saved;
  }
  return "system";
}

// Store principal del tema
export const theme = writable<Theme>(getInitialTheme());

// Store derivado para el tema efectivo (resuelve 'system' al tema real)
export const effectiveTheme = derived(theme, ($theme) => {
  if ($theme === "system") {
    return getSystemTheme();
  }
  return $theme;
});

// Función para cambiar el tema
export function setTheme(newTheme: Theme) {
  theme.set(newTheme);
  if (browser) {
    applyTheme(newTheme);
  }
}

// Función para aplicar el tema al DOM con optimizaciones
export function applyTheme(theme: Theme) {
  if (!browser) return;

  const effectiveTheme = theme === "system" ? getSystemTheme() : theme;

  // Use requestAnimationFrame for smoother transition
  requestAnimationFrame(() => {
    const root = document.documentElement;

    // Batch DOM operations
    if (effectiveTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }

    // Force a single reflow/repaint
    void root.offsetHeight;
  });
}

// Escuchar cambios del sistema
if (browser) {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      const currentTheme = getInitialTheme();
      if (currentTheme === "system") {
        applyTheme("system");
      }
    });
}
