/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        surface: "#0f172a",
        surfaceLighter: "#1e293b",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        pulseGlow: "pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.75", transform: "scale(1.03)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      boxShadow: {
        glowViolet: "0 0 25px -5px rgba(99, 102, 241, 0.25)",
        glowRose: "0 0 25px -5px rgba(244, 63, 94, 0.35)",
        glowEmerald: "0 0 25px -5px rgba(16, 185, 129, 0.35)",
        glowAmber: "0 0 25px -5px rgba(245, 158, 11, 0.35)",
      },
    },
  },
  plugins: [],
};
