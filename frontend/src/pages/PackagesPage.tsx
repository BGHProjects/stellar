import { ImagePlaceholder, Modal, PageTransition } from "@/components/common";
import { BookingStepIndicator } from "@/components/layout";
import { Badge, Button, Divider } from "@/components/ui";
import { fadeUp, staggerItem } from "@/lib/animations";
import { getSystemConfig } from "@/lib/api";
import { cn, formatCredits } from "@/lib/utils";
import { useBookingStore } from "@/store/bookingStore";
import type { AddOnItem } from "@/types/system";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  Compass,
  Info,
  Lock,
  Music,
  Shield,
  Utensils,
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

// Items pre-selected and locked — cannot be deselected by the user
const ALWAYS_INCLUDED = new Set<string>(["ship_library"]);

export default function PackagesPage() {
  const navigate = useNavigate();
  const { legs, updateLeg } = useBookingStore();

  const legIndex = legs.length - 1;
  const currentLeg = legs[legIndex];
  const cryoId = currentLeg?.cryoOptionId ?? "conscious";
  const isFullCryo = cryoId === "full_cryo";

  // Initialise with always-included items pre-selected
  const [selected, setSelected] = useState<Set<string>>(() => {
    const base = new Set(currentLeg?.addOnIds ?? []);
    ALWAYS_INCLUDED.forEach((id) => base.add(id));
    return base;
  });

  // Info modal state
  const [modalItem, setModalItem] = useState<AddOnItem | null>(null);

  const { data: systemConfig, isLoading } = useQuery({
    queryKey: ["systemConfig"],
    queryFn: getSystemConfig,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!systemConfig) return;
    const allItems = Object.values(systemConfig.addOns).flat() as AddOnItem[];
    setSelected((prev) => {
      const next = new Set(prev);
      allItems.forEach((item) => {
        if (getPrice(item) === 0) next.add(item.id);
      });
      return next;
    });
  }, [systemConfig]);

  function toggle(id: string) {
    const allItems = Object.values(
      systemConfig?.addOns ?? {},
    ).flat() as AddOnItem[];
    const item = allItems.find((a) => a.id === id);
    if (ALWAYS_INCLUDED.has(id) || getPrice(item!) === 0) return;
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

  const addOnsTotal = systemConfig
    ? [...selected].reduce((sum, id) => {
        const allItems = Object.values(
          systemConfig.addOns,
        ).flat() as AddOnItem[];
        const item = allItems.find((a) => a.id === id);
        return sum + (item ? getPrice(item) : 0);
      }, 0)
    : 0;

  function isAvailable(item: AddOnItem, category: string): boolean {
    const meta = CATEGORY_META[category];
    if (!meta) return true;
    if (!meta.amenityOnly) return true;
    if (isFullCryo) return false;
    if (item.availableToCryo) return item.availableToCryo.includes(cryoId);
    return true;
  }

  if (isLoading || !systemConfig) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-void pt-16 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
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
      <div className="min-h-screen bg-void pt-16 relative">
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
                        <Badge variant="outline" size="sm">
                          Cryo only
                        </Badge>
                      )}
                    </div>

                    {/* Vertical list of add-on rows */}
                    <div className="flex flex-col gap-2">
                      {items.map((item) => {
                        const available = isAvailable(item, categoryId);
                        const isLocked =
                          ALWAYS_INCLUDED.has(item.id) || getPrice(item) === 0;
                        const isSelected = selected.has(item.id);
                        const price = getPrice(item);

                        return (
                          <AddOnRow
                            key={item.id}
                            item={item}
                            price={price}
                            selected={isSelected}
                            locked={isLocked}
                            available={available}
                            onToggle={() => toggle(item.id)}
                            onInfo={() => {
                              setModalItem(item);
                            }}
                          />
                        );
                      })}
                    </div>
                  </motion.section>
                );
              })}

              {/* Back nav */}
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => navigate(-1)}
                  className="font-sans text-sm text-white/30 hover:text-white/60 transition-colors"
                >
                  ← Back to voyage details
                </button>
              </div>
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
                        const isLocked = ALWAYS_INCLUDED.has(id);
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isLocked && (
                                <Lock className="w-3 h-3 text-white/25 shrink-0" />
                              )}
                              <span className="font-sans text-xs text-white/60 truncate">
                                {item.name}
                              </span>
                            </div>
                            <span className="font-sans text-xs text-white/40 shrink-0">
                              {isLocked
                                ? "Included"
                                : formatCredits(getPrice(item))}
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
                  <p className="font-sans text-xs text-white/25 text-center">
                    Continue without additional add-ons
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Info modal */}
        <AddOnInfoModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onAdd={() => {
            if (modalItem) toggle(modalItem.id);
            setModalItem(null);
          }}
          isSelected={modalItem ? selected.has(modalItem.id) : false}
          isLocked={modalItem ? ALWAYS_INCLUDED.has(modalItem.id) : false}
          price={modalItem ? getPrice(modalItem) : 0}
        />
      </div>
    </PageTransition>
  );
}

