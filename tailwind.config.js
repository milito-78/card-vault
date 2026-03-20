/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    fontFamily: {
      sans: ['Vazirmatn_400Regular'],
      'sans-medium': ['Vazirmatn_500Medium'],
      'sans-semibold': ['Vazirmatn_600SemiBold'],
      'sans-bold': ['Vazirmatn_700Bold'],
      mono: ['SpaceMono'],
    },
    extend: {},
  },
  plugins: [],
};
