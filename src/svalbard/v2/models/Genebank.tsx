/**
 * Svalbard v2 · Part 2 genebank interiors (metres, y up, floor y = 0).
 *  JarSet       — instanced glass seed jars (glass + seed fill with per-jar colour + steel lid).
 *  GenebankRoom — cold room with compact mobile shelving units (rows along z, end panels with hand-wheels facing +z),
 *                 jars on every shelf, floor rails, frosty LED ceiling panels. `open` slides the right block to open an aisle.
 *  JarWall      — a tall steel shelving wall full of jars of differently coloured seeds (the "hundreds" reveal).
 */
import { useMemo } from "react";
import * as THREE from "three";
import { usePBR } from "../../../kit/assets";
import { canvasTex, rng } from "../../three/util";
import { useSteelMat, useWhiteRockMat } from "./Corridor";
import { m4 } from "./SeedMacro";

type V = readonly [number, number, number];

export const SEED_COLORS = ["#ece6d6", "#c9944a", "#e5a92a", "#6b3b22", "#2a2422", "#a8452d", "#8d9a4a", "#d8c07a", "#b8a48a", "#4e3a2c", "#d9d2b8", "#9c6a3a"];

const useSeedFillMat = () =>
  useMemo(() => {
    const bump = canvasTex(
      256,
      256,
      (g) => {
        g.fillStyle = "#606060";
        g.fillRect(0, 0, 256, 256);
        const r = rng(51);
        for (let i = 0; i < 900; i++) {
          const x = r() * 256;
          const y = r() * 256;
          const gr = g.createRadialGradient(x, y, 0, x, y, 5 + r() * 3);
          gr.addColorStop(0, "rgba(255,255,255,0.9)");
          gr.addColorStop(1, "rgba(0,0,0,0.4)");
          g.fillStyle = gr;
          g.fillRect(x - 9, y - 9, 18, 18);
        }
      },
      [2, 2],
    );
    bump.colorSpace = THREE.NoColorSpace;
    return new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6, bumpMap: bump, bumpScale: 4, map: bump });
  }, []);

/** jars: each item = base position (bottom centre), uniform scale, colour index */
export type Jar = { p: V; s: number; c: number };

export const JarSet: React.FC<{ readonly jars: Jar[]; readonly r?: number; readonly h?: number }> = ({ jars, r = 0.05, h = 0.15 }) => {
  const fill = useSeedFillMat();
  const lid = useSteelMat([0.3, 0.3], "#c3ccd4", 0.3, 1);
  const glass = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#eef4f8", roughness: 0.06, metalness: 0, transparent: true, opacity: 0.24, clearcoat: 1, envMapIntensity: 2, depthWrite: false }),
    [],
  );
  const geo = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 18).translate(0, 0.5, 0), []);
  const meshes = useMemo(() => {
    const mk = (mat: THREE.Material, shadows: boolean) => {
      const im = new THREE.InstancedMesh(geo, mat, jars.length);
      im.frustumCulled = false;
      im.castShadow = shadows;
      im.receiveShadow = shadows;
      return im;
    };
    const g = mk(glass, false);
    const f = mk(fill, true);
    const l = mk(lid, true);
    const col = new THREE.Color();
    jars.forEach((j, i) => {
      const s = j.s;
      g.setMatrixAt(i, m4(j.p, [r * s, h * s, r * s]));
      f.setMatrixAt(i, m4([j.p[0], j.p[1] + 0.004 * s, j.p[2]], [r * 0.93 * s, h * (0.62 + ((i * 37) % 23) / 100) * s, r * 0.93 * s]));
      l.setMatrixAt(i, m4([j.p[0], j.p[1] + h * s, j.p[2]], [r * 1.04 * s, 0.022 * s, r * 1.04 * s]));
      f.setColorAt(i, col.set(SEED_COLORS[j.c % SEED_COLORS.length]));
    });
    [g, f, l].forEach((m) => (m.instanceMatrix.needsUpdate = true));
    if (f.instanceColor) f.instanceColor.needsUpdate = true;
    return [f, l, g];
  }, [jars, geo, glass, fill, lid, r, h]);
  return (
    <>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </>
  );
};

/* ───────────── genebank room ───────────── */
export const GB = { units: 12, uw: 0.9, gap: 0.32, z0: -5.2, z1: -0.25, uh: 2.25, shelves: 6, openUnit: 6, openW: 1.0 } as const;
export const unitX = (i: number, open: number) => (i - (GB.units - 1) / 2) * (GB.uw + GB.gap) + (i >= GB.openUnit ? GB.openW * open : 0);

const shelfY = (j: number) => 0.16 + j * 0.36;

