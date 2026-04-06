import { staggerContainer, viewportOnce, staggerItem } from "@/lib/animations";
import { motion } from "framer-motion";
import { Star, Zap, Globe } from "lucide-react";
import { SectionReveal } from "../common";
import { Card } from "../ui";

const LandingPageWhyStellar = () => {
  return (
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
  );
};

export default LandingPageWhyStellar;
