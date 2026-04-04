import { PageTransition } from "@/components/common";
import { Badge, Button } from "@/components/ui";
import { fadeUp, loomUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, Globe, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const VISITABLE_BODIES = [
  { id: "aethon", name: "Aethon", sub: "Inner System", restricted: false },
  { id: "kalos", name: "Kalos", sub: "Vareth System", restricted: false },
  { id: "thal", name: "Thal", sub: "Vareth System", restricted: false },
  { id: "mira", name: "Mira", sub: "Vareth System", restricted: true },
  { id: "calyx", name: "Calyx", sub: "Outer System", restricted: false },
  { id: "lun", name: "Lun", sub: "Calyx System", restricted: false },
  { id: "vael", name: "Vael", sub: "Calyx System", restricted: false },
  {
    id: "l4_station",
    name: "L4 Station",
    sub: "Lagrange Point",
    restricted: false,
  },
  {
    id: "l5_station",
    name: "L5 Station",
    sub: "Lagrange Point",
    restricted: false,
  },
];

// Colour accent per body — subtle tint on selection
const BODY_ACCENT: Record<string, string> = {
  aethon: "border-blue-500/40 bg-blue-500/8",
  kalos: "border-orange-700/40 bg-orange-700/8",
  thal: "border-amber-600/40 bg-amber-600/8",
  mira: "border-cyan-600/40 bg-cyan-600/8",
  calyx: "border-slate-400/40 bg-slate-400/8",
  lun: "border-stone-400/40 bg-stone-400/8",
  vael: "border-white/30 bg-white/5",
  l4_station: "border-accent-600/40 bg-accent-600/8",
  l5_station: "border-accent-600/40 bg-accent-600/8",
};

export default function VoyageSearchPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Pre-populate from URL params — so planet pages can deep-link
  const [originId, setOriginId] = useState(params.get("originId") ?? "");
  const [destinationId, setDestinationId] = useState(
    params.get("destinationId") ?? "",
  );
  const [departureDate, setDepartureDate] = useState(
    params.get("departureDate") ?? "",
  );
  const [adults, setAdults] = useState(Number(params.get("adults") ?? 1));
  const [children, setChildren] = useState(Number(params.get("children") ?? 0));

  const [step, setStep] = useState<"origin" | "destination" | "details">(() => {
    if (params.get("originId") && params.get("destinationId")) return "details";
    if (params.get("originId")) return "destination";
    return "origin";
  });

  function handleSearch() {
    if (!originId || !destinationId) return;
    const q = new URLSearchParams({
      originId,
      destinationId,
      adults: String(adults),
      children: String(children),
      ...(departureDate ? { departureDate } : {}),
    });
    navigate(`/search?${q}`);
  }

  const originBody = VISITABLE_BODIES.find((b) => b.id === originId);
  const destinationBody = VISITABLE_BODIES.find((b) => b.id === destinationId);

  return (
    <PageTransition>
      <div className="min-h-screen bg-void pt-16">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-radial from-surface-900/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 star-field opacity-30 pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-4 py-16 flex flex-col gap-10">
          {/* Header */}
          <motion.div
            variants={loomUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-white/30" />
              <span className="label">Book a Voyage</span>
            </div>
            <h1 className="font-display text-display-xl text-white">
              {step === "origin" && "Where are you\ndeparting from?"}
              {step === "destination" &&
                `Travelling from\n${originBody?.name}.`}
              {step === "details" && "When & who?"}
            </h1>
            {step === "destination" && (
              <p className="font-sans text-sm text-white/40">
                Now choose your destination.
              </p>
            )}
          </motion.div>

          {/* Progress indicator */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-3"
          >
            {["Origin", "Destination", "Details"].map((label, i) => {
              const stepIndex = { origin: 0, destination: 1, details: 2 }[step];
              const done = i < stepIndex;
              const active = i === stepIndex;
              return (
                <div key={label} className="flex items-center gap-3 flex-1">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-sans font-bold shrink-0 transition-all",
                      done
                        ? "bg-accent-500 border-accent-500 text-white"
                        : active
                          ? "border-accent-400 text-accent-300 bg-transparent"
                          : "border-white/15 text-white/20",
                    )}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span
                    className={cn(
                      "font-sans text-xs transition-colors",
                      active ? "text-white/70" : "text-white/25",
                    )}
                  >
                    {label}
                  </span>
                  {i < 2 && <div className="h-px flex-1 bg-white/8" />}
                </div>
              );
            })}
          </motion.div>

          {/* Step content */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            {/* Origin / destination body grid */}
            {(step === "origin" || step === "destination") && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VISITABLE_BODIES.filter((b) =>
                  step === "destination" ? b.id !== originId : true,
                ).map((body) => {
                  const isSelected =
                    step === "origin"
                      ? body.id === originId
                      : body.id === destinationId;

                  return (
                    <motion.button
                      key={body.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (step === "origin") {
                          setOriginId(body.id);
                          setStep("destination");
                        } else {
                          setDestinationId(body.id);
                          setStep("details");
                        }
                      }}
                      className={cn(
                        "text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-2",
                        isSelected
                          ? cn(
                              "border-2",
                              BODY_ACCENT[body.id] ??
                                "border-accent-500/40 bg-accent-500/8",
                            )
                          : "border-white/8 bg-surface-900/40 hover:border-white/20 hover:bg-surface-800/40",
                      )}
                    >
                      {/* Planet dot */}
                      <div className="w-8 h-8 rounded-full bg-surface-700 border border-white/10 flex items-center justify-center">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            background:
                              {
                                aethon: "#4A90D9",
                                kalos: "#9B7653",
                                thal: "#B45309",
                                mira: "#BAE6FD",
                                calyx: "#BAE6FD",
                                lun: "#78716C",
                                vael: "#E2E8F0",
                                l4_station: "#a78bfa",
                                l5_station: "#a78bfa",
                              }[body.id] ?? "#888",
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-display text-display-sm text-white leading-tight">
                          {body.name}
                        </p>
                        <p className="font-sans text-xs text-white/40 mt-0.5">
                          {body.sub}
                        </p>
                      </div>
                      {body.restricted && (
                        <Badge variant="danger" size="sm">
                          Permit required
                        </Badge>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Back to origin */}
            {step === "destination" && (
              <button
                onClick={() => setStep("origin")}
                className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors self-start"
              >
                ← Change origin
              </button>
            )}

            {/* Details step */}
            {step === "details" && (
              <div className="flex flex-col gap-6">
                {/* Route summary */}
                <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
                  <div className="flex flex-col gap-0.5 flex-1">
                    <span className="label">From</span>
                    <span className="font-display text-display-sm text-white">
                      {originBody?.name}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/25 shrink-0" />
                  <div className="flex flex-col gap-0.5 flex-1 items-end text-right">
                    <span className="label">To</span>
                    <span className="font-display text-display-sm text-white">
                      {destinationBody?.name}
                    </span>
                  </div>
                </div>

                {/* Date */}
                <div className="flex flex-col gap-2">
                  <span className="label">Departure Date (optional)</span>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/8 hover:border-accent-600/40 text-white font-sans text-sm focus:outline-none focus:border-accent-600/40 [color-scheme:dark] transition-colors"
                  />
                  <p className="font-sans text-xs text-white/30">
                    Leave blank to see all upcoming departures
                  </p>
                </div>

                {/* Passengers */}
                <div className="flex flex-col gap-3">
                  <span className="label">Passengers</span>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {
                        label: "Adults",
                        value: adults,
                        min: 1,
                        set: setAdults,
                      },
                      {
                        label: "Children",
                        value: children,
                        min: 0,
                        set: setChildren,
                      },
                    ].map(({ label, value, min, set }) => (
                      <div
                        key={label}
                        className="glass-card rounded-xl p-4 flex items-center justify-between gap-4"
                      >
                        <span className="font-sans text-sm text-white/70">
                          {label}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => set((v) => Math.max(min, v - 1))}
                            className="w-7 h-7 rounded-full bg-surface-700 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-accent-600/40 transition-all"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-display text-display-sm text-white w-4 text-center">
                            {value}
                          </span>
                          <button
                            onClick={() => set((v) => v + 1)}
                            className="w-7 h-7 rounded-full bg-surface-700 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-accent-600/40 transition-all"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Back + Search */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setStep("destination")}
                    className="font-sans text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    ← Change destination
                  </button>
                  <Button
                    size="lg"
                    onClick={handleSearch}
                    disabled={!originId || !destinationId}
                  >
                    Search Voyages
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
