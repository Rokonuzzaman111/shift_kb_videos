/**
 * OWNER: props3d agent.
 * Night study desk set, complete with its own light rig (1 unit = 10 cm, desk surface at y = 0, camera side = +z):
 * varnished walnut desk against a dark plaster wall with a night window (moon), open Bangla textbook + pencil,
 * book stack, architect desk lamp (warm shadow-casting spot + emissive bulb), twin-bell alarm clock showing
 * `clockHours`, and the TeaCup at CUP_POS.
 *  - lampOn: 0..1 warm lamp; at 0 the room falls to dim moonlight blue.
 *  - steam: passes to the cup. Optional: cupFill, cupGlow, showCup, showClock, env (HDRI reflection strength).
 * CLOCK_POS = centre of the clock dial (feet on the desk). CUP_POS / BOOK_POS = base centres on the desk.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { HDRI, Lighting } from "../../kit/assets";
import { AlarmClock, CLOCK_FOOT_Y } from "./props/AlarmClock";
import { BookStack, DeskLamp, NightWindow, OpenBook, Pencil } from "./props/DeskProps";
import { plasterTexture, woodTextures } from "./props/tex";
import { TeaCup } from "./TeaCup";

export const CUP_POS: [number, number, number] = [1.45, 0, 1.25];
export const CLOCK_POS: [number, number, number] = [0.15, -CLOCK_FOOT_Y * 0.9, -0.95];
export const BOOK_POS: [number, number, number] = [-1.15, 0, 0.75];
export const CUP_SCALE = 0.9;
export const CLOCK_SCALE = 0.9;
export const LAMP_HEAD: [number, number, number] = [1.15, 3.55, -0.55];
export const WALL_Z = -3.2;

const DESK_W = 16;
const DESK_D = 7;

const DeskTop: React.FC = () => {
  const { map, rough } = useMemo(() => {
    const w = woodTextures();
    const m = w.map.clone();
    const r = w.rough.clone();
    for (const t of [m, r]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(DESK_W / 4, DESK_D / 4);
      t.needsUpdate = true;
    }
    return { map: m, rough: r };
  }, []);
  return (
    <mesh position={[0, -0.175, WALL_Z + DESK_D / 2]} receiveShadow>
      <boxGeometry args={[DESK_W, 0.35, DESK_D]} />
      <meshPhysicalMaterial map={map} roughnessMap={rough} roughness={1} bumpMap={rough} bumpScale={0.12} clearcoat={0.35} clearcoatRoughness={0.28} />
    </mesh>
  );
};

const Wall: React.FC<{ lampOn: number }> = () => {
  const tex = useMemo(() => {
    const t = plasterTexture().clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 3);
    t.needsUpdate = true;
    return t;
  }, []);
  return (
    <mesh position={[0, 5, WALL_Z]} receiveShadow>
      <planeGeometry args={[34, 16]} />
      <meshStandardMaterial map={tex} color="#7a6656" roughness={0.95} />
    </mesh>
  );
};

export const Desk: React.FC<{
  readonly t: number;
  readonly clockHours?: number;
  readonly lampOn?: number;
  readonly steam?: number;
  readonly cupFill?: number;
  readonly cupGlow?: number;
  readonly showCup?: boolean;
  readonly showClock?: boolean;
  readonly env?: number;
}> = ({ t, clockHours = 2, lampOn = 1, steam = 0.7, cupFill = 0.82, cupGlow = 0, showCup = true, showClock = true, env = 0.22 }) => {
  const moon = 1 - lampOn;
  return (
    <group>
      <Lighting hdri={HDRI.studio} intensity={env * (0.3 + 0.7 * lampOn)} rotation={1.2} />
      <fog attach="fog" args={["#090605", 10, 30]} />
      <hemisphereLight args={["#ffd7ae", "#1a0f08", 0.05 + 0.12 * lampOn]} />
      {/* moonlight through the window (cool rim), stronger when the lamp is off */}
      <directionalLight position={[-6, 6, -2]} color="#86a6ff" intensity={0.25 + moon * 0.9} />
      <pointLight position={[-3.2, 4.2, -2.4]} color="#5f7fd6" intensity={0.6 + moon * 2.5} distance={10} decay={2} />

      <DeskTop />
      <Wall lampOn={lampOn} />
      <NightWindow position={[-3.3, 4.6, WALL_Z + 0.01]} />

      <DeskLamp base={[3.3, 0, -1.9]} head={LAMP_HEAD} aim={[0.1, 0, 0.9]} on={lampOn} />
      <OpenBook position={BOOK_POS} rotationY={0.1} />
      <Pencil position={[-0.2, 0, 2.3]} rotationY={-0.35} />
      <BookStack position={[-3.6, 0, -1.9]} rotationY={0.25} />
      {showClock ? <AlarmClock hours={clockHours} t={t} position={CLOCK_POS} rotationY={0.18} scale={CLOCK_SCALE} /> : null}
      {showCup ? <TeaCup t={t} position={CUP_POS} scale={CUP_SCALE} steam={steam} fill={cupFill} caffeineGlow={cupGlow} /> : null}
    </group>
  );
};
