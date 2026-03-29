// Types mirroring the Go models package structs.

// -----------------------------------------------------------------
// Voyage types
// -----------------------------------------------------------------

export interface Voyage {
  id: string;
  routeId: string;
  routeTypeId: string;
  shipClassId: string;
  originId: string;
  destinationId: string;
  availableRouteTypes: string[];
  departureDay: number;
  arrivalDay: number;
  departureDate: string; // ISO 8601
  arrivalDate: string; // ISO 8601
  durationDays: number;
  distanceAU: number;
  orbitalWindowRating: number; // 1–5
  crossesScatter: boolean;
  permitRequired: boolean;
  basePriceCredits: number;
  lowestAvailablePrice: number;
  priceMultiplier: number;
  totalCapacity: number;
  availableBerths: number;
}

export interface VoyageSearchParams {
  originId: string;
  destinationId: string;
  departureDate: string;
  adults: number;
  children: number;
  routeTypeId?: string;
}

export interface ScheduleEntry {
  routeId: string;
  departureDay: number;
  departureDate: string;
  arrivalDay: number;
  arrivalDate: string;
  durationDays: number;
  orbitalWindowRating: number;
  basePriceCredits: number;
}

export interface PriceBreakdown {
  baseFare: number;
  routeTypeAdjustment: number;
  cabinClassAdjustment: number;
  cryoAdjustment: number;
  orbitalWindowAdjustment: number;
  addOnsTotal: number;
  childDiscounts: number;
  loyaltyDiscount: number;
  portFees: number;
  total: number;
}

export interface PriceRequest {
  routeId: string;
  routeTypeId: string;
  cabinClassId: string;
  cryoOptionId: string;
  departureDay: number;
  adults: number;
  children: number;
  addOnIds: string[];
  loyaltyPointsToRedeem: number;
}

export interface OrbitalPositions {
  [bodyId: string]: [number, number]; // [x, y] in AU
}

export interface ClosestApproachResult {
  originId: string;
  destinationId: string;
  day: number;
  date: string;
  distanceAU: number;
  windowRating: number;
}

// -----------------------------------------------------------------
// Booking types
// -----------------------------------------------------------------

export type BookingStatus =
  | "confirmed"
  | "cancelled"
  | "completed"
  | "bond_held";

export interface BookedAddOn {
  addOnId: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Passenger {
  id: string;
  bookingId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  isChild: boolean;
  cabinBerth?: string;
  cryoIntervals?: number;
  specialRequests?: string;
}

export interface PassengerRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  cabinBerth?: string;
  cryoIntervals?: number;
  specialRequests?: string;
}

export interface Booking {
  id: string;
  userId: string;
  groupId: string;
  legNumber: number;
  routeId: string;
  routeTypeId: string;
  shipClassId: string;
  departureDay: number;
  arrivalDay: number;
  departureDate: string;
  arrivalDate: string;
  originId: string;
  destinationId: string;
  departurePortId: string;
  arrivalPortId: string;
  cryoOptionId: string;
  cabinClassId: string;
  passengers: Passenger[];
  addOns: BookedAddOn[];
  priceBreakdown: PriceBreakdown;
  totalPrice: number;
  loyaltyPointsApplied: number;
  loyaltyPointsEarned: number;
  isVoyageBond: boolean;
  depositPaid: number;
  balanceDue: number;
  status: BookingStatus;
  orbitalWindowRating: number;
  permitRequired: boolean;
  createdAt: string;
}

export interface CreateBookingRequest {
  groupId?: string;
  legNumber: number;
  routeId: string;
  routeTypeId: string;
  departureDay: number;
  departurePortId: string;
  arrivalPortId: string;
  cryoOptionId: string;
  cabinClassId: string;
  passengers: PassengerRequest[];
  addOnIds: string[];
  loyaltyPointsToRedeem: number;
  isVoyageBond: boolean;
}

// -----------------------------------------------------------------
// Auth types
// -----------------------------------------------------------------

export interface UserPublic {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  loyaltyPoints: number;
  loyaltyTier: string;
  faceVectorEnrolled: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserPublic;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
