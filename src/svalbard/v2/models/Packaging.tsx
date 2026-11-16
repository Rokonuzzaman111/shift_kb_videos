/**
 * Seed packaging (Part 3 B–D): crinkled silver foil pouch (open, on a lab scale, with a pouring seed stream),
 * a drying room (steel racks of mesh trays, airflow streaks, humidity dial) and an exploded 3-layer pouch in a
 * heat sealer. Units: metres. All deterministic.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { canvasTex, fbm, rng } from "../../three/util";
import { P } from "../palette";
import { Instanced, useSteelMat } from "./Corridor";
import { SEED_COLORS } from "./Genebank";
import { m4 } from "./SeedMacro";

type V = [number, number, number];

/* ───────────── foil material (crinkle normal map) ───────────── */
let crinkleCache: THREE.Texture | null = null;
const crinkleNormal = () => {
  if (crinkleCache) return crinkleCache;
  const N = 256;
  const hgt = new Float32Array(N * N);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const a = fbm(x / 18, y / 18, 4);
      const b = Math.abs(fbm(x / 7 + 9, y / 11 + 3, 3) - 0.5);
      hgt[y * N + x] = a * 0.7 + b * 0.9;
    }
  const t = canvasTex(
    N,
    N,
    (g) => {
      const img = g.createImageData(N, N);
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          const dx = hgt[y * N + ((x + 1) % N)] - hgt[y * N + ((x - 1 + N) % N)];
          const dy = hgt[((y + 1) % N) * N + x] - hgt[((y - 1 + N) % N) * N + x];
          const i = (y * N + x) * 4;
          img.data[i] = 128 - dx * 900;
          img.data[i + 1] = 128 - dy * 900;
          img.data[i + 2] = 255;
          img.data[i + 3] = 255;
        }
      g.putImageData(img, 0, 0);
    },
    [2, 2],
  );
  t.colorSpace = THREE.NoColorSpace;
  crinkleCache = t;
  return t;
};

export const useFoilMat = (rough = 0.24) =>
  useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d5dbe1",
        metalness: 1,
        roughness: rough,
        normalMap: crinkleNormal(),
        normalScale: new THREE.Vector2(0.55, 0.55),
        envMapIntensity: 1.3,
        side: THREE.DoubleSide,
      }),
    [rough],
  );

/* ───────────── open pouch (B) ───────────── */
export const POUCH = { w: 0.14, h: 0.2, d: 0.045, mouth: 0.085 } as const;
const pouchDepth = (v: number) => POUCH.d * (0.7 + 0.3 * Math.sin(Math.min(1, v * 1.4) * Math.PI * 0.5)) + (POUCH.mouth - POUCH.d) * Math.pow(Math.max(0, (v - 0.75) / 0.25), 1.6);

export const OpenPouch: React.FC<{ readonly position: V }> = ({ position }) => {
  const foil = useFoilMat();
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 64, 30, true);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const th = Math.atan2(p.getZ(i), p.getX(i));
      const v = p.getY(i) + 0.5;
      const dd = pouchDepth(v);
      const n = (fbm(th * 3 + 4, v * 9, 3) - 0.5) * 0.004;
      // flattened lens cross-section with pinched side seams
      const cx = Math.cos(th);
      const sz = Math.sin(th);
      p.setXYZ(i, (POUCH.w / 2) * cx * (1 + n * 4), v * POUCH.h, (dd / 2) * sz * (1 - 0.15 * Math.pow(Math.abs(cx), 8)) + n * Math.sign(sz));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  const label = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.7,
        map: canvasTex(256, 192, (g) => {
          g.fillStyle = "#f3f5f6";
          g.fillRect(0, 0, 256, 192);
          g.fillStyle = P.night;
          g.font = "bold 30px Arial, sans-serif";
          g.fillText("CIMMYT", 16, 44);
          g.font = "22px Arial, sans-serif";
          g.fillText("Acc. 0412 · Zea mays", 16, 80);
          g.fillText("n ≈ 500", 16, 112);
          const r = rng(5);
          let x = 16;
          while (x < 240) {
            const w = 1 + Math.floor(r() * 4);
            if (r() > 0.4) g.fillRect(x, 130, w, 44);
            x += w + 1;
          }
        }),
      }),
    [],
  );
  return (
    <group position={position}>
      <mesh geometry={geo} material={foil} castShadow receiveShadow />
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[POUCH.w / 2, (POUCH.d * 0.7) / 2, 1]} material={foil}>
        <circleGeometry args={[1, 32]} />
      </mesh>
      <mesh position={[0, POUCH.h * 0.38, (pouchDepth(0.38) / 2) * 0.985 + 0.0015]} material={label}>
        <planeGeometry args={[0.066, 0.05]} />
      </mesh>
    </group>
  );
};

