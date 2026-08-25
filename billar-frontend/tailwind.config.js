/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#f5fafa",
        "surface-container": "#eaefef",
        "surface-container-low": "#eff5f5",
        "surface-container-highest": "#dee3e3",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#171d1d",
        "on-surface-variant": "#3f494a",
        "outline-variant": "#bec8c9",
        "electric-cyan": "#00dbe9",
        "electric-purple": "#cf5cff",
        "on-primary-fixed": "#002022",
        "on-secondary-container": "#59007b",
        "tertiary-container": "#c3aa4e",
        "on-tertiary-container": "#4d3e00",
        "background": "#f5fafa",
      },
      fontFamily: {
        "headline-lg": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "stats-number": ["Inter", "sans-serif"],
      }
    }
  },
  plugins: [],
}
