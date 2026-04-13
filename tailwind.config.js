/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./App.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./screens/**/*.{js,jsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0D6EFD",
        "background-light": "#F4F7FC",
        brand: {
          50: "#EBF2FF",
          100: "#D6E4FF",
          200: "#ADC8FF",
          300: "#85ABFF",
          400: "#5C8FFF",
          500: "#0D6EFD",
          600: "#0B5ED9",
          700: "#084DB5",
          800: "#063D91",
          900: "#042C6D",
        },
        surface: {
          50: "#FAFBFD",
          100: "#F4F6F9",
          200: "#E8ECF2",
          300: "#D1D8E3",
          400: "#A8B3C4",
          500: "#7E8DA4",
        },
        ink: {
          50: "#F5F5F6",
          100: "#E0E1E4",
          200: "#C1C3C8",
          300: "#A3A6AD",
          400: "#848891",
          500: "#656B76",
          600: "#4D525C",
          700: "#363A42",
          800: "#1E2128",
          900: "#0F1117",
        },
      },
    },
  },
  plugins: [],
};
