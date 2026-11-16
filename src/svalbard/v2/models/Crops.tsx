/**
 * Svalbard v2 · Part 2 crop scenes (metres, y up, ground / water at y = 0). All deterministic.
 *  ribbon()/plantGeo() — procedural leaf blades + stems, merged per plant variant (instanced in the scenes).
 *  DryField    — cracked mud field at harsh noon, dead brown plants, one thriving green plant at the origin.
 *  RustLeaves  — macro wheat-like leaf blades; orange rust pustules grow on the neighbours (uSpread), hero leaf clean.
 *  RicePaddy   — flooded paddy in rain: rippling water, rice clumps with heavy golden panicles swaying, rain streaks.
 *  useWaterMat — rippling water (ring ripples + flow), shared with the flood in GenebankExterior.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { canvasTex, fbm, rng } from "../../three/util";
import { Instanced } from "./Corridor";
import { m4 } from "./SeedMacro";

type V = readonly [number, number, number];

/* ───────────── geometry ───────────── */
export type RibbonOpts = { len: number; width: number; pitch: number; yaw: number; droop: number; base?: V; seg?: number; fold?: number; curl?: number };

/** leaf blade: rises from `base` at `pitch` (rad from vertical) toward `yaw`, bends down by `droop`; V-folded midrib */
export const ribbon = ({ len, width, pitch, yaw, droop, base = [0, 0, 0], seg = 10, fold = 0.16, curl = 0 }: RibbonOpts) => {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const side = new THREE.Vector3(-Math.sin(yaw), 0, Math.cos(yaw));
  const p = new THREE.Vector3(base[0], base[1], base[2]);
  const ds = len / seg;
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const pt = pitch + droop * Math.pow(u, 1.6);
    const dir = new THREE.Vector3(Math.sin(pt) * Math.cos(yaw), Math.cos(pt), Math.sin(pt) * Math.sin(yaw));
    const wv = width * (u < 0.12 ? 0.55 + 0.45 * (u / 0.12) : 1 - Math.pow((u - 0.12) / 0.88, 2.2) * 0.96);
    const s2 = side.clone().applyAxisAngle(dir, curl * u);
    const nrm = new THREE.Vector3().crossVectors(dir, s2).normalize();
    for (let c = 0; c < 3; c++) {
      const k = c - 1;
      const q = p
        .clone()
        .addScaledVector(s2, k * wv * 0.5)
        .addScaledVector(nrm, (k === 0 ? 1 : 0) * wv * fold);
      pos.push(q.x, q.y, q.z);
      uv.push(c / 2, u);
    }
    p.addScaledVector(dir, ds);
  }
  for (let i = 0; i < seg; i++)
    for (let c = 0; c < 2; c++) {
      const a = i * 3 + c;
      idx.push(a, a + 1, a + 3, a + 1, a + 4, a + 3);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

const stem = (h: number, r: number, base: V = [0, 0, 0]) => {
  const g = new THREE.CylinderGeometry(r * 0.6, r, h, 6, 1);
  g.translate(base[0], base[1] + h / 2, base[2]);
  return g;
};

/** maize/sorghum-like plant: stem + alternating leaves. `dead` = shrivelled, hanging, curled */
export const plantGeo = (seed: number, h: number, dead: boolean) => {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [stem(h, dead ? 0.007 : 0.011)];
  const n = dead ? 5 : 8;
  for (let i = 0; i < n; i++) {
    const y = h * (0.08 + 0.8 * (i / n));
    const yaw = i * 2.4 + r() * 0.6;
    parts.push(
      ribbon({
        len: (dead ? 0.22 : 0.42) * (1 - 0.35 * (i / n)) * (0.8 + r() * 0.4),
        width: dead ? 0.018 : 0.05,
        pitch: dead ? 1.0 + r() * 0.5 : 0.55 + r() * 0.35,
        yaw,
        droop: dead ? 1.6 + r() * 0.8 : 1.0 + r() * 0.5,
        base: [0, y, 0],
        curl: dead ? 2.5 : 0.3,
        fold: dead ? 0.35 : 0.14,
      }),
    );
  }
  return mergeGeometries(parts)!;
};

/* ───────────── materials ───────────── */
const leafStreaks = (seed: number, blotch: number) =>
  canvasTex(64, 256, (g) => {
    const r = rng(seed);
    g.fillStyle = "#b8b8b8";
    g.fillRect(0, 0, 64, 256);
    for (let x = 0; x < 64; x += 2) {
      const v = 160 + Math.floor(r() * 70);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(x, 0, 1, 256);
    }
    g.fillStyle = "#e6e6e6";
    g.fillRect(30, 0, 4, 256);
    for (let i = 0; i < blotch; i++) {
      const v = 70 + Math.floor(r() * 50);
      g.fillStyle = `rgba(${v},${v},${v},0.5)`;
      g.beginPath();
      g.ellipse(r() * 64, r() * 256, 3 + r() * 8, 6 + r() * 20, 0, 0, Math.PI * 2);
      g.fill();
    }
  });

export const useLeafMat = (color: string, dead: boolean) =>
  useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        map: leafStreaks(dead ? 12 : 11, dead ? 40 : 0),
        roughness: dead ? 0.92 : 0.55,
        side: THREE.DoubleSide,
        envMapIntensity: 0.8,
      }),
    [color, dead],
  );

