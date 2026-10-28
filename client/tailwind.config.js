/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#121212',        // page background
        surface: '#1E1E1E',    // cards & rows
        surface2: '#232323',   // raised surface / inputs
        hover: '#262626',      // row hover
        line: '#2A2A2A',       // subtle borders
        accent: {
          DEFAULT: '#FF6B00',
          hover: '#FF8124',
          soft: 'rgba(255, 107, 0, 0.12)',
        },
        muted: '#9CA3AF',      // secondary text
        positive: '#22C55E',
        negative: '#EF4444',
        info: '#38BDF8',
        pitch: '#0F241A',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.02) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        lift: '0 16px 40px -16px rgba(0,0,0,0.8)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        'fade-in': 'fade-in 0.25s ease-out both',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
