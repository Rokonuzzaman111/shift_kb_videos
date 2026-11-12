/**
 * S14: Primary loop (VO "loop").
 * Camera flies alongside a cut-away main coolant pipe (inner Ø ~0.85 m, steel wall)
 * from the reactor outlet nozzle towards the steam generator. Hot water is shown as an
 * orange-lit volume with streaming particles. "~৩৩০°C" gauge on "তিনশো".
 * The path is planar (z = 0) so one clipping plane (z > 0 removed) makes a clean cutaway.
 */
import { useMemo } from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { C } from "../theme";
import { Chip } from "../ui";
import { ClipEnable, Gauge, Particles, bn, useSteel } from "./partsB";

export const S14_DURATION = shotDuration("loop");

const T = {
  water: wordAt("loop", "চুল্লির"),
  temp: wordAt("loop", "তিনশো"),
};

const R_IN = 0.425;
const R_OUT = 0.5;

const World: React.FC = () => {
  const t = useSeconds();
  const steel = useSteel("#a9b0b8", 0.38, [10, 1]);
  const path = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-3, 0, 0),
        new THREE.Vector3(3, 0, 0),
        new THREE.Vector3(7, 1.2, 0),
        new THREE.Vector3(10, 3.6, 0),
        new THREE.Vector3(14, 4.6, 0),
        new THREE.Vector3(20, 4.6, 0),
      ]),
    [],
  );
  const clip = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)], []);
  const outer = useMemo(() => new THREE.TubeGeometry(path, 240, R_OUT, 64, false), [path]);
  const inner = useMemo(() => new THREE.TubeGeometry(path, 240, R_IN, 64, false), [path]);
  const water = useMemo(() => new THREE.TubeGeometry(path, 240, R_IN - 0.01, 48, false), [path]);
  const steelClip = useMemo(() => {
    const m = steel.clone();
    m.clippingPlanes = clip;
    return m;
  }, [steel, clip]);
  const innerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#5b4a3e",
        metalness: 0.7,
        roughness: 0.45,
        side: THREE.BackSide,
        clippingPlanes: clip,
        emissive: "#ff6a1a",
        emissiveIntensity: 0.25,
      }),
    [clip],
  );
  const heat = prog(t, T.water - 0.5, T.water + 1.2, ease.out);
  const waterMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ff7a2a",
        transparent: true,
        opacity: 0.22,
        emissive: "#ff5a12",
        depthWrite: false,
        side: THREE.DoubleSide,
        clippingPlanes: clip,
      }),
    [clip],
  );
  waterMat.emissiveIntensity = 0.6 * heat;

  // Particles stream along the pipe at ~3 m/s (visual), only in the visible back half
  const seeds = useMemo(
    () =>
      new Array(900).fill(0).map((_, i) => ({
        u: random(`u${i}`),
        r: Math.sqrt(random(`r${i}`)) * (R_IN - 0.06),
        a: Math.PI * (1 + random(`a${i}`)), // back half: angle π..2π (z ≤ 0)
        sp: 0.85 + random(`s${i}`) * 0.3,
      })),
    [],
  );
  const len = path.getLength();
  const frames = useMemo(() => path.computeFrenetFrames(400, false), [path]);
  const place = (i: number, out: THREE.Vector3) => {
    const s = seeds[i];
    const u = (s.u + (t * 3 * s.sp) / len) % 1;
    const idx = Math.min(399, Math.floor(u * 400));
    const p = path.getPointAt(u);
    const n = frames.normals[idx];
    const b = frames.binormals[idx];
    out
      .copy(p)
      .addScaledVector(n, Math.cos(s.a) * s.r)
      .addScaledVector(b, Math.sin(s.a) * s.r);
    if (out.z > 0) out.z = -out.z;
    return true;
  };

  // Camera tracks along the pipe on the cut side, looking a little ahead
  const k = prog(t, 0, S14_DURATION, ease.inOut);
  const cu = mix(0.08, 0.62, k);
  const cp = path.getPointAt(cu);
  const ahead = path.getPointAt(Math.min(1, cu + 0.12));
  const pos: [number, number, number] = [cp.x - 0.6, cp.y + 0.55, 2.3];
  const target: [number, number, number] = [ahead.x, ahead.y - 0.1, -0.1];
  const hh = handheld(t, 0.015, 8);
  const focus = Math.hypot(pos[0] - cp.x, pos[1] - cp.y, pos[2]);

  return (
    <>
      <ClipEnable />
      <Lighting hdri={HDRI.studio} intensity={0.5} rotation={2} />
      <fog attach="fog" args={["#07080c", 6, 22]} />
      <directionalLight position={[3, 8, 6]} intensity={1.8} color="#fff3e6" />
      <directionalLight position={[-6, -2, -5]} intensity={0.8} color="#6fc1ff" />
      <pointLight position={[cp.x, cp.y, -0.1]} intensity={8 * heat} distance={4} decay={2} color="#ff7a2a" />
      <Lens mm={28} position={[pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]]} target={target} near={0.02} far={80} />

      <mesh geometry={outer} material={steelClip} />
      <mesh geometry={inner} material={innerMat} />
      <mesh geometry={water} material={waterMat} />
      {/* cut face rings at the pipe ends are hidden by framing; flange rings add scale cues */}
      {[0.2, 0.45, 0.7].map((u) => {
        const p = path.getPointAt(u);
        const tg = path.getTangentAt(u);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg);
        return (
          <mesh key={u} position={p} quaternion={q} material={steelClip}>
            <cylinderGeometry args={[R_OUT + 0.09, R_OUT + 0.09, 0.14, 64, 1, true]} />
          </mesh>
        );
      })}
      <Particles count={900} size={0.075} color="#ffb070" opacity={0.85 * heat} place={place} />

      <PostFX focus={focus} focusRange={1.6} bokeh={3} bloom={0.9} bloomThreshold={0.75} />
    </>
  );
};

export const S14Loop: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#07080c">
        <World />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 220, gap: 24 }}>
        <Chip at={f(0.4)} accent={C.orange} size={42}>
          প্রাইমারি সার্কিট · {bn(4)}টি লুপ
        </Chip>
        <Gauge at={T.temp} value={`~${bn(330)}°C`} label="চুল্লি থেকে বেরোনো পানি" accent={C.orange} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
