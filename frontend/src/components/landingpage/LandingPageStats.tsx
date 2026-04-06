import { STATS } from "@/constants/landingPage";
import { staggerContainer, viewportOnce, staggerItem } from "@/lib/animations";
import { motion } from "framer-motion";

const LandingPageStats = () => {
  return (
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
  );
};

export default LandingPageStats;
