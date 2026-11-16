/**
 * Svalbard v2 · Part 5 E–G models (metres, y up). All deterministic.
 *  ArrivalDock  — polar-night roller conveyor running into a frosted loading door (amber lamp), crates riding it.
 *  TagGrid      — 21 genebank crate tags (3 × 7); the Ukraine tag glows and slides forward.
 *  CrackedEarth — heat-cracked mud macro tile (voronoi cracks, bump).
 *  StormSky     — dark cloud bank, rain streaks, lightning bolt.
 *  OpenPalm     — an open hand holding one rice seed.
 *  BanglaPaddy  — Bangladesh paddy at golden hour: rice clumps, bunds, canal + wooden boat (chhoi), palm tree line.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { usePBR } from "../../../kit/assets";
import { canvasTex, fbm, rng } from "../../three/util";
import { P } from "../palette";
import { Instanced, Puffs, frostify, useSteelMat } from "./Corridor";
import { ribbon, useWaterMat } from "./Crops";
import { m4 } from "./SeedMacro";
import { CRATE, CRATES, Crate } from "./SeedCrates";

type V = readonly [number, number, number];

/* ───────────── E · conveyor dock ───────────── */
export const DOCK = { z0: 6, z1: -6, beltY: 0.75, doorZ: -6.2 } as const;
const CRATE_GAP = 1.5;

export const ArrivalDock: React.FC<{ readonly t: number }> = ({ t }) => {
  const steel = useSteelMat([4, 1], "#9aa6b1", 0.35, 0.85, 0.25);
  const roller = useSteelMat([1, 1], "#c0c8cf", 0.25, 0.9);
  const wallPbr = usePBR("concrete_wall_008", [4, 2]);
  const wall = useMemo(() => frostify(new THREE.MeshStandardMaterial({ ...wallPbr, color: "#6d7781" }), 0.55), [wallPbr]);
  const snowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#dfe7ee", roughness: 0.85 }), []);
  const rollerGeo = useMemo(() => new THREE.CylinderGeometry(0.035, 0.035, 0.7, 12).rotateZ(Math.PI / 2), []);
  const rollers = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let z = DOCK.z1; z <= DOCK.z0; z += 0.12) out.push(m4([0, DOCK.beltY, z], [1, 1, 1]));
    return out;
  }, []);
  const legGeo = useMemo(() => new THREE.BoxGeometry(0.05, DOCK.beltY, 0.05), []);
  const legs = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let z = DOCK.z1 + 0.5; z <= DOCK.z0; z += 1.5) for (const x of [-0.36, 0.36]) out.push(m4([x, DOCK.beltY / 2, z], [1, 1, 1]));
    return out;
  }, []);
  const L = DOCK.z0 - DOCK.z1;
  const n = 8;
  const crates = Array.from({ length: n }, (_, i) => {
    const z = DOCK.z0 - ((i * CRATE_GAP + t * 0.55) % (n * CRATE_GAP));
    return z;
  });
  const lamp = new THREE.Color(P.amber).multiplyScalar(3);
  return (
    <group>
      {/* snow ground with soft drifts */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={snowMat} receiveShadow>
        <planeGeometry args={[80, 80]} />
      </mesh>
      {/* conveyor */}
      <Instanced geo={rollerGeo} mat={roller} mats={rollers} />
      <Instanced geo={legGeo} mat={steel} mats={legs} shadows />
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} position={[x, DOCK.beltY + 0.02, (DOCK.z0 + DOCK.z1) / 2]} material={steel} castShadow>
          <boxGeometry args={[0.04, 0.12, L]} />
        </mesh>
      ))}
      {crates.map((z, i) =>
        z < DOCK.z1 + 0.2 || z > DOCK.z0 ? null : (
          <Crate key={i} info={CRATES[(i * 4 + 1) % CRATES.length]} seed={700 + i} position={[0, DOCK.beltY + 0.04, z]} yaw={Math.PI / 2} />
        ),
      )}
      {/* loading wall with a lit door opening */}
      <group position={[0, 0, DOCK.doorZ]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 3.6, 2.5, -0.3]} material={wall} receiveShadow>
            <boxGeometry args={[5.6, 5, 0.6]} />
          </mesh>
        ))}
        <mesh position={[0, 4, -0.3]} material={wall}>
          <boxGeometry args={[1.6, 2, 0.6]} />
        </mesh>
        <mesh position={[0, 1.5, -0.7]}>
          <planeGeometry args={[1.6, 3]} />
          <meshBasicMaterial color={new THREE.Color(P.amber).multiplyScalar(1.4)} />
        </mesh>
        <mesh position={[0, 3.2, 0.1]}>
          <boxGeometry args={[0.5, 0.12, 0.2]} />
          <meshBasicMaterial color={lamp} />
        </mesh>
        <pointLight position={[0, 2.6, 1.2]} intensity={14} distance={9} decay={2} color={P.amber} />
        {/* snow lip on the wall top */}
        <mesh position={[0, 5.05, -0.3]} material={snowMat}>
          <boxGeometry args={[12.8, 0.12, 0.7]} />
        </mesh>
      </group>
      <Puffs count={10} seed={81} box={[-2, 2, 0.2, 1.6, DOCK.doorZ + 0.5, DOCK.doorZ + 3]} size={[1.5, 3]} t={t} drift={[0.15, 0.02, 0.1]} k={1} color="#c9d4de" opacity={0.18} />
    </group>
  );
};

