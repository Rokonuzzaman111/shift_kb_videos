/**
 * New live-3D money/scale scenes for Part 5 (OWNER: lead). All animation from props (0..1), deterministic.
 *  - GoldStacksShot : rows of polished gold bars stacking up (revenue)
 *  - Bars3DShot     : two glossy columns growing (last year vs this year), camera orbits
 *  - BdTowerShot    : extruded 3D Bangladesh + a tower of 11 Bangladesh-sized slabs, camera cranes up
 */
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { N } from "../theme";
import { BD_PATH } from "../two/bdPath";
import { type Cam, Studio, orbit, type V3 } from "./Studio";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - (1 - clamp01(v)) ** 3;

/* ------------------------------------------------------------------ gold bars */
const GOLD = { color: "#e2b04a", metalness: 1, roughness: 0.22 } as const;

const GoldBar: React.FC<{ readonly p: V3; readonly s: number; readonly rot?: number }> = ({ p, s, rot = 0 }) => (
  <group position={p} rotation={[0, rot, 0]} scale={[s, s, s]}>
    <RoundedBox args={[2.2, 0.62, 1.05]} radius={0.12} smoothness={3} castShadow receiveShadow>
      <meshPhysicalMaterial {...GOLD} clearcoat={0.6} clearcoatRoughness={0.25} />
    </RoundedBox>
    <mesh position={[0, 0.315, 0]}>
      <boxGeometry args={[1.5, 0.02, 0.55]} />
      <meshStandardMaterial color="#c99a3a" metalness={1} roughness={0.35} />
    </mesh>
  </group>
);

/** fill 0..1 = how many of the bars have landed; t = camera move 0..1 */
export const GoldStacksShot: React.FC<{ readonly fill: number; readonly t: number; readonly glow?: number }> = ({ fill, t, glow = 0 }) => {
  const bars = useMemo(() => {
    const out: { x: number; z: number; y: number; k: number; rot: number }[] = [];
    let k = 0;
    for (let col = 0; col < 5; col++)
      for (let row = 0; row < 3; row++) {
        const h = 3 + ((col * 7 + row * 3) % 4);
        for (let l = 0; l < h; l++) out.push({ x: (col - 2) * 2.6, z: (row - 1) * 1.35, y: 0.31 + l * 0.64, k: k++, rot: (((col + row + l) % 3) - 1) * 0.015 });
      }
    return out.map((b) => ({ ...b, k: b.k / k }));
  }, []);
  const target: V3 = [0, 1.6 + t * 0.8, 0];
  const cam: Cam = { pos: orbit(target, 17 - t * 4, 6.5 - t * 1.5, -0.7 + t * 0.55), target, mm: 50, focus: 15 - t * 4, range: 6 };
  return (
    <Studio camera={cam} size={10} accent={0.35 + glow * 0.6} env={1.3}>
      {bars.map((b, i) => {
        const land = clamp01((fill - b.k * 0.85) / 0.15);
        if (land <= 0) return null;
        const drop = (1 - easeOut(land)) * 6;
        return <GoldBar key={i} p={[b.x, b.y + drop, b.z]} s={1} rot={b.rot} />;
      })}
    </Studio>
  );
};

/* ------------------------------------------------------------------ two columns */
const Column: React.FC<{ readonly x: number; readonly h: number; readonly color: string; readonly emissive: number }> = ({ x, h, color, emissive }) => (
  <group position={[x, 0, 0]}>
    <RoundedBox args={[2.4, Math.max(0.05, h), 2.4]} radius={0.14} smoothness={3} position={[0, Math.max(0.05, h) / 2, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.18} clearcoat={1} clearcoatRoughness={0.1} emissive={color} emissiveIntensity={emissive} />
    </RoundedBox>
    {/* glowing cap */}
    <mesh position={[0, h + 0.02, 0]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[2.2, 2.2]} />
      <meshBasicMaterial color={color} transparent opacity={0.35 + emissive} toneMapped={false} />
    </mesh>
  </group>
);

/** a,b = heights 0..1 (b is 2× a at full); t = camera orbit */
export const Bars3DShot: React.FC<{ readonly a: number; readonly b: number; readonly t: number }> = ({ a, b, t }) => {
  const H = 7;
  const target: V3 = [0, 3.4, 0];
  const cam: Cam = { pos: orbit(target, 16 - t * 2, 2.2 + t * 1.6, 0.55 - t * 0.9), target, mm: 45, focus: 15, range: 8 };
  return (
    <Studio camera={cam} size={10} accent={0.5}>
      <Column x={-2.2} h={(H / 2) * easeOut(a)} color="#59636b" emissive={0.04} />
      <Column x={2.2} h={H * easeOut(b)} color={N.green} emissive={0.25 * easeOut(b)} />
    </Studio>
  );
};

/* ------------------------------------------------------------------ Bangladesh + 11-slab tower */
const parseBd = () => {
  const shapes: THREE.Shape[] = [];
  for (const sub of BD_PATH.split("Z")) {
    const pts = [...sub.matchAll(/([\d.]+) ([\d.]+)/g)].map((m) => new THREE.Vector2(Number(m[1]) / 160 - 2.25, -Number(m[2]) / 160 + 3.1));
    if (pts.length > 10) shapes.push(new THREE.Shape(pts));
  }
  return shapes;
};

const BdSlab: React.FC<{ readonly y: number; readonly depth: number; readonly color: string; readonly emissive: number; readonly opacity?: number }> = ({ y, depth, color, emissive, opacity = 1 }) => {
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(parseBd(), { depth, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 4 });
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }, [depth]);
  return (
    <mesh geometry={geo} position={[0, y, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial color={color} metalness={0.2} roughness={0.25} clearcoat={1} clearcoatRoughness={0.15} emissive={color} emissiveIntensity={emissive} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  );
};

/** grow 0..1 = how many of the 11 slabs are stacked on the NVIDIA tower; t = camera crane */
export const BdTowerShot: React.FC<{ readonly grow: number; readonly t: number }> = ({ grow, t }) => {
  const D = 0.42; // one Bangladesh economy = one slab
  const n = 11 * clamp01(grow);
  const top = Math.max(1, n) * (D + 0.08);
  const target: V3 = [1.5, 0.8 + t * top * 0.75, 0];
  const cam: Cam = { pos: [1.5 + 13 - t * 2, 2.5 + t * top * 0.9, 13 - t * 1], target, mm: 40, focus: 18, range: 12 };
  return (
    <Studio camera={cam} size={12} accent={0.5}>
      {/* Bangladesh, one year of its economy */}
      <group position={[-4.2, 0, 0]}>
        <BdSlab y={0} depth={D} color={N.green} emissive={0.12} />
      </group>
      {/* NVIDIA value = 11 Bangladesh-sized slabs */}
      <group position={[3.6, 0, 0]}>
        {Array.from({ length: 11 }).map((_, i) => {
          const k = clamp01(n - i);
          if (k <= 0) return null;
          const drop = (1 - easeOut(k)) * 3;
          return <BdSlab key={i} y={i * (D + 0.08) + drop} depth={D} color={i % 2 ? "#3a8a00" : N.green} emissive={0.18} opacity={0.5 + 0.5 * easeOut(k)} />;
        })}
      </group>
    </Studio>
  );
};
