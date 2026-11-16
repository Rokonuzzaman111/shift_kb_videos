/**
 * Part 3 E–G models: sealed foil pouches dropping into an open crate with a hinged lid + barcode stamp (E),
 * and a big macro cut-away seed (coat / endosperm / embryo) with glowing metabolism particles, creeping frost,
 * a closing front shell and germination (root + unfurling sprout) (F, G).
 * Units: E in metres; seed is ~1 unit long (long axis x, cut face at z = 0 facing +z). All deterministic.
 */
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { canvasTex, fbm, rng } from "../../three/util";
import { P } from "../palette";
import { Instanced } from "./Corridor";
import { useFoilMat } from "./Packaging";
import { m4 } from "./SeedMacro";

type V = [number, number, number];

/* ═════════════════════ E · pouches + crate ═════════════════════ */
export const BOX = { w: 0.62, d: 0.44, h: 0.26, wall: 0.014 } as const;
export const SP = { w: 0.13, h: 0.19 } as const; // sealed pouch footprint

const CODES = ["MEX 0412", "IND 1187", "PHL 2093", "LBN 0561", "NOR 0078", "PER 0915", "JPN 2290", "DEU 3341"];

const barcode = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) => {
  const r = rng(seed);
  let cx = x;
  g.fillStyle = "#11161c";
  while (cx < x + w) {
    const bw = 1 + Math.floor(r() * 3) * 1.5;
    if (r() > 0.4) g.fillRect(cx, y, bw, h);
    cx += bw + 1;
  }
};

const pouchLabelTex = (i: number) =>
  canvasTex(256, 160, (g) => {
    g.fillStyle = "#f3f5f7";
    g.fillRect(0, 0, 256, 160);
    g.fillStyle = "#11161c";
    g.font = "bold 34px sans-serif";
    g.fillText(CODES[i % CODES.length], 16, 46);
    g.font = "20px sans-serif";
    g.fillText(`ACC · ${(i * 37 + 104) % 900} g 25`, 16, 76);
    barcode(g, 16, 92, 224, 52, 50 + i);
  });

const usePillow = (w: number, h: number, bulge: number) =>
  useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h, 16, 20);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / w + 0.5;
      const v = p.getY(i) / h + 0.5;
      const pil = Math.pow(Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 1.08)), 0.6);
      p.setZ(i, bulge * pil + (fbm(u * 6 + 1, v * 8, 3) - 0.5) * 0.002);
    }
    g.computeVertexNormals();
    return g;
  }, [w, h, bulge]);

/** sealed flat pouch lying on its back (+y up), label on top */
export const SealedPouch: React.FC<{ readonly i: number; readonly position: V; readonly yaw?: number; readonly tilt?: number }> = ({ i, position, yaw = 0, tilt = 0 }) => {
  const foil = useFoilMat(0.22);
  const geo = usePillow(SP.w, SP.h, 0.012);
  const lab = useMemo(() => new THREE.MeshStandardMaterial({ map: pouchLabelTex(i), roughness: 0.55 }), [i]);
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <group rotation={[-Math.PI / 2 + tilt, 0, 0]}>
        <mesh geometry={geo} material={foil} castShadow receiveShadow />
        <mesh rotation={[Math.PI, 0, 0]} geometry={geo} material={foil} />
        <mesh position={[0, -0.01, 0.0135]} material={lab}>
          <planeGeometry args={[0.1, 0.0625]} />
        </mesh>
      </group>
    </group>
  );
};

/** pouch slots: layer 0 pre-filled, layer 1 drops in (index 8..15) */
export const pouchSlot = (i: number): V => {
  const layer = Math.floor(i / 8);
  const k = i % 8;
  const ix = k % 4;
  const iz = Math.floor(k / 4);
  return [(ix - 1.5) * (SP.w + 0.012), BOX.wall + 0.012 + layer * 0.026, (iz - 0.5) * (SP.h + 0.012)];
};

