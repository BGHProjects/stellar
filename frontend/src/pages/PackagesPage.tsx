import { ImagePlaceholder, PageTransition } from "@/components/common";
import { BookingStepIndicator } from "@/components/layout";
import { Badge, Button, Divider } from "@/components/ui";
import {
  fadeUp,
  modalContent,
  modalExpand,
  modalOverlay,
  staggerItem,
} from "@/lib/animations";
import { getSystemConfig } from "@/lib/api";
import { cn, formatCredits } from "@/lib/utils";
import { useBookingStore } from "@/store/bookingStore";
import type { AddOnItem } from "@/types/system";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Compass,
  Info,
  Music,
  Shield,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ReactNode; amenityOnly: boolean }
> = {
  journeyProtection: {
    label: "Journey Protection",
    icon: <Shield className="w-4 h-4" />,
    amenityOnly: false,
  },
  dining: {
    label: "Dining Upgrades",
    icon: <Utensils className="w-4 h-4" />,
    amenityOnly: true,
  },
  recreation: {
    label: "Recreation & Wellbeing",
    icon: <Zap className="w-4 h-4" />,
    amenityOnly: true,
  },
  entertainment: {
    label: "Entertainment",
    icon: <Music className="w-4 h-4" />,
    amenityOnly: true,
  },
  expeditionExtras: {
    label: "Expedition Extras",
    icon: <Compass className="w-4 h-4" />,
    amenityOnly: false,
  },
};

// Items included by default (pre-selected, cannot be deselected)
const INCLUDED_BY_DEFAULT = new Set<string>([
  // Nothing is forcibly included — this set is here so you can add items
  // e.g. 'ship_library' if you want it always included
]);