/* ───────────── E · tag grid ───────────── */
export const TAG_CODES = [
  "NOR-NGB", "DEU-IPK", "USA-NPGS", "IND-NBPGR", "PHL-IRRI", "MEX-CIMMYT", "LBN-ICARDA", "KEN-ILRI", "NGA-IITA", "PER-CIP", "UKR-NCPGRU",
  "COL-CIAT", "JPN-NARO", "KOR-RDA", "GBR-RBG", "NLD-CGN", "CAN-PGRC", "BRA-EMBRAPA", "ETH-EBI", "AUS-AGG", "TWN-WVC",
] as const;
export const UKR_INDEX = 10;
const TAG = { w: 0.3, h: 0.15 } as const;

const tagTex = (code: string, ukr: boolean, seed: number) =>
  canvasTex(384, 192, (g) => {
    const r = rng(seed);
    g.fillStyle = "#eef2f5";
    g.beginPath();
    g.roundRect(0, 0, 384, 192, 18);
    g.fill();
    if (ukr) {
      g.fillStyle = "#3d6aa0";
      g.fillRect(0, 0, 70, 96);
      g.fillStyle = P.amber;
      g.fillRect(0, 96, 70, 96);
    } else {
      g.fillStyle = P.steel;
      g.fillRect(0, 0, 70, 192);
    }
    g.fillStyle = "#c9d2da";
    g.beginPath();
    g.arc(36, 96, 14, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = P.night;
    g.font = "700 40px Inter, Arial";
    g.fillText(code, 90, 70);
    g.font = "500 22px Inter, Arial";
    g.fillStyle = "#4a5866";
    g.fillText(`SGSV · DEP ${String(100 + Math.floor(r() * 899))}`, 90, 104);
    for (let x = 90; x < 360; x += 3 + Math.floor(r() * 4)) {
      g.fillStyle = P.night;
      g.fillRect(x, 124, 1 + Math.floor(r() * 3), 48);
    }
  });

export const TagGrid: React.FC<{ readonly position: V; readonly face: V; readonly t: number; readonly inAt: number; readonly ukrAt: number }> = ({ position, face, t, inAt, ukrAt }) => {
  const texs = useMemo(() => TAG_CODES.map((c, i) => tagTex(c, i === UKR_INDEX, 900 + i)), []);
  const quat = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(...position);
    o.lookAt(...face);
    return o.quaternion.clone();
  }, [position, face]);
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(P.vaultTeal).multiplyScalar(2), transparent: true }), []);
  const fwd = Math.max(0, Math.min(1, (t - ukrAt) / 0.5));
  const fe = 1 - Math.pow(1 - fwd, 3);
  glowMat.opacity = fe;
  return (
    <group position={position as [number, number, number]} quaternion={quat}>
      {TAG_CODES.map((_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const k = Math.max(0, Math.min(1, (t - inAt - (row * 3 + col) * 0.035) / 0.25));
        if (k <= 0) return null;
        const ukr = i === UKR_INDEX;
        const sc = (0.5 + 0.5 * k) * (ukr ? 1 + 0.45 * fe : 1);
        const dim = ukr ? 1 : 1 - 0.55 * fe;
        const x = (col - 1) * (TAG.w + 0.04);
        const y = (3 - row) * (TAG.h + 0.035);
        return (
          <group key={i} position={[x * (ukr ? 1 - fe : 1), y * (ukr ? 1 - fe : 1), ukr ? 0.35 * fe : 0]} scale={sc} rotation={[0, (1 - k) * 0.8, 0]}>
            <mesh>
              <planeGeometry args={[TAG.w, TAG.h]} />
              <meshStandardMaterial map={texs[i]} roughness={0.5} transparent opacity={k * dim} emissive="#ffffff" emissiveMap={texs[i]} emissiveIntensity={0.35 + (ukr ? 0.5 * fe : 0)} />
            </mesh>
            {ukr ? (
              <mesh position={[0, 0, -0.002]} material={glowMat}>
                <planeGeometry args={[TAG.w + 0.025, TAG.h + 0.025]} />
              </mesh>
            ) : null}
          </group>
        );
      })}
    </group>
  );
};

