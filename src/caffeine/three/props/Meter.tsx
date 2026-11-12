/**
 * OWNER: props3d. Data props for SH5: a glowing timer ring lying on the desk, a glass "caffeine level" cylinder,
 * and `project()` to pin 2D overlays to 3D points (same camera maths as kit/Stage <Lens/>).
 */
import { useMemo } from "react";
import * as THREE from "three";
import { K } from "../../theme";
import { dotTexture as glowTexture } from "./tex";

const cyanHot = new THREE.Color(K.cyan).multiplyScalar(2.2);

/** World point → screen px for a 1080x1920 frame, given the Lens params used that frame. */
export const project = (
  p: readonly [number, number, number],
  cam: { pos: readonly [number, number, number]; target: readonly [number, number, number]; mm: number },
  w = 1080,
  h = 1920,
): [number, number] => {
  const c = new THREE.PerspectiveCamera(40, w / h, 0.01, 100);
  c.setFocalLength(cam.mm);
  c.position.set(...cam.pos);
  c.lookAt(...cam.target);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(c);
  return [((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h];
};

const Arc: React.FC<{ r: number; from: number; to: number; tube: number; color: THREE.Color; opacity?: number }> = ({ r, from, to, tube, color, opacity = 1 }) => {
  const len = Math.max(0.0001, to - from);
  const q = Math.round(len * 400) / 400;
  const geo = useMemo(() => new THREE.TorusGeometry(r, tube, 8, Math.max(8, Math.round(q * 160)), q * Math.PI * 2), [r, tube, q]);
  if (to - from < 0.002) return null;
  // local torus runs CCW from +x; rotating its start to (12 o'clock − from − len) makes it read clockwise from `from`
  return (
    <mesh geometry={geo} rotation={[0, 0, Math.PI / 2 - (from + q) * Math.PI * 2]}>
      <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
};

/** Flat timer dial on the desk around a point. `a` = filled fraction (bright), `b` = extra range (soft). */
export const TimerRing: React.FC<{
  readonly position: readonly [number, number, number];
  readonly r?: number;
  readonly a: number;
  readonly b?: number;
  readonly show: number;
}> = ({ position, r = 0.62, a, b = 0, show }) => {
  if (show <= 0.001) return null;
  return (
    <group position={[position[0], position[1] + 0.006, position[2]]} rotation={[-Math.PI / 2, 0, 0]} scale={0.85 + 0.15 * show}>
      {/* track */}
      <mesh>
        <ringGeometry args={[r - 0.012, r + 0.012, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.16 * show} depthWrite={false} />
      </mesh>
      {/* minute ticks */}
      {new Array(12).fill(0).map((_, i) => {
        const ang = Math.PI / 2 - (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(ang) * (r + 0.07), Math.sin(ang) * (r + 0.07), 0]} rotation={[0, 0, ang]}>
            <planeGeometry args={[i % 3 === 0 ? 0.09 : 0.05, 0.014]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={(i % 3 === 0 ? 0.55 : 0.3) * show} depthWrite={false} />
          </mesh>
        );
      })}
      <Arc r={r} from={0} to={a * show} tube={0.022} color={cyanHot} />
      <Arc r={r} from={a} to={a + b * show} tube={0.018} color={cyanHot} opacity={0.45} />
    </group>
  );
};

/** Glass measuring cylinder with glowing cyan liquid; base at `position`, ~2.3 units tall. `level` 0..1. */
export const CaffeineTube: React.FC<{
  readonly position: readonly [number, number, number];
  readonly level: number;
  readonly marks?: number;
}> = ({ position, level, marks = 1 }) => {
  const H = 2.2;
  const R = 0.3;
  const glass = useMemo(() => {
    const pts = [
      [0.0005, 0],
      [R + 0.12, 0],
      [R + 0.12, 0.08],
      [R + 0.025, 0.1],
      [R + 0.025, H + 0.12],
      [R + 0.06, H + 0.16],
      [R + 0.045, H + 0.18],
      [R, H + 0.13],
      [R, 0.14],
      [0.0005, 0.13],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.LatheGeometry(pts, 96);
    g.computeVertexNormals();
    return g;
  }, []);
  const liquidH = Math.max(0.01, level * H);
  const pool = useMemo(glowTexture, []);
  return (
    <group position={position as [number, number, number]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <planeGeometry args={[R * 6, R * 6]} />
        <meshBasicMaterial map={pool} color={K.cyan} transparent opacity={0.35 + level * 0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, 0.14 + liquidH / 2, 0]}>
        <cylinderGeometry args={[R - 0.006, R - 0.006, liquidH, 64]} />
        <meshPhysicalMaterial color="#06222c" emissive={K.cyan} emissiveIntensity={0.55} roughness={0.15} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.14 + liquidH, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[R - 0.006, 64]} />
        <meshBasicMaterial color={new THREE.Color(K.cyan).multiplyScalar(1.8)} toneMapped={false} />
      </mesh>
      {[1, 0.5].map((m) => (
        <mesh key={m} position={[0, 0.14 + m * H, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R + 0.03, 0.008, 6, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7 * marks} toneMapped={false} />
        </mesh>
      ))}
      <mesh geometry={glass}>
        <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={0.06} ior={1.5} roughness={0.04} envMapIntensity={1.4} clearcoat={0.6} />
      </mesh>
      <pointLight position={[0, 0.14 + liquidH * 0.6, 0.6]} color={K.cyan} intensity={0.9 * level} distance={4} decay={2} />
    </group>
  );
};

export const TUBE_H = 2.2;
export const TUBE_BASE = 0.14;
