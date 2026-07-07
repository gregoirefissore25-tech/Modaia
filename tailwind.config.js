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
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(.96)" },
          to: { opacity: "1", transform: "scale(1)" }
        },
        slideUp: {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" }
        },
        shimmer: {
          from: { backgroundPosition: "100% 0" },
          to: { backgroundPosition: "-100% 0" }
        }
      },
      animation: {
        "fade-in": "fadeIn 200ms cubic-bezier(.22,.61,.36,1) both",
        "fade-in-up": "fadeInUp 300ms cubic-bezier(.22,.61,.36,1) both",
        "scale-in": "scaleIn 200ms cubic-bezier(.22,.61,.36,1) both",
        "slide-up": "slideUp 320ms cubic-bezier(.22,.61,.36,1) both",
        shimmer: "shimmer 1.6s linear infinite"
      }
    }
  },
  plugins: []
};
