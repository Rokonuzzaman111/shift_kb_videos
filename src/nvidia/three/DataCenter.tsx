/**
 * OWNER: 3D agent. AI data-centre cold aisle, units = metres. Aisle runs along -Z from z = 0,
 * two rows of GPU racks (fronts facing the aisle), glossy reflective raised floor, cable trays,
 * overhead linear lights with light shafts in haze, thousands of deterministic blinking LEDs.
 *
 *  <DataCenter t={0..1} power={0..1} />      full shot (canvas + camera + post)
 *  <DataCenterSet power frame />              world only, for your own <Stage>
 *
 *  - t      0..1 camera dolly down the aisle (ignored if `camera` given)
 *  - power  0..1 racks + lights come on rack by rack from the camera end toward the back
 */
import { Environment, MeshReflectorMaterial } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HDRI } from "../../kit/assets";
import { Lens, Stage } from "../../kit/Stage";
import { N } from "../theme";
import { Dust } from "./Dust";
import { type FXProps, NvFX } from "./FX";
import { Inst, type Xf } from "./Inst";
import type { Cam } from "./Studio";
import { dotTexture, floorTextures, mulberry32, rackFaceTextures } from "./tex";

export const DC = { racks: 22, rackW: 0.6, rackH: 2.25, rackD: 1.2, aisle: 1.8, gap: 0.015, ceil: 3.4 };
const PITCH = DC.rackW + DC.gap;
const LEN = DC.racks * PITCH;
const X_FACE = DC.aisle / 2;
const LIGHT_Z = Array.from({ length: 6 }, (_, i) => -1.2 - i * 2.4);

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** 0..1 on-ness of rack index i (0 = nearest the camera start) for a given power. */
const rackOn = (i: number, power: number) => clamp01(power * (DC.racks + 3) - i);

const shaftVert = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position,1.0); vN = mat3(modelMatrix) * normal;
  vV = cameraPosition - wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const shaftFrag = /* glsl */ `
uniform vec3 color; uniform float amount; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ vec3 n = vN / max(length(vN), 1e-4); vec3 v = vV / max(length(vV), 1e-4);
  float d = clamp(abs(dot(n, v)), 0.0, 1.0); float edge = d * d;
  float y = clamp(vUv.y, 0.0, 1.0); float fall = y * y;
  vec3 c = clamp(color * edge * fall * amount, 0.0, 4.0);
  gl_FragColor = vec4(c, 1.0); }`;

/** Spot light pointing straight down from its parent (target kept in the scene graph). */
const SpotDown: React.FC<{ intensity: number }> = ({ intensity }) => {
  const ref = useRef<THREE.SpotLight>(null);
  const tgt = useRef<THREE.Object3D>(null);
  useLayoutEffect(() => {
    if (ref.current && tgt.current) ref.current.target = tgt.current;
  }, []);
  return (
    <>
      <spotLight ref={ref} position={[0, -0.05, 0]} angle={0.95} penumbra={0.9} intensity={intensity} distance={8} decay={2} color="#e8f2ff" />
      <object3D ref={tgt} position={[0, -3, 0]} />
    </>
  );
};

