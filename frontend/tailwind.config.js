/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dbu: {
          50: '#eef8f2',
          100: '#d5eedd',
          500: '#0b7a43',
          600: '#0b5d3b',
          700: '#08462c',
          900: '#052616',
        },
        gold: '#c9a227',
      },
      fontFamily: {
        sans: ['Source Sans 3', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
