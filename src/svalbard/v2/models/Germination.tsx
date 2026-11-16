/**
 * Part 3 · G — macro time-lapse of a wheat grain germinating on dark, moist soil.
 * Grain: real caryopsis shape (ventral crease, pointed embryo end, blunt brush end), textured coat with normal map and sheen,
 * coat split along the dorsal seam over the embryo. Seedling: white radicle + 2 seminal roots with fine root hairs curving
 * into the soil, pale coleoptile, first leaf blade that emerges rolled and unrolls (veins, cupped, dew droplets).
 * Set: displaced soil with crumbs + wet sheen, frost that melts into droplets, background bokeh, floating motes.
 * Units: 1 ≈ 7 mm (grain ≈ 1 long). Grain local axes: +x = embryo end, +y = dorsal (up), crease on −y. All deterministic.
 */
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { canvasTex, fbm, rng } from "../../three/util";
import { P } from "../palette";
import { Instanced } from "./Corridor";

type V = [number, number, number];
const c01 = (x: number) => Math.max(0, Math.min(1, x));
const sstep = (a: number, b: number, x: number) => {
  const t = c01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const linear = (t: THREE.Texture) => {
  t.colorSpace = THREE.NoColorSpace;
  return t;
};
/** dispose a per-frame geometry when it is replaced */
const useDisposable = <G extends THREE.BufferGeometry | null>(g: G) => {
  useEffect(() => () => g?.dispose(), [g]);
  return g;
};

/** tangent-space normal map from a height field (wraps) */
const normalTex = (w: number, h: number, H: Float32Array, strength: number, repeat?: [number, number]) =>
  linear(
    canvasTex(
      w,
      h,
      (g) => {
        const img = g.createImageData(w, h);
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const dx = H[y * w + ((x + 1) % w)] - H[y * w + ((x - 1 + w) % w)];
            const dy = H[((y + 1) % h) * w + x] - H[((y - 1 + h) % h) * w + x];
            let nx = -dx * strength;
            let ny = dy * strength;
            const l = Math.hypot(nx, ny, 1);
            nx /= l;
            ny /= l;
            const i = (y * w + x) * 4;
            img.data[i] = (nx * 0.5 + 0.5) * 255;
            img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
            img.data[i + 2] = (0.5 / l + 0.5) * 255;
            img.data[i + 3] = 255;
          }
        g.putImageData(img, 0, 0);
      },
      repeat,
    ),
  );

/* ═════════════════════ soil ═════════════════════ */
export const soilH = (x: number, z: number) => {
  const r = Math.hypot(x, z);
  const a = 0.4 + 0.6 * sstep(0.6, 1.6, r);
  return (0.04 * (fbm(x * 2.2 + 5, z * 2.2 + 1, 4) - 0.5) + 0.014 * (fbm(x * 9 + 2, z * 9, 3) - 0.5)) * a;
};

const useSoilMats = () =>
  useMemo(() => {
    const N = 512;
    const H = new Float32Array(N * N);
    const R = new Float32Array(N * N);
    const r = rng(71);
    const col = canvasTex(
      N,
      N,
      (g) => {
        const img = g.createImageData(N, N);
        for (let y = 0; y < N; y++)
          for (let x = 0; x < N; x++) {
            const u = x / N;
            const v = y / N;
            // tileable-ish: sample on a torus-free blend of two offsets
            const n1 = fbm(u * 16, v * 16, 4);
            const n2 = fbm(u * 48 + 7, v * 48 + 3, 3);
            const clump = sstep(0.42, 0.62, n1);
            const h = clump * 0.7 + n2 * 0.3;
            const wet = sstep(0.45, 0.7, fbm(u * 6 + 11, v * 6 + 5, 3));
            H[y * N + x] = h;
            R[y * N + x] = wet;
            const d = 0.55 + 0.45 * h;
            const i = (y * N + x) * 4;
            img.data[i] = (54 + 28 * n2) * d * (1 - 0.3 * wet);
            img.data[i + 1] = (37 + 19 * n2) * d * (1 - 0.3 * wet);
            img.data[i + 2] = (25 + 11 * n2) * d * (1 - 0.25 * wet);
            img.data[i + 3] = 255;
          }
        g.putImageData(img, 0, 0);
        // sand grains + a few perlite flecks
        for (let k = 0; k < 2600; k++) {
          const s = 0.6 + r() * 1.6;
          const l = r();
          g.fillStyle = l > 0.985 ? "rgba(214,210,200,0.9)" : `rgba(${90 + l * 60},${70 + l * 45},${50 + l * 30},${0.35 + r() * 0.4})`;
          g.beginPath();
          g.arc(r() * N, r() * N, l > 0.985 ? s * 2.2 : s, 0, Math.PI * 2);
          g.fill();
        }
      },
      [5, 5],
    );
    const rough = linear(
      canvasTex(
        N,
        N,
        (g) => {
          const img = g.createImageData(N, N);
          for (let i = 0; i < N * N; i++) {
            const v = 240 - R[i] * 95;
            img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
            img.data[i * 4 + 3] = 255;
          }
          g.putImageData(img, 0, 0);
        },
        [5, 5],
      ),
    );
    const nrm = normalTex(N, N, H, 9, [5, 5]);
    const soil = new THREE.MeshPhysicalMaterial({ map: col, roughnessMap: rough, roughness: 1, normalMap: nrm, normalScale: new THREE.Vector2(1.2, 1.2), clearcoat: 0.08, clearcoatRoughness: 0.4 });
    const crumb = new THREE.MeshStandardMaterial({ map: col, normalMap: nrm, roughness: 0.85, color: "#ffffff" });
    return { soil, crumb };
  }, []);

