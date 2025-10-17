/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Poppins"', 'ui-sans-serif', 'system-ui'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        midnight: '#0f172a',
        neon: {
          pink: '#ff5fca',
          blue: '#3b82f6',
          green: '#22d3ee'
        }
      },
      boxShadow: {
        panel: '0 10px 40px rgba(15, 23, 42, 0.4)'
      },
      transitionTimingFunction: {
        micro: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }
    }
  },
  plugins: []
};
