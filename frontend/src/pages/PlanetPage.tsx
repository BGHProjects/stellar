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
import { getPlanetData } from "@/lib/planetData";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock,
  Globe,
  Shield,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function PlanetPage() {
  const { bodyId } = useParams<{ bodyId: string }>();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  const data = getPlanetData(bodyId ?? "");

  // Parallax on hero
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  if (!data) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-void pt-24 flex flex-col items-center justify-center gap-6">
          <Globe className="w-12 h-12 text-white/15" />
          <div className="text-center">
            <p className="font-display text-display-md text-white mb-2">
              Body not found
            </p>
            <p className="font-sans text-sm text-white/40">
              This destination is not in our records.
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate("/explore")}>
            <ArrowLeft className="w-4 h-4" /> Back to System Map
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div
        className="min-h-screen bg-void"
        style={{ "--planet-glow": data.accentColor } as React.CSSProperties}
      >
        {/* ── HERO ───────────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden"
        >
          {/* Hero image — parallax */}
          <motion.div style={{ y: heroY }} className="absolute inset-0">
            <img
              src={`/images/planet/${data.id}/hero.jpg`}
              alt={data.imageSlots.hero}
              className="w-full h-full"
            />
            {/* Gradient overlay — bottom fade to void */}
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/60 to-transparent" />
            {/* Subtle planet-coloured glow */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(ellipse at 50% 80%, ${data.accentColor.replace("0.35", "0.5")}, transparent 70%)`,
              }}
            />
          </motion.div>

          {/* Hero content */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="relative z-10 w-full max-w-7xl mx-auto px-4 pb-12"
          >
            {/* Breadcrumb */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-2 mb-6 text-white/40"
            >
              <button
                onClick={() => navigate(-1)}
                className="hover:text-white/70 transition-colors font-sans text-sm"
              >
                ← Back
              </button>
              <span>/</span>
              {data.parentName && (
                <>
                  <span className="font-sans text-sm">
                    {data.parentName} System
                  </span>
                  <span>/</span>
                </>
              )}
              <span className="font-sans text-sm text-white/60">
                {data.name}
              </span>
            </motion.div>

            <motion.div
              variants={loomUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="surface">{data.type}</Badge>
                {data.parentName && (
                  <Badge variant="outline">{data.parentName} System</Badge>
                )}
                {data.id === "mira" && (
                  <Badge variant="danger">Access Restricted</Badge>
                )}
              </div>
              <h1 className="font-display text-display-2xl text-white leading-none">
                {data.name}
              </h1>
              <p className="font-sans text-xl text-white/50 max-w-2xl leading-relaxed">
                {data.tagline}
              </p>
            </motion.div>
          </motion.div>
        </section>

        {/* ── QUICK STATS BAR ────────────────────────────────────── */}
        <div className="border-y border-white/5 bg-black/60 backdrop-blur-sm sticky top-16 z-20">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-8 overflow-x-auto scrollbar-none py-4"
            >
              {[
                { label: "Gravity", value: data.gravity },
                { label: "Day Length", value: data.dayLength },
                {
                  label: "Temperature",
                  value: data.temperature.split("(")[0].trim(),
                },
                { label: "Population", value: data.population },
                { label: "Atmosphere", value: data.atmosphere ?? "None" },
                { label: "Spaceports", value: String(data.spaceports.length) },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={staggerItem}
                  className="flex flex-col gap-0.5 shrink-0"
                >
                  <span className="label whitespace-nowrap">{stat.label}</span>
                  <span className="font-sans text-sm text-white whitespace-nowrap">
                    {stat.value}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── MAIN CONTENT ───────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left — main narrative */}
            <div className="lg:col-span-2 flex flex-col gap-16">
              {/* Overview */}
              <section className="flex flex-col gap-6">
                <SectionReveal>
                  <span className="label">Overview</span>
                  <h2 className="font-display text-display-md text-white mt-1">
                    About {data.name}
                  </h2>
                </SectionReveal>

                <motion.p
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  className="font-sans text-base text-white/60 leading-relaxed"
                >
                  {data.description}
                </motion.p>

                {/* Surface image */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                >
                  <img
                    src={`/images/planet/${data.id}/surface.jpg`}
                    alt={data.imageSlots.surface}
                    className="w-full h-full"
                  />
                </motion.div>
              </section>

              {/* Lore / atmosphere */}
              <section className="flex flex-col gap-6">
                <SectionReveal>
                  <span className="label">On the Ground</span>
                  <h2 className="font-display text-display-md text-white mt-1">
                    Life on {data.name}
                  </h2>
                </SectionReveal>

                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  className="relative"
                >
                  {/* Left accent border */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                    style={{
                      background: `linear-gradient(to bottom, ${data.renderColor}, transparent)`,
                    }}
                  />
                  <p className="font-sans text-base text-white/55 leading-relaxed pl-6 italic">
                    {data.lore}
                  </p>
                </motion.div>

                {/* Extra image if available */}
                {data.imageSlots.extra && (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={viewportOnce}
                  >
                    <img
                      src={`/images/planet/${data.id}/extra.jpg`}
                      alt={data.imageSlots.extra}
                      className="w-full h-full"
                    />
                  </motion.div>
                )}
              </section>

              {/* Climate */}
              <section className="flex flex-col gap-6">
                <SectionReveal>
                  <span className="label">Environment</span>
                  <h2 className="font-display text-display-md text-white mt-1">
                    Climate & Conditions
                  </h2>
                </SectionReveal>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    {
                      label: "Climate",
                      value: data.climate,
                      icon: <Globe className="w-4 h-4" />,
                    },
                    {
                      label: "Atmosphere",
                      value:
                        data.atmosphere ?? "None — full EVA required outside",
                      icon: <Shield className="w-4 h-4" />,
                    },
                    {
                      label: "Temperature",
                      value: data.temperature,
                      icon: <Zap className="w-4 h-4" />,
                    },
                    {
                      label: "Day Length",
                      value: data.dayLength,
                      icon: <Clock className="w-4 h-4" />,
                    },
                  ].map((item) => (
                    <motion.div
                      key={item.label}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={viewportOnce}
                    >
                      <Card className="p-5 flex flex-col gap-3 h-full">
                        <div className="flex items-center gap-2 text-white/30">
                          {item.icon}
                          <span className="label">{item.label}</span>
                        </div>
                        <p className="font-sans text-sm text-white/65 leading-relaxed">
                          {item.value}
                        </p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Economy */}
              <section className="flex flex-col gap-6">
                <SectionReveal>
                  <span className="label">Economy</span>
                  <h2 className="font-display text-display-md text-white mt-1">
                    Industries
                  </h2>
                </SectionReveal>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  className="flex flex-wrap gap-2"
                >
                  {data.economy.map((sector) => (
                    <motion.div key={sector} variants={staggerItem}>
                      <Badge
                        variant="surface"
                        size="md"
                        className="font-normal"
                      >
                        {sector}
                      </Badge>
                    </motion.div>
                  ))}
                </motion.div>
              </section>

              {/* Spaceports */}
              <section className="flex flex-col gap-6">
                <SectionReveal>
                  <span className="label">Infrastructure</span>
                  <h2 className="font-display text-display-md text-white mt-1">
                    Spaceports
                  </h2>
                </SectionReveal>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  className="flex flex-col gap-4"
                >
                  {data.spaceports.map((port, i) => (
                    <motion.div key={port.id} variants={staggerItem}>
                      <Card className="overflow-hidden">
                        <img
                          src={`/images/planet/${data.id}/spaceports/${port.id}.jpg`}
                          alt={port.description}
                          className="w-full h-full"
                        />
                        <div className="p-5 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-display text-display-sm text-white">
                              {port.name}
                            </h3>
                            <Badge
                              variant="surface"
                              className="shrink-0 capitalize"
                            >
                              {port.type.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="font-sans text-sm text-white/50 leading-relaxed">
                            {port.description}
                          </p>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </section>
            </div>

            {/* Right sidebar — facts + routes */}
            <div className="flex flex-col gap-8">
              {/* Astrophysical data */}
              <div className="lg:sticky lg:top-32 flex flex-col gap-6">
                <SectionReveal>
                  <span className="label">Astrophysical Data</span>
                </SectionReveal>

                <Card className="p-5 flex flex-col gap-0">
                  {data.facts.map((fact, i) => (
                    <div key={fact.label}>
                      {i > 0 && <Divider className="my-3" />}
                      <div className="flex items-start justify-between gap-4">
                        <span className="label whitespace-nowrap">
                          {fact.label}
                        </span>
                        <span className="font-sans text-sm text-white text-right">
                          {fact.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </Card>

                {/* Scheduled routes */}
                <div className="flex flex-col gap-4">
                  <span className="label">Scheduled Routes</span>
                  <div className="flex flex-col gap-3">
                    {data.routes.map((route) => (
                      <motion.div
                        key={route.routeId}
                        variants={snapLeft}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportOnce}
                      >
                        <Card
                          hover
                          onClick={() => {
                            const params = new URLSearchParams({
                              originId: data.id,
                              destinationId: route.to,
                              adults: "1",
                              children: "0",
                            });
                            navigate(`/search?${params}`);
                          }}
                          className="p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-display text-display-sm text-white">
                                  {data.name}
                                </span>
                                <ArrowRight className="w-3 h-3 text-white/30 shrink-0" />
                                <span className="font-display text-display-sm text-white">
                                  {route.toName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-sans text-xs text-white/40 capitalize">
                                  {route.shipClass}-class
                                </span>
                                <span className="text-white/20 text-xs">·</span>
                                <span className="font-sans text-xs text-white/40">
                                  {route.frequency}
                                </span>
                                {route.scenic && (
                                  <Badge variant="warning" size="sm">
                                    Scenic
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Book CTA */}
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                >
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      const params = new URLSearchParams({
                        destinationId: data.id,
                        adults: "1",
                        children: "0",
                      });
                      navigate(`/search?${params}`);
                    }}
                  >
                    Book a Voyage to {data.name}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER NAVIGATION ───────────────────────────────────── */}
        <div className="border-t border-white/5 py-12 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <Button variant="ghost" onClick={() => navigate("/explore")}>
              <Globe className="w-4 h-4" />
              Explore System Map
            </Button>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
