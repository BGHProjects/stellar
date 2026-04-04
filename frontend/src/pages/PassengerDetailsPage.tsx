import { PageTransition } from "@/components/common";
import { BookingStepIndicator } from "@/components/layout";
import { Badge, Button, Card, Input } from "@/components/ui";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import { cn, formatCredits } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import type { PassengerRequest } from "@/types/voyage";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, ChevronUp, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function emptyPassenger(): PassengerRequest {
  return {
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    cabinBerth: "",
    specialRequests: "",
  };
}

// ─────────────────────────────────────────────────────────────────
// Seat/Cabin map — bird's-eye layout of the ship
// ─────────────────────────────────────────────────────────────────

// Simulated seat/cabin layout per cabin class and deck
// In production this would come from the API
function generateLayout(cabinClass: string, deck: number): SeatData[][] {
  const rows: SeatData[][] = [];
  const isPrivate = ["orbit", "apex", "helix"].includes(cabinClass);

  if (isPrivate) {
    // Cabin layout — 2 columns of cabins per deck
    const cabinCount =
      cabinClass === "helix" ? 6 : cabinClass === "apex" ? 10 : 14;
    const cabinsPerRow = 2;
    for (let r = 0; r < Math.ceil(cabinCount / cabinsPerRow); r++) {
      const row: SeatData[] = [];
      for (let c = 0; c < cabinsPerRow; c++) {
        const num = r * cabinsPerRow + c + 1 + (deck - 1) * cabinCount;
        const status =
          num % 7 === 0
            ? "unavailable"
            : num % 11 === 0
              ? "unavailable"
              : "available";
        row.push({
          id: `${["D", "E", "F"][deck - 1]}${num}`,
          status,
          isWindow: c === 0 || c === cabinsPerRow - 1,
        });
      }
      rows.push(row);
    }
  } else {
    // Seat layout — 4 columns per row (2-aisle-2)
    const rowCount = 12;
    for (let r = 0; r < rowCount; r++) {
      const row: SeatData[] = [];
      for (let c = 0; c < 4; c++) {
        const letter = ["A", "B", "C", "D"][c];
        const num = r + 1 + (deck - 1) * rowCount;
        const id = `${num}${letter}`;
        const status =
          (r === 2 && c === 1) ||
          (r === 5 && c === 3) ||
          (r === 8 && c === 0) ||
          (r === 3 && c === 2)
            ? "unavailable"
            : "available";
        const isWindow = c === 0 || c === 3;
        row.push({ id, status, isWindow });
      }
      rows.push(row);
    }
  }
  return rows;
}

interface SeatData {
  id: string;
  status: "available" | "unavailable" | "selected";
  isWindow: boolean;
}

interface SeatMapProps {
  cabinClass: string;
  selectedSeats: string[];
  maxSelectable: number;
  onSeatSelect: (seatId: string) => void;
}

