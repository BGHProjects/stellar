import {
  AU_SCALE,
  BODY_COLOURS,
  BODY_NAMES,
  BODY_SIZES,
  EMISSIVE,
  LABEL_SHOW_DISTANCE,
  MOON_IDS,
  STAR_IDS,
  VISITABLE_IDS,
} from "@/constants/explorePage";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

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

const BodyMesh = ({
  id,
  position,
  selected,
  hovered,
  onClick,
  onHover,
  cameraDistance,
}: BodyMeshProps) => {
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
          intensity={id === "taunor_prime" ? 10 : 5}
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
};

export default BodyMesh;
