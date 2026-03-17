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
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
