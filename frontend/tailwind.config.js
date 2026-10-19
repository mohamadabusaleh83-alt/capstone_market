/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#101E42',
          dark: '#0B152E',
          deep: '#070D1E',
          card: '#101E42',
          surface: '#152550',
          50: '#F4F8FC',
          100: '#E2EAF8',
          200: '#C5D6F2',
          300: '#9ABCEC',
          400: '#5F97E2',
          500: '#2499F2',
          600: '#1D7BC3',
          700: '#175E95',
          800: '#101E42',
          900: '#0C1733',
          950: '#070E20',
        },
        brand: {
          navy: '#101E42',
          'navy-dark': '#0B152E',
          'navy-card': '#101E42',
          'navy-surface': '#152550',
          blue: '#2499F2',
          'blue-hover': '#1B87D9',
          turquoise: '#28C8C0',
          mint: '#77DCC1',
          bgLight: '#F4F8FC',
        }
      },
      boxShadow: {
        'navy-sm': '0 2px 8px -1px rgba(16, 30, 66, 0.08)',
        'navy-md': '0 4px 16px -2px rgba(16, 30, 66, 0.12)',
        'navy-lg': '0 10px 25px -3px rgba(16, 30, 66, 0.18)',
        'glow-blue': '0 0 20px -3px rgba(36, 153, 242, 0.35)',
        'glow-turquoise': '0 0 20px -3px rgba(40, 200, 192, 0.35)',
        'glow-mint': '0 0 20px -3px rgba(119, 220, 193, 0.35)',
      }
    },
  },
  plugins: [],
}