const lidTex = () =>
  canvasTex(512, 320, (g) => {
    g.fillStyle = "#f3f5f7";
    g.fillRect(0, 0, 512, 320);
    g.fillStyle = "#11161c";
    g.font = "bold 46px sans-serif";
    g.fillText("SGSV · CIMMYT", 24, 62);
    g.font = "28px sans-serif";
    g.fillText("BOX 0412 · 16 ACC · −18 °C", 24, 106);
    barcode(g, 24, 130, 464, 150, 77);
    g.fillStyle = P.vaultTeal;
    g.fillRect(0, 300, 512, 20);
  });

/** open crate at origin (floor y=0). lid hinged on the back edge: close 0 = open (vertical), 1 = shut. stamp 0..1 label reveal */
export const OpenCrate: React.FC<{ readonly close: number; readonly stamp: number }> = ({ close, stamp }) => {
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2f353c", roughness: 0.55 }), []);
  const inner = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1d2227", roughness: 0.7 }), []);
  const lab = useMemo(() => new THREE.MeshStandardMaterial({ map: lidTex(), roughness: 0.5, transparent: true }), []);
  lab.opacity = stamp;
  const { w, d, h, wall } = BOX;
  const ang = (-Math.PI / 2 - 0.25) * (1 - close);
  return (
    <group>
      <mesh position={[0, wall / 2, 0]} material={inner} receiveShadow>
        <boxGeometry args={[w, wall, d]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={`x${s}`} position={[(s * (w - wall)) / 2, h / 2, 0]} material={body} castShadow receiveShadow>
          <boxGeometry args={[wall, h, d]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`z${s}`} position={[0, h / 2, (s * (d - wall)) / 2]} material={body} castShadow receiveShadow>
          <boxGeometry args={[w, h, wall]} />
        </mesh>
      ))}
      {/* ribs on the outer long walls */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[(i - 4) * 0.07, h / 2, d / 2 + 0.004]} material={body}>
          <boxGeometry args={[0.012, h * 0.9, 0.008]} />
        </mesh>
      ))}
      {/* lid: pivot on back top edge */}
      <group position={[0, h, -d / 2]} rotation={[ang, 0, 0]}>
        <RoundedBox args={[w + 0.01, 0.022, d + 0.01]} radius={0.008} smoothness={2} position={[0, 0.011, d / 2]} material={body} castShadow receiveShadow />
        <mesh position={[0, 0.0235, d / 2]} rotation={[-Math.PI / 2, 0, 0]} material={lab}>
          <planeGeometry args={[0.4, 0.25]} />
        </mesh>
      </group>
    </group>
  );
};

/** rubber stamp block that comes down onto the lid. down 0..1..0 */
export const Stamp: React.FC<{ readonly down: number }> = ({ down }) => {
  const y = BOX.h + 0.03 + (1 - down) * 0.35;
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.42, 0.04, 0.27]} />
        <meshStandardMaterial color="#c3cbd3" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.14, 20]} />
        <meshStandardMaterial color="#14181d" roughness={0.6} />
      </mesh>
    </group>
  );
};

/* ═════════════════════ F · G · cut-away seed ═════════════════════ */
export const SEED_R: V = [0.5, 0.3, 0.28];
const COAT = "#8a5a32";

