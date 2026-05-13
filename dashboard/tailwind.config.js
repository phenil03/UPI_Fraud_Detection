/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        dark: {
          900: '#0a0e1a',
          800: '#111827',
          700: '#1a1f35',
          600: '#222842',
          500: '#2d3555',
        },
        accent: {
          purple: '#6366f1',
          violet: '#8b5cf6',
          teal: '#14b8a6',
          rose: '#f43f5e',
          amber: '#f59e0b',
          sky: '#0ea5e9',
          emerald: '#10b981',
        },
      },
    },
  },
  plugins: [],
}
