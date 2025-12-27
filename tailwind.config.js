/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Restaurant theme colors
        primary: '#D32F2F',     // Tomato red (Vietnamese theme)
        secondary: '#FFA500',   // Orange (accent)
        success: '#4CAF50',     // Green
        warning: '#FF9800',     // Orange
        danger: '#F44336',      // Red
        info: '#2196F3',        // Blue
        
        // Custom F&B colors
        'hot-red': '#E53935',
        'fresh-green': '#2E7D32',
        'golden': '#F57F17',
        'soft-gray': '#F5F5F5',
      },
      keyframes: {
        'burn-flash': {
          '0%, 100%': { borderColor: '#F44336', opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'pulse-warning': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'slide-up': {
          'from': { transform: 'translateY(100%)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'burn-flash': 'burn-flash 0.5s ease-in-out infinite',
        'pulse-warning': 'pulse-warning 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'bounce-in': 'bounce-in 0.3s ease-out',
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
      },
      spacing: {
        'safe': 'max(env(safe-area-inset-left), 1rem)',
      },
    },
  },
  plugins: [],
};
