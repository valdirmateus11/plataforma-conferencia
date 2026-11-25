import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        border: "var(--border)",
        success: {
          DEFAULT: "#059669",
          light: "#ECFDF5",
          border: "#A7F3D0",
          foreground: "#065F46",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FFFBEB",
          border: "#FDE68A",
          foreground: "#92400E",
        },
        danger: {
          DEFAULT: "#E11D48",
          light: "#FFF1F2",
          border: "#FECDD3",
          foreground: "#9F1239",
        },
        info: {
          DEFAULT: "#2563EB",
          light: "#EFF6FF",
          border: "#BFDBFE",
          foreground: "#1E40AF",
        },
        neutral: {
          DEFAULT: "#64748B",
          light: "#F1F5F9",
          border: "#CBD5E1",
          foreground: "#334155",
        },
      },
    },
  },
  plugins: [],
};
export default config;
