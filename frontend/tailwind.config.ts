import type { Config } from "tailwindcss";

// =============================================================================
// Stellar Design System — Tailwind Configuration
//
// COLOUR PHILOSOPHY:
//   Background layer:  Pure black (#000000) → dark indigo surfaces
//   Text layer:        Pure white (#ffffff) → vivid indigo accents
//   Two-indigo system: dark indigo (depth/surface) + vivid indigo (accent/highlight)
//
// TO COLLAPSE TO SINGLE INDIGO:
//   Set all 'indigo-vivid' values to match your chosen 'indigo' shade.
//   Every token is isolated here so it's a one-line change per level.
//
// FONT PHILOSOPHY:
//   Lexend Giga — hero titles, planet names, large display text only. Never body.
//   Lato        — everything else: subheadings, body, UI labels, data.
// =============================================================================

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // -----------------------------------------------------------------
        // Base — pure black backgrounds
        // -----------------------------------------------------------------
        void: "#000000",

        // -----------------------------------------------------------------
        // Dark indigo — depth and surface colours, complements black
        // Used for: cards, panels, elevated surfaces, subtle borders
        // -----------------------------------------------------------------
        surface: {
          950: "#05040f",
          900: "#0a0820",
          800: "#120f35",
          700: "#1a1550",
          600: "#231c6b",
          500: "#2d2488",
        },

        // -----------------------------------------------------------------
        // Vivid indigo — electric accent, complements white
        // Used for: CTAs, highlights, active states, glow effects
        // TO MERGE WITH SURFACE: set these to match surface values above
        // -----------------------------------------------------------------
        accent: {
          200: "#c4b5fd",
          300: "#a78bfa",
          400: "#8b5cf6",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
        },

        // -----------------------------------------------------------------
        // Planet accent colours — from system.json renderColor values
        // -----------------------------------------------------------------
        planet: {
          aethon: "#4A90D9",
          vareth: "#C2410C",
          calyx: "#BAE6FD",
          kalos: "#9B7653",
          thal: "#B45309",
          mira: "#BAE6FD",
          lun: "#78716C",
          vael: "#E2E8F0",
          serrath: "#8B6355",
          drath: "#94A3B8",
        },

        // -----------------------------------------------------------------
        // Semantic
        // -----------------------------------------------------------------
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#38bdf8",

        // -----------------------------------------------------------------
        // Orbital window rating
        // -----------------------------------------------------------------
        rating: {
          1: "#ef4444",
          2: "#f97316",
          3: "#f59e0b",
          4: "#84cc16",
          5: "#22c55e",
        },
      },

      // -----------------------------------------------------------------
      // Typography
      // -----------------------------------------------------------------
      fontFamily: {
        display: ['"Lexend Giga"', "system-ui", "sans-serif"],
        sans: ['"Lato"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        "display-2xl": [
          "5rem",
          { lineHeight: "1.05", letterSpacing: "-0.02em" },
        ],
        "display-xl": [
          "3.75rem",
          { lineHeight: "1.08", letterSpacing: "-0.02em" },
        ],
        "display-lg": [
          "3rem",
          { lineHeight: "1.1", letterSpacing: "-0.015em" },
        ],
        "display-md": [
          "2.25rem",
          { lineHeight: "1.15", letterSpacing: "-0.01em" },
        ],
        "display-sm": [
          "1.5rem",
          { lineHeight: "1.2", letterSpacing: "-0.005em" },
        ],
        "label-lg": ["0.875rem", { lineHeight: "1", letterSpacing: "0.08em" }],
        "label-sm": ["0.75rem", { lineHeight: "1", letterSpacing: "0.1em" }],
      },

      // -----------------------------------------------------------------
      // Layout
      // -----------------------------------------------------------------
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },

      // -----------------------------------------------------------------
      // Backgrounds
      // -----------------------------------------------------------------
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-void":
          "radial-gradient(ellipse at 20% 50%, #120f35 0%, #000000 60%)",
        "gradient-void-center":
          "radial-gradient(ellipse at 50% 40%, #0a0820 0%, #000000 70%)",
        "gradient-card":
          "linear-gradient(135deg, rgba(18,15,53,0.7) 0%, rgba(5,4,15,0.9) 100%)",
        "gradient-card-hover":
          "linear-gradient(135deg, rgba(26,21,80,0.7) 0%, rgba(10,8,32,0.9) 100%)",
        "gradient-planet-hero":
          "linear-gradient(to bottom, transparent 0%, #000000 100%)",
        "gradient-shimmer":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
      },

      // -----------------------------------------------------------------
      // Shadows / glows
      // -----------------------------------------------------------------
      boxShadow: {
        "glow-accent":
          "0 0 24px rgba(124,58,237,0.4), 0 0 48px rgba(124,58,237,0.15)",
        "glow-surface": "0 0 20px rgba(35,28,107,0.6)",
        "glow-planet": "0 0 30px var(--planet-glow, rgba(74,144,217,0.3))",
        card: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        "card-hover":
          "0 8px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
        "card-accent":
          "0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.3)",
      },

      // -----------------------------------------------------------------
      // Border radius
      // -----------------------------------------------------------------
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },

      // -----------------------------------------------------------------
      // Easing — adjust these to change the animation feel globally
      // -----------------------------------------------------------------
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        snap: "cubic-bezier(0.4, 0, 0.2, 1)",
        reveal: "cubic-bezier(0.16, 1, 0.3, 1)",
        gravity: "cubic-bezier(0.76, 0, 0.24, 1)",
      },

      // -----------------------------------------------------------------
      // Animations — adjust durations here to change feel globally
      // -----------------------------------------------------------------
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "loom-up": "loomUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "snap-left": "snapLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        shimmer: "shimmer 2.5s linear infinite",
        "spin-slow": "spin 30s linear infinite",
        "pulse-slow": "pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "orbit-slow": "orbitSpin 120s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Hero title animation — looms upward with subtle scale
        loomUp: {
          from: { opacity: "0", transform: "translateY(48px) scale(0.96)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // UI element left-to-right snap
        snapLeft: {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        orbitSpin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },

      // -----------------------------------------------------------------
      // Backdrop blur
      // -----------------------------------------------------------------
      backdropBlur: {
        xs: "2px",
        "2xl": "40px",
      },
    },
  },
  plugins: [],
};

export default config;
