/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'industrial': {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bae0ff',
          300: '#7cc8ff',
          400: '#36a9ff',
          500: '#0c8ef0',
          600: '#0070c9',
          700: '#0159a3',
          800: '#064b85',
          900: '#0b3f6e',
          950: '#072849',
        },
        'steel': {
          50: '#f7f9fb',
          100: '#eef2f6',
          200: '#d7e0ea',
          300: '#b2c4d6',
          400: '#87a3be',
          500: '#6687a6',
          600: '#506e8c',
          700: '#415972',
          800: '#394c5f',
          900: '#324150',
          950: '#0f172a',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s ease-in-out infinite',
        'flow': 'flow 2s linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        flow: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
    },
  },
  plugins: [],
};
