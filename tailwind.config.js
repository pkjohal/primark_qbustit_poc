/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primark: {
          blue: '#0DAADB',
          'blue-dark': '#0987A8',
          'blue-light': '#E6F7FB',
        },
        navy: '#1A1F36',
        charcoal: '#374151',
        'mid-grey': '#6B7280',
        'light-grey': '#F3F4F6',
        'border-grey': '#E5E7EB',
        success: { DEFAULT: '#10B981', bg: '#ECFDF5' },
        warning: { DEFAULT: '#F59E0B', bg: '#FFFBEB' },
        danger: { DEFAULT: '#EF4444', bg: '#FEF2F2' },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        primark: ['Work Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