/** Instanced LED sprites with per-frame deterministic blinking. */
const Leds: React.FC<{ frame: number; fps: number; power: number }> = ({ frame, fps, power }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const r = mulberry32(2024);
    const leds: { p: [number, number, number]; side: number; rack: number; c: THREE.Color; f: number; ph: number; duty: number; steady: boolean; s: number }[] = [];
    const palette = [
      [new THREE.Color("#5dff3a"), 0.55],
      [new THREE.Color("#3fd8ff"), 0.25],
      [new THREE.Color("#ffffff"), 0.12],
      [new THREE.Color("#ffb020"), 0.08],
    ] as const;
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < DC.racks; i++) {
        const z = -PITCH * (i + 0.5);
        const n = 40 + Math.floor(r() * 30);
        for (let k = 0; k < n; k++) {
          let pr = r();
          let c = palette[0][0];
          for (const [col, w] of palette) {
            if (pr < w) {
              c = col;
              break;
            }
            pr -= w;
          }
          const y = 0.15 + r() * (DC.rackH - 0.35);
          const dz = (r() - 0.5) * (DC.rackW - 0.12);
          const x = side === 0 ? -X_FACE + 0.012 : X_FACE - 0.012;
          leds.push({ p: [x, y, z + dz], side, rack: i, c: c.clone(), f: 0.5 + r() * 6, ph: r(), duty: 0.2 + r() * 0.6, steady: r() < 0.35, s: 0.009 + r() * 0.008 });
        }
      }
    }
    return leds;
  }, []);
  const tex = useMemo(() => dotTexture(), []);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), [tex]);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), p: new THREE.Vector3(), c: new THREE.Color() }), []);
  useLayoutEffect(() => {
    const im = ref.current;
    if (!im) return;
    const t = frame / fps;
    data.forEach((d, i) => {
      tmp.p.set(d.p[0], d.p[1], d.p[2]);
      tmp.q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), d.side === 0 ? Math.PI / 2 : -Math.PI / 2);
      tmp.s.set(d.s, d.s, d.s);
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      im.setMatrixAt(i, tmp.m);
      const on = rackOn(d.rack, power);
      // boot flicker: just-powered racks blink fast
      const blink = d.steady ? 1 : (t * d.f + d.ph) % 1 < d.duty ? 1 : 0.08;
      const boot = on > 0 && on < 1 ? ((t * 14 + d.ph) % 1 < 0.5 ? 1 : 0.2) : 1;
      tmp.c.copy(d.c).multiplyScalar(on * blink * boot * 4.5);
      im.setColorAt(i, tmp.c);
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, data.length]} frustumCulled={false} renderOrder={6} />;
};

