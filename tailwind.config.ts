import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        card: {
          DEFAULT: "var(--card)",
          secondary: "var(--card2)",
        },
        foreground: "var(--text)",
        muted: "var(--muted)",
        line: "var(--line)",
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-d)",
        },
        accent: "var(--accent)",
        gain: "var(--gain)",
        spend: "var(--spend)",
        warn: "var(--warn)",
        danger: "var(--danger)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
