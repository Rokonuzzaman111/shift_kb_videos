/**
 * OWNER: 3D agent. NVL / DGX-style liquid-cooled compute tray in a rack, units = cm.
 * The rack opening is centred at x = 0, tray front face at z = 0 when fully inserted (slide = 1);
 * at slide = 0 the tray is pulled out 52 cm toward +Z so its open top is visible.
 * Inside: motherboard, 4 GpuChips (2×2) under nickel-copper cold plates, 2 Grace-style CPUs,
 * copper coolant loops to a rear manifold with blue/red quick-disconnects, cable looms, front I/O panel.
 *
 *  - slide   0..1 tray slides into the rack
 *  - plates  0..1 cold plates seated (0 = lifted 6 cm, chips exposed). Default 1.
 *  - glow    0..1 passes to the chips (die energy traces) — visible when plates < 1
 *  - leds    0..1 front-panel status LEDs
 */
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { Lens, Stage } from "../../kit/Stage";
import { N } from "../theme";
import { type FXProps, NvFX } from "./FX";
import { GpuChip } from "./GpuChip";
import { Inst, type Xf } from "./Inst";
import { type Cam, StudioRig, type V3 } from "./Studio";
import { brushedTextures, mulberry32, pcbTextures, rackFaceTextures, smudgeTexture } from "./tex";

