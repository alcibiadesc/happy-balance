import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

// Detectar preferencia del usuario
function getInitialTheme(): Theme {
  if (!browser) return 'light';
  
  // Revisar localStorage primero
  const stored = localStorage.getItem('theme') as Theme;
  if (stored && (stored === 'light' || stored === 'dark')) {
    return stored;
  }
  
  // Usar preferencia del sistema
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Store del tema
export const theme = writable<Theme>(getInitialTheme());

// Función para cambiar tema
export function toggleTheme(): void {
  theme.update(current => {
    const newTheme = current === 'light' ? 'dark' : 'light';
    
    if (browser) {
      localStorage.setItem('theme', newTheme);
      
      // Update DaisyUI theme using data-theme attribute
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Also keep the class for backward compatibility with custom CSS
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
    }
    return newTheme;
  });
}

// Inicializar tema en el DOM
if (browser) {
  const initialTheme = getInitialTheme();
  
  // Set DaisyUI theme
  document.documentElement.setAttribute('data-theme', initialTheme);
  
  // Also set class for backward compatibility
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(initialTheme);
  
  // Escuchar cambios del tema del sistema
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      theme.set(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newTheme);
    }
  });
}