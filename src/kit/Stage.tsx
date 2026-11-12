import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useLayoutEffect } from "react";
import { useVideoConfig } from "remotion";
import * as THREE from "three";

/** Per-frame camera: position, look-at target and lens (mm on a 36mm-wide full-frame sensor, vertical video). */
export const Lens: React.FC<{
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
  readonly mm?: number;
  readonly roll?: number;
  readonly near?: number;
  readonly far?: number;
}> = ({ position, target, mm = 35, roll = 0, near = 0.01, far = 5000 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.setFocalLength(mm);
    camera.near = near;
    camera.far = far;
    camera.position.set(position[0], position[1], position[2]);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
  });
  return null;
};

/** ThreeCanvas with physically-based defaults. Tone mapping is applied by <PostFX/>. */
export const Stage: React.FC<{ readonly children: React.ReactNode; readonly background?: string }> = ({
  children,
  background = "#05070d",
}) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      flat
      shadows
      dpr={1}
      gl={{ antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      camera={{ fov: 40, near: 0.01, far: 5000 }}
      style={{ background }}
    >
      <color attach="background" args={[background]} />
      {children}
    </ThreeCanvas>
  );
};
