import { SHIP_CLASSES } from "@/constants/fleetPage";
import { staggerContainer, viewportOnce, staggerItem } from "@/lib/animations";
import { motion } from "framer-motion";
import { SectionReveal } from "../common";
import { Card } from "../ui";

interface IFleetPageAllClassesGrid {
  setActiveId: React.Dispatch<React.SetStateAction<string>>;
}

const FleetPageAllClassesGrid = ({ setActiveId }: IFleetPageAllClassesGrid) => {
  return (
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
  );
};

export default FleetPageAllClassesGrid;
