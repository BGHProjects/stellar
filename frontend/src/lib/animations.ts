// =============================================================================
// Stellar Animation System
//
// All Framer Motion variants live here. Changing the feel of the entire app
// means editing this one file — no hunting through components.
//
// TIMING PHILOSOPHY:
//   Micro (UI elements):    0.2–0.35s — snappy, immediate
//   Standard (cards/lists): 0.4–0.6s — purposeful, confident
//   Hero (titles):          0.8–1.0s — dramatic, looming
//   Page transitions:       0.6–0.9s — deliberate, weighty
//   Modal expand:           0.45s   — expansive but crisp
// =============================================================================

import type { Variants, Transition } from "framer-motion";

// -----------------------------------------------------------------
// Shared easings
// -----------------------------------------------------------------
export const ease = {
  reveal: [0.16, 1, 0.3, 1] as [number, number, number, number],
  snap: [0.4, 0, 0.2, 1] as [number, number, number, number],
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  gravity: [0.76, 0, 0.24, 1] as [number, number, number, number],
};

// -----------------------------------------------------------------
// Hero title — looms upward from below with subtle scale
// Use for: page hero headings, planet names, large display text
// -----------------------------------------------------------------
export const loomUp: Variants = {
  hidden: {
    opacity: 0,
    y: 48,
    scale: 0.96,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: ease.reveal,
    },
  },
};

// -----------------------------------------------------------------
// Standard fade up — UI elements, cards, sections
// -----------------------------------------------------------------
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: ease.reveal },
  },
};

// -----------------------------------------------------------------
// Snap in from left — left-to-right cascading UI elements
// -----------------------------------------------------------------
export const snapLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: ease.snap },
  },
};

// -----------------------------------------------------------------
// Fade in — simple opacity only, no movement
// -----------------------------------------------------------------
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: ease.reveal },
  },
};

// -----------------------------------------------------------------
// Stagger container — wraps a list of animated children
// Children animate left-to-right with a stagger delay
// -----------------------------------------------------------------
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07, // ← adjust this to change cascade speed
      delayChildren: 0.1,
    },
  },
};

// -----------------------------------------------------------------
// Stagger item — child of staggerContainer
// Snaps in from left
// -----------------------------------------------------------------
export const staggerItem: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: ease.snap },
  },
};

// -----------------------------------------------------------------
// Stagger item — fade up variant for cards in a grid
// -----------------------------------------------------------------
export const staggerItemUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: ease.reveal },
  },
};

// -----------------------------------------------------------------
// Letter by letter text animation
// Usage: split text into chars, wrap each in motion.span
// See: <AnimatedText> component in components/common/AnimatedText.tsx
// -----------------------------------------------------------------
export const letterVariant: Variants = {
  hidden: { opacity: 0, x: -8, filter: "blur(2px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.25, ease: ease.snap },
  },
};

export const letterContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // ← very fast — snappy feel
      delayChildren: 0,
    },
  },
};

// -----------------------------------------------------------------
// Page transition — deliberate and weighty
// Wrap page content in <PageTransition>
// -----------------------------------------------------------------
export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(3px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: ease.gravity },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(2px)",
    transition: { duration: 0.4, ease: ease.snap },
  },
};

// -----------------------------------------------------------------
// Star map entry — slower, more cinematic than page transitions
// -----------------------------------------------------------------
export const starMapEnter: Variants = {
  hidden: { opacity: 0, scale: 1.04, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.1, ease: ease.gravity },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    filter: "blur(6px)",
    transition: { duration: 0.6, ease: ease.snap },
  },
};

// -----------------------------------------------------------------
// Modal expand — circle origin expansion
// The modal container scales from a small point
// Content fades in after the container finishes expanding
// -----------------------------------------------------------------
export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: ease.snap } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: ease.snap } },
};

export const modalExpand: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.05,
    borderRadius: "50%",
  },
  visible: {
    opacity: 1,
    scale: 1,
    borderRadius: "1rem",
    transition: {
      duration: 0.45,
      ease: ease.spring,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.25, ease: ease.snap },
  },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: ease.reveal,
      delay: 0.25, // waits for container to expand first
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// -----------------------------------------------------------------
// Side panel / drawer — slides in from right
// Used for planet detail panels on the star map
// -----------------------------------------------------------------
export const sidePanelEnter: Variants = {
  hidden: { opacity: 0, x: 48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: ease.reveal },
  },
  exit: {
    opacity: 0,
    x: 48,
    transition: { duration: 0.3, ease: ease.snap },
  },
};

// -----------------------------------------------------------------
// Card hover — subtle lift on hover
// Use as whileHover prop directly (not a Variants object)
// -----------------------------------------------------------------
export const cardHover = {
  scale: 1.015,
  y: -2,
  transition: { duration: 0.2, ease: ease.snap } as Transition,
};

export const cardTap = {
  scale: 0.985,
  transition: { duration: 0.1 } as Transition,
};

// -----------------------------------------------------------------
// Number count-up — for stats that animate on scroll entry
// Used with useCountUp hook in components/common/
// -----------------------------------------------------------------
export const countUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: ease.reveal },
  },
};

// -----------------------------------------------------------------
// Shimmer placeholder — for image and content loading states
// -----------------------------------------------------------------
export const shimmerTransition: Transition = {
  repeat: Infinity,
  duration: 2.5,
  ease: "linear",
};

// -----------------------------------------------------------------
// Viewport trigger defaults
// Use these as the 'viewport' prop on motion components
// -----------------------------------------------------------------
export const viewportOnce = { once: true, margin: "-80px" };
export const viewportRepeat = { once: false, margin: "-80px" };
