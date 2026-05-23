import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        bg: {
          primary: "#080B14",
          secondary: "#0D1117",
          card: "#111827",
          elevated: "#161D2F",
        },
        brand: {
          purple: "#8B5CF6",
          blue: "#6366F1",
          cyan: "#06B6D4",
          pink: "#EC4899",
        },
        market: {
          bull: "#10B981",
          bear: "#EF4444",
          neutral: "#F59E0B",
          bullLight: "#D1FAE5",
          bearLight: "#FEE2E2",
        },
        border: "rgba(255,255,255,0.08)",
        surface: "rgba(255,255,255,0.04)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient": "radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(6,182,212,0.1) 0%, transparent 50%)",
        "card-gradient": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
        "bull-gradient": "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.03) 100%)",
        "bear-gradient": "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.03) 100%)",
      },
      animation: {
        "ticker-scroll": "tickerScroll 40s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "gradient-shift": "gradientShift 8s ease infinite",
        "spin-slow": "spin 8s linear infinite",
        "shimmer": "shimmer 2s linear infinite",
        "fade-up": "fadeUp 0.5s ease forwards",
        "slide-in": "slideIn 0.4s ease forwards",
        "number-up": "numberUp 0.8s ease forwards",
      },
      keyframes: {
        tickerScroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(139,92,246,0.3)" },
          "100%": { boxShadow: "0 0 40px rgba(139,92,246,0.6), 0 0 80px rgba(99,102,241,0.3)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        numberUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.08)",
        "glass-sm": "0 4px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.06)",
        "glow-purple": "0 0 30px rgba(139,92,246,0.4)",
        "glow-blue": "0 0 30px rgba(99,102,241,0.4)",
        "glow-green": "0 0 20px rgba(16,185,129,0.4)",
        "glow-red": "0 0 20px rgba(239,68,68,0.4)",
        "card-hover": "0 20px 40px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.12)",
        "neon": "0 0 5px rgba(139,92,246,1), 0 0 20px rgba(139,92,246,0.8), 0 0 40px rgba(139,92,246,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
