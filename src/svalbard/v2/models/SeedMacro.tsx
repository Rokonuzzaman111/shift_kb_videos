/**
 * Svalbard v2 · Part 2 macro props (metres, y up):
 *  Plaque      — brushed-steel commemorative plaque (engraved "26 · 02 · 2008") bolted on frosted concrete, frost wipe.
 *  WheatEar    — one wheat ear (rachis + alternating spikelets + awns), any material (real or glass replica).
 *  SeedDrawer  — frosted steel cabinet with a sliding drawer (opening faces −x).
 *  Scoop       — brass scoop heaped with rice / wheat / maize grains (instanced, deterministic).
 *  Slate, KeyLight — dark slate slab and a soft-shadow key light.
 */
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { usePBR } from "../../../kit/assets";
import { canvasTex, fbm, grain, rng } from "../../three/util";
import { Instanced, frostify, useSteelMat } from "./Corridor";

type V = readonly [number, number, number];

export const m4 = (p: V, s: V, r: V = [0, 0, 0]) =>
  new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2])), new THREE.Vector3(...s));

const linear = (t: THREE.Texture) => {
  t.colorSpace = THREE.NoColorSpace;
  return t;
};

/* ───────────── key light ───────────── */
export const KeyLight: React.FC<{ readonly position: V; readonly intensity: number; readonly half: number; readonly color?: string; readonly far?: number }> = ({
  position,
  intensity,
  half,
  color = "#eef3f8",
  far = 20,
}) => (
  <directionalLight
    position={position as [number, number, number]}
    intensity={intensity}
    color={color}
    castShadow
    shadow-mapSize={[1024, 1024]}
    shadow-camera-left={-half}
    shadow-camera-right={half}
    shadow-camera-top={half}
    shadow-camera-bottom={-half}
    shadow-camera-near={0.01}
    shadow-camera-far={far}
    shadow-bias={-0.0003}
    shadow-normalBias={0.002}
    shadow-radius={4}
  />
);

/* ───────────── slate ───────────── */
export const Slate: React.FC<{ readonly size: V; readonly position: V; readonly repeat?: number }> = ({ size, position, repeat = 1 }) => {
  const pbr = usePBR("rock_boulder_dry", [repeat, repeat]);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: pbr.map,
        normalMap: pbr.normalMap,
        roughnessMap: pbr.roughnessMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        color: "#3b424b",
        roughness: 0.85,
      }),
    [pbr],
  );
  return (
    <mesh position={position as [number, number, number]} material={mat} receiveShadow castShadow>
      <boxGeometry args={size as [number, number, number]} />
    </mesh>
  );
};

/* ───────────── plaque ───────────── */
export const PLQ = { w: 0.6, h: 0.4, d: 0.012 } as const;

const drawPlaque = (g: CanvasRenderingContext2D, W: number, H: number, base: number, brush: number, ink: string, seed: number) => {
  g.fillStyle = `rgb(${base},${base},${base})`;
  g.fillRect(0, 0, W, H);
  const r = rng(seed);
  for (let i = 0; i < 1800; i++) {
    const v = base + (r() - 0.5) * brush;
    g.strokeStyle = `rgba(${v},${v},${v},0.35)`;
    g.lineWidth = 1 + r();
    const y = r() * H;
    const x = r() * W;
    g.beginPath();
    g.moveTo(x - 400 * r(), y);
    g.lineTo(x + 400 * r(), y);
    g.stroke();
  }
  g.strokeStyle = ink;
  g.lineWidth = 6;
  g.strokeRect(34, 34, W - 68, H - 68);
  g.fillStyle = ink;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "bold 50px Arial, Helvetica, sans-serif";
  g.fillText("SVALBARD  GLOBAL  SEED  VAULT", W / 2, 128);
  g.fillRect(W / 2 - 300, 182, 600, 5);
  g.font = "bold 150px Arial, Helvetica, sans-serif";
  g.fillText("26 · 02 · 2008", W / 2, 345);
  g.fillRect(W / 2 - 300, 470, 600, 5);
  g.font = "bold 40px Arial, Helvetica, sans-serif";
  g.fillText("OFFICIALLY  OPENED", W / 2, 540);
};

