import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1400px' } },
    extend: {
      fontFamily: {
        sans: ['var(--font-vazirmatn)', 'Tahoma', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0f766e',
          foreground: '#ffffff',
          soft: '#ccfbf1',
        },
      },
    },
  },
  plugins: [],
};

export default config;
