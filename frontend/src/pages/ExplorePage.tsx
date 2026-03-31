import {
  ImagePlaceholder,
  MobileGate,
  PageTransition,
} from "@/components/common";
import {
  Badge,
  Button,
  Divider,
  OrbitalWindowStars,
  Spinner,
} from "@/components/ui";
import { fadeIn, sidePanelEnter, starMapEnter } from "@/lib/animations";
import { getClosestApproach, getSystemConfig } from "@/lib/api";
import {
  position as orbitalPosition,
  paramsFromBody,
  today,
} from "@/lib/orbital";
import { getAllPlanetData, getPlanetData } from "@/lib/planetData";
import { cn, formatDate } from "@/lib/utils";
import { Html, Line, OrbitControls, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronRight, Globe, Info, X } from "lucide-react";
import { Suspense, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

// System.json body IDs for visitable destinations
const VISITABLE_IDS = [
  "aethon",
  "kalos",
  "thal",
  "mira",
  "calyx",
  "lun",
  "vael",
];

// Scale factor — orbital radii are in AU, we convert to scene units
const AU_SCALE = 18;

// Body render sizes in scene units
const BODY_SIZES: Record<string, number> = {
  aethon: 0.55,
  kalos: 0.22,
  thal: 0.18,
  mira: 0.16,
  calyx: 0.35,
  lun: 0.12,
  vael: 0.1,
  vareth: 0.8,
  serrath: 0.14,
  drath: 0.55,
  solara_prime: 1.2,
  solara_minor: 0.7,
};

// Body render colours
const BODY_COLOURS: Record<string, string> = {
  aethon: "#4A90D9",
  kalos: "#9B7653",
  thal: "#B45309",
  mira: "#BAE6FD",
  calyx: "#BAE6FD",
  lun: "#78716C",
  vael: "#E2E8F0",
  vareth: "#C2410C",
  serrath: "#8B6355",
  drath: "#94A3B8",
  solara_prime: "#FFF4C2",
  solara_minor: "#FFB347",
};

// ─────────────────────────────────────────────────────────────────
// Individual orbital body mesh
// ─────────────────────────────────────────────────────────────────

interface BodyMeshProps {
  bodyConfig: ReturnType<typeof getAllPlanetData>[0] & {
    orbitalRadius?: number;
    period?: number;
    eccentricity?: number;
    startPhase?: number;
    parent?: string;
    id: string;
    renderColor?: string;
    renderRadius?: number;
  };
  systemBodies: Record<string, { x: number; y: number }>;
  simDay: number;
  selected: boolean;
  onClick: () => void;
  isVisitable: boolean;
}

function BodyMesh({
  bodyConfig,
  systemBodies,
  simDay,
  selected,
  onClick,
  isVisitable,
}: BodyMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const pos = systemBodies[bodyConfig.id] ?? { x: 0, y: 0 };
  const x = pos.x * AU_SCALE;
  const z = pos.y * AU_SCALE;
  const size = BODY_SIZES[bodyConfig.id] ?? 0.2;
  const color = BODY_COLOURS[bodyConfig.id] ?? "#888888";

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
    }
    if (glowRef.current && selected) {
      glowRef.current.scale.setScalar(
        1 + Math.sin(state.clock.elapsedTime * 2) * 0.08,
      );
    }
  });

  return (
    <group position={[x, 0, z]} onClick={onClick}>
      {/* Glow sphere (selected state) */}
      {selected && (
        <mesh ref={glowRef}>
          <sphereGeometry args={[size * 2.2, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.12} />
        </mesh>
      )}

      {/* Main body */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.4 : 0.15}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Selection ring */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.6, size * 1.75, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Hover indicator — always visible for visitables */}
      {isVisitable && !selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.4, size * 1.5, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Name label */}
      <Html distanceFactor={60} style={{ pointerEvents: "none" }}>
        <div
          className={cn(
            "font-display text-xs whitespace-nowrap transition-all duration-300",
            isVisitable ? "text-white/80" : "text-white/25",
            selected && "text-white",
          )}
          style={{
            transform: "translateY(20px)",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
          }}
        >
          {bodyConfig.name}
        </div>
      </Html>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// Orbital path ring
// ─────────────────────────────────────────────────────────────────

function OrbitalRing({
  radius,
  opacity = 0.08,
}: {
  radius: number;
  opacity?: number;
}) {
  const points: THREE.Vector3[] = [];
  const segments = 128;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius * AU_SCALE,
        0,
        Math.sin(angle) * radius * AU_SCALE,
      ),
    );
  }
  return (
    <Line
      points={points}
      color="#ffffff"
      lineWidth={0.5}
      transparent
      opacity={opacity}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Route arc between two bodies
// ─────────────────────────────────────────────────────────────────

function RouteArc({
  from,
  to,
  color = "#7c3aed",
}: {
  from: [number, number];
  to: [number, number];
  color?: string;
}) {
  const fx = from[0] * AU_SCALE,
    fz = from[1] * AU_SCALE;
  const tx = to[0] * AU_SCALE,
    tz = to[1] * AU_SCALE;
  const mx = (fx + tx) / 2,
    mz = (fz + tz) / 2;
  const dist = Math.sqrt((tx - fx) ** 2 + (tz - fz) ** 2);

  // Curved arc via a midpoint elevated in y
  const points: THREE.Vector3[] = [];
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(fx, 0, fz),
    new THREE.Vector3(mx, dist * 0.15, mz),
    new THREE.Vector3(tx, 0, tz),
  );
  for (let i = 0; i <= 48; i++) {
    points.push(curve.getPoint(i / 48));
  }

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={0.5}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// The 3D scene
// ─────────────────────────────────────────────────────────────────

interface SceneProps {
  systemConfig: Awaited<ReturnType<typeof getSystemConfig>> | undefined;
  simDay: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function StarSystemScene({
  systemConfig,
  simDay,
  selectedId,
  onSelect,
}: SceneProps) {
  // Calculate all body positions
  const positions: Record<string, { x: number; y: number }> = {};

  if (systemConfig) {
    const bodyMap = new Map(systemConfig.bodies.map((b) => [b.id, b]));
    for (const body of systemConfig.bodies) {
      const params = paramsFromBody(body);
      if (body.parent && bodyMap.has(body.parent)) {
        const parent = bodyMap.get(body.parent)!;
        const parentParams = paramsFromBody(parent);
        const pp = orbitalPosition(parentParams, simDay);
        const mp = orbitalPosition(params, simDay);
        positions[body.id] = { x: pp.x + mp.x, y: pp.y + mp.y };
      } else {
        positions[body.id] = orbitalPosition(params, simDay);
      }
    }
  }

  const ORBITAL_RADII = [0.6, 1.1, 3.2, 5.8, 9.4];

  return (
    <>
      {/* Ambient + point lights */}
      <ambientLight intensity={0.3} />
      <pointLight
        position={[0, 0, 0]}
        intensity={8}
        color="#FFF4C2"
        distance={AU_SCALE * 12}
      />
      <pointLight
        position={[0.08 * AU_SCALE, 0, 0]}
        intensity={4}
        color="#FFB347"
        distance={AU_SCALE * 10}
      />

      {/* Star field */}
      <Stars
        radius={200}
        depth={80}
        count={6000}
        factor={4}
        saturation={0}
        fade
      />

      {/* Stars at origin */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial color="#FFF4C2" />
      </mesh>

      {/* Orbital path rings */}
      {ORBITAL_RADII.map((r) => (
        <OrbitalRing key={r} radius={r} opacity={r > 4 ? 0.05 : 0.08} />
      ))}

      {/* The Scatter — particle band */}
      {Array.from({ length: 300 }).map((_, i) => {
        const angle = (i / 300) * Math.PI * 2 + i * 0.1;
        const radius = 1.8 + Math.random() * 0.8;
        const x = Math.cos(angle) * radius * AU_SCALE;
        const z = Math.sin(angle) * radius * AU_SCALE;
        return (
          <mesh key={i} position={[x, (Math.random() - 0.5) * 0.4, z]}>
            <sphereGeometry args={[0.015 + Math.random() * 0.03, 4, 4]} />
            <meshBasicMaterial color="#6B6B6B" transparent opacity={0.4} />
          </mesh>
        );
      })}

      {/* Route arcs — show when a body is selected */}
      {selectedId &&
        positions[selectedId] &&
        systemConfig &&
        (() => {
          const planetData = getPlanetData(selectedId);
          if (!planetData) return null;
          return planetData.routes.map((route) => {
            const destPos = positions[route.to];
            if (!destPos) return null;
            return (
              <RouteArc
                key={route.routeId}
                from={[positions[selectedId]!.x, positions[selectedId]!.y]}
                to={[destPos.x, destPos.y]}
                color={route.scenic ? "#f59e0b" : "#7c3aed"}
              />
            );
          });
        })()}

      {/* Bodies */}
      {systemConfig?.bodies.map((body) => {
        const loreData = getPlanetData(body.id);
        const enriched = { ...body, name: loreData?.name ?? body.name };
        return (
          <BodyMesh
            key={body.id}
            bodyConfig={enriched}
            systemBodies={positions}
            simDay={simDay}
            selected={selectedId === body.id}
            onClick={() => VISITABLE_IDS.includes(body.id) && onSelect(body.id)}
            isVisitable={VISITABLE_IDS.includes(body.id)}
          />
        );
      })}

      {/* Camera controls */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={AU_SCALE * 12}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Side panel — planet info
// ─────────────────────────────────────────────────────────────────

function PlanetSidePanel({
  bodyId,
  onClose,
  systemConfig,
  simDay,
}: {
  bodyId: string;
  onClose: () => void;
  systemConfig: Awaited<ReturnType<typeof getSystemConfig>> | undefined;
  simDay: number;
}) {
  const navigate = useNavigate();
  const planetData = getPlanetData(bodyId);

  // Find today's closest approach for each route
  const { data: closestApproaches } = useQuery({
    queryKey: ["closestApproach", bodyId],
    queryFn: async () => {
      if (!planetData) return {};
      const results: Record<
        string,
        Awaited<ReturnType<typeof getClosestApproach>>
      > = {};
      for (const route of planetData.routes.slice(0, 2)) {
        try {
          results[route.to] = await getClosestApproach(
            bodyId,
            route.to,
            undefined,
            180,
          );
        } catch {
          /* ignore */
        }
      }
      return results;
    },
    enabled: !!bodyId && !!planetData,
    staleTime: 1000 * 60 * 5,
  });

  if (!planetData) return null;

  return (
    <motion.div
      variants={sidePanelEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-black/90 border-l border-white/8 backdrop-blur-xl z-20 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 border-b border-white/6">
        <div className="flex flex-col gap-1">
          <Badge variant="surface">{planetData.type}</Badge>
          <h2 className="font-display text-display-md text-white mt-1">
            {planetData.name}
          </h2>
          <p className="font-sans text-xs text-white/40 italic">
            {planetData.tagline}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white/30 hover:text-white transition-colors mt-1 shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {/* Hero image */}
        <ImagePlaceholder
          aspectRatio="16/9"
          label={planetData.imageSlots.hero}
          rounded="rounded-none"
        />

        <div className="p-5 flex flex-col gap-6">
          {/* Description */}
          <p className="font-sans text-sm text-white/55 leading-relaxed">
            {planetData.description}
          </p>

          {/* Quick facts */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Population", value: planetData.population },
              { label: "Gravity", value: planetData.gravity },
              {
                label: "Atmosphere",
                value: (planetData.atmosphere ?? "None").split("—")[0].trim(),
              },
              {
                label: "Spaceports",
                value: String(planetData.spaceports.length),
              },
            ].map((fact) => (
              <div
                key={fact.label}
                className="bg-surface-900/60 rounded-xl p-3 flex flex-col gap-0.5 border border-white/5"
              >
                <span className="label">{fact.label}</span>
                <span className="font-sans text-xs text-white leading-tight">
                  {fact.value}
                </span>
              </div>
            ))}
          </div>

          {planetData.id === "mira" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded-xl">
              <Info className="w-4 h-4 text-danger/70 shrink-0" />
              <p className="font-sans text-xs text-danger/80">
                Permit required for access
              </p>
            </div>
          )}

          <Divider />

          {/* Routes from here */}
          <div className="flex flex-col gap-3">
            <span className="label">Routes from {planetData.name}</span>
            {planetData.routes.slice(0, 4).map((route) => (
              <button
                key={route.routeId}
                onClick={() => {
                  const params = new URLSearchParams({
                    originId: bodyId,
                    destinationId: route.to,
                    adults: "1",
                    children: "0",
                  });
                  navigate(`/search?${params}`);
                }}
                className="flex items-center justify-between gap-3 p-3 bg-surface-900/50 border border-white/6 hover:border-white/15 rounded-xl transition-all text-left group"
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

          {/* Closest approach callout */}
          {closestApproaches &&
            Object.entries(closestApproaches).length > 0 && (
              <>
                <Divider />
                <div className="flex flex-col gap-3">
                  <span className="label">Next Optimal Windows</span>
                  {Object.entries(closestApproaches).map(([toId, approach]) => (
                    <div
                      key={toId}
                      className="flex flex-col gap-1 p-3 bg-surface-900/40 border border-white/5 rounded-xl"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs text-white/60">
                          To {getPlanetData(toId)?.name ?? toId}
                        </span>
                        <OrbitalWindowStars
                          rating={approach.windowRating}
                          size="sm"
                        />
                      </div>
                      <span className="font-sans text-xs text-white/40">
                        {formatDate(approach.date)} ·{" "}
                        {approach.distanceAU.toFixed(2)} AU
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
        </div>
      </div>

      {/* Footer CTAs */}
      <div className="p-4 border-t border-white/6 flex flex-col gap-2">
        <Button
          size="md"
          className="w-full"
          onClick={() => {
            const params = new URLSearchParams({
              destinationId: bodyId,
              adults: "1",
              children: "0",
            });
            navigate(`/search?${params}`);
          }}
        >
          Book a Voyage Here
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate(`/planet/${bodyId}`)}
        >
          <Info className="w-3.5 h-3.5" />
          Full Planet Profile
        </Button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main ExplorePage
// ─────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simDay, setSimDay] = useState(() => today());
  const [showSearch, setShowSearch] = useState(false);

  const { data: systemConfig } = useQuery({
    queryKey: ["systemConfig"],
    queryFn: getSystemConfig,
    staleTime: Infinity,
  });

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <MobileGate minBreakpoint="md" featureName="The Star Map">
      <PageTransition>
        <div className="h-screen bg-void flex flex-col pt-16 overflow-hidden">
          {/* Top bar */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between gap-4 px-4 py-2 border-b border-white/5 bg-black/60 backdrop-blur-md z-10 shrink-0"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-white/40" />
              <span className="font-display text-sm text-white/70">
                Solara System
              </span>
              {selectedId && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="text-white/25 text-sm">·</span>
                  <span className="font-sans text-sm text-accent-300 ml-2">
                    {getPlanetData(selectedId)?.name ?? selectedId} selected
                  </span>
                </motion.div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sim day display */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="label">System Date</span>
                <span className="font-mono text-xs text-white/50">
                  Day {Math.round(simDay).toLocaleString()}
                </span>
              </div>

              {selectedId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedId(null)}
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/")}
              >
                Search Voyages
              </Button>
            </div>
          </motion.div>

          {/* Canvas + Side panel */}
          <div className="flex-1 relative overflow-hidden">
            {/* R3F Canvas */}
            <motion.div
              variants={starMapEnter}
              initial="hidden"
              animate="visible"
              className="absolute inset-0"
            >
              <Canvas
                camera={{
                  position: [0, AU_SCALE * 1.8, AU_SCALE * 2.2],
                  fov: 55,
                }}
                gl={{ antialias: true, alpha: false }}
                style={{ background: "#000000" }}
              >
                <Suspense fallback={null}>
                  <StarSystemScene
                    systemConfig={systemConfig}
                    simDay={simDay}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                  />
                </Suspense>
              </Canvas>
            </motion.div>

            {/* Loading overlay */}
            {!systemConfig && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                <div className="flex flex-col items-center gap-4">
                  <Spinner size="lg" />
                  <p className="font-sans text-sm text-white/40">
                    Loading system data…
                  </p>
                </div>
              </div>
            )}

            {/* Instructions overlay — shown when nothing selected */}
            <AnimatePresence>
              {!selectedId && systemConfig && (
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
                >
                  <div className="glass-card rounded-2xl px-5 py-3 flex items-center gap-3">
                    <Globe className="w-4 h-4 text-white/30" />
                    <p className="font-sans text-sm text-white/50">
                      Click a highlighted body to explore destinations
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Side panel */}
            <AnimatePresence>
              {selectedId && (
                <PlanetSidePanel
                  key={selectedId}
                  bodyId={selectedId}
                  onClose={() => setSelectedId(null)}
                  systemConfig={systemConfig}
                  simDay={simDay}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </PageTransition>
    </MobileGate>
  );
}
