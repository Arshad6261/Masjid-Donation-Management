/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        masjid: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0',
          300: '#86efac', 400: '#4ade80', 500: '#22c55e',
          600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d',
        },
        dargah: {
          green: '#1B6B3A', 'green-dark': '#0F4C2A',
          gold: '#C9900C', 'gold-light': '#F0C040',
          teal: '#0D7E6A', cream: '#F5F0E8',
          50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706',
          700: '#b45309', 800: '#92400e',
        },
        festival: {
          50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb',
          700: '#1d4ed8', 800: '#1e40af',
        }
      },
      fontFamily: {
        arabic: ['Amiri', 'serif'],
        body: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
