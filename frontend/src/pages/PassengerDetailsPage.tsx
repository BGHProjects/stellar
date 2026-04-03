import { PageTransition } from "@/components/common";
import { BookingStepIndicator } from "@/components/layout";
import { Badge, Button, Card, Input } from "@/components/ui";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import { cn, formatCredits } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import type { PassengerRequest } from "@/types/voyage";
import { motion } from "framer-motion";
import { ChevronRight, User } from "lucide-react";
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
// Seat/Cabin map data
// Each deck has rows of seats. Some are unavailable (pre-booked).
// ─────────────────────────────────────────────────────────────────

interface Seat {
  id: string;
  row: number;
  col: number;
  available: boolean;
  type: "window" | "middle" | "aisle";
}

function generateDeck(
  deckName: string,
  rows: number,
  cols: number,
  unavailableIds: string[],
): { name: string; seats: Seat[] } {
  const seats: Seat[] = [];
  const typeMap: Record<number, Seat["type"]> = {
    0: "window",
    [cols - 1]: "window",
    1: "aisle",
    [cols - 2]: "aisle",
  };
  for (let r = 1; r <= rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `${deckName}-${r}${String.fromCharCode(65 + c)}`;
      seats.push({
        id,
        row: r,
        col: c,
        available: !unavailableIds.includes(id),
        type: typeMap[c] ?? "middle",
      });
    }
  }
  return { name: deckName, seats };
}

