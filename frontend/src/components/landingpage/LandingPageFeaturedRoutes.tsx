import { staggerContainer, viewportOnce, staggerItem } from "@/lib/animations";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SectionReveal } from "../common";
import { Card, Badge } from "../ui";
import { NavigateFunction } from "react-router-dom";
import { FEATURED_ROUTES } from "@/constants/landingPage";

interface ILandingPageFeaturedRoutes {
  navigate: NavigateFunction;
}

const LandingPageFeaturedRoutes = ({
  navigate,
}: ILandingPageFeaturedRoutes) => {
  return (
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
  );
};

export default LandingPageFeaturedRoutes;