/* ───────────── F · cracked earth ───────────── */
export const CrackedEarth: React.FC = () => {
  const mats = useMemo(() => {
    const N = 512;
    const r = rng(404);
    const pts = Array.from({ length: 70 }, () => [r() * N, r() * N] as const);
    const crack = new Float32Array(N * N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        let d1 = 1e9;
        let d2 = 1e9;
        for (const [px, py] of pts) {
          let dx = Math.abs(x - px);
          let dy = Math.abs(y - py);
          dx = Math.min(dx, N - dx);
          dy = Math.min(dy, N - dy);
          const d = dx * dx + dy * dy;
          if (d < d1) (d2 = d1), (d1 = d);
          else if (d < d2) d2 = d;
        }
        const e = Math.sqrt(d2) - Math.sqrt(d1);
        crack[y * N + x] = Math.min(1, e / (4 + fbm(x / 30, y / 30, 3) * 6));
      }
    const albedo = canvasTex(N, N, (g) => {
      const img = g.createImageData(N, N);
      for (let i = 0; i < N * N; i++) {
        const c = crack[i];
        const n = fbm((i % N) / 20, Math.floor(i / N) / 20, 4);
        const base = 150 + n * 50;
        img.data[i * 4] = (base + 12) * (0.25 + 0.75 * c);
        img.data[i * 4 + 1] = (base - 6) * (0.25 + 0.75 * c);
        img.data[i * 4 + 2] = (base - 30) * (0.25 + 0.75 * c);
        img.data[i * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
    const bump = canvasTex(N, N, (g) => {
      const img = g.createImageData(N, N);
      for (let i = 0; i < N * N; i++) {
        const v = Math.pow(crack[i], 0.5) * 255;
        img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
        img.data[i * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
    });
    bump.colorSpace = THREE.NoColorSpace;
    return new THREE.MeshStandardMaterial({ map: albedo, bumpMap: bump, bumpScale: 6, roughness: 0.95 });
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={mats} receiveShadow>
      <planeGeometry args={[3, 3]} />
    </mesh>
  );
};

/* ───────────── F · storm ───────────── */
export const StormSky: React.FC<{ readonly t: number; readonly flash: number }> = ({ t, flash }) => {
  const rain = useMemo(() => {
    const r = rng(313);
    return Array.from({ length: 700 }, () => ({ x: (r() - 0.5) * 30, z: -4 - r() * 26, ph: r() }));
  }, []);
  const rainGeo = useMemo(() => new THREE.BoxGeometry(0.012, 1.1, 0.012), []);
  const rainMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#aebccb", transparent: true, opacity: 0.35, depthWrite: false }), []);
  const rainMats = rain.map((d) => m4([d.x, 12 - ((t * 22 + d.ph * 12) % 12), d.z], [1, 1, 1], [0, 0, 0.18]));
  const bolt = useMemo(() => {
    const r = rng(88);
    const pts: THREE.Vector3[] = [];
    let x = 2;
    for (let i = 0; i <= 14; i++) {
      pts.push(new THREE.Vector3(x, 16 - i * 1.15, -24));
      x += (r() - 0.5) * 1.6;
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0), 80, 0.07, 5, false);
  }, []);
  const boltMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color("#dff4ff").multiplyScalar(6), transparent: true }), []);
  boltMat.opacity = flash;
  const groundMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2e3a2c", roughness: 0.9 }), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={groundMat}>
        <planeGeometry args={[200, 200]} />
      </mesh>
      <Puffs count={36} seed={66} box={[-30, 30, 9, 16, -40, -8]} size={[10, 18]} t={t} drift={[1.5, 0, 0.2]} k={1} color={flash > 0.1 ? "#8d9aab" : "#2c3440"} opacity={0.9} />
      <Instanced geo={rainGeo} mat={rainMat} mats={rainMats} />
      {flash > 0.02 ? <mesh geometry={bolt} material={boltMat} /> : null}
    </group>
  );
};

/* ───────────── F · open palm + seed ───────────── */
export const SEED_PT: V = [0.004, 0.0178, 0.0];

/** skin detail: mottled albedo + pore bump, deterministic canvas */
const useSkinTex = () =>
  useMemo(() => {
    const r = rng(907);
    const draw = (bump: boolean) => (g: CanvasRenderingContext2D) => {
      g.fillStyle = bump ? "#808080" : "#ffffff";
      g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 2600; i++) {
        const v = bump ? 90 + r() * 80 : 225 + r() * 30;
        g.fillStyle = bump ? `rgb(${v},${v},${v})` : `rgba(${v},${v - 18},${v - 26},0.35)`;
        g.beginPath();
        g.arc(r() * 256, r() * 256, bump ? 0.6 + r() * 1.2 : 3 + r() * 9, 0, Math.PI * 2);
        g.fill();
      }
      if (bump)
        for (let i = 0; i < 70; i++) {
          g.strokeStyle = "rgba(60,60,60,0.5)";
          g.lineWidth = 0.6;
          g.beginPath();
          const x = r() * 256;
          const y = r() * 256;
          g.moveTo(x, y);
          g.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 8);
          g.stroke();
        }
    };
    const map = canvasTex(256, 256, draw(false), [2, 2]);
    map.colorSpace = THREE.SRGBColorSpace;
    const bump = canvasTex(256, 256, draw(true), [3, 3]);
    bump.colorSpace = THREE.NoColorSpace;
    return { map, bump };
  }, []);

