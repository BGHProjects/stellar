import LandingPageCallToAction from "@/components/landingpage/LandingPageCallToAction";
import LandingPageDestinations from "@/components/landingpage/LandingPageDestinations";
import LandingPageFeaturedRoutes from "@/components/landingpage/LandingPageFeaturedRoutes";
import LandingPageFooter from "@/components/landingpage/LandingPageFooter";
import LandingPageStats from "@/components/landingpage/LandingPageStats";
import LandingPageWhyStellar from "@/components/landingpage/LandingPageWhyStellar";
import { Button } from "@/components/ui";
import { VISITABLE_BODIES } from "@/constants/landingPage";
import { fadeIn, heroFadeUp, heroLoom } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Globe } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface SearchState {
  originId: string;
  destinationId: string;
  departureDate: string;
  adults: number;
  children: number;
}

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

  const handleSearch = (e: React.FormEvent) => {
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
  };

  // Scroll to the search form at the top of the page
  const scrollToSearch = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => searchRef.current?.querySelector("select")?.focus(), 600);
  };

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
          {/* Main headline — heroLoom: slow, cinematic, arrives from deep */}
          <motion.div
            variants={heroLoom}
            initial="hidden"
            animate="visible"
            className="mb-12"
          >
            <h1 className="font-display text-display-2xl md:text-[6.5rem] lg:text-[8rem] text-white leading-[0.95] tracking-tight text-balance">
              STELLAR
            </h1>
          </motion.div>

          {/* Search / explore toggle */}
          <motion.div
            variants={heroFadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.85 }}
            className="flex flex-col items-center gap-6 w-fit  mt-12"
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
                    className="w-36 px-4 py-3 rounded-xl bg-surface-900 border border-white/8 text-white font-sans text-sm focus:outline-none focus:border-accent-600/40 cursor-pointer"
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
                    className="w-36 px-4 py-3 rounded-xl bg-surface-900 border border-white/8 text-white font-sans text-sm focus:outline-none focus:border-accent-600/40 cursor-pointer"
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
                    className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/8 text-white font-sans text-sm focus:outline-none focus:border-accent-600/40 [color-scheme:dark] cursor-pointer"
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
                    className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/8 text-white font-sans text-sm focus:outline-none focus:border-accent-600/40 cursor-pointer"
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

      <LandingPageStats />

      <LandingPageFeaturedRoutes navigate={navigate} />

      <LandingPageDestinations navigate={navigate} />

      <LandingPageWhyStellar />

      <LandingPageCallToAction
        navigate={navigate}
        scrollToSearch={scrollToSearch}
      />

      <LandingPageFooter />
    </div>
  );
}
