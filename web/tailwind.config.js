/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Three inks on black stock. No fourth hue, apart from the error signal.
        ink: '#0D0B12',
        paper: '#F4F0E8',
        gold: '#F5C542',
        purple: '#30104B',
        grey: '#9A95A3', // 6.7:1 on ink, 5.5:1 on purple
        signal: '#F87171', // errors only
      },
      fontFamily: {
        // One family, two voices: condensed black for display, normal width for reading.
        display: ['"Archivo Variable"', '"Arial Narrow"', 'sans-serif'],
        sans: ['"Archivo Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
