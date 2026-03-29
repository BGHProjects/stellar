// Orbital mechanics calculations for the Solara system.
// This is the TypeScript mirror of gateway/orbital/orbital.go.
// Both implementations read from the same system.json config values,
// so the 3D renderer and backend pricing always agree on positions.

import type { BodyConfig, CryoOptionConfig } from "@/types/system";

export interface OrbitalParams {
  orbitalRadius: number;
  period: number;
  eccentricity: number;
  startPhase: number; // degrees
}

export interface Vec2 {
  x: number;
  y: number;
}

// -----------------------------------------------------------------
// Core position calculation
// -----------------------------------------------------------------

/**
 * Calculates the 2D position of a body in its orbital plane at simulation day T.
 *
 * angle(T) = startPhase + (2π / period) × T
 * radius(T) = orbitalRadius × (1 - eccentricity × cos(angle))
 * x = radius × cos(angle), y = radius × sin(angle)
 */
export function position(params: OrbitalParams, dayT: number): Vec2 {
  const startPhaseRad = (params.startPhase * Math.PI) / 180;
  const angle = startPhaseRad + ((2 * Math.PI) / params.period) * dayT;
  const radius =
    params.orbitalRadius * (1 - params.eccentricity * Math.cos(angle));
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
}

/**
 * Calculates the absolute position of a moon by adding its orbital
 * offset to its parent body's position.
 */
export function moonPosition(
  moonParams: OrbitalParams,
  parentParams: OrbitalParams,
  dayT: number,
): Vec2 {
  const parent = position(parentParams, dayT);
  const moon = position(moonParams, dayT);
  return { x: parent.x + moon.x, y: parent.y + moon.y };
}

// -----------------------------------------------------------------
// Distance
// -----------------------------------------------------------------

export function distance(
  a: OrbitalParams,
  b: OrbitalParams,
  dayT: number,
): number {
  const pa = position(a, dayT);
  const pb = position(b, dayT);
  return Math.sqrt(Math.pow(pa.x - pb.x, 2) + Math.pow(pa.y - pb.y, 2));
}

// -----------------------------------------------------------------
// Voyage duration
// -----------------------------------------------------------------

/**
 * Calculates estimated journey time in days with refinement passes.
 * Two passes is sufficient for booking-level accuracy.
 */
export function voyageDuration(
  origin: OrbitalParams,
  dest: OrbitalParams,
  departureDay: number,
  speedAUPerDay: number,
  refinementPasses = 2,
): number {
  let dur = distance(origin, dest, departureDay) / speedAUPerDay;
  for (let i = 1; i < refinementPasses; i++) {
    const arrivalDay = departureDay + dur;
    dur = distance(origin, dest, arrivalDay) / speedAUPerDay;
  }
  return dur;
}

// -----------------------------------------------------------------
// Orbital window rating
// -----------------------------------------------------------------

export interface WindowThresholds {
  rating5: number;
  rating4: number;
  rating3: number;
  rating2: number;
  rating1: number;
}

/**
 * Returns a 1–5 orbital window rating for a given departure day.
 * 5 = bodies near closest approach (best window, lowest price multiplier).
 * 1 = bodies near furthest separation (worst window, highest price multiplier).
 */
export function windowRating(
  origin: OrbitalParams,
  dest: OrbitalParams,
  departureDay: number,
  thresholds: WindowThresholds,
): number {
  const { min, max } = separationRange(origin, dest, departureDay);
  if (max === min) return 3;

  const current = distance(origin, dest, departureDay);
  const normalised = (current - min) / (max - min);

  if (normalised <= thresholds.rating5) return 5;
  if (normalised <= thresholds.rating4) return 4;
  if (normalised <= thresholds.rating3) return 3;
  if (normalised <= thresholds.rating2) return 2;
  return 1;
}

function separationRange(
  origin: OrbitalParams,
  dest: OrbitalParams,
  fromDay: number,
): { min: number; max: number } {
  const period = Math.max(origin.period, dest.period);
  let min = Infinity;
  let max = 0;

  for (let i = 0; i <= Math.ceil(period); i++) {
    const d = distance(origin, dest, fromDay + i);
    if (d < min) min = d;
    if (d > max) max = d;
  }
  return { min, max };
}

// -----------------------------------------------------------------
// Closest approach search
// -----------------------------------------------------------------

export function closestApproach(
  origin: OrbitalParams,
  dest: OrbitalParams,
  fromDay: number,
  windowDays: number,
): { day: number; distAU: number } {
  let minDist = Infinity;
  let minDay = fromDay;

  for (let i = 0; i <= windowDays; i++) {
    const d = distance(origin, dest, fromDay + i);
    if (d < minDist) {
      minDist = d;
      minDay = fromDay + i;
    }
  }
  return { day: minDay, distAU: minDist };
}

// -----------------------------------------------------------------
// Simulation day helpers
// -----------------------------------------------------------------

const EPOCH_DATE = "2800-01-01";

export function dayFromDate(date: Date, epochStr = EPOCH_DATE): number {
  const epoch = new Date(epochStr);
  return (date.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24);
}

export function dateFromDay(dayT: number, epochStr = EPOCH_DATE): Date {
  const epoch = new Date(epochStr);
  return new Date(epoch.getTime() + dayT * 24 * 60 * 60 * 1000);
}

export function today(epochStr = EPOCH_DATE): number {
  return dayFromDate(new Date(), epochStr);
}

// -----------------------------------------------------------------
// Config adapters
// -----------------------------------------------------------------

export function paramsFromBody(body: BodyConfig): OrbitalParams {
  return {
    orbitalRadius: body.orbitalRadius,
    period: body.period,
    eccentricity: body.eccentricity,
    startPhase: body.startPhase,
  };
}

// -----------------------------------------------------------------
// Cryo interval bounds
// -----------------------------------------------------------------

export function cryoIntervalBounds(
  durationDays: number,
  cryoCfg: CryoOptionConfig,
): { min: number; max: number } {
  if (!cryoCfg.minIntervalsPerDays || !cryoCfg.maxIntervalsPerDays) {
    return { min: 0, max: 0 };
  }

  let min = Math.ceil(durationDays / cryoCfg.maxIntervalsPerDays);
  let max = Math.floor(durationDays / cryoCfg.minIntervalsPerDays);

  if (
    cryoCfg.absoluteMinIntervals !== undefined &&
    min < cryoCfg.absoluteMinIntervals
  ) {
    min = cryoCfg.absoluteMinIntervals;
  }
  if (
    cryoCfg.absoluteMaxIntervals !== undefined &&
    max > cryoCfg.absoluteMaxIntervals
  ) {
    max = cryoCfg.absoluteMaxIntervals;
  }
  if (min > max) min = max;

  return { min, max };
}

// -----------------------------------------------------------------
// All body positions at a given day
// -----------------------------------------------------------------

export function allBodyPositions(
  bodies: BodyConfig[],
  dayT: number,
): Record<string, Vec2> {
  const bodyMap = new Map(bodies.map((b) => [b.id, b]));
  const positions: Record<string, Vec2> = {};

  for (const body of bodies) {
    const params = paramsFromBody(body);
    if (body.parent && bodyMap.has(body.parent)) {
      const parent = bodyMap.get(body.parent)!;
      positions[body.id] = moonPosition(params, paramsFromBody(parent), dayT);
    } else {
      positions[body.id] = position(params, dayT);
    }
  }

  return positions;
}
