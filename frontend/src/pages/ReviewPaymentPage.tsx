import { PageTransition } from "@/components/common";
import { BookingStepIndicator } from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  Divider,
  OrbitalWindowStars,
} from "@/components/ui";
import { fadeUp } from "@/lib/animations";
import { createBooking } from "@/lib/api";
import { cn, formatCredits, formatDate, formatDuration } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight, LogIn, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const BODY_NAMES: Record<string, string> = {
  aethon: "Aethon",
  kalos: "Kalos",
  thal: "Thal",
  mira: "Mira",
  calyx: "Calyx",
  lun: "Lun",
  vael: "Vael",
};

const CRYO_NAMES: Record<string, string> = {
  conscious: "Conscious Voyage",
  full_cryo: "Full Cryo",
  cryo_intervals: "Cryo Intervals",
};

const CABIN_NAMES: Record<string, string> = {
  drift: "Drift Class",
  orbit: "Orbit Class",
  apex: "Apex Class",
  helix: "Helix Class",
};

export default function ReviewPaymentPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const {
    legs,
    passengers,
    searchParams,
    loyaltyPointsToRedeem,
    isVoyageBond,
    setIsVoyageBond,
    setCurrentStep,
    setCompletedBookingIds,
  } = useBookingStore();

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"full" | "bond">("full");

  useEffect(() => {
    setCurrentStep("review");
  }, []);

  // ── AUTH GUARD ──────────────────────────────────────────────────
  // Booking requires authentication — show a prompt if not logged in
  if (!isAuthenticated) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-void pt-16">
          <div className="border-b border-white/5 bg-black/70 backdrop-blur-md sticky top-16 z-30">
            <div className="max-w-5xl mx-auto px-4 py-4">
              <BookingStepIndicator currentStep="review" />
            </div>
          </div>
          <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center text-center gap-8">
            <div className="w-16 h-16 rounded-full bg-surface-800 border border-white/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white/30" />
            </div>
            <div className="flex flex-col gap-3">
              <h2 className="font-display text-display-md text-white">
                Sign in to complete your booking
              </h2>
              <p className="font-sans text-sm text-white/50 leading-relaxed">
                You need a Stellar account to confirm your voyage and receive
                your boarding pass. Your booking selections have been saved and
                will be waiting when you return.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Link to="/login" state={{ from: "/review" }}>
                <Button size="lg" className="w-full">
                  <LogIn className="w-4 h-4" />
                  Sign in
                </Button>
              </Link>
              <Link to="/register" state={{ from: "/review" }}>
                <Button variant="secondary" size="lg" className="w-full">
                  Create an account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }
  // ── END AUTH GUARD ──────────────────────────────────────────────

  // Calculate estimated total from legs
  const estimatedTotal =
    legs.reduce((sum, leg) => {
      const base = leg.voyage.lowestAvailablePrice;
      const pax = (searchParams?.adults ?? 1) + (searchParams?.children ?? 0);
      return sum + base * pax;
    }, 0) -
    loyaltyPointsToRedeem * 0.01;

  const depositAmount = estimatedTotal * 0.2;

  const mutation = useMutation({
    mutationFn: async () => {
      const bookingIds: string[] = [];
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const result = await createBooking({
          legNumber: i + 1,
          routeId: leg.voyage.routeId,
          routeTypeId: leg.routeTypeId,
          departureDay: leg.voyage.departureDay,
          departurePortId: leg.departurePortId,
          arrivalPortId: leg.arrivalPortId,
          cryoOptionId: leg.cryoOptionId,
          cabinClassId: leg.cabinClassId,
          passengers: passengers,
          addOnIds: leg.addOnIds,
          loyaltyPointsToRedeem: i === 0 ? loyaltyPointsToRedeem : 0,
          isVoyageBond: paymentMethod === "bond",
        });
        bookingIds.push(result.id);
      }
      return bookingIds;
    },
    onSuccess: (ids) => {
      setCompletedBookingIds(ids);
      navigate("/confirmation");
    },
  });

  function handleConfirm() {
    if (!agreedToTerms) return;
    mutation.mutate();
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-void pt-16">
        <div className="border-b border-white/5 bg-black/70 backdrop-blur-md sticky top-16 z-30">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <BookingStepIndicator currentStep="review" />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main review content */}
            <div className="flex-1 min-w-0 flex flex-col gap-8">
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <span className="label">Review & Confirm</span>
                <h1 className="font-display text-display-lg text-white mt-2">
                  Confirm Your Voyage
                </h1>
              </motion.div>

              {/* Leg summaries */}
              {legs.map((leg, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                      <span className="label">
                        {legs.length > 1 ? `Leg ${i + 1}` : "Voyage"}
                      </span>
                      <OrbitalWindowStars
                        rating={leg.voyage.orbitalWindowRating}
                        showLabel
                      />
                    </div>

                    <div className="p-6 grid sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-4">
                        <ReviewRow label="Route">
                          <span>
                            {BODY_NAMES[leg.voyage.originId] ??
                              leg.voyage.originId}
                          </span>
                          <span className="text-white/30 mx-1">→</span>
                          <span>
                            {BODY_NAMES[leg.voyage.destinationId] ??
                              leg.voyage.destinationId}
                          </span>
                        </ReviewRow>
                        <ReviewRow label="Ship">
                          <span className="capitalize">
                            {leg.voyage.shipClassId}-class
                          </span>
                        </ReviewRow>
                        <ReviewRow label="Route Type">
                          <span className="capitalize">
                            {leg.routeTypeId.replace("_", " ")}
                          </span>
                        </ReviewRow>
                      </div>
                      <div className="flex flex-col gap-4">
                        <ReviewRow label="Departs">
                          {formatDate(leg.voyage.departureDate)}
                        </ReviewRow>
                        <ReviewRow label="Arrives">
                          {formatDate(leg.voyage.arrivalDate)}
                        </ReviewRow>
                        <ReviewRow label="Duration">
                          {formatDuration(leg.voyage.durationDays)}
                        </ReviewRow>
                      </div>
                      <div className="flex flex-col gap-4">
                        <ReviewRow label="Cryostasis">
                          {CRYO_NAMES[leg.cryoOptionId] ?? leg.cryoOptionId}
                        </ReviewRow>
                        <ReviewRow label="Cabin">
                          {CABIN_NAMES[leg.cabinClassId] ?? leg.cabinClassId}
                        </ReviewRow>
                      </div>
                      {leg.addOnIds.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="label">Add-Ons</span>
                          <div className="flex flex-wrap gap-1.5">
                            {leg.addOnIds.map((id) => (
                              <Badge key={id} variant="surface">
                                {id.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}

              {/* Passengers */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <Card className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/6">
                    <span className="label">
                      Passengers ({passengers.length})
                    </span>
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    {passengers.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="flex flex-col gap-0.5">
                          <p className="font-sans text-sm text-white">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="font-sans text-xs text-white/30">
                            {p.dateOfBirth}
                          </p>
                        </div>
                        {p.specialRequests && (
                          <p className="font-sans text-xs text-white/40 text-right max-w-xs">
                            {p.specialRequests}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Sticky payment sidebar */}
            <aside className="w-full lg:w-80 shrink-0">
              <div className="lg:sticky lg:top-32 flex flex-col gap-4">
                <Card className="p-6 flex flex-col gap-5">
                  <span className="label">Payment Summary</span>

                  {/* Line items */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-sm text-white/50">
                        Base fares
                      </span>
                      <span className="font-sans text-sm text-white">
                        {formatCredits(
                          estimatedTotal + loyaltyPointsToRedeem * 0.01,
                        )}
                      </span>
                    </div>
                    {loyaltyPointsToRedeem > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-sm text-white/50">
                          Loyalty discount
                        </span>
                        <span className="font-sans text-sm text-success">
                          -{formatCredits(loyaltyPointsToRedeem * 0.01)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Divider />

                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm font-bold text-white/70">
                      Estimated Total
                    </span>
                    <span className="font-display text-display-md text-white">
                      {formatCredits(estimatedTotal)}
                    </span>
                  </div>

                  {/* Payment method toggle */}
                  <div className="flex flex-col gap-3">
                    <span className="label">Payment Method</span>
                    {[
                      {
                        id: "full",
                        label: "Pay in full",
                        sub: formatCredits(estimatedTotal) + " today",
                      },
                      {
                        id: "bond",
                        label: "Voyage Bond",
                        sub:
                          formatCredits(depositAmount) +
                          " deposit, remainder closer to departure",
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() =>
                          setPaymentMethod(opt.id as "full" | "bond")
                        }
                        className={cn(
                          "text-left p-3 rounded-xl border transition-all duration-200",
                          paymentMethod === opt.id
                            ? "bg-surface-800 border-accent-500/50"
                            : "border-white/8 hover:border-white/20",
                        )}
                      >
                        <p className="font-sans text-sm text-white font-bold">
                          {opt.label}
                        </p>
                        <p className="font-sans text-xs text-white/40 mt-0.5">
                          {opt.sub}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setAgreedToTerms((a) => !a)}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all",
                        agreedToTerms
                          ? "bg-accent-500 border-accent-500"
                          : "border-white/25",
                      )}
                    >
                      {agreedToTerms && (
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
                      )}
                    </button>
                    <p className="font-sans text-xs text-white/40 leading-relaxed">
                      I agree to the voyage terms and conditions, including the
                      cancellation policy and cryostasis waiver.
                    </p>
                  </div>

                  {mutation.isError && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/25 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                      <p className="font-sans text-xs text-danger">
                        Booking failed. Please try again.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col items-center justify-between pt-4 border-t border-white/5 space-y-4">
                    <Button
                      onClick={handleConfirm}
                      disabled={!agreedToTerms || mutation.isPending}
                      loading={mutation.isPending}
                      size="lg"
                      className="w-full"
                    >
                      {mutation.isPending ? "Confirming..." : "Confirm Voyage"}
                      {!mutation.isPending && (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      onClick={() => navigate(-1)}
                      variant="ghost"
                      size="lg"
                      className="w-full text-xs"
                    >
                      ← Back to passengers
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-white/20">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="font-sans text-xs">Secured booking</span>
                  </div>
                </Card>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function ReviewRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="label">{label}</span>
      <div className="font-sans text-sm text-white flex items-center">
        {children}
      </div>
    </div>
  );
}
