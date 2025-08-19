/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'aslan-primary': '#2D5016',
        'aslan-secondary': '#8B4513', 
        'aslan-accent': '#F4A460',
        'aslan-light': '#F5F5DC',
        'aslan-gold': '#DAA520'
      }
    },
  },
  plugins: [],
}