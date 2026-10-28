/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic colours resolve through CSS variables expressed as RGB
        // triplets, so both themes share one set of utilities and opacity
        // modifiers (bg-accent/10) keep working.
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        raised: 'rgb(var(--raised) / <alpha-value>)',
        sunken: 'rgb(var(--sunken) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        body: 'rgb(var(--body) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        faint: 'rgb(var(--faint) / <alpha-value>)',

        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          soft: 'var(--accent-soft)',
          ink: 'rgb(var(--accent-ink) / <alpha-value>)',
        },
        positive: { DEFAULT: 'rgb(var(--positive) / <alpha-value>)', soft: 'var(--positive-soft)' },
        caution: { DEFAULT: 'rgb(var(--caution) / <alpha-value>)', soft: 'var(--caution-soft)' },
        negative: { DEFAULT: 'rgb(var(--negative) / <alpha-value>)', soft: 'var(--negative-soft)' },
        info: { DEFAULT: 'rgb(var(--info) / <alpha-value>)', soft: 'var(--info-soft)' },
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1.125rem',
        '2xl': '1.5rem',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(16 24 40 / 0.04)',
        sm: '0 1px 3px 0 rgb(16 24 40 / 0.06), 0 1px 2px -1px rgb(16 24 40 / 0.04)',
        md: '0 4px 12px -2px rgb(16 24 40 / 0.08), 0 2px 6px -2px rgb(16 24 40 / 0.04)',
        lg: '0 12px 32px -8px rgb(16 24 40 / 0.14), 0 4px 12px -4px rgb(16 24 40 / 0.06)',
        pop: '0 16px 40px -12px rgb(16 24 40 / 0.22), 0 0 0 1px rgb(16 24 40 / 0.05)',
        none: 'none',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-soft': { '50%': { opacity: '0.45' } },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out both',
        'fade-up': 'fade-up 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'scale-in': 'scale-in 160ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-in': 'slide-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
