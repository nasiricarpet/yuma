/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn_400Regular'],
        bold: ['Vazirmatn_700Bold'],
      },
      colors: {
        brand: {
          DEFAULT: '#1d4ed8',
          light: '#dbeafe',
          dark: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
};
