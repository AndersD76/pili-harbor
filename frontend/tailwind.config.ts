import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        harbor: {
          bg: '#05080a',
          surface: '#0d1117',
          border: '#1a2332',
          accent: '#ef4444',
          green: '#00e07a',
          text: '#e6edf3',
          muted: '#7d8590',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'xs': ['0.8125rem', { lineHeight: '1.25rem' }],   // 13px instead of 12px
        'sm': ['0.875rem', { lineHeight: '1.375rem' }],   // 14px
        'base': ['1rem', { lineHeight: '1.625rem' }],     // 16px
      },
    },
  },
  plugins: [],
}

export default config