const crumbGeo = () => {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const k = 0.75 + 0.5 * fbm(x * 2 + 3, y * 2 + z * 1.7, 2);
    p.setXYZ(i, x * k, y * k * 0.75, z * k);
  }
  g.computeVertexNormals();
  return g;
};

export const Soil: React.FC = () => {
  const { soil, crumb } = useSoilMats();
  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(12, 12, 220, 220);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, soilH(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  const cg = useMemo(crumbGeo, []);
  const crumbs = useMemo(() => {
    const r = rng(23);
    const out: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion();
    for (let i = 0; i < 2600; i++) {
      const a = r() * Math.PI * 2;
      const d = 0.25 + Math.pow(r(), 1.3) * 3.2;
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d - 0.4;
      // keep the grain footprint + root lane clear
      if (Math.abs(x - 0.2) < 0.75 && Math.abs(z) < 0.32) continue;
      const s = 0.008 + Math.pow(r(), 2.6) * 0.045;
      q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6));
      out.push(new THREE.Matrix4().compose(new THREE.Vector3(x, soilH(x, z) + s * 0.25, z), q, new THREE.Vector3(s, s, s)));
    }
    // out-of-focus foreground crumbs between lens and seed
    for (let i = 0; i < 26; i++) {
      const x = -1.1 + r() * 2.6;
      const z = 1.05 + r() * 0.9;
      const s = 0.03 + r() * 0.06;
      q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6));
      out.push(new THREE.Matrix4().compose(new THREE.Vector3(x, soilH(x, z) + s * 0.2, z), q, new THREE.Vector3(s, s, s)));
    }
    return out;
  }, []);
  return (
    <group>
      <mesh geometry={ground} material={soil} receiveShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -14]} material={soil}>
        <planeGeometry args={[60, 18]} />
      </mesh>
      <Instanced geo={cg} mat={crumb} mats={crumbs} shadows />
    </group>
  );
};