export const DataCenterSet: React.FC<{ readonly power?: number; readonly frame: number; readonly fps: number; readonly reflect?: boolean; readonly debug?: number }> = ({ power = 1, frame, fps, reflect = true, debug = 0 }) => {
  const mats = useMemo(() => {
    const fl = floorTextures();
    const faces = [0, 1, 2].map((v) => rackFaceTextures(v));
    const rep = (t: THREE.Texture, x: number, y: number) => {
      const c = t.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(x, y);
      c.needsUpdate = true;
      return c;
    };
    return {
      floorMap: rep(fl.map, 6 / 0.6, (LEN + 8) / 0.6),
      floorRough: rep(fl.roughnessMap, 6 / 0.6, (LEN + 8) / 0.6),
      body: new THREE.MeshStandardMaterial({ color: "#0d0f11", metalness: 0.6, roughness: 0.45 }),
      faces: faces.map((f) => new THREE.MeshStandardMaterial({ map: f.map, roughnessMap: f.roughnessMap, metalness: 0.7, roughness: 1, envMapIntensity: 1.0, color: "#9aa0a6" })),
      tray: new THREE.MeshStandardMaterial({ color: "#b49a2a", metalness: 0.9, roughness: 0.35 }),
      cableA: new THREE.MeshStandardMaterial({ color: "#0b0c0d", roughness: 0.5 }),
      cableB: new THREE.MeshStandardMaterial({ color: "#1f5fa8", roughness: 0.45 }),
      cableC: new THREE.MeshStandardMaterial({ color: "#d9c43a", roughness: 0.45 }),
      ceiling: new THREE.MeshStandardMaterial({ color: "#090b0c", roughness: 0.9 }),
      fixture: new THREE.MeshStandardMaterial({ color: "#2a2d30", metalness: 0.8, roughness: 0.4 }),
      lamp: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
      topStrip: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
      wall: new THREE.MeshStandardMaterial({ color: "#0e1214", roughness: 0.8 }),
      door: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
      shaft: new THREE.ShaderMaterial({
        vertexShader: shaftVert,
        fragmentShader: shaftFrag,
        uniforms: { color: { value: new THREE.Color("#cfe6ff") }, amount: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    };
  }, []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const plane = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const layout = useMemo(() => {
    const bodies: Xf[] = [];
    const faces: Xf[][] = [[], [], []];
    const r = mulberry32(77);
    for (let side = 0; side < 2; side++) {
      const sx = side === 0 ? -1 : 1;
      for (let i = 0; i < DC.racks; i++) {
        const z = -PITCH * (i + 0.5);
        bodies.push({ p: [sx * (X_FACE + DC.rackD / 2 + 0.03), DC.rackH / 2, z], s: [DC.rackD, DC.rackH, DC.rackW] });
        faces[Math.floor(r() * 3)].push({ p: [sx * (X_FACE + 0.002), DC.rackH / 2, z], r: [0, side === 0 ? Math.PI / 2 : -Math.PI / 2, 0], s: [DC.rackW - 0.03, DC.rackH - 0.04, 1] });
      }
    }
    // wire-basket trays above each row: rails + cross wires
    const trays: Xf[] = [];
    for (const sx of [-1, 1]) {
      const cx = sx * (X_FACE + 0.45);
      const y = DC.rackH + 0.45;
      trays.push({ p: [cx - 0.22, y, -LEN / 2], s: [0.012, 0.08, LEN + 6] });
      trays.push({ p: [cx + 0.22, y, -LEN / 2], s: [0.012, 0.08, LEN + 6] });
      for (let z = 3; z > -LEN - 3; z -= 0.1) trays.push({ p: [cx, y - 0.04, z], s: [0.45, 0.006, 0.006] });
      for (let z = 3; z > -LEN - 3; z -= 1.5) trays.push({ p: [cx, y + 0.45, z], s: [0.01, 0.9, 0.01] }); // hangers
    }
    const cables: { m: "cableA" | "cableB" | "cableC"; it: Xf }[] = [];
    for (const sx of [-1, 1]) {
      for (let k = 0; k < 14; k++) {
        const cx = sx * (X_FACE + 0.45) + (r() - 0.5) * 0.36;
        const m = r() < 0.6 ? "cableA" : r() < 0.6 ? "cableB" : "cableC";
        cables.push({ m, it: { p: [cx, DC.rackH + 0.45 - 0.01 + r() * 0.05, -LEN / 2], r: [Math.PI / 2, 0, 0], s: [1, 1, 1] } });
      }
    }
    return { bodies, faces, trays, cables };
  }, []);
  const cableGeo = useMemo(() => new THREE.CylinderGeometry(0.012, 0.012, LEN + 6, 6), []);
  const lit = clamp01(power * 1.6);
  mats.shaft.uniforms.amount.value = 0.07 * lit;
  mats.lamp.color.set("#f2f7ff").multiplyScalar(0.2 + 4.5 * lit);
  mats.door.color.set("#bfe4ff").multiplyScalar(0.2 + 1.1 * lit);
  mats.topStrip.color.set(N.green).multiplyScalar(0.1 + 2.8 * clamp01(power * 1.2));
  return (
    <group>
      <Environment files={HDRI.studio} environmentIntensity={0.12 + 0.18 * lit} resolution={256} />
      <hemisphereLight args={["#9fb8d0", "#050607", 0.15 + 0.25 * lit]} />
      {/* overhead fixtures + their real light */}
      {LIGHT_Z.map((z, i) => {
        const on = clamp01(lit * 1.4 - i * 0.08);
        return (
          <group key={z} position={[0, DC.ceil - 0.25, z]}>
            <mesh material={mats.fixture}>
              <boxGeometry args={[0.18, 0.05, 1.4]} />
            </mesh>
            <mesh material={mats.lamp} position={[0, -0.027, 0]} rotation-x={Math.PI / 2}>
              <planeGeometry args={[0.12, 1.3]} />
            </mesh>
            <SpotDown intensity={on * 9} />
            {/* light shaft cone in the haze */}
            {debug === 3 ? null : <mesh position={[0, -1.45, 0]} material={mats.shaft} scale={[1, 1, 1.6]}>
              <cylinderGeometry args={[0.1, 1.0, 2.8, 32, 1, true]} />
            </mesh>}
          </group>
        );
      })}
      {/* reflective raised floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -LEN / 2]}>
        <planeGeometry args={[6, LEN + 8]} />
        {reflect ? (
          <MeshReflectorMaterial
            map={mats.floorMap}
            roughnessMap={mats.floorRough}
            color="#2a2e32"
            roughness={0.45}
            metalness={0.2}
            blur={[200, 60]}
            resolution={512}
            mixBlur={1}
            mixStrength={4}
            mixContrast={1}
            depthScale={0.6}
            minDepthThreshold={0.2}
            maxDepthThreshold={1.4}
            mirror={0.85}
          />
        ) : (
          <meshStandardMaterial map={mats.floorMap} roughnessMap={mats.floorRough} color="#3a3f44" roughness={0.35} metalness={0.3} />
        )}
      </mesh>
      {/* ceiling + far wall with lit doorway */}
      <mesh rotation-x={Math.PI / 2} position={[0, DC.ceil, -LEN / 2]} material={mats.ceiling}>
        <planeGeometry args={[8, LEN + 8]} />
      </mesh>
      <mesh position={[0, DC.ceil / 2, -LEN - 1.2]} material={mats.wall}>
        <planeGeometry args={[8, DC.ceil]} />
      </mesh>
      <mesh position={[0, 1.1, -LEN - 1.19]} material={mats.door}>
        <planeGeometry args={[1.0, 2.2]} />
      </mesh>
      <pointLight position={[0, 1.2, -LEN - 0.6]} intensity={3 * lit} color="#bfe4ff" distance={10} decay={2} />
      {/* racks */}
      <Inst geometry={box} material={mats.body} items={layout.bodies} />
      {layout.faces.map((f, i) => (
        <Inst key={i} geometry={plane} material={mats.faces[i]} items={f} />
      ))}
      {/* green status strip on top of each row */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (X_FACE + 0.01), DC.rackH - 0.012, -LEN / 2]} material={mats.topStrip}>
          <boxGeometry args={[0.012, 0.012, LEN - 0.05]} />
        </mesh>
      ))}
      {debug === 4 ? null : <Leds frame={frame} fps={fps} power={power} />}
      {/* cable trays + bundles */}
      <Inst geometry={box} material={mats.tray} items={layout.trays} />
      {(["cableA", "cableB", "cableC"] as const).map((k) => (
        <Inst key={k} geometry={cableGeo} material={mats[k]} items={layout.cables.filter((c) => c.m === k).map((c) => c.it)} />
      ))}
    </group>
  );
};

