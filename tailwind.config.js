/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a2e",
        accent: "#8b5cf6",
        accent2: "#ec4899",
        glow: "#22d3ee"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(236,72,153,0.12) 100%)"
      }
    }
  },
  plugins: []
};