const Unit: React.FC<{ readonly x: number; readonly seed: number; readonly paint: THREE.Material; readonly steel: THREE.Material }> = ({ x, seed, paint, steel }) => {
  const D = GB.z1 - GB.z0;
  const zc = (GB.z0 + GB.z1) / 2;
  const jars = useMemo(() => {
    const r = rng(seed);
    const out: Jar[] = [];
    for (let j = 0; j < GB.shelves; j++)
      for (const side of [-1, 1])
        for (let z = GB.z1 - 0.2; z > GB.z0 + 0.1; z -= 0.125) {
          if (r() < 0.06) continue;
          out.push({ p: [side * (GB.uw / 2 - 0.09), shelfY(j) + 0.012, z], s: 0.9 + r() * 0.2, c: Math.floor(r() * SEED_COLORS.length) });
        }
    return out;
  }, [seed]);
  return (
    <group position={[x, 0, 0]}>
      {/* end panel (painted steel) + hand-wheel */}
      <mesh material={paint} position={[0, GB.uh / 2 + 0.06, GB.z1 + 0.025]} castShadow receiveShadow>
        <boxGeometry args={[GB.uw + 0.04, GB.uh + 0.1, 0.05]} />
      </mesh>
      <mesh material={steel} position={[0, 1.15, GB.z1 + 0.09]} castShadow>
        <torusGeometry args={[0.13, 0.012, 10, 36]} />
      </mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} material={steel} position={[0, 1.15, GB.z1 + 0.085]} rotation={[0, 0, (k * Math.PI * 2) / 3]}>
          <boxGeometry args={[0.012, 0.26, 0.01]} />
        </mesh>
      ))}
      <mesh material={steel} position={[0, 1.15, GB.z1 + 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.06, 16]} />
      </mesh>
      {/* label card */}
      <mesh position={[0, 1.75, GB.z1 + 0.052]}>
        <planeGeometry args={[0.2, 0.07]} />
        <meshStandardMaterial color="#7d8a95" roughness={0.85} />
      </mesh>
      {/* base carriage, top, centre divider, shelves */}
      <mesh material={paint} position={[0, 0.06, zc]} receiveShadow>
        <boxGeometry args={[GB.uw, 0.12, D]} />
      </mesh>
      <mesh material={paint} position={[0, GB.uh + 0.06, zc]}>
        <boxGeometry args={[GB.uw, 0.03, D]} />
      </mesh>
      <mesh material={steel} position={[0, GB.uh / 2, zc]} receiveShadow>
        <boxGeometry args={[0.02, GB.uh, D]} />
      </mesh>
      {Array.from({ length: GB.shelves }, (_, j) => (
        <mesh key={j} material={steel} position={[0, shelfY(j), zc]} receiveShadow castShadow>
          <boxGeometry args={[GB.uw, 0.02, D]} />
        </mesh>
      ))}
      <JarSet jars={jars} r={0.045} h={0.16} />
    </group>
  );
};

export const GenebankRoom: React.FC<{ readonly open: number; readonly t: number }> = ({ open, t }) => {
  const pbr = usePBR("concrete_wall_008", [6, 3]);
  const floor = useMemo(
    () => new THREE.MeshStandardMaterial({ map: pbr.map, normalMap: pbr.normalMap, roughnessMap: pbr.roughnessMap, color: "#9aa3ab", roughness: 0.55, envMapIntensity: 0.8 }),
    [pbr],
  );
  const paint = useSteelMat([1, 1], "#cfd6dc", 0.5, 0.25, 0.25);
  const steel = useSteelMat([1, 1], "#a6b0b9", 0.35, 0.9);
  const wall = useWhiteRockMat([4, 2], 0.4);
  const span = unitX(GB.units - 1, 1) + 2;
  return (
    <group>
      <mesh material={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[span * 2 + 4, 10]} />
      </mesh>
      {[-1.2, -2.7, -4.2].map((z) => (
        <mesh key={z} material={steel} position={[0, 0.01, z]} receiveShadow>
          <boxGeometry args={[span * 2 + 4, 0.02, 0.05]} />
        </mesh>
      ))}
      <mesh material={wall} position={[0, 1.6, GB.z0 - 0.3]}>
        <planeGeometry args={[span * 2 + 4, 3.2]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.0, -2]}>
        <planeGeometry args={[span * 2 + 4, 10]} />
        <meshStandardMaterial color="#5a6570" roughness={0.9} />
      </mesh>
      {/* frosty LED panels */}
      {Array.from({ length: 14 }, (_, i) =>
        [-1.0, -3.4].map((z) => (
          <mesh key={`${i}${z}`} rotation={[Math.PI / 2, 0, 0]} position={[(i - 6.5) * 1.5, 2.98, z]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshStandardMaterial color="#000" emissive="#dfeaf3" emissiveIntensity={2.4 + 0.05 * Math.sin(t * 40 + i)} />
          </mesh>
        )),
      )}
      {Array.from({ length: GB.units }, (_, i) => (
        <Unit key={i} x={unitX(i, open)} seed={100 + i} paint={paint} steel={steel} />
      ))}
    </group>
  );
};

/* ───────────── jar wall (D reveal) ───────────── */
export const JarWall: React.FC<{ readonly z: number; readonly width: number }> = ({ z, width }) => {
  const steel = useSteelMat([1, 1], "#a9b3bc", 0.35, 0.9);
  const rows = 9;
  const pitch = 0.16;
  const rowY = (j: number) => 0.12 + j * 0.27;
  const jars = useMemo(() => {
    const r = rng(77);
    const out: Jar[] = [];
    const n = Math.floor(width / pitch);
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < n; i++) {
        const x = -width / 2 + pitch / 2 + i * pitch;
        out.push({ p: [x, rowY(j) + 0.012, z + 0.14 + (r() - 0.5) * 0.02], s: 0.95 + r() * 0.1, c: Math.floor(r() * SEED_COLORS.length) });
        if (r() < 0.7) out.push({ p: [x + 0.03, rowY(j) + 0.012, z - 0.02], s: 0.95, c: Math.floor(r() * SEED_COLORS.length) });
      }
    return out;
  }, [width, z]);
  return (
    <group>
      {Array.from({ length: rows }, (_, j) => (
        <mesh key={j} material={steel} position={[0, rowY(j), z + 0.06]} receiveShadow castShadow>
          <boxGeometry args={[width, 0.024, 0.42]} />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(width / 1.2) + 1 }, (_, i) => (
        <mesh key={i} material={steel} position={[-width / 2 + i * 1.2, rowY(rows - 1) / 2 + 0.1, z + 0.27]}>
          <boxGeometry args={[0.04, rowY(rows - 1) + 0.2, 0.04]} />
        </mesh>
      ))}
      <JarSet jars={jars} r={0.055} h={0.17} />
    </group>
  );
};

export type { V as GV3 };
