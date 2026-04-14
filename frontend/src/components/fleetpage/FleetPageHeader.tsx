import { fadeIn, loomUp, fadeUp } from "@/lib/animations";
import { motion } from "framer-motion";

const FleetPageHeader = () => {
  return (
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
          <span className="text-gradient">Taunor Network</span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="font-sans text-lg text-white/40 max-w-xl"
        >
          Four vessel classes. Dozens of active ships. Every route in the system
          covered.
        </motion.p>
      </div>
    </div>
  );
};

export default FleetPageHeader;