const TW = 44; // tray width (x)
const TH = 4.4; // 1U height
const TD = 80; // depth (z, front at 0, back at -TD)
const CHIPS: [number, number][] = [
  [-9.5, -16],
  [9.5, -16],
  [-9.5, -32],
  [9.5, -32],
];
const CPUS: [number, number][] = [
  [-9.5, -50],
  [9.5, -50],
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const useTrayMaterials = () =>
  useMemo(() => {
    const b = brushedTextures(5);
    const pcb = pcbTextures();
    const sm = smudgeTexture(6);
    const rep = (t: THREE.Texture, r: number) => {
      const c = t.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(r, r);
      c.needsUpdate = true;
      return c;
    };
    const face = rackFaceTextures(1);
    return {
      steel: new THREE.MeshPhysicalMaterial({ color: "#6e7378", metalness: 1, roughness: 0.9, roughnessMap: rep(b.roughnessMap, 1.5), bumpMap: rep(b.bumpMap, 1.5), bumpScale: 0.2, anisotropy: 0.5 }),
      darkSteel: new THREE.MeshStandardMaterial({ color: "#1b1e21", metalness: 0.7, roughness: 0.45 }),
      pcb: new THREE.MeshPhysicalMaterial({ map: rep(pcb.map, 2.5), normalMap: rep(pcb.normalMap, 2.5), roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
      plate: new THREE.MeshPhysicalMaterial({ color: "#c9cdd2", metalness: 1, roughness: 0.25, roughnessMap: rep(sm, 1), clearcoat: 0.3, clearcoatRoughness: 0.1 }),
      plateTop: new THREE.MeshPhysicalMaterial({ color: "#c9ccd1", metalness: 1, roughness: 0.16, roughnessMap: rep(sm, 1.3) }),
      copper: new THREE.MeshPhysicalMaterial({ color: "#c97a4e", metalness: 1, roughness: 0.28, clearcoat: 0.5, clearcoatRoughness: 0.15 }),
      fitting: new THREE.MeshStandardMaterial({ color: "#d4d7db", metalness: 1, roughness: 0.2 }),
      blue: new THREE.MeshPhysicalMaterial({ color: "#1d63d8", roughness: 0.3, clearcoat: 0.8 }),
      red: new THREE.MeshPhysicalMaterial({ color: "#c8231d", roughness: 0.3, clearcoat: 0.8 }),
      cable: new THREE.MeshStandardMaterial({ color: "#0b0b0c", roughness: 0.55 }),
      choke: new THREE.MeshStandardMaterial({ color: "#3a3c40", metalness: 0.5, roughness: 0.5 }),
      ic: new THREE.MeshPhysicalMaterial({ color: "#101112", roughness: 0.4, clearcoat: 0.3 }),
      cap: new THREE.MeshStandardMaterial({ color: "#8a6a45", roughness: 0.55 }),
      dimm: new THREE.MeshStandardMaterial({ color: "#0d1a12", roughness: 0.5 }),
      green: new THREE.MeshBasicMaterial({ color: new THREE.Color(N.green).multiplyScalar(1.2), toneMapped: false }),
      led: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
      faceTex: face.map,
      neighbour: new THREE.MeshStandardMaterial({ map: face.map, roughnessMap: face.roughnessMap, metalness: 0.6, roughness: 1 }),
    };
  }, []);

const pipe = (pts: V3[], r = 0.36) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.2), 64, r, 12, false);

export const GpuTray: React.FC<{
  readonly slide?: number;
  readonly plates?: number;
  readonly glow?: number;
  readonly leds?: number;
  readonly neighbours?: boolean;
}> = ({ slide = 1, plates = 1, glow = 0, leds = 1, neighbours = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = useTrayMaterials();
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const floorY = 0.12;
  const pcbY = floorY + 0.6;
  const chipY = pcbY + 0.16;
  const plateLift = (1 - clamp01(plates)) * 6;
  const plateY = chipY + 0.32 + plateLift;
  const geo = useMemo(() => {
    const loops: THREE.TubeGeometry[] = [];
    const fy = 3.3; // top of a seated cold-plate fitting
    const hi = 4.0;
    for (const [x] of CHIPS.slice(0, 2)) {
      const A = (cz: number): V3 => [x + 2.2, fy, cz + 2.0];
      const B = (cz: number): V3 => [x - 2.2, fy, cz - 2.0];
      const up = (p: V3, h = hi): V3 => [p[0], h, p[2]];
      const a1 = A(-16);
      loops.push(pipe([[x + 3.5, 2.4, -72], [x + 3.5, hi, -66], [a1[0] + 0.6, hi, -24], up(a1), a1]));
      const b1 = B(-16);
      const a2 = A(-32);
      loops.push(pipe([b1, up(b1), [x, hi + 0.4, -24], up(a2), a2]));
      const b2 = B(-32);
      loops.push(pipe([b2, up(b2), [x - 1.5, hi, -42], [x, 3.6, -48], [x, 2.3, -50]]));
      loops.push(pipe([[x + 1.6, 2.3, -51], [x + 2.2, 3.8, -58], [x - 3.5, hi - 0.3, -66], [x - 3.5, 2.4, -72]]));
    }
    const cables: THREE.TubeGeometry[] = [];
    for (const sx of [-1, 1])
      for (let k = 0; k < 5; k++)
        cables.push(
          pipe(
            [
              [sx * (20.3 - k * 0.5), 1.0 + k * 0.15, -4],
              [sx * (20.5 - k * 0.5), 1.2 + k * 0.12, -30],
              [sx * (19 - k * 0.6), 1.6, -60],
              [sx * (8 + k * 1.4), 1.2, -74],
            ],
            0.22,
          ),
        );
    return { loops, cables };
  }, []);
  const dimms = useMemo(() => {
    const it: Xf[] = [];
    for (const [cx, cz] of CPUS) for (let k = 0; k < 8; k++) it.push({ p: [cx + (k < 4 ? -6 : 6) + (k % 4) * 0.6 - 0.9, pcbY + 0.6, cz], s: [0.12, 1.1, 7] });
    return it;
  }, [pcbY]);
  const parts = useMemo(() => {
    const r = mulberry32(404);
    const chokes: Xf[] = [];
    const ics: Xf[] = [];
    const caps: Xf[] = [];
    const conns: Xf[] = [];
    for (const [cx, cz] of [...CHIPS, ...CPUS]) {
      for (const sz of [-1, 1]) {
        for (let k = 0; k < 9; k++) chokes.push({ p: [cx - 3.6 + k * 0.9, pcbY + 0.45, cz + sz * 4.3], s: [0.75, 0.75, 0.75] });
        for (let k = 0; k < 18; k++) caps.push({ p: [cx - 3.8 + k * 0.45, pcbY + 0.2, cz + sz * 5.3], s: [0.25, 0.3, 0.5] });
      }
    }
    for (let i = 0; i < 60; i++) {
      const x = (r() - 0.5) * 38;
      const z = -6 - r() * 62;
      const near = [...CHIPS, ...CPUS].some(([cx, cz]) => Math.abs(x - cx) < 6 && Math.abs(z - cz) < 6.5);
      if (near) continue;
      const w = 0.6 + r() * 1.6;
      ics.push({ p: [x, pcbY + 0.15, z], s: [w, 0.18, w * (0.6 + r() * 0.6)] });
    }
    for (let k = 0; k < 8; k++) conns.push({ p: [-16 + k * 4.6, pcbY + 0.9, -64], s: [3.4, 1.6, 2.2] });
    return { chokes, ics, caps, conns };
  }, [pcbY]);
  const vents = useMemo(() => {
    const it: Xf[] = [];
    for (let x = -TW / 2 + 2; x < -4; x += 0.55) it.push({ p: [x, TH / 2, 0.06], s: [0.32, TH - 1.6, 0.04] });
    return it;
  }, []);
  const ledItems = useMemo(() => {
    const it: Xf[] = [];
    for (let k = 0; k < 6; k++) it.push({ p: [4 + k * 1.1, TH - 0.9, 0.12], s: [0.35, 0.18, 0.05] });
    return it;
  }, []);
  const t = frame / fps;
  const blink = (k: number) => ((t * (1.2 + k * 0.7) + k * 0.31) % 1 < 0.55 ? 1 : 0.15);
  m.led.color.setRGB(0.3 * 3 * leds * blink(0), 1.0 * 3 * leds * blink(1), 0.2 * 3 * leds);
  const z = (1 - clamp01(slide)) * 52;
  return (
    <group>
      {/* rack posts + neighbouring trays (static) */}
      {neighbours ? (
        <>
          {[-1, 1].map((sx) => (
            <mesh key={sx} material={m.darkSteel} position={[sx * (TW / 2 + 1.2), 0, -1]}>
              <boxGeometry args={[1.6, 80, 2]} />
            </mesh>
          ))}
          {[-3, -2, -1, 1, 2, 3, 4].map((k) => (
            <group key={k} position={[0, k * (TH + 0.05), 0]}>
              <mesh material={m.darkSteel} position={[0, TH / 2, -TD / 2]}>
                <boxGeometry args={[TW, TH, TD]} />
              </mesh>
              <mesh material={m.neighbour} position={[0, TH / 2, 0.02]}>
                <planeGeometry args={[TW, TH - 0.2]} />
              </mesh>
              <mesh material={m.green} position={[TW / 2 - 6, TH - 0.6, 0.05]}>
                <planeGeometry args={[3, 0.12]} />
              </mesh>
            </group>
          ))}
          {/* dark cavity behind our tray */}
          <mesh material={m.darkSteel} position={[0, TH / 2, -TD - 1]}>
            <planeGeometry args={[TW, TH]} />
          </mesh>
        </>
      ) : null}
      <group position={[0, 0, z]}>
        {/* chassis pan + side walls + rear wall */}
        <mesh material={m.steel} position={[0, floorY / 2, -TD / 2]} castShadow receiveShadow>
          <boxGeometry args={[TW, floorY, TD]} />
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={sx} material={m.steel} position={[sx * (TW / 2 - 0.05), TH / 2, -TD / 2]} castShadow receiveShadow>
            <boxGeometry args={[0.1, TH, TD]} />
          </mesh>
        ))}
        {/* front panel */}
        <group>
          <RoundedBox args={[TW + 1.6, TH, 0.25]} radius={0.08} smoothness={2} position={[0, TH / 2, 0]} material={m.darkSteel} castShadow />
          <Inst geometry={box} material={m.cable} items={vents} />
          <Inst geometry={box} material={m.led} items={ledItems} />
          <mesh material={m.green} position={[12, TH / 2, 0.14]}>
            <planeGeometry args={[6, 0.14]} />
          </mesh>
          {[-1, 1].map((sx) => (
            <mesh key={sx} material={m.fitting} position={[sx * (TW / 2 - 0.2), TH / 2, 1.0]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[1.0, 0.18, 8, 24, Math.PI]} />
            </mesh>
          ))}
        </group>
        {/* motherboard */}
        <mesh material={[m.pcb, m.pcb, m.pcb, m.pcb, m.pcb, m.pcb]} position={[0, pcbY, -TD / 2 - 2]} receiveShadow>
          <boxGeometry args={[TW - 1.2, 0.16, TD - 10]} />
        </mesh>
        <Inst geometry={box} material={m.dimm} items={dimms} />
        <Inst geometry={box} material={m.choke} items={parts.chokes} castShadow />
        <Inst geometry={box} material={m.ic} items={parts.ics} />
        <Inst geometry={box} material={m.cap} items={parts.caps} />
        <Inst geometry={box} material={m.cable} items={parts.conns} castShadow />
        <mesh material={m.copper} position={[0, pcbY + 0.6, -69]}>
          <boxGeometry args={[38, 1.0, 0.5]} />
        </mesh>
        {/* GPUs + cold plates */}
        {CHIPS.map(([x, cz], i) => (
          <group key={i} position={[x, 0, cz]}>
            <GpuChip position={[0, chipY, 0]} glow={glow} pads={false} />
            <group position={[0, plateY, 0]}>
              <RoundedBox args={[7.4, 1.1, 6.4]} radius={0.15} smoothness={3} position={[0, 0.55, 0]} material={m.plate} castShadow receiveShadow />
              <RoundedBox args={[5.6, 0.25, 4.6]} radius={0.1} smoothness={2} position={[0, 1.15, 0]} material={m.plateTop} castShadow />
              {[-1, 1].map((sx) => (
                <mesh key={sx} material={m.fitting} position={[sx * 2.2, 1.6, sx * 2.0]}>
                  <cylinderGeometry args={[0.6, 0.6, 1.0, 20]} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
        {CPUS.map(([x, cz], i) => (
          <group key={i} position={[x, plateY - 0.1, cz]}>
            <RoundedBox args={[5.2, 1.0, 5.2]} radius={0.15} smoothness={3} position={[0, 0.5, 0]} material={m.plate} castShadow />
          </group>
        ))}
        {/* coolant loops (rise with the plates) */}
        <group position={[0, plateLift, 0]}>
          {geo.loops.map((g, i) => (
            <mesh key={i} geometry={g} material={m.copper} castShadow />
          ))}
        </group>
        {/* rear manifold + quick disconnects */}
        <mesh material={m.fitting} position={[0, 2.4, -72.5]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.9, 0.9, 30, 24]} />
        </mesh>
        {[-12, -7, 7, 12].map((x, i) => (
          <mesh key={x} material={i % 2 ? m.red : m.blue} position={[x, 2.4, -75]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.8, 0.8, 3, 20]} />
          </mesh>
        ))}
        {geo.cables.map((g, i) => (
          <mesh key={i} geometry={g} material={m.cable} castShadow />
        ))}
      </group>
    </group>
  );
};

/** Close-up tray shot (rack around it). `t` 0..1 drives a slow dolly; `camera` overrides. */
export const GpuTrayShot: React.FC<
  React.ComponentProps<typeof GpuTray> & { readonly t?: number; readonly camera?: Cam; readonly fx?: Partial<FXProps> }
> = ({ t = 0, camera, fx, ...tray }) => {
  const zOut = (1 - clamp01(tray.slide ?? 1)) * 52;
  const target: V3 = [0, 2, zOut - 32 + t * 6];
  const cam: Cam = camera ?? { pos: [30 - t * 14, 34 - t * 8, zOut + 30 - t * 8], target, mm: 32, focus: 55 - t * 12, range: 40 };
  return (
    <Stage background={N.bg}>
      <Lens position={cam.pos} target={cam.target} mm={cam.mm ?? 35} roll={cam.roll} near={0.5} far={2000} />
      <fog attach="fog" args={[new THREE.Color(N.bg), 120, 320]} />
      <StudioRig size={40} floor={false} env={1.1} accent={0.3} />
      <GpuTray {...tray} />
      <NvFX focus={cam.focus} focusRange={cam.range ?? 40} {...fx} />
    </Stage>
  );
};
