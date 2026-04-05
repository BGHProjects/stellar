import { ImagePlaceholder, MobileGate } from "@/components/common";
import { Badge, Button, Divider } from "@/components/ui";
import { sidePanelEnter } from "@/lib/animations";
import { getSystemConfig } from "@/lib/api";
import { getPlanetData } from "@/lib/planetData";
import { cn } from "@/lib/utils";
import {
  Html,
  Line,
  OrbitControls,
  shaderMaterial,
  Stars,
} from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  FastForward,
  Globe,
  HelpCircle,
  Info,
  List,
  Pause,
  Play,
  X,
} from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const AU_SCALE = 18; // 1 AU → 18 scene units
const EPOCH_DAY = 0; // day 0 = simulation epoch

// All bodies that exist in the system (including non-visitable)
const ALL_BODY_IDS = [
  "solara_prime",
  "solara_minor",
  "serrath",
  "aethon",
  "vareth",
  "drath",
  "calyx",
  "kalos",
  "thal",
  "mira",
  "lun",
  "vael",
  "l4_station",
  "l5_station",
];

const VISITABLE_IDS = new Set([
  "aethon",
  "kalos",
  "thal",
  "mira",
  "calyx",
  "lun",
  "vael",
  "l4_station",
  "l5_station",
]);
const STAR_IDS = new Set(["solara_prime", "solara_minor"]);

// Sizes in scene units
const BODY_SIZES: Record<string, number> = {
  solara_prime: 1.4,
  solara_minor: 0.9,
  serrath: 0.16,
  aethon: 0.55,
  vareth: 0.9,
  drath: 0.6,
  calyx: 0.38,
  kalos: 0.22,
  thal: 0.18,
  mira: 0.16,
  lun: 0.12,
  vael: 0.1,
  l4_station: 0.08,
  l5_station: 0.08,
};

// Colours — each body gets a distinct hue
const BODY_COLOURS: Record<string, string> = {
  solara_prime: "#FFF4C2",
  solara_minor: "#FFB347",
  serrath: "#8B6355",
  aethon: "#4A90D9",
  vareth: "#C2410C",
  drath: "#94A3B8",
  calyx: "#93C5FD",
  kalos: "#9B7653",
  thal: "#F97316",
  mira: "#BAE6FD",
  lun: "#78716C",
  vael: "#E2E8F0",
  l4_station: "#a78bfa",
  l5_station: "#a78bfa",
};

// Emissive intensity — stars glow, others are lit
const EMISSIVE: Record<string, number> = {
  solara_prime: 1.0,
  solara_minor: 1.0,
  default: 0.0,
};

// Human-readable names
const BODY_NAMES: Record<string, string> = {
  solara_prime: "Solara Prime",
  solara_minor: "Solara Minor",
  serrath: "Serrath",
  aethon: "Aethon",
  vareth: "Vareth",
  drath: "Drath",
  calyx: "Calyx",
  kalos: "Kalos",
  thal: "Thal",
  mira: "Mira",
  lun: "Lun",
  vael: "Vael",
  l4_station: "L4 Station",
  l5_station: "L5 Station",
};

// Body type labels for the body list panel
const BODY_TYPE: Record<string, string> = {
  solara_prime: "Star",
  solara_minor: "Star",
  serrath: "Rocky Planet",
  aethon: "Super-Earth",
  vareth: "Gas Giant",
  drath: "Gas Giant",
  calyx: "Ice Planet",
  kalos: "Moon of Vareth",
  thal: "Moon of Vareth",
  mira: "Moon of Vareth",
  lun: "Moon of Calyx",
  vael: "Moon of Calyx",
  l4_station: "Lagrange Station",
  l5_station: "Lagrange Station",
};

// Approximate orbital radii (AU) for sorting in the body list
const BODY_SORT_RADIUS: Record<string, number> = {
  solara_prime: 0,
  solara_minor: 0.08,
  serrath: 0.6,
  aethon: 1.1,
  vareth: 3.2,
  kalos: 3.2,
  thal: 3.2,
  mira: 3.2,
  calyx: 5.8,
  lun: 5.8,
  vael: 5.8,
  drath: 9.4,
  l4_station: 0.08,
  l5_station: 0.08,
};