const usePlaqueTex = () =>
  useMemo(() => {
    const W = 1024;
    const H = 683;
    const map = canvasTex(W, H, (g) => drawPlaque(g, W, H, 170, 50, "#2c3136", 3));
    const bump = linear(canvasTex(W, H, (g) => drawPlaque(g, W, H, 200, 30, "#101010", 3)));
    const rough = linear(canvasTex(W, H, (g) => drawPlaque(g, W, H, 80, 60, "#c8c8c8", 3)));
    return { map, bump, rough };
  }, []);

const useFrostTex = () =>
  useMemo(() => {
    const map = canvasTex(256, 256, (g) => grain(g, 256, 256, [214, 224, 233], 90, 4));
    const alpha = linear(
      canvasTex(512, 256, (g) => {
        g.fillStyle = "#000";
        g.fillRect(0, 0, 512, 256);
        for (let y = 0; y < 256; y++) {
          const e = 256 + (fbm(y / 22, 3.1, 4) - 0.5) * 170;
          const gr = g.createLinearGradient(e - 26, 0, e + 26, 0);
          gr.addColorStop(0, "#000");
          gr.addColorStop(1, "#f2f2f2");
          g.fillStyle = gr;
          g.fillRect(e - 26, y, 512 - (e - 26), 1);
        }
      }),
    );
    alpha.wrapS = alpha.wrapT = THREE.ClampToEdgeWrapping;
    return { map, alpha };
  }, []);

