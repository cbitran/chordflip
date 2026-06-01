import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        bg: '#0a0a0c',
        panel: '#111114',
        ink: '#f4f2ec',
        muted: '#7e7c78',
        accent: '#e8c87a',
        good: '#7ad1a8',
        major: '#7ad1a8',
        minor: '#8ab4f0',
        dim: '#e88a8a',
      },
    },
  },
  plugins: [],
} satisfies Config
