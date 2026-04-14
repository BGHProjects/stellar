import { Modal, PageTransition } from "@/components/common";
import {
  Badge,
  Button,
  Card,
  Divider,
  OrbitalWindowStars,
  Spinner,
} from "@/components/ui";
import {
  fadeIn,
  fadeUp,
  loomUp,
  staggerContainer,
  staggerItemUp,
} from "@/lib/animations";
import { cancelBooking, getUserBookings } from "@/lib/api";
import {
  bookingStatusLabel,
  cn,
  formatCredits,
  formatDate,
  formatDuration,
} from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { Booking } from "@/types/voyage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Clock,
  Globe,
  Snowflake,
  Star,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BODY_NAMES: Record<string, string> = {
  aethon: "Aethon",
  kalos: "Kalos",
  thal: "Thal",
  mira: "Mira",
  calyx: "Calyx",
  lun: "Lun",
  vael: "Vael",
  l4_station: "L4 Station",
  l5_station: "L5 Station",
};

const CRYO_LABELS: Record<string, string> = {
  conscious: "Conscious",
  full_cryo: "Full Cryo",
  cryo_intervals: "Cryo Intervals",
};

const CABIN_LABELS: Record<string, string> = {
  drift: "Drift",
  orbit: "Orbit",
  apex: "Apex",
  helix: "Helix",
};

const ADDON_NAMES: Record<string, string> = {
  radiation_shield: "Radiation Shield Insurance",
  asteroid_deviation: "Asteroid Deviation Coverage",
  emergency_evac: "Emergency Evacuation Policy",
  journey_interrupt: "Journey Interruption Protection",
  chefs_table: "Chef's Table Access",
  cultural_cuisine: "Cultural Cuisine Weeks",
  private_dining: "Private In-Cabin Dining",
  zerog_spa: "Zero-G Spa Access",
  observatory: "Stellar Observatory Sessions",
  fitness_suite: "Fitness & Training Suite",
  immersive_reality: "Immersive Reality Suite",
  ship_library: "Ship Library & Archive",
  live_performance: "Live Performance Schedule",
  shore_excursion: "Shore Excursion",
  arrival_transfer: "Private Arrival Transfer",
  premium_cargo: "Premium Cargo Hold",
  spacewalk: "Spacewalk Experience",
};

type FilterTab = "all" | "upcoming" | "completed" | "cancelled";

