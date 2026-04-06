// Typed API client for the Stellar Gateway.
// All gateway communication goes through this module — no fetch calls elsewhere.
//
// In mock mode (VITE_MOCK_MODE=true), all functions return fixture data
// from src/mock/fixtures/ instead of calling the gateway.

import type {
  Voyage,
  VoyageSearchParams,
  ScheduleEntry,
  PriceBreakdown,
  PriceRequest,
  OrbitalPositions,
  ClosestApproachResult,
  Booking,
  CreateBookingRequest,
  UserPublic,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
} from "@/types/voyage";
import type { SystemConfig } from "@/types/system";
import {
  MOCK_BOOKINGS,
  MOCK_SYSTEM_CONFIG,
  MOCK_USER,
  MOCK_VOYAGES,
} from "@/mock";

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === "true";
const BASE_URL = "/api";

// -----------------------------------------------------------------
// Core fetch wrapper
// -----------------------------------------------------------------

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

function getStoredToken(): string | null {
  return localStorage.getItem("stellar_access_token");
}

export function setStoredTokens(access: string, refresh: string): void {
  localStorage.setItem("stellar_access_token", access);
  localStorage.setItem("stellar_refresh_token", refresh);
}

export function clearStoredTokens(): void {
  localStorage.removeItem("stellar_access_token");
  localStorage.removeItem("stellar_refresh_token");
}

// -----------------------------------------------------------------
// Auth
// -----------------------------------------------------------------

