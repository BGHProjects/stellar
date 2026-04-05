import { AnimatedText, SectionReveal } from "@/components/common";
import { Badge, Button, Card } from "@/components/ui";
import {
  fadeIn,
  fadeUp,
  heroFadeUp,
  heroLoom,
  heroSubtitle,
  snapLeft,
  staggerContainer,
  staggerItem,
  viewportOnce,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Globe, Star, Zap } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface SearchState {
  originId: string;
  destinationId: string;
  departureDate: string;
  adults: number;
  children: number;
}

const VISITABLE_BODIES = [
  { id: "aethon", label: "Aethon", sub: "Inner System" },
  { id: "kalos", label: "Kalos", sub: "Vareth System" },
  { id: "thal", label: "Thal", sub: "Vareth System" },
  { id: "mira", label: "Mira", sub: "Vareth System — Restricted" },
  { id: "calyx", label: "Calyx", sub: "Outer System" },
  { id: "lun", label: "Lun", sub: "Calyx System" },
  { id: "vael", label: "Vael", sub: "Calyx System" },
];

const FEATURED_ROUTES = [
  {
    id: "aethon_kalos",
    from: "Aethon",
    to: "Kalos",
    originId: "aethon",
    destinationId: "kalos",
    duration: "40–88 days",
    fromPrice: "₢1,200",
    tag: "Most Popular",
    tagVariant: "accent" as const,
    description:
      "The commercial backbone of the system. Direct and Gravity Assist routes available.",
  },
  {
    id: "aethon_calyx",
    from: "Aethon",
    to: "Calyx",
    originId: "aethon",
    destinationId: "calyx",
    duration: "87–192 days",
    fromPrice: "₢3,200",
    tag: "Deep Voyage",
    tagVariant: "surface" as const,
    description:
      "The longest and most significant passenger route. Solaris-class only.",
  },
  {
    id: "aethon_vareth_scenic",
    from: "Aethon",
    to: "Kalos via Vareth",
    originId: "aethon",
    destinationId: "kalos",
    duration: "52–120 days",
    fromPrice: "₢3,500",
    tag: "Scenic",
    tagVariant: "warning" as const,
    description:
      "Passes through the Scatter and approaches Vareth's storm system. Lunara-class.",
  },
];

