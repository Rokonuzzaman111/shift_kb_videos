/**
 * Macro studio heap of real grains: rice (pale, slim), wheat (golden, creased oval), maize (yellow wedge).
 * `decay` 0..1 sweeps across the heap with the wind (left → right): grains grey out, shrink and blow away as ash.
 */
import { useLayoutEffect, useMemo, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { rng } from "./util";

type Grain = { p: THREE.Vector3; q: THREE.Quaternion; s: number; c: THREE.Color; delay: number; r: number };

const heapH = (x: number, z: number) => {
  const d = Math.hypot(x, z * 1.1);
  return Math.max(0, 1.15 * Math.exp(-(d * d) / 2.2));
};

const makeGrains = (kind: 0 | 1 | 2, n: number, seed: number): Grain[] => {
  const r = rng(seed);
  const out: Grain[] = [];
  const e = new THREE.Euler();
  for (let i = 0; i < n; i++) {
    const ang = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 2.6;
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad * 0.9;
    const y = heapH(x, z) + r() * 0.03;
    e.set((r() - 0.5) * 1.2, r() * Math.PI * 2, Math.PI / 2 + (r() - 0.5) * 0.9);
    const c = new THREE.Color();
    if (kind === 0) c.setHSL(0.11, 0.25, 0.86 + r() * 0.08);
    else if (kind === 1) c.setHSL(0.075 + r() * 0.02, 0.62, 0.44 + r() * 0.12);
    else c.setHSL(0.12 + r() * 0.015, 0.92, 0.5 + r() * 0.08);
    out.push({ p: new THREE.Vector3(x, y, z), q: new THREE.Quaternion().setFromEuler(e), s: 0.85 + r() * 0.3, c, delay: (x + 2.8) / 5.6 * 0.7 + r() * 0.2, r: r() });
  }
  return out;
};

const GEOS = (() => {
  const rice = new THREE.SphereGeometry(1, 12, 8);
  rice.scale(0.045, 0.13, 0.045);
  const wheat = new THREE.SphereGeometry(1, 12, 8);
  wheat.scale(0.07, 0.12, 0.06);
  const pos = wheat.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    // ventral crease
    const x = pos.getX(i);
    const z = pos.getZ(i);
    if (z > 0) pos.setZ(i, z - 0.025 * Math.exp(-(x * x) / 0.0006));
  }
  wheat.computeVertexNormals();
  const maize = new THREE.SphereGeometry(1, 12, 8);
  maize.scale(0.075, 0.085, 0.042);
  const mp = maize.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < mp.count; i++) if (mp.getY(i) < 0) mp.setX(i, mp.getX(i) * (1 + mp.getY(i) * 6));
  maize.computeVertexNormals();
  return [rice, wheat, maize];
})();

const SETS: [0 | 1 | 2, number, number][] = [
  [1, 1500, 11],
  [0, 1600, 12],
  [2, 420, 13],
];

export const SeedHeap: React.FC<{ readonly decay: number }> = ({ decay }) => {
  const refs = [useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null), useRef<THREE.InstancedMesh>(null)];
  const grains = useMemo(() => SETS.map(([k, n, s]) => makeGrains(k, n, s)), []);
  const ash = new THREE.Color("#55524e");
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const c = new THREE.Color();
    grains.forEach((list, gi) => {
      const mesh = refs[gi].current;
      if (!mesh) return;
      const first = !mesh.instanceColor;
      list.forEach((g, i) => {
        const k = Math.min(1, Math.max(0, (decay - g.delay) / 0.3));
        const grey = Math.min(1, Math.max(0, (decay - g.delay + 0.2) / 0.25));
        pos.copy(g.p);
        pos.x += k * k * (2.5 + g.r * 3);
        pos.y += k * (0.6 + g.r * 1.2) - k * k * 0.2;
        pos.z += k * (g.r - 0.5) * 1.5;
        const s = g.s * (1 - k);
        sc.set(s, s, s);
        m.compose(pos, g.q, sc);
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, c.copy(g.c).lerp(ash, grey));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      if (first) (mesh.material as THREE.Material).needsUpdate = true;
    });
  });
  return (
    <group>
      {SETS.map(([k, n], i) => (
        <instancedMesh key={i} ref={refs[i]} args={[GEOS[k], undefined, n]} castShadow receiveShadow frustumCulled={false}>
          {k === 0 ? (
            <meshPhysicalMaterial roughness={0.42} transmission={0.25} thickness={0.1} clearcoat={0.3} />
          ) : (
            <meshStandardMaterial roughness={k === 2 ? 0.32 : 0.5} />
          )}
        </instancedMesh>
      ))}
    </group>
  );
};

/** Dust flakes that peel off the heap and blow right with the wind. */
export const GrainDust: React.FC<{ readonly decay: number }> = ({ decay }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const { geo, base } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const r = rng(41);
    const n = 2600;
    const b = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const ang = r() * Math.PI * 2;
      const rad = Math.sqrt(r()) * 2.6;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad * 0.9;
      b.set([x, heapH(x, z), z, r()], i * 4);
    }
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    return { geo: g, base: b };
  }, []);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const [x, y, z, r] = [base[i * 4], base[i * 4 + 1], base[i * 4 + 2], base[i * 4 + 3]];
    const delay = ((x + 2.8) / 5.6) * 0.7 + r * 0.2;
    const k = Math.max(0, decay - delay) * 2.2;
    p.setXYZ(i, x + k * k * (3 + r * 4), y + k * (0.8 + r * 1.6) + Math.sin(t * 3 + i) * 0.03 * k, z + Math.sin(i) * k * 0.6);
  }
  p.needsUpdate = true;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#8d8379" size={0.025} transparent opacity={Math.min(1, decay * 3) * 0.85} depthWrite={false} />
    </points>
  );
};
