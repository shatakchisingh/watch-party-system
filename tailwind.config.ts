import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './features/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2efff',
          100: '#e8e2ff',
          200: '#d1c8ff',
          300: '#b6aaff',
          400: '#9d8bff',
          500: '#8270ec',
          600: '#6954d6',
          700: '#5242b5',
          800: '#3d3288',
          900: '#2b245f',
        },
      },
      boxShadow: {
        glow: '0 8px 32px rgba(130, 112, 236, 0.22)',
      },
      backgroundImage: {
        grid: 'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.12) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
};

export default config;
