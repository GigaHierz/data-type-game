import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Arkiv brand palette — arkiv.network/brand
        ink: "#111111",
        sand: "#F6F4EF",
        stone: "#E9E6DE",
        arkiv: {
          blue: "#181EA9",
          orange: "#FE7446",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        bezel:
          "inset 2px 2px 0 0 #fff, inset -2px -2px 0 0 #00000022, 0 4px 0 0 #000",
        soft: "0 1px 0 0 #00000010, 0 8px 24px -8px #00000022",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.92" },
          "55%": { opacity: "1" },
          "80%": { opacity: "0.95" },
        },
        jitter: {
          "0%, 100%": { transform: "translate(0,0)" },
          "25%": { transform: "translate(-0.5px, 0.5px)" },
          "50%": { transform: "translate(0.5px, -0.5px)" },
          "75%": { transform: "translate(-0.5px, -0.5px)" },
        },
        hover: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        blinkSlow: {
          "0%, 96%, 100%": { transform: "scaleY(1)" },
          "98%": { transform: "scaleY(0.05)" },
        },
        blinkFast: {
          "0%, 88%, 100%": { transform: "scaleY(1)" },
          "94%": { transform: "scaleY(0.1)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        sweep: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        flicker: "flicker 2.3s infinite",
        jitter: "jitter 90ms infinite",
        hover: "hover 3.5s ease-in-out infinite",
        "blink-slow": "blinkSlow 6s infinite",
        "blink-fast": "blinkFast 2s infinite",
        scan: "scan 4s linear infinite",
        sweep: "sweep 3s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
