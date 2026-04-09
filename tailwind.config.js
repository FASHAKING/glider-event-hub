/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        glider: {
          // brand
          mint: "#A8E0D1",
          olive: "#4F7F58",
          sky: "#A3C8E0",
          black: "#000000",
          light: "#F5F5F7",
          gray: "#626262",
          // light theme aliases
          bg: "#F5F5F7",
          panel: "#FFFFFF",
          border: "#E6E6EA",
          text: "#000000",
          muted: "#626262",
          accent: "#4F7F58",
          accentSoft: "#A8E0D1",
          // dark theme tokens
          darkBg: "#0B0F14",
          darkPanel: "#151A22",
          darkPanel2: "#1D232D",
          darkBorder: "#262C38",
          darkText: "#F5F5F7",
          darkMuted: "#9AA0AC",
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
        display: [
          "Outfit",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,0.04), 0 2px 8px rgba(16,24,40,0.04)",
        card: "0 4px 12px rgba(16,24,40,0.05), 0 12px 32px rgba(16,24,40,0.08)",
        glow: "0 12px 42px -10px rgba(79,127,88,0.45)",
        glowMint: "0 12px 45px -10px rgba(168,224,209,0.6)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
        glassDark: "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.15)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '0.6' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
