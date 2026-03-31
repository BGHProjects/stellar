import { PageTransition } from "@/components/common";
import { BookingStepIndicator } from "@/components/layout";
import { Badge, Button, Card, Input } from "@/components/ui";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import { formatCredits } from "@/lib/utils";
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

  // Initialise passenger list to match passenger count
  const [localPassengers, setLocalPassengers] = useState<PassengerRequest[]>(
    () => {
      if (passengers.length > 0) return passengers;
      return Array.from({ length: totalPassengers }, emptyPassenger);
    },
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pointsInput, setPointsInput] = useState(loyaltyPointsToRedeem);

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
  const pointsDiscount = pointsInput * 0.01; // ₢1 per 100 points

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

          {/* Passenger forms */}
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
                    {/* Passenger header */}
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
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Form fields */}
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
                      <Input
                        label="Preferred Berth (optional)"
                        value={passenger.cabinBerth ?? ""}
                        onChange={(e) =>
                          updatePassenger(index, "cabinBerth", e.target.value)
                        }
                        placeholder="e.g. D-14, window-side"
                        hint="Leave blank for automatic assignment"
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

          {/* Loyalty points section */}
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
                  Sign in to access your loyalty points balance and apply a
                  discount to this booking.
                </p>
              )}
            </Card>
          </motion.div>

          {/* Continue CTA */}
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
              ← Back
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
