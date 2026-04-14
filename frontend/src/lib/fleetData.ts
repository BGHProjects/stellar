// Fleet data — lore, specifications, and visual metadata for all ship classes.
// Ship classes are variants (like aircraft types), not individual named vessels.
// Multiple instances of each class fly simultaneously across the network.

export interface ShipClassData {
  id: string;
  name: string;
  nickname: string;
  tagline: string;
  description: string;
  lore: string;
  manufacturer: string;
  introduced: string; // fictional year
  inService: number; // number of active vessels
  length: string; // e.g. "840 metres"
  beam: string; // width
  mass: string;
  maxPassengers: number;
  crewComplement: string;
  cruiseSpeed: string; // human-readable
  speedAUPerDay: number;
  propulsion: string;
  hasCryo: boolean;
  cryoDecks: number;
  cabinClasses: string[];
  routeTypes: string[];
  spacewalkCapable: boolean;
  notableFeatures: string[];
  typicalRoutes: string[];
  renderScale: number;
  accentColor: string;
  imageSlots: {
    hero: string;
    interior: string;
    exterior: string;
    detail: string;
  };
}

const FLEET_DATA: Record<string, ShipClassData> = {
  helion: {
    id: "helion",
    name: "Helion-class",
    nickname: "The Sprint",
    tagline: "Fast. Direct. No ceremony.",
    description:
      "The smallest and fastest vessel class in the Stellar fleet. Built for efficiency on short-to-medium routes where passengers want to arrive, not experience the journey. No cryo decks, minimal amenity spaces, maximum thrust.",
    lore: "The Helion class was the result of a commercially ruthless design brief: the shortest possible journey time between inner-system bodies at the lowest operational cost. Everything that did not contribute to those two goals was removed. The result is a ship that looks exactly like what it is — a high-efficiency transport optimised for rapid turnaround. Helion-class vessels operate the inner shuttle circuits that keep the Vareth moon network and the Calyx system connected on near-daily schedules. Their crews are considered among the most technically skilled in the fleet. The magnetosphere approach to Kalos, threading between Vareth's radiation bands, requires precision that the Helion's size and manoeuvrability make possible.",
    manufacturer: "Voss-Kiran Transit Systems",
    introduced: "2761",
    inService: 24,
    length: "180 metres",
    beam: "42 metres",
    mass: "~48,000 tonnes",
    maxPassengers: 120,
    crewComplement: "18",
    cruiseSpeed: "0.10 AU/day",
    speedAUPerDay: 0.1,
    propulsion: "Dual ion-fusion drive array",
    hasCryo: false,
    cryoDecks: 0,
    cabinClasses: ["Drift Class", "Orbit Class"],
    routeTypes: ["Direct Transfer"],
    spacewalkCapable: false,
    notableFeatures: [
      "Highest cruise speed in the fleet",
      "Purpose-built for inner shuttle circuits",
      "Operates the Vareth magnetosphere approach",
      "Rapid turnaround capability — minimum port time",
      "Single-deck passenger configuration",
    ],
    typicalRoutes: [
      "Kalos ↔ Thal (every 3 days)",
      "Calyx ↔ Lun (every 4 days)",
      "Aethon ↔ L4/L5 Stations (every 3 days)",
      "Calyx ↔ Vael (every 6 days)",
    ],
    renderScale: 0.6,
    accentColor: "rgba(255, 255, 255, 0.2)",
    imageSlots: {
      hero: "Helion-class vessel — sleek angular profile against the void, ion drives glowing",
      interior:
        "Helion-class passenger deck — efficient layout, forward viewport strip, compact berths",
      exterior:
        "Helion-class exterior detail — hull plating and navigation array",
      detail:
        "Helion-class ion drive array — blue-white exhaust cones during cruise burn",
    },
  },

  tethys: {
    id: "tethys",
    name: "Tethys-class",
    nickname: "The Workhorse",
    tagline: "The backbone of the network.",
    description:
      "The most common vessel in the Stellar fleet. The Tethys class handles medium routes and moon system connections with reliable comfort and a frequency that keeps the system's commercial arteries flowing. If you've travelled in the Taunor system, you've almost certainly been aboard a Tethys.",
    lore: "More people have crossed the Scatter aboard a Tethys-class vessel than any other ship in the fleet. There are currently 31 active units and the class has been in continuous production since 2754 — with updates and variants but the same fundamental design philosophy: a ship that can do almost anything reasonably well, at a price that makes regular interplanetary travel commercially viable for the middle of the market. Tethys vessels are optimised for Gravity Assist routing — their fuel systems are designed around the assumption of planetary slingshot trajectories, which makes them significantly more cost-effective on the longer routes than a ship that has to burn propellant for the whole journey. The cryo decks accommodate full and interval cryostasis, making them viable for journeys up to 90 days.",
    manufacturer: "Meridian Shipworks Consortium",
    introduced: "2754",
    inService: 31,
    length: "420 metres",
    beam: "95 metres",
    mass: "~210,000 tonnes",
    maxPassengers: 300,
    crewComplement: "64",
    cruiseSpeed: "0.055 AU/day",
    speedAUPerDay: 0.055,
    propulsion: "Quad fusion-plasma drive, gravity assist optimised",
    hasCryo: true,
    cryoDecks: 1,
    cabinClasses: ["Drift Class", "Orbit Class", "Apex Class"],
    routeTypes: ["Direct Transfer", "Gravity Assist", "Multi-Stop"],
    spacewalkCapable: true,
    notableFeatures: [
      "Gravity Assist route optimisation",
      "Single cryo deck (Full Cryo and Cryo Intervals)",
      "Spacewalk bay — port and starboard access points",
      "Most deployed class in the system",
      "Modular cargo hold configuration",
    ],
    typicalRoutes: [
      "Aethon ↔ Kalos (every 5 days)",
      "Aethon ↔ Thal (every 8 days)",
      "Kalos ↔ Calyx (every 12 days)",
      "Thal ↔ Calyx (every 21 days)",
    ],
    renderScale: 1.0,
    accentColor: "rgba(124, 58, 237, 0.25)",
    imageSlots: {
      hero: "Tethys-class vessel — mid-range cruiser in three-quarter view, Scatter visible in background",
      interior:
        "Tethys-class Orbit Class cabin — private cabin with viewport screen, clean functional design",
      exterior:
        "Tethys-class exterior — spacewalk bay access port and hull detail",
      detail:
        "Tethys-class cryo deck — rows of cryostasis pods under blue lighting",
    },
  },

  lunara: {
    id: "lunara",
    name: "Lunara-class",
    nickname: "The Observatory",
    tagline: "When the journey is the destination.",
    description:
      "A premium scenic vessel with maximised viewport ratios, an expanded observatory deck, and passenger capacity reduced in favour of space and atmosphere. The Lunara class operates exclusively on scenic and gravity assist routes — every voyage is curated.",
    lore: "The Lunara class exists because someone asked the right question: what if the ship itself was the attraction? The class was developed after data showed that a significant subset of travellers were choosing longer routes not because they were cheaper but because they wanted more time in transit. The Lunara formalised that into a product. Its observation deck runs nearly the full circumference of the vessel — a continuous viewport band that gives unobstructed views in almost every direction simultaneously. Particular attention was paid to the approach trajectories: Lunara routes are specifically plotted to maximise astronomically interesting passes. The standard Aethon-to-Kalos scenic route, for example, passes through the inner edge of the Scatter at closest approach and then arcs into Vareth's ring plane — a sequence of views that no other route type offers.",
    manufacturer: "Aethon Celestial Design Bureau",
    introduced: "2769",
    inService: 8,
    length: "510 metres",
    beam: "110 metres",
    mass: "~195,000 tonnes",
    maxPassengers: 220,
    crewComplement: "72",
    cruiseSpeed: "0.042 AU/day",
    speedAUPerDay: 0.042,
    propulsion: "Triple fusion drive, trajectory-optimised for scenic routing",
    hasCryo: true,
    cryoDecks: 1,
    cabinClasses: ["Orbit Class", "Apex Class", "Helix Class"],
    routeTypes: ["Scenic", "Gravity Assist"],
    spacewalkCapable: true,
    notableFeatures: [
      "Full-circumference observation deck",
      "No Full Cryo option — conscious voyage or intervals only",
      "Helix Class observation bubbles",
      "Curated scenic route programming",
      "Dedicated astronomical event scheduling",
      "Live narration system for notable phenomena",
    ],
    typicalRoutes: [
      "Aethon → Kalos (scenic, every 21 days)",
      "Aethon → Calyx (scenic, every 28 days)",
      "Aethon → Serrath (flyby, every 30 days)",
    ],
    renderScale: 1.1,
    accentColor: "rgba(245, 158, 11, 0.25)",
    imageSlots: {
      hero: "Lunara-class vessel — wide profile showing the full circumference observation deck band, stars behind",
      interior:
        "Lunara-class observation deck — continuous viewport looking out over a nebula or gas giant",
      exterior:
        "Lunara-class Helix observation bubble — transparent protrusion from hull, occupant visible inside",
      detail:
        "Lunara-class interior lounge — curved seating facing the viewport band, deep space beyond",
    },
  },

  solaris: {
    id: "solaris",
    name: "Solaris-class",
    nickname: "The Deep Voyager",
    tagline: "For those who measure journeys in months.",
    description:
      "The flagship class of the Stellar fleet. The Solaris is built for the longest routes in the system — voyages of 90 to 200 days between the inner worlds and the outer reaches. A city in space. Two cryo decks, three waking class decks, a forward observation dome, and rotating habitat rings for continuous artificial gravity.",
    lore: "A Solaris-class vessel underway to Calyx carries more people than some of the smaller colonies it passes en route. The ship is large enough to have its own internal geography — passengers develop preferred routes between decks, favourite corners of the observation dome, established relationships with stewards. Long-haul passengers who travel Solaris-class frequently report that the ship becomes a kind of home during the voyage, and some have noted that the hardest part of arriving is leaving it. The rotating habitat rings — a design feature borrowed from early deep-space station architecture — provide 0.85g of artificial gravity throughout the waking decks, making long-duration comfort possible in a way that smaller vessels cannot replicate. The forward observation dome is the social heart of every conscious voyage: a transparent hemisphere at the ship's prow where the void is unobstructed in every direction above the horizon.",
    manufacturer: "Taunor Heavy Industries (Aethon Orbital Ring)",
    introduced: "2748",
    inService: 6,
    length: "1,240 metres",
    beam: "280 metres",
    mass: "~1,800,000 tonnes",
    maxPassengers: 600,
    crewComplement: "210",
    cruiseSpeed: "0.025 AU/day",
    speedAUPerDay: 0.025,
    propulsion: "Hex fusion-plasma array with secondary ion assist",
    hasCryo: true,
    cryoDecks: 2,
    cabinClasses: ["Drift Class", "Orbit Class", "Apex Class", "Helix Class"],
    routeTypes: ["Direct Transfer", "Gravity Assist", "Multi-Stop", "Scenic"],
    spacewalkCapable: true,
    notableFeatures: [
      "Rotating habitat rings — 0.85g continuous gravity",
      "Forward observation dome",
      "Two full cryo decks",
      "All cabin classes including Helix",
      "Immersive Reality Suite (2 units)",
      "Zero-G spa deck between habitat rings",
      "Internal transit system across 14 decks",
      "Capacity for full-duration Conscious Voyages up to 200 days",
    ],
    typicalRoutes: [
      "Aethon ↔ Calyx (every 14 days)",
      "Aethon ↔ Lun (every 14 days)",
      "Aethon ↔ Vael (every 21 days)",
      "Aethon ↔ Mira (every 14 days, permit required)",
    ],
    renderScale: 1.8,
    accentColor: "rgba(255, 244, 194, 0.2)",
    imageSlots: {
      hero: "Solaris-class vessel — massive profile with rotating habitat rings visible, tiny stars behind",
      interior:
        "Solaris-class forward observation dome — transparent hemisphere, passengers in silhouette against the void",
      exterior:
        "Solaris-class exterior — rotating habitat ring section with viewport rows, scale indicated by EVA crew nearby",
      detail:
        "Solaris-class Helix Class observation bubble — private suite pod protruding from the upper hull",
    },
  },
};

export function getShipClassData(id: string): ShipClassData | null {
  return FLEET_DATA[id] ?? null;
}

export function getAllShipClasses(): ShipClassData[] {
  return Object.values(FLEET_DATA);
}
