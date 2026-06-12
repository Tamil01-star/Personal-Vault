/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        'card': '20px',
        'btn': '14px',
        'input': '16px',
        'modal': '24px',
        sm: "14px",    // Match buttons
        md: "16px",    // Match inputs
        lg: "20px",    // Match cards
        xl: "20px",    // Match cards
        "2xl": "20px", // Match cards
        "3xl": "24px", // Match modals
      },
      boxShadow: {
        sm: '0 2px 8px -1px rgba(0, 0, 0, 0.02), 0 1px 3px 0 rgba(0, 0, 0, 0.01)',
        md: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.03)',
        lg: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
        xl: '0 20px 40px -10px rgba(0, 0, 0, 0.07), 0 8px 16px -4px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
        'premium': '0 10px 30px -10px rgba(37, 99, 235, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.01)',
        'premium-hover': '0 20px 40px -15px rgba(37, 99, 235, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.02)'
      },
    },
  },
  plugins: [],
}
