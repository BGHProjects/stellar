import { AU_SCALE } from "@/constants/explorePage";
import { Line } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────
// Route arc between two bodies
// ─────────────────────────────────────────────────────────────────

const RouteArc = ({
  from,
  to,
  scenic,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  scenic: boolean;
}) => {
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
};

export default RouteArc;
