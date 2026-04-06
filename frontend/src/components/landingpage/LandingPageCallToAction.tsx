import { snapLeft, viewportOnce, fadeUp } from "@/lib/animations";
import { motion } from "framer-motion";
import { ArrowRight, Globe } from "lucide-react";
import { AnimatedText } from "../common";
import { Button } from "../ui";
import { NavigateFunction } from "react-router-dom";

interface ILandingPageCallToAction {
  navigate: NavigateFunction;
  scrollToSearch: () => void;
}

const LandingPageCallToAction = ({
  navigate,
  scrollToSearch,
}: ILandingPageCallToAction) => {
  return (
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
  );
};

export default LandingPageCallToAction;
