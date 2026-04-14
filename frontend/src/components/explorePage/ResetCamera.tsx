import { AU_SCALE } from "@/constants/explorePage";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────
// ResetCamera - to reset the camera's position
// ─────────────────────────────────────────────────────────────────

const ResetCamera = ({ trigger }: { trigger: number }) => {
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
};

export default ResetCamera;
