import { ALL_CABIN_CLASSES, ALL_ROUTE_TYPES } from "@/constants/fleetPage";
import {
  fadeIn,
  fadeUp,
  snapLeft,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/lib/animations";
import { ShipClassData } from "@/lib/fleetData";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check, XIcon } from "lucide-react";
import { useRef } from "react";
import { SectionReveal } from "../common";
import { Badge, Button, Card, Divider } from "../ui";

interface IFleetPageShipDetail {
  ship: ShipClassData;
  onSearchClick: () => void;
}

const FleetPageShipDetail = ({ ship, onSearchClick }: IFleetPageShipDetail) => {
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
};

export default FleetPageShipDetail;