/* ───────────── seeds (instanced grains) ───────────── */
const grainGeo = new THREE.SphereGeometry(1, 10, 6);
const useGrainMat = (color: string) => useMemo(() => new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, sheen: 0.4, sheenColor: new THREE.Color("#f4e2b8"), clearcoat: 0.2 }), [color]);
const GRAIN: V = [0.0034, 0.0016, 0.0017]; // half-sizes of a rice grain

/** falling stream into the pouch mouth + the pile rising inside */
export const SeedPour: React.FC<{ readonly t: number; readonly pour: number; readonly fill: number; readonly position: V }> = ({ t, pour, fill, position }) => {
  const mat = useGrainMat("#d9c39a");
  const seeds = useMemo(() => {
    const r = rng(21);
    return Array.from({ length: 360 }, () => [r(), r(), r(), r(), r(), r()]);
  }, []);
  const top = POUCH.h + 0.34;
  const stream: THREE.Matrix4[] = [];
  const pile: THREE.Matrix4[] = [];
  const hide = new THREE.Matrix4().makeScale(0, 0, 0);
  seeds.forEach((s, i) => {
    if (i < 140) {
      const L = top - POUCH.h * 0.55;
      const fallen = (t * 1.25 + s[0] * L * 1.0) % L;
      const y = top - fallen;
      const spread = 0.003 + 0.01 * (fallen / L);
      const vis = pour > 0 && fallen < L * Math.min(1, pour * 3);
      stream.push(vis ? m4([(s[1] - 0.5) * spread * 2 + 0.002, y, (s[2] - 0.5) * spread], GRAIN, [s[3] * 6 + t * 9, s[4] * 6 + t * 7, s[5] * 6]) : hide);
    } else {
      const a = s[0] * Math.PI * 2;
      const rr = Math.sqrt(s[1]);
      const lvl = s[2];
      const y = POUCH.h * (0.12 + 0.5 * fill * lvl) + (1 - rr) * 0.01 * fill;
      const vis = lvl < fill + 0.05;
      pile.push(vis ? m4([Math.cos(a) * rr * POUCH.w * 0.42, y, Math.sin(a) * rr * pouchDepth(0.6) * 0.38], GRAIN, [s[3] * 6, s[4] * 6, s[5] * 6]) : hide);
    }
  });
  return (
    <group position={position}>
      <Instanced geo={grainGeo} mat={mat} mats={stream} shadows />
      <Instanced geo={grainGeo} mat={mat} mats={pile} />
    </group>
  );
};

/* ───────────── lab scale with amber display ───────────── */
export const SCALE = { w: 0.26, h: 0.055, d: 0.3, pan: 0.008 } as const;
export const LabScale: React.FC<{ readonly grams: number }> = ({ grams }) => {
  const steel = useSteelMat([1, 1], "#c3cbd3", 0.3, 0.9);
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d8dde2", roughness: 0.4, metalness: 0.1 }), []);
  const txt = grams.toFixed(1);
  const disp = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#000000",
        emissive: "#ffffff",
        emissiveIntensity: 1.6,
        toneMapped: false,
        emissiveMap: canvasTex(256, 64, (g) => {
          g.fillStyle = "#050607";
          g.fillRect(0, 0, 256, 64);
          g.fillStyle = P.amber;
          g.font = "bold 46px 'Courier New', monospace";
          g.textAlign = "right";
          g.fillText(`${txt} g`, 240, 48);
        }),
      }),
    [txt],
  );
  return (
    <group>
      <mesh position={[0, SCALE.h / 2, 0]} material={body} castShadow receiveShadow>
        <boxGeometry args={[SCALE.w, SCALE.h, SCALE.d]} />
      </mesh>
      <mesh position={[0, SCALE.h + 0.006 + SCALE.pan / 2, -0.02]} material={steel} castShadow receiveShadow>
        <boxGeometry args={[0.22, SCALE.pan, 0.22]} />
      </mesh>
      <mesh position={[0, SCALE.h * 0.5, SCALE.d / 2 + 0.03]} rotation={[-0.5, 0, 0]} material={body} castShadow>
        <boxGeometry args={[SCALE.w, 0.05, 0.07]} />
      </mesh>
      <mesh position={[0.02, SCALE.h * 0.5 + 0.0178, SCALE.d / 2 + 0.0617]} rotation={[-0.5, 0, 0]} material={disp}>
        <planeGeometry args={[0.12, 0.03]} />
      </mesh>
    </group>
  );
};

