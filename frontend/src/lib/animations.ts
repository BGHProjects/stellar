// =============================================================================
// Stellar Animation System
// All Framer Motion variants live here — edit this file to change the feel
// of the entire application.
//
// TIMING PHILOSOPHY:
//   Micro (UI elements):    0.2–0.35s
//   Standard (cards/lists): 0.4–0.6s
//   Hero (interior pages):  1.1–1.4s
//   Hero (landing page):    1.8–2.0s — cinematic, weighty, epic
//   Page transitions:       0.6–0.9s
//   Modal expand:           0.45s
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
// Standard hero loom — interior pages (planet, fleet, profile, etc.)
// -----------------------------------------------------------------
export const loomUp: Variants = {
  hidden: { opacity: 0, y: 56, scale: 0.95, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 1.1, ease: ease.gravity },
  },
};

// -----------------------------------------------------------------
// Landing page hero — much slower, heavier, more cinematic.
// The headline needs to feel like it arrives from deep space.
// -----------------------------------------------------------------
export const heroLoom: Variants = {
  hidden: { opacity: 0, y: 120, scale: 0.88, filter: "blur(16px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 2.0, ease: ease.gravity },
  },
};

// Landing subtitle — rises after the headline
export const heroSubtitle: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.3, ease: ease.gravity, delay: 0.55 },
  },
};

// Landing UI controls (toggle, form, etc.) — delayed weighted fade
export const heroFadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: ease.reveal },
  },
};

// -----------------------------------------------------------------
// Standard fade up
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
// Snap in from left
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
// Simple fade
// -----------------------------------------------------------------
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: ease.reveal },
  },
};

// -----------------------------------------------------------------
// Stagger container
// -----------------------------------------------------------------
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: ease.snap },
  },
};

export const staggerItemUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: ease.reveal },
  },
};

// -----------------------------------------------------------------
// Letter-by-letter animation
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
    transition: { staggerChildren: 0.03, delayChildren: 0 },
  },
};

// -----------------------------------------------------------------
// Page transition
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
// Star map cinematic entry
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
// Modal circle-expand
// -----------------------------------------------------------------
export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: ease.snap } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: ease.snap } },
};

export const modalExpand: Variants = {
  hidden: { opacity: 0, scale: 0.05, borderRadius: "50%" },
  visible: {
    opacity: 1,
    scale: 1,
    borderRadius: "1rem",
    transition: { duration: 0.45, ease: ease.spring },
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
    transition: { duration: 0.3, ease: ease.reveal, delay: 0.25 },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// -----------------------------------------------------------------
// Side panel
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
// Card hover
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
// Shimmer / stats
// -----------------------------------------------------------------
export const countUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: ease.reveal },
  },
};

export const shimmerTransition: Transition = {
  repeat: Infinity,
  duration: 2.5,
  ease: "linear",
};

// -----------------------------------------------------------------
// Viewport triggers
// -----------------------------------------------------------------
export const viewportOnce = { once: true, margin: "-80px" };
export const viewportRepeat = { once: false, margin: "-80px" };
