module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        serif: ['"Prata"', "serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      colors: {
        background: "hsl(0, 0%, 7%)",
        foreground: "hsl(40, 20%, 92%)",
        primary: {
          DEFAULT: "hsl(40, 25%, 50%)",
          foreground: "hsl(0, 0%, 7%)",
        },
        secondary: {
          DEFAULT: "hsl(35, 12%, 15%)",
          foreground: "hsl(40, 20%, 90%)",
        },
        tertiary: {
          DEFAULT: "hsl(40, 28%, 55%)",
          foreground: "hsl(0, 0%, 8%)",
        },
        neutral: {
          DEFAULT: "hsl(0, 0%, 95%)",
          foreground: "hsl(0, 0%, 12%)",
          50: "hsl(30, 10%, 96%)",
          100: "hsl(30, 10%, 90%)",
          200: "hsl(30, 8%, 80%)",
          300: "hsl(30, 7%, 65%)",
          400: "hsl(30, 6%, 55%)",
          500: "hsl(30, 5%, 45%)",
          600: "hsl(30, 5%, 35%)",
          700: "hsl(30, 5%, 25%)",
          800: "hsl(30, 5%, 15%)",
          900: "hsl(30, 5%, 8%)",
        },
        border: "hsl(30, 5%, 25%)",
        input: "hsl(30, 5%, 20%)",
        ring: "hsl(40, 28%, 55%)",
        success: "hsl(145, 43%, 52%)",
        warning: "hsl(30, 95%, 64%)",
        "hero-text": "hsl(40, 20%, 92%)",
        "navbar-text": "hsl(40, 20%, 90%)",
        "cta-primary-bg": "hsl(40, 25%, 50%)",
        "cta-primary-fg": "hsl(0, 0%, 7%)",
        "cta-secondary-bg": "hsl(0, 0%, 7%)",
        "cta-secondary-fg": "hsl(40, 25%, 75%)",
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      spacing: {
        4: "1rem",
        8: "2rem",
        12: "3rem",
        16: "4rem",
        24: "6rem",
        32: "8rem",
        48: "12rem",
        64: "16rem",
      },
      fontSize: {
        display: ["48px", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        h1: ["48px", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        h2: ["34px", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        h3: ["24px", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        h4: ["17px", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        "body-lg": ["18px", { lineHeight: "1.5" }],
        body: ["14px", { lineHeight: "1.5" }],
        label: ["14px", { lineHeight: "1", letterSpacing: "0.05em" }],
      },
      backgroundImage: {
        "gradient-1":
          "linear-gradient(180deg, hsl(30, 8%, 12%) 0%, hsl(0, 0%, 7%) 100%)",
        "gradient-2":
          "linear-gradient(90deg, hsl(35, 25%, 20%) 0%, hsl(30, 25%, 10%) 100%)",
        "button-border-gradient":
          "linear-gradient(135deg, hsl(45, 40%, 60%) 0%, hsl(40, 25%, 45%) 100%)",
        "video-overlay":
          "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
