/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Aslan Brewing Brand Colors
        'aslan-primary': '#2D5016',    // Forest green
        'aslan-secondary': '#8B4513',  // Rich brown
        'aslan-accent': '#F4A460',     // Sandy brown
        
        // Extended palette for UI consistency
        'aslan': {
          50: '#f7f9f4',
          100: '#e8f2db',
          200: '#d4e6bb',
          300: '#b8d690',
          400: '#9cc366',
          500: '#7fb042',
          600: '#679033',
          700: '#527026',
          800: '#435c1f',
          900: '#2D5016',  // Primary
          950: '#1a2e0c',
        },
        'aslan-brown': {
          50: '#faf7f2',
          100: '#f5ede0',
          200: '#ebd8c0',
          300: '#dfc199',
          400: '#d1a172',
          500: '#c08854',
          600: '#b37548',
          700: '#8B4513',  // Secondary
          800: '#7a3d11',
          900: '#663410',
          950: '#3a1e09',
        },
        'aslan-sand': {
          50: '#fefcf9',
          100: '#fdf8f0',
          200: '#fbf0e0',
          300: '#F4A460',  // Accent
          400: '#f19c42',
          500: '#ee8a2a',
          600: '#df7520',
          700: '#b85e1c',
          800: '#934c1d',
          900: '#77401b',
          950: '#401f0c',
        }
      },
      fontFamily: {
        'aslan': ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'aslan-gradient': 'linear-gradient(135deg, #2D5016 0%, #527026 100%)',
        'aslan-gradient-light': 'linear-gradient(135deg, #7fb042 0%, #9cc366 100%)',
        'aslan-gradient-warm': 'linear-gradient(135deg, #8B4513 0%, #F4A460 100%)',
      },
      boxShadow: {
        'aslan-soft': '0 4px 6px -1px rgba(45, 80, 22, 0.1), 0 2px 4px -1px rgba(45, 80, 22, 0.06)',
        'aslan-medium': '0 10px 15px -3px rgba(45, 80, 22, 0.1), 0 4px 6px -2px rgba(45, 80, 22, 0.05)',
        'aslan-large': '0 20px 25px -5px rgba(45, 80, 22, 0.1), 0 10px 10px -5px rgba(45, 80, 22, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
  plugins: [
    // Add custom utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.bg-aslan-gradient': {
          background: 'linear-gradient(135deg, #2D5016 0%, #527026 100%)',
        },
        '.bg-aslan-gradient-light': {
          background: 'linear-gradient(135deg, #7fb042 0%, #9cc366 100%)',
        },
        '.bg-aslan-gradient-warm': {
          background: 'linear-gradient(135deg, #8B4513 0%, #F4A460 100%)',
        },
        '.text-shadow-sm': {
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        },
        '.text-shadow': {
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}