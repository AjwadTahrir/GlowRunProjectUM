/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0D0B12',
        paper: '#F4F0E8',   // warm off-white: reads as ink on a poster, not UI white
        gold: '#F5C542',
        purple: '#30104B',  // flat fields only, never a gradient
        grey: '#77727D',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { tightest: '-0.04em' },
    },
  },
  plugins: [],
};
