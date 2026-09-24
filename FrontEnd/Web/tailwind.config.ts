import type { Config } from "tailwindcss";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MyJob / SkillConnect — Centralized Design Tokens
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all component colors, typography, and elevations.
 * Extracted and aligned with the MyJob Figma Template style guide.
 */

export const brandTokens = {
  navy: {
    DEFAULT: "#0A1B39",      // Primary Dark Navy (Headers, accents, dark sections)
    50: "#F0F5FA",
    100: "#E7F0FA",
    200: "#CEE0F5",
    300: "#7EADE6",
    400: "#3D82D7",
    500: "#0A65CC",          // Main Brand Primary Blue
    600: "#084E9E",          // Hover state
    700: "#0D233A",          // Deep Navy
    800: "#0A1B39",          // Dark Slate Navy
    900: "#001738",          // Midnight Navy
    primary: "#0A65CC",
    hover: "#084E9E",
    light: "#E7F0FA",
    dark: "#0A1B39",
  },
  teal: {
    DEFAULT: "#0BA5EC",      // Primary Accent Teal / Cyan
    50: "#F0FDFA",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0BA5EC",          // Vibrant Cyan / Teal
    600: "#0284C7",
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
    accent: "#14B8A6",       // Mint / Emerald Teal accent
    light: "#E0F2FE",
    dark: "#0369A1",
  },
} as const;

/**
 * Direct shorthand tokens for quick programmatic access in components:
 * Example: `brand.navy` -> "#0A1B39", `brand.teal` -> "#0BA5EC"
 */
export const brand = {
  navy: brandTokens.navy.DEFAULT,
  teal: brandTokens.teal.DEFAULT,
  primary: brandTokens.navy.primary,
  navyDark: brandTokens.navy.dark,
  navyLight: brandTokens.navy.light,
  navyHover: brandTokens.navy.hover,
  tealAccent: brandTokens.teal.accent,
  tealLight: brandTokens.teal.light,
  tealDark: brandTokens.teal.dark,
} as const;

export const grayTokens = {
  50: "#F7F7F8",
  100: "#F1F2F4",
  200: "#E4E5E8",
  300: "#BDC4CD",
  400: "#9199A3",
  500: "#767F8C",
  600: "#5E6670",
  700: "#474C54",
  800: "#2D3239",
  900: "#18191C",
} as const;

export const semanticTokens = {
  success: {
    DEFAULT: "#12B76A",
    light: "#E7F6EC",
    dark: "#078727",
  },
  warning: {
    DEFAULT: "#F79009",
    light: "#FFF6E6",
    dark: "#F16A1B",
  },
  danger: {
    DEFAULT: "#F04438",
    light: "#FEE4E2",
    dark: "#E03137",
  },
  info: {
    DEFAULT: "#0BA5EC",
    light: "#E0F2FE",
  },
  star: "#FCAB28",
} as const;

export const badgeTokens = {
  fulltime: {
    bg: "#E7F0FA",
    text: "#0A65CC",
  },
  contract: {
    bg: "#E7F6EC",
    text: "#12B76A",
  },
  internship: {
    bg: "#FFF6E6",
    text: "#F79009",
  },
  featured: {
    bg: "#FFEAE4",
    text: "#E05735",
  },
} as const;

export const designTokens = {
  brand: brandTokens,
  gray: grayTokens,
  semantic: semanticTokens,
  badges: badgeTokens,
  shorthand: brand,
} as const;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: brandTokens,
        primary: {
          DEFAULT: brandTokens.navy.primary,
          hover: brandTokens.navy.hover,
          light: brandTokens.navy.light,
          50: "#F1F6FD",
        },
        gray: grayTokens,
        success: semanticTokens.success,
        warning: semanticTokens.warning,
        danger: semanticTokens.danger,
        info: semanticTokens.info,
        surface: {
          DEFAULT: "#F7F7F8",
          alt: "#F1F2F4",
        },
        footer: {
          bg: "#18191C",
        },
        badge: {
          fulltime: badgeTokens.fulltime.bg,
          "fulltime-text": badgeTokens.fulltime.text,
          contract: badgeTokens.contract.bg,
          "contract-text": badgeTokens.contract.text,
          internship: badgeTokens.internship.bg,
          "internship-text": badgeTokens.internship.text,
          featured: badgeTokens.featured.bg,
          "featured-text": badgeTokens.featured.text,
        },
        star: semanticTokens.star,
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0px 2px 12px rgba(24, 25, 28, 0.06)",
        navbar: "0px 1px 2px rgba(24, 25, 28, 0.08)",
        elevated: "0px 6px 24px rgba(24, 25, 28, 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