export async function register(req: RegisterRequest): Promise<AuthResponse> {
  if (MOCK_MODE)
    return {
      user: MOCK_USER,
      accessToken: "mock-token",
      refreshToken: "mock-refresh",
    } as AuthResponse;
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function login(req: LoginRequest): Promise<AuthResponse> {
  if (MOCK_MODE)
    return {
      user: MOCK_USER,
      accessToken: "mock-token",
      refreshToken: "mock-refresh",
    } as AuthResponse;
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function refreshTokens(
  refreshToken: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function getMe(): Promise<UserPublic> {
  if (MOCK_MODE) return MOCK_USER as UserPublic;
  return request<UserPublic>("/auth/me");
}

export async function updateFaceVector(vector: number[]): Promise<any> {
  if (MOCK_MODE) return { success: true };
  return request<void>("/auth/face-vector", {
    method: "POST",
    body: JSON.stringify({ vector }),
  });
}

// -----------------------------------------------------------------
// System
// -----------------------------------------------------------------

export async function getSystemConfig(): Promise<SystemConfig> {
  if (MOCK_MODE) return MOCK_SYSTEM_CONFIG as any; // Don't need all the props of the exact type for mock functionality

  // Assemble from individual endpoints and combine into SystemConfig shape
  const [
    bodies,
    routes,
    ships,
    spaceports,
    cabinClasses,
    cryoOptions,
    addOns,
    loyaltyTiers,
    pricing,
  ] = await Promise.all([
    request<
      Pick<
        SystemConfig,
        "stars" | "lagrangeStations" | "bodies" | "simulation" | "epoch"
      >
    >("/system/bodies"),
    request<SystemConfig["routes"]>("/system/routes"),
    request<SystemConfig["shipClasses"]>("/system/ships"),
    request<SystemConfig["spaceports"]>("/system/spaceports"),
    request<SystemConfig["cabinClasses"]>("/system/cabin-classes"),
    request<SystemConfig["cryoOptions"]>("/system/cryo-options"),
    request<SystemConfig["addOns"]>("/system/add-ons"),
    request<SystemConfig["loyaltyTiers"]>("/system/loyalty-tiers"),
    request<SystemConfig["pricing"]>("/system/pricing"),
  ]);

  return {
    ...bodies,
    routes,
    shipClasses: ships,
    spaceports,
    cabinClasses,
    cryoOptions,
    addOns,
    loyaltyTiers,
    pricing,
    // routeTypes are embedded in the config — fetch separately if needed
    routeTypes: [],
  };
}

// -----------------------------------------------------------------
// Voyages
// -----------------------------------------------------------------

export async function searchVoyages(
  params: VoyageSearchParams,
): Promise<Voyage[]> {
  if (MOCK_MODE)
    return MOCK_VOYAGES(params.originId, params.destinationId) as any[]; // Don't need all the props of the exact type for mock functionality
  const query = new URLSearchParams({
    originId: params.originId,
    destinationId: params.destinationId,
    departureDate: params.departureDate,
    adults: String(params.adults),
    children: String(params.children),
    ...(params.routeTypeId ? { routeTypeId: params.routeTypeId } : {}),
  });
  return request<Voyage[]>(`/voyages/search?${query}`);
}

export async function getVoyage(id: string): Promise<Voyage> {
  if (MOCK_MODE) return MOCK_VOYAGES("0", "0")[0] as any; // Don't need all the props of the exact type for mock functionality
  return request<Voyage>(`/voyages/${encodeURIComponent(id)}`);
}

export async function calculatePrice(
  req: PriceRequest,
): Promise<PriceBreakdown> {
  if (MOCK_MODE) return MOCK_VOYAGES("0", "0")[0].priceBreakdown as any; // Don't need all the props of the exact type for mock functionality
  return request<PriceBreakdown>("/voyages/price", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getOrbitalPositions(
  day?: number,
): Promise<OrbitalPositions> {
  if (MOCK_MODE) return MOCK_VOYAGES("0", "0")[0] as any; // Don't need all the props of the exact type for mock functionality
  const query = day !== undefined ? `?day=${day}` : "";
  return request<OrbitalPositions>(`/voyages/orbital-positions${query}`);
}

export async function getClosestApproach(
  originId: string,
  destinationId: string,
  fromDate?: string,
  windowDays?: number,
): Promise<ClosestApproachResult> {
  if (MOCK_MODE)
    if (MOCK_MODE)
      return {
        date: "2801-06-15",
        distanceAU: 2.1,
        windowRating: 4,
      } as ClosestApproachResult;
  const query = new URLSearchParams({ originId, destinationId });
  if (fromDate) query.set("fromDate", fromDate);
  if (windowDays) query.set("windowDays", String(windowDays));
  return request<ClosestApproachResult>(`/voyages/closest-approach?${query}`);
}

// -----------------------------------------------------------------
// Schedule
// -----------------------------------------------------------------

export async function getSchedule(
  routeId: string,
  fromDate?: string,
  count?: number,
): Promise<ScheduleEntry[]> {
  // if (MOCK_MODE) return getMockData("schedule") as ScheduleEntry[];
  // TODO - allow schedule retrieval in MOCK_MODE
  const query = new URLSearchParams();
  if (fromDate) query.set("fromDate", fromDate);
  if (count) query.set("count", String(count));
  return request<ScheduleEntry[]>(`/schedule/${routeId}?${query}`);
}

// -----------------------------------------------------------------
// Bookings
// -----------------------------------------------------------------

export async function createBooking(
  req: CreateBookingRequest,
): Promise<Booking> {
  // if (MOCK_MODE) return MOCK_BOOKINGS[0] as Booking;
  // TODO - Allow booking creation in mock mode
  return request<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function getBooking(id: string): Promise<Booking> {
  if (MOCK_MODE) return MOCK_BOOKINGS[0] as any; // Don't need all the props of the exact type for mock functionality
  return request<Booking>(`/bookings/${id}`);
}

export async function getUserBookings(): Promise<Booking[]> {
  if (MOCK_MODE) return MOCK_BOOKINGS as any[]; // Don't need all the props of the exact type for mock functionality
  return request<Booking[]>("/bookings/me");
}

export async function cancelBooking(id: string): Promise<void> {
  if (MOCK_MODE) return;
  return request<void>(`/bookings/${id}/cancel`, { method: "PATCH" });
}

export { ApiError };
