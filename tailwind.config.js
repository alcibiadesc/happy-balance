/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Paleta Japonesa
        'evening-sea': '#023c46',
        'froly': '#f5796c',
        'bridesmaid': '#fef7ee',
        'acapulco': '#7abaa5',
        'sunglow': '#fecd2c',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        japanese: ['Noto Sans JP', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        japanese: {
          "primary": "#023c46",           // evening-sea
          "primary-content": "#fefefe",
          "secondary": "#7abaa5",          // acapulco  
          "secondary-content": "#023c46",
          "accent": "#fecd2c",             // sunglow
          "accent-content": "#023c46",
          "neutral": "#4a4a4a",
          "neutral-content": "#fefefe",
          "base-100": "#fef7ee",           // bridesmaid - fondo principal
          "base-200": "#f8f8f8",
          "base-300": "#f0f0f0",
          "base-content": "#023c46",
          "info": "#7abaa5",
          "success": "#7abaa5",
          "warning": "#fecd2c",
          "error": "#f5796c",              // froly
        },
        "japanese-dark": {
          "primary": "#7abaa5",
          "primary-content": "#1a1a1a",
          "secondary": "#fecd2c",
          "secondary-content": "#1a1a1a",
          "accent": "#f5796c",
          "accent-content": "#fefefe",
          "neutral": "#2a2a2a",
          "neutral-content": "#e8e8e8",
          "base-100": "#1a1a1a",
          "base-200": "#2a2a2a",
          "base-300": "#3a3a3a",
          "base-content": "#f0f0f0",
          "info": "#7abaa5",
          "success": "#7abaa5",
          "warning": "#fecd2c",
          "error": "#f5796c",
        }
      }
    ],
    darkTheme: "japanese-dark",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
  },
};
