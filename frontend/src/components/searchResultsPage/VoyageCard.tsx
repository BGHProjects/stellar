import { Badge, Divider, OrbitalWindowStars } from "@/components/ui";
import { BODY_NAMES, ROUTE_TYPE_META } from "@/constants/searchResultsPage";
import { staggerItemUp } from "@/lib/animations";
import { cn, formatCredits, formatDate, formatDuration } from "@/lib/utils";
import type { Voyage } from "@/types/voyage";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";

const VoyageCard = ({
  voyage,
  adults,
  children,
  onSelect,
}: {
  voyage: Voyage;
  adults: number;
  children: number;
  onSelect: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const routeMeta = ROUTE_TYPE_META[voyage.routeTypeId];
  const totalPax = adults + children;
  const originName = BODY_NAMES[voyage.originId] ?? voyage.originId;
  const destName = BODY_NAMES[voyage.destinationId] ?? voyage.destinationId;

  return (
    <motion.div variants={staggerItemUp}>
      <motion.div
        whileHover={{ scale: 1.005, borderColor: "rgba(124,58,237,0.4)" }}
        className="rounded-2xl border border-accent-600/20 bg-surface-950/60 cursor-pointer transition-colors duration-200"
        onClick={onSelect}
      >
        <div className="p-5 flex flex-col gap-4">
          {/* Top row — ship/route meta + window rating */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-display text-display-sm text-white capitalize">
                {voyage.shipClassId}-class
              </span>
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
                <Badge variant="warning" size="sm">
                  Scatter
                </Badge>
              )}
              {voyage.permitRequired && (
                <Badge variant="danger" size="sm">
                  Permit req.
                </Badge>
              )}
            </div>
            <OrbitalWindowStars
              rating={voyage.orbitalWindowRating}
              showLabel
              size="sm"
            />
          </div>

          {/* Journey row — horizontal origin → duration → destination */}
          <div className="flex items-center gap-3">
            {/* Origin */}
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-display text-display-sm text-white">
                {originName}
              </span>
              <span className="font-sans text-xs text-white/40">
                {formatDate(voyage.departureDate)}
              </span>
              <span className="font-sans text-[10px] text-white/25 truncate">
                {voyage.originId.charAt(0).toUpperCase() +
                  voyage.originId.slice(1)}{" "}
                Orbital Ring
              </span>
            </div>

            {/* Duration + distance — centre column */}
            <div className="flex flex-col items-center gap-1 flex-1 px-2">
              <div className="flex items-center gap-1.5 w-full">
                <div className="h-px flex-1 bg-white/10" />
                <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <span className="font-sans text-xs text-white/40 whitespace-nowrap">
                {formatDuration(voyage.durationDays)}
              </span>
              <span className="font-sans text-[10px] text-white/25 whitespace-nowrap">
                {voyage.distanceAU.toFixed(2)} AU
              </span>
            </div>

            {/* Destination */}
            <div className="flex flex-col gap-0.5 min-w-0 text-right">
              <span className="font-display text-display-sm text-white">
                {destName}
              </span>
              <span className="font-sans text-xs text-white/40">
                {formatDate(voyage.arrivalDate)}
              </span>
              <span className="font-sans text-[10px] text-white/25 truncate">
                {voyage.destinationId.charAt(0).toUpperCase() +
                  voyage.destinationId.slice(1)}{" "}
                Deep Port
              </span>
            </div>
          </div>

          <Divider />

          {/* Bottom row — berths + price + CTA */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-display-md text-white">
                {formatCredits(voyage.lowestAvailablePrice)}
              </span>
              <span className="font-sans text-xs text-white/30">/ person</span>
              {totalPax > 1 && (
                <span className="font-sans text-xs text-white/25 ml-1">
                  · est. {formatCredits(voyage.lowestAvailablePrice * totalPax)}{" "}
                  total
                </span>
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
                  {voyage.availableRouteTypes.length} route types
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
              )}
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

          {/* Expandable route types */}
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
                        className="flex flex-col gap-1 p-3 bg-surface-900/60 rounded-xl border border-white/5"
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
};

export default VoyageCard;