/* ───────────── cracked mud ───────────── */
const useCrackedGround = () =>
  useMemo(() => {
    const N = 1024;
    const C = 16;
    const S = N / C;
    const r = rng(77);
    const pts: number[] = [];
    for (let i = 0; i < C * C; i++) pts.push(r() * S, r() * S);
    const alb = new Uint8ClampedArray(N * N * 4);
    const bmp = new Uint8ClampedArray(N * N * 4);
    for (let y = 0; y < N; y++) {
      const cy = Math.floor(y / S);
      for (let x = 0; x < N; x++) {
        const cx = Math.floor(x / S);
        let f1 = 1e9;
        let f2 = 1e9;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const gx = cx + dx;
            const gy = cy + dy;
            const k = (((gy % C) + C) % C) * C + (((gx % C) + C) % C);
            const px = gx * S + pts[k * 2];
            const py = gy * S + pts[k * 2 + 1];
            const d = Math.hypot(px - x, py - y);
            if (d < f1) {
              f2 = f1;
              f1 = d;
            } else if (d < f2) f2 = d;
          }
        const e = f2 - f1;
        const n = fbm(x / 60, y / 60, 3);
        const w = 1.6 + 3.2 * n;
        const crack = e < w ? 1 - e / w : 0;
        const curl = 1 - Math.min(1, e / 16);
        const i = (y * N + x) * 4;
        const lum = 0.82 + 0.36 * (n - 0.5) + 0.12 * curl;
        const cr = 1 - crack * 0.78;
        alb[i] = 176 * lum * cr;
        alb[i + 1] = 146 * lum * cr;
        alb[i + 2] = 108 * lum * cr;
        alb[i + 3] = 255;
        const h = crack > 0 ? 40 * (1 - crack) : 150 + 70 * curl + 30 * (n - 0.5);
        bmp[i] = bmp[i + 1] = bmp[i + 2] = h;
        bmp[i + 3] = 255;
      }
    }
    const mk = (data: Uint8ClampedArray, srgb: boolean) => {
      const t = canvasTex(N, N, (g) => g.putImageData(new ImageData(data, N, N), 0, 0), [10, 10]);
      if (!srgb) t.colorSpace = THREE.NoColorSpace;
      return t;
    };
    return new THREE.MeshStandardMaterial({ map: mk(alb, true), bumpMap: mk(bmp, false), bumpScale: 2.2, roughness: 0.96, color: "#e8e0d4" });
  }, []);

