import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        "surface-hover": "var(--bg-surface-hover)",
        border: "var(--border-default)",
        "border-hover": "var(--border-hover)",
        indigo: {
          50: "#EAFBF0",
          100: "#D4F6E1",
          200: "#A9EAC2",
          300: "#7FDF9D",
          400: "#39D375",
          500: "#0EB94D",
          600: "#0CA042",
          700: "#097E33",
          800: "#065C25",
          900: "#033B18",
          950: "#02240E",
        }
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