/* ───────────── drying room (C) ───────────── */
const seedBedTex = (color: string, seed: number) =>
  canvasTex(512, 320, (g) => {
    const r = rng(seed);
    g.clearRect(0, 0, 512, 320);
    const c = new THREE.Color(color);
    for (let i = 0; i < 2600; i++) {
      const x = r() * 512;
      const y = r() * 320;
      const k = 0.7 + r() * 0.45;
      g.fillStyle = `rgb(${Math.min(255, c.r * 255 * k)},${Math.min(255, c.g * 255 * k)},${Math.min(255, c.b * 255 * k)})`;
      g.beginPath();
      g.ellipse(x, y, 5 + r() * 2, 2.6 + r(), r() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  });
const meshTex = () => {
  const t = canvasTex(
    64,
    64,
    (g) => {
      g.clearRect(0, 0, 64, 64);
      g.strokeStyle = "#ffffff";
      g.lineWidth = 6;
      g.strokeRect(0, 0, 64, 64);
    },
    [40, 25],
  );
  return t;
};

export const RACK = { trayW: 0.8, trayD: 0.5, levels: 5, gap: 0.24, y0: 0.35, units: 3 } as const;
export const DryingRoom: React.FC<{ readonly t: number; readonly airflow: number }> = ({ t, airflow }) => {
  const steel = useSteelMat([2, 1], "#b9c2cb", 0.35, 0.85);
  const wire = useMemo(() => new THREE.MeshStandardMaterial({ color: "#aeb6be", metalness: 0.8, roughness: 0.4, alphaMap: meshTex(), alphaTest: 0.5, side: THREE.DoubleSide }), []);
  const beds = useMemo(
    () => [SEED_COLORS[1], SEED_COLORS[0], SEED_COLORS[2], SEED_COLORS[5]].map((c, i) => new THREE.MeshStandardMaterial({ map: seedBedTex(c, 30 + i), alphaTest: 0.5, roughness: 0.6 })),
    [],
  );
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9d1d8", roughness: 0.85 }), []);
  const floorM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7d8790", roughness: 0.35, metalness: 0.1 }), []);
  const { posts, rails, trays } = useMemo(() => {
    const ps: THREE.Matrix4[] = [];
    const rs: THREE.Matrix4[] = [];
    const tr: { p: V; k: number }[] = [];
    const H = RACK.y0 + RACK.levels * RACK.gap + 0.1;
    for (let u = 0; u < RACK.units; u++) {
      const cx = (u - (RACK.units - 1) / 2) * (RACK.trayW + 0.08);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) ps.push(m4([cx + (sx * (RACK.trayW + 0.04)) / 2, H / 2, (sz * (RACK.trayD + 0.02)) / 2], [0.025, H, 0.025]));
      for (let l = 0; l < RACK.levels; l++) {
        const y = RACK.y0 + l * RACK.gap;
        for (const sz of [-1, 1]) rs.push(m4([cx, y - 0.012, (sz * (RACK.trayD + 0.02)) / 2], [RACK.trayW + 0.04, 0.02, 0.02]));
        tr.push({ p: [cx, y, 0], k: (u * 3 + l) % 4 });
      }
    }
    return { posts: ps, rails: rs, trays: tr };
  }, []);
  const boxG = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  // airflow streaks drifting along +x between the trays
  const streakMat = useMemo(() => new THREE.MeshBasicMaterial({ color: P.snow, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const streaks = useMemo(() => {
    const r = rng(17);
    return Array.from({ length: 70 }, () => [r(), r(), r(), r()]);
  }, []);
  const L = RACK.units * (RACK.trayW + 0.08) + 0.8;
  const sm = streaks.map((s) => {
    const x = -L / 2 + ((s[0] * L + t * (0.9 + s[3] * 0.6)) % L);
    const lvl = Math.floor(s[1] * RACK.levels);
    const y = RACK.y0 + lvl * RACK.gap + 0.05 + s[2] * 0.12;
    return m4([x, y, (s[3] - 0.5) * 0.45], [0.18 + s[2] * 0.25, 0.0025 * airflow, 1]);
  });
  const planeG = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floorM} receiveShadow>
        <planeGeometry args={[10, 6]} />
      </mesh>
      <mesh position={[0, 1.6, -0.75]} material={wall} receiveShadow>
        <planeGeometry args={[10, 3.2]} />
      </mesh>
      <Instanced geo={boxG} mat={steel} mats={posts} shadows />
      <Instanced geo={boxG} mat={steel} mats={rails} shadows />
      {trays.map((q, i) => (
        <group key={i} position={q.p}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={wire} receiveShadow>
            <planeGeometry args={[RACK.trayW, RACK.trayD]} />
          </mesh>
          <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} material={beds[q.k]} castShadow receiveShadow>
            <planeGeometry args={[RACK.trayW - 0.04, RACK.trayD - 0.04]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, 0.01, (s * RACK.trayD) / 2]} material={steel}>
              <boxGeometry args={[RACK.trayW, 0.025, 0.01]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* dehumidifier unit at the left end */}
      <group position={[-L / 2 - 0.1, 0.7, -0.2]}>
        <mesh material={steel} castShadow>
          <boxGeometry args={[0.45, 1.4, 0.5]} />
        </mesh>
        <mesh position={[0.226, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.4, 0.6]} />
          <meshStandardMaterial color="#1a2129" roughness={0.6} />
        </mesh>
        <mesh position={[0.227, -0.45, 0.12]} rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[0.012, 12]} />
          <meshBasicMaterial color={P.vaultTeal} toneMapped={false} />
        </mesh>
      </group>
      <Instanced geo={planeG} mat={streakMat} mats={sm} />
    </group>
  );
};

/** wall/post-mounted humidity dial (0–100 %RH over 270°); needle at `rh` */
export const HumidityDial: React.FC<{ readonly rh: number; readonly position: V; readonly r?: number }> = ({ rh, position, r = 0.07 }) => {
  const face = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.5,
        map: canvasTex(256, 256, (g) => {
          g.fillStyle = "#eef2f5";
          g.beginPath();
          g.arc(128, 128, 128, 0, Math.PI * 2);
          g.fill();
          g.translate(128, 128);
          for (let i = 0; i <= 50; i++) {
            const a = (-135 + (i / 50) * 270) * (Math.PI / 180);
            const big = i % 5 === 0;
            g.strokeStyle = i <= 10 ? "#1e7f73" : P.night;
            g.lineWidth = big ? 4 : 2;
            g.beginPath();
            g.moveTo(Math.sin(a) * (big ? 92 : 100), -Math.cos(a) * (big ? 92 : 100));
            g.lineTo(Math.sin(a) * 112, -Math.cos(a) * 112);
            g.stroke();
            if (big && i % 10 === 0) {
              g.fillStyle = P.night;
              g.font = "bold 22px Arial, sans-serif";
              g.textAlign = "center";
              g.fillText(String(i * 2), Math.sin(a) * 72, -Math.cos(a) * 72 + 8);
            }
          }
          g.font = "bold 24px Arial, sans-serif";
          g.textAlign = "center";
          g.fillText("%RH", 0, 60);
        }),
      }),
    [],
  );
  const steel = useSteelMat([1, 1], "#c7cfd6", 0.25, 0.95);
  const ang = (-135 + (rh / 100) * 270) * (Math.PI / 180);
  return (
    <group position={position}>
      <mesh material={face}>
        <circleGeometry args={[r, 48]} />
      </mesh>
      <mesh position={[0, 0, -0.006]} material={steel} castShadow>
        <torusGeometry args={[r * 1.04, r * 0.09, 12, 48]} />
      </mesh>
      <mesh position={[0, 0, -0.015]} rotation={[Math.PI / 2, 0, 0]} material={steel}>
        <cylinderGeometry args={[r * 1.05, r * 1.05, 0.02, 32]} />
      </mesh>
      <group position={[0, 0, 0.006]} rotation={[0, 0, -ang]}>
        <mesh position={[0, r * 0.38, 0]}>
          <boxGeometry args={[r * 0.05, r * 0.95, 0.002]} />
          <meshStandardMaterial color={P.night} roughness={0.4} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.009]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r * 0.08, r * 0.08, 0.004, 16]} />
        <meshStandardMaterial color={P.amber} roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <circleGeometry args={[r, 48]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.02} clearcoat={1} />
      </mesh>
    </group>
  );
};

