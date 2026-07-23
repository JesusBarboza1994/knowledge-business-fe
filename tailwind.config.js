import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#11130f',
        panel: '#171a15',
        line: '#2a2e26',
        moss: '#b7e66b',
        muted: '#969d8d',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(183,230,107,.18), 0 18px 60px rgba(0,0,0,.35)',
      },
    },
  },
  plugins: [forms],
}
