import { MobileGate } from "@/components/common";
import BodyListPanel from "@/components/explorePage/BodyListPanel";
import HelpPanel from "@/components/explorePage/HelpPanel";
import PlanetSidePanel from "@/components/explorePage/PlanetSidePanel";
import StarSystemScene from "@/components/explorePage/StarSystemScene";
import { Badge } from "@/components/ui";
import {
  AU_SCALE,
  BODY_COLOURS,
  BODY_NAMES,
  BODY_TYPE,
  VISITABLE_IDS,
} from "@/constants/explorePage";
import computePositions from "@/helpers/explorePage/computePositions";
import { getSystemConfig } from "@/lib/api";
import { cn } from "@/lib/utils";
import { shaderMaterial } from "@react-three/drei";
import { Canvas, extend } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  FastForward,
  Globe,
  HelpCircle,
  List,
  Pause,
  Play,
  X,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────
// Procedural planet shader — gives each body a simple surface texture
// via noise-based fragment shader so they don't look like flat balls.
// ─────────────────────────────────────────────────────────────────

const PlanetShaderMaterial = shaderMaterial(
  {
    uColor: new THREE.Color("#4A90D9"),
    uTime: 0.0,
    uEmissive: 0.0,
    uSelected: 0.0,
    uHovered: 0.0,
  },
  // Vertex shader
  `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal   = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // Fragment shader — simple hash noise to create surface variation
  `
  uniform vec3  uColor;
  uniform float uTime;
  uniform float uEmissive;
  uniform float uSelected;
  uniform float uHovered;
  varying vec3  vNormal;
  varying vec3  vPosition;

  float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i),             hash(i+vec3(1,0,0)), f.x),
        mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
        mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z
  );
}

float fbm(vec3 p) {
  float v = 0.0, amp = 0.5, freq = 1.0;
  for (int i = 0; i < 4; i++) {
    v   += amp * noise(p * freq);
    freq *= 2.1;
    amp  *= 0.5;
  }
  return v;
}