/* ───────────── exploded 3-layer pouch + heat sealer (D) ───────────── */
export const FLAT = { w: 0.16, h: 0.22 } as const;
const useFlatGeo = (bulge: number) =>
  useMemo(() => {
    const g = new THREE.PlaneGeometry(FLAT.w, FLAT.h, 24, 32);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / FLAT.w + 0.5;
      const v = p.getY(i) / FLAT.h + 0.5;
      const pillow = Math.pow(Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 1.1)), 0.6);
      p.setZ(i, bulge * pillow + (fbm(u * 7 + 3, v * 9, 3) - 0.5) * 0.0015);
    }
    g.computeVertexNormals();
    g.translate(0, FLAT.h / 2, 0);
    return g;
  }, [bulge]);

/** layer offsets along +z: PET (outer, front), aluminium (middle), PE (inner) */
export const layerZ = (explode: number) => [0.085 * explode, 0.045 * explode, 0.012 * explode] as const;
export const POUCH_Y = 0.05;

export const ExplodedPouch: React.FC<{ readonly explode: number; readonly seal: number; readonly clamp: number }> = ({ explode, seal, clamp }) => {
  const foil = useFoilMat(0.2);
  const back = useFoilMat(0.3);
  const pet = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#e8eef3", roughness: 0.05, transparent: true, opacity: 0.32, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }), []);
  const pe = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#f2f4f6", roughness: 0.55, transparent: true, opacity: 0.72, sheen: 0.5, side: THREE.DoubleSide }), []);
  const g0 = useFlatGeo(0.012);
  const gb = useFlatGeo(-0.012);
  const [zPet, zAl, zPe] = layerZ(explode);
  const steel = useSteelMat([2, 1], "#b6bec7", 0.3, 0.9);
  const rubber = useMemo(() => new THREE.MeshStandardMaterial({ color: "#14181d", roughness: 0.8 }), []);
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: P.amber, toneMapped: false, transparent: true }), []);
  glow.opacity = seal;
  const sealBand = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b9c1c9",
        metalness: 0.9,
        roughness: 0.45,
        map: canvasTex(256, 16, (g) => {
          g.fillStyle = "#cfd5db";
          g.fillRect(0, 0, 256, 16);
          g.fillStyle = "#8d969f";
          for (let x = 0; x < 256; x += 4) g.fillRect(x, 0, 2, 16);
        }),
      }),
    [],
  );
  const jawY = POUCH_Y + FLAT.h - 0.016;
  const jawZ = 0.13 * (1 - clamp) + 0.022;
  return (
    <group>
      <group position={[0, POUCH_Y, 0]}>
        <mesh geometry={gb} material={back} position={[0, 0, -0.004]} castShadow receiveShadow />
        <mesh geometry={g0} material={pe} position={[0, 0, zPe]} />
        <mesh geometry={g0} material={foil} position={[0, 0, zAl + 0.002]} castShadow receiveShadow />
        <mesh geometry={g0} material={pet} position={[0, 0, zPet + 0.004]} />
        {/* finished seal band once clamped */}
        {seal > 0.05 || clamp > 0.99 ? (
          <mesh position={[0, FLAT.h - 0.016, 0.0075]} material={sealBand}>
            <planeGeometry args={[FLAT.w, 0.012]} />
          </mesh>
        ) : null}
      </group>
      {/* heat sealer: base, two posts, back (fixed) and front (moving) jaws */}
      <mesh position={[0, 0.025, -0.02]} material={steel} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.05, 0.22]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.15, (jawY + 0.05) / 2, -0.03]} material={steel} castShadow>
          <boxGeometry args={[0.02, jawY - 0.05 + 0.02, 0.02]} />
        </mesh>
      ))}
      <mesh position={[0, jawY, -0.022]} material={steel} castShadow>
        <boxGeometry args={[0.32, 0.024, 0.02]} />
      </mesh>
      <mesh position={[0, jawY, -0.011]} material={rubber}>
        <boxGeometry args={[0.3, 0.014, 0.004]} />
      </mesh>
      <group position={[0, jawY, jawZ]}>
        <mesh material={steel} castShadow>
          <boxGeometry args={[0.32, 0.024, 0.02]} />
        </mesh>
        <mesh position={[0, 0, -0.011]} material={rubber}>
          <boxGeometry args={[0.3, 0.014, 0.004]} />
        </mesh>
        <mesh position={[0, 0, -0.0135]} material={glow}>
          <boxGeometry args={[0.28, 0.004, 0.001]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.15, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]} material={steel}>
            <cylinderGeometry args={[0.006, 0.006, 0.12, 10]} />
          </mesh>
        ))}
      </group>
      {seal > 0.01 ? <pointLight position={[0, jawY, 0.03]} intensity={0.4 * seal} distance={0.4} decay={2} color={P.amber} /> : null}
    </group>
  );
};
