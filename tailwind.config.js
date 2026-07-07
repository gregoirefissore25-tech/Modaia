/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        chalk: "#FAF8F4",
        ink: "#141312",
        smoke: "#8A857C",
        seam: "#E7E2D8",
        klein: "#2B36C9",
        blush: "#E8D5C4"
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};
