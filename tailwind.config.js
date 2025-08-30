/** @type {import('@tailwindcss/v4').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Financial colors
        income: '#10b981', // green
        expense: '#ef4444', // red
        savings: '#3b82f6', // blue
        investment: '#8b5cf6', // purple
        debt: '#f59e0b', // amber
      }
    },
  },
  plugins: [],
};