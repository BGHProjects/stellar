import { AU_SCALE } from "@/constants/explorePage";
import { Line } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────
// Orbital ring
// ─────────────────────────────────────────────────────────────────

const OrbitalRing = ({
  radius,
  opacity = 0.18,
  dashed = false,
}: {
  radius: number;
  opacity?: number;
  dashed?: boolean;
}) => {
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
};

export default OrbitalRing;