/** plaque centred at the origin on a frosted concrete wall (z = 0, facing +z). wipe 0 = fully frosted, 1 = clean */
export const PlaqueWall: React.FC<{ readonly wipe: number }> = ({ wipe }) => {
  const tex = usePlaqueTex();
  const frost = useFrostTex();
  frost.alpha.offset.x = 0.5 - wipe * 1.08;
  const pbr = usePBR("concrete_wall_008", [1.5, 1.5]);
  const wall = useMemo(
    () =>
      frostify(
        new THREE.MeshStandardMaterial({ map: pbr.map, normalMap: pbr.normalMap, roughnessMap: pbr.roughnessMap, normalScale: new THREE.Vector2(1.4, 1.4), color: "#9aa2aa" }),
        0.75,
        2.2,
      ),
    [pbr],
  );
  const steel = useSteelMat([1, 1], "#a9b2ba", 0.32, 1);
  const ice = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#f2f7fb", roughness: 0.08, metalness: 0, clearcoat: 1, envMapIntensity: 2.2 }), []);
  const iceGeo = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);
  const crystals = useMemo(() => {
    const r = rng(21);
    const out: THREE.Matrix4[] = [];
    for (let i = 0; i < 420; i++) {
      const x = (r() - 0.5) * 1.6;
      const y = (r() - 0.5) * 1.3;
      if (Math.abs(x) < PLQ.w / 2 + 0.01 && Math.abs(y) < PLQ.h / 2 + 0.01) continue;
      const s = 0.002 + r() * r() * 0.007;
      out.push(m4([x, y, 0.004], [s, s * (1 + r() * 2), s], [r() * 3, r() * 3, r() * 3]));
    }
    return out;
  }, []);
  const bolts = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const;
  return (
    <group>
      <mesh material={wall} receiveShadow>
        <planeGeometry args={[3, 3]} />
      </mesh>
      <RoundedBox args={[PLQ.w, PLQ.h, PLQ.d]} radius={0.004} smoothness={3} position={[0, 0, PLQ.d / 2]} material={steel} castShadow receiveShadow />
      <mesh position={[0, 0, PLQ.d + 0.0006]} receiveShadow>
        <planeGeometry args={[PLQ.w - 0.008, PLQ.h - 0.008]} />
        <meshStandardMaterial map={tex.map} bumpMap={tex.bump} bumpScale={3} roughnessMap={tex.rough} roughness={1} metalness={1} envMapIntensity={1.4} />
      </mesh>
      {bolts.map(([sx, sy], i) => (
        <mesh key={i} position={[sx * (PLQ.w / 2 - 0.028), sy * (PLQ.h / 2 - 0.028), PLQ.d + 0.004]} rotation={[Math.PI / 2, 0.3 * i, 0]} material={steel} castShadow>
          <cylinderGeometry args={[0.011, 0.012, 0.008, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 0, PLQ.d + 0.0035]}>
        <planeGeometry args={[PLQ.w + 0.03, PLQ.h + 0.03]} />
        <meshStandardMaterial color="#dfe8ef" map={frost.map} alphaMap={frost.alpha} transparent depthWrite={false} roughness={0.8} />
      </mesh>
      <Instanced geo={iceGeo} mat={ice} mats={crystals} />
    </group>
  );
};

/* ───────────── wheat ear ───────────── */
const EAR_LEN = 0.095;
const useEarMats = () =>
  useMemo(() => {
    const glumes: THREE.Matrix4[] = [];
    const awns: THREE.Matrix4[] = [];
    const r = rng(8);
    const n = 19;
    for (let i = 0; i < n; i++) {
      const y = 0.004 + i * (EAR_LEN / n);
      const side = i % 2 ? 1 : -1;
      const taper = 1 - 0.38 * (i / n) ** 2;
      const tilt = side * (0.32 + r() * 0.08);
      for (let k = -1; k <= 1; k++) {
        const s = taper * (k === 0 ? 1 : 0.9);
        glumes.push(m4([side * 0.0042 * taper, y, k * 0.0026 * taper], [0.0033 * s, 0.0066 * s, 0.0029 * s], [k * 0.15, 0, -tilt]));
        if (k !== 0 || r() < 0.6) {
          const ax = side * 0.0042 * taper + -Math.sin(-tilt) * 0.006;
          awns.push(m4([ax, y + 0.0055, k * 0.0026], [0.00028, 0.04 + r() * 0.025, 0.00028], [k * 0.1 + (r() - 0.5) * 0.08, 0, -tilt * 0.45 + (r() - 0.5) * 0.08]));
        }
      }
    }
    return { glumes, awns };
  }, []);

/** wheat ear along local +y (ear 0…0.095 m, stem −0.12…0) */
export const WheatEar: React.FC<{ readonly mat: THREE.Material; readonly position?: V; readonly rotation?: V; readonly shadows?: boolean }> = ({
  mat,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  shadows = true,
}) => {
  const ms = useEarMats();
  const glume = useMemo(() => new THREE.SphereGeometry(1, 12, 8), []);
  const awn = useMemo(() => new THREE.CylinderGeometry(1, 0.3, 1, 5).translate(0, 0.5, 0), []);
  return (
    <group position={position as [number, number, number]} rotation={rotation as [number, number, number]}>
      <Instanced geo={glume} mat={mat} mats={ms.glumes} shadows={shadows} />
      <Instanced geo={awn} mat={mat} mats={ms.awns} shadows={shadows} />
      <mesh material={mat} position={[0, -0.06 + EAR_LEN / 2 - 0.0, 0]} castShadow={shadows}>
        <cylinderGeometry args={[0.0011, 0.0016, 0.12 + EAR_LEN, 8]} />
      </mesh>
    </group>
  );
};

/* ───────────── drawer cabinet ───────────── */
export const CAB = { x0: 0.22, x1: 0.58, h: 0.17, d: 0.3, trayLen: 0.32 } as const;
/** world x of the tray centre for a drawer pulled out by `open` m */
export const trayX = (open: number) => CAB.x0 - open + 0.02 + CAB.trayLen / 2;

export const SeedDrawer: React.FC<{ readonly open: number }> = ({ open }) => {
  const steel = useSteelMat([1, 1], "#b4bec7", 0.42, 0.85, 0.55);
  const inner = useSteelMat([1, 1], "#7d8791", 0.5, 0.8);
  const L = CAB.x1 - CAB.x0;
  const cx = (CAB.x0 + CAB.x1) / 2;
  const t = 0.008;
  const fx = CAB.x0 - open;
  return (
    <group>
      {/* cabinet shell, opening at x0 */}
      <mesh material={steel} position={[cx, CAB.h - t / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[L, t, CAB.d]} />
      </mesh>
      <mesh material={steel} position={[cx, t / 2, 0]} receiveShadow>
        <boxGeometry args={[L, t, CAB.d]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={steel} position={[cx, CAB.h / 2, s * (CAB.d / 2 - t / 2)]} castShadow receiveShadow>
          <boxGeometry args={[L, CAB.h, t]} />
        </mesh>
      ))}
      <mesh material={steel} position={[CAB.x1 - t / 2, CAB.h / 2, 0]}>
        <boxGeometry args={[t, CAB.h, CAB.d]} />
      </mesh>
      {/* drawer: front plate + tray */}
      <group position={[fx, 0, 0]}>
        <RoundedBox args={[0.014, CAB.h - 0.02, CAB.d - 0.02]} radius={0.003} smoothness={2} position={[0.007, CAB.h / 2, 0]} material={steel} castShadow receiveShadow />
        <mesh material={inner} position={[0.02 + CAB.trayLen / 2, 0.018, 0]} receiveShadow>
          <boxGeometry args={[CAB.trayLen, 0.004, CAB.d - 0.04]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={inner} position={[0.02 + CAB.trayLen / 2, 0.06, s * (CAB.d / 2 - 0.022)]} receiveShadow castShadow>
            <boxGeometry args={[CAB.trayLen, 0.085, 0.004]} />
          </mesh>
        ))}
        <mesh material={inner} position={[0.02 + CAB.trayLen, 0.06, 0]}>
          <boxGeometry args={[0.004, 0.085, CAB.d - 0.04]} />
        </mesh>
        {/* handle */}
        <mesh material={steel} position={[-0.016, CAB.h / 2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.005, 0.005, 0.14, 12]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} material={steel} position={[-0.008, CAB.h / 2, s * 0.065]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.004, 0.004, 0.018, 8]} />
          </mesh>
        ))}
        {/* label holder */}
        <mesh position={[-0.0005, CAB.h * 0.78, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.09, 0.022]} />
          <meshStandardMaterial color="#e8eef3" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
};

