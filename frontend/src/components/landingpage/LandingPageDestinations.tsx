import { fadeUp, viewportOnce } from "@/lib/animations";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { SectionReveal } from "../common";
import { Card, Button, Badge } from "../ui";
import { NavigateFunction } from "react-router-dom";

interface ILandingPageDestinations {
  navigate: NavigateFunction;
}

const LandingPageDestinations = ({ navigate }: ILandingPageDestinations) => {
  return (
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
  );
};

export default LandingPageDestinations;
