import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#004ac6",
          hover: "#003ca3",
          container: "#2563eb",
          "on-container": "#eeefff",
          accent: "#06c755",
          "accent-hover": "#05b34c",
        },
        surface: {
          DEFAULT: "var(--surface)",
          container: "var(--surface-container)",
          low: "var(--surface-container-low)",
          high: "var(--surface-container-high)",
          highest: "var(--surface-container-highest)",
          dim: "var(--surface-dim)",
        },
        "on-surface": {
          DEFAULT: "var(--on-surface)",
          variant: "var(--on-surface-variant)",
        },
        outline: {
          DEFAULT: "var(--outline)",
          variant: "var(--outline-variant)",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        "water-flow": {
          "0%": { transform: "translateY(-100%)", opacity: "0.2" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateY(100%)", opacity: "0.2" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        "water-flow": "water-flow 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
