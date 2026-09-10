import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Primary brand red — classic bakery/restaurant red used for the
          // navigation bar, primary buttons, links, and focus states
          // site-wide. Change ONLY this palette to re-theme the whole site;
          // every "brand-*" class across storefront + admin reads from here.
          50: '#fef2f2',
          100: '#fde3e3',
          200: '#fbc9c9',
          300: '#f5a3a3',
          400: '#e96f6f',
          500: '#D32F2F', // Primary Red (spec)
          600: '#c8102e', // Slightly deeper red for hover states (matches existing nav red)
          700: '#a00c24',
          800: '#7f0f1f',
          900: '#5c0b17',
          dark: '#3e200c',
          crimson: '#dc2626',
        },
        // Accent gold/yellow — used sparingly for selected-category
        // highlights, badges, and small accents. Never used as a full-page
        // background (this site is light-mode only, no dark theme).
        gold: {
          50: '#fffbeb',
          100: '#fff3c4',
          200: '#ffe58a',
          300: '#ffd451',
          400: '#ffc107', // Primary Accent Gold (spec)
          500: '#ffc107',
          600: '#e0a800',
          700: '#b38600',
          800: '#8a6800',
          900: '#5c4600',
        },
        bakery: {
          gold: '#c68a35',
          goldLight: '#f4e8cf',
          brown: '#532b10',
          darkBrown: '#2d1405',
          cream: '#fffdf9',
          softGrey: '#f8f8f8',
          border: '#f0ece1',
        }
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(83, 43, 16, 0.08)',
        'elevated': '0 10px 30px -4px rgba(83, 43, 16, 0.12)',
        'glow': '0 0 20px rgba(245, 158, 11, 0.35)',
      },
      keyframes: {
        whatsappPing: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '70%': { transform: 'scale(1.8)', opacity: '0' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        whatsappPing2: {
          '0%': { transform: 'scale(1)', opacity: '0.4' },
          '70%': { transform: 'scale(2.2)', opacity: '0' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(12px) translateY(-50%)' },
          '100%': { opacity: '1', transform: 'translateX(0) translateY(-50%)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateX(-50%) translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        overlayIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        whatsappPing: 'whatsappPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        whatsappPing2: 'whatsappPing2 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s',
        fadeInLeft: 'fadeInLeft 0.4s ease-out forwards',
        slideUp: 'slideUp 0.4s ease-out forwards',
        sheetUp: 'sheetUp 0.3s cubic-bezier(0.32, 0.72, 0, 1) forwards',
        overlayIn: 'overlayIn 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
};
export default config;
