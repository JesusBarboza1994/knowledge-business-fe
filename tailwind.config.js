import forms from '@tailwindcss/forms'

/**
 * Todo valor de color / tipo / espacio viene de los tokens de src/index.css.
 * Nada literal en este archivo: si falta un valor, se crea el token primero.
 * @type {import('tailwindcss').Config}
 */
const token = (name) => `oklch(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // superficies (elevación por claridad)
        sunken: token('sunken'),
        ink: token('ink'),
        panel: token('panel'),
        raised: token('raised'),
        // líneas
        line: token('line'),
        'line-strong': token('line-strong'),
        control: token('control'),
        // texto
        fg: token('fg'),
        'fg-2': token('fg-2'),
        muted: token('muted'),
        // acento
        accent: token('accent'),
        'accent-ink': token('accent-ink'),
        focus: token('focus'),
        // semántico
        danger: token('danger'),
        'danger-ink': token('danger-ink'),
        warn: token('warn'),
      },
      fontFamily: {
        display: ['Newsreader', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      // Escala 1.25 desde 16px. Piso duro en 12px: no existe utilidad menor.
      fontSize: {
        '2xs': ['var(--text-2xs)', { lineHeight: '1.4' }],
        xs: ['var(--text-xs)', { lineHeight: 'var(--lh-ui)' }],
        sm: ['var(--text-sm)', { lineHeight: 'var(--lh-ui)' }],
        md: ['var(--text-md)', { lineHeight: 'var(--lh-ui)' }],
        base: ['var(--text-md)', { lineHeight: '1.6' }],
        prose: ['var(--text-prose)', { lineHeight: 'var(--lh-prose)' }],
        lg: ['var(--text-lg)', { lineHeight: 'var(--lh-heading)' }],
        xl: ['var(--text-xl)', { lineHeight: 'var(--lh-heading)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--lh-display)' }],
        display: [
          'var(--text-display)',
          { lineHeight: 'var(--lh-display)', letterSpacing: 'var(--track-display)' },
        ],
      },
      letterSpacing: {
        display: 'var(--track-display)',
        label: 'var(--track-label)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-pill)',
      },
      maxWidth: {
        measure: 'var(--measure)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        short: 'var(--dur-short)',
      },
      boxShadow: {
        pop: 'var(--shadow-pop)',
        sheet: 'var(--shadow-sheet)',
      },
    },
  },
  plugins: [forms],
}
