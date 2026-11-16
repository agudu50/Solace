/**
 * Design tokens.
 *
 * Neutral, true-gray surfaces (no blue tint), a single brand accent used
 * sparingly, small radii, hairline borders and near-flat elevation.
 * `slate` is intentionally remapped to a neutral ramp so every existing
 * `slate-*` utility across the app adopts the new palette.
 */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        accent: {
          DEFAULT: 'rgb(var(--e-global-color-accent-rgb) / <alpha-value>)',
          hover: 'var(--e-global-color-accent-hover)',
          subtle: 'var(--e-global-color-accent-subtle)',
          border: 'var(--e-global-color-accent-border)',
        },
        slate: {
          50: '#f7f7f6',
          100: '#f0f0ef',
          200: '#e6e6e4',
          300: '#d1d1cf',
          400: '#a3a3a1',
          500: '#767674',
          600: '#5d5d5b',
          700: '#3b3b3a',
          800: '#272727',
          900: '#1c1c1c',
          950: '#121212',
        },
        ink: {
          DEFAULT: '#0e0e0e',
          surface: '#161616',
          raised: '#1c1c1c',
          line: 'rgba(255,255,255,0.08)',
        },
        paper: {
          DEFAULT: '#f7f7f6',
          surface: '#ffffff',
          line: 'rgba(14,14,14,0.08)',
        },
      },
      borderRadius: {
        xl: '0.5rem',
        '2xl': '0.625rem',
        '3xl': '0.75rem',
      },
      boxShadow: {
        xs: '0 1px 1px 0 rgb(0 0 0 / 0.03)',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        md: '0 1px 3px 0 rgb(0 0 0 / 0.06)',
        lg: '0 2px 6px 0 rgb(0 0 0 / 0.06)',
        xl: '0 4px 12px 0 rgb(0 0 0 / 0.07)',
        '2xl': '0 12px 32px -8px rgb(0 0 0 / 0.18)',
      },
      letterSpacing: {
        tightest: '-0.035em',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.165, 0.84, 0.44, 1)',
      },
      keyframes: {
        marquee: { to: { transform: 'translateX(-50%)' } },
        'grow-x': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        'fade-in': { from: { opacity: '0' } },
        'dialog-in': { from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' } },
        'press': { '0%, 100%': { transform: 'scale(1)' }, '45%': { transform: 'scale(0.97)' } },
        'flash': { '0%, 100%': { opacity: '0' }, '45%': { opacity: '0.06' } },
        'ping-soft': { '75%, 100%': { transform: 'scale(2.2)', opacity: '0' } },
      },
      animation: {
        marquee: 'marquee 60s linear infinite',
        'grow-x': 'grow-x var(--progress-duration, 6s) linear forwards',
        'fade-in': 'fade-in .3s cubic-bezier(0.165, 0.84, 0.44, 1)',
        'dialog-in': 'dialog-in .3s cubic-bezier(0.165, 0.84, 0.44, 1)',
        press: 'press .56s cubic-bezier(.4, 0, .2, 1)',
        flash: 'flash .56s cubic-bezier(.4, 0, .2, 1)',
        'ping-soft': 'ping-soft 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};
