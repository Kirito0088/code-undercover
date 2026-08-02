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
        },
        // Dashboard ("Mission Control") tokens — only resolve where a .dash-theme
        // ancestor defines the --dash-* CSS vars (see globals.css). Scoped to
        // app/dashboard so it can't bleed into the rest of the site.
        dash: {
          bg: "rgb(var(--dash-bg) / <alpha-value>)",
          surface: "rgb(var(--dash-surface) / <alpha-value>)",
          "surface-2": "rgb(var(--dash-surface-2) / <alpha-value>)",
          "surface-3": "rgb(var(--dash-surface-3) / <alpha-value>)",
          "surface-4": "rgb(var(--dash-surface-4) / <alpha-value>)",
          line: "rgb(var(--dash-line) / <alpha-value>)",
          "line-strong": "rgb(var(--dash-line-strong) / <alpha-value>)",
          text: "rgb(var(--dash-text) / <alpha-value>)",
          "text-dim": "rgb(var(--dash-text-dim) / <alpha-value>)",
          "text-faint": "rgb(var(--dash-text-faint) / <alpha-value>)",
          accent: "rgb(var(--dash-accent) / <alpha-value>)",
          "accent-hover": "rgb(var(--dash-accent-hover) / <alpha-value>)",
          "accent-mid": "rgb(var(--dash-accent-mid) / <alpha-value>)",
          "accent-ink": "rgb(var(--dash-accent-ink) / <alpha-value>)",
          orange: "rgb(var(--dash-orange) / <alpha-value>)",
          "orange-mid": "rgb(var(--dash-orange-mid) / <alpha-value>)",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        "dash-display": ["var(--font-display)", "sans-serif"],
        "dash-sans": ["var(--font-body)", "sans-serif"],
        "dash-mono": ["var(--font-dash-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
