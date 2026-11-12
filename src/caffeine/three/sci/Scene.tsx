/**
 * Scene pieces shared by the science3d shots: lighting rig, depth bokeh specks, camera.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { HDRI, Lighting } from "../../../kit/assets";
import { Lens } from "../../../kit/Stage";
import { handheld } from "../../../kit/time";
import { aimAt, glowTexture, rnd } from "./util";

type V3 = readonly [number, number, number];

/** Warm studio lighting: HDRI fill + warm key + cool/amber rims. `dim` lowers everything. */
export const SciLights: React.FC<{ readonly dim?: number; readonly rim?: string; readonly env?: number; readonly t?: number }> = ({
  dim = 0,
  rim = "#ff9d6b",
  env = 0.4,
  t = 0,
}) => {
  const k = 1 - dim * 0.65;
  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={env * k} rotation={0.6 + t * 0.02} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.6 * k}
        color="#ffe7cf"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-4, 2.5, -4]} intensity={2.6 * k} color={rim} />
      <directionalLight position={[2, -3, -3]} intensity={0.9 * k} color="#5fb8ff" />
    </>
  );
};

/** Out-of-focus floating specks for depth (cytoplasm). Deterministic drift. */
export const Specks: React.FC<{
  readonly t: number;
  readonly count?: number;
  readonly center?: V3;
  readonly spread?: V3;
  readonly opacity?: number;
  readonly seed?: string;
}> = ({ t, count = 40, center = [0, 1, 0], spread = [8, 5, 8], opacity = 0.18, seed = "sp" }) => {
  const specks = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        p: [rnd(`${seed}x${i}`, -0.5, 0.5) * spread[0], rnd(`${seed}y${i}`, -0.5, 0.5) * spread[1], rnd(`${seed}z${i}`, -0.5, 0.5) * spread[2]],
        s: rnd(`${seed}s${i}`, 0.05, 0.22),
        c: rnd(`${seed}c${i}`) < 0.75 ? "#ffcfa0" : "#9fe6ff",
        ph: rnd(`${seed}p${i}`, 0, 6.28),
      })),
    [count, seed, spread],
  );
  const tex = glowTexture();
  return (
    <group position={center as [number, number, number]}>
      {specks.map((s, i) => (
        <sprite key={i} position={[s.p[0] + Math.sin(t * 0.2 + s.ph) * 0.15, s.p[1] + Math.sin(t * 0.15 + s.ph * 2) * 0.12, s.p[2]]} scale={[s.s, s.s, 1]}>
          <spriteMaterial map={tex} color={s.c} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  );
};

/** Camera that frames `subject` at y≈850 px; returns focus distance for DOF via render prop-free helper. */
export const Cam: React.FC<{ readonly pos: V3; readonly subject: V3; readonly mm: number; readonly t: number; readonly y?: number; readonly shake?: number }> = ({
  pos,
  subject,
  mm,
  t,
  y = 850,
  shake = 0.004,
}) => {
  const hh = handheld(t, shake, 3);
  const p: [number, number, number] = [pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]];
  return <Lens mm={mm} position={p} target={aimAt(p, subject, mm, y)} />;
};
