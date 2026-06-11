/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: 'var(--text-white)',
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#d4af37',
          600: '#b8860b',
          700: '#92660a',
          800: '#6b4e09',
          900: '#4a3606',
        },
        dark: {
          50: 'var(--text-dark-50)',
          100: 'var(--text-dark-100)',
          200: 'var(--text-dark-200)',
          300: 'var(--text-dark-300)',
          400: 'var(--text-dark-400)',
          500: 'var(--text-dark-500)',
          600: 'var(--bg-dark-600)',
          700: 'var(--bg-dark-700)',
          800: 'var(--bg-dark-800)',
          900: 'var(--bg-dark-900)',
          950: 'var(--bg-dark-950)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