/** palm pad: pillow-shaped (superellipse plan, flattened top), cupped in the middle, tapering toward the wrist */
const usePalmGeo = () =>
  useMemo(() => {
    const g = new THREE.SphereGeometry(1, 48, 32);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i);
      let y = p.getY(i);
      let z = p.getZ(i);
      const rc = Math.hypot(x, z);
      if (rc > 1e-5) {
        const se = Math.pow(Math.pow(Math.abs(x), 3) + Math.pow(Math.abs(z), 3), 1 / 3);
        x *= rc / se;
        z *= rc / se;
      }
      y = Math.sign(y) * Math.pow(Math.abs(y), 0.55);
      x *= 0.042;
      z *= 0.05;
      y *= y > 0 ? 0.014 : 0.012;
      const e = Math.max(0, 1 - (x / 0.042) ** 2 - (z / 0.05) ** 2);
      p.setXYZ(i, x * (1 - 0.12 * Math.max(0, z / 0.05)), y - (y > 0 ? 0.006 * e : 0), z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

export const OpenPalm: React.FC = () => {
  const tex = useSkinTex();
  const palmGeo = usePalmGeo();
  const skin = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#c38a6e",
        map: tex.map,
        bumpMap: tex.bump,
        bumpScale: 0.6,
        roughness: 0.62,
        sheen: 0.5,
        sheenColor: new THREE.Color("#ff9e7a"),
        sheenRoughness: 0.55,
        clearcoat: 0.08,
        clearcoatRoughness: 0.6,
      }),
    [tex],
  );
  const back = useMemo(() => {
    const m = skin.clone();
    m.color.set("#93604a");
    return m;
  }, [skin]);
  const seedMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#c9984a", roughness: 0.45, clearcoat: 0.3 }), []);
  // fingers (index → little): [x at the knuckle, proximal / middle / distal length, base radius, splay, curl]
  const fingers: [number, number, number, number, number, number, number][] = [
    [-0.029, 0.044, 0.026, 0.021, 0.0092, 0.12, 0.16],
    [-0.0095, 0.048, 0.03, 0.023, 0.0094, 0.035, 0.14],
    [0.0105, 0.045, 0.028, 0.022, 0.009, -0.05, 0.17],
    [0.029, 0.036, 0.021, 0.019, 0.0078, -0.15, 0.22],
  ];
  const seg = (len: number, r0: number, r1: number, mat: THREE.Material) => (
    <>
      <mesh position={[0, 0, -len / 2]} rotation={[-Math.PI / 2, 0, 0]} material={mat} castShadow receiveShadow>
        <cylinderGeometry args={[r1, r0, len, 16]} />
      </mesh>
      <mesh material={mat} castShadow>
        <sphereGeometry args={[r0 * 1.04, 16, 12]} />
      </mesh>
    </>
  );
  return (
    <group>
      <mesh geometry={palmGeo} position={[0, 0.006, 0]} material={skin} castShadow receiveShadow />
      {/* thenar (thumb) and hypothenar pads, knuckle ridge */}
      <mesh position={[-0.024, 0.009, 0.018]} rotation={[0, -0.35, 0]} scale={[0.02, 0.0105, 0.032]} material={skin} castShadow>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <mesh position={[0.025, 0.008, 0.012]} scale={[0.016, 0.0085, 0.034]} material={skin} castShadow>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      <mesh position={[0, 0.009, -0.039]} scale={[0.042, 0.0085, 0.013]} material={skin}>
        <sphereGeometry args={[1, 24, 16]} />
      </mesh>
      {/* wrist + forearm (sleeve-less), back of the hand darker */}
      <mesh position={[0, 0.0, 0.11]} rotation={[Math.PI / 2 - 0.12, 0, 0]} scale={[1.25, 1, 0.8]} material={back} castShadow>
        <capsuleGeometry args={[0.027, 0.12, 8, 20]} />
      </mesh>
      {fingers.map(([x, l1, l2, l3, rad, splay, curl], i) => (
        <group key={i} position={[x, 0.01, -0.044]} rotation={[0, splay, 0]}>
          <group rotation={[curl * 0.5, 0, 0]}>
            {seg(l1, rad, rad * 0.93, skin)}
            <group position={[0, 0, -l1]} rotation={[curl, 0, 0]}>
              {seg(l2, rad * 0.93, rad * 0.86, skin)}
              <group position={[0, 0, -l2]} rotation={[curl * 0.8, 0, 0]}>
                {seg(l3 - rad * 0.8, rad * 0.86, rad * 0.8, skin)}
                <mesh position={[0, 0, -(l3 - rad * 0.8)]} scale={[1, 0.92, 1.1]} material={skin} castShadow>
                  <sphereGeometry args={[rad * 0.8, 16, 12]} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      ))}
      {/* thumb: metacarpal from the thenar pad, two phalanges angled out and slightly up */}
      <group position={[-0.036, 0.012, 0.02]} rotation={[0.25, 0.95, 0]}>
        {seg(0.032, 0.0125, 0.0112, skin)}
        <group position={[0, 0, -0.032]} rotation={[0.18, -0.15, 0]}>
          {seg(0.03, 0.0112, 0.0102, skin)}
          <group position={[0, 0, -0.03]} rotation={[0.2, 0, 0]}>
            {seg(0.016, 0.0102, 0.0094, skin)}
            <mesh position={[0, 0, -0.016]} scale={[1.05, 0.9, 1.1]} material={skin}>
              <sphereGeometry args={[0.0094, 16, 12]} />
            </mesh>
          </group>
        </group>
      </group>
      {/* the seed: one paddy grain */}
      <mesh position={SEED_PT as [number, number, number]} rotation={[0, 0.6, Math.PI / 2 - 0.1]} scale={[0.0036, 0.0085, 0.0032]} material={seedMat} castShadow>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
    </group>
  );
};

