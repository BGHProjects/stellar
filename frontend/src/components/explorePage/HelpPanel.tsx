import { motion } from "framer-motion";
import { X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Instructions panel — togglable help overlay
// ─────────────────────────────────────────────────────────────────

const HelpPanel = ({ onClose }: { onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-14 right-4 z-30 w-72 glass-card rounded-2xl border border-white/10 p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-display-sm text-white">
          How to use the Star Map
        </span>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {[
          {
            icon: "🖱️",
            label: "Click any body",
            desc: "Select it and see details",
          },
          { icon: "🔄", label: "Click + drag", desc: "Rotate the system view" },
          { icon: "🔍", label: "Scroll / pinch", desc: "Zoom in and out" },
          {
            icon: "✋",
            label: "Right-drag / two-finger",
            desc: "Pan around the system",
          },
          { icon: "🟣", label: "Indigo ring", desc: "Hovering over a body" },
          { icon: "✦", label: "Pulsing ring", desc: "Selected body" },
          {
            icon: "━",
            label: "Indigo lines",
            desc: "Standard routes from selected body",
          },
          { icon: "━", label: "Amber lines", desc: "Scenic routes" },
          {
            icon: "📅",
            label: "Time slider",
            desc: "Move planets forward or backward in time",
          },
          {
            icon: "⚡",
            label: "Time speed",
            desc: "Animate the system in motion",
          },
          {
            icon: "•",
            label: "Dot on body name",
            desc: "This body is bookable",
          },
          {
            icon: "🌑",
            label: "Moon labels",
            desc: "Appear when zoomed in close",
          },
        ].map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <span className="text-sm shrink-0 w-5">{item.icon}</span>
            <div>
              <span className="font-sans text-xs font-bold text-white/70">
                {item.label}
              </span>
              <span className="font-sans text-xs text-white/35">
                {" "}
                — {item.desc}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default HelpPanel;
