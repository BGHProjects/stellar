export const AU_SCALE = 18; // 1 AU → 18 scene units

export const VISITABLE_IDS = new Set([
  "aethon",
  "kalos",
  "thal",
  "mira",
  "calyx",
  "lun",
  "vael",
  "l4_station",
  "l5_station",
]);
export const STAR_IDS = new Set(["taunor_prime", "taunor_minor"]);

// Sizes in scene units
export const BODY_SIZES: Record<string, number> = {
  taunor_prime: 1.4,
  taunor_minor: 0.9,
  serrath: 0.16,
  aethon: 0.55,
  vareth: 0.9,
  drath: 0.6,
  calyx: 0.38,
  kalos: 0.22,
  thal: 0.18,
  mira: 0.16,
  lun: 0.12,
  vael: 0.1,
  l4_station: 0.08,
  l5_station: 0.08,
};

// Colours — each body gets a distinct hue
export const BODY_COLOURS: Record<string, string> = {
  taunor_prime: "#FFF4C2",
  taunor_minor: "#FFB347",
  serrath: "#8B6355",
  aethon: "#4A90D9",
  vareth: "#C2410C",
  drath: "#94A3B8",
  calyx: "#93C5FD",
  kalos: "#9B7653",
  thal: "#F97316",
  mira: "#BAE6FD",
  lun: "#78716C",
  vael: "#E2E8F0",
  l4_station: "#a78bfa",
  l5_station: "#a78bfa",
};

// Emissive intensity — stars glow, others are lit
export const EMISSIVE: Record<string, number> = {
  taunor_prime: 1.0,
  taunor_minor: 1.0,
  default: 0.0,
};

// Human-readable names
export const BODY_NAMES: Record<string, string> = {
  taunor_prime: "Taunor Prime",
  taunor_minor: "Taunor Minor",
  serrath: "Serrath",
  aethon: "Aethon",
  vareth: "Vareth",
  drath: "Drath",
  calyx: "Calyx",
  kalos: "Kalos",
  thal: "Thal",
  mira: "Mira",
  lun: "Lun",
  vael: "Vael",
  l4_station: "L4 Station",
  l5_station: "L5 Station",
};

// Body type labels for the body list panel
export const BODY_TYPE: Record<string, string> = {
  taunor_prime: "Star",
  taunor_minor: "Star",
  serrath: "Rocky Planet",
  aethon: "Super-Earth",
  vareth: "Gas Giant",
  drath: "Gas Giant",
  calyx: "Ice Planet",
  kalos: "Moon of Vareth",
  thal: "Moon of Vareth",
  mira: "Moon of Vareth",
  lun: "Moon of Calyx",
  vael: "Moon of Calyx",
  l4_station: "Lagrange Station",
  l5_station: "Lagrange Station",
};

// Moon-level bodies — hide label until user zooms in past threshold
export const MOON_IDS = new Set([
  "kalos",
  "thal",
  "mira",
  "lun",
  "vael",
  "l4_station",
  "l5_station",
  "taunor_minor",
]);
export const LABEL_SHOW_DISTANCE = 40; // scene units — hide moon labels beyond this camera distance
