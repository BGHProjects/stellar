// bookingStore — persists the entire in-progress booking across all six pages.
// A single store for the full funnel means selections survive navigation
// and the user can go back and change anything without losing progress.

import { create } from "zustand";
import type { Voyage, PassengerRequest } from "@/types/voyage";

export type BookingStep =
  | "search"
  | "results"
  | "detail"
  | "packages"
  | "passengers"
  | "review"
  | "confirmation";

export interface BookingLeg {
  voyage: Voyage;
  routeTypeId: string;
  cryoOptionId: string;
  cabinClassId: string;
  departurePortId: string;
  arrivalPortId: string;
  addOnIds: string[];
  cryoIntervals?: number;
}

interface SearchParams {
  originId: string;
  destinationId: string;
  departureDate: string;
  adults: number;
  children: number;
  routeTypeId?: string;
  isMultiStop: boolean;
}

interface BookingState {
  // Current step in the booking flow
  currentStep: BookingStep;

  // Search parameters entered on the landing page
  searchParams: SearchParams | null;

  // Selected voyages and their configurations — one per leg
  legs: BookingLeg[];

  // Passengers — shared across all legs
  passengers: PassengerRequest[];

  // Payment options
  loyaltyPointsToRedeem: number;
  isVoyageBond: boolean;

  // Completed booking IDs — set after successful creation
  completedBookingIds: string[];

  // Actions
  setSearchParams: (params: SearchParams) => void;
  setCurrentStep: (step: BookingStep) => void;
  addLeg: (leg: BookingLeg) => void;
  updateLeg: (index: number, leg: Partial<BookingLeg>) => void;
  removeLeg: (index: number) => void;
  setPassengers: (passengers: PassengerRequest[]) => void;
  updatePassenger: (
    index: number,
    passenger: Partial<PassengerRequest>,
  ) => void;
  setLoyaltyPointsToRedeem: (points: number) => void;
  setIsVoyageBond: (value: boolean) => void;
  setCompletedBookingIds: (ids: string[]) => void;
  resetBooking: () => void;
}

const initialState = {
  currentStep: "search" as BookingStep,
  searchParams: null,
  legs: [],
  passengers: [],
  loyaltyPointsToRedeem: 0,
  isVoyageBond: false,
  completedBookingIds: [],
};

export const useBookingStore = create<BookingState>()((set) => ({
  ...initialState,

  setSearchParams: (params) => set({ searchParams: params }),

  setCurrentStep: (step) => set({ currentStep: step }),

  addLeg: (leg) => set((state) => ({ legs: [...state.legs, leg] })),

  updateLeg: (index, partial) =>
    set((state) => ({
      legs: state.legs.map((leg, i) =>
        i === index ? { ...leg, ...partial } : leg,
      ),
    })),

  removeLeg: (index) =>
    set((state) => ({ legs: state.legs.filter((_, i) => i !== index) })),

  setPassengers: (passengers) => set({ passengers }),

  updatePassenger: (index, partial) =>
    set((state) => ({
      passengers: state.passengers.map((p, i) =>
        i === index ? { ...p, ...partial } : p,
      ),
    })),

  setLoyaltyPointsToRedeem: (points) => set({ loyaltyPointsToRedeem: points }),

  setIsVoyageBond: (value) => set({ isVoyageBond: value }),

  setCompletedBookingIds: (ids) => set({ completedBookingIds: ids }),

  resetBooking: () => set(initialState),
}));