/* ───────────── G · Bangladesh paddy ───────────── */
const riceClump = (seed: number) => {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++)
    parts.push(ribbon({ len: 0.55 + r() * 0.35, width: 0.014, pitch: 0.12 + r() * 0.4, yaw: r() * 6.28, droop: 0.5 + r() * 0.6, base: [(r() - 0.5) * 0.04, 0, (r() - 0.5) * 0.04], seg: 6, fold: 0.1 }));
  const g = mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
  // vertex colour: green base → golden tips
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const a = new THREE.Color("#4f6e2a");
  const b = new THREE.Color("#c9a64a");
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    c.copy(a).lerp(b, Math.min(1, Math.max(0, pos.getY(i) / 0.75)));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
};

const frondCrown = (seed: number) => {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 13; i++) parts.push(ribbon({ len: 2.6 + r() * 0.8, width: 0.42, pitch: 0.5 + r() * 0.5, yaw: (i / 13) * 6.28 + r() * 0.3, droop: 1.6 + r() * 0.6, seg: 8, fold: 0.35 }));
  return mergeGeometries(parts.map((p) => (p.index ? p.toNonIndexed() : p)))!;
};

/** wooden country boat hull (pointed, raised ends) along x, length 5 m */
const hullGeo = () => {
  const g = new THREE.CylinderGeometry(0.62, 0.62, 5, 24, 24, true, Math.PI, Math.PI).rotateZ(Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const u = x / 2.5;
    const w = Math.sqrt(Math.max(0.02, 1 - u * u));
    p.setY(i, p.getY(i) * w * 0.7 + Math.pow(Math.abs(u), 3) * 0.55);
    p.setZ(i, p.getZ(i) * w);
  }
  g.computeVertexNormals();
  return g;
};