const STATS = [
  { value: "16", label: "Scheduled Routes" },
  { value: "10", label: "Destinations" },
  { value: "4", label: "Ship Classes" },
  { value: "2", label: "Star System" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<"search" | "explore">("search");
  const [search, setSearch] = useState<SearchState>({
    originId: "",
    destinationId: "",
    departureDate: "",
    adults: 1,
    children: 0,
  });

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.originId || !search.destinationId) return;
    const params = new URLSearchParams({
      originId: search.originId,
      destinationId: search.destinationId,
      adults: String(search.adults),
      children: String(search.children),
      ...(search.departureDate ? { departureDate: search.departureDate } : {}),
    });
    navigate(`/search?${params}`);
  }

  // Scroll to the search form at the top of the page
  function scrollToSearch() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => searchRef.current?.querySelector("select")?.focus(), 600);
  }

  return (
    <div className="min-h-screen bg-void">
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Background */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-radial from-surface-800/40 via-surface-950/20 to-void" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-accent-600/6 blur-[140px]" />
          <div className="absolute inset-0 star-field opacity-50" />
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-5xl mx-auto pt-24 pb-16">
          {/* Badge — fades in first, quietly */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <Badge
              variant="surface"
              size="md"
              className="mb-10 tracking-widest"
            >
              ✦ The Solara System
            </Badge>
          </motion.div>

          {/* Main headline — heroLoom: slow, cinematic, arrives from deep */}
          <motion.div
            variants={heroLoom}
            initial="hidden"
            animate="visible"
            className="mb-6"
          >
            <h1 className="font-display text-display-2xl md:text-[6.5rem] lg:text-[8rem] text-white leading-[0.95] tracking-tight text-balance text-gradient">
              STELLAR
            </h1>
          </motion.div>

          {/* Subtitle — rises after headline */}
          <motion.p
            variants={heroSubtitle}
            initial="hidden"
            animate="visible"
            className="font-sans text-lg md:text-xl text-white/45 max-w-xl leading-relaxed mb-14"
          >
            Book interplanetary voyages across the Solara system. From the inner
            worlds to the frozen outer reaches.
          </motion.p>

          {/* Search / explore toggle */}
          <motion.div
            variants={heroFadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.85 }}
            className="flex flex-col items-center gap-6 w-full max-w-2xl"
          >
            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-surface-900/80 border border-white/8 rounded-2xl p-1 backdrop-blur-sm">
              <button
                onClick={() => setMode("search")}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-sans text-sm font-bold transition-all duration-300",
                  mode === "search"
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                Quick Search
              </button>
              <button
                onClick={() => setMode("explore")}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-sans text-sm font-bold transition-all duration-300",
                  mode === "explore"
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white/70",
                )}
              >
                Explore System
              </button>
            </div>

            {/* Quick Search form */}
            {mode === "search" && (
              <motion.form
                ref={searchRef as any}
                key="search-form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                onSubmit={handleSearch}
                className="w-full glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-end"
              >
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="label px-1">From</label>
                  <select
                    value={search.originId}
                    onChange={(e) =>
                      setSearch((s) => ({ ...s, originId: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/8 text-white font-sans text-sm focus:outline-none focus:border-accent-600/40"
                  >
                    <option value="" disabled className="bg-surface-900">
                      Origin
                    </option>
                    {VISITABLE_BODIES.map((b) => (
                      <option
                        key={b.id}
                        value={b.id}
                        className="bg-surface-900"
                      >
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end pb-3 shrink-0 text-white/20">
                  →
                </div>

                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="label px-1">To</label>
                  <select
                    value={search.destinationId}
                    onChange={(e) =>
                      setSearch((s) => ({
                        ...s,
                        destinationId: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/8 text-white font-sans text-sm focus:outline-none focus:border-accent-600/40"
                  >
                    <option value="" disabled className="bg-surface-900">
                      Destination
                    </option>
                    {VISITABLE_BODIES.filter(
                      (b) => b.id !== search.originId,
                    ).map((b) => (
                      <option
                        key={b.id}
                        value={b.id}
                        className="bg-surface-900"
                      >
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="label px-1">Departs</label>
                  <input
                    type="date"
                    value={search.departureDate}
                    onChange={(e) =>
                      setSearch((s) => ({
                        ...s,
                        departureDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/8 text-white font-sans text-sm focus:outline-none focus:border-accent-600/40 [color-scheme:dark]"
                  />
                </div>

                <div className="flex flex-col gap-1.5 w-24">
                  <label className="label px-1">Adults</label>
                  <input
                    type="number"
                    min={1}
                    max={9}
                    value={search.adults}
                    onChange={(e) =>
                      setSearch((s) => ({
                        ...s,
                        adults: Number(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/8 text-white font-sans text-sm focus:outline-none focus:border-accent-600/40"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="shrink-0 md:self-end"
                >
                  Search <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.form>
            )}

            {/* Explore mode */}
            {mode === "explore" && (
              <motion.div
                key="explore-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="w-full flex flex-col items-center gap-4"
              >
                <p className="font-sans text-sm text-white/40 text-center max-w-md">
                  Navigate the Solara system in real time. Click any planet to
                  see routes, distances, and available voyages.
                </p>
                <div className="flex gap-3">
                  <Button size="lg" onClick={() => navigate("/explore")}>
                    <Globe className="w-4 h-4" />
                    Open Star Map
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setMode("search")}
                  >
                    Quick Search instead
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 1.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20"
        >
          <span className="label">Scroll to discover</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                variants={staggerItem}
                className="flex flex-col items-center gap-1"
              >
                <span className="font-display text-display-lg text-white">
                  {stat.value}
                </span>
                <span className="label">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED ROUTES ──────────────────────────────────────── */}
      <section className="py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionReveal className="mb-16">
            <div className="flex flex-col gap-3">
              <span className="label">Departures</span>
              <h2 className="font-display text-display-lg text-white">
                Featured Routes
              </h2>
              <p className="font-sans text-white/40 max-w-lg">
                Scheduled voyages across the system, priced by orbital window.
              </p>
            </div>
          </SectionReveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid md:grid-cols-3 gap-6"
          >
            {FEATURED_ROUTES.map((route) => (
              <motion.div key={route.id} variants={staggerItem}>
                <Card
                  hover
                  onClick={() =>
                    navigate(
                      `/search?originId=${route.originId}&destinationId=${route.destinationId}&adults=1&children=0`,
                    )
                  }
                  className="flex flex-col gap-5 p-6 h-full"
                >
                  {/* Route header */}
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant={route.tagVariant}>{route.tag}</Badge>
                    <span className="font-sans text-xs text-white/30">
                      {route.duration}
                    </span>
                  </div>

                  {/* Origin → Destination */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="label">{route.from}</span>
                      <span className="font-display text-display-sm text-white">
                        {route.from}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/20 shrink-0 mx-1" />
                    <div className="flex flex-col gap-0.5">
                      <span className="label">Destination</span>
                      <span className="font-display text-display-sm text-white">
                        {route.to}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="font-sans text-sm text-white/45 leading-relaxed flex-1">
                    {route.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/6">
                    <span className="label">From</span>
                    <span className="font-display text-display-sm text-white">
                      {route.fromPrice}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── DESTINATIONS ─────────────────────────────────────────── */}
      <section className="py-32 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <SectionReveal className="mb-16">
            <div className="flex flex-col gap-3">
              <span className="label">The System</span>
              <h2 className="font-display text-display-lg text-white">
                Where Will You Go?
              </h2>
            </div>
          </SectionReveal>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              className="md:col-span-2"
            >
              <Card
                hover
                onClick={() => navigate("/planet/aethon")}
                className="flex flex-col gap-0 h-full overflow-hidden"
              >
                <img
                  src={`/images/planet/aethon/hero.jpg`}
                  alt="Aethon — super-Earth city panorama"
                  className="w-full h-full"
                />
                <div className="p-6 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="label">Inner System</span>
                      <h3 className="font-display text-display-md text-white mt-1">
                        Aethon
                      </h3>
                    </div>
                    <Badge variant="accent">6 Spaceports</Badge>
                  </div>
                  <p className="font-sans text-sm text-white/50">
                    The political and commercial heart of the Solara system. The
                    most advanced world, the busiest spaceport network.
                  </p>
                </div>
              </Card>
            </motion.div>

            <div className="flex flex-col gap-4">
              {[
                {
                  id: "kalos",
                  name: "Kalos",
                  sub: "Vareth System",
                  desc: "Industrial frontier. Deep mining operations and the largest refinery complex.",
                },
                {
                  id: "calyx",
                  name: "Calyx",
                  sub: "Outer System",
                  desc: "Ice world beyond the Scatter. Mineral-rich, harsh, deeply fascinating.",
                },
              ].map((body, i) => (
                <motion.div
                  key={body.id}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  transition={{ delay: i * 0.1 }}
                  className="flex-1"
                >
                  <Card
                    hover
                    onClick={() => navigate(`/planet/${body.id}`)}
                    className="flex flex-col overflow-hidden h-full"
                  >
                    <img
                      src={`/images/planet/${body.id}/hero.jpg`}
                      alt={body.desc}
                      className="w-full h-full"
                    />
                    <div className="p-4 flex flex-col gap-2">
                      <span className="label">{body.sub}</span>
                      <h3 className="font-display text-display-sm text-white">
                        {body.name}
                      </h3>
                      <p className="font-sans text-xs text-white/40 leading-relaxed">
                        {body.desc}
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="mt-8 flex justify-center"
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/explore")}
            >
              <Globe className="w-4 h-4" />
              Explore all destinations
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── WHY STELLAR ──────────────────────────────────────────── */}
      <section className="py-32 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <SectionReveal className="mb-20 text-center">
            <h2 className="font-display text-display-lg text-white mb-4">
              Not Just a Ticket.
              <br />
              <span className="text-gradient">A Voyage.</span>
            </h2>
            <p className="font-sans text-white/40 max-w-lg mx-auto">
              Interplanetary travel takes weeks, months. We treat the journey as
              the destination.
            </p>
          </SectionReveal>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: <Star className="w-5 h-5" />,
                title: "Orbital Intelligence",
                body: "Prices and durations change with planetary positions. A 5-star orbital window means the planets are close — shorter journey, lower fare.",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: "Cryostasis Options",
                body: "Sleep through the void or live every day of it. Choose between Conscious Voyage, Full Cryo, or timed Cryo Intervals.",
              },
              {
                icon: <Globe className="w-5 h-5" />,
                title: "Every Route Type",
                body: "Direct Transfer, Gravity Assist, Multi-Stop, or Scenic. Different ships, different timelines, different prices.",
              },
            ].map((feature) => (
              <motion.div key={feature.title} variants={staggerItem}>
                <Card className="p-6 flex flex-col gap-4 h-full">
                  <div className="w-10 h-10 rounded-xl bg-surface-700 border border-white/8 flex items-center justify-center text-accent-300">
                    {feature.icon}
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-display text-display-sm text-white">
                      {feature.title}
                    </h3>
                    <p className="font-sans text-sm text-white/50 leading-relaxed">
                      {feature.body}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-40 px-4 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-accent-600/8 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10 flex flex-col items-center gap-8">
          <AnimatedText
            text="Your voyage begins here."
            variant="loom"
            as="h2"
            className="font-display text-display-xl text-white"
          />
          <motion.p
            variants={snapLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="font-sans text-lg text-white/40"
          >
            Choose your destination. Configure your journey. Depart when the
            window opens.
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="flex flex-col sm:flex-row gap-3"
          >
            {/* Scroll back to the search form at the top instead of navigating to /search with no params */}
            <Button size="lg" onClick={scrollToSearch}>
              Search Voyages
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate("/explore")}
            >
              <Globe className="w-4 h-4" />
              Explore the System
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-300 to-accent-600 flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="font-display text-sm text-white">Stellar</span>
          </div>
          <p className="font-sans text-xs text-white/20 text-center">
            Interplanetary voyage booking for the Solara system. All journeys
            subject to orbital window availability.
          </p>
          {/* Fixed footer links — now actually navigate */}
          <div className="flex gap-6">
            <Link
              to="/search?adults=1&children=0"
              className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Routes
            </Link>
            <Link
              to="/fleet"
              className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Fleet
            </Link>
            <Link
              to="/explore"
              className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              System
            </Link>
            <Link
              to="/profile"
              className="font-sans text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
