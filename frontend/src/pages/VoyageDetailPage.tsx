import { ImagePlaceholder, PageTransition } from "@/components/common";
import { BookingStepIndicator } from "@/components/layout";
import { Button, Divider, OrbitalWindowStars, Spinner } from "@/components/ui";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { getVoyage } from "@/lib/api";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import { useBookingStore } from "@/store/bookingStore";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, Shield, Snowflake, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BODY_NAMES: Record<string, string> = {
  aethon: "Aethon",
  kalos: "Kalos",
  thal: "Thal",
  mira: "Mira",
  calyx: "Calyx",
  lun: "Lun",
  vael: "Vael",
};

const CRYO_OPTIONS = [
  {
    id: "conscious",
    name: "Conscious Voyage",
    tagline: "Live every moment",
    description:
      "Full waking experience for the entire journey. Access to all ship amenities, dining, entertainment, and recreation. Every day of the voyage is lived.",
    priceNote: "Lowest base cost",
    tier: 1,
    icon: <Star className="w-5 h-5" />,
    amenities: true,
  },
  {
    id: "full_cryo",
    name: "Full Cryo",
    tagline: "Sleep through the void",
    description:
      "Placed under for the entire voyage, waking on arrival. No cabin amenities apply — food, entertainment, and recreation add-ons are disabled. Simple, affordable deep travel.",
    priceNote: "Mid-tier pricing",
    tier: 2,
    icon: <Snowflake className="w-5 h-5" />,
    amenities: false,
  },
  {
    id: "cryo_intervals",
    name: "Cryo Intervals",
    tagline: "Time compression with curated waking windows",
    description:
      "Alternates between cryosleep and conscious periods. You select the number of intervals — wake windows give full amenity access. The most expensive option. The most extraordinary.",
    priceNote: "Premium pricing",
    tier: 3,
    icon: (
      <div className="flex gap-0.5">
        <Snowflake className="w-4 h-4" />
        <Star className="w-4 h-4" />
      </div>
    ),
    amenities: true,
  },
];

const CABIN_CLASSES = [
  {
    id: "drift",
    name: "Drift",
    tagline: "Get there.",
    description:
      "Shared quarters, communal lounges and dining. Bunk-style berths. For passengers who need to travel, not experience the travelling.",
    multiplier: "1×",
    viewport: "None",
    private: false,
    cryoCompat: ["conscious", "full_cryo", "cryo_intervals"],
  },
  {
    id: "orbit",
    name: "Orbit",
    tagline: "Private. Comfortable. Sufficient.",
    description:
      "Private cabin with a bed, personal storage, and a viewport screen. Mid-tier dining and recreation access. The standard experience for most travellers.",
    multiplier: "1.8×",
    viewport: "Screen",
    private: true,
    cryoCompat: ["conscious", "full_cryo", "cryo_intervals"],
  },
  {
    id: "apex",
    name: "Apex",
    tagline: "Expansive. Elevated.",
    description:
      "Premium suite with real hull viewports, dedicated dining, priority boarding at waypoints, and exclusive lounge access.",
    multiplier: "3.2×",
    viewport: "Hull viewport",
    private: true,
    cryoCompat: ["conscious", "full_cryo", "cryo_intervals"],
  },
  {
    id: "helix",
    name: "Helix",
    tagline: "The definitive voyage.",
    description:
      "Full suite with personalised steward service, a private observation bubble protruding from the hull, captain's table access, and complimentary add-ons. Conscious voyage only.",
    multiplier: "6×",
    viewport: "Observation bubble",
    private: true,
    cryoCompat: ["conscious"],
  },
];