export const BanglaPaddy: React.FC<{ readonly t: number }> = ({ t }) => {
  const water = useWaterMat("#6b6a55", 0.6, 0.03);
  water.uni.uTime.value = t;
  water.uni.uRip.value = 0.25;
  const riceMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide, envMapIntensity: 0.9 }), []);
  const clumps = useMemo(() => [riceClump(31), riceClump(32), riceClump(33)], []);
  const grid = useMemo(() => {
    const r = rng(5150);
    const out: { p: V; s: number; v: number; ph: number }[] = [];
    for (let z = -26; z < 6; z += 0.36)
      for (let x = -12; x <= 12; x += 0.36) {
        if (Math.abs(x - 3.2 - z * 0.12) < 1.6) continue; // canal
        if (Math.abs(z + 9) < 0.35 || Math.abs(x + 5) < 0.3) continue; // bunds
        out.push({ p: [x + (r() - 0.5) * 0.1, 0, z + (r() - 0.5) * 0.1], s: 0.8 + r() * 0.4, v: Math.floor(r() * 3), ph: r() * 6.28 });
      }
    return out;
  }, []);
  const mats: THREE.Matrix4[][] = [[], [], []];
  for (const g of grid) {
    const sx = Math.sin(t * 1.2 + g.ph + g.p[0] * 0.4) * 0.05;
    mats[g.v].push(m4(g.p, [g.s, g.s, g.s], [sx, g.ph, sx * 0.6]));
  }
  // far field: rice-row texture on big planes
  const farTex = useMemo(
    () =>
      canvasTex(
        512,
        512,
        (g) => {
          const r = rng(12);
          g.fillStyle = "#7d8a3c";
          g.fillRect(0, 0, 512, 512);
          for (let i = 0; i < 2600; i++) {
            const n = fbm(i * 0.13, 3.1, 3);
            g.fillStyle = r() < 0.5 ? `rgba(201,166,74,${0.25 + n * 0.3})` : `rgba(60,86,36,${0.2 + n * 0.3})`;
            g.fillRect(r() * 512, r() * 512, 2 + r() * 5, 2 + r() * 5);
          }
          for (let y = 0; y < 512; y += 8) {
            g.fillStyle = "rgba(40,50,25,0.18)";
            g.fillRect(0, y, 512, 2);
          }
        },
        [40, 40],
      ),
    [],
  );
  const farMat = useMemo(() => new THREE.MeshStandardMaterial({ map: farTex, roughness: 0.85 }), [farTex]);
  const bundMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6b5640", roughness: 1 }), []);
  // palm tree line
  const crown = useMemo(() => frondCrown(77), []);
  const palmMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3e4d2a", roughness: 0.8, side: THREE.DoubleSide }), []);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.16, 0.24, 1, 8).translate(0, 0.5, 0), []);
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5d5045", roughness: 1 }), []);
  const bushGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  const palms = useMemo(() => {
    const r = rng(2024);
    const trunks: THREE.Matrix4[] = [];
    const crowns: THREE.Matrix4[] = [];
    const bushes: THREE.Matrix4[] = [];
    for (let i = 0; i < 46; i++) {
      const x = -70 + i * 3.1 + (r() - 0.5) * 2;
      const z = -48 - r() * 10;
      const h = 9 + r() * 7;
      const lean = (r() - 0.5) * 0.18;
      trunks.push(m4([x, 0, z], [1, h, 1], [0, 0, lean]));
      crowns.push(m4([x - Math.sin(lean) * h, h * Math.cos(lean), z], [1.2, 1.2, 1.2], [0, r() * 6, 0]));
    }
    for (let i = 0; i < 70; i++) bushes.push(m4([-80 + i * 2.4 + r(), 0.6 + r() * 0.6, -47 - r() * 10], [1.4 + r() * 1.2, 1.1 + r() * 1.3, 1.4], [0, r() * 3, 0]));
    return { trunks, crowns, bushes };
  }, []);
  const bushMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#36452a", roughness: 1 }), []);
  // boat
  const hull = useMemo(() => hullGeo(), []);
  const wood = useMemo(() => {
    const tex = canvasTex(256, 64, (g) => {
      const r = rng(41);
      g.fillStyle = "#5a4330";
      g.fillRect(0, 0, 256, 64);
      for (let y = 0; y < 64; y += 8) {
        g.fillStyle = `rgba(${r() < 0.5 ? "30,20,12" : "120,95,70"},0.45)`;
        g.fillRect(0, y, 256, 1.5);
      }
    });
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, side: THREE.DoubleSide });
  }, []);
  const straw = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8a6f45", roughness: 0.95, side: THREE.DoubleSide }), []);
  const boatZ = -14;
  const boatX = 3.2 + boatZ * 0.12;
  const bob = Math.sin(t * 1.4) * 0.03;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={water.m}>
        <planeGeometry args={[400, 400]} />
      </mesh>
      {/* far paddies beyond the near band, split by bunds */}
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[s * 70 + (s > 0 ? 0 : 0), 0.08, -36]} material={farMat}>
          <planeGeometry args={[132, 24]} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, -90]} material={farMat}>
        <planeGeometry args={[300, 70]} />
      </mesh>
      {[-26.5, -9, -48].map((z) => (
        <mesh key={z} position={[0, 0.12, z]} material={bundMat}>
          <boxGeometry args={[300, 0.3, 0.6]} />
        </mesh>
      ))}
      <mesh position={[-5, 0.12, -10]} material={bundMat}>
        <boxGeometry args={[0.5, 0.3, 32]} />
      </mesh>
      {clumps.map((g, i) => (
        <Instanced key={i} geo={g} mat={riceMat} mats={mats[i]} shadows />
      ))}
      <Instanced geo={trunkGeo} mat={trunkMat} mats={palms.trunks} />
      <Instanced geo={crown} mat={palmMat} mats={palms.crowns} />
      <Instanced geo={bushGeo} mat={bushMat} mats={palms.bushes} />
      {/* country boat with a bamboo-straw canopy, moored in the canal */}
      <group position={[boatX, 0.12 + bob, boatZ]} rotation={[0, Math.PI / 2 + 0.12, Math.sin(t * 1.1) * 0.02]} scale={0.8}>
        <mesh geometry={hull} material={wood} castShadow />
        <mesh position={[0.2, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} material={straw} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 1.6, 16, 1, true, 0, Math.PI]} />
        </mesh>
        <mesh position={[-1.6, 0.9, 0.1]} rotation={[0.1, 0, 0.5]} material={wood}>
          <cylinderGeometry args={[0.025, 0.025, 2.6, 6]} />
        </mesh>
      </group>
      <Puffs count={22} seed={919} box={[-40, 40, 0.5, 3, -50, -12]} size={[10, 18]} t={t} drift={[0.3, 0, 0]} k={1} color="#f2d5a8" opacity={0.22} />
    </group>
  );
};

export { CRATE };
