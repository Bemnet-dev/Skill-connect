import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A65CC",
          light: "#E8F1FB",
          dark: "#084A94",
          hover: "#0B5CB0",
          50: "#F0F7FF",
        },
        success: {
          DEFAULT: "#12B76A",
          light: "#ECFDF3",
        },
        warning: {
          DEFAULT: "#F79009",
          light: "#FFFAEB",
        },
        danger: {
          DEFAULT: "#F04438",
          light: "#FEF3F2",
        },
        info: "#0BA5EC",
        "brand-navy": "#0A1B39",
        "brand-navy-dark": "#071226",
      },
    },
  },
  plugins: [],
};

export default config;
