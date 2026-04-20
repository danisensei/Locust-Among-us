/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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