const faceTex = () =>
  canvasTex(512, 512, (g) => {
    g.fillStyle = "#5c3a20";
    g.fillRect(0, 0, 512, 512);
    // coat band
    g.fillStyle = COAT;
    g.beginPath();
    g.ellipse(256, 256, 252, 252, 0, 0, Math.PI * 2);
    g.fill();
    // endosperm (starchy, grainy)
    const img = g.getImageData(0, 0, 512, 512);
    for (let y = 0; y < 512; y++)
      for (let x = 0; x < 512; x++) {
        const dx = (x - 256) / 232;
        const dy = (y - 256) / 226;
        if (dx * dx + dy * dy > 1) continue;
        const n = (fbm(x / 22, y / 22, 4) - 0.5) * 34;
        const i = (y * 512 + x) * 4;
        img.data[i] = 236 + n;
        img.data[i + 1] = 224 + n;
        img.data[i + 2] = 192 + n * 0.8;
      }
    g.putImageData(img, 0, 0);
    // aleurone line
    g.strokeStyle = "rgba(170,120,60,0.8)";
    g.lineWidth = 5;
    g.beginPath();
    g.ellipse(256, 256, 228, 222, 0, 0, Math.PI * 2);
    g.stroke();
    // embryo at the left end: scutellum + axis
    g.fillStyle = "#e9cf7c";
    g.beginPath();
    g.ellipse(70, 262, 62, 118, 0.12, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#b8923e";
    g.lineWidth = 6;
    g.beginPath();
    g.ellipse(84, 262, 52, 104, 0.12, -1.3, 1.3);
    g.stroke();
    g.fillStyle = "#d9b45a";
    g.beginPath();
    g.ellipse(52, 262, 20, 70, 0.1, 0, Math.PI * 2);
    g.fill();
  });

const frostTex = () =>
  canvasTex(512, 512, (g) => {
    const r = rng(5);
    g.clearRect(0, 0, 512, 512);
    for (let i = 0; i < 420; i++) {
      const x = r() * 512;
      const y = r() * 512;
      const L = 8 + r() * 40;
      g.strokeStyle = `rgba(235,244,250,${0.25 + r() * 0.5})`;
      g.lineWidth = 1 + r() * 1.5;
      for (let k = 0; k < 3; k++) {
        const a = (k * Math.PI) / 3 + r() * 0.3;
        g.beginPath();
        g.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L);
        g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
        g.stroke();
      }
    }
  });

/** integrated phase for metabolism particles whose speed falls from 1 → 0 over [t0, t1] (and rises again in G) */
export const lifePhase = (t: number, speedAt: (t: number) => number) => {
  let ph = 0;
  const dt = 1 / 30;
  for (let x = 0; x < t; x += dt) ph += speedAt(x) * dt;
  return ph;
};

const PCOUNT = 140;
const FCOUNT = 420;

/**
 * frost 0..1 = creep from the rim inward; ph = particle phase; life 0..1 = particle glow;
 * shell 0..1 = front half fades in (seed closes); grow 0..1 = root then sprout; unfurl 0..1 = leaves open
 */
