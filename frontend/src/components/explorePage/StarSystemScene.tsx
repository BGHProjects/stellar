import BodyMesh from "@/components/explorePage/BodyMesh";
import OrbitalRing from "@/components/explorePage/OrbitalRing";
import ResetCamera from "@/components/explorePage/ResetCamera";
import RouteArc from "@/components/explorePage/RouteArc";
import ScatterBelt from "@/components/explorePage/ScatterBelt";
import SelectionHandler from "@/components/explorePage/SelectionHandler";
import { AU_SCALE } from "@/constants/explorePage";
import computePositions from "@/helpers/explorePage/computePositions";
import { getPlanetData } from "@/lib/planetData";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────
// The 3D scene
// ─────────────────────────────────────────────────────────────────

const StarSystemScene = ({
  systemConfig,
  simDay,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  recenterTrigger,
  setTravelling,
}: {
  systemConfig: any;
  simDay: number;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  cameraTarget: THREE.Vector3 | null;
  recenterTrigger: number;
  setTravelling: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const positions = computePositions(systemConfig, simDay);

  // Route arcs for selected body
  const planetData = selectedId ? getPlanetData(selectedId) : null;
  const routeArcs = planetData?.routes ?? [];

  // All unique orbital radii for ring rendering — only major planets
  const majorOrbits = [0.6, 1.1, 3.2, 5.8, 9.4];

  const allBodyIds = [
    "solara_prime",
    "solara_minor",
    "l4_station",
    "l5_station",
    ...(systemConfig.bodies ?? []).map((b: any) => b.id),
  ];

  return (
    <>
      <ambientLight intensity={0.25} />
      <Stars
        radius={220}
        depth={80}
        count={8000}
        factor={4}
        saturation={0.1}
        fade
      />

      {/* Orbital rings — major bodies only */}
      {majorOrbits.map((r) => (
        <OrbitalRing key={r} radius={r} opacity={r > 5 ? 0.12 : 0.22} />
      ))}

      {/* Scatter belt */}
      <ScatterBelt />

      {/* Route arcs */}
      {selectedId &&
        positions[selectedId] &&
        routeArcs.map((route) => {
          const destPos = positions[route.to];
          if (!destPos) return null;
          return (
            <RouteArc
              key={route.routeId}
              from={positions[selectedId]!}
              to={destPos}
              scenic={route.scenic}
            />
          );
        })}

      {/* Bodies */}
      {allBodyIds.map((id) => {
        const pos = positions[id];
        if (!pos) return null;
        return (
          <BodyMesh
            key={id}
            id={id}
            position={pos}
            selected={selectedId === id}
            hovered={hoveredId === id}
            onClick={() => onSelect(id)}
            onHover={(h) => onHover(h ? id : null)}
            simTime={simDay * 0.01}
            cameraDistance={0} // passed from parent below
          />
        );
      })}

      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        zoomToCursor // <-- zoom toward cursor, not toward target
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={AU_SCALE * 30}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.1}
        zoomSpeed={1.2}
        panSpeed={0.8}
        rotateSpeed={0.5}
      />

      <SelectionHandler
        selectedId={selectedId}
        systemConfig={systemConfig}
        simDay={simDay}
        onTravelDone={() => setTravelling(false)}
        recenterTrigger={recenterTrigger}
      />
      <ResetCamera trigger={recenterTrigger} />
    </>
  );
};

export default StarSystemScene;