/* ───────────── brass scoop + grains ───────────── */
export type GrainKind = "rice" | "wheat" | "maize";
const GRAIN: Record<GrainKind, { s: V; color: string; rough: number; n: number }> = {
  rice: { s: [0.0016, 0.0015, 0.0036], color: "#ece6d6", rough: 0.38, n: 950 },
  wheat: { s: [0.0018, 0.0016, 0.0031], color: "#9a6a34", rough: 0.5, n: 850 },
  maize: { s: [0.0038, 0.0021, 0.0048], color: "#bd8235", rough: 0.5, n: 300 },
};
export const SCOOP = { r: 0.034, len: 0.11 } as const;

const useBrass = () => {
  const pbr = usePBR("metal_plate", [0.5, 0.5]);
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#c49a52",
        metalness: 1,
        roughness: 0.32,
        normalMap: pbr.normalMap,
        roughnessMap: pbr.roughnessMap,
        normalScale: new THREE.Vector2(0.25, 0.25),
        envMapIntensity: 1.3,
        side: THREE.DoubleSide,
      }),
    [pbr],
  );
};

/** maize kernel: flattened tooth — wide rounded crown (+z), tapering wedge to the tip-cap (−z) */
const maizeKernel = () => {
  const geo = new THREE.SphereGeometry(1, 14, 10);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    let z = p.getZ(i);
    const u = (z + 1) / 2; // 0 tip … 1 crown
    const w = 0.35 + 0.65 * Math.sqrt(u);
    x *= w;
    y *= 0.55 + 0.45 * u;
    if (z > 0.3) z = 0.3 + (z - 0.3) * 0.55; // blunt, slightly flattened crown
    if (z > 0.55) y *= 0.9;
    p.setXYZ(i, x * 1.15, y, z);
  }
  geo.computeVertexNormals();
  return geo;
};