// Moon-level bodies — hide label until user zooms in past threshold
const MOON_IDS = new Set([
  "kalos",
  "thal",
  "mira",
  "lun",
  "vael",
  "l4_station",
  "l5_station",
  "solara_minor",
]);
const LABEL_SHOW_DISTANCE = 40; // scene units — hide moon labels beyond this camera distance

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
      mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x),
          mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
          mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z
    );
  }

  void main() {
    // Directional light from star position
    vec3 lightDir = normalize(vec3(-1.0, 0.5, 1.0));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float ambient = 0.15;

    // Surface noise — two octaves for detail
    vec3 rotPos = vPosition + vec3(uTime * 0.03, 0.0, 0.0);
    float n1 = noise(rotPos * 3.0);
    float n2 = noise(rotPos * 7.0 + 1.7);
    float surface = n1 * 0.7 + n2 * 0.3;

    // Mix base colour with slightly lighter/darker patches
    vec3 col = mix(uColor * 0.7, uColor * 1.3, surface);
    col = col * (ambient + diff * 0.85);

    // Emissive glow for stars
    col += uColor * uEmissive * 0.8;

    // Hover: brighten overall
    col = mix(col, col * 1.4, uHovered * 0.5);

    // Selection: tint slightly cyan-white
    col = mix(col, col + vec3(0.1, 0.12, 0.2), uSelected * 0.6);

    // Rim lighting — atmospheric glow at silhouette
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
// Selection Handler
// ─────────────────────────────────────────────────────────────────

function SelectionHandler({
  selectedId,
  systemConfig,
  simDay,
  onTravelDone,
  recenterTrigger,
}: {
  selectedId: string | null;
  systemConfig: any;
  simDay: number;
  onTravelDone: () => void;
  recenterTrigger: number;
}) {
  const { camera, controls } = useThree() as any;
  const travelling = useRef(false);
  const startPos = useRef(new THREE.Vector3());
  const goalPos = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const goalTarget = useRef(new THREE.Vector3());
  const progress = useRef(0);

  // Smooth easing — cubic ease in-out
  function easeInOut(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  useEffect(() => {
    if (recenterTrigger === 0) return;
    // Fly back to default overview position
    startPos.current.copy(camera.position);
    startTarget.current.copy(controls?.target ?? new THREE.Vector3());
    goalPos.current.set(0, AU_SCALE * 1.6, AU_SCALE * 2.0);
    goalTarget.current.set(0, 0, 0);
    progress.current = 0;
    travelling.current = true;
    if (controls) controls.enabled = false;
  }, [recenterTrigger]);

  useEffect(() => {
    if (!systemConfig) return;

    if (!selectedId) {
      // Deselect: just fix the orbit target, don't move camera
      if (controls) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        controls.target.copy(camera.position).addScaledVector(forward, 20);
        controls.enabled = true;
        controls.update();
      }
      return; // stop here — no travel animation on deselect
    }

    // Select: travel to the body
    const positions = computePositions(systemConfig, simDay);
    const pos = positions[selectedId];
    if (!pos) return;

    const wx = pos.x * AU_SCALE;
    const wz = pos.y * AU_SCALE;

    startPos.current.copy(camera.position);
    startTarget.current.copy(controls?.target ?? new THREE.Vector3());
    goalPos.current.set(wx, 10, wz + 16);
    goalTarget.current.set(wx, 0, wz);

    progress.current = 0;
    travelling.current = true;
    if (controls) controls.enabled = false; // disable during travel
  }, [selectedId]);

  useFrame((_, delta) => {
    if (!travelling.current) return;

    progress.current = Math.min(progress.current + delta * 0.7, 1);
    const t = easeInOut(progress.current);

    camera.position.lerpVectors(startPos.current, goalPos.current, t);

    if (controls) {
      controls.target.lerpVectors(startTarget.current, goalTarget.current, t);
      controls.update();
    }

    if (progress.current >= 1) {
      travelling.current = false;
      if (controls) controls.enabled = true;
      onTravelDone();
    }
  });

  return null;
}

// ─────────────────────────────────────────────────────────────────
// Individual body mesh
// ─────────────────────────────────────────────────────────────────

interface BodyMeshProps {
  id: string;
  position: { x: number; y: number };
  selected: boolean;
  hovered: boolean;
  onClick: () => void;
  onHover: (h: boolean) => void;
  simTime: number;
  cameraDistance: number;
}

function BodyMesh({
  id,
  position,
  selected,
  hovered,
  onClick,
  onHover,
  simTime,
  cameraDistance,
}: BodyMeshProps) {
  const matRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const x = position.x * AU_SCALE;
  const z = position.y * AU_SCALE;
  const size = BODY_SIZES[id] ?? 0.2;
  const col = new THREE.Color(BODY_COLOURS[id] ?? "#888888");
  const isVisitable = VISITABLE_IDS.has(id);
  const isStar = STAR_IDS.has(id);
  const isMoon = MOON_IDS.has(id);
  const isStation = id.endsWith("_station");

  // Show label based on camera distance threshold for moons
  const showLabel = !isMoon || cameraDistance < LABEL_SHOW_DISTANCE;

  useFrame((state, delta) => {
    if (matRef.current) {
      matRef.current.uTime += delta;
      matRef.current.uSelected = selected ? 1.0 : 0.0;
      matRef.current.uHovered = hovered ? 1.0 : 0.0;
      matRef.current.uEmissive = EMISSIVE[id] ?? 0.0;
    }
    // Slow self-rotation
    if (meshRef.current && !isStar) {
      meshRef.current.rotation.y += delta * 0.08;
    }
    // Pulse selection ring
    if (ringRef.current && selected) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.06;
      ringRef.current.scale.setScalar(s);
    }
  });

  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(false);
      }}
    >
      {/* Main body */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 48, 48]} />
        <planetShaderMaterial
          ref={matRef}
          uColor={col}
          uTime={0}
          uEmissive={EMISSIVE[id] ?? 0}
          uSelected={0}
          uHovered={0}
        />
      </mesh>

      {/* Star point light */}
      {isStar && (
        <pointLight
          intensity={id === "solara_prime" ? 10 : 5}
          distance={AU_SCALE * 12}
          color={BODY_COLOURS[id]}
        />
      )}

      {/* Glow disc for stars */}
      {isStar && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.1, size * 2.4, 64]} />
          <meshBasicMaterial
            color={BODY_COLOURS[id]}
            transparent
            opacity={0.06}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Hover ring — indigo glow circle */}
      {hovered && !selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.5, size * 1.7, 64]} />
          <meshBasicMaterial
            color="#7c3aed"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Selection ring — pulsing */}
      {selected && (
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.6, size * 1.85, 64]} />
          <meshBasicMaterial
            color="#a78bfa"
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Outer selection glow */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 2.0, size * 3.5, 64]} />
          <meshBasicMaterial
            color="#7c3aed"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Station diamond */}
      {isStation && (
        <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
          <boxGeometry args={[size * 1.5, size * 1.5, size * 1.5]} />
          <meshStandardMaterial
            color={BODY_COLOURS[id]}
            emissive={BODY_COLOURS[id]}
            emissiveIntensity={0.4}
          />
        </mesh>
      )}

      {/* HTML label — hidden for moons when zoomed out */}
      {showLabel && (
        <Html
          distanceFactor={60}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          <div
            style={{
              zIndex: 1,
              transform: "translateY(16px)",
              textAlign: "center",
              whiteSpace: "nowrap",
              fontFamily: "Lato, sans-serif",
              fontSize: isMoon || isStation ? "9px" : "11px",
              fontWeight: 600,
              letterSpacing: "0.03em",
              color: selected
                ? "#ffffff"
                : hovered
                  ? "#a78bfa"
                  : isVisitable
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.25)",
              textShadow: "0 0 8px rgba(0,0,0,1), 0 0 4px rgba(0,0,0,1)",
              background: "rgba(0,0,0,0.55)",
              padding: "1px 5px",
              borderRadius: "4px",
            }}
          >
            {BODY_NAMES[id]}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// Orbital ring
// ─────────────────────────────────────────────────────────────────

function OrbitalRing({
  radius,
  opacity = 0.18,
  dashed = false,
}: {
  radius: number;
  opacity?: number;
  dashed?: boolean;
}) {
  const segments = 128;
  const points = Array.from({ length: segments + 1 }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return new THREE.Vector3(
      Math.cos(a) * radius * AU_SCALE,
      0,
      Math.sin(a) * radius * AU_SCALE,
    );
  });
  return (
    <Line
      points={points}
      color="#6366f1"
      lineWidth={dashed ? 0.6 : 1.0}
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
  scenic,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  scenic: boolean;
}) {
  const fx = from.x * AU_SCALE,
    fz = from.y * AU_SCALE;
  const tx = to.x * AU_SCALE,
    tz = to.y * AU_SCALE;
  const mx = (fx + tx) / 2,
    mz = (fz + tz) / 2;
  const dist = Math.sqrt((tx - fx) ** 2 + (tz - fz) ** 2);

  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(fx, 0, fz),
    new THREE.Vector3(mx, dist * 0.18, mz),
    new THREE.Vector3(tx, 0, tz),
  );
  const points = Array.from({ length: 56 }, (_, i) => curve.getPoint(i / 55));

  return (
    <Line
      points={points}
      color={scenic ? "#f59e0b" : "#7c3aed"}
      lineWidth={1.2}
      transparent
      opacity={0.55}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// Scatter belt — particle field
// ─────────────────────────────────────────────────────────────────

function ScatterBelt() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const PARTICLES = 500;
  const dummy = new THREE.Object3D();

  useEffect(() => {
    if (!meshRef.current) return;
    for (let i = 0; i < PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = (1.8 + Math.random() * 0.8) * AU_SCALE;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 0.5;
      const scale = 0.01 + Math.random() * 0.04;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(scale);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLES]}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#5a5a6a" roughness={0.9} metalness={0.1} />
    </instancedMesh>
  );
}

