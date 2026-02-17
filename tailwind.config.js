/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./popup.html",
    "./options.html",
    "./chat.html",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
      // Primary accent
      "primary": "#6B7FBF",
      "primary-hover": "#5A6EAE",
      
      // Light mode backgrounds
      "light-bg": "#EDF0F5",
      "light-bg-sidebar": "#E8ECF5",
      "light-border": "#D4DBE8",
      
      // Dark mode backgrounds
      "dark-bg": "#0F1419",
      "dark-bg-sidebar": "#161A1F",
      "dark-border": "#2A2F3E",
    }
    },
  },
  plugins: [],
}

