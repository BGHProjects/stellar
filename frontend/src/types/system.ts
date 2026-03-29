// Types mirroring the system.json config structure and Go config package structs.
// These are used throughout the frontend for type-safe access to system data.

export interface EpochConfig {
  date: string;
  dayNumber: number;
}

export interface SimulationConfig {
  auToKm: number;
  defaultTimeStepDays: number;
  orbitRefinementPasses: number;
  scatterInnerRadiusAU: number;
  scatterOuterRadiusAU: number;
}

export interface StarConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  orbitalRadius: number;
  period: number;
  startPhase: number;
  renderColor: string;
  renderRadius: number;
}

export interface LagrangeConfig {
  id: string;
  name: string;
  description: string;
  lagrangePoint: string;
  referenceBody: string;
  angularOffsetDegrees: number;
  visitable: boolean;
  spaceports: string[];
  renderColor: string;
  renderRadius: number;
}

export interface BodyConfig {
  id: string;
  name: string;
  type: "super_earth" | "rocky_planet" | "gas_giant" | "ice_planet" | "moon";
  parent: string;
  description: string;
  orbitalRadius: number;
  period: number;
  eccentricity: number;
  axialTilt: number;
  rotationPeriod: number;
  startPhase: number;
  visitable: boolean;
  visitRestricted?: boolean;
  visitPermitRequired?: boolean;
  spaceports: string[];
  moons?: string[];
  renderColor: string;
  renderRadius: number;
  renderFeatures?: string[];
}

export interface SpaceportConfig {
  id: string;
  name: string;
  body: string;
  type: "orbital" | "surface" | "atmospheric" | "deep_space";
  description: string;
}

export interface ShipClassConfig {
  id: string;
  name: string;
  description: string;
  speedAUPerDay: number;
  maxPassengers: number;
  hasCryo: boolean;
  cryoOptions: string[];
  cabinClasses: string[];
  availableRouteTypes: string[];
  spacewalkCapable: boolean;
  renderScale: number;
}

export interface CabinClassConfig {
  id: string;
  name: string;
  description: string;
  priceMultiplier: number;
  privatecabin: boolean;
  viewportAccess: string;
  diningTier: string;
  compatibleCryoOptions: string[];
}

export interface CryoOptionConfig {
  id: string;
  name: string;
  description: string;
  priceMultiplier: number;
  amenitiesEnabled: boolean;
  minIntervalsPerDays?: number;
  maxIntervalsPerDays?: number;
  absoluteMinIntervals?: number;
  absoluteMaxIntervals?: number;
}

export interface RouteTypeConfig {
  id: string;
  name: string;
  description: string;
  speedMultiplier: number;
  priceMultiplier: number;
  crossesScatterRisk: string;
}

export interface RouteConfig {
  id: string;
  origin: string;
  destination: string;
  shipClass: string;
  frequencyDays: number;
  crossesScatter: boolean;
  availableRouteTypes: string[];
  basePriceCredits: number;
  permitRequired?: boolean;
  destinationLandable?: boolean;
  notes?: string;
}

export interface OrbitalWindowPricing {
  rating5: number;
  rating4: number;
  rating3: number;
  rating2: number;
  rating1: number;
}

export interface PricingConfig {
  currency: string;
  currencySymbol: string;
  childAgeMax: number;
  childDiscountMultiplier: number;
  orbitalWindow: OrbitalWindowPricing;
  voyageBondDepositFraction: number;
  loyaltyPointsPerCredit: number;
  loyaltyPointRedemptionRate: number;
}

export interface AddOnItem {
  id: string;
  name: string;
  description: string;
  priceCredits?: number;
  priceCreditsPerNight?: number;
  priceCreditsPerSession?: number;
  priceCreditsPerMeal?: number;
  priceCreditsPerUnit?: number;
  priceCreditsPerEvent?: number;
  availableToAllCryo?: boolean;
  availableToCryo?: string[];
  availableCabins?: string[];
  shipClassRequired?: string[];
  segmentRestricted?: boolean;
  voyageSpecific?: boolean;
  destinationSpecific?: boolean;
  relevantIfCrossesScatter?: boolean;
}

export interface AddOnsConfig {
  journeyProtection: AddOnItem[];
  dining: AddOnItem[];
  recreation: AddOnItem[];
  entertainment: AddOnItem[];
  expeditionExtras: AddOnItem[];
}

export interface LoyaltyTierConfig {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number | null;
  benefits: string[];
}

export interface SystemConfig {
  epoch: EpochConfig;
  simulation: SimulationConfig;
  stars: StarConfig[];
  lagrangeStations: LagrangeConfig[];
  bodies: BodyConfig[];
  spaceports: SpaceportConfig[];
  shipClasses: ShipClassConfig[];
  cabinClasses: CabinClassConfig[];
  cryoOptions: CryoOptionConfig[];
  routeTypes: RouteTypeConfig[];
  routes: RouteConfig[];
  pricing: PricingConfig;
  addOns: AddOnsConfig;
  loyaltyTiers: LoyaltyTierConfig[];
}
