import { PageTransition } from "@/components/common";
import { BookingStepIndicator } from "@/components/layout";
import { Badge, Button, Divider, OrbitalWindowStars } from "@/components/ui";
import {
  cardHover,
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
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Clock,
  Globe,
  Ruler,
  SlidersHorizontal,
  X,
  Zap,
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

const ROUTE_TYPE_META: Record<
  string,
  { label: string; color: string; description: string; icon: React.ReactNode }
> = {
  direct: {
    label: "Direct Transfer",
    color: "text-white",
    description: "Fastest. Point to point.",
    icon: <Zap className="w-3 h-3" />,
  },
  gravity_assist: {
    label: "Gravity Assist",
    color: "text-accent-300",
    description: "Fuel-efficient via planetary slingshot.",
    icon: <Globe className="w-3 h-3" />,
  },
  multi_stop: {
    label: "Multi-Stop",
    color: "text-white/60",
    description: "Calls at multiple ports. Cheapest.",
    icon: <ArrowRight className="w-3 h-3" />,
  },
  scenic: {
    label: "Scenic Voyage",
    color: "text-warning",
    description: "Passes astrophysical phenomena. Premium.",
    icon: <Ruler className="w-3 h-3" />,
  },
};

// Placeholder image tints per destination — gives each card a different atmosphere
const DESTINATION_TINT: Record<string, string> = {
  aethon: "from-blue-900/80",
  kalos: "from-orange-950/80",
  thal: "from-amber-900/80",
  mira: "from-cyan-950/80",
  calyx: "from-slate-900/80",
  lun: "from-stone-900/80",
  vael: "from-slate-800/80",
  l4_station: "from-indigo-950/80",
  l5_station: "from-indigo-950/80",
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

              {isLoading && (
                <div className="flex flex-col gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="img-placeholder glass-card rounded-2xl h-52"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}

              {isError && !isLoading && (
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="glass-card rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
                >
                  <AlertTriangle className="w-7 h-7 text-warning/50" />
                  <p className="font-display text-display-sm text-white">
                    Unable to load voyages
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </motion.div>
              )}

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

              {!isLoading && filtered.length > 0 && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-4"
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
// VoyageCard — redesigned with image, vertical layout, port info
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
  const [expanded, setExpanded] = useState(false);
  const routeMeta = ROUTE_TYPE_META[voyage.routeTypeId];
  const totalPax = adults + children;
  const destTint =
    DESTINATION_TINT[voyage.destinationId] ?? "from-surface-900/80";
  const originName = BODY_NAMES[voyage.originId] ?? voyage.originId;
  const destName = BODY_NAMES[voyage.destinationId] ?? voyage.destinationId;

  return (
    <motion.div variants={staggerItemUp}>
      <motion.div
        whileHover={cardHover}
        className="relative overflow-hidden rounded-2xl border border-white/8 hover:border-accent-600/40 transition-colors duration-300 cursor-pointer group"
        onClick={onSelect}
      >
        {/* Background: destination image placeholder fading left to right */}
        <div className="absolute inset-0 flex">
          {/* Left content area — solid dark */}
          <div className="w-full lg:w-[58%] shrink-0 bg-surface-950/95" />
          {/* Right image area — placeholder with gradient overlay */}
          <div className="hidden lg:block flex-1 relative">
            {/* Image placeholder */}
            <div className="absolute inset-0 img-placeholder" />
            {/* Gradient: left edge fully opaque dark surface colour, fading right to transparent */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-r",
                destTint,
                "to-transparent",
              )}
            />
            {/* Left-side hard fade so text area is clean */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-surface-950/95 via-transparent to-transparent"
              style={{ width: "60%" }}
            />
          </div>
        </div>

        {/* Content — sits on top of background */}
        <div className="relative z-10 p-6 flex flex-col gap-5">
          {/* Row 1 — ship class + tags + window rating */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-800/80 border border-white/8 flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5 text-white/30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M3.5 8.5 12 3l8.5 5.5v7L12 21l-8.5-5.5v-7z" />
                </svg>
              </div>
              <div>
                <p className="font-display text-display-sm text-white capitalize leading-tight">
                  {voyage.shipClassId}-class
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {routeMeta && (
                    <div
                      className={cn(
                        "flex items-center gap-1 font-sans text-xs font-bold",
                        routeMeta.color,
                      )}
                    >
                      {routeMeta.icon}
                      <span>{routeMeta.label}</span>
                    </div>
                  )}
                  {voyage.crossesScatter && (
                    <Badge variant="warning">Scatter</Badge>
                  )}
                  {voyage.permitRequired && (
                    <Badge variant="danger">Permit req.</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <OrbitalWindowStars
                rating={voyage.orbitalWindowRating}
                showLabel
                size="md"
              />
              <span className="font-sans text-[10px] text-white/25 uppercase tracking-widest">
                orbital window
              </span>
            </div>
          </div>

          {/* Row 2 — Vertical journey info + port details */}
          <div className="flex flex-col gap-3 lg:max-w-[55%]">
            {/* Origin */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className="w-2 h-2 rounded-full bg-accent-400" />
                <div className="w-px flex-1 bg-white/10 min-h-[32px]" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-display-sm text-white">
                    {originName}
                  </span>
                  <span className="font-sans text-xs text-white/30">
                    {formatDate(voyage.departureDate)}
                  </span>
                </div>
                <span className="font-sans text-xs text-white/35">
                  Departure ·{" "}
                  {voyage.originId.charAt(0).toUpperCase() +
                    voyage.originId.slice(1)}{" "}
                  Orbital Ring
                </span>
              </div>
            </div>

            {/* Duration pill */}
            <div className="flex items-center gap-2 pl-5">
              <Clock className="w-3 h-3 text-white/20 shrink-0" />
              <span className="font-sans text-xs text-white/40">
                {formatDuration(voyage.durationDays)}
              </span>
              <span className="text-white/15">·</span>
              <Ruler className="w-3 h-3 text-white/20 shrink-0" />
              <span className="font-sans text-xs text-white/40">
                {voyage.distanceAU.toFixed(2)} AU
              </span>
            </div>

            {/* Destination */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center pt-1">
                <div className="w-2 h-2 rounded-full bg-white/40" />
              </div>
              <div className="flex flex-col gap-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-display-sm text-white">
                    {destName}
                  </span>
                  <span className="font-sans text-xs text-white/30">
                    {formatDate(voyage.arrivalDate)}
                  </span>
                </div>
                <span className="font-sans text-xs text-white/35">
                  Arrival ·{" "}
                  {voyage.destinationId.charAt(0).toUpperCase() +
                    voyage.destinationId.slice(1)}{" "}
                  Deep Port
                </span>
              </div>
            </div>
          </div>

          {/* Row 3 — availability */}
          <div className="font-sans text-xs text-white/25">
            {voyage.availableBerths} berths available
          </div>

          <Divider />

          {/* Row 4 — Price + CTA */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
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

            <div
              className="flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {voyage.availableRouteTypes.length > 1 && (
                <button
                  onClick={() => setExpanded((e) => !e)}
                  className="flex items-center gap-1 font-sans text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  {voyage.availableRouteTypes.length} route options
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
              )}
              {/* Select button — vibrant hover/click animation */}
              <motion.button
                whileHover={{
                  scale: 1.06,
                  boxShadow: "0 0 28px rgba(124,58,237,0.55)",
                }}
                whileTap={{ scale: 0.94 }}
                onClick={onSelect}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-500 text-white font-sans font-bold text-sm rounded-xl transition-colors duration-150"
              >
                Select
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Expandable route type breakdown */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <Divider className="mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {voyage.availableRouteTypes.map((rtId) => {
                    const rt = ROUTE_TYPE_META[rtId];
                    if (!rt) return null;
                    return (
                      <div
                        key={rtId}
                        className="flex flex-col gap-1.5 p-3 bg-surface-900/60 rounded-xl border border-white/5"
                      >
                        <span
                          className={cn(
                            "font-sans text-xs font-bold",
                            rt.color,
                          )}
                        >
                          {rt.label}
                        </span>
                        <span className="font-sans text-xs text-white/30 leading-relaxed">
                          {rt.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
