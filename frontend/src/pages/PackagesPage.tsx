import { PageTransition } from "@/components/common";
import { BookingStepIndicator } from "@/components/layout";
import { Badge, Button, Divider } from "@/components/ui";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import { getSystemConfig } from "@/lib/api";
import { cn, formatCredits } from "@/lib/utils";
import { useBookingStore } from "@/store/bookingStore";
import type { AddOnItem } from "@/types/system";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Compass,
  Music,
  Shield,
  Utensils,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ReactNode; alwaysAvailable: boolean }
> = {
  journeyProtection: {
    label: "Journey Protection",
    icon: <Shield className="w-4 h-4" />,
    alwaysAvailable: true,
  },
  dining: {
    label: "Dining Upgrades",
    icon: <Utensils className="w-4 h-4" />,
    alwaysAvailable: false,
  },
  recreation: {
    label: "Recreation & Wellbeing",
    icon: <Zap className="w-4 h-4" />,
    alwaysAvailable: false,
  },
  entertainment: {
    label: "Entertainment",
    icon: <Music className="w-4 h-4" />,
    alwaysAvailable: false,
  },
  expeditionExtras: {
    label: "Expedition Extras",
    icon: <Compass className="w-4 h-4" />,
    alwaysAvailable: true,
  },
};

export default function PackagesPage() {
  const navigate = useNavigate();
  const { legs, updateLeg, setCurrentStep } = useBookingStore();

  const legIndex = legs.length - 1;
  const currentLeg = legs[legIndex];
  const cryoId = currentLeg?.cryoOptionId ?? "conscious";
  const isFullCryo = cryoId === "full_cryo";

  const [selected, setSelected] = useState<Set<string>>(
    new Set(currentLeg?.addOnIds ?? []),
  );

  useEffect(() => {
    setCurrentStep("packages");
  }, []);

  const { data: systemConfig, isLoading } = useQuery({
    queryKey: ["systemConfig"],
    queryFn: getSystemConfig,
    staleTime: Infinity,
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleContinue() {
    updateLeg(legIndex, { addOnIds: [...selected] });
    navigate("/passengers");
  }

  // Calculate add-ons subtotal
  function getPrice(item: AddOnItem): number {
    return (
      item.priceCredits ??
      item.priceCreditsPerSession ??
      item.priceCreditsPerNight ??
      item.priceCreditsPerMeal ??
      item.priceCreditsPerUnit ??
      item.priceCreditsPerEvent ??
      0
    );
  }

  const addOnsTotal = systemConfig
    ? [...selected].reduce((sum, id) => {
        const allItems = Object.values(
          systemConfig.addOns,
        ).flat() as AddOnItem[];
        const item = allItems.find((a) => a.id === id);
        return sum + (item ? getPrice(item) : 0);
      }, 0)
    : 0;

  // Is an add-on available given cryo status?
  function isAvailable(item: AddOnItem, category: string): boolean {
    const meta = CATEGORY_META[category];
    if (meta.alwaysAvailable) return true;
    if (isFullCryo) return false;
    if (item.availableToCryo) return item.availableToCryo.includes(cryoId);
    return true;
  }

  if (isLoading || !systemConfig) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-void pt-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
            <p className="font-sans text-sm text-white/30">Loading packages…</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  const categories = Object.entries(systemConfig.addOns) as [
    string,
    AddOnItem[],
  ][];

  return (
    <PageTransition>
      <div className="min-h-screen bg-void pt-16">
        <div className="border-b border-white/5 bg-black/70 backdrop-blur-md sticky top-16 z-30">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <BookingStepIndicator currentStep="packages" />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0 flex flex-col gap-10">
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <span className="label">Packages & Add-Ons</span>
                <h1 className="font-display text-display-lg text-white mt-2">
                  Customise Your Voyage
                </h1>
                {isFullCryo && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-surface-800/50 border border-white/8 rounded-xl">
                    <span className="text-white/50 text-sm">❄</span>
                    <p className="font-sans text-sm text-white/50">
                      You're travelling Full Cryo — amenity packages are not
                      available. Journey protection and expedition extras still
                      apply.
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Category sections */}
              {categories.map(([categoryId, items]) => {
                const meta = CATEGORY_META[categoryId];
                if (!meta) return null;
                const available = items.filter((item) =>
                  isAvailable(item, categoryId),
                );
                const locked = items.filter(
                  (item) => !isAvailable(item, categoryId),
                );

                return (
                  <motion.section
                    key={categoryId}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="flex flex-col gap-5"
                  >
                    {/* Category header */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-800 border border-white/8 flex items-center justify-center text-white/40">
                        {meta.icon}
                      </div>
                      <h2 className="font-display text-display-sm text-white">
                        {meta.label}
                      </h2>
                      {isFullCryo && !meta.alwaysAvailable && (
                        <Badge variant="outline">Cryo only</Badge>
                      )}
                    </div>

                    {/* Available items */}
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="grid md:grid-cols-2 gap-3"
                    >
                      {available.map((item) => (
                        <AddOnCard
                          key={item.id}
                          item={item}
                          price={getPrice(item)}
                          selected={selected.has(item.id)}
                          onToggle={() => toggle(item.id)}
                        />
                      ))}
                    </motion.div>

                    {/* Locked items (visible but disabled) */}
                    {locked.length > 0 && (
                      <div className="grid md:grid-cols-2 gap-3 opacity-30 pointer-events-none">
                        {locked.map((item) => (
                          <AddOnCard
                            key={item.id}
                            item={item}
                            price={getPrice(item)}
                            selected={false}
                            onToggle={() => {}}
                            locked
                          />
                        ))}
                      </div>
                    )}
                  </motion.section>
                );
              })}
            </div>

            {/* Sticky sidebar — selected summary */}
            <aside className="w-full lg:w-72 shrink-0">
              <div className="lg:sticky lg:top-32 flex flex-col gap-4">
                <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                  <span className="label">Selected Add-Ons</span>

                  {selected.size === 0 ? (
                    <p className="font-sans text-sm text-white/30">
                      None selected
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {[...selected].map((id) => {
                        const allItems = Object.values(
                          systemConfig.addOns,
                        ).flat() as AddOnItem[];
                        const item = allItems.find((a) => a.id === id);
                        if (!item) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="font-sans text-xs text-white/60 truncate">
                              {item.name}
                            </span>
                            <span className="font-sans text-xs text-white/40 shrink-0">
                              {formatCredits(getPrice(item))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selected.size > 0 && (
                    <>
                      <Divider />
                      <div className="flex items-center justify-between">
                        <span className="label">Add-ons subtotal</span>
                        <span className="font-display text-display-sm text-white">
                          {formatCredits(addOnsTotal)}
                        </span>
                      </div>
                    </>
                  )}

                  <Button
                    onClick={handleContinue}
                    size="lg"
                    className="w-full mt-2"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                  <p className="font-sans text-xs text-white/25 text-center">
                    Skip to continue without add-ons
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ─────────────────────────────────────────────────────────────────
// AddOnCard
// ─────────────────────────────────────────────────────────────────

interface AddOnCardProps {
  item: AddOnItem;
  price: number;
  selected: boolean;
  onToggle: () => void;
  locked?: boolean;
}

function AddOnCard({
  item,
  price,
  selected,
  onToggle,
  locked,
}: AddOnCardProps) {
  return (
    <motion.button
      variants={staggerItem}
      onClick={onToggle}
      disabled={locked}
      whileHover={!locked ? { scale: 1.01 } : undefined}
      whileTap={!locked ? { scale: 0.99 } : undefined}
      className={cn(
        "text-left flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200",
        selected
          ? "bg-surface-800 border-accent-500/50 shadow-glow-accent"
          : "bg-surface-950/40 border-white/8 hover:border-white/20",
        locked && "cursor-default",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 flex-1">
          <p className="font-display text-display-sm text-white">{item.name}</p>
          <p className="font-sans text-xs text-white/40 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Toggle indicator */}
        <div
          className={cn(
            "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all mt-0.5",
            selected ? "bg-accent-500 border-accent-500" : "border-white/20",
          )}
        >
          {selected && (
            <svg
              className="w-3.5 h-3.5 text-white"
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
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/6">
        <div className="flex gap-2 flex-wrap">
          {item.segmentRestricted && (
            <Badge variant="warning">Segment-restricted</Badge>
          )}
          {item.voyageSpecific && (
            <Badge variant="outline">Select voyages</Badge>
          )}
          {item.destinationSpecific && (
            <Badge variant="outline">Destination</Badge>
          )}
        </div>
        <span className="font-display text-display-sm text-white shrink-0">
          {price > 0 ? formatCredits(price) : "Included"}
        </span>
      </div>
    </motion.button>
  );
}