/** big sky dome with a vertical gradient (background only, no fog) */
export const SkyDome: React.FC<{ readonly top: string; readonly horizon: string; readonly r?: number }> = ({ top, horizon, r = 400 }) => {
  const tex = useMemo(
    () =>
      canvasTex(4, 256, (g) => {
        const gr = g.createLinearGradient(0, 0, 0, 256);
        gr.addColorStop(0, top);
        gr.addColorStop(0.47, horizon);
        gr.addColorStop(1, horizon);
        g.fillStyle = gr;
        g.fillRect(0, 0, 4, 256);
      }),
    [top, horizon],
  );
  return (
    <mesh>
      <sphereGeometry args={[r, 32, 16]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
};

/* ───────────── E: drought field ───────────── */
export const DryField: React.FC<{ readonly t: number }> = ({ t }) => {
  const ground = useCrackedGround();
  const deadMat = useLeafMat("#8a6a45", true);
  const deadMat2 = useLeafMat("#6e5338", true);
  const heroMat = useLeafMat("#4f8f2c", false);
  const variants = useMemo(() => [plantGeo(5, 0.55, true), plantGeo(6, 0.4, true), plantGeo(7, 0.62, true)], []);
  const hero = useMemo(() => plantGeo(9, 0.78, false), []);
  const mats = useMemo(() => {
    const r = rng(404);
    const out: THREE.Matrix4[][] = [[], [], []];
    for (let k = -7; k <= 7; k++)
      for (let z = -22; z < 3; z += 0.45) {
        const x = k * 0.75 + (r() - 0.5) * 0.12;
        const zz = z + (r() - 0.5) * 0.2;
        const skip = r();
        if (skip < 0.35) continue;
        if (Math.abs(x) < 0.4 && zz > -0.7 && zz < 3) continue;
        const s = 0.7 + r() * 0.45;
        const lean = (r() - 0.5) * 0.5;
        out[Math.floor(r() * 3)].push(m4([x, 0, zz], [s, s * (0.8 + r() * 0.3), s], [lean, r() * 6.28, (r() - 0.5) * 0.4]));
      }
    return out;
  }, []);
  const sway = Math.sin(t * 1.4) * 0.025;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={ground} receiveShadow>
        <planeGeometry args={[60, 60]} />
      </mesh>
      <Instanced geo={variants[0]} mat={deadMat} mats={mats[0]} shadows />
      <Instanced geo={variants[1]} mat={deadMat2} mats={mats[1]} shadows />
      <Instanced geo={variants[2]} mat={deadMat} mats={mats[2]} shadows />
      <mesh geometry={hero} material={heroMat} rotation={[sway, 0.4, sway * 0.6]} castShadow receiveShadow />
      {/* a darker damp ring of soil at the hero's base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[0.16, 24]} />
        <meshStandardMaterial color="#5a4632" roughness={0.9} transparent opacity={0.55} />
      </mesh>
    </group>
  );
};

/* ───────────── F: rust leaves ───────────── */
const rustTex = (seed: number) =>
  canvasTex(256, 1024, (g) => {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, 256, 1024);
    g.globalCompositeOperation = "darken";
    const r = rng(seed);
    for (let c = 0; c < 70; c++) {
      const cx = r() * 256;
      const cy = r() * 1024;
      const v0 = 0.04 + r() * 0.7;
      const n = 4 + Math.floor(r() * 9);
      for (let i = 0; i < n; i++) {
        const x = cx + (r() - 0.5) * 50;
        const y = cy + (r() - 0.5) * 90;
        const R = 6 + r() * 12;
        const v = Math.min(0.95, v0 + r() * 0.15);
        const gr = g.createRadialGradient(x, y, 0, x, y, R);
        const c0 = Math.round(v * 255);
        gr.addColorStop(0, `rgb(${c0},${c0},${c0})`);
        gr.addColorStop(1, "rgb(255,255,255)");
        g.fillStyle = gr;
        g.beginPath();
        g.ellipse(x, y, R, R * 1.6, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  });

export type Uni = { uSpread: { value: number } };

const makeRustLeaf = (seed: number | null) => {
  const m = new THREE.MeshStandardMaterial({ color: "#4e8a2e", map: leafStreaks(seed ?? 3, 0), roughness: 0.5, side: THREE.DoubleSide, envMapIntensity: 0.9 });
  const uni: Uni & { uRust?: { value: THREE.Texture } } = { uSpread: { value: 0 } };
  if (seed !== null) {
    const rt = rustTex(seed);
    rt.colorSpace = THREE.NoColorSpace;
    uni.uRust = { value: rt };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uni);
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform float uSpread; uniform sampler2D uRust;")
        .replace(
          "#include <map_fragment>",
          `#include <map_fragment>
          float st = texture2D(uRust, vMapUv).r;
          float rr = smoothstep(st, st + 0.035, uSpread);
          float hh = smoothstep(st - 0.14, st, uSpread) * (1.0 - rr);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.58, 0.22), hh * 0.75);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.33, 0.07) * (0.75 + 0.5 * (1.0 - st)), rr);`,
        )
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.95, rr);");
    };
    m.customProgramCacheKey = () => `rust-${seed}`;
  }
  return { m, uni };
};

const LEAVES: (RibbonOpts & { rust: number | null })[] = [
  { len: 0.5, width: 0.034, pitch: 1.05, yaw: 0.1, droop: 1.2, base: [-0.2, -0.16, 0.02], rust: null }, // hero
  { len: 0.46, width: 0.03, pitch: 0.7, yaw: 2.9, droop: 1.4, base: [0.16, -0.2, -0.07], rust: 21 },
  { len: 0.5, width: 0.032, pitch: 0.55, yaw: 0.5, droop: 1.6, base: [-0.06, -0.22, -0.12], rust: 22 },
  { len: 0.42, width: 0.028, pitch: 0.9, yaw: 3.3, droop: 1.1, base: [0.05, -0.18, -0.2], rust: 21 },
  { len: 0.55, width: 0.033, pitch: 0.4, yaw: -0.4, droop: 1.8, base: [-0.25, -0.24, -0.16], rust: 22 },
  { len: 0.48, width: 0.03, pitch: 0.8, yaw: 2.4, droop: 1.3, base: [0.28, -0.2, -0.3], rust: 21 },
  { len: 0.5, width: 0.03, pitch: 0.6, yaw: 0.9, droop: 1.5, base: [-0.35, -0.22, -0.34], rust: 22 },
];
/** centre of the hero leaf (focus target) */
export const HERO_LEAF_MID: V = (() => {
  const g = ribbon({ ...LEAVES[0], seg: 18 });
  g.computeBoundingBox();
  const c = g.boundingBox!.getCenter(new THREE.Vector3());
  g.dispose();
  return [c.x, c.y, c.z] as const;
})();
/** centre of the rusty neighbour cluster (first focus) */
export const RUST_MID: V = [0.04, -0.06, -0.16];

export const RustLeaves: React.FC<{ readonly spread: number; readonly t: number }> = ({ spread, t }) => {
  const set = useMemo(() => {
    const hero = makeRustLeaf(null);
    hero.m.color.set("#5a9a34");
    hero.m.roughness = 0.4;
    const ra = makeRustLeaf(21);
    const rb = makeRustLeaf(22);
    const geos = LEAVES.map((l) => ribbon({ ...l, seg: 18 }));
    return { hero, ra, rb, geos };
  }, []);
  set.ra.uni.uSpread.value = spread;
  set.rb.uni.uSpread.value = spread * 0.92;
  const bokeh = useMemo(() => {
    const r = rng(88);
    // tiny dim rust spores drifting around the infected leaves (was: big unblurred white glint spheres)
    return Array.from({ length: 40 }, () => ({ p: [RUST_MID[0] + (r() - 0.5) * 0.3, RUST_MID[1] + (r() - 0.5) * 0.3, RUST_MID[2] + (r() - 0.5) * 0.2] as V, s: 0.0007 + r() * 0.001 }));
  }, []);
  return (
    <group>
      {LEAVES.map((l, i) => (
        <mesh key={i} geometry={set.geos[i]} material={l.rust === null ? set.hero.m : l.rust === 21 ? set.ra.m : set.rb.m} rotation={[0, 0, Math.sin(t * 1.1 + i) * 0.01]} castShadow receiveShadow />
      ))}
      {/* out-of-focus field behind: dark foliage wall + sun glints */}
      <mesh position={[0, 0, -2.4]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#26331f" roughness={1} />
      </mesh>
      {bokeh.map((b, i) => (
        <mesh key={i} position={[b.p[0] + Math.sin(t * 0.7 + i) * 0.006, b.p[1] + ((t * 0.01 + i * 0.013) % 0.04), b.p[2]]}>
          <sphereGeometry args={[b.s, 6, 4]} />
          <meshBasicMaterial color="#b85a22" transparent opacity={0.75 * Math.min(1, spread * 3)} />
        </mesh>
      ))}
    </group>
  );
};

/* ───────────── water ───────────── */
export type WaterUni = { uTime: { value: number }; uRip: { value: number } };

/** rippling water: ring ripples on a hashed grid (cell `cell` m) + travelling swell. Set uni.uTime each frame. */
export const useWaterMat = (color: string, cell: number, flow: number, opacity = 1) =>
  useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.05, metalness: 0.1, envMapIntensity: 1.3, transparent: opacity < 1, opacity });
    const uni: WaterUni = { uTime: { value: 0 }, uRip: { value: 1 } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uni);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vWp;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          varying vec3 vWp; uniform float uTime; uniform float uRip;
          float h1(vec2 c){ return fract(sin(dot(c, vec2(127.1, 311.7))) * 43758.5453); }
          vec2 ripples(vec2 p){
            vec2 g = vec2(0.0); float S = ${cell.toFixed(3)};
            vec2 cell = floor(p / S);
            for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
              vec2 c = cell + vec2(float(i), float(j));
              vec2 ctr = (c + vec2(h1(c), h1(c + 3.1))) * S;
              float age = fract(uTime * 1.3 + h1(c + 7.7));
              vec2 d = p - ctr; float r = length(d); float rr = age * S * 1.1;
              float x = (r - rr) * (40.0 / S);
              g += d / (r + 1e-4) * sin(x) * exp(-x * x * 0.08) * (1.0 - age);
            }
            return g;
          }`,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
          {
            vec2 p = vWp.xz + vec2(uTime * ${flow.toFixed(3)}, uTime * ${(flow * 0.4).toFixed(3)});
            vec2 g = ripples(vWp.xz) * 0.22 * uRip;
            g += vec2(sin(p.x * 3.1 + p.y * 1.7 + uTime * 2.0), cos(p.y * 2.7 - p.x * 1.3 + uTime * 1.6)) * 0.05;
            g += vec2(sin(p.x * 9.0 - uTime * 3.0), cos(p.y * 11.0 + uTime * 2.4)) * 0.02;
            normal = normalize(normal + (viewMatrix * vec4(g.x, 0.0, g.y, 0.0)).xyz);
          }`,
        );
    };
    m.customProgramCacheKey = () => `water-${cell}-${flow}-${opacity}`;
    return { m, uni };
  }, [color, cell, flow, opacity]);