// ─────────────────────────────────────────────────────────────────
// Compute all body positions from system config
// ─────────────────────────────────────────────────────────────────

function computePositions(
  systemConfig: any,
  simDay: number,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const bodyMap: Record<string, any> = {};

  for (const body of systemConfig.bodies ?? []) {
    bodyMap[body.id] = body;
  }

  // Add synthetic star entries if not in bodies array
  if (!bodyMap["solara_prime"]) {
    positions["solara_prime"] = { x: 0, y: 0 };
  }
  if (!bodyMap["solara_minor"] && systemConfig.stars?.solaraMinor) {
    const s = systemConfig.stars.solaraMinor;
    const p = {
      orbitalRadius: s.orbitalRadius,
      period: s.period,
      eccentricity: s.eccentricity ?? 0,
      startPhase: s.startPhase ?? 0,
    };
    const pos = {
      x: Math.cos((p.startPhase * Math.PI) / 180) * p.orbitalRadius,
      y: Math.sin((p.startPhase * Math.PI) / 180) * p.orbitalRadius,
    };
    const angle =
      (p.startPhase * Math.PI) / 180 + ((2 * Math.PI) / p.period) * simDay;
    const r = p.orbitalRadius * (1 - p.eccentricity * Math.cos(angle));
    positions["solara_minor"] = {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
    };
  } else {
    positions["solara_prime"] = { x: 0, y: 0 };
    // 0.08 AU is accurate but visually they overlap at scene scale — offset by 0.35 AU visually
    const minorAngle = ((2 * Math.PI) / 18) * simDay;
    positions["solara_minor"] = {
      x: 0.35 * Math.cos(minorAngle),
      y: 0.35 * Math.sin(minorAngle),
    };
  }

  // Lagrange stations at ±60° from solara_minor
  const minorAngle = Math.atan2(
    positions["solara_minor"].y,
    positions["solara_minor"].x,
  );
  const lagrangeR = 0.08;
  positions["l4_station"] = {
    x: lagrangeR * Math.cos(minorAngle + Math.PI / 3),
    y: lagrangeR * Math.sin(minorAngle + Math.PI / 3),
  };
  positions["l5_station"] = {
    x: lagrangeR * Math.cos(minorAngle - Math.PI / 3),
    y: lagrangeR * Math.sin(minorAngle - Math.PI / 3),
  };

  for (const body of systemConfig.bodies ?? []) {
    const p = {
      orbitalRadius: body.orbitalRadius,
      period: body.period,
      eccentricity: body.eccentricity ?? 0,
      startPhase: body.startPhase ?? 0,
    };
    const angle =
      (p.startPhase * Math.PI) / 180 + ((2 * Math.PI) / p.period) * simDay;
    const radius = p.orbitalRadius * (1 - p.eccentricity * Math.cos(angle));
    const localX = radius * Math.cos(angle);
    const localY = radius * Math.sin(angle);

    if (body.parent && positions[body.parent]) {
      // Moon orbital radii are astrophysically accurate but visually tiny at scene scale.
      // Apply a visual scale boost so moons orbit outside their parent's render sphere.
      const MOON_VISUAL_SCALE: Record<string, number> = {
        kalos: 12,
        thal: 16,
        mira: 22, // Vareth moons
        lun: 18,
        vael: 26, // Calyx moons
      };
      const boost = MOON_VISUAL_SCALE[body.id] ?? 1;
      positions[body.id] = {
        x: positions[body.parent].x + localX * boost,
        y: positions[body.parent].y + localY * boost,
      };
    } else {
      positions[body.id] = { x: localX, y: localY };
    }
  }

  return positions;
}

