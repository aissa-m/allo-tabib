import type { Config } from "tailwindcss";

/** Paleta marfil / azul / coral: los tokens apuntan a variables CSS (ver globals.css) para modo claro/oscuro. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stone: { 50: "#EAE6DE", 100: "#DFDACF" },
        bg: token("bg"),
        "bg-soft": token("bg-soft"),
        ink: token("ink"),
        muted: token("muted"),
        sage: token("sage"),
        slate: token("slate"),
        terra: token("terra"),
        coral: token("coral"),
        online: token("online"),
        offline: token("offline"),
        line: token("line"),
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-arabic)", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px -8px rgba(35,42,51,0.12), 0 2px 8px -2px rgba(35,42,51,0.06)",
        lift: "0 16px 40px -12px rgba(35,42,51,0.22)",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.6)", opacity: "0.7" },
          "100%": { transform: "scale(2.6)", opacity: "0" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: {
        "pulse-ring": "pulseRing 1.8s cubic-bezier(0.2,0.6,0.4,1) infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
