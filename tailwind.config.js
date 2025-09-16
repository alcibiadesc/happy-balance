/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Paleta Japonesa
        "evening-sea": "#023c46",
        froly: "#f5796c",
        bridesmaid: "#fef7ee",
        acapulco: "#7abaa5",
        sunglow: "#fecd2c",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        japanese: ["Noto Sans JP", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        japanese: {
          primary: "#7abaa5", // acapulco
          secondary: "#f5796c", // froly
          accent: "#fecd2c", // sunglow
          neutral: "#023c46", // evening-sea
          "base-100": "#fef7ee", // bridesmaid
          "base-200": "#f8f1e4",
          "base-300": "#f2ead8",
          info: "#7abaa5",
          success: "#7abaa5",
          warning: "#fecd2c",
          error: "#f5796c",
        },
        dark: {
          primary: "#7abaa5", // acapulco
          secondary: "#f5796c", // froly
          accent: "#fecd2c", // sunglow
          neutral: "#fef7ee", // bridesmaid (invertido para dark)
          "base-100": "#023c46", // evening-sea (fondo oscuro)
          "base-200": "#034a57",
          "base-300": "#045864",
          info: "#7abaa5",
          success: "#7abaa5",
          warning: "#fecd2c",
          error: "#f5796c",
        },
      },
    ],
  },
};
