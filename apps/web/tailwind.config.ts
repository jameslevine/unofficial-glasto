import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#161616',
        'surface-2': '#1f1f1f',
        border: '#2a2a2a',
        fg: '#f5f5f5',
        muted: '#a3a3a3',
        brand: {
          DEFAULT: '#f59e0b',
          fg: '#0a0a0a',
        },
        accent: '#ec4899',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
        display: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