// ─────────────────────────────────────────────────────────────────
// The 3D scene
// ─────────────────────────────────────────────────────────────────

function StarSystemScene({
  systemConfig,
  simDay,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  cameraTarget,
  animateCamera,
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
  animateCamera: boolean;
  recenterTrigger: number;
  setTravelling: React.Dispatch<React.SetStateAction<boolean>>;
}) {
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
}

// ─────────────────────────────────────────────────────────────────
// Body List Panel — left side, lists all bodies sorted by distance
// ─────────────────────────────────────────────────────────────────

function BodyListPanel({
  onSelect,
  selectedId,
  onHoverBody,
  travelling,
}: {
  onSelect: (id: string) => void;
  selectedId: string | null;
  onHoverBody: (id: string | null) => void;
  travelling: boolean;
}) {
  const groups = [
    {
      label: "Stars & Inner",
      ids: [
        "solara_prime",
        "solara_minor",
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
}

// ─────────────────────────────────────────────────────────────────
// Instructions panel — togglable help overlay
// ─────────────────────────────────────────────────────────────────

function HelpPanel({ onClose }: { onClose: () => void }) {
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
}

// ─────────────────────────────────────────────────────────────────
// Planet side panel
// ─────────────────────────────────────────────────────────────────

function PlanetSidePanel({
  bodyId,
  onClose,
}: {
  bodyId: string;
  onClose: () => void;
}) {
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
      className="absolute top-0 right-0 bottom-0 w-80 bg-black/92 border-l border-white/8 backdrop-blur-xl z-20 flex flex-col overflow-hidden"
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
            <ImagePlaceholder
              aspectRatio="16/9"
              label={planetData.imageSlots.hero}
              rounded="rounded-none"
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
                    className="flex items-center justify-between gap-3 p-3 bg-surface-900/50 border border-white/6 hover:border-accent-600/30 rounded-xl transition-all text-left group"
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
}

// ─────────────────────────────────────────────────────────────────
// ResetCamera - to reset the camera's position
// ─────────────────────────────────────────────────────────────────

function ResetCamera({ trigger }: { trigger: number }) {
  const { camera, controls } = useThree() as any;
  useEffect(() => {
    if (trigger === 0) return;
    // Animate back to default position
    const target = new THREE.Vector3(0, AU_SCALE * 1.6, AU_SCALE * 2.0);
    const start = camera.position.clone();
    let t = 0;
    const id = setInterval(() => {
      t += 0.05;
      camera.position.lerpVectors(start, target, Math.min(t, 1));
      camera.lookAt(0, 0, 0);
      if (t >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [trigger]);

  useEffect(() => {
    if (trigger === 0) return;
    camera.position.set(0, AU_SCALE * 1.6, AU_SCALE * 2.0);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [trigger]);

  return null;
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
  const [animateCamera, setAnimateCamera] = useState(false);
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
                    animateCamera={animateCamera}
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