// ─────────────────────────────────────────────────────────────────
// AddOnRow — single horizontal list item
// ─────────────────────────────────────────────────────────────────

interface AddOnRowProps {
  item: AddOnItem;
  price: number;
  selected: boolean;
  locked: boolean;
  available: boolean;
  onToggle: () => void;
  onInfo: () => void;
}

function AddOnRow({
  item,
  price,
  selected,
  locked,
  available,
  onToggle,
  onInfo,
}: AddOnRowProps) {
  return (
    <motion.div
      variants={staggerItem}
      onClick={available ? onInfo : undefined}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-200",
        available && "cursor-pointer",
        !available && "opacity-30 pointer-events-none",
        selected && available
          ? "bg-surface-800/60 border-accent-600/30"
          : "bg-surface-950/40 border-accent-600/15 hover:border-accent-600/40",
      )}
    >
      {/* Checkbox / lock */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!locked) onToggle();
        }}
        disabled={locked || !available}
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
          locked
            ? "bg-surface-700 border-white/20 cursor-default"
            : selected
              ? "bg-accent-500 border-accent-500"
              : "border-white/20 hover:border-accent-500/50",
        )}
      >
        {locked ? (
          <Lock className="w-2.5 h-2.5 text-white/40" />
        ) : (
          selected && <Check className="w-3 h-3 text-white" />
        )}
      </button>

      {/* Name + tags */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-sans text-sm font-bold text-white">
            {item.name}
          </span>
          {locked && (
            <Badge variant="accent" size="sm">
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
      <span className="font-display text-sm text-white/60 shrink-0">
        {locked ? "—" : price > 0 ? formatCredits(price) : "Included"}
      </span>

      {/* Info button */}
      <button
        onClick={onInfo}
        className="text-white/20 hover:text-accent-300 transition-colors shrink-0"
        title={`More about ${item.name}`}
      >
        <Info className="w-4 h-4" />
      </button>

      {/* Select/deselect button */}
      {!locked && available && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "font-sans text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 shrink-0",
            selected
              ? "border-danger/30 text-danger/70 hover:bg-danger/10"
              : "border-accent-600/40 text-accent-300 hover:bg-accent-600/10",
          )}
        >
          {selected ? "Remove" : "Add"}
        </button>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AddOnInfoModal — circle-expand modal with image and description
// ─────────────────────────────────────────────────────────────────

interface AddOnInfoModalProps {
  item: AddOnItem | null;
  onClose: () => void;
  onAdd: () => void;
  isSelected: boolean;
  isLocked: boolean;
  price: number;
}

function AddOnInfoModal({
  item,
  onClose,
  onAdd,
  isSelected,
  isLocked,
  price,
}: AddOnInfoModalProps) {
  return (
    <Modal isOpen={!!item} onClose={onClose} size="md">
      {item && (
        <div className="flex flex-col gap-0 pb-6">
          {/* Large image placeholder */}
          <img
            src={`/images/addons/${item.id}.jpg`}
            alt={item.name}
            // className="w-full h-full"
          />
          {/* <ImagePlaceholder
            aspectRatio="16/9"
            label={`${item.name} — package imagery`}
            rounded="rounded-none"
          /> */}

          <div className="flex flex-col gap-4 px-6 pt-5">
            {/* Name + price */}

            <h3 className="font-display text-display-sm text-white">
              {item.name}
            </h3>
            <div className="text-left shrink-0">
              {isLocked ? (
                <Badge variant="accent">Included</Badge>
              ) : price > 0 ? (
                <span className="font-display text-display-sm text-white">
                  {formatCredits(price)}
                </span>
              ) : (
                <span className="font-sans text-sm text-white/40">
                  Included
                </span>
              )}
            </div>

            {/* Description */}
            <p className="font-sans text-sm text-white/60 leading-relaxed">
              {item.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {item.segmentRestricted && (
                <div className="flex items-center gap-1.5 font-sans text-xs text-warning/80">
                  <span>⚠</span> Availability varies by voyage segment
                </div>
              )}
              {item.voyageSpecific && (
                <div className="flex items-center gap-1.5 font-sans text-xs text-white/40">
                  <span>ℹ</span> Available on select voyages only
                </div>
              )}
              {item.availableToCryo && !item.availableToAllCryo && (
                <div className="font-sans text-xs text-white/40">
                  Available to:{" "}
                  {item.availableToCryo
                    .map((c) => c.replace("_", " "))
                    .join(", ")}{" "}
                  passengers
                </div>
              )}
            </div>

            <Divider />

            {/* Actions */}
            {isLocked ? (
              <div className="flex items-center justify-between">
                <span className="font-sans text-sm text-white/50">
                  This is included with your voyage
                </span>
                <Button variant="secondary" size="md" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button size="md" onClick={onAdd} className="flex-1">
                  {isSelected ? "Remove" : "Add to Voyage"}
                  {!isSelected && <Check className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