/* ───────────── G: rice paddy ───────────── */
const paniclesGeo = (seed: number, h: number) => {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  const grain = new THREE.SphereGeometry(1, 5, 3);
  for (let k = 0; k < 3; k++) {
    const yaw = k * 2.1 + r() * 0.8;
    const lean = 0.12 + r() * 0.12;
    const top = new THREE.Vector3(Math.sin(lean) * Math.cos(yaw) * h, h, Math.sin(lean) * Math.sin(yaw) * h);
    parts.push(stem(h, 0.0028, [0, 0, 0]).applyMatrix4(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(-Math.sin(yaw), 0, Math.cos(yaw)), -lean)));
    // arching rachis: up, over, hanging down
    const pts: THREE.Vector3[] = [];
    const p = top.clone();
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const a = 0.3 + 2.4 * u;
      pts.push(p.clone());
      p.add(new THREE.Vector3(Math.sin(a) * Math.cos(yaw), Math.cos(a), Math.sin(a) * Math.sin(yaw)).multiplyScalar(0.028));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    parts.push(new THREE.TubeGeometry(curve, 10, 0.0012, 3, false));
    const side = new THREE.Vector3(-Math.sin(yaw), 0, Math.cos(yaw));
    for (let i = 0; i < 26; i++) {
      const u = 0.12 + 0.88 * (i / 25);
      const c = curve.getPointAt(u);
      const tg = curve.getTangentAt(u);
      const off = side.clone().multiplyScalar(((i % 2) * 2 - 1) * (0.004 + r() * 0.003));
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg.clone().add(new THREE.Vector3(0, -0.6, 0)).normalize());
      const gm = grain.clone().applyMatrix4(new THREE.Matrix4().compose(c.add(off), q, new THREE.Vector3(0.0019, 0.0046, 0.0019)));
      parts.push(gm);
    }
  }
  return mergeGeometries(parts.map((g) => g.toNonIndexed()))!;
};