/** scoop axis along z (handle at −z), opening up, resting on y = 0 */
export const Scoop: React.FC<{ readonly kind: GrainKind; readonly position: V; readonly yaw?: number }> = ({ kind, position, yaw = 0 }) => {
  const brass = useBrass();
  const g = GRAIN[kind];
  const grainMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: g.color, roughness: g.rough, clearcoat: kind === "maize" ? 0.15 : 0.2, sheen: kind === "maize" ? 0.35 : 0.08, sheenColor: new THREE.Color(kind === "maize" ? "#f0c27a" : "#e8eef3"), envMapIntensity: kind === "maize" ? 0.7 : 1 }), [g, kind]);
  const geo = useMemo(() => (kind === "maize" ? maizeKernel() : new THREE.SphereGeometry(1, 10, 7)), [kind]);
  const mats = useMemo(() => {
    const r = rng(kind === "rice" ? 31 : kind === "wheat" ? 32 : 33);
    const out: THREE.Matrix4[] = [];
    const R = SCOOP.r * 0.94;
    for (let i = 0; i < g.n; i++) {
      const x = (r() * 2 - 1) * R * 0.98;
      const z = (r() * 2 - 1) * (SCOOP.len / 2 - 0.004);
      const zn = z / (SCOOP.len / 2);
      const mound = 0.012 * (1 - (x / R) ** 2) * (1 - zn * zn * 0.7) + 0.002;
      const y = SCOOP.r + mound - r() * 0.004;
      const sv = 0.85 + r() * 0.3;
      out.push(m4([x, y, z], [g.s[0] * sv, g.s[1] * sv, g.s[2] * sv], [r() * 0.8 - 0.4, r() * Math.PI * 2, r() * 0.8 - 0.4]));
    }
    // a few spilled grains in front
    for (let i = 0; i < 14; i++) {
      const sv = 0.9 + r() * 0.2;
      out.push(m4([(r() - 0.5) * 0.07, g.s[1], SCOOP.len / 2 + 0.006 + r() * 0.04], [g.s[0] * sv, g.s[1] * sv, g.s[2] * sv], [0, r() * Math.PI * 2, 0]));
    }
    return out;
  }, [g, kind]);
  return (
    <group position={position as [number, number, number]} rotation={[0, yaw, 0]}>
      <mesh material={brass} position={[0, SCOOP.r, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[SCOOP.r, SCOOP.r, SCOOP.len, 32, 1, true, -Math.PI / 2, Math.PI]} />
      </mesh>
      <mesh material={brass} position={[0, SCOOP.r, -SCOOP.len / 2]} castShadow>
        <circleGeometry args={[SCOOP.r, 32, Math.PI, Math.PI]} />
      </mesh>
      <mesh material={brass} position={[0, SCOOP.r * 0.9, -SCOOP.len / 2 - 0.035]} rotation={[Math.PI / 2 - 0.25, 0, 0]} castShadow>
        <cylinderGeometry args={[0.0055, 0.0065, 0.075, 16]} />
      </mesh>
      <Instanced geo={geo} mat={grainMat} mats={mats} shadows />
    </group>
  );
};
