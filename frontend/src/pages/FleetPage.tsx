import { PageTransition } from "@/components/common";
import FleetPageAllClassesGrid from "@/components/fleetpage/FleetPageAllClassesGrid";
import FleetPageComparisonTable from "@/components/fleetpage/FleetPageComparisonTable";
import FleetPageHeader from "@/components/fleetpage/FleetPageHeader";
import FleetPageShipClassSelectorTabs from "@/components/fleetpage/FleetPageShipClassSelectorTabs";
import FleetPageShipDetail from "@/components/fleetpage/FleetPageShipDetail";
import { SHIP_CLASSES } from "@/constants/fleetPage";
import { getShipClassData } from "@/lib/fleetData";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FleetPage() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string>(SHIP_CLASSES[0].id);
  const [comparing, setComparing] = useState(false);

  const activeShip = getShipClassData(activeId)!;

  return (
    <PageTransition>
      <div className="min-h-screen bg-void pt-16">
        {/* ── PAGE HEADER ─────────────────────────────────────────── */}
        <FleetPageHeader />

        <FleetPageShipClassSelectorTabs
          activeId={activeId}
          setActiveId={setActiveId}
          comparing={comparing}
          setComparing={setComparing}
        />

        <FleetPageComparisonTable
          activeId={activeId}
          setActiveId={setActiveId}
          comparing={comparing}
          setComparing={setComparing}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <FleetPageShipDetail
              ship={activeShip}
              onSearchClick={() => navigate("/book")}
            />
          </motion.div>
        </AnimatePresence>

        <FleetPageAllClassesGrid setActiveId={setActiveId} />
      </div>
    </PageTransition>
  );
}