/* ═════════════════════ background bokeh + motes ═════════════════════ */
const discTex = () =>
  canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62);
    gr.addColorStop(0, "rgba(255,255,255,0.75)");
    gr.addColorStop(0.72, "rgba(255,255,255,0.6)");
    gr.addColorStop(0.9, "rgba(255,255,255,0.85)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });

/** soft out-of-focus discs far behind the subject. warm 0..1 mixes amber discs in */
export const Bokeh: React.FC<{ readonly warm: number; readonly z?: number }> = ({ warm, z = -5 }) => {
  const tex = useMemo(discTex, []);
  const discs = useMemo(() => {
    const r = rng(91);
    return Array.from({ length: 14 }, (_, i) => ({ p: [-3.2 + r() * 6.4, 0.3 + r() * 2.2, z - r() * 3] as V, s: 0.2 + r() * 0.4, o: 0.04 + r() * 0.09, amber: i % 3 !== 0 }));
  }, [z]);
  const mats = useMemo(
    () =>
      discs.map(() => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false })),
    [discs, tex],
  );
  discs.forEach((d, i) => {
    mats[i].color.set(d.amber ? P.amber : P.snow).lerp(new THREE.Color(P.steel), d.amber ? 1 - warm : 0.3);
    mats[i].opacity = d.o * (d.amber ? 0.4 + 0.6 * warm : 0.7);
  });
  return (
    <group>
      {discs.map((d, i) => (
        <mesh key={i} position={d.p} scale={d.s} material={mats[i]}>
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
    </group>
  );
};

/** slow floating dust motes (out of focus, catch the light) */
export const Motes: React.FC<{ readonly t: number }> = ({ t }) => {
  const geo = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#f3e6cc", transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), []);
  const seeds = useMemo(() => {
    const r = rng(13);
    return Array.from({ length: 40 }, () => [r(), r(), r(), r()]);
  }, []);
  const ms = seeds.map((s) => {
    const x = -1.2 + s[0] * 2.8 + Math.sin(t * 0.3 + s[3] * 6) * 0.05;
    const y = 0.15 + ((s[1] * 2.6 + t * (0.02 + s[3] * 0.03)) % 2.6);
    const z = -0.8 + s[2] * 2.8;
    const sc = 0.004 + s[3] * 0.006;
    return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(sc, sc, sc));
  });
  return <Instanced geo={geo} mat={mat} mats={ms} />;
};

/* ═════════════════════ grain ═════════════════════ */
export const GRAIN = { L: 0.5, H: 0.215, W: 0.25 } as const;
export const SEED_Y = 0.15;
export const SEED_YAW = -0.35;

/** deformed grain surface for a unit-sphere direction (x = length axis). split opens the dorsal seam over the embryo. */
const grainP = (nx: number, ny: number, nz: number, seam: number, side: number, split: number): V => {
  const r = Math.sqrt(Math.max(1e-6, 1 - nx * nx));
  const full = Math.pow(r, -0.22);
  const s = (1 - 0.2 * sstep(0.35, 1, nx)) * (1 + 0.05 * sstep(0.3, 1, -nx)) * full;
  let X = nx * GRAIN.L;
  let Y = ny * GRAIN.H * s;
  let Z = nz * GRAIN.W * s;
  if (ny < 0) Y += 0.07 * Math.exp(-(nz * nz) / 0.03) * Math.pow(-ny, 0.6) * Math.pow(r, 0.5);
  Y -= 0.012 * sstep(0.55, 0.85, nx) * sstep(0.2, 0.7, ny);
  if (split > 0) {
    const g = split * 0.075 * sstep(0.15, 0.75, nx) * Math.exp(-((seam / 0.45) ** 2)) * sstep(0, 0.4, ny);
    Z += side * g;
    Y += g * 0.3;
    X += g * 0.15;
  }
  return [X, Y, Z];
};

/** point + outward normal on the closed grain at length param ex (−1..1) and angle phi (0 = dorsal top, π/2 = +z side) */
export const grainSurf = (ex: number, phi: number): { p: V; n: V } => {
  const r = Math.sqrt(Math.max(0, 1 - ex * ex));
  const p = grainP(ex, Math.cos(phi) * r, Math.sin(phi) * r, 1, 0, 0);
  const n = new THREE.Vector3(p[0] / GRAIN.L ** 2, p[1] / GRAIN.H ** 2, p[2] / GRAIN.W ** 2).normalize();
  return { p, n: [n.x, n.y, n.z] };
};

const halfGeo = (half: 0 | 1, split: number) => {
  const phiStart = half === 0 ? 0 : Math.PI;
  const g = new THREE.SphereGeometry(1, 72, 56, phiStart, Math.PI);
  g.rotateZ(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const phi = phiStart + uv.getX(i) * Math.PI;
    uv.setX(i, phi / (Math.PI * 2));
    const seam = half === 0 ? phi : Math.PI * 2 - phi;
    const q = grainP(p.getX(i), p.getY(i), p.getZ(i), seam, half === 0 ? 1 : -1, split);
    p.setXYZ(i, q[0], q[1], q[2]);
  }
  g.computeVertexNormals();
  return g;
};

const useCoatMat = () =>
  useMemo(() => {
    const W = 512;
    const Hh = 256;
    const H = new Float32Array(W * Hh);
    const map = canvasTex(W, Hh, (g) => {
      const img = g.createImageData(W, Hh);
      for (let y = 0; y < Hh; y++)
        for (let x = 0; x < W; x++) {
          const u = x / W;
          const v = 1 - y / Hh; // 1 = embryo end
          const dorsal = Math.min(u, 1 - u); // 0 at the dorsal seam
          const strip = (Math.sin(u * Math.PI * 2 * 150 + 9 * fbm(u * 10, v * 4, 3)) * 0.5 + 0.5) * (0.4 + 0.6 * fbm(u * 30 + 4, v * 2, 2));
          const micro = fbm(u * 90, v * 40, 3);
          const emb = sstep(0.8, 0.9, v) * (1 - sstep(0.07, 0.13, dorsal));
          const ripple = emb * (Math.sin(Math.hypot(dorsal * 9, (1 - v) * 5) * 60) * 0.5 + 0.5);
          const crease = Math.exp(-(((u - 0.5) / 0.012) ** 2));
          const brush = sstep(0.08, 0, v);
          H[y * W + x] = strip * 0.12 + micro * 0.55 + ripple * 0.5 - crease * 0.8;
          const tone = fbm(u * 6 + 2, v * 4, 3) - 0.5;
          const i = (y * W + x) * 4;
          let R = 158 + tone * 36 - strip * 5 + micro * 10;
          let G = 108 + tone * 26 - strip * 4 + micro * 8;
          let B = 66 + tone * 16 - strip * 2;
          R = R * (1 - emb) + (206 - ripple * 22) * emb;
          G = G * (1 - emb) + (164 - ripple * 22) * emb;
          B = B * (1 - emb) + (98 - ripple * 14) * emb;
          const dk = 1 - 0.35 * crease - 0.22 * brush;
          img.data[i] = R * dk;
          img.data[i + 1] = G * dk;
          img.data[i + 2] = B * dk;
          img.data[i + 3] = 255;
        }
      g.putImageData(img, 0, 0);
    });
    const nrm = normalTex(W, Hh, H, 3.2);
    return new THREE.MeshPhysicalMaterial({
      map,
      normalMap: nrm,
      normalScale: new THREE.Vector2(0.9, 0.9),
      roughness: 0.62,
      sheen: 0.45,
      sheenColor: new THREE.Color("#ffdcaa"),
      sheenRoughness: 0.45,
      clearcoat: 0.15,
      clearcoatRoughness: 0.45,
      side: THREE.DoubleSide,
    });
  }, []);

/* ═════════════════════ seedling ═════════════════════ */
/** tapered tube along the first k (0..1, arc length) of a curve, rounded tip */
const taperTube = (curve: THREE.Curve<THREE.Vector3>, k: number, r0: number, r1: number, seg = 48, rad = 12) => {
  const kk = Math.max(0.004, k);
  const len = curve.getLength() * kk;
  const capU = Math.max(0, 1 - (r1 * 1.1) / Math.max(1e-4, len));
  const pos: number[] = [];
  const nor: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  let n = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const p = curve.getPointAt(u * kk);
    const tg = curve.getTangentAt(u * kk).normalize();
    if (i === 0) {
      n = new THREE.Vector3(0, 0, 1).cross(tg);
      if (n.lengthSq() < 1e-4) n.set(1, 0, 0).cross(tg);
      n.normalize();
    } else n.sub(tg.clone().multiplyScalar(tg.dot(n))).normalize();
    b.copy(tg).cross(n);
    let r = r0 + (r1 - r0) * u;
    if (u > capU) r *= Math.sqrt(Math.max(0, 1 - ((u - capU) / (1 - capU + 1e-6)) ** 2));
    for (let j = 0; j <= rad; j++) {
      const a = (j / rad) * Math.PI * 2;
      const dx = Math.cos(a) * n.x + Math.sin(a) * b.x;
      const dy = Math.cos(a) * n.y + Math.sin(a) * b.y;
      const dz = Math.cos(a) * n.z + Math.sin(a) * b.z;
      pos.push(p.x + dx * r, p.y + dy * r, p.z + dz * r);
      nor.push(dx, dy, dz);
      uvs.push(j / rad, u);
    }
  }
  for (let i = 0; i < seg; i++)
    for (let j = 0; j < rad; j++) {
      const a = i * (rad + 1) + j;
      const c = a + rad + 1;
      idx.push(a, c, a + 1, a + 1, c, c + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  return g;
};

const curve = (pts: V[]) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal");
const ROOT_MAIN = curve([
  [0.47, -0.02, 0.0],
  [0.58, -0.07, 0.06],
  [0.7, -0.103, 0.13],
  [0.84, -0.115, 0.2],
  [0.97, -0.125, 0.25],
  [1.05, -0.18, 0.27],
  [1.08, -0.3, 0.27],
]);
const ROOT_B = curve([
  [0.46, -0.05, -0.03],
  [0.55, -0.1, -0.1],
  [0.63, -0.13, -0.2],
  [0.67, -0.24, -0.27],
]);
const ROOT_C = curve([
  [0.46, -0.05, 0.04],
  [0.52, -0.11, 0.13],
  [0.5, -0.135, 0.25],
  [0.47, -0.25, 0.33],
]);
const COLEO = curve([
  [0.36, 0.06, 0.0],
  [0.41, 0.2, 0.01],
  [0.45, 0.42, 0.02],
  [0.44, 0.7, 0.03],
]);
const LEAF_D = new THREE.Vector3(-0.8, 0, 0.6).normalize();
const UP = new THREE.Vector3(0, 1, 0);

const vTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => canvasTex(w, h, draw);

/** leaf blade surface (local to the grain group). e = emergence 0..1, unfurl 0..1 */
const leafSurface = (e: number, unfurl: number, base: THREE.Vector3) => {
  const Lb = 0.95 * e;
  const Wm = 0.13;
  const NV = 64;
  const bend = 1.15 * e;
  const Sa = new THREE.Vector3().crossVectors(UP, LEAF_D).normalize();
  // centre line by integration
  const C: THREE.Vector3[] = [base.clone()];
  const Tn: THREE.Vector3[] = [];
  for (let i = 0; i <= NV; i++) {
    const v = i / NV;
    const ph = 0.12 + bend * Math.pow(v, 1.5);
    const T = UP.clone().multiplyScalar(Math.cos(ph)).addScaledVector(LEAF_D, Math.sin(ph));
    Tn.push(T);
    if (i > 0) C.push(C[i - 1].clone().addScaledVector(T, Lb / NV));
  }
  const width = (v: number) => Wm * Math.min(1, Math.pow(1 - v, 0.65) * 1.25) * (0.55 + 0.45 * sstep(0, 0.18, v));
  const pt = (s: number, v: number) => {
    const i = Math.min(NV, Math.round(v * NV));
    const T = Tn[i];
    const Nf = new THREE.Vector3().crossVectors(T, Sa);
    const tw = 0.5 * v * unfurl;
    const S2 = Sa.clone().multiplyScalar(Math.cos(tw)).addScaledVector(Nf, Math.sin(tw));
    const N2 = Nf.clone().multiplyScalar(Math.cos(tw)).addScaledVector(Sa, -Math.sin(tw));
    const w = width(v);
    const open = sstep(0, 1, unfurl * 1.6 - 0.6 * (1 - v));
    const cRoll = (Math.PI * 2 * 0.9) / Math.max(1e-3, w);
    const c = Math.min(400, cRoll + (5 - cRoll) * open);
    const arc = (s * w) / 2;
    const th = arc * c;
    const off = S2.clone().multiplyScalar(Math.sin(th) / c).addScaledVector(N2, (1 - Math.cos(th)) / c);
    off.addScaledVector(N2, 0.004 * Math.sin(v * 38) * s * s * open);
    return { p: C[i].clone().add(off), n: N2 };
  };
  return { pt, NV };
};

const leafGeo = (e: number, unfurl: number, base: THREE.Vector3) => {
  const { pt, NV } = leafSurface(e, unfurl, base);
  const NU = 14;
  const pos: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= NV; i++)
    for (let j = 0; j <= NU; j++) {
      const s = (j / NU) * 2 - 1;
      const q = pt(s, i / NV).p;
      pos.push(q.x, q.y, q.z);
      uvs.push(j / NU, i / NV);
    }
  for (let i = 0; i < NV; i++)
    for (let j = 0; j < NU; j++) {
      const a = i * (NU + 1) + j;
      const c = a + NU + 1;
      idx.push(a, a + 1, c, a + 1, c + 1, c);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

const useSeedlingMats = () =>
  useMemo(() => {
    const root = new THREE.MeshPhysicalMaterial({ color: "#f4f0e6", roughness: 0.5, sheen: 0.9, sheenColor: new THREE.Color("#ffffff"), sheenRoughness: 0.4, emissive: "#3b3326", emissiveIntensity: 0.25 });
    const rootTip = new THREE.MeshPhysicalMaterial({ color: "#efe0b4", roughness: 0.3, clearcoat: 0.6, emissive: "#3b3016", emissiveIntensity: 0.3 });
    const hair = new THREE.MeshStandardMaterial({ color: "#f7f4ec", roughness: 0.6, transparent: true, opacity: 0.5, emissive: "#fff2d8", emissiveIntensity: 0.12 });
    const coleo = new THREE.MeshPhysicalMaterial({
      map: vTex(64, 256, (g) => {
        const gr = g.createLinearGradient(0, 256, 0, 0);
        gr.addColorStop(0, "#efe7cf");
        gr.addColorStop(0.6, "#e6e6bf");
        gr.addColorStop(1, "#cbd998");
        g.fillStyle = gr;
        g.fillRect(0, 0, 64, 256);
        g.fillStyle = "rgba(150,160,90,0.35)";
        g.fillRect(14, 0, 3, 256);
        g.fillRect(46, 0, 3, 256);
      }),
      roughness: 0.4,
      sheen: 0.7,
      sheenColor: new THREE.Color("#fffbe8"),
      clearcoat: 0.3,
      clearcoatRoughness: 0.3,
      emissive: "#4a4420",
      emissiveIntensity: 0.15,
    });
    const LW = 128;
    const LH = 512;
    const Hh = new Float32Array(LW * LH);
    const leafMap = vTex(LW, LH, (g) => {
      const img = g.createImageData(LW, LH);
      for (let y = 0; y < LH; y++)
        for (let x = 0; x < LW; x++) {
          const u = x / LW;
          const v = 1 - y / LH; // 1 = tip
          const du = Math.abs(u - 0.5);
          const vein = Math.max(Math.exp(-((du / 0.012) ** 2)) * 1.0, Math.pow(Math.abs(Math.cos(du * Math.PI * 22)), 40) * 0.55);
          const n = fbm(u * 30, v * 120, 3);
          Hh[y * LW + x] = vein + n * 0.25;
          const base = sstep(0.0, 0.28, v);
          const R = (196 - 98 * base - 12 * v) * (0.92 + 0.12 * n) + vein * 26;
          const G = (210 - 46 * base - 16 * v) * (0.92 + 0.1 * n) + vein * 24;
          const B = (132 - 72 * base - 6 * v) * (0.9 + 0.1 * n) + vein * 12;
          const i = (y * LW + x) * 4;
          img.data[i] = R;
          img.data[i + 1] = G;
          img.data[i + 2] = B;
          img.data[i + 3] = 255;
        }
      g.putImageData(img, 0, 0);
    });
    const leafN = normalTex(LW, LH, Hh, 2.2);
    const leaf = new THREE.MeshPhysicalMaterial({
      map: leafMap,
      normalMap: leafN,
      normalScale: new THREE.Vector2(0.7, 0.7),
      roughness: 0.36,
      sheen: 0.5,
      sheenColor: new THREE.Color("#e4f5c0"),
      sheenRoughness: 0.5,
      clearcoat: 0.25,
      clearcoatRoughness: 0.3,
      emissive: "#ffffff",
      emissiveMap: leafMap,
      emissiveIntensity: 0.05,
      side: THREE.DoubleSide,
    });
    const inner = new THREE.MeshPhysicalMaterial({ color: "#efe3c2", roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color("#fff8e6") });
    return { root, rootTip, hair, coleo, leaf, inner };
  }, []);

const useWaterMats = () =>
  useMemo(() => {
    const drop = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.03, transmission: 1, thickness: 0.03, ior: 1.33, specularIntensity: 1, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6 });
    const ice = new THREE.MeshPhysicalMaterial({ color: "#e2edf4", roughness: 0.15, clearcoat: 1, transparent: true, opacity: 0.8, emissive: "#6f97b5", emissiveIntensity: 0.05, side: THREE.DoubleSide });
    return { drop, ice };
  }, []);

const orient = (p: V | THREE.Vector3, n: V | THREE.Vector3, s: V) => {
  const P0 = Array.isArray(p) ? new THREE.Vector3(...p) : p;
  const N0 = Array.isArray(n) ? new THREE.Vector3(...n) : n;
  return new THREE.Matrix4().compose(P0, new THREE.Quaternion().setFromUnitVectors(UP, N0.clone().normalize()), new THREE.Vector3(...s));
};

/**
 * The germinating grain + its set dressing (grain-local frost/droplets).
 * melt 0..1 frost → droplets · wet 0..1 coat wetness · split 0..1 coat opens · root 0..1 · side 0..1 seminal roots ·
 * coleo 0..1 coleoptile · emerge 0..1 leaf length · unfurl 0..1 leaf opens · warm 0..1 backlight glow
 */
export const GerminatingSeed: React.FC<{
  readonly melt: number;
  readonly split: number;
  readonly root: number;
  readonly side: number;
  readonly coleo: number;
  readonly emerge: number;
  readonly unfurl: number;
  readonly warm: number;
}> = ({ melt, split, root, side, coleo, emerge, unfurl, warm }) => {
  const coat = useCoatMat();
  const m = useSeedlingMats();
  const w = useWaterMats();
  const sq = Math.round(split * 60) / 60;
  const hA = useDisposable(useMemo(() => halfGeo(0, sq), [sq]));
  const hB = useDisposable(useMemo(() => halfGeo(1, sq), [sq]));

  // per-frame material state: frost tint → wet sheen; leaf glows when backlit
  coat.clearcoat = 0.08 + 0.3 * melt;
  coat.clearcoatRoughness = 0.5 - 0.2 * melt;
  coat.color.set("#ffffff").lerp(new THREE.Color("#d6e2ea"), 0.5 * (1 - melt));
  m.leaf.emissiveIntensity = 0.04 + 0.12 * warm;
  m.hair.emissiveIntensity = 0.06 + 0.16 * warm;

  const rq = Math.round(root * 300) / 300;
  const rootG = useDisposable(useMemo(() => (rq > 0 ? taperTube(ROOT_MAIN, rq, 0.02, 0.013, 56, 12) : null), [rq]));
  const sdq = Math.round(side * 200) / 200;
  const rootBG = useDisposable(useMemo(() => (sdq > 0 ? taperTube(ROOT_B, sdq, 0.015, 0.01, 28, 10) : null), [sdq]));
  const rootCG = useDisposable(useMemo(() => (sdq > 0 ? taperTube(ROOT_C, sdq * 0.9, 0.015, 0.01, 28, 10) : null), [sdq]));
  const cq = Math.round(coleo * 300) / 300;
  const coleoG = useDisposable(useMemo(() => (cq > 0 ? taperTube(COLEO, cq, 0.034, 0.027, 48, 14) : null), [cq]));
  const eq = Math.round(emerge * 300) / 300;
  const uq = Math.round(unfurl * 200) / 200;
  const leafBase = useMemo(() => COLEO.getPointAt(Math.max(0.02, cq * 0.93)), [cq]);
  const leafG = useDisposable(useMemo(() => (eq > 0.01 ? leafGeo(eq, uq, leafBase) : null), [eq, uq, leafBase]));

  const hairGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 0.6, 1, 4, 1, true);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const dropGeo = useMemo(() => new THREE.SphereGeometry(1, 20, 14), []);
  const hexGeo = useMemo(() => new THREE.CircleGeometry(1, 6), []);
  const R = useMemo(() => {
    const r = rng(57);
    return Array.from({ length: 1200 }, () => [r(), r(), r(), r(), r()]);
  }, []);

  // root hairs: maturation zone behind the tip (bare tip), fuzz grows outward
  const hairs: THREE.Matrix4[] = [];
  const addHairs = (cv: THREE.Curve<THREE.Vector3>, k: number, n: number, off: number, rr: number) => {
    for (let i = 0; i < n; i++) {
      const s = R[off + i];
      const at = 0.06 + s[0] * 0.94;
      const age = k - 0.08 - at;
      if (age <= 0) continue;
      const len = (0.012 + s[1] * s[1] * 0.03) * c01(age / 0.18);
      const p = cv.getPointAt(at);
      const tg = cv.getTangentAt(at);
      let nn = new THREE.Vector3(0, 0, 1).cross(tg);
      if (nn.lengthSq() < 1e-4) nn = new THREE.Vector3(1, 0, 0).cross(tg);
      nn.normalize();
      const bb = tg.clone().cross(nn);
      const a = s[2] * Math.PI * 2;
      const d = nn.multiplyScalar(Math.cos(a)).addScaledVector(bb, Math.sin(a)).addScaledVector(tg, -0.3 + s[3] * 0.5).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(UP, d);
      const th = 0.0006 + s[4] * 0.0005;
      hairs.push(new THREE.Matrix4().compose(p.addScaledVector(d, rr * 0.8), q, new THREE.Vector3(th, len, th)));
    }
  };
  // brush: the short tuft of hairs on the blunt (non-embryo) end of a wheat grain
  for (let i = 0; i < 80; i++) {
    const s = R[1120 + (i % 80)];
    const { p, n } = grainSurf(-0.93 - s[0] * 0.06, s[1] * Math.PI * 2);
    const d = new THREE.Vector3(...n).add(new THREE.Vector3(-1.4, 0, 0)).normalize();
    const th = 0.0007;
    hairs.push(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromUnitVectors(UP, d), new THREE.Vector3(th, 0.02 + s[2] * 0.03, th)));
  }
  if (rq > 0.15) addHairs(ROOT_MAIN, rq, 900, 0, 0.017);
  if (sdq > 0.2) addHairs(ROOT_C, sdq * 0.9, 220, 900, 0.012);
  const rootTip = rq > 0 ? ROOT_MAIN.getPointAt(rq) : null;

  // frost crystals on the dorsal coat (melt away) + droplets that bead up as it melts
  const frost: THREE.Matrix4[] = [];
  const drops: THREE.Matrix4[] = [];
  if (melt < 1)
    for (let i = 0; i < 260; i++) {
      const s = R[i];
      const { p, n } = grainSurf(-0.92 + s[0] * 1.84, (s[1] - 0.5) * 2.6);
      const sz = (0.006 + s[2] * 0.012) * (1 - melt) * sstep(0, 0.15, 1 - melt + s[3] * 0.1);
      if (sz < 1e-4) continue;
      const m4 = orient(p, n, [sz, sz, sz]);
      m4.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2 + (s[4] - 0.5) * 0.9));
      frost.push(m4);
    }
  if (melt > 0)
    for (let i = 0; i < 22; i++) {
      const s = R[300 + i];
      const { p, n } = grainSurf(-0.8 + s[0] * 1.3, (s[1] - 0.5) * 2.2);
      const rad = (0.008 + s[2] * 0.016) * sstep(0.1 + s[3] * 0.4, 0.6 + s[3] * 0.4, melt);
      if (rad < 1e-4) continue;
      const pp = new THREE.Vector3(...p).addScaledVector(new THREE.Vector3(...n), rad * 0.45);
      drops.push(orient(pp, n, [rad, rad * 0.62, rad]));
    }
  // dew on the coleoptile and the opened leaf
  if (cq > 0.6)
    for (let i = 0; i < 3; i++) {
      const s = R[340 + i];
      const at = 0.3 + s[0] * 0.5;
      const p = COLEO.getPointAt(at * cq);
      const rad = 0.009 + s[1] * 0.008;
      const d = new THREE.Vector3(0.6, 0.1, 0.8).normalize();
      drops.push(orient(p.addScaledVector(d, 0.03 + rad * 0.3), d, [rad, rad * 0.7, rad]));
    }
  if (eq > 0.5 && uq > 0.4) {
    const { pt } = leafSurface(eq, uq, leafBase);
    for (let i = 0; i < 7; i++) {
      const s = R[360 + i];
      const v = 0.25 + s[0] * 0.6;
      const q = pt((s[1] - 0.5) * 0.6, v);
      const rad = (0.007 + s[2] * 0.011) * sstep(0.4, 0.8, uq);
      if (rad < 1e-4) continue;
      drops.push(orient(q.p.addScaledVector(q.n, rad * 0.5), q.n, [rad, rad * 0.65, rad]));
    }
  }

  return (
    <group>
      <mesh geometry={hA} material={coat} castShadow receiveShadow />
      <mesh geometry={hB} material={coat} castShadow receiveShadow />
      {/* embryo tissue seen through the opening seam */}
      {sq > 0 ? <mesh position={[0.3, 0.0, 0]} scale={[0.2, 0.1, 0.11]} material={m.inner}><sphereGeometry args={[1, 32, 20]} /></mesh> : null}
      {/* coleorhiza swelling at the embryo tip before the radicle breaks out */}
      {sq > 0.2 ? (
        <mesh position={[0.46, -0.02, 0]} scale={0.02 + 0.022 * sstep(0.2, 0.8, sq)} material={m.root}>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
      ) : null}
      {rootG ? <mesh geometry={rootG} material={m.root} castShadow /> : null}
      {rootTip ? (
        <mesh position={rootTip} scale={0.0135} material={m.rootTip}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ) : null}
      {rootBG ? <mesh geometry={rootBG} material={m.root} castShadow /> : null}
      {rootCG ? <mesh geometry={rootCG} material={m.root} castShadow /> : null}
      {hairs.length ? <Instanced geo={hairGeo} mat={m.hair} mats={hairs} /> : null}
      {coleoG ? <mesh geometry={coleoG} material={m.coleo} castShadow /> : null}
      {leafG ? <mesh geometry={leafG} material={m.leaf} castShadow /> : null}
      {frost.length ? <Instanced geo={hexGeo} mat={w.ice} mats={frost} /> : null}
      {drops.length ? <Instanced geo={dropGeo} mat={w.drop} mats={drops} /> : null}
    </group>
  );
};

