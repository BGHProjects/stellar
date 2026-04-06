import { getAllShipClasses } from "@/lib/fleetData";

export const SHIP_CLASSES = getAllShipClasses();

// Which cabin classes each ship supports — for comparison table
export const ALL_CABIN_CLASSES = [
  "Drift Class",
  "Orbit Class",
  "Apex Class",
  "Helix Class",
];
export const ALL_ROUTE_TYPES = [
  "Direct Transfer",
  "Gravity Assist",
  "Multi-Stop",
  "Scenic",
];