export default function PackagesPage() {
  const navigate = useNavigate();
  const { legs, updateLeg, setCurrentStep } = useBookingStore();

  const legIndex = legs.length - 1;
  const currentLeg = legs[legIndex];
  const cryoId = currentLeg?.cryoOptionId ?? "conscious";
  const isFullCryo = cryoId === "full_cryo";

  const [selected, setSelected] = useState<Set<string>>(() => {
    const base = new Set(currentLeg?.addOnIds ?? []);
    INCLUDED_BY_DEFAULT.forEach((id) => base.add(id));
    return base;
  });

  // Info modal state
  const [modalItem, setModalItem] = useState<{
    item: AddOnItem;
    price: number;
  } | null>(null);

  useEffect(() => {
    setCurrentStep("packages");
  }, []);

  const { data: systemConfig, isLoading } = useQuery({
    queryKey: ["systemConfig"],
    queryFn: getSystemConfig,
    staleTime: Infinity,
  });

  function toggle(id: string) {
    if (INCLUDED_BY_DEFAULT.has(id)) return; // Cannot deselect included items
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

  function isAvailable(item: AddOnItem, category: string): boolean {
    const meta = CATEGORY_META[category];
    if (!meta.amenityOnly) return true;
    if (isFullCryo) return false;
    if (item.availableToCryo) return item.availableToCryo.includes(cryoId);
    return true;
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
                    <span className="text-white/50">❄</span>
                    <p className="font-sans text-sm text-white/50">
                      You're travelling Full Cryo — amenity packages are
                      unavailable. Journey protection and expedition extras
                      still apply.
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
                    className="flex flex-col gap-4"
                  >
                    {/* Category header */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-800 border border-white/8 flex items-center justify-center text-white/40">
                        {meta.icon}
                      </div>
                      <h2 className="font-display text-display-sm text-white">
                        {meta.label}
                      </h2>
                      {isFullCryo && meta.amenityOnly && (
                        <Badge variant="outline">Cryo only</Badge>
                      )}
                    </div>

                    {/* Available items — vertical list */}
                    <div className="flex flex-col gap-2">
                      {available.map((item) => {
                        const price = getPrice(item);
                        const isSelected = selected.has(item.id);
                        const isIncluded = INCLUDED_BY_DEFAULT.has(item.id);

                        return (
                          <motion.div
                            key={item.id}
                            variants={staggerItem}
                            className={cn(
                              "flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200",
                              isSelected
                                ? "bg-surface-800 border-accent-500/40"
                                : "bg-surface-950/40 border-white/8 hover:border-white/18",
                            )}
                          >
                            {/* Checkbox / check */}
                            <button
                              onClick={() => toggle(item.id)}
                              disabled={isIncluded}
                              className={cn(
                                "w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all",
                                isSelected
                                  ? "bg-accent-500 border-accent-500"
                                  : "border-white/25 hover:border-white/50",
                                isIncluded && "cursor-default",
                              )}
                            >
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-white" />
                              )}
                            </button>

                            {/* Name + tags */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display text-display-sm text-white">
                                  {item.name}
                                </span>
                                {isIncluded && (
                                  <Badge variant="success" size="sm">
                                    Included
                                  </Badge>
                                )}
                                {item.segmentRestricted && (
                                  <Badge variant="warning" size="sm">
                                    Segment-restricted
                                  </Badge>
                                )}
                                {item.voyageSpecific && (
                                  <Badge variant="outline" size="sm">
                                    Select voyages
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Price */}
                            <span className="font-display text-display-sm text-white shrink-0">
                              {isIncluded ? (
                                <span className="text-success text-sm font-sans font-bold">
                                  Included
                                </span>
                              ) : price > 0 ? (
                                formatCredits(price)
                              ) : (
                                "—"
                              )}
                            </span>

                            {/* Info button — opens modal */}
                            <button
                              onClick={() => setModalItem({ item, price })}
                              className="text-white/25 hover:text-white/70 transition-colors shrink-0"
                              title="More information"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </motion.div>
                        );
                      })}

                      {/* Locked items */}
                      {locked.length > 0 && (
                        <div className="flex flex-col gap-2 opacity-30 pointer-events-none">
                          {locked.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4 px-5 py-4 rounded-xl border border-white/5"
                            >
                              <div className="w-6 h-6 rounded-lg border-2 border-white/20 flex items-center justify-center shrink-0" />
                              <div className="flex-1">
                                <span className="font-display text-display-sm text-white/50">
                                  {item.name}
                                </span>
                              </div>
                              <span className="font-sans text-sm text-white/30">
                                {formatCredits(getPrice(item))}
                              </span>
                              <Info className="w-4 h-4 text-white/20" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.section>
                );
              })}
            </div>

            {/* Sticky sidebar */}
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
                              {INCLUDED_BY_DEFAULT.has(id) ? (
                                <span className="text-success">Incl.</span>
                              ) : (
                                formatCredits(getPrice(item))
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {addOnsTotal > 0 && (
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
                </div>

                {/* Back link */}
                <button
                  onClick={() => navigate(-1)}
                  className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors text-center"
                >
                  ← Back to Voyage Detail
                </button>
              </div>
            </aside>
          </div>
        </div>

        {/* ── ADD-ON INFO MODAL ──────────────────────────────────── */}
        <AnimatePresence>
          {modalItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                variants={modalOverlay}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={() => setModalItem(null)}
              />
              <motion.div
                variants={modalExpand}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="relative w-full max-w-lg glass-card overflow-hidden z-10"
              >
                <motion.div
                  variants={modalContent}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {/* Image placeholder */}
                  <ImagePlaceholder
                    aspectRatio="16/9"
                    label={`${modalItem.item.name} — package imagery`}
                    rounded="rounded-none"
                  />

                  <div className="p-6 flex flex-col gap-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-display-md text-white">
                          {modalItem.item.name}
                        </h3>
                        <p className="font-sans text-sm text-white/50 mt-1 leading-relaxed">
                          {modalItem.item.description}
                        </p>
                      </div>
                      <button
                        onClick={() => setModalItem(null)}
                        className="text-white/30 hover:text-white transition-colors shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {modalItem.item.segmentRestricted && (
                        <Badge variant="warning">Segment-restricted</Badge>
                      )}
                      {modalItem.item.voyageSpecific && (
                        <Badge variant="outline">Select voyages only</Badge>
                      )}
                      {modalItem.item.destinationSpecific && (
                        <Badge variant="outline">Destination-specific</Badge>
                      )}
                      {modalItem.item.availableToCryo && (
                        <Badge variant="surface">
                          {modalItem.item.availableToCryo.join(" · ")}
                        </Badge>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between px-4 py-3 bg-surface-900/60 rounded-xl border border-white/6">
                      <span className="font-sans text-sm text-white/50">
                        Price
                      </span>
                      <span className="font-display text-display-sm text-white">
                        {INCLUDED_BY_DEFAULT.has(modalItem.item.id)
                          ? "Included"
                          : modalItem.price > 0
                            ? formatCredits(modalItem.price)
                            : "—"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setModalItem(null)}
                        className="flex-1"
                      >
                        Close
                      </Button>
                      <Button
                        size="md"
                        className="flex-1"
                        onClick={() => {
                          toggle(modalItem.item.id);
                          setModalItem(null);
                        }}
                        disabled={INCLUDED_BY_DEFAULT.has(modalItem.item.id)}
                      >
                        {selected.has(modalItem.item.id)
                          ? "Remove"
                          : "Add to voyage"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
