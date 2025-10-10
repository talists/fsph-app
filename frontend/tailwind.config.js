/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#DC5F5F',
          600: '#C54545',
        },
        background: {
          light: '#F8F4F4',
          dark: '#2D2D2D',
        }
      }
    },
  },
  plugins: [],
}

