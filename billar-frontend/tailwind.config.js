/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        billiard: {
          dark: '#0f172a',
          card: '#1e293b',
          accent: '#10b981',
          libre: '#10b981',
          ocupada: '#ef4444',
          porcobrar: '#f59e0b',
        }
      }
    },
  },
  plugins: [],
}
