import {
  BODY_COLOURS,
  BODY_NAMES,
  BODY_TYPE,
  STAR_IDS,
  VISITABLE_IDS,
} from "@/constants/explorePage";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { List } from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// Body List Panel — left side, lists all bodies sorted by distance
// ─────────────────────────────────────────────────────────────────

const BodyListPanel = ({
  onSelect,
  selectedId,
  onHoverBody,
  travelling,
}: {
  onSelect: (id: string) => void;
  selectedId: string | null;
  onHoverBody: (id: string | null) => void;
  travelling: boolean;
}) => {
  const groups = [
    {
      label: "Stars & Inner",
      ids: [
        "taunor_prime",
        "taunor_minor",
        "l4_station",
        "l5_station",
        "serrath",
        "aethon",
      ],
    },
    { label: "Vareth System", ids: ["vareth", "kalos", "thal", "mira"] },
    { label: "Calyx System", ids: ["calyx", "lun", "vael"] },
    { label: "Outer System", ids: ["drath"] },
  ];

  return (
    <motion.div
      initial={{ x: -220, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -220, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-0 left-0 bottom-0 w-52 bg-black/85 border-r border-white/8 backdrop-blur-md z-10 flex flex-col overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-white/6 flex items-center gap-2">
        <List className="w-3.5 h-3.5 text-white/40" />
        <span className="font-sans text-xs font-bold text-white/50 uppercase tracking-widest">
          System Bodies
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none py-2">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-4 py-1.5">
              <span className="font-sans text-[10px] text-white/25 uppercase tracking-widest">
                {group.label}
              </span>
            </div>
            {group.ids.map((id) => {
              const isSelected = selectedId === id;
              const isVisitable = VISITABLE_IDS.has(id);
              const isStar = STAR_IDS.has(id);
              return (
                <motion.button
                  key={id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => {
                    if (!travelling) onSelect(id);
                  }}
                  onMouseEnter={() => onHoverBody(id)}
                  onMouseLeave={() => onHoverBody(null)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors duration-150",
                    isSelected
                      ? "bg-accent-600/20 border-l-2 border-accent-400"
                      : "hover:bg-white/5 border-l-2 border-transparent",
                  )}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: BODY_COLOURS[id] ?? "#888" }}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span
                      className={cn(
                        "font-sans text-xs leading-tight truncate transition-colors",
                        isSelected
                          ? "text-white font-bold"
                          : isStar
                            ? "text-yellow-200/70"
                            : isVisitable
                              ? "text-white/75"
                              : "text-white/35",
                      )}
                    >
                      {BODY_NAMES[id]}
                    </span>
                    <span className="font-sans text-[9px] text-white/20 truncate">
                      {BODY_TYPE[id]}
                    </span>
                  </div>
                  {isVisitable && !isStar && (
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0"
                      title="Has spaceport"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-white/6">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0" />
          <span className="font-sans text-[10px] text-white/30">
            Has spaceport — bookable destination
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BodyListPanel;