export default function BookingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<FilterTab>("upcoming");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  useEffect(() => {
    if (!isAuthenticated)
      navigate("/login", { state: { from: "/bookings" }, replace: true });
  }, [isAuthenticated]);

  const queryClient = useQueryClient();

  const {
    data: bookings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: getUserBookings,
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings", "me"] });
      setCancelTarget(null);
    },
  });

  // Filter bookings by tab
  const filtered = (bookings ?? [])
    .filter((b) => {
      if (activeTab === "all") return true;
      if (activeTab === "upcoming")
        return b.status === "confirmed" || b.status === "bond_held";
      if (activeTab === "completed") return b.status === "completed";
      if (activeTab === "cancelled") return b.status === "cancelled";
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.departureDate).getTime() -
        new Date(b.departureDate).getTime(),
    );

  const upcomingCount = (bookings ?? []).filter(
    (b) => b.status === "confirmed" || b.status === "bond_held",
  ).length;
  const completedCount = (bookings ?? []).filter(
    (b) => b.status === "completed",
  ).length;

  const TABS: { id: FilterTab; label: string; count?: number }[] = [
    { id: "upcoming", label: "Upcoming", count: upcomingCount },
    { id: "completed", label: "Completed", count: completedCount },
    { id: "cancelled", label: "Cancelled" },
    { id: "all", label: "All" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-void pt-16">
        {/* Page header */}
        <div className="border-b border-white/5">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <motion.div variants={loomUp} initial="hidden" animate="visible">
              <span className="label">Account</span>
              <h1 className="font-display text-display-xl text-white mt-2">
                My Voyages
              </h1>
            </motion.div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
          {/* Tabs */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex gap-1 bg-surface-900/60 border border-white/6 rounded-xl p-1 w-fit"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans text-sm font-bold transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      "text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[20px] text-center",
                      activeTab === tab.id
                        ? "bg-black/15 text-black"
                        : "bg-white/8 text-white/50",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          )}

          {/* Error */}
          {isError && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="glass-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
            >
              <AlertCircle className="w-7 h-7 text-danger/50" />
              <div>
                <p className="font-display text-display-sm text-white mb-1">
                  Could not load voyages
                </p>
                <p className="font-sans text-sm text-white/40">
                  Check your connection and try again.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["bookings", "me"],
                  })
                }
              >
                Retry
              </Button>
            </motion.div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && filtered.length === 0 && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="glass-card rounded-2xl p-16 flex flex-col items-center gap-6 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-surface-800 border border-white/8 flex items-center justify-center">
                <Globe className="w-8 h-8 text-white/15" />
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-display text-display-md text-white">
                  {activeTab === "upcoming"
                    ? "No upcoming voyages"
                    : `No ${activeTab} voyages`}
                </p>
                <p className="font-sans text-sm text-white/40 max-w-xs">
                  {activeTab === "upcoming"
                    ? "Your next voyage is waiting to be booked. Where in the Taunor system will you go?"
                    : "Nothing to show here."}
                </p>
              </div>
              {activeTab === "upcoming" && (
                <Button onClick={() => navigate("/")} size="lg">
                  <Star className="w-4 h-4" />
                  Book a Voyage
                </Button>
              )}
            </motion.div>
          )}

          {/* Booking cards */}
          {!isLoading && filtered.length > 0 && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-4"
            >
              {filtered.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onViewDetails={() => setSelectedBooking(booking)}
                  onCancel={() => setCancelTarget(booking)}
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* Booking detail modal */}
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancel={(b) => {
            setSelectedBooking(null);
            setCancelTarget(b);
          }}
        />

        {/* Cancel confirmation modal */}
        <Modal
          isOpen={!!cancelTarget}
          onClose={() => setCancelTarget(null)}
          title="Cancel Voyage"
          size="sm"
        >
          <div className="px-6 pb-6 flex flex-col gap-5">
            <p className="font-sans text-sm text-white/60 leading-relaxed">
              Are you sure you want to cancel your voyage from{" "}
              <span className="text-white">
                {BODY_NAMES[cancelTarget?.originId ?? ""] ??
                  cancelTarget?.originId}
              </span>{" "}
              to{" "}
              <span className="text-white">
                {BODY_NAMES[cancelTarget?.destinationId ?? ""] ??
                  cancelTarget?.destinationId}
              </span>{" "}
              departing{" "}
              <span className="text-white">
                {cancelTarget ? formatDate(cancelTarget.departureDate) : ""}
              </span>
              ?
            </p>
            <p className="font-sans text-xs text-white/40">
              Cancellation policies apply. Refunds are processed within 14 days.
            </p>
            {cancelMutation.isError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/25 rounded-xl">
                <AlertCircle className="w-4 h-4 text-danger shrink-0" />
                <p className="font-sans text-xs text-danger">
                  Cancellation failed. Please try again.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setCancelTarget(null)}
                className="flex-1"
              >
                Keep Voyage
              </Button>
              <Button
                variant="danger"
                size="md"
                loading={cancelMutation.isPending}
                onClick={() =>
                  cancelTarget && cancelMutation.mutate(cancelTarget.id)
                }
                className="flex-1"
              >
                Cancel Voyage
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}

// ─────────────────────────────────────────────────────────────────
// BookingCard
// ─────────────────────────────────────────────────────────────────

interface BookingCardProps {
  booking: Booking;
  onViewDetails: () => void;
  onCancel: () => void;
}