const riceLeavesGeo = (seed: number) => {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 11; i++)
    parts.push(ribbon({ len: 0.45 + r() * 0.3, width: 0.011, pitch: 0.2 + r() * 0.5, yaw: r() * 6.28, droop: 0.7 + r() * 0.6, base: [(r() - 0.5) * 0.03, 0.02 + r() * 0.2, (r() - 0.5) * 0.03], seg: 8, fold: 0.1 }));
  return mergeGeometries(parts)!;
};

export const RicePaddy: React.FC<{ readonly t: number }> = ({ t }) => {
  const water = useWaterMat("#4c5a60", 0.32, 0.05);
  water.uni.uTime.value = t;
  const leafMat = useLeafMat("#8f9a42", false);
  const grainMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d1a24a", roughness: 0.55, envMapIntensity: 1.1 }), []);
  const geos = useMemo(() => [riceLeavesGeo(61), riceLeavesGeo(62), paniclesGeo(63, 0.8), paniclesGeo(64, 0.72)], []);
  const grid = useMemo(() => {
    const r = rng(606);
    const out: { p: V; s: number; v: number; ph: number }[] = [];
    for (let z = -9; z < 1.6; z += 0.3)
      for (let x = -3; x <= 3; x += 0.3) out.push({ p: [x + (r() - 0.5) * 0.06, -0.12, z + (r() - 0.5) * 0.06], s: 0.85 + r() * 0.3, v: r() < 0.5 ? 0 : 1, ph: r() * 6.28 });
    return out;
  }, []);
  const mats: THREE.Matrix4[][] = [[], []];
  for (const g of grid) {
    const sx = Math.sin(t * 1.7 + g.ph + g.p[0] * 0.8) * 0.05;
    const sz = Math.cos(t * 1.3 + g.ph * 1.3) * 0.04;
    mats[g.v].push(m4(g.p, [g.s, g.s, g.s], [sx, g.ph, sz]));
  }
  const rain = useMemo(() => {
    const r = rng(707);
    return Array.from({ length: 900 }, () => ({ x: (r() - 0.5) * 7, z: -7 + r() * 9, ph: r() }));
  }, []);
  const rainGeo = useMemo(() => new THREE.BoxGeometry(0.0022, 0.26, 0.0022), []);
  const rainMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#c8d4df", transparent: true, opacity: 0.32, depthWrite: false }), []);
  const rainMats = rain.map((d) => m4([d.x + 0.05 * Math.sin(d.ph * 9), 4.2 - ((t * 7.5 + d.ph * 4.2) % 4.2), d.z], [1, 1, 1], [0, 0, 0.08]));
  const trees = useMemo(() => {
    const r = rng(808);
    return Array.from({ length: 40 }, (_, i) => m4([-30 + i * 1.6 + r(), 1.5 + r() * 2, -26 - r() * 3], [1.6 + r(), 2 + r() * 1.6, 1.6], [0, 0, 0]));
  }, []);
  const treeGeo = useMemo(() => new THREE.SphereGeometry(1, 10, 8), []);
  const treeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a3528", roughness: 1 }), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={water.m}>
        <planeGeometry args={[80, 80]} />
      </mesh>
      <Instanced geo={geos[0]} mat={leafMat} mats={mats[0]} />
      <Instanced geo={geos[1]} mat={leafMat} mats={mats[1]} />
      <Instanced geo={geos[2]} mat={grainMat} mats={mats[0]} />
      <Instanced geo={geos[3]} mat={grainMat} mats={mats[1]} />
      {/* earthen bund across the far end + tree line in the rain haze */}
      <mesh position={[0, 0.12, -10.5]}>
        <boxGeometry args={[40, 0.4, 0.9]} />
        <meshStandardMaterial color="#4a3d30" roughness={0.95} />
      </mesh>
      <Instanced geo={treeGeo} mat={treeMat} mats={trees} />
      <Instanced geo={rainGeo} mat={rainMat} mats={rainMats} />
    </group>
  );
};