export const CutSeed: React.FC<{
  readonly frost: number;
  readonly ph: number;
  readonly life: number;
  readonly shell: number;
  readonly grow: number;
  readonly unfurl: number;
}> = ({ frost, ph, life, shell, grow, unfurl }) => {
  const coat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: COAT, roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.4, sheen: 0.4 }), []);
  const front = useMemo(() => new THREE.MeshPhysicalMaterial({ color: COAT, roughness: 0.5, clearcoat: 0.4, transparent: true }), []);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: faceTex(), roughness: 0.75 }), []);
  const frostFace = useMemo(() => new THREE.MeshStandardMaterial({ map: frostTex(), transparent: true, roughness: 0.2, depthWrite: false, emissive: "#9fc4dc", emissiveIntensity: 0.05 }), []);
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: P.amber, toneMapped: false }), []);
  const ice = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#e2edf4", roughness: 0.12, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.85, emissive: "#6f97b5", emissiveIntensity: 0.08, side: THREE.DoubleSide }), []);
  const back = useMemo(() => new THREE.SphereGeometry(1, 64, 32, Math.PI, Math.PI), []);
  const fr = useMemo(() => new THREE.SphereGeometry(1, 64, 32, 0, Math.PI), []);
  const disc = useMemo(() => new THREE.CircleGeometry(1, 72), []);
  const pGeo = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
  const hex = useMemo(() => new THREE.CircleGeometry(1, 6), []);

  // per-frame material state
  const fz = Math.min(1, frost);
  coat.color.set(COAT).lerp(new THREE.Color("#cfdde8"), fz * 0.55);
  front.opacity = shell;
  front.visible = shell > 0.01;
  frostFace.opacity = fz * 0.3;
  glow.color.set(P.amber).multiplyScalar(0.1 + 1.1 * life);

  const seeds = useMemo(() => {
    const r = rng(31);
    return Array.from({ length: Math.max(PCOUNT, FCOUNT) }, () => [r(), r(), r(), r(), r(), r()]);
  }, []);

  const parts: THREE.Matrix4[] = [];
  for (let i = 0; i < PCOUNT; i++) {
    const s = seeds[i];
    // anchors biased toward the embryo end
    const ax = -0.95 + Math.pow(s[0], 1.6) * 1.75;
    const ay = (s[1] - 0.5) * 1.6 * Math.sqrt(Math.max(0, 1 - ax * ax));
    const rr = 0.03 + s[2] * 0.05;
    const w = 1.5 + s[3] * 2.5;
    const a = ph * w + s[4] * 6.28;
    const x = ax * SEED_R[0] * 0.88 + Math.cos(a) * rr;
    const y = ay * SEED_R[1] * 0.85 + Math.sin(a * 1.3) * rr * 0.8;
    const sc = (0.004 + s[5] * 0.005) * (0.4 + 0.6 * life);
    parts.push(m4([x, y, 0.006], [sc, sc, sc * 0.5]));
  }

  const crystals: THREE.Matrix4[] = [];
  for (let i = 0; i < FCOUNT; i++) {
    const s = seeds[i];
    let p: V;
    let rot: V;
    let rim: number;
    if (i < FCOUNT * 0.55) {
      // on the cut face, rim first
      const ang = s[0] * Math.PI * 2;
      const rad = Math.sqrt(s[1]);
      rim = 1 - rad;
      p = [Math.cos(ang) * rad * SEED_R[0] * 0.98, Math.sin(ang) * rad * SEED_R[1] * 0.98, 0.009 + s[4] * 0.004];
      rot = [(s[2] - 0.5) * 0.6, (s[3] - 0.5) * 0.6, s[5] * 6];
    } else {
      // on the back shell, from the far end x+ creeping
      const th = s[0] * Math.PI;
      const phi = Math.PI + s[1] * Math.PI;
      const nx = -Math.cos(phi) * Math.sin(th);
      const ny = Math.cos(th);
      const nz = Math.sin(phi) * Math.sin(th);
      rim = (1 - nx) * 0.5 * 0.8;
      p = [nx * SEED_R[0] * 1.01, ny * SEED_R[1] * 1.01, nz * SEED_R[2] * 1.01];
      rot = [s[2] * 6, s[3] * 6, s[5] * 6];
    }
    const k = Math.max(0, Math.min(1, (frost * 1.25 - rim) / 0.25));
    const sz = (0.0025 + s[4] * 0.006) * k;
    crystals.push(m4(p, [sz, sz * (0.6 + s[5] * 0.6), sz], rot));
  }

  return (
    <group>
      <mesh geometry={back} material={coat} scale={SEED_R} castShadow receiveShadow />
      <mesh geometry={fr} material={front} scale={SEED_R} castShadow />
      <mesh geometry={disc} material={face} scale={[SEED_R[0], SEED_R[1], 1]} position={[0, 0, 0.001]} receiveShadow />
      {fz > 0.01 ? <mesh geometry={disc} material={frostFace} scale={[SEED_R[0] * fz, SEED_R[1] * fz, 1]} position={[0, 0, 0.012]} /> : null}
      <Instanced geo={pGeo} mat={glow} mats={parts} />
      <Instanced geo={hex} mat={ice} mats={crystals} />
      {life > 0.05 ? <pointLight position={[-0.25, 0, 0.15]} intensity={0.25 * life} distance={0.8} decay={2} color={P.amber} /> : null}
      {grow > 0 ? <Sprout grow={grow} unfurl={unfurl} /> : null}
    </group>
  );
};

