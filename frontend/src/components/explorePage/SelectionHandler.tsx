import { AU_SCALE } from "@/constants/explorePage";
import computePositions from "@/helpers/explorePage/computePositions";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const SelectionHandler = ({
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
}) => {
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
};

export default SelectionHandler;
