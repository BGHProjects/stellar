import { ImagePlaceholder, PageTransition } from "@/components/common";
import { BookingStepIndicator } from "@/components/layout";
import {
  Badge,
  Button,
  Card,
  Divider,
  OrbitalWindowStars,
} from "@/components/ui";
import {
  fadeIn,
  fadeUp,
  staggerContainer,
  staggerItemUp,
} from "@/lib/animations";
import { searchVoyages } from "@/lib/api";
import {
  cn,
  formatCredits,
  formatDate,
  formatDuration,
  passengerSummary,
} from "@/lib/utils";
import { useBookingStore } from "@/store/bookingStore";
import type { Voyage } from "@/types/voyage";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Clock,
  Globe,
  MapPin,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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

// Representative spaceports per body — used as display info on cards
const BODY_PRIMARY_PORT: Record<string, string> = {
  aethon: "Aethon Orbital Ring",
  kalos: "Kalos Deep Port",
  thal: "Thal Thermal Station",
  mira: "Mira Access Point",
  calyx: "Calyx Equatorial Port",
  lun: "Lun Station",
  vael: "Vael Station",
  l4_station: "L4 Docking Station",
  l5_station: "L5 Docking Station",
};

// Background image per body — placeholder descriptions
const BODY_IMAGE: Record<string, string> = {
  aethon: "Aethon from orbit — deep blue atmosphere",
  kalos: "Kalos surface — Vareth's storms filling the sky",
  thal: "Thal aurora display over volcanic vents",
  mira: "Mira ice moon — fractured surface plates",
  calyx: "Calyx — pale ice world, city lights through the surface",
  lun: "Lun rocky surface — Calyx looming overhead",
  vael: "Vael — brilliant white reflective ice plain",
};

const ROUTE_TYPE_META: Record<
  string,
  { label: string; color: string; description: string }
> = {
  direct: {
    label: "Direct Transfer",
    color: "text-white",
    description: "Fastest — point to point.",
  },
  gravity_assist: {
    label: "Gravity Assist",
    color: "text-accent-300",
    description: "Fuel-efficient via slingshot.",
  },
  multi_stop: {
    label: "Multi-Stop",
    color: "text-white/60",
    description: "Calls at multiple ports. Cheapest.",
  },
  scenic: {
    label: "Scenic Voyage",
    color: "text-warning",
    description: "Passes astrophysical phenomena. Premium.",
  },
};