function BookingCard({ booking, onViewDetails, onCancel }: BookingCardProps) {
  const isActive =
    booking.status === "confirmed" || booking.status === "bond_held";
  const isBondHeld = booking.status === "bond_held";
  const originName = BODY_NAMES[booking.originId] ?? booking.originId;
  const destName = BODY_NAMES[booking.destinationId] ?? booking.destinationId;

  const daysUntil = Math.max(
    0,
    Math.round(
      (new Date(booking.departureDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <motion.div variants={staggerItemUp}>
      <Card className="overflow-hidden">
        {/* Status bar — top accent line */}
        <div
          className={cn(
            "h-0.5 w-full",
            booking.status === "confirmed" &&
              "bg-gradient-to-r from-accent-600 to-accent-400",
            booking.status === "bond_held" &&
              "bg-gradient-to-r from-warning to-warning/50",
            booking.status === "completed" &&
              "bg-gradient-to-r from-white/20 to-transparent",
            booking.status === "cancelled" && "bg-danger/30",
          )}
        />

        <div className="p-5 md:p-6 flex flex-col gap-5">
          {/* Top row — route + status + window */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-display text-display-md text-white">
                  {originName}
                </span>
                <ArrowRight className="w-4 h-4 text-white/25 shrink-0" />
                <span className="font-display text-display-md text-white">
                  {destName}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={
                    booking.status === "confirmed"
                      ? "success"
                      : booking.status === "bond_held"
                        ? "warning"
                        : booking.status === "cancelled"
                          ? "danger"
                          : "outline"
                  }
                >
                  {bookingStatusLabel(booking.status)}
                </Badge>
                {isBondHeld && (
                  <Badge variant="outline">
                    Balance due: {formatCredits(booking.balanceDue)}
                  </Badge>
                )}
                <Badge variant="surface" className="capitalize">
                  {booking.shipClassId}-class
                </Badge>
              </div>
            </div>
            <OrbitalWindowStars
              rating={booking.orbitalWindowRating}
              showLabel
            />
          </div>

          {/* Dates and duration */}
          <div className="grid grid-cols-3 gap-2 items-center">
            <div>
              <p className="label mb-1">Departs</p>
              <p className="font-sans text-sm text-white">
                {formatDate(booking.departureDate)}
              </p>
              {isActive && daysUntil <= 30 && (
                <p
                  className={cn(
                    "font-sans text-xs mt-0.5",
                    daysUntil <= 7 ? "text-warning" : "text-white/40",
                  )}
                >
                  {daysUntil === 0 ? "Today" : `In ${daysUntil} days`}
                </p>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 w-full">
                <div className="h-px flex-1 bg-white/8" />
                <Clock className="w-3 h-3 text-white/20 shrink-0" />
                <div className="h-px flex-1 bg-white/8" />
              </div>
              <p className="font-sans text-xs text-white/40 text-center">
                {formatDuration(
                  (new Date(booking.arrivalDate).getTime() -
                    new Date(booking.departureDate).getTime()) /
                    (1000 * 60 * 60 * 24),
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="label mb-1 text-right">Arrives</p>
              <p className="font-sans text-sm text-white">
                {formatDate(booking.arrivalDate)}
              </p>
            </div>
          </div>

          {/* Config badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Snowflake className="w-3 h-3 text-white/25" />
              <span className="font-sans text-xs text-white/40">
                {CRYO_LABELS[booking.cryoOptionId] ?? booking.cryoOptionId}
              </span>
            </div>
            <span className="text-white/15">·</span>
            <span className="font-sans text-xs text-white/40">
              {CABIN_LABELS[booking.cabinClassId] ?? booking.cabinClassId} Class
            </span>
            <span className="text-white/15">·</span>
            <span className="font-sans text-xs text-white/40">
              {booking.passengers.length} passenger
              {booking.passengers.length !== 1 ? "s" : ""}
            </span>
          </div>

          <Divider />

          {/* Bottom — price + actions */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-0.5">
              <span className="label">Total</span>
              <span className="font-display text-display-sm text-white">
                {formatCredits(booking.totalPrice)}
              </span>
              {booking.loyaltyPointsEarned > 0 && (
                <span className="font-sans text-xs text-accent-300">
                  +{booking.loyaltyPointsEarned.toLocaleString()} pts earned
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isActive && (
                <Button variant="ghost" size="sm" onClick={onCancel}>
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={onViewDetails}>
                View Details
                <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BookingDetailModal — full booking info + boarding passes
// ─────────────────────────────────────────────────────────────────

interface BookingDetailModalProps {
  booking: Booking | null;
  onClose: () => void;
  onCancel: (booking: Booking) => void;
}

function BookingDetailModal({
  booking,
  onClose,
  onCancel,
}: BookingDetailModalProps) {
  if (!booking) return null;

  const isActive =
    booking.status === "confirmed" || booking.status === "bond_held";
  const originName = BODY_NAMES[booking.originId] ?? booking.originId;
  const destName = BODY_NAMES[booking.destinationId] ?? booking.destinationId;

  return (
    <Modal isOpen={!!booking} onClose={onClose} size="lg">
      <div className="px-6 pb-6 flex flex-col gap-6 max-h-[80vh] overflow-y-auto">
        {/* Route header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="label mb-1">Voyage Details</p>
            <div className="flex items-center gap-2">
              <span className="font-display text-display-md text-white">
                {originName}
              </span>
              <ArrowRight className="w-4 h-4 text-white/30" />
              <span className="font-display text-display-md text-white">
                {destName}
              </span>
            </div>
          </div>
          <OrbitalWindowStars
            rating={booking.orbitalWindowRating}
            showLabel
            size="md"
          />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Departs", value: formatDate(booking.departureDate) },
            { label: "Arrives", value: formatDate(booking.arrivalDate) },
            {
              label: "Ship",
              value: `${booking.shipClassId}-class`.replace(/^\w/, (c) =>
                c.toUpperCase(),
              ),
            },
            {
              label: "Cryo",
              value: CRYO_LABELS[booking.cryoOptionId] ?? booking.cryoOptionId,
            },
            {
              label: "Cabin",
              value: `${CABIN_LABELS[booking.cabinClassId] ?? booking.cabinClassId} Class`,
            },
            {
              label: "Route Type",
              value: booking.routeTypeId
                .replace(/_/g, " ")
                .replace(/^\w/, (c) => c.toUpperCase()),
            },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5">
              <span className="label">{row.label}</span>
              <span className="font-sans text-sm text-white">{row.value}</span>
            </div>
          ))}
        </div>

        <Divider />

        {/* Passengers */}
        <div className="flex flex-col gap-3">
          <span className="label">Passengers</span>
          <div className="flex flex-col gap-2">
            {booking.passengers.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 bg-surface-900/60 rounded-xl border border-white/6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-surface-700 border border-white/8 flex items-center justify-center">
                    <span className="font-display text-xs text-white/40">
                      {i + 1}
                    </span>
                  </div>
                  <span className="font-sans text-sm text-white">
                    {p.firstName} {p.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.cabinBerth && (
                    <span className="font-mono text-xs text-white/30">
                      {p.cabinBerth}
                    </span>
                  )}
                  <Badge variant={p.isChild ? "warning" : "surface"} size="sm">
                    {p.isChild ? "Child" : "Adult"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Divider />

        {/* Add-ons */}
        {booking.addOns && booking.addOns.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="label">Add-Ons</span>
            <div className="flex flex-col gap-2">
              {booking.addOns.map((addOn) => (
                <div
                  key={addOn.addOnId}
                  className="flex items-center gap-2 px-4 py-2.5 bg-surface-900/60 rounded-xl glass-card"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0" />
                  <span className="font-sans text-sm text-white/70">
                    {ADDON_NAMES[addOn.addOnId] ??
                      addOn.addOnId
                        .replace(/_/g, " ")
                        .replace(/^\w/, (c) => c.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Divider />

        {/* Price breakdown */}
        <div className="flex flex-col gap-3">
          <span className="label">Price Breakdown</span>
          <div className="glass-card rounded-xl p-4 flex flex-col gap-3">
            {[
              {
                label: "Base fare",
                value: booking.priceBreakdown.baseFare,
                show: true,
              },
              {
                label: "Route type",
                value: booking.priceBreakdown.routeTypeAdjustment,
                show: booking.priceBreakdown.routeTypeAdjustment !== 0,
              },
              {
                label: "Cabin class",
                value: booking.priceBreakdown.cabinClassAdjustment,
                show: booking.priceBreakdown.cabinClassAdjustment !== 0,
              },
              {
                label: "Orbital window",
                value: booking.priceBreakdown.orbitalWindowAdjustment,
                show: booking.priceBreakdown.orbitalWindowAdjustment !== 0,
              },
              {
                label: "Add-ons",
                value: booking.priceBreakdown.addOnsTotal,
                show: booking.priceBreakdown.addOnsTotal > 0,
              },
              {
                label: "Port & docking fees",
                value: booking.priceBreakdown.portFees,
                show: true,
              },
              {
                label: "Loyalty discount",
                value: booking.priceBreakdown.loyaltyDiscount,
                show: booking.priceBreakdown.loyaltyDiscount < 0,
              },
            ]
              .filter((r) => r.show)
              .map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between"
                >
                  <span className="font-sans text-xs text-white/40">
                    {row.label}
                  </span>
                  <span
                    className={cn(
                      "font-sans text-xs",
                      row.value < 0 ? "text-success" : "text-white/70",
                    )}
                  >
                    {row.value < 0 ? "-" : ""}
                    {formatCredits(Math.abs(row.value))}
                  </span>
                </div>
              ))}
            <Divider />
            <div className="flex items-center justify-between">
              <span className="font-sans text-sm font-bold text-white/70">
                Total
              </span>
              <span className="font-display text-display-sm text-white">
                {formatCredits(booking.totalPrice)}
              </span>
            </div>
            {booking.isVoyageBond && (
              <div className="flex items-center justify-between text-warning">
                <span className="font-sans text-xs">Balance remaining</span>
                <span className="font-sans text-xs font-bold">
                  {formatCredits(booking.balanceDue)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isActive && (
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={() => onCancel(booking)}
              className="text-danger/70 hover:text-danger"
            >
              Cancel Voyage
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
