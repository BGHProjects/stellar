import { PageTransition } from "@/components/common";
import { BookingStepIndicator } from "@/components/layout";
import VoyageCard from "@/components/searchResultsPage/VoyageCard";
import { Badge, Button, Divider } from "@/components/ui";
import { BODY_NAMES, SORT_OPTIONS } from "@/constants/searchResultsPage";
import { fadeIn, fadeUp, staggerContainer } from "@/lib/animations";
import { searchVoyages } from "@/lib/api";
import { cn, formatDate, passengerSummary } from "@/lib/utils";
import { useBookingStore } from "@/store/bookingStore";
import type { Voyage } from "@/types/voyage";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Globe,
  Ruler,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

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
