import {
  ImagePlaceholder,
  PageTransition,
  SectionReveal,
} from "@/components/common";
import { Badge, Button, Card, Divider } from "@/components/ui";
import {
  fadeIn,
  fadeUp,
  loomUp,
  snapLeft,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/lib/animations";
import {
  getAllShipClasses,
  getShipClassData,
  type ShipClassData,
} from "@/lib/fleetData";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight, Check, X as XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const SHIP_CLASSES = getAllShipClasses();

// Which cabin classes each ship supports — for comparison table
const ALL_CABIN_CLASSES = [
  "Drift Class",
  "Orbit Class",
  "Apex Class",
  "Helix Class",
];
const ALL_ROUTE_TYPES = [
  "Direct Transfer",
  "Gravity Assist",
  "Multi-Stop",
  "Scenic",
];

export default function FleetPage() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string>(SHIP_CLASSES[0].id);
  const [comparing, setComparing] = useState(false);

  const activeShip = getShipClassData(activeId)!;

  return (
    <PageTransition>
      <div className="min-h-screen bg-void pt-16">
        {/* ── PAGE HEADER ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden border-b border-white/5">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-radial from-surface-800/20 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 star-field opacity-30 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 py-20 flex flex-col gap-4">
            <motion.div variants={fadeIn} initial="hidden" animate="visible">
              <span className="label">The Fleet</span>
            </motion.div>
            <motion.h1
              variants={loomUp}
              initial="hidden"
              animate="visible"
              className="font-display text-display-2xl text-white"
            >
              Ships of the
              <br />
              <span className="text-gradient">Solara Network</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.3 }}
              className="font-sans text-lg text-white/40 max-w-xl"
            >
              Four vessel classes. Dozens of active ships. Every route in the
              system covered.
            </motion.p>
          </div>
        </div>

        {/* ── SHIP CLASS SELECTOR TABS ─────────────────────────────── */}
        <div className="border-b border-white/5 bg-black/60 backdrop-blur-md sticky top-16 z-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-3">
              {SHIP_CLASSES.map((ship) => (
                <button
                  key={ship.id}
                  onClick={() => setActiveId(ship.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-sans text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0",
                    activeId === ship.id
                      ? "bg-white text-black"
                      : "text-white/40 hover:text-white/70 hover:bg-white/5",
                  )}
                >
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      activeId === ship.id ? "bg-black" : "bg-white/20",
                    )}
                  />
                  {ship.name}
                  <span
                    className={cn(
                      "text-xs rounded-full px-1.5 py-0.5 font-bold",
                      activeId === ship.id
                        ? "bg-black/15 text-black"
                        : "bg-white/8 text-white/30",
                    )}
                  >
                    {ship.inService}
                  </span>
                </button>
              ))}

              <div className="ml-auto shrink-0 pl-4">
                <Button
                  variant={comparing ? "accent" : "secondary"}
                  size="sm"
                  onClick={() => setComparing((c) => !c)}
                >
                  {comparing ? "Hide" : "Compare"} Classes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── COMPARISON TABLE ────────────────────────────────────── */}
        <AnimatePresence>
          {comparing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden border-b border-white/5 bg-surface-950/60"
            >
              <div className="max-w-7xl mx-auto px-4 py-8">
                <span className="label mb-6 block">Class Comparison</span>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left pb-4 pr-8 font-sans text-xs text-white/30 uppercase tracking-widest font-bold w-40">
                          Spec
                        </th>
                        {SHIP_CLASSES.map((ship) => (
                          <th key={ship.id} className="text-center pb-4 px-4">
                            <button
                              onClick={() => {
                                setActiveId(ship.id);
                                setComparing(false);
                              }}
                              className={cn(
                                "font-display text-display-sm transition-colors",
                                activeId === ship.id
                                  ? "text-white"
                                  : "text-white/40 hover:text-white/70",
                              )}
                            >
                              {ship.name}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[
                        { label: "Speed", key: "cruiseSpeed" as const },
                        { label: "Passengers", key: "maxPassengers" as const },
                        { label: "Length", key: "length" as const },
                        { label: "In Service", key: "inService" as const },
                        { label: "Introduced", key: "introduced" as const },
                      ].map((row) => (
                        <tr key={row.label}>
                          <td className="py-3 pr-8 font-sans text-xs text-white/30 uppercase tracking-widest font-bold">
                            {row.label}
                          </td>
                          {SHIP_CLASSES.map((ship) => (
                            <td
                              key={ship.id}
                              className="py-3 px-4 text-center font-sans text-sm text-white/70"
                            >
                              {String(ship[row.key])}
                            </td>
                          ))}
                        </tr>
                      ))}

                      {/* Cabin classes */}
                      <tr>
                        <td className="py-3 pr-8 font-sans text-xs text-white/30 uppercase tracking-widest font-bold">
                          Cabins
                        </td>
                        {SHIP_CLASSES.map((ship) => (
                          <td key={ship.id} className="py-3 px-4">
                            <div className="flex flex-col items-center gap-1">
                              {ALL_CABIN_CLASSES.map((cabin) => (
                                <div
                                  key={cabin}
                                  className={cn(
                                    "flex items-center gap-1 font-sans text-xs",
                                    ship.cabinClasses.includes(cabin)
                                      ? "text-white/60"
                                      : "text-white/15",
                                  )}
                                >
                                  {ship.cabinClasses.includes(cabin) ? (
                                    <Check className="w-3 h-3 text-success shrink-0" />
                                  ) : (
                                    <XIcon className="w-3 h-3 shrink-0" />
                                  )}
                                  {cabin.replace(" Class", "")}
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Route types */}
                      <tr>
                        <td className="py-3 pr-8 font-sans text-xs text-white/30 uppercase tracking-widest font-bold">
                          Routes
                        </td>
                        {SHIP_CLASSES.map((ship) => (
                          <td key={ship.id} className="py-3 px-4">
                            <div className="flex flex-col items-center gap-1">
                              {ALL_ROUTE_TYPES.map((rt) => (
                                <div
                                  key={rt}
                                  className={cn(
                                    "flex items-center gap-1 font-sans text-xs",
                                    ship.routeTypes.includes(rt)
                                      ? "text-white/60"
                                      : "text-white/15",
                                  )}
                                >
                                  {ship.routeTypes.includes(rt) ? (
                                    <Check className="w-3 h-3 text-success shrink-0" />
                                  ) : (
                                    <XIcon className="w-3 h-3 shrink-0" />
                                  )}
                                  {rt}
                                </div>
                              ))}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Cryo / Spacewalk */}
                      {[
                        { label: "Cryostasis", key: "hasCryo" as const },
                        {
                          label: "Spacewalk",
                          key: "spacewalkCapable" as const,
                        },
                      ].map((row) => (
                        <tr key={row.label}>
                          <td className="py-3 pr-8 font-sans text-xs text-white/30 uppercase tracking-widest font-bold">
                            {row.label}
                          </td>
                          {SHIP_CLASSES.map((ship) => (
                            <td key={ship.id} className="py-3 px-4 text-center">
                              {ship[row.key] ? (
                                <Check className="w-4 h-4 text-success mx-auto" />
                              ) : (
                                <XIcon className="w-4 h-4 text-white/15 mx-auto" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ACTIVE SHIP DETAIL ──────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <ShipDetail
              ship={activeShip}
              onSearchClick={() => navigate("/book")}
            />
          </motion.div>
        </AnimatePresence>

        {/* ── ALL CLASSES GRID ────────────────────────────────────── */}
        <section className="border-t border-white/5 py-24 px-4">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <SectionReveal>
              <span className="label">All Classes</span>
              <h2 className="font-display text-display-lg text-white mt-1">
                The Full Fleet
              </h2>
            </SectionReveal>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {SHIP_CLASSES.map((ship) => (
                <motion.div key={ship.id} variants={staggerItem}>
                  <Card
                    hover
                    onClick={() => {
                      setActiveId(ship.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex flex-col overflow-hidden h-full"
                  >
                    <img
                      src={`/images/fleet/${ship.id}/hero.jpg`}
                      alt={ship.imageSlots.hero}
                      className="w-full h-full"
                    />
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <div>
                        <p className="label mb-1">{ship.nickname}</p>
                        <h3 className="font-display text-display-sm text-white">
                          {ship.name}
                        </h3>
                      </div>
                      <p className="font-sans text-xs text-white/40 leading-relaxed flex-1">
                        {ship.tagline}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/6">
                        <span className="font-sans text-xs text-white/30">
                          {ship.inService} in service
                        </span>
                        <span className="font-sans text-xs text-white/50">
                          {ship.cruiseSpeed}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

// ─────────────────────────────────────────────────────────────────
// ShipDetail — full profile for the selected class
// ─────────────────────────────────────────────────────────────────

function ShipDetail({
  ship,
  onSearchClick,
}: {
  ship: ShipClassData;
  onSearchClick: () => void;
}) {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <div>
      {/* Hero image */}
      <div
        ref={heroRef}
        className="relative h-[55vh] min-h-[400px] overflow-hidden"
      >
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img
            src={`/images/fleet/${ship.id}/hero.jpg`}
            alt={ship.imageSlots.hero}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
          {/* Subtle class-coloured glow */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${ship.accentColor.replace("0.2", "0.6").replace("0.25", "0.6")}, transparent 60%)`,
            }}
          />
        </motion.div>

        {/* Hero text */}
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="surface" size="md">
                {ship.nickname}
              </Badge>
              <Badge variant="surface" size="md">
                {ship.inService} active vessels
              </Badge>
              {ship.hasCryo && (
                <Badge variant="accent" size="md">
                  Cryo capable
                </Badge>
              )}
              {ship.spacewalkCapable && (
                <Badge variant="outline" size="md">
                  Spacewalk
                </Badge>
              )}
            </div>
            <h2 className="font-display text-display-xl text-white">
              {ship.name}
            </h2>
            <p className="font-sans text-lg text-white/50 italic">
              {ship.tagline}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left — narrative content */}
          <div className="lg:col-span-2 flex flex-col gap-14">
            {/* Description + lore */}
            <section className="flex flex-col gap-6">
              <SectionReveal>
                <span className="label">Overview</span>
                <h3 className="font-display text-display-md text-white mt-1">
                  About the {ship.name}
                </h3>
              </SectionReveal>

              <motion.p
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className="font-sans text-base text-white/60 leading-relaxed"
              >
                {ship.description}
              </motion.p>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className="relative"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-gradient-to-b from-white/20 to-transparent" />
                <p className="font-sans text-base text-white/50 leading-relaxed pl-6 italic">
                  {ship.lore}
                </p>
              </motion.div>
            </section>

            {/* Interior images — two up */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="grid sm:grid-cols-2 gap-4"
            >
              <motion.div variants={staggerItem}>
                <img
                  src={`/images/fleet/${ship.id}/interior.jpg`}
                  alt={ship.imageSlots.interior}
                  className="w-full h-full rounded-2xl border border-white/25"
                />
              </motion.div>
              <motion.div variants={staggerItem}>
                <img
                  src={`/images/fleet/${ship.id}/detail.jpg`}
                  alt={ship.imageSlots.detail}
                  className="w-full h-full rounded-2xl border border-white/25"
                />
              </motion.div>
            </motion.div>

            {/* Notable features */}
            <section className="flex flex-col gap-6">
              <SectionReveal>
                <span className="label">Capabilities</span>
                <h3 className="font-display text-display-md text-white mt-1">
                  Notable Features
                </h3>
              </SectionReveal>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className="grid sm:grid-cols-2 gap-3"
              >
                {ship.notableFeatures.map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={staggerItem}
                    className="flex items-start gap-3 p-4 glass-card rounded-xl"
                  >
                    <div className="w-5 h-5 rounded-full bg-success/15 border border-success/25 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="font-sans text-sm text-white/65 leading-relaxed">
                      {feature}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* Cabin classes */}
            <section className="flex flex-col gap-6">
              <SectionReveal>
                <span className="label">Accommodation</span>
                <h3 className="font-display text-display-md text-white mt-1">
                  Available Cabin Classes
                </h3>
              </SectionReveal>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewportOnce}
                className="grid sm:grid-cols-2 gap-4"
              >
                {ALL_CABIN_CLASSES.map((cabin) => {
                  const available = ship.cabinClasses.includes(cabin);
                  return (
                    <motion.div key={cabin} variants={staggerItem}>
                      <div
                        className={cn(
                          "glass-card rounded-xl p-4 border transition-all",
                          available
                            ? "border-white/8"
                            : "border-white/3 opacity-35",
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-display text-display-sm text-white">
                            {cabin}
                          </span>
                          {available ? (
                            <Check className="w-4 h-4 text-success" />
                          ) : (
                            <XIcon className="w-4 h-4 text-white/20" />
                          )}
                        </div>
                        <p className="font-sans text-xs text-white/35">
                          {cabin === "Drift Class" &&
                            "Shared quarters. Communal amenities."}
                          {cabin === "Orbit Class" &&
                            "Private cabin with viewport screen."}
                          {cabin === "Apex Class" &&
                            "Premium suite with real hull viewport."}
                          {cabin === "Helix Class" &&
                            "Full suite with observation bubble."}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </section>
          </div>

          {/* Right sidebar — specs + routes */}
          <div className="flex flex-col gap-8">
            <div className="lg:sticky lg:top-32 flex flex-col gap-6">
              {/* Technical specifications */}
              <SectionReveal>
                <span className="label">Specifications</span>
              </SectionReveal>

              <Card className="p-5 flex flex-col gap-0">
                {[
                  { label: "Manufacturer", value: ship.manufacturer },
                  { label: "Introduced", value: ship.introduced },
                  { label: "In Service", value: String(ship.inService) },
                  { label: "Length", value: ship.length },
                  { label: "Beam", value: ship.beam },
                  { label: "Mass", value: ship.mass },
                  { label: "Passengers", value: String(ship.maxPassengers) },
                  { label: "Crew", value: ship.crewComplement },
                  { label: "Cruise Speed", value: ship.cruiseSpeed },
                  { label: "Propulsion", value: ship.propulsion },
                  {
                    label: "Cryo Decks",
                    value: ship.hasCryo ? String(ship.cryoDecks) : "None",
                  },
                ].map((spec, i) => (
                  <div key={spec.label}>
                    {i > 0 && <Divider className="my-3" />}
                    <div className="flex items-start justify-between gap-4">
                      <span className="label whitespace-nowrap">
                        {spec.label}
                      </span>
                      <span className="font-sans text-xs text-white text-right leading-relaxed">
                        {spec.value}
                      </span>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Typical routes */}
              <div className="flex flex-col gap-4">
                <span className="label">Typical Routes</span>
                <div className="flex flex-col gap-2">
                  {ship.typicalRoutes.map((route, i) => (
                    <motion.div
                      key={i}
                      variants={snapLeft}
                      initial="hidden"
                      whileInView="visible"
                      viewport={viewportOnce}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-2 px-3 py-2 glass-card rounded-xl border border-white/5"
                    >
                      <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
                      <span className="font-sans text-xs text-white/55">
                        {route}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Route types */}
              <div className="flex flex-col gap-3">
                <span className="label">Available Route Types</span>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROUTE_TYPES.map((rt) => (
                    <Badge
                      key={rt}
                      variant={
                        ship.routeTypes.includes(rt) ? "surface" : "outline"
                      }
                      className={cn(
                        !ship.routeTypes.includes(rt) && "opacity-25",
                      )}
                    >
                      {rt}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Button size="lg" className="w-full" onClick={onSearchClick}>
                Search {ship.name} Voyages
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