// Generate ship layout based on cabin class
function getShipLayout(cabinClassId: string) {
  if (cabinClassId === "drift") {
    // Shared berths — 8 across, 12 rows, 2 decks
    return {
      label: "Shared Berths",
      cols: 8,
      decks: [
        generateDeck("Deck 3", 12, 8, [
          "Deck 3-2B",
          "Deck 3-4E",
          "Deck 3-7A",
          "Deck 3-9C",
          "Deck 3-11F",
        ]),
        generateDeck("Deck 4", 12, 8, [
          "Deck 4-1D",
          "Deck 4-3G",
          "Deck 4-6B",
          "Deck 4-10H",
          "Deck 4-12A",
        ]),
      ],
    };
  }
  if (cabinClassId === "orbit") {
    // Private cabins — 4 per row, 10 rows, 2 decks
    return {
      label: "Private Cabins",
      cols: 4,
      decks: [
        generateDeck("Deck 5", 10, 4, [
          "Deck 5-1A",
          "Deck 5-3D",
          "Deck 5-7B",
          "Deck 5-9C",
        ]),
        generateDeck("Deck 6", 10, 4, ["Deck 6-2A", "Deck 6-4C", "Deck 6-8D"]),
      ],
    };
  }
  if (cabinClassId === "apex") {
    // Premium suites — 3 per row, 8 rows, 1 deck
    return {
      label: "Apex Suites",
      cols: 3,
      decks: [
        generateDeck("Deck 9", 8, 3, ["Deck 9-2B", "Deck 9-5A", "Deck 9-7C"]),
      ],
    };
  }
  // Helix — individual observation suites
  return {
    label: "Helix Observation Suites",
    cols: 2,
    decks: [
      generateDeck("Upper Deck", 6, 2, ["Upper Deck-3B", "Upper Deck-5A"]),
    ],
  };
}

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
  const currentLeg = legs[legs.length - 1];
  const cabinClassId = currentLeg?.cabinClassId ?? "orbit";

  const [localPassengers, setLocalPassengers] = useState<PassengerRequest[]>(
    () =>
      passengers.length > 0
        ? passengers
        : Array.from({ length: totalPassengers }, emptyPassenger),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pointsInput, setPointsInput] = useState(loyaltyPointsToRedeem);
  const [activeDeck, setActiveDeck] = useState(0);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(() =>
    localPassengers.map((p) => p.cabinBerth ?? "").filter(Boolean),
  );

  useEffect(() => {
    setCurrentStep("passengers");
  }, []);

  const layout = getShipLayout(cabinClassId);

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

  function handleSeatSelect(seatId: string, passengerIndex: number) {
    setSelectedSeats((prev) => {
      const next = [...prev];
      // Remove this seat from any other passenger
      const existing = next.indexOf(seatId);
      if (existing !== -1 && existing !== passengerIndex) next[existing] = "";
      // Assign to this passenger
      next[passengerIndex] = next[passengerIndex] === seatId ? "" : seatId;
      return next;
    });
    updatePassenger(
      passengerIndex,
      "cabinBerth",
      localPassengers[passengerIndex]?.cabinBerth === seatId ? "" : seatId,
    );
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
    setPassengers(localPassengers);
    setLoyaltyPointsToRedeem(pointsInput);
    navigate("/review");
  }

  const maxPoints = user?.loyaltyPoints ?? 0;
  const pointsDiscount = pointsInput * 0.01;
  const currentDeck = layout.decks[activeDeck];

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
              {totalPassengers} passenger{totalPassengers > 1 ? "s" : ""} — fill
              in details for each traveller.
            </p>
          </motion.div>

          {/* ── SEAT / CABIN SELECTION ───────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                <div>
                  <span className="label">Seat Selection</span>
                  <h2 className="font-display text-display-sm text-white mt-0.5">
                    {layout.label}
                  </h2>
                </div>
                <p className="font-sans text-xs text-white/35">
                  Select {totalPassengers} seat{totalPassengers > 1 ? "s" : ""}
                </p>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* Deck tabs */}
                {layout.decks.length > 1 && (
                  <div className="flex gap-2">
                    {layout.decks.map((deck, i) => (
                      <button
                        key={deck.name}
                        onClick={() => setActiveDeck(i)}
                        className={cn(
                          "px-4 py-2 rounded-xl font-sans text-sm font-bold transition-all",
                          activeDeck === i
                            ? "bg-white text-black"
                            : "text-white/40 hover:text-white/70 bg-surface-800 border border-white/8",
                        )}
                      >
                        {deck.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-5 flex-wrap">
                  {[
                    {
                      color: "bg-surface-700 border-white/15",
                      label: "Available",
                    },
                    {
                      color: "bg-accent-600/30 border-accent-500/60",
                      label: "Your selection",
                    },
                    {
                      color: "bg-surface-900 border-white/5 opacity-40",
                      label: "Unavailable",
                    },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded border", l.color)} />
                      <span className="font-sans text-xs text-white/40">
                        {l.label}
                      </span>
                    </div>
                  ))}
                  {/* Type legend */}
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-surface-700 border border-accent-300/20" />
                    <span className="font-sans text-xs text-white/40">
                      Window
                    </span>
                  </div>
                </div>

                {/* Seat grid */}
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full">
                    {/* Column headers */}
                    <div className="flex gap-1.5 mb-2 pl-10">
                      {Array.from({ length: layout.cols }).map((_, c) => (
                        <div
                          key={c}
                          className="w-9 text-center font-sans text-xs text-white/20 font-bold"
                        >
                          {String.fromCharCode(65 + c)}
                        </div>
                      ))}
                    </div>

                    {/* Rows */}
                    {Array.from(
                      new Set(currentDeck.seats.map((s) => s.row)),
                    ).map((row) => (
                      <div
                        key={row}
                        className="flex items-center gap-1.5 mb-1.5"
                      >
                        {/* Row number */}
                        <div className="w-8 text-right font-sans text-xs text-white/20 shrink-0">
                          {row}
                        </div>

                        {currentDeck.seats
                          .filter((s) => s.row === row)
                          .map((seat) => {
                            const paxIndex = selectedSeats.indexOf(seat.id);
                            const isSelected = paxIndex !== -1;
                            const isWindow =
                              seat.col === 0 || seat.col === layout.cols - 1;

                            return (
                              <motion.button
                                key={seat.id}
                                onClick={() => {
                                  if (!seat.available) return;
                                  // For single passenger, always assign to pax 0
                                  // For multi-pax, assign to first unassigned
                                  const targetPax =
                                    totalPassengers === 1
                                      ? 0
                                      : isSelected
                                        ? paxIndex
                                        : selectedSeats.findIndex((s) => !s);
                                  if (targetPax === -1) return; // All seats assigned
                                  handleSeatSelect(seat.id, targetPax);
                                }}
                                disabled={!seat.available}
                                whileHover={
                                  seat.available ? { scale: 1.12 } : undefined
                                }
                                whileTap={
                                  seat.available ? { scale: 0.9 } : undefined
                                }
                                title={seat.id}
                                className={cn(
                                  "w-9 h-8 rounded-lg border text-xs font-bold transition-all duration-150 relative",
                                  !seat.available &&
                                    "opacity-30 cursor-not-allowed bg-surface-900 border-white/5",
                                  seat.available &&
                                    !isSelected &&
                                    cn(
                                      "bg-surface-700 border-white/15 hover:border-accent-400/50 hover:bg-surface-600",
                                      isWindow && "border-accent-300/20",
                                    ),
                                  isSelected &&
                                    "bg-accent-600/30 border-accent-500/60 shadow-glow-accent text-accent-200",
                                )}
                              >
                                {isSelected && totalPassengers > 1 && (
                                  <span className="font-sans text-[10px]">
                                    {paxIndex + 1}
                                  </span>
                                )}
                                {isSelected && totalPassengers === 1 && (
                                  <span>✓</span>
                                )}
                              </motion.button>
                            );
                          })}

                        {/* Aisle gap — visual separation in the middle */}
                        {layout.cols > 4 && <div className="w-3" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected seats summary */}
                {selectedSeats.some(Boolean) && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/6">
                    {selectedSeats.map((seatId, i) =>
                      seatId ? (
                        <Badge key={i} variant="accent" size="md">
                          Pax {i + 1}: {seatId}
                        </Badge>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* ── PASSENGER FORMS ──────────────────────────────────── */}
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

          {/* ── LOYALTY POINTS ───────────────────────────────────── */}
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
                  Sign in to access your loyalty points balance.
                </p>
              )}
            </Card>
          </motion.div>

          {/* ── NAVIGATION ───────────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex items-center justify-between pt-4 border-t border-white/5"
          >
            <Button variant="secondary" size="md" onClick={() => navigate(-1)}>
              ← Back to Packages
            </Button>
            <Button onClick={handleContinue} size="lg">
              Review Booking <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
