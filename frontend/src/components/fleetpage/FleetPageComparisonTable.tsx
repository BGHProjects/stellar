import {
  SHIP_CLASSES,
  ALL_CABIN_CLASSES,
  ALL_ROUTE_TYPES,
} from "@/constants/fleetPage";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, XIcon } from "lucide-react";

interface IFleetPageComparisonTable {
  activeId: string;
  setActiveId: React.Dispatch<React.SetStateAction<string>>;
  comparing: boolean;
  setComparing: React.Dispatch<React.SetStateAction<boolean>>;
}

const FleetPageComparisonTable = ({
  comparing,
  setComparing,
  activeId,
  setActiveId,
}: IFleetPageComparisonTable) => {
  return (
    <AnimatePresence>
      {comparing && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden border-b border-white/5 bg-surface-950/60"
        >
          <div className="max-w-7xl mx-auto px-4 py-8">
            <span className="label mb-6 block">Class Comparison</span>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pb-4 pr-8 font-sans text-xs text-white/30 uppercase tracking-widest font-bold w-40">
                      Spec
                    </th>
                    {SHIP_CLASSES.map((ship) => (
                      <th key={ship.id} className="text-center pb-4 px-4">
                        <button
                          onClick={() => {
                            setActiveId(ship.id);
                            setComparing(false);
                          }}
                          className={cn(
                            "font-display text-display-sm transition-colors",
                            activeId === ship.id
                              ? "text-white"
                              : "text-white/40 hover:text-white/70",
                          )}
                        >
                          {ship.name}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { label: "Speed", key: "cruiseSpeed" as const },
                    { label: "Passengers", key: "maxPassengers" as const },
                    { label: "Length", key: "length" as const },
                    { label: "In Service", key: "inService" as const },
                    { label: "Introduced", key: "introduced" as const },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="py-3 pr-8 font-sans text-xs text-white/30 uppercase tracking-widest font-bold">
                        {row.label}
                      </td>
                      {SHIP_CLASSES.map((ship) => (
                        <td
                          key={ship.id}
                          className="py-3 px-4 text-center font-sans text-sm text-white/70"
                        >
                          {String(ship[row.key])}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Cabin classes */}
                  <tr>
                    <td className="py-3 pr-8 font-sans text-xs text-white/30 uppercase tracking-widest font-bold">
                      Cabins
                    </td>
                    {SHIP_CLASSES.map((ship) => (
                      <td key={ship.id} className="py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          {ALL_CABIN_CLASSES.map((cabin) => (
                            <div
                              key={cabin}
                              className={cn(
                                "flex items-center gap-1 font-sans text-xs",
                                ship.cabinClasses.includes(cabin)
                                  ? "text-white/60"
                                  : "text-white/15",
                              )}
                            >
                              {ship.cabinClasses.includes(cabin) ? (
                                <Check className="w-3 h-3 text-success shrink-0" />
                              ) : (
                                <XIcon className="w-3 h-3 shrink-0" />
                              )}
                              {cabin.replace(" Class", "")}
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Route types */}
                  <tr>
                    <td className="py-3 pr-8 font-sans text-xs text-white/30 uppercase tracking-widest font-bold">
                      Routes
                    </td>
                    {SHIP_CLASSES.map((ship) => (
                      <td key={ship.id} className="py-3 px-4">
                        <div className="flex flex-col items-center gap-1">
                          {ALL_ROUTE_TYPES.map((rt) => (
                            <div
                              key={rt}
                              className={cn(
                                "flex items-center gap-1 font-sans text-xs",
                                ship.routeTypes.includes(rt)
                                  ? "text-white/60"
                                  : "text-white/15",
                              )}
                            >
                              {ship.routeTypes.includes(rt) ? (
                                <Check className="w-3 h-3 text-success shrink-0" />
                              ) : (
                                <XIcon className="w-3 h-3 shrink-0" />
                              )}
                              {rt}
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Cryo / Spacewalk */}
                  {[
                    { label: "Cryostasis", key: "hasCryo" as const },
                    {
                      label: "Spacewalk",
                      key: "spacewalkCapable" as const,
                    },
                  ].map((row) => (
                    <tr key={row.label}>
                      <td className="py-3 pr-8 font-sans text-xs text-white/30 uppercase tracking-widest font-bold">
                        {row.label}
                      </td>
                      {SHIP_CLASSES.map((ship) => (
                        <td key={ship.id} className="py-3 px-4 text-center">
                          {ship[row.key] ? (
                            <Check className="w-4 h-4 text-success mx-auto" />
                          ) : (
                            <XIcon className="w-4 h-4 text-white/15 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FleetPageComparisonTable;
