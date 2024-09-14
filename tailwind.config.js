/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html", 
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "accent-color": "rgba(48, 48, 48, 0.226)",
        "primary-green": {
          "mint": "#32cd32",
          "light-mint": "#5BD75B",
          "100": "#ebfaeb",
          "200": "#c2f0c2",
          "300": "#99e699",
          "400": "#70dc70",
          "500": "#47d247",
          "600": "#2db82d",
          "700": "#238f23",
          "800": "#196619"
        },
        "secondary-black":{
          "main": "#030303"
        }
      },
      fontFamily: {
        "primary": ["Work Sans"],
        "secondary": ["Gelasio"],
      },
      screens: {
        'sm': '400px',  // Adjusted breakpoint
        'md': '700px',
        'lg': '992px', // Adjusted breakpoint
        'xl': '1200px', 
        '2xl': '1600px', // Adjusted breakpoint
      }
      
    },
  },
  plugins: [],
}