/** soil frost flakes (melt away) + soil droplets (bead up), world space around the grain */
export const SoilWater: React.FC<{ readonly melt: number }> = ({ melt }) => {
  const w = useWaterMats();
  const hexGeo = useMemo(() => new THREE.CircleGeometry(1, 6), []);
  const dropGeo = useMemo(() => new THREE.SphereGeometry(1, 16, 12), []);
  const R = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: 520 }, () => [r(), r(), r(), r(), r()]);
  }, []);
  const frost: THREE.Matrix4[] = [];
  const drops: THREE.Matrix4[] = [];
  R.forEach((s, i) => {
    const a = s[0] * Math.PI * 2;
    const d = 0.35 + Math.sqrt(s[1]) * 1.6;
    const x = Math.cos(a) * d + 0.2;
    const z = Math.sin(a) * d * 0.8;
    const y = soilH(x, z);
    if (i < 460) {
      const sz = (0.006 + s[2] * 0.014) * (1 - melt);
      if (sz > 1e-4) frost.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y + 0.004, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + (s[3] - 0.5) * 0.8, 0, s[4] * 6)), new THREE.Vector3(sz, sz, sz)));
    } else {
      const rad = (0.01 + s[2] * 0.02) * sstep(0.2 + s[3] * 0.3, 0.7 + s[3] * 0.3, melt);
      if (rad > 1e-4) drops.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y + rad * 0.35, z), new THREE.Quaternion(), new THREE.Vector3(rad, rad * 0.55, rad)));
    }
  });
  return (
    <group>
      {frost.length ? <Instanced geo={hexGeo} mat={w.ice} mats={frost} /> : null}
      {drops.length ? <Instanced geo={dropGeo} mat={w.drop} mats={drops} /> : null}
    </group>
  );
};

/** world-space point of the shoot (for camera/focus): local grain point → world */
export const seedToWorld = (p: V): V => {
  const c = Math.cos(SEED_YAW);
  const s = Math.sin(SEED_YAW);
  return [p[0] * c + p[2] * s, p[1] + SEED_Y, -p[0] * s + p[2] * c];
};
