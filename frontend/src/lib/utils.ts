import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";

// -----------------------------------------------------------------
// Tailwind class merging
// -----------------------------------------------------------------

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// -----------------------------------------------------------------
// Currency formatting
// -----------------------------------------------------------------

export function formatCredits(amount: number, symbol = "₢"): string {
  return `${symbol}${amount.toLocaleString("en-AU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

// -----------------------------------------------------------------
// Date formatting
// -----------------------------------------------------------------

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateLong(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEEE, d MMMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

// -----------------------------------------------------------------
// Duration formatting
// -----------------------------------------------------------------

export function formatDuration(days: number): string {
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours}h`;
  }
  if (days < 2) return "1 day";
  if (days < 30) return `${Math.round(days)} days`;

  const months = Math.floor(days / 30);
  const remainingDays = Math.round(days % 30);
  if (remainingDays === 0) return `${months} month${months > 1 ? "s" : ""}`;
  return `${months}mo ${remainingDays}d`;
}

// -----------------------------------------------------------------
// Orbital window rating
// -----------------------------------------------------------------

export function windowRatingLabel(rating: number): string {
  switch (rating) {
    case 5:
      return "Excellent";
    case 4:
      return "Good";
    case 3:
      return "Average";
    case 2:
      return "Poor";
    case 1:
      return "Unfavourable";
    default:
      return "Unknown";
  }
}

export function windowRatingColor(rating: number): string {
  switch (rating) {
    case 5:
      return "text-rating5";
    case 4:
      return "text-rating4";
    case 3:
      return "text-rating3";
    case 2:
      return "text-rating2";
    default:
      return "text-rating1";
  }
}

export function windowRatingBg(rating: number): string {
  switch (rating) {
    case 5:
      return "bg-rating5/10 border-rating5/30";
    case 4:
      return "bg-rating4/10 border-rating4/30";
    case 3:
      return "bg-rating3/10 border-rating3/30";
    case 2:
      return "bg-rating2/10 border-rating2/30";
    default:
      return "bg-rating1/10 border-rating1/30";
  }
}

// -----------------------------------------------------------------
// Distance formatting
// -----------------------------------------------------------------

export function formatDistance(au: number): string {
  if (au < 0.01) {
    const km = au * 149_597_870.7;
    return `${(km / 1000).toLocaleString("en-AU", { maximumFractionDigits: 0 })} thousand km`;
  }
  return `${au.toFixed(2)} AU`;
}

// -----------------------------------------------------------------
// Passenger helpers
// -----------------------------------------------------------------

export function passengerSummary(adults: number, children: number): string {
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} adult${adults > 1 ? "s" : ""}`);
  if (children > 0) parts.push(`${children} child${children > 1 ? "ren" : ""}`);
  return parts.join(", ");
}

// -----------------------------------------------------------------
// Body type display
// -----------------------------------------------------------------

export function bodyTypeLabel(type: string): string {
  switch (type) {
    case "super_earth":
      return "Super-Earth";
    case "rocky_planet":
      return "Rocky Planet";
    case "gas_giant":
      return "Gas Giant";
    case "ice_planet":
      return "Ice Planet";
    case "moon":
      return "Moon";
    default:
      return type;
  }
}

// -----------------------------------------------------------------
// Booking status
// -----------------------------------------------------------------

export function bookingStatusLabel(status: string): string {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "cancelled":
      return "Cancelled";
    case "completed":
      return "Completed";
    case "bond_held":
      return "Deposit Held";
    default:
      return status;
  }
}

export function bookingStatusColor(status: string): string {
  switch (status) {
    case "confirmed":
      return "text-success";
    case "cancelled":
      return "text-danger";
    case "completed":
      return "text-stellar-400";
    case "bond_held":
      return "text-warning";
    default:
      return "text-white/60";
  }
}

// -----------------------------------------------------------------
// Misc
// -----------------------------------------------------------------

export function pluralise(
  count: number,
  singular: string,
  plural?: string,
): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
