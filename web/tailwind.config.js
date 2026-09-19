/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // The four brand colours, plus two support tones mixed from them, so
        // surfaces can step apart without introducing a fifth hue.
        ink: '#0D0B12',
        violet: { DEFAULT: '#30104B', deep: '#1B0A2B', mist: '#B9A8D0' },
        glow: '#F5C542',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: { prose: '68ch' },
    },
  },
  plugins: [],
};