/** Full data-centre shot. */
export const DataCenter: React.FC<{
  readonly t?: number;
  readonly power?: number;
  readonly camera?: Cam;
  readonly fx?: Partial<FXProps>;
  readonly haze?: number;
  /** real-time planar floor reflection (MeshReflectorMaterial) */
  readonly reflect?: boolean;
  /** temp QA switch */
  readonly debug?: number;
}> = ({ t = 0, power = 1, camera, fx, haze = 1, reflect = true, debug = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const z = 2.2 - t * 8.5;
  const sway = Math.sin((frame / fps) * 0.6) * 0.03;
  const cam: Cam = camera ?? { pos: [0.28 + sway, 1.5, z], target: [-0.1, 1.35, z - 6], mm: 26, focus: 4.5, range: 6 };
  const bg = "#06090b";
  return (
    <Stage background={bg}>
      <Lens position={cam.pos} target={cam.target} mm={cam.mm ?? 26} roll={cam.roll} near={0.05} far={80} />
      <fogExp2 attach="fog" args={[bg, 0.045 * haze]} />
      <DataCenterSet power={power} frame={frame} fps={fps} reflect={reflect} debug={debug} />
      {debug === 2 ? null : <Dust count={700} center={[0, 1.6, z - 4]} box={[2, 3, 9]} size={0.012} opacity={0.5 * haze * Math.min(1, power * 1.6)} color="#d8ecff" seed={9} speed={0.6} beams={LIGHT_Z.map((lz) => ({ x: 0, z: lz, r: 1.1 }))} />}
      {debug === 1 ? null : <NvFX focus={cam.focus} focusRange={cam.range ?? 6} bokeh={2} bloom={0.9} bloomThreshold={0.7} vignette={0.55} {...fx} />}
    </Stage>
  );
};
