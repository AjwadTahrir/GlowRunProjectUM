/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // The four client colours carry the page.
        ink: '#0D0B12',
        purple: '#30104B',
        gold: '#F5C542',
        paper: '#F4F0E8',
        // Approved support. Lavender is the glow: halftone halos, sparkles, echoes. Never behind
        // paper or gold text. Emerald is the witchy accent, used sparingly.
        lavender: '#A388EE',
        emerald: '#094F39',
        signal: '#F87171', // errors only
      },
      fontFamily: {
        // One family, three voices: compressed for facts, expanded italic for energy, normal for reading.
        display: ['"Archivo Variable"', '"Arial Narrow"', 'sans-serif'],
        sans: ['"Archivo Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