/* ───────────── germination ───────────── */
const ROOT_PTS: V[] = [
  [-0.46, -0.06, 0.02],
  [-0.6, -0.2, 0.05],
  [-0.62, -0.5, 0.02],
  [-0.56, -0.85, 0.06],
  [-0.6, -1.25, 0.02],
];
const tubeTo = (pts: V[], k: number, r: number, seg = 40) => {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const sub = new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => c.getPoint((i / 11) * Math.max(0.02, k))));
  return new THREE.TubeGeometry(sub, seg, r, 10, false);
};

const leafGeo = (() => {
  let g: THREE.ShapeGeometry | null = null;
  return () => {
    if (g) return g;
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.bezierCurveTo(0.12, 0.05, 0.14, 0.22, 0, 0.32);
    s.bezierCurveTo(-0.14, 0.22, -0.12, 0.05, 0, 0);
    g = new THREE.ShapeGeometry(s, 16);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, -Math.pow(p.getX(i) / 0.12, 2) * 0.03); // cupped
    g.computeVertexNormals();
    return g;
  };
})();

/** sprout tip (for camera crane) at grow/unfurl */
export const sproutTip = (grow: number, unfurl: number): V => {
  const g = Math.max(0, (grow - 0.35) / 0.65);
  const hook = 1 - unfurl;
  return [-0.42 + 0.2 * g + 0.12 * hook * g, 0.12 + 1.1 * g - 0.18 * hook * g, 0.04];
};

export const Sprout: React.FC<{ readonly grow: number; readonly unfurl: number }> = ({ grow, unfurl }) => {
  const rootM = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#efe6cf", roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color("#fff4dc") }), []);
  const stemM = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#a9c27a", roughness: 0.4, sheen: 0.5 }), []);
  const leafM = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#6f9a4e", roughness: 0.45, sheen: 0.6, sheenColor: new THREE.Color("#d8f0b0"), side: THREE.DoubleSide }), []);
  const kr = Math.min(1, grow / 0.45);
  const ks = Math.max(0, (grow - 0.35) / 0.65);
  const root = useMemo(() => tubeTo(ROOT_PTS, kr, 0.014), [kr]);
  const tip = sproutTip(grow, unfurl);
  const hook = 1 - unfurl;
  const stemPts: V[] = [
    [-0.42, 0.1, 0.02],
    [-0.4 + 0.02 * ks, 0.1 + 0.45 * ks, 0.03],
    [-0.32 + 0.12 * hook * ks, 0.1 + 0.85 * ks, 0.04],
    tip,
  ];
  const stem = useMemo(() => (ks > 0 ? tubeTo(stemPts, 1, 0.016) : null), [ks, unfurl]); // eslint-disable-line react-hooks/exhaustive-deps
  const rootTip = new THREE.CatmullRomCurve3(ROOT_PTS.map((p) => new THREE.Vector3(...p))).getPoint(Math.max(0.02, kr));
  const open = unfurl * 1.15;
  const lsz = 0.25 + 0.75 * unfurl;
  return (
    <group>
      <mesh geometry={root} material={rootM} castShadow />
      <mesh position={rootTip} material={rootM}>
        <sphereGeometry args={[0.014, 10, 8]} />
      </mesh>
      {stem ? <mesh geometry={stem} material={stemM} castShadow /> : null}
      {ks > 0.6
        ? [-1, 1].map((s) => (
            <group key={s} position={tip} rotation={[0, 0, s * open + hook * 1.4]} scale={lsz * Math.min(1, (ks - 0.6) / 0.4) + 0.001}>
              <mesh geometry={leafGeo()} material={leafM} rotation={[0.25 * s, 0, 0]} castShadow />
            </group>
          ))
        : null}
    </group>
  );
};
