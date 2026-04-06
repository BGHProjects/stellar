export const VISITABLE_BODIES = [
  { id: "aethon", label: "Aethon", sub: "Inner System" },
  { id: "kalos", label: "Kalos", sub: "Vareth System" },
  { id: "thal", label: "Thal", sub: "Vareth System" },
  { id: "mira", label: "Mira", sub: "Vareth System — Restricted" },
  { id: "calyx", label: "Calyx", sub: "Outer System" },
  { id: "lun", label: "Lun", sub: "Calyx System" },
  { id: "vael", label: "Vael", sub: "Calyx System" },
];

export const FEATURED_ROUTES = [
  {
    id: "aethon_kalos",
    from: "Aethon",
    to: "Kalos",
    originId: "aethon",
    destinationId: "kalos",
    duration: "40–88 days",
    fromPrice: "₢1,200",
    tag: "Most Popular",
    tagVariant: "accent" as const,
    description:
      "The commercial backbone of the system. Direct and Gravity Assist routes available.",
  },
  {
    id: "aethon_calyx",
    from: "Aethon",
    to: "Calyx",
    originId: "aethon",
    destinationId: "calyx",
    duration: "87–192 days",
    fromPrice: "₢3,200",
    tag: "Deep Voyage",
    tagVariant: "surface" as const,
    description:
      "The longest and most significant passenger route. Solaris-class only.",
  },
  {
    id: "aethon_vareth_scenic",
    from: "Aethon",
    to: "Kalos via Vareth",
    originId: "aethon",
    destinationId: "kalos",
    duration: "52–120 days",
    fromPrice: "₢3,500",
    tag: "Scenic",
    tagVariant: "warning" as const,
    description:
      "Passes through the Scatter and approaches Vareth's storm system. Lunara-class.",
  },
];

export const STATS = [
  { value: "16", label: "Scheduled Routes" },
  { value: "10", label: "Destinations" },
  { value: "4", label: "Ship Classes" },
  { value: "2", label: "Star System" },
];
