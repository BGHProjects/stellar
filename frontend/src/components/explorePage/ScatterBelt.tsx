import { AU_SCALE } from "@/constants/explorePage";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────
// Scatter belt — particle field
// ─────────────────────────────────────────────────────────────────

const ScatterBelt = () => {
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
};

export default ScatterBelt;
