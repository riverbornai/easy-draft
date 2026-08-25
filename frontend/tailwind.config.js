/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        brand: {
          teal:   '#0d9488',
          purple: '#7c3aed',
          amber:  '#d97706',
          red:    '#dc2626',
        },
      },
    },
  },
  plugins: [],
};