function SeatMap({
  cabinClass,
  selectedSeats,
  maxSelectable,
  onSeatSelect,
}: SeatMapProps) {
  const [activeDeck, setActiveDeck] = useState(1);
  const isPrivate = ["orbit", "apex", "helix"].includes(cabinClass);
  const deckCount = cabinClass === "helix" ? 1 : cabinClass === "apex" ? 2 : 3;
  const layout = generateLayout(cabinClass, activeDeck);

  return (
    <div className="flex flex-col gap-4">
      {/* Deck tabs */}
      {deckCount > 1 && (
        <div className="flex gap-1">
          {Array.from({ length: deckCount }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => setActiveDeck(d)}
              className={cn(
                "px-4 py-1.5 rounded-lg font-sans text-xs font-bold transition-all",
                activeDeck === d
                  ? "bg-white text-black"
                  : "text-white/40 hover:text-white/70 bg-surface-800",
              )}
            >
              Deck {d}
            </button>
          ))}
        </div>
      )}

      {/* Ship outline */}
      <div className="relative">
        {/* Ship nose decoration */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-surface-800 rounded-t-full border border-white/8 border-b-0" />

        <div className="bg-surface-900/60 border border-white/8 rounded-2xl p-4 pt-6">
          {/* Column labels for seat layout */}
          {!isPrivate && (
            <div className="flex gap-1 mb-2 px-1">
              {["A", "B", "", "C", "D"].map((label, i) => (
                <div
                  key={i}
                  className={cn(
                    "font-sans text-[10px] text-white/25 text-center",
                    i === 2 ? "w-4" : "flex-1",
                  )}
                >
                  {label}
                </div>
              ))}
            </div>
          )}

          {/* Rows */}
          <div className="flex flex-col gap-1.5">
            {layout.map((row, ri) => (
              <div key={ri} className="flex items-center gap-1">
                {/* Row number */}
                <span className="font-mono text-[10px] text-white/20 w-4 text-right shrink-0">
                  {ri + 1 + (activeDeck - 1) * (isPrivate ? 6 : 12)}
                </span>

                {/* Seats */}
                <div
                  className={cn(
                    "flex gap-1 flex-1",
                    isPrivate ? "justify-center gap-3" : "",
                  )}
                >
                  {row.map((seat, si) => {
                    const isSelected = selectedSeats.includes(seat.id);
                    const isUnavail = seat.status === "unavailable";
                    const canSelect =
                      !isUnavail &&
                      (isSelected || selectedSeats.length < maxSelectable);

                    return (
                      <button
                        key={seat.id}
                        disabled={!canSelect}
                        onClick={() => canSelect && onSeatSelect(seat.id)}
                        title={`${isPrivate ? "Cabin" : "Seat"} ${seat.id}${seat.isWindow ? " — Window" : ""}${isUnavail ? " — Unavailable" : ""}`}
                        className={cn(
                          "rounded transition-all duration-150 focus:outline-none relative group",
                          isPrivate
                            ? "w-16 h-10 rounded-lg text-xs"
                            : "flex-1 h-7 rounded text-[10px]",
                          isSelected
                            ? "bg-accent-500 border-2 border-accent-400 text-white"
                            : isUnavail
                              ? "bg-surface-800/30 border border-white/5 text-white/15 cursor-not-allowed"
                              : seat.isWindow
                                ? "bg-surface-700/60 border border-white/15 text-white/60 hover:bg-accent-600/30 hover:border-accent-500/50"
                                : "bg-surface-700/40 border border-white/10 text-white/40 hover:bg-accent-600/20 hover:border-accent-500/40",
                          // Aisle gap for non-private 2+2 layout
                          !isPrivate && si === 1 && "mr-2",
                        )}
                      >
                        <span className="font-mono">{seat.id}</span>
                        {/* Window indicator */}
                        {seat.isWindow && !isUnavail && (
                          <div
                            className="absolute inset-y-1 w-0.5 bg-accent-400/30 rounded-full"
                            style={{
                              left: si === 0 ? 2 : undefined,
                              right:
                                si > 0 && si === row.length - 1 ? 2 : undefined,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Stern decoration */}
          <div className="flex justify-center mt-2">
            <div className="w-24 h-3 bg-surface-800 rounded-b-full border border-white/8 border-t-0" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        {[
          { color: "bg-accent-500 border-accent-400", label: "Selected" },
          { color: "bg-surface-700/60 border-white/15", label: "Window" },
          { color: "bg-surface-700/40 border-white/10", label: "Available" },
          {
            color: "bg-surface-800/30 border-white/5 opacity-50",
            label: "Unavailable",
          },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn("w-4 h-3 rounded border", color)} />
            <span className="font-sans text-xs text-white/40">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────

export default function PassengerDetailsPage() {
  const navigate = useNavigate();
  const {
    legs,
    searchParams,
    passengers,
    setPassengers,
    setCurrentStep,
    loyaltyPointsToRedeem,
    setLoyaltyPointsToRedeem,
  } = useBookingStore();
  const { user, isAuthenticated } = useAuthStore();

  const totalPassengers =
    (searchParams?.adults ?? 1) + (searchParams?.children ?? 0);
  const cabinClass = legs[legs.length - 1]?.cabinClassId ?? "drift";

  const [localPassengers, setLocalPassengers] = useState<PassengerRequest[]>(
    () =>
      passengers.length > 0
        ? passengers
        : Array.from({ length: totalPassengers }, emptyPassenger),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pointsInput, setPointsInput] = useState(loyaltyPointsToRedeem);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(
    localPassengers.map((p) => p.cabinBerth ?? "").filter(Boolean),
  );
  const [showSeatMap, setShowSeatMap] = useState(false);

  useEffect(() => {
    setCurrentStep("passengers");
  }, []);

  function updatePassenger(
    index: number,
    field: keyof PassengerRequest,
    value: string,
  ) {
    setLocalPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`${index}.${field}`];
      return next;
    });
  }

  function handleSeatSelect(seatId: string) {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) return prev.filter((s) => s !== seatId);
      if (prev.length >= totalPassengers) return [...prev.slice(1), seatId];
      return [...prev, seatId];
    });
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    localPassengers.forEach((p, i) => {
      if (!p.firstName.trim()) newErrors[`${i}.firstName`] = "Required";
      if (!p.lastName.trim()) newErrors[`${i}.lastName`] = "Required";
      if (!p.dateOfBirth) newErrors[`${i}.dateOfBirth`] = "Required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleContinue() {
    if (!validate()) return;
    // Assign selected seats to passengers
    const withSeats = localPassengers.map((p, i) => ({
      ...p,
      cabinBerth: selectedSeats[i] ?? "",
    }));
    setPassengers(withSeats);
    setLoyaltyPointsToRedeem(pointsInput);
    navigate("/review");
  }

  const maxPoints = user?.loyaltyPoints ?? 0;
  const pointsDiscount = pointsInput * 0.01;

  return (
    <PageTransition>
      <div className="min-h-screen bg-void pt-16">
        <div className="border-b border-white/5 bg-black/70 backdrop-blur-md sticky top-16 z-30">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <BookingStepIndicator currentStep="passengers" />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-10">
          {/* Header */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <span className="label">Passenger Details</span>
            <h1 className="font-display text-display-lg text-white mt-2">
              Who's travelling?
            </h1>
            <p className="font-sans text-sm text-white/40 mt-2">
              {totalPassengers} passenger{totalPassengers > 1 ? "s" : ""}
            </p>
          </motion.div>

          {/* ── SEAT / CABIN MAP ──────────────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card className="overflow-hidden">
              <button
                onClick={() => setShowSeatMap((s) => !s)}
                className="w-full flex items-center justify-between px-6 py-4 border-b border-white/6 hover:bg-white/2 transition-colors"
              >
                <div className="flex flex-col items-start gap-0.5">
                  <span className="font-display text-display-sm text-white">
                    {["orbit", "apex", "helix"].includes(cabinClass)
                      ? "Select Your Cabin"
                      : "Select Your Seat"}
                  </span>
                  <span className="font-sans text-xs text-white/40">
                    {selectedSeats.length > 0
                      ? `${selectedSeats.join(", ")} selected`
                      : `Choose ${totalPassengers} ${["orbit", "apex", "helix"].includes(cabinClass) ? "cabin" : "seat"}${totalPassengers > 1 ? "s" : ""}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSeats.length > 0 && (
                    <Badge variant="accent">
                      {selectedSeats.length} selected
                    </Badge>
                  )}
                  {showSeatMap ? (
                    <ChevronUp className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {showSeatMap && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6">
                      <SeatMap
                        cabinClass={cabinClass}
                        selectedSeats={selectedSeats}
                        maxSelectable={totalPassengers}
                        onSeatSelect={handleSeatSelect}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* ── PASSENGER FORMS ───────────────────────────────────── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {localPassengers.map((passenger, index) => {
              const isChild =
                searchParams && index >= (searchParams.adults ?? 1);
              return (
                <motion.div key={index} variants={staggerItem}>
                  <Card className="overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-700 border border-white/8 flex items-center justify-center">
                          <User className="w-4 h-4 text-white/40" />
                        </div>
                        <div>
                          <p className="font-display text-display-sm text-white">
                            {passenger.firstName
                              ? `${passenger.firstName} ${passenger.lastName}`.trim()
                              : `Passenger ${index + 1}`}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant={isChild ? "warning" : "surface"}>
                              {isChild ? "Child" : "Adult"}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="accent">Lead passenger</Badge>
                            )}
                            {selectedSeats[index] && (
                              <Badge variant="surface">
                                {["orbit", "apex", "helix"].includes(cabinClass)
                                  ? "Cabin"
                                  : "Seat"}{" "}
                                {selectedSeats[index]}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        label="First Name"
                        value={passenger.firstName}
                        onChange={(e) =>
                          updatePassenger(index, "firstName", e.target.value)
                        }
                        error={errors[`${index}.firstName`]}
                        placeholder="Given name"
                        autoComplete="given-name"
                      />
                      <Input
                        label="Last Name"
                        value={passenger.lastName}
                        onChange={(e) =>
                          updatePassenger(index, "lastName", e.target.value)
                        }
                        error={errors[`${index}.lastName`]}
                        placeholder="Family name"
                        autoComplete="family-name"
                      />
                      <Input
                        label="Date of Birth"
                        type="date"
                        value={passenger.dateOfBirth}
                        onChange={(e) =>
                          updatePassenger(index, "dateOfBirth", e.target.value)
                        }
                        error={errors[`${index}.dateOfBirth`]}
                        className="[color-scheme:dark]"
                      />
                      <div className="sm:col-span-2">
                        <Input
                          label="Special Requests (optional)"
                          value={passenger.specialRequests ?? ""}
                          onChange={(e) =>
                            updatePassenger(
                              index,
                              "specialRequests",
                              e.target.value,
                            )
                          }
                          placeholder="Dietary requirements, accessibility needs, etc."
                        />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ── LOYALTY POINTS ─────────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Card className="p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="label">Frequent Traveller Points</span>
                  <h3 className="font-display text-display-sm text-white mt-1">
                    Apply Loyalty Points
                  </h3>
                </div>
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    className="font-sans text-xs text-accent-300 hover:text-accent-200 transition-colors"
                  >
                    Sign in to apply
                  </Link>
                )}
              </div>

              {isAuthenticated && user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-4 py-3 bg-surface-800/50 rounded-xl border border-white/8">
                    <div>
                      <p className="font-sans text-sm text-white/60">
                        Available balance
                      </p>
                      <p className="font-display text-display-sm text-white mt-0.5">
                        {user.loyaltyPoints.toLocaleString()} pts
                      </p>
                    </div>
                    <Badge variant="accent">{user.loyaltyTier}</Badge>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="label">Points to redeem</span>
                      {pointsInput > 0 && (
                        <span className="font-sans text-xs text-success">
                          -{formatCredits(pointsDiscount)} discount
                        </span>
                      )}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={maxPoints}
                      step={100}
                      value={pointsInput}
                      onChange={(e) => setPointsInput(Number(e.target.value))}
                      className="w-full accent-accent-500"
                    />
                    <div className="flex justify-between font-sans text-xs text-white/25">
                      <span>0 pts</span>
                      <span>{maxPoints.toLocaleString()} pts</span>
                    </div>
                  </div>

                  {pointsInput > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-accent-600/10 border border-accent-500/20 rounded-xl">
                      <span className="font-sans text-sm text-white/60">
                        Redeeming {pointsInput.toLocaleString()} points
                      </span>
                      <span className="font-display text-display-sm text-accent-300">
                        -{formatCredits(pointsDiscount)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="font-sans text-sm text-white/30">
                  Sign in to apply loyalty points as a discount on this booking.
                </p>
              )}
            </Card>
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex items-center justify-between pt-4 border-t border-white/5"
          >
            <button
              onClick={() => navigate(-1)}
              className="font-sans text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              ← Back to packages
            </button>
            <Button onClick={handleContinue} size="lg">
              Review Booking
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
