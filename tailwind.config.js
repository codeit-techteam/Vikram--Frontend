/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './providers/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FEB623',
          blue: '#1A73E8',
        },
        primary: {
          DEFAULT: '#FEB623',
          light: '#FFF4D1',
          dark: '#E5A01F',
        },
        secondary: {
          DEFAULT: '#1A73E8',
          light: '#4285F4',
          dark: '#1557B0',
        },
        background: '#F5F5F5',
        surface: '#FFFFFF',
        text: {
          DEFAULT: '#1A1A1A',
          secondary: '#666666',
          inverse: '#FFFFFF',
          onPrimary: '#1A1A1A',
        },
        border: '#E0E0E0',
        input: '#F5F5F5',
        disabled: '#B8C4D4',
        logo: '#FFF4D1',
        timer: '#EEF2FF',
        trust: '#F0F4FF',
        error: '#FF3B30',
        success: '#34C759',
        warning: '#FF9500',
        info: '#1A73E8',
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        pill: '50px',
      },
    },
  },
  plugins: [],
};