export default function VoyageDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { legs, updateLeg, setCurrentStep } = useBookingStore();

  const legIndex = legs.length - 1;
  const currentLeg = legs[legIndex];

  const [selectedCryo, setSelectedCryo] = useState(
    currentLeg?.cryoOptionId || "",
  );
  const [selectedCabin, setSelectedCabin] = useState(
    currentLeg?.cabinClassId || "",
  );

  useEffect(() => {
    setCurrentStep("detail");
  }, []);

  const { data: voyage, isLoading } = useQuery({
    queryKey: ["voyage", id],
    queryFn: () => getVoyage(id!),
    enabled: !!id,
    // If we already have the voyage from the search results, use it
    initialData: currentLeg?.voyage,
  });

  function handleContinue() {
    if (!selectedCryo || !selectedCabin) return;
    updateLeg(legIndex, {
      cryoOptionId: selectedCryo,
      cabinClassId: selectedCabin,
    });
    navigate("/packages");
  }

  // Filter cabin classes based on cryo selection and ship class
  const availableCabins = CABIN_CLASSES.filter((c) => {
    if (!selectedCryo) return true;
    return c.cryoCompat.includes(selectedCryo);
  }).filter((c) => {
    if (!voyage) return true;
    // Helion-class only supports drift and orbit
    if (voyage.shipClassId === "helion")
      return ["drift", "orbit"].includes(c.id);
    return true;
  });

  const canContinue = selectedCryo && selectedCabin;

  return (
    <PageTransition>
      <div className="min-h-screen bg-void pt-16">
        {/* Step indicator sticky bar */}
        <div className="border-b border-white/5 bg-black/70 backdrop-blur-md sticky top-16 z-30">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <BookingStepIndicator currentStep="detail" />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          {isLoading && (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          )}

          {voyage && (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-12"
            >
              {/* ── SHIP PROFILE ─────────────────────────────────── */}
              <motion.div variants={fadeUp} className="flex flex-col gap-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <span className="label">Your Voyage</span>
                    <h1 className="font-display text-display-xl text-white mt-2 capitalize">
                      {voyage.shipClassId}-class
                    </h1>
                    <p className="font-sans text-white/50 mt-2">
                      {BODY_NAMES[voyage.originId] ?? voyage.originId}
                      {" → "}
                      {BODY_NAMES[voyage.destinationId] ?? voyage.destinationId}
                    </p>
                  </div>
                  <OrbitalWindowStars
                    rating={voyage.orbitalWindowRating}
                    showLabel
                    size="md"
                  />
                </div>

                {/* Ship hero image */}
                <img
                  src={`/images/fleet/${voyage.shipClassId}/hero.jpg`}
                  alt={voyage.shipClassId}
                  className="w-full rounded-2xl"
                />

                {/* Quick stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Departs",
                      value: formatDate(voyage.departureDate),
                    },
                    { label: "Arrives", value: formatDate(voyage.arrivalDate) },
                    {
                      label: "Duration",
                      value: formatDuration(voyage.durationDays),
                    },
                    {
                      label: "Distance",
                      value: `${voyage.distanceAU.toFixed(2)} AU`,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="glass-card rounded-xl p-4 flex flex-col gap-1"
                    >
                      <span className="label">{stat.label}</span>
                      <span className="font-display text-display-sm text-white">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Route details */}
                <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
                  <span className="label">Route Info</span>
                  <div className="flex flex-wrap gap-3">
                    {voyage.crossesScatter && (
                      <div className="flex items-center gap-2 font-sans text-sm text-white/60">
                        <Shield className="w-4 h-4 text-warning/70" />
                        Crosses the Scatter — asteroid deviation coverage
                        recommended
                      </div>
                    )}
                    {voyage.permitRequired && (
                      <div className="flex items-center gap-2 font-sans text-sm text-white/60">
                        <Shield className="w-4 h-4 text-danger/70" />
                        Permit required for destination — verify before booking
                      </div>
                    )}
                    {!voyage.crossesScatter && !voyage.permitRequired && (
                      <div className="flex items-center gap-2 font-sans text-sm text-white/50">
                        <Shield className="w-4 h-4 text-success/50" />
                        Standard route — no special requirements
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              <Divider />

              {/* ── CRYOSTASIS SELECTION ─────────────────────────── */}
              <motion.div variants={fadeUp} className="flex flex-col gap-6">
                <div>
                  <span className="label">Step 1 of 2</span>
                  <h2 className="font-display text-display-md text-white mt-1">
                    Choose Your Experience
                  </h2>
                  <p className="font-sans text-sm text-white/40 mt-2 max-w-xl">
                    Your cryostasis choice determines your entire journey
                    experience and which amenities are available to you.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {CRYO_OPTIONS.map((option) => {
                    const isSelected = selectedCryo === option.id;
                    // Disable full cryo and intervals for helion-class (too short)
                    const disabled =
                      voyage.shipClassId === "helion" &&
                      option.id !== "conscious";

                    return (
                      <motion.button
                        key={option.id}
                        onClick={() => {
                          if (disabled) return;
                          setSelectedCryo(option.id);
                          // Reset cabin if it's incompatible with new cryo selection
                          const cabin = CABIN_CLASSES.find(
                            (c) => c.id === selectedCabin,
                          );
                          if (cabin && !cabin.cryoCompat.includes(option.id)) {
                            setSelectedCabin("");
                          }
                        }}
                        disabled={disabled}
                        whileHover={!disabled ? { scale: 1.015 } : undefined}
                        whileTap={!disabled ? { scale: 0.985 } : undefined}
                        className={cn(
                          "text-left flex flex-col gap-4 p-5 rounded-2xl border transition-all duration-300",
                          "disabled:opacity-40 disabled:cursor-not-allowed",
                          isSelected
                            ? "bg-surface-800 border-accent-500/60 shadow-glow-accent"
                            : "bg-surface-950/50 border-accent-600/20 hover:border-accent-600/50",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                              isSelected
                                ? "bg-accent-600/30 text-accent-300"
                                : "bg-surface-800 text-white/30",
                            )}
                          >
                            {option.icon}
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center"
                            >
                              <svg
                                className="w-3 h-3 text-white"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </motion.div>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <p className="font-display text-display-sm text-white">
                            {option.name}
                          </p>
                          <p className="font-sans text-xs text-white/40 italic">
                            {option.tagline}
                          </p>
                        </div>

                        <p className="font-sans text-xs text-white/50 leading-relaxed flex-1">
                          {option.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/8">
                          <span className="font-sans text-xs text-white/30">
                            {option.priceNote}
                          </span>
                          <span
                            className={cn(
                              "font-sans text-xs font-bold",
                              option.amenities
                                ? "text-success"
                                : "text-white/30",
                            )}
                          >
                            {option.amenities
                              ? "Amenities available"
                              : "No amenities"}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Cryo intervals selector */}
                {selectedCryo === "cryo_intervals" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="glass-card rounded-xl p-5 flex flex-col gap-3"
                  >
                    <span className="label">Cryo Intervals</span>
                    <p className="font-sans text-sm text-white/50">
                      Select how many times you want to wake during the voyage.
                      Minimum and maximum are calculated from journey duration.
                    </p>
                    <div className="flex items-center gap-4">
                      {[1, 2, 3, 4, 5, 6]
                        .filter((n) => {
                          const minAllowed = Math.max(
                            1,
                            Math.ceil(voyage.durationDays / 30),
                          );
                          const maxAllowed = Math.min(
                            12,
                            Math.floor(voyage.durationDays / 10),
                          );
                          return n >= minAllowed && n <= maxAllowed;
                        })
                        .map((n) => (
                          <button
                            key={n}
                            onClick={() =>
                              updateLeg(legIndex, { cryoIntervals: n } as never)
                            }
                            className={cn(
                              "w-10 h-10 rounded-xl font-display text-display-sm border transition-all",
                              (currentLeg as { cryoIntervals?: number })
                                ?.cryoIntervals === n
                                ? "bg-accent-600/30 border-accent-500/60 text-white"
                                : "bg-surface-800 border-accent-600/20 text-white/40 hover:text-white hover:border-accent-600/50",
                            )}
                          >
                            {n}
                          </button>
                        ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <Divider />

              {/* ── CABIN CLASS SELECTION ─────────────────────────── */}
              <motion.div variants={fadeUp} className="flex flex-col gap-6">
                <div>
                  <span className="label">Step 2 of 2</span>
                  <h2 className="font-display text-display-md text-white mt-1">
                    Choose Your Cabin Class
                  </h2>
                  {!selectedCryo && (
                    <p className="font-sans text-sm text-warning/70 mt-2 flex items-center gap-1.5">
                      <span>↑</span> Select a cryostasis option first
                    </p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {availableCabins.map((cabin) => {
                    const isSelected = selectedCabin === cabin.id;
                    const disabled = !selectedCryo;

                    return (
                      <motion.button
                        key={cabin.id}
                        onClick={() => {
                          if (!disabled) setSelectedCabin(cabin.id);
                        }}
                        disabled={disabled}
                        whileHover={!disabled ? { scale: 1.01 } : undefined}
                        whileTap={!disabled ? { scale: 0.99 } : undefined}
                        className={cn(
                          "text-left flex flex-col gap-0 rounded-2xl border overflow-hidden transition-all duration-300",
                          "disabled:opacity-30 disabled:cursor-not-allowed",
                          isSelected
                            ? "border-accent-500/60 shadow-glow-accent"
                            : "border-accent-600/20 hover:border-accent-600/50",
                        )}
                      >
                        <img
                          src={`/images/cabins/${cabin.id}.jpg`}
                          alt={cabin.name}
                          className="w-full h-full"
                        />

                        <div
                          className={cn(
                            "flex flex-col gap-3 p-5 transition-colors",
                            isSelected ? "bg-surface-800" : "bg-surface-950/50",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-display text-display-sm text-white">
                                {cabin.name} Class
                              </p>
                              <p className="font-sans text-xs text-white/40 italic mt-0.5">
                                {cabin.tagline}
                              </p>
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center shrink-0"
                              >
                                <svg
                                  className="w-3 h-3 text-white"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </motion.div>
                            )}
                          </div>

                          <p className="font-sans text-xs text-white/50 leading-relaxed">
                            {cabin.description}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-white/8">
                            <div className="flex items-center gap-3">
                              <span
                                className={cn(
                                  "font-sans text-xs",
                                  cabin.private
                                    ? "text-success"
                                    : "text-white/30",
                                )}
                              >
                                {cabin.private
                                  ? "Private cabin"
                                  : "Shared quarters"}
                              </span>
                              <span className="font-sans text-xs text-white/30">
                                {cabin.viewport}
                              </span>
                            </div>
                            <span className="font-sans text-xs font-bold text-white/50">
                              {cabin.multiplier} base
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Continue CTA */}
              <motion.div
                variants={fadeUp}
                className="flex items-center justify-between pt-4 border-t border-white/5"
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigate(-1)}
                    className="font-sans text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    ← Back to results
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <span className="label">Selected</span>
                    <p className="font-sans text-sm text-white/60">
                      {selectedCryo ? (
                        CRYO_OPTIONS.find((c) => c.id === selectedCryo)?.name
                      ) : (
                        <span className="text-white/25">No cryo option</span>
                      )}
                      {selectedCryo && selectedCabin && " · "}
                      {selectedCabin
                        ? `${CABIN_CLASSES.find((c) => c.id === selectedCabin)?.name} Class`
                        : ""}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={!canContinue}
                  size="lg"
                >
                  Continue to Packages
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
