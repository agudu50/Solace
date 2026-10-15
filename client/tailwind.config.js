module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'var(--e-global-color-accent)',
          hover: 'var(--e-global-color-accent-hover)',
          subtle: 'var(--e-global-color-accent-subtle)',
          border: 'var(--e-global-color-accent-border)',
        },
      },
    },
  },
  plugins: [],
};