const SORT_OPTIONS = [
  { value: "window_desc", label: "Best Window" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "duration_asc", label: "Shortest" },
  { value: "date_asc", label: "Earliest" },
];

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSearchParams, addLeg, setCurrentStep } = useBookingStore();

  const originId = searchParams.get("originId") ?? "";
  const destinationId = searchParams.get("destinationId") ?? "";
  const departureDate = searchParams.get("departureDate") ?? "";
  const adults = Number(searchParams.get("adults") ?? 1);
  const children = Number(searchParams.get("children") ?? 0);

  const [sortBy, setSortBy] = useState("window_desc");
  const [filterRouteType, setFilterRouteType] = useState("");
  const [filterMaxDays, setFilterMaxDays] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setSearchParams({
      originId,
      destinationId,
      departureDate,
      adults,
      children,
      isMultiStop: false,
    });
    setCurrentStep("results");
  }, [originId, destinationId]);

  const {
    data: voyages,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [
      "voyages",
      "search",
      originId,
      destinationId,
      departureDate,
      adults,
      children,
    ],
    queryFn: () =>
      searchVoyages({
        originId,
        destinationId,
        departureDate,
        adults,
        children,
      }),
    enabled: !!(originId && destinationId),
  });

  const filtered = useMemo(() => {
    if (!voyages) return [];
    let r = [...voyages];
    if (filterRouteType) r = r.filter((v) => v.routeTypeId === filterRouteType);
    if (filterMaxDays > 0) r = r.filter((v) => v.durationDays <= filterMaxDays);
    r.sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return a.lowestAvailablePrice - b.lowestAvailablePrice;
        case "price_desc":
          return b.lowestAvailablePrice - a.lowestAvailablePrice;
        case "duration_asc":
          return a.durationDays - b.durationDays;
        case "window_desc":
          return b.orbitalWindowRating - a.orbitalWindowRating;
        case "date_asc":
          return a.departureDay - b.departureDay;
        default:
          return 0;
      }
    });
    return r;
  }, [voyages, sortBy, filterRouteType, filterMaxDays]);

  function handleSelect(voyage: Voyage) {
    addLeg({
      voyage,
      routeTypeId: filterRouteType || voyage.availableRouteTypes[0] || "direct",
      cryoOptionId: "",
      cabinClassId: "",
      departurePortId: "",
      arrivalPortId: "",
      addOnIds: [],
    });
    navigate(`/voyage/${encodeURIComponent(voyage.id)}`);
  }

  const originName = BODY_NAMES[originId] ?? originId;
  const destinationName = BODY_NAMES[destinationId] ?? destinationId;

  // If no search params, show a prompt to go back and search
  if (!originId || !destinationId) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-void pt-24 flex flex-col items-center justify-center gap-6 px-4">
          <Globe className="w-12 h-12 text-white/15" />
          <div className="text-center">
            <p className="font-display text-display-md text-white mb-2">
              Where would you like to go?
            </p>
            <p className="font-sans text-sm text-white/40">
              Select an origin and destination to find available voyages.
            </p>
          </div>
          <Button size="lg" onClick={() => navigate("/")}>
            Back to Search
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-void pt-16">
        {/* Sticky header */}
        <div className="border-b border-white/5 bg-black/70 backdrop-blur-md sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4">
            <BookingStepIndicator currentStep="results" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-display text-display-sm text-white">
                    {originName}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/25 shrink-0" />
                  <span className="font-display text-display-sm text-white">
                    {destinationName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {departureDate && (
                    <Badge variant="surface">{formatDate(departureDate)}</Badge>
                  )}
                  <Badge variant="surface">
                    {passengerSummary(adults, children)}
                  </Badge>
                </div>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors self-start sm:self-auto"
              >
                ← Modify search
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar filters */}
            <aside className="w-full lg:w-60 shrink-0">
              <button
                onClick={() => setShowFilters((f) => !f)}
                className="lg:hidden w-full flex items-center justify-between px-4 py-3 glass-card rounded-xl mb-3"
              >
                <div className="flex items-center gap-2 font-sans text-sm text-white/70">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters & Sort
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-white/40 transition-transform duration-200",
                    showFilters && "rotate-180",
                  )}
                />
              </button>

              <div
                className={cn(
                  "flex flex-col gap-1 glass-card rounded-2xl p-4",
                  !showFilters && "hidden lg:flex",
                )}
              >
                <span className="label px-2 mb-1">Sort</span>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={cn(
                      "text-left px-3 py-2 rounded-lg font-sans text-sm transition-all",
                      sortBy === opt.value
                        ? "bg-white/8 text-white"
                        : "text-white/40 hover:text-white/60",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
                <Divider className="my-3" />
                <span className="label px-2 mb-1">Route Type</span>
                {[
                  { id: "", label: "All" },
                  ...Object.entries(ROUTE_TYPE_META).map(([id, m]) => ({
                    id,
                    label: m.label,
                  })),
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFilterRouteType(opt.id)}
                    className={cn(
                      "text-left px-3 py-2 rounded-lg font-sans text-sm transition-all",
                      filterRouteType === opt.id
                        ? "bg-white/8 text-white"
                        : "text-white/40 hover:text-white/60",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
                <Divider className="my-3" />
                <div className="flex items-center justify-between px-2 mb-1">
                  <span className="label">Max Duration</span>
                  {filterMaxDays > 0 && (
                    <button
                      onClick={() => setFilterMaxDays(0)}
                      className="text-white/30 hover:text-white/60"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {filterMaxDays > 0 && (
                  <p className="font-sans text-xs text-white/50 px-3">
                    {filterMaxDays} days
                  </p>
                )}
                <input
                  type="range"
                  min={0}
                  max={300}
                  step={10}
                  value={filterMaxDays}
                  onChange={(e) => setFilterMaxDays(Number(e.target.value))}
                  className="w-full accent-accent-500 px-3"
                />
                <div className="flex justify-between px-3 font-sans text-xs text-white/20">
                  <span>Any</span>
                  <span>300d</span>
                </div>
              </div>
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <motion.div
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                className="flex items-center justify-between h-6"
              >
                <span className="font-sans text-sm text-white/40">
                  {isLoading
                    ? "Searching…"
                    : `${filtered.length} voyage${filtered.length !== 1 ? "s" : ""} found`}
                </span>
                {(filterRouteType || filterMaxDays > 0) && (
                  <button
                    onClick={() => {
                      setFilterRouteType("");
                      setFilterMaxDays(0);
                    }}
                    className="font-sans text-xs text-accent-300 hover:text-accent-200 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </motion.div>

              {/* Loading skeletons */}
              {isLoading && (
                <div className="flex flex-col gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="img-placeholder glass-card rounded-2xl h-52"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}

              {/* Error */}
              {isError && !isLoading && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="glass-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
                >
                  <AlertTriangle className="w-7 h-7 text-warning/50" />
                  <div>
                    <p className="font-display text-display-sm text-white mb-1">
                      Unable to load voyages
                    </p>
                    <p className="font-sans text-sm text-white/40">
                      Ensure the gateway is running.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </motion.div>
              )}

              {/* Empty */}
              {!isLoading && !isError && filtered.length === 0 && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="glass-card rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
                >
                  <Globe className="w-7 h-7 text-white/15" />
                  <div>
                    <p className="font-display text-display-sm text-white mb-1">
                      No voyages found
                    </p>
                    <p className="font-sans text-sm text-white/40 max-w-xs">
                      {voyages?.length
                        ? "Try adjusting your filters."
                        : "No scheduled service on this route."}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => navigate(-1)}>
                    Modify Search
                  </Button>
                </motion.div>
              )}

              {/* Results */}
              {!isLoading && filtered.length > 0 && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-5"
                >
                  {filtered.map((voyage) => (
                    <VoyageCard
                      key={voyage.id}
                      voyage={voyage}
                      adults={adults}
                      children={children}
                      onSelect={() => handleSelect(voyage)}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ─────────────────────────────────────────────────────────────────
// VoyageCard — redesigned with image strip + vertical layout
// ─────────────────────────────────────────────────────────────────

function VoyageCard({
  voyage,
  adults,
  children,
  onSelect,
}: {
  voyage: Voyage;
  adults: number;
  children: number;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const routeMeta = ROUTE_TYPE_META[voyage.routeTypeId];
  const totalPax = adults + children;
  const destImage =
    BODY_IMAGE[voyage.destinationId] ??
    `${BODY_NAMES[voyage.destinationId]} destination imagery`;
  const originPort = BODY_PRIMARY_PORT[voyage.originId] ?? "Departure port";
  const destPort = BODY_PRIMARY_PORT[voyage.destinationId] ?? "Arrival port";

  return (
    <motion.div variants={staggerItemUp}>
      <Card className="overflow-hidden group">
        <div className="flex flex-col md:flex-row min-h-[200px]">
          {/* Left — main content */}
          <div className="flex-1 p-6 flex flex-col gap-5 min-w-0">
            {/* Row 1 — ship + route type + window */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {routeMeta && (
                    <span
                      className={cn(
                        "font-sans text-xs font-bold",
                        routeMeta.color,
                      )}
                    >
                      {routeMeta.label}
                    </span>
                  )}
                  <span className="text-white/15 text-xs">·</span>
                  <span className="font-sans text-xs text-white/40 capitalize">
                    {voyage.shipClassId}-class
                  </span>
                  {voyage.crossesScatter && (
                    <Badge variant="warning">Scatter</Badge>
                  )}
                  {voyage.permitRequired && (
                    <Badge variant="danger">Permit req.</Badge>
                  )}
                </div>
              </div>
              <OrbitalWindowStars
                rating={voyage.orbitalWindowRating}
                showLabel
                size="md"
              />
            </div>

            {/* Row 2 — ports and dates (vertical column) */}
            <div className="flex flex-col gap-3">
              {/* Origin */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-accent-400" />
                  <div className="w-px h-8 bg-white/10" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-display text-display-sm text-white">
                    {BODY_NAMES[voyage.originId] ?? voyage.originId}
                  </span>
                  <div className="flex items-center gap-1.5 text-white/35">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="font-sans text-xs">{originPort}</span>
                    <span className="text-white/20">·</span>
                    <span className="font-sans text-xs">
                      {formatDate(voyage.departureDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Duration label */}
              <div className="flex items-center gap-3">
                <div className="w-2 flex justify-center shrink-0">
                  <div className="flex flex-col items-center gap-0.5">
                    <Clock className="w-3 h-3 text-white/25" />
                  </div>
                </div>
                <span className="font-sans text-xs text-white/35 italic">
                  {formatDuration(voyage.durationDays)} ·{" "}
                  {voyage.distanceAU.toFixed(2)} AU
                </span>
              </div>

              {/* Destination */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white/40" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-display text-display-sm text-white">
                    {BODY_NAMES[voyage.destinationId] ?? voyage.destinationId}
                  </span>
                  <div className="flex items-center gap-1.5 text-white/35">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="font-sans text-xs">{destPort}</span>
                    <span className="text-white/20">·</span>
                    <span className="font-sans text-xs">
                      {formatDate(voyage.arrivalDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3 — price + CTA */}
            <div className="flex items-end justify-between gap-4 mt-auto pt-2 border-t border-white/6">
              <div>
                <p className="label mb-1">From</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-display-md text-white">
                    {formatCredits(voyage.lowestAvailablePrice)}
                  </span>
                  <span className="font-sans text-xs text-white/30">
                    / person
                  </span>
                </div>
                {totalPax > 1 && (
                  <p className="font-sans text-xs text-white/30 mt-0.5">
                    est. {formatCredits(voyage.lowestAvailablePrice * totalPax)}{" "}
                    total
                  </p>
                )}
              </div>

              {/* Select button — vibrant hover/click animation */}
              <motion.button
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                onClick={onSelect}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.93 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="relative overflow-hidden px-6 py-2.5 rounded-xl font-sans text-sm font-bold text-black bg-white transition-all duration-200"
              >
                {/* Vivid indigo sweep on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-accent-500 to-accent-400"
                  initial={{ opacity: 0, x: "-100%" }}
                  animate={{
                    opacity: hovered ? 1 : 0,
                    x: hovered ? "0%" : "-100%",
                  }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                />
                <span
                  className={cn(
                    "relative z-10 transition-colors duration-200",
                    hovered ? "text-white" : "text-black",
                  )}
                >
                  Select →
                </span>
              </motion.button>
            </div>
          </div>

          {/* Right — destination image strip with gradient fade */}
          <div className="relative hidden md:block w-52 shrink-0 overflow-hidden">
            {/* Gradient fade from card background into image */}
            <div className="absolute inset-y-0 left-0 w-20 z-10 bg-gradient-to-r from-surface-900 via-surface-900/80 to-transparent" />
            {/* Image fills the strip */}
            <ImagePlaceholder
              aspectRatio="3/4"
              label={destImage}
              rounded="rounded-none"
              className="h-full w-full absolute inset-0"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
