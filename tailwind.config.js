/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm marigold — primary accent. Distinct from the generic
        // purple-SaaS default and from Claude's own terracotta.
        brand: {
          50: "#fdf6e8",
          100: "#f9e8c2",
          300: "#eec476",
          500: "#e3a73b",
          600: "#c88a26",
          700: "#a06d1c",
          950: "#2a1d08",
        },
        // Deep savanna green — secondary accent, used for verification,
        // trust, and success signals.
        acacia: {
          300: "#7fb5a3",
          500: "#2f6f5c",
          600: "#255a4a",
        },
        // Warm brick — used sparingly for warnings/alerts instead of a
        // cold system red.
        rust: {
          400: "#d97a5a",
          500: "#b5502f",
        },
        ink: "#14171f",
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
