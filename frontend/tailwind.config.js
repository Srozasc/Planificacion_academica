/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'uc-yellow': '#f1b634',
        'uc-blue': '#307fe2',
      },
    },
  },
  plugins: [],
}