void main() {
  vec3 lightDir = normalize(vec3(-1.0, 0.5, 1.0));
  float diff    = max(dot(vNormal, lightDir), 0.0);
  float ambient = 0.15;

  // Domain-warped FBM surface
  vec3 rotPos = vPosition + vec3(uTime * 0.03, 0.0, 0.0);
  vec3 q = vec3(
    fbm(rotPos * 2.5),
    fbm(rotPos * 2.5 + vec3(5.2, 1.3, 2.8)),
    fbm(rotPos * 2.5 + vec3(9.1, 3.7, 6.4))
  );
  float surface = fbm(rotPos * 2.5 + 1.5 * q);

  // Wider colour range with a subtle hue shift in highlights
  vec3 darkCol  = uColor * 0.5;
  vec3 lightCol = mix(uColor * 1.4, uColor + vec3(0.08, 0.05, -0.05), surface);
  vec3 col = mix(darkCol, lightCol, surface);
  col = col * (ambient + diff * 0.85);

  // Specular
  vec3 viewDir = normalize(-vPosition);
  vec3 halfVec = normalize(lightDir + viewDir);
  float spec   = pow(max(dot(vNormal, halfVec), 0.0), 32.0) * surface * 0.4;
  col += vec3(spec);

  // Emissive glow for stars
  col += uColor * uEmissive * 0.8;

  // Hover / selection
  col = mix(col, col * 1.4, uHovered * 0.5);
  col = mix(col, col + vec3(0.1, 0.12, 0.2), uSelected * 0.6);

  // Rim lighting
  float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
  rim = pow(rim, 3.0);
  col += uColor * rim * (0.3 + uSelected * 0.4 + uHovered * 0.2);

  gl_FragColor = vec4(col, 1.0);
}
  `,
);

extend({ PlanetShaderMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      planetShaderMaterial: any;
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Main ExplorePage
// ─────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showBodyList, setShowBodyList] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [simDay, setSimDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(5); // days per frame
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [travelling, setTravelling] = useState(false);

  const playRef = useRef(isPlaying);
  playRef.current = isPlaying;

  const { data: systemConfig } = useQuery({
    queryKey: ["systemConfig"],
    queryFn: getSystemConfig,
    staleTime: Infinity,
  });

  // Animate time
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setSimDay((d) => d + playSpeed);
    }, 50);
    return () => clearInterval(id);
  }, [isPlaying, playSpeed]);

  function handleSelect(id: string) {
    if (selectedId === id) {
      setSelectedId(null);
      setCameraTarget(null);
      return;
    }
    setSelectedId(id);
    setShowBodyList(false);
    if (systemConfig) {
      const positions = computePositions(systemConfig, simDay);
      const pos = positions[id];
      if (pos) {
        setCameraTarget(
          new THREE.Vector3(pos.x * AU_SCALE, 0, pos.y * AU_SCALE),
        );
      }
    }
  }

  function handleClose() {
    setSelectedId(null);
    setShowBodyList(true);
  }

  const currentDate = new Date(Date.UTC(2800, 0, 1));
  currentDate.setDate(currentDate.getDate() + simDay);
  const dateStr = currentDate.toISOString().split("T")[0];

  return (
    <MobileGate minBreakpoint="md" featureName="The Star Map">
      <div
        className="h-screen bg-void flex flex-col pt-16 overflow-hidden"
        style={{ cursor: hoveredId ? "pointer" : "default" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-white/5 bg-black/70 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowBodyList((s) => !s);
              }}
              className={cn(
                "flex items-center gap-1.5 font-sans text-xs font-bold px-3 py-1.5 rounded-lg transition-all",
                showBodyList && !selectedId
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/70",
              )}
            >
              <List className="w-3.5 h-3.5" /> Bodies
            </button>
            {selectedId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                <span className="text-white/25">·</span>
                <span className="font-display text-sm text-accent-300">
                  {BODY_NAMES[selectedId]}
                </span>
                <button
                  onClick={handleClose}
                  className="text-white/30 hover:text-white ml-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Time controls */}
          <div className="flex items-center gap-3">
            <span className="font-sans text-[12px] text-white/80 hidden lg:block">
              Approximate scale
            </span>
            <div className="hidden md:flex items-center gap-2 bg-surface-900/60 border border-white/8 rounded-xl px-3 py-1.5">
              <Clock className="w-3 h-3 text-white/30" />
              <span className="font-mono text-xs text-white/50">{dateStr}</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => setPlaySpeed((s) => Math.max(1, s / 2))}
                className="text-white/30 hover:text-white/60 transition-colors"
                title="Slower"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="w-7 h-7 rounded-full bg-surface-800 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-accent-600/40 transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => setPlaySpeed((s) => Math.min(50, s * 2))}
                className="text-white/30 hover:text-white/60 transition-colors"
                title="Faster"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setShowHelp((h) => !h)}
              className="text-white/30 hover:text-white transition-colors"
              title="Help"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSelectedId(null);
                setShowBodyList(true);
                setRecenterTrigger((t) => t + 1);
              }}
              className="flex items-center gap-1.5 font-sans text-xs text-white/40 hover:text-white/70 transition-colors"
              title="Re-centre view"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Re-centre</span>
            </button>
          </div>
        </div>

        {/* Time slider */}
        <div className="px-4 py-2 border-b border-white/5 bg-black/40 flex items-center gap-3 shrink-0 flex-wrap">
          <span className="font-sans text-xs text-white/30 shrink-0">Time</span>
          <input
            type="range"
            min={-500}
            max={5000}
            step={1}
            value={simDay}
            onChange={(e) => {
              setSimDay(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="flex-1 min-w-32 accent-accent-500"
          />
          <input
            type="date"
            value={(() => {
              const d = new Date(Date.UTC(2800, 0, 1));
              d.setDate(d.getDate() + simDay);
              return d.toISOString().split("T")[0];
            })()}
            onChange={(e) => {
              const picked = new Date(e.target.value);
              const epoch = new Date(Date.UTC(2800, 0, 1));
              const days = Math.round(
                (picked.getTime() - epoch.getTime()) / 86400000,
              );
              setSimDay(days);
              setIsPlaying(false);
            }}
            className="font-mono text-xs text-white/60 bg-surface-900 border border-white/10 rounded-lg px-2 py-1 [color-scheme:dark] focus:outline-none focus:border-accent-600/40"
          />
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setPlaySpeed((s) => Math.max(1, s - 1))}
              className="w-6 h-6 rounded bg-surface-800 border border-white/10 text-white/50 hover:text-white text-xs font-bold transition-all"
            >
              −
            </button>
            <span className="font-mono text-xs text-white/40 w-8 text-center">
              {playSpeed}×
            </span>
            <button
              onClick={() => setPlaySpeed((s) => Math.min(50, s + 1))}
              className="w-6 h-6 rounded bg-surface-800 border border-white/10 text-white/50 hover:text-white text-xs font-bold transition-all"
            >
              +
            </button>
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="w-7 h-7 rounded-lg bg-surface-800 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-accent-600/40 transition-all ml-1"
            >
              {isPlaying ? (
                <Pause className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
            </button>
          </div>
          <button
            onClick={() => {
              setSimDay(0);
              setIsPlaying(false);
            }}
            className="font-sans text-xs text-white/25 hover:text-white/60 transition-colors shrink-0"
          >
            Reset
          </button>
        </div>

        {/* Canvas + overlays */}
        <div className="flex-1 relative overflow-hidden">
          {/* Canvas */}
          {systemConfig ? (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2.0, ease: "easeOut" }}
            >
              <Canvas
                camera={{
                  position: [0, AU_SCALE * 1.6, AU_SCALE * 2.0],
                  fov: 52,
                }}
                gl={{ antialias: true, alpha: false }}
                style={{ background: "#000005" }}
              >
                <Suspense fallback={null}>
                  <StarSystemScene
                    systemConfig={systemConfig}
                    simDay={simDay}
                    selectedId={selectedId}
                    hoveredId={hoveredId}
                    onSelect={handleSelect}
                    onHover={setHoveredId}
                    cameraTarget={cameraTarget}
                    recenterTrigger={recenterTrigger}
                    setTravelling={setTravelling}
                  />
                </Suspense>
              </Canvas>
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-accent-400 border-t-transparent animate-spin" />
                <p className="font-sans text-sm text-white/40">
                  Loading system data…
                </p>
              </div>
            </div>
          )}

          {/* Body list panel */}
          <AnimatePresence>
            {showBodyList && !selectedId && (
              <BodyListPanel
                onSelect={handleSelect}
                selectedId={selectedId}
                onHoverBody={(id) => setHoveredId(id)}
                travelling={travelling}
              />
            )}
          </AnimatePresence>

          {/* Help panel */}
          <AnimatePresence>
            {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
          </AnimatePresence>

          {/* Hover tooltip */}
          <AnimatePresence>
            {hoveredId && !selectedId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none"
              >
                <div className="glass-card rounded-xl px-4 py-2 flex items-center gap-2 border border-white/8">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: BODY_COLOURS[hoveredId] ?? "#888" }}
                  />
                  <span className="font-display text-sm text-white">
                    {BODY_NAMES[hoveredId]}
                  </span>
                  <span className="font-sans text-xs text-white/40">
                    {BODY_TYPE[hoveredId]}
                  </span>
                  {VISITABLE_IDS.has(hoveredId) && (
                    <Badge variant="accent" size="sm">
                      Bookable
                    </Badge>
                  )}
                  <span className="font-sans text-xs text-white/25 ml-1">
                    Click to select
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Planet side panel */}
          <AnimatePresence>
            {selectedId && (
              <PlanetSidePanel
                key={selectedId}
                bodyId={selectedId}
                onClose={handleClose}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </MobileGate>
  );
}
