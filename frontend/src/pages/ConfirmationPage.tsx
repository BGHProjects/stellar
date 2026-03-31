import { PageTransition } from "@/components/common";
import { Badge, Button, OrbitalWindowStars } from "@/components/ui";
import {
  fadeUp,
  loomUp,
  staggerContainer,
  staggerItem,
} from "@/lib/animations";
import { getBooking } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useBookingStore } from "@/store/bookingStore";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Home, Star } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BODY_NAMES: Record<string, string> = {
  aethon: "Aethon",
  kalos: "Kalos",
  thal: "Thal",
  mira: "Mira",
  calyx: "Calyx",
  lun: "Lun",
  vael: "Vael",
};

const CABIN_NAMES: Record<string, string> = {
  drift: "Drift",
  orbit: "Orbit",
  apex: "Apex",
  helix: "Helix",
};

const CRYO_NAMES: Record<string, string> = {
  conscious: "Conscious",
  full_cryo: "Full Cryo",
  cryo_intervals: "Cryo Intervals",
};

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const {
    completedBookingIds,
    legs,
    passengers,
    resetBooking,
    setCurrentStep,
  } = useBookingStore();
  const { user } = useAuthStore();
  const primaryId = completedBookingIds[0] ?? "";

  useEffect(() => {
    setCurrentStep("confirmation");
  }, []);

  const { data: booking } = useQuery({
    queryKey: ["booking", primaryId],
    queryFn: () => getBooking(primaryId),
    enabled: !!primaryId,
  });

  function handleDone() {
    resetBooking();
    navigate("/");
  }

  // Use booking data if available, else reconstruct from store state
  const displayLegs = booking
    ? [booking]
    : legs.map((leg) => ({
        ...leg.voyage,
        cryoOptionId: leg.cryoOptionId,
        cabinClassId: leg.cabinClassId,
        passengers,
        totalPrice: leg.voyage.lowestAvailablePrice,
        loyaltyPointsEarned: Math.floor(leg.voyage.lowestAvailablePrice),
      }));

  return (
    <PageTransition>
      <div className="min-h-screen bg-void pt-16 pb-20">
        {/* Celebration glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-accent-600/8 blur-[100px]"
          />
        </div>

        <div className="max-w-3xl mx-auto px-4 py-16 relative z-10 flex flex-col gap-12">
          {/* Success header */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center gap-6"
          >
            <motion.div variants={staggerItem}>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.2,
                }}
                className="w-20 h-20 rounded-full bg-accent-600/20 border border-accent-500/40 flex items-center justify-center mb-2 shadow-glow-accent"
              >
                <Star className="w-9 h-9 text-accent-300 fill-accent-300/30" />
              </motion.div>
            </motion.div>

            <motion.div variants={loomUp} className="flex flex-col gap-3">
              <p className="label tracking-widest text-accent-300">
                Voyage Confirmed
              </p>
              <h1 className="font-display text-display-xl text-white">
                DEPARTURE SECURED
              </h1>
              <p className="font-sans text-white/40 max-w-md leading-relaxed">
                Your voyage has been confirmed.
                {user && ` A confirmation has been sent to ${user.email}.`} Your
                boarding pass{displayLegs.length > 1 ? "es are" : " is"} below.
              </p>
            </motion.div>
          </motion.div>

          {/* Boarding passes */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {passengers.map((passenger, pi) => (
              <motion.div key={pi} variants={staggerItem}>
                {legs.map((leg, li) => (
                  <BoardingPass
                    key={`${pi}-${li}`}
                    passenger={`${passenger.firstName} ${passenger.lastName}`}
                    origin={
                      BODY_NAMES[leg.voyage.originId] ?? leg.voyage.originId
                    }
                    destination={
                      BODY_NAMES[leg.voyage.destinationId] ??
                      leg.voyage.destinationId
                    }
                    departureDate={leg.voyage.departureDate}
                    arrivalDate={leg.voyage.arrivalDate}
                    shipClass={leg.voyage.shipClassId}
                    cabinClass={
                      CABIN_NAMES[leg.cabinClassId] ?? leg.cabinClassId
                    }
                    cryoOption={
                      CRYO_NAMES[leg.cryoOptionId] ?? leg.cryoOptionId
                    }
                    legNumber={li + 1}
                    totalLegs={legs.length}
                    voyageNumber={`STL-${completedBookingIds[li]?.slice(0, 6).toUpperCase() ?? "XXXXXX"}`}
                    windowRating={leg.voyage.orbitalWindowRating}
                    berth={passenger.cabinBerth}
                  />
                ))}
              </motion.div>
            ))}
          </motion.div>

          {/* Loyalty points earned */}
          {booking && booking.loyaltyPointsEarned > 0 && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="label">Points Earned</p>
                <p className="font-display text-display-md text-white mt-1">
                  +{booking.loyaltyPointsEarned.toLocaleString()} pts
                </p>
                <p className="font-sans text-xs text-white/40 mt-0.5">
                  Added to your Frequent Traveller balance
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent-600/20 border border-accent-500/30 flex items-center justify-center">
                <Star className="w-5 h-5 text-accent-300" />
              </div>
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/bookings")}
            >
              View My Voyages
            </Button>
            <Button size="lg" onClick={handleDone}>
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

// ─────────────────────────────────────────────────────────────────
// BoardingPass — the beautiful artefact
// ─────────────────────────────────────────────────────────────────

interface BoardingPassProps {
  passenger: string;
  origin: string;
  destination: string;
  departureDate: string;
  arrivalDate: string;
  shipClass: string;
  cabinClass: string;
  cryoOption: string;
  legNumber: number;
  totalLegs: number;
  voyageNumber: string;
  windowRating: number;
  berth?: string;
}

function BoardingPass({
  passenger,
  origin,
  destination,
  departureDate,
  arrivalDate,
  shipClass,
  cabinClass,
  cryoOption,
  legNumber,
  totalLegs,
  voyageNumber,
  windowRating,
  berth,
}: BoardingPassProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Background — dark surface with subtle pattern */}
      <div className="absolute inset-0 bg-surface-900 border border-white/8" />

      {/* Accent stripe top */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent-600 via-accent-400 to-accent-600/50" />

      {/* Decorative circuit-board pattern */}
      <div
        className="absolute right-0 top-0 bottom-0 w-48 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 1px, transparent 1px, transparent 20px),
                           repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0px, rgba(255,255,255,0.3) 1px, transparent 1px, transparent 20px)`,
        }}
      />

      <div className="relative p-6 flex flex-col gap-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
              <Star className="w-3 h-3 text-accent-300 fill-accent-300/50" />
            </div>
            <span className="font-display text-sm text-white/60 tracking-widest uppercase">
              Stellar
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-xs text-white/30 tracking-widest">
              {voyageNumber}
            </span>
            {totalLegs > 1 && (
              <Badge variant="surface">
                Leg {legNumber} of {totalLegs}
              </Badge>
            )}
          </div>
        </div>

        {/* Passenger name — large display */}
        <div>
          <p className="label mb-1">Passenger</p>
          <p className="font-display text-display-md text-white">{passenger}</p>
        </div>

        {/* Route — the centrepiece */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <p className="label">From</p>
            <p className="font-display text-display-lg text-white">{origin}</p>
            <p className="font-sans text-xs text-white/40">
              {formatDate(departureDate)}
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 w-full">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
              <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            </div>
            <span className="font-sans text-xs text-white/25 capitalize">
              {shipClass}-class
            </span>
          </div>

          <div className="flex flex-col items-end gap-1">
            <p className="label text-right">To</p>
            <p className="font-display text-display-lg text-white">
              {destination}
            </p>
            <p className="font-sans text-xs text-white/40">
              {formatDate(arrivalDate)}
            </p>
          </div>
        </div>

        {/* Divider with perforation effect */}
        <div className="relative flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-void -ml-6 border-r border-white/8" />
          <div className="flex-1 border-t border-dashed border-white/10" />
          <div className="w-4 h-4 rounded-full bg-void -mr-6 border-l border-white/8" />
        </div>

        {/* Details row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="label mb-1">Class</p>
            <p className="font-sans text-sm text-white">{cabinClass}</p>
          </div>
          <div>
            <p className="label mb-1">Experience</p>
            <p className="font-sans text-sm text-white">{cryoOption}</p>
          </div>
          {berth && (
            <div>
              <p className="label mb-1">Berth</p>
              <p className="font-sans text-sm text-white">{berth}</p>
            </div>
          )}
          <div>
            <p className="label mb-1">Orbital Window</p>
            <OrbitalWindowStars rating={windowRating} size="md" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
