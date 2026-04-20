/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark theme colors from the original CSS
        'bg': '#060910',
        'bg-card': '#0d1421',
        'bg-hover': '#131d2e',
        'text': '#e2e8f0',
        'text-dim': '#64748b',
        'text-muted': '#374151',
        'amber': '#f59e0b',
        'amber-glow': 'rgba(245, 158, 11, 0.12)',
        'green': '#10b981',
        'red': '#ef4444',
        'blue': '#3b82f6',
        'border-color': 'rgba(255, 255, 255, 0.07)',
        'border-active': 'rgba(245, 158, 11, 0.4)',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
        'space-mono': ['Space Mono', 'monospace'],
        'outfit': ['Outfit', 'sans-serif'],
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        fadein: {
          'from': { opacity: '0', transform: 'translateY(7px)' },
          'to': { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        blink: 'blink 2s ease-in-out infinite',
        fadein: 'fadein 0.25s ease',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(245, 158, 11, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(245, 158, 11, 0.025) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '44px 44px',
      },
    },
  },
  darkMode: "class",
  plugins: [],
}
