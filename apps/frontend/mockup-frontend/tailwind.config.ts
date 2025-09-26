import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        lpc: {
          primary: '#003366',
          primary600: '#1C5E91',
          secondary: '#1C6EA4',
          accent: '#A4A635',
          bg: '#F2F6FA',
          surface: '#FFFFFF',
          stroke: '#D3D9E0',
          text: '#263442',
          muted: '#5B6C7F',
          link: '#1C5E91',
          linkHover: '#14486F',
        },
      },
    },
  },
  plugins: [],
} satisfies Config


