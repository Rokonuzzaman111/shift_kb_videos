/**
 * OWNER: 3D agent. NVIDIA AI accelerator package (H100 / Blackwell-class), units = cm, centred on origin,
 * sitting on y = 0 (substrate bottom). Footprint 7.0 × 6.0, total height ≈ 0.3 (0.55 with lid).
 *
 *  - explode 0..1  breakdown: interposer, HBM stacks (layers fan apart), die and lid lift apart
 *  - glow    0..1  green energy pulses racing across the die (emissive, blooms) + green light spill
 *  - spin          turns around Y (1 = full turn)
 *  - lid     0..1  nickel heat-spreader present (0 = bare die, default); fades by sliding down from above
 *  - flowSpeed     pulses per second multiplier
 */
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { N } from "../theme";
import type { FXProps } from "./FX";
import { Inst, type Xf } from "./Inst";
import { type Cam, orbit, Studio, type V3 } from "./Studio";
import { dieTextures, filmTexture, hbmTextures, lidTextures, mulberry32, smudgeTexture, substrateTextures, traceTexture } from "./tex";

export const CHIP = { w: 7, d: 6, sub: 0.14, inter: 0.07, die: 0.075, dieW: 2.6, dieD: 3.3, hbmW: 0.8, hbmD: 1.02 };

const traceVert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const traceFrag = /* glsl */ `
uniform sampler2D map; uniform float time; uniform float amount; uniform vec3 color;
varying vec2 vUv;
void main(){
  vec4 t = texture2D(map, vUv);
  float d = fract(time + t.b - t.g * 1.6);
  float head = exp(-d * 18.0) + exp(-fract(d + 0.5) * 30.0) * 0.5;
  float g = t.r * (0.12 + 3.2 * head) * amount;
  gl_FragColor = vec4(color * g, 1.0);
}`;

