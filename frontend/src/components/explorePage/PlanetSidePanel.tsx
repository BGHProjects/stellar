import { Badge, Button, Divider } from "@/components/ui";
import {
  BODY_NAMES,
  BODY_TYPE,
  STAR_IDS,
  VISITABLE_IDS,
} from "@/constants/explorePage";
import { sidePanelEnter } from "@/lib/animations";
import { getPlanetData } from "@/lib/planetData";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Info, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PlanetSidePanel = ({
  bodyId,
  onClose,
}: {
  bodyId: string;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const planetData = getPlanetData(bodyId);
  const isVisitable = VISITABLE_IDS.has(bodyId);
  const isStar = STAR_IDS.has(bodyId);

  const STAR_LORE: Record<string, { desc: string }> = {
    solara_prime: {
      desc: "A G-type main sequence star — the dominant mass of the system and its primary heat source. All orbital periods are measured relative to its position at the barycentre.",
    },
    solara_minor: {
      desc: "A K-type orange dwarf orbiting Solara Prime at 0.08 AU on an 18-day period. Visible from every inhabited world as a second sun, creating double shadows and amber twilights.",
    },
  };

  const NON_VISITABLE_LORE: Record<string, { desc: string }> = {
    serrath: {
      desc: "A tidally-locked rocky planet between the inner system and Aethon. Uninhabitable — one side is a lava sea, the other permanently frozen. Scenic flyby routes pass close by.",
    },
    vareth: {
      desc: "A gas giant at 3.2 AU with vivid storm bands and a permanent hyperstorm. Three of its moons — Kalos, Thal, and Mira — are colonised.",
    },
    drath: {
      desc: "An outer gas giant with an erratic, periodically-reversing magnetosphere. No sanctioned habitation on any of its moons due to unpredictable radiation spikes.",
    },
    l4_station: {
      desc: "A deep-space installation at the L4 Lagrange point of the binary system. Serves as a refuelling depot and navigation waypoint.",
    },
    l5_station: {
      desc: "The L5 mirror of the L4 station. Helion-class shuttles run between Aethon and both stations every 3 days.",
    },
  };

  return (
    <motion.div
      variants={sidePanelEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute top-0 left-0 bottom-0 w-80 bg-black/92 border-r border-white/8 backdrop-blur-xl z-20 flex flex-col overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 p-5 border-b border-white/6">
        <div className="flex flex-col gap-1">
          <Badge variant="surface">{BODY_TYPE[bodyId] ?? "Body"}</Badge>
          <h2 className="font-display text-display-md text-white mt-1">
            {BODY_NAMES[bodyId]}
          </h2>
          {!isVisitable && (
            <p className="font-sans text-xs text-white/30 italic">
              Not on the travel network
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white transition-colors mt-1 shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {/* For visitable bodies — rich content */}
        {isVisitable && planetData && (
          <>
            <img
              src={`/images/planet/${planetData.id}/hero.jpg`}
              alt={planetData.imageSlots.hero}
              className="w-full"
            />

            <div className="p-5 flex flex-col gap-5">
              <p className="font-sans text-sm text-white/55 leading-relaxed">
                {planetData.description}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Population", value: planetData.population },
                  { label: "Gravity", value: planetData.gravity },
                  {
                    label: "Atmosphere",
                    value: (planetData.atmosphere ?? "None")
                      .split("—")[0]
                      .trim(),
                  },
                  {
                    label: "Spaceports",
                    value: String(planetData.spaceports.length),
                  },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="bg-surface-900/60 rounded-xl p-3 border border-white/5"
                  >
                    <span className="label">{f.label}</span>
                    <span className="font-sans text-xs text-white block mt-0.5 leading-tight">
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>
              {bodyId === "mira" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded-xl">
                  <Info className="w-4 h-4 text-danger/70 shrink-0" />
                  <p className="font-sans text-xs text-danger/80">
                    Interplanetary permit required for access
                  </p>
                </div>
              )}
              <Divider />
              <div className="flex flex-col gap-2">
                <span className="label">Routes from {planetData.name}</span>
                {planetData.routes.slice(0, 4).map((route) => (
                  <button
                    key={route.routeId}
                    onClick={() =>
                      navigate(
                        `/book?originId=${bodyId}&destinationId=${route.to}&adults=1&children=0`,
                      )
                    }
                    className="flex items-center justify-between gap-3 p-3 bg-surface-900/50 border border-accent-600/30 hover:border-white  rounded-xl transition-all text-left group"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-display-sm text-white">
                          {route.toName}
                        </span>
                        {route.scenic && (
                          <Badge variant="warning" size="sm">
                            Scenic
                          </Badge>
                        )}
                      </div>
                      <span className="font-sans text-xs text-white/30 capitalize">
                        {route.shipClass}-class · {route.frequency}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Stars */}
        {isStar && (
          <div className="p-5 flex flex-col gap-4">
            <p className="font-sans text-sm text-white/55 leading-relaxed">
              {STAR_LORE[bodyId]?.desc}
            </p>
            <div className="glass-card rounded-xl p-4 border border-white/5">
              <p className="font-sans text-xs text-white/30">
                The binary system creates double shadows, amber-tinted
                twilights, and periods where both stars are simultaneously above
                the horizon on Aethon's equatorial zones.
              </p>
            </div>
          </div>
        )}

        {/* Non-visitable, non-star */}
        {!isVisitable && !isStar && (
          <div className="p-5 flex flex-col gap-4">
            <p className="font-sans text-sm text-white/55 leading-relaxed">
              {NON_VISITABLE_LORE[bodyId]?.desc ??
                "No travel services operate to this body."}
            </p>
            {bodyId === "serrath" && (
              <button
                onClick={() =>
                  navigate("/book?destinationId=kalos&adults=1&children=0")
                }
                className="flex items-center gap-2 px-4 py-3 bg-surface-800/60 border border-white/8 hover:border-accent-600/30 rounded-xl transition-all text-left"
              >
                <span className="font-sans text-xs text-white/60">
                  Scenic flyby routes pass Serrath — book an Aethon → Kalos
                  scenic voyage to see it
                </span>
                <ChevronRight className="w-4 h-4 text-white/20 shrink-0" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer CTAs — only for visitable */}
      {isVisitable && (
        <div className="p-4 border-t border-white/6 flex flex-col gap-2">
          <Button
            size="md"
            className="w-full"
            onClick={() =>
              navigate(`/book?destinationId=${bodyId}&adults=1&children=0`)
            }
          >
            Book a Voyage Here <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => navigate(`/planet/${bodyId}`)}
          >
            <Info className="w-3.5 h-3.5" /> Full Planet Profile
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default PlanetSidePanel;
