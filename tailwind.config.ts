import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
        card: 'var(--bg-card)',
        'card-foreground': 'var(--text-primary)',
        border: 'rgba(124, 58, 237, 0.2)',
        ring: 'var(--accent-purple)',
        primary: {
          DEFAULT: 'var(--accent-purple)',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: 'var(--bg-secondary)',
          foreground: 'var(--text-primary)',
        },
        muted: {
          DEFAULT: '#1a1a2e',
          foreground: 'var(--text-muted)',
        },
        accent: {
          purple: 'var(--accent-purple)',
          blue: 'var(--accent-blue)',
          cyan: 'var(--accent-cyan)',
          gold: 'var(--accent-gold)',
        },
        rank: {
          E: '#94a3b8',
          D: '#86efac',
          C: '#67e8f9',
          B: '#818cf8',
          A: '#f472b6',
          S: '#fbbf24',
          SS: '#fb923c',
          SSS: '#c084fc',
        },
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        exo2: ['"Exo 2"', 'sans-serif'],
        sans: ['Rajdhani', 'sans-serif'],
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.8), 0 0 60px rgba(245, 158, 11, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'rank-slam': {
          '0%': { transform: 'scale(3) translateY(-50px)', opacity: '0' },
          '60%': { transform: 'scale(0.9) translateY(5px)', opacity: '1' },
          '80%': { transform: 'scale(1.05) translateY(-2px)' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        'rank-slam': 'rank-slam 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards',
        shimmer: 'shimmer 2s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.4), 0 0 40px rgba(124, 58, 237, 0.2)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2)',
        'glow-gold': '0 0 20px rgba(245, 158, 11, 0.5), 0 0 40px rgba(245, 158, 11, 0.3)',
      },
    },
  },
  plugins: [],
}

export default config