const useMaterials = () =>
  useMemo(() => {
    const sub = substrateTextures();
    const die = dieTextures();
    const lid = lidTextures();
    const hbm = hbmTextures();
    const smudge = smudgeTexture(2);
    return {
      substrate: new THREE.MeshPhysicalMaterial({
        map: sub.map,
        normalMap: sub.normalMap,
        normalScale: new THREE.Vector2(0.6, 0.6),
        roughnessMap: sub.roughnessMap,
        roughness: 0.75,
        clearcoat: 0.7,
        clearcoatRoughness: 0.22,
        clearcoatRoughnessMap: sub.roughnessMap,
      }),
      substrateEdge: new THREE.MeshStandardMaterial({ color: "#1a1e17", roughness: 0.6 }),
      die: new THREE.MeshPhysicalMaterial({
        map: die.map,
        color: "#5e646c",
        metalness: 1,
        roughness: 1,
        roughnessMap: die.roughnessMap,
        normalMap: die.normalMap,
        normalScale: new THREE.Vector2(0.12, 0.12),
        iridescence: 0.75,
        iridescenceIOR: 1.7,
        iridescenceThicknessMinimum: 250,
        iridescenceThicknessMaximum: 650,
        iridescenceThicknessMap: filmTexture(),
        envMapIntensity: 1.0,
      }),
      dieEdge: new THREE.MeshStandardMaterial({ color: "#3a3f46", metalness: 0.8, roughness: 0.35 }),
      interposer: new THREE.MeshPhysicalMaterial({ color: "#6a7078", metalness: 0.9, roughness: 0.22, roughnessMap: smudge, iridescence: 0.35, iridescenceIOR: 1.5, iridescenceThicknessMinimum: 300, iridescenceThicknessMaximum: 520, iridescenceThicknessMap: filmTexture() }),
      underfill: new THREE.MeshPhysicalMaterial({ color: "#16130f", roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
      hbm: new THREE.MeshPhysicalMaterial({ map: hbm.map, color: "#70767e", metalness: 0.85, roughness: 1, roughnessMap: hbm.roughnessMap, clearcoat: 0.3, clearcoatRoughness: 0.1 }),
      hbmLayer: new THREE.MeshStandardMaterial({ color: "#4a5058", metalness: 0.9, roughness: 0.3 }),
      capBody: new THREE.MeshStandardMaterial({ color: "#8a6a45", roughness: 0.55 }),
      capEnd: new THREE.MeshStandardMaterial({ color: "#d8d8d4", metalness: 1, roughness: 0.28 }),
      gold: new THREE.MeshStandardMaterial({ color: "#e0b45a", metalness: 1, roughness: 0.22, roughnessMap: smudge }),
      lid: new THREE.MeshPhysicalMaterial({ map: lid.map, color: "#a4a8ae", metalness: 1, roughness: 1, roughnessMap: lid.roughnessMap, clearcoat: 0.3, clearcoatRoughness: 0.15 }),
      lidEdge: new THREE.MeshStandardMaterial({ color: "#b8bcc2", metalness: 1, roughness: 0.25, roughnessMap: smudge }),
      trace: new THREE.ShaderMaterial({
        vertexShader: traceVert,
        fragmentShader: traceFrag,
        uniforms: { map: { value: traceTexture() }, time: { value: 0 }, amount: { value: 0 }, color: { value: new THREE.Color(N.greenHi).multiplyScalar(1.6) } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    };
  }, []);

/** Layout of the SMD capacitors around the interposer and at the substrate corners (deterministic). */
const capLayout = () => {
  const r = mulberry32(5);
  const bodies: Xf[] = [];
  const ends: Xf[] = [];
  const L = 0.1;
  const Wd = 0.05;
  const add = (x: number, z: number, rotY: number) => {
    if (r() < 0.12) return;
    const h = 0.045;
    bodies.push({ p: [x, CHIP.sub + h / 2, z], r: [0, rotY, 0], s: [L * 0.6, h, Wd] });
    const dx = Math.cos(rotY) * L * 0.4;
    const dz = -Math.sin(rotY) * L * 0.4;
    ends.push({ p: [x + dx, CHIP.sub + h / 2, z + dz], r: [0, rotY, 0], s: [L * 0.2, h * 1.04, Wd * 1.04] });
    ends.push({ p: [x - dx, CHIP.sub + h / 2, z - dz], r: [0, rotY, 0], s: [L * 0.2, h * 1.04, Wd * 1.04] });
  };
  // two rings around the interposer
  for (const [ix, iz, step] of [
    [2.62, 1.98, 0.13],
    [2.8, 2.14, 0.13],
    [3.15, 2.55, 0.17],
  ] as const) {
    for (let x = -ix; x <= ix; x += step) {
      add(x, -iz, Math.PI / 2);
      add(x, iz, Math.PI / 2);
    }
    for (let z = -iz + step; z < iz; z += step) {
      add(-ix, z, 0);
      add(ix, z, 0);
    }
  }
  // corner arrays
  for (const [cx, cz] of [
    [-3.1, -2.65],
    [3.1, -2.65],
    [-3.1, 2.65],
    [3.1, 2.65],
  ] as const) {
    for (let k = 0; k < 10; k++) add(cx + (r() - 0.5) * 0.5, cz + (r() - 0.5) * 0.4, r() < 0.5 ? 0 : Math.PI / 2);
  }
  return { bodies, ends };
};

const padLayout = () => {
  const pads: Xf[] = [];
  const pitch = 0.1;
  for (let x = -CHIP.w / 2 + 0.25; x <= CHIP.w / 2 - 0.25; x += pitch) {
    for (let z = -CHIP.d / 2 + 0.25; z <= CHIP.d / 2 - 0.25; z += pitch) {
      if (Math.abs(x) < 0.8 && Math.abs(z) < 0.6) continue; // centre keep-out
      pads.push({ p: [x, -0.003, z] });
    }
  }
  return pads;
};

export const GpuChip: React.FC<{
  readonly explode?: number;
  readonly glow?: number;
  readonly spin?: number;
  readonly lid?: number;
  readonly flowSpeed?: number;
  readonly position?: readonly [number, number, number];
  readonly scale?: number;
  readonly rotation?: readonly [number, number, number];
  /** hide gold pads underneath (perf when never seen) */
  readonly pads?: boolean;
}> = ({ explode = 0, glow = 0, spin = 0, lid = 0, flowSpeed = 1, position = [0, 0, 0], scale = 1, rotation = [0, 0, 0], pads = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = useMaterials();
  const caps = useMemo(() => capLayout(), []);
  const padItems = useMemo(() => padLayout(), []);
  const geo = useMemo(
    () => ({
      box: new THREE.BoxGeometry(1, 1, 1),
      pad: new THREE.CylinderGeometry(0.034, 0.034, 0.008, 12),
    }),
    [],
  );
  const e = explode;
  const yInter = CHIP.sub + e * 0.9;
  const yHbm = yInter + CHIP.inter + e * 1.1;
  const yDie = yInter + CHIP.inter + e * 2.3;
  const layerGap = e * 0.07;
  const hbmX = CHIP.dieW / 2 + 0.14 + CHIP.hbmW / 2;
  const hbmPos: [number, number][] = [];
  for (const sx of [-1, 1]) for (const z of [-1.12, 0, 1.12]) hbmPos.push([sx * hbmX, z]);
  const layers = 8;
  const lh = CHIP.die / (layers + 1);
  const hbmLayers: Xf[] = [];
  hbmPos.forEach(([x, z]) => {
    for (let k = 0; k < layers; k++) hbmLayers.push({ p: [x, yHbm + lh * (k + 0.5) + layerGap * k, z], s: [CHIP.hbmW * 0.985, lh * 0.82, CHIP.hbmD * 0.985] });
  });
  const hbmTop = (k: number) => yHbm + lh * layers + layerGap * layers + k * 0;
  const time = (frame / fps) * 0.45 * flowSpeed;
  m.trace.uniforms.time.value = time;
  m.trace.uniforms.amount.value = glow;
  const lidY = CHIP.sub + 0.02 + e * 3.6 + (1 - Math.min(1, lid)) * 3;
  return (
    <group position={position as [number, number, number]} rotation={[rotation[0], rotation[1] + spin * Math.PI * 2, rotation[2]]} scale={scale}>
      {/* substrate */}
      <RoundedBox args={[CHIP.w, CHIP.sub, CHIP.d]} radius={0.02} smoothness={2} position={[0, CHIP.sub / 2, 0]} material={m.substrate} castShadow receiveShadow />
      {pads ? <Inst geometry={geo.pad} material={m.gold} items={padItems} /> : null}
      <Inst geometry={geo.box} material={m.capBody} items={caps.bodies} castShadow />
      <Inst geometry={geo.box} material={m.capEnd} items={caps.ends} />
      {/* underfill fillet + silicon interposer */}
      <RoundedBox args={[5.05, 0.05, 3.75]} radius={0.02} smoothness={2} position={[0, CHIP.sub + 0.02 + e * 0.45, 0]} material={m.underfill} />
      <mesh position={[0, yInter + CHIP.inter / 2, 0]} material={m.interposer} castShadow receiveShadow>
        <boxGeometry args={[4.85, CHIP.inter, 3.6]} />
      </mesh>
      {/* HBM stacks: base die + layered DRAM dies + polished top */}
      <Inst geometry={geo.box} material={m.hbmLayer} items={hbmLayers} castShadow />
      {hbmPos.map(([x, z], i) => (
        <mesh key={i} position={[x, hbmTop(i) + 0.004, z]} material={m.hbm} castShadow>
          <boxGeometry args={[CHIP.hbmW, 0.008, CHIP.hbmD]} />
        </mesh>
      ))}
      {/* GPU die: polished silicon with thin-film sheen, circuit grid normal map */}
      <group position={[0, yDie, 0]}>
        <mesh position={[0, CHIP.die / 2, 0]} material={[m.dieEdge, m.dieEdge, m.die, m.dieEdge, m.dieEdge, m.dieEdge]} castShadow receiveShadow>
          <boxGeometry args={[CHIP.dieW, CHIP.die, CHIP.dieD]} />
        </mesh>
        {glow > 0.001 ? (
          <>
            <mesh position={[0, CHIP.die + 0.002, 0]} rotation-x={-Math.PI / 2} material={m.trace} renderOrder={5}>
              <planeGeometry args={[CHIP.dieW * 0.98, CHIP.dieD * 0.98]} />
            </mesh>
            <pointLight position={[0, 0.6, 0]} color={N.green} intensity={glow * 1.2} distance={0} decay={2} />
          </>
        ) : null}
      </group>
      {/* optional nickel-plated heat spreader with flange */}
      {lid > 0.001 ? (
        <group position={[0, lidY, 0]}>
          <RoundedBox args={[6.5, 0.07, 5.4]} radius={0.03} smoothness={3} position={[0, 0.035, 0]} material={m.lidEdge} castShadow receiveShadow />
          <RoundedBox args={[5.6, 0.3, 4.5]} radius={0.08} smoothness={4} position={[0, 0.2, 0]} material={m.lidEdge} castShadow receiveShadow />
          <mesh position={[0, 0.3505, 0]} rotation-x={-Math.PI / 2} material={m.lid} receiveShadow>
            <planeGeometry args={[5.42, 4.32]} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

/**
 * Ready-made studio shot of the chip. `t` 0..1 drives the default slow orbit + push-in;
 * pass `camera` to override. All other props go to <GpuChip>.
 */
export const GpuChipShot: React.FC<
  React.ComponentProps<typeof GpuChip> & { readonly t?: number; readonly camera?: Cam; readonly fx?: Partial<FXProps> }
> = ({ t = 0, camera, fx, ...chip }) => {
  const a = -0.55 + t * 0.7;
  const r = 19 - t * 4;
  const target: V3 = [0, 0.5 + (chip.explode ?? 0) * 1.4, 0];
  const cam: Cam = camera ?? { pos: orbit(target, r, 7.5 - t * 1.5 + (chip.explode ?? 0) * 2, a), target, mm: 55, focus: r + 0.5, range: 6 };
  return (
    <Studio camera={cam} size={9} fx={fx}>
      <GpuChip {...chip} />
    </Studio>
  );
};
