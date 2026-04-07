/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        glide: {
          bg: "#070b14",
          panel: "#0f1524",
          border: "#1c2438",
          accent: "#5eead4",
          accent2: "#8b5cf6",
          muted: "#94a3b8",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(94, 234, 212, 0.35)",
      },
    },
  },
  plugins: [],
}
