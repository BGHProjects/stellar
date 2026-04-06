import { SHIP_CLASSES } from "@/constants/fleetPage";
import { cn } from "@/lib/utils";
import { Button } from "../ui";

interface IFleetPageShipClassSelectorTabs {
  activeId: string;
  setActiveId: React.Dispatch<React.SetStateAction<string>>;
  comparing: boolean;
  setComparing: React.Dispatch<React.SetStateAction<boolean>>;
}

const FleetPageShipClassSelectorTabs = ({
  activeId,
  setActiveId,
  comparing,
  setComparing,
}: IFleetPageShipClassSelectorTabs) => {
  return (
    <div className="border-b border-white/5 bg-black/60 backdrop-blur-md sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-3">
          {SHIP_CLASSES.map((ship) => (
            <button
              key={ship.id}
              onClick={() => setActiveId(ship.id)}
              className={cn(
                "flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-sans text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0",
                activeId === ship.id
                  ? "bg-white text-black"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5",
              )}
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  activeId === ship.id ? "bg-black" : "bg-white/20",
                )}
              />
              {ship.name}
              <span
                className={cn(
                  "text-xs rounded-full px-1.5 py-0.5 font-bold",
                  activeId === ship.id
                    ? "bg-black/15 text-black"
                    : "bg-white/8 text-white/30",
                )}
              >
                {ship.inService}
              </span>
            </button>
          ))}

          <div className="ml-auto shrink-0 pl-4">
            <Button
              variant={comparing ? "accent" : "secondary"}
              size="sm"
              onClick={() => setComparing((c) => !c)}
            >
              {comparing ? "Hide" : "Compare"} Classes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetPageShipClassSelectorTabs;
