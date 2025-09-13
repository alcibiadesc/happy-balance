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
  plugins: [],
};
