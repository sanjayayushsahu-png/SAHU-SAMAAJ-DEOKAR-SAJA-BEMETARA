/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#FFF4EB',
          100: '#FFE4CC',
          200: '#FFC594',
          300: '#FFA057',
          400: '#FF8224',
          500: '#FF6B00',
          600: '#DB5700',
          700: '#B54500',
          800: '#8F3600',
          900: '#702A00',
        },
        maroon: {
          50: '#FDF2F2',
          100: '#FCE2E2',
          200: '#F8C4C4',
          300: '#EE9595',
          400: '#DE5A5A',
          500: '#BF2C2C',
          600: '#9E1414',
          700: '#800000',
          800: '#680000',
          900: '#500000',
        },
        gold: {
          50: '#FDFBF0',
          100: '#FAF3D1',
          200: '#F4E49E',
          300: '#ECD066',
          400: '#E2BC3F',
          500: '#D4AF37',
          600: '#B68E23',
          700: '#926E1A',
          800: '#755618',
          900: '#5F4617',
        },
        cream: {
          50: '#FFFFFF',
          100: '#FFFDF8',
          200: '#FFFBF2',
          300: '#FDF6E7',
          400: '#F7EBD2',
        },
      },
      fontFamily: {
        hindi: ['"Noto Sans Devanagari"', '"Poppins"', 'system-ui', 'sans-serif'],
        serifHindi: ['"Tiro Devanagari Hindi"', '"Noto Serif Devanagari"', 'Georgia', 'serif'],
      },
      keyframes: {
        auraPulse: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(0.96)' },
          '50%': { opacity: '0.95', transform: 'scale(1.06)' },
        },
        slowSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'aura-pulse': 'auraPulse 4s ease-in-out infinite',
        'slow-spin': 'slowSpin 32s linear infinite',
        'float-slow': 'floatSlow 5s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [],
};
