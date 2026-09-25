/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        winDark: {
          bg: '#18181b',
          surface: '#27272a',
          card: '#202023',
          border: '#3f3f46',
          hover: '#323238',
          accent: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}
