/**
 * OWNER: science3d agent.
 * Receptor: a GPCR-like protein (adenosine receptor) poking out of a cell membrane.
 * Seven lumpy transmembrane helix bundles in a ring form a cup/socket (~0.7 wide), opening +y,
 * base at `position`. The binding pocket centre is at RECEPTOR_POCKET (local, scale 1).
 *  - lit 0..1: amber activation glow + ripple rings across the membrane (adenosine signal)
 *  - blocked 0..1: cyan "occupied but silent" tint
 *  - grow 0..1: sprouts up out of the membrane (tolerance shot)
 * Membrane: lipid bilayer head-groups as one InstancedMesh (thousands of glossy beads), gentle wave.
 */
import { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { glowTexture, makeNoise3 } from "./sci/util";

/** Local (scale 1) point where a docked molecule's core sits. */
export const RECEPTOR_POCKET: readonly [number, number, number] = [0, 0.5, 0];

const HELIX_N = 7;
const RING_R = 0.24;

/** Lumpy capsule (one helix bundle), noise displaced; built once per index. */
const helixGeo = (i: number) => {
  const g = new THREE.CapsuleGeometry(0.11, 0.42, 12, 24);
  const n = makeNoise3(`helix-${i}`);
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let k = 0; k < pos.count; k++) {
    v.fromBufferAttribute(pos, k);
    const r = Math.hypot(v.x, v.z) || 1;
    // helical ridges + lumps
    const ang = Math.atan2(v.z, v.x);
    const ridge = Math.sin(ang * 3 + v.y * 34) * 0.012;
    const lump = n(v.x * 6, v.y * 6, v.z * 6) * 0.05 + n(v.x * 15 + 5, v.y * 15, v.z * 15) * 0.018;
    const d = ridge + lump;
    v.x += (v.x / r) * d;
    v.z += (v.z / r) * d;
    pos.setXYZ(k, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};
const HELICES = Array.from({ length: HELIX_N }, (_, i) => {
  const a = (i / HELIX_N) * Math.PI * 2 + 0.3;
  return {
    geo: helixGeo(i),
    a,
    h: 0.86 + random(`hh${i}`) * 0.3,
    tilt: 0.1 + random(`ht${i}`) * 0.12,
    tone: random(`hc${i}`),
  };
});

/** Extracellular loops: a lumpy torus rim tying the helices together. */
const rimGeo = (() => {
  const g = new THREE.TorusGeometry(RING_R + 0.02, 0.06, 12, 48);
  const n = makeNoise3("rim");
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let k = 0; k < pos.count; k++) {
    v.fromBufferAttribute(pos, k);
    const d = n(v.x * 9, v.y * 9, v.z * 9) * 0.035;
    v.multiplyScalar(1 + d);
    v.z += n(v.x * 4 + 3, v.y * 4, 0) * 0.04;
    pos.setXYZ(k, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
})();

/** Surface blobs (loops / side chains) that make the protein read organic, not machined. */
const blobGeo = (() => {
  const g = new THREE.SphereGeometry(1, 28, 18);
  const n = makeNoise3("blob");
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let k = 0; k < pos.count; k++) {
    v.fromBufferAttribute(pos, k);
    v.multiplyScalar(1 + n(v.x * 2.5, v.y * 2.5, v.z * 2.5) * 0.25);
    pos.setXYZ(k, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
})();
const BLOBS = Array.from({ length: 16 }, (_, i) => {
  const a = random(`ba${i}`) * Math.PI * 2;
  const top = i < 7;
  const r = top ? 0.16 + random(`br${i}`) * 0.12 : 0.33 + random(`br${i}`) * 0.04;
  return {
    p: [Math.cos(a) * r, top ? 0.36 + random(`by${i}`) * 0.06 : 0.04 + random(`by${i}`) * 0.24, Math.sin(a) * r] as [number, number, number],
    s: top ? 0.055 + random(`bs${i}`) * 0.04 : 0.07 + random(`bs${i}`) * 0.05,
    rot: random(`bq${i}`) * 6,
  };
}).filter((b) => !(b.p[1] > 0.33 && Math.hypot(b.p[0], b.p[2]) < 0.2));

const BASE = new THREE.Color("#9a6cb4");
const BASE2 = new THREE.Color("#6d4a97");
const CYAN = new THREE.Color("#47d7ff");
const AMBER = new THREE.Color("#ffb547");

export const Receptor: React.FC<{
  readonly t: number;
  readonly position?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: number;
  readonly lit?: number;
  readonly blocked?: number;
  /** 0..1 grow-in (used when new receptors sprout in the tolerance shot) */
  readonly grow?: number;
  /** 0..1 darken (sleepy) */
  readonly dim?: number;
}> = ({ t, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, lit = 0, blocked = 0, grow = 1, dim = 0 }) => {
  const mats = useMemo(
    () =>
      HELICES.map(
        () =>
          new THREE.MeshPhysicalMaterial({
            roughness: 0.42,
            clearcoat: 0.5,
            clearcoatRoughness: 0.3,
            sheen: 1,
            sheenRoughness: 0.4,
            sheenColor: new THREE.Color("#ffd2f0"),
          }),
      ),
    [],
  );
  const rimMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ roughness: 0.45, clearcoat: 0.4, sheen: 1, sheenColor: new THREE.Color("#ffd2f0") }),
    [],
  );
  const g = Math.max(0, grow);
  const gy = g < 1 ? 1 - Math.pow(1 - g, 3) + Math.sin(g * Math.PI) * 0.12 : 1;
  const pulse = 0.75 + 0.25 * Math.sin(t * 9);
  const c = new THREE.Color();
  HELICES.forEach((h, i) => {
    c.copy(BASE).lerp(BASE2, h.tone).lerp(CYAN, blocked * 0.32);
    c.multiplyScalar(1 - dim * 0.55);
    mats[i].color.copy(c);
    mats[i].emissive.copy(CYAN).lerp(AMBER, lit / Math.max(0.001, lit + blocked));
    mats[i].emissiveIntensity = (blocked * 0.08 + lit * 0.32 * pulse) * (1 - dim * 0.6);
  });
  rimMat.color.copy(BASE).lerp(CYAN, blocked * 0.3).multiplyScalar(1 - dim * 0.55);
  rimMat.emissive.copy(mats[0].emissive);
  rimMat.emissiveIntensity = mats[0].emissiveIntensity;

  if (g <= 0.001) return null;
  const ripples = lit > 0.01 ? [0, 1, 2] : [];
  return (
    <group position={position as [number, number, number]} rotation={rotation as [number, number, number]} scale={scale}>
      <group scale={[0.6 + 0.4 * gy, gy, 0.6 + 0.4 * gy]} position={[0, -0.18 * (1 - gy), 0]}>
        {HELICES.map((h, i) => (
          <mesh
            key={i}
            geometry={h.geo}
            material={mats[i]}
            castShadow
            receiveShadow
            position={[Math.cos(h.a) * RING_R, 0.05 + (h.h - 1) * 0.2, Math.sin(h.a) * RING_R]}
            rotation={[Math.sin(h.a) * h.tilt, h.a * 2, -Math.cos(h.a) * h.tilt]}
          />
        ))}
        {BLOBS.map((b, i) => (
          <mesh key={`b${i}`} geometry={blobGeo} material={mats[i % HELIX_N]} position={b.p} scale={b.s} rotation={[b.rot, b.rot * 0.7, 0]} castShadow />
        ))}
        <mesh geometry={rimGeo} material={rimMat} position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow />
        {/* pocket glow */}
        <sprite position={[0, 0.36, 0]} scale={[0.9, 0.9, 1]}>
          <spriteMaterial
            map={glowTexture()}
            color={lit >= blocked ? "#ffb547" : "#47d7ff"}
            transparent
            opacity={Math.max(lit * 0.6 * pulse, blocked * 0.45) * (1 - dim * 0.5)}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      </group>
      {ripples.map((k) => {
        const ph = (t * 0.9 + k / 3) % 1;
        return (
          <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]} scale={0.35 + ph * 1.6}>
            <ringGeometry args={[0.85, 1, 64]} />
            <meshBasicMaterial
              color="#ffb547"
              transparent
              opacity={lit * (1 - ph) * 0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

type Hole = readonly [number, number, number]; // x, z, radius

/** Membrane surface patch, lying in XZ plane at y=0, size w x d. Lipid heads as instanced beads. */
export const Membrane: React.FC<{
  readonly t: number;
  readonly w?: number;
  readonly d?: number;
  /** keep the bilayer clear around receptors: [x, z, radius] */
  readonly holes?: readonly Hole[];
  /** head spacing (smaller = more beads) */
  readonly spacing?: number;
  readonly dim?: number;
  /** 0..1 amber tint glow over the surface */
  readonly warm?: number;
}> = ({ t, w = 8, d = 8, holes = [], spacing = 0.075, dim = 0, warm = 0 }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const heads = useMemo(() => {
    const out: { x: number; z: number; s: number; tone: number; ph: number }[] = [];
    const rowH = spacing * 0.866;
    const rows = Math.floor(d / rowH);
    const cols = Math.floor(w / spacing);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jx = (random(`mx${r}-${c}`) - 0.5) * spacing * 0.35;
        const jz = (random(`mz${r}-${c}`) - 0.5) * spacing * 0.35;
        const x = -w / 2 + c * spacing + (r % 2) * spacing * 0.5 + jx;
        const z = -d / 2 + r * rowH + jz;
        if (holes.some(([hx, hz, hr]) => Math.hypot(x - hx, z - hz) < hr)) continue;
        out.push({ x, z, s: 0.85 + random(`ms${r}-${c}`) * 0.3, tone: random(`mt${r}-${c}`), ph: random(`mp${r}-${c}`) * 6.28 });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, d, spacing, JSON.stringify(holes)]);
  const geo = useMemo(() => new THREE.SphereGeometry(spacing * 0.56, 12, 8), [spacing]);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        roughness: 0.28,
        clearcoat: 0.7,
        clearcoatRoughness: 0.2,
        sheen: 0.6,
        sheenColor: new THREE.Color("#ffe0c8"),
      }),
    [],
  );
  mat.emissive.set("#ff9a3c");
  mat.emissiveIntensity = warm * 0.25;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const M = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const c = new THREE.Color();
    const a = new THREE.Color("#c99a8e");
    const b = new THREE.Color("#9c6f78");
    heads.forEach((h, i) => {
      const y = Math.sin(h.x * 1.3 + t * 0.6) * 0.03 + Math.sin(h.z * 1.7 - t * 0.45) * 0.025 + Math.sin(t * 2 + h.ph) * 0.004;
      M.compose(p.set(h.x, y, h.z), q, s.set(h.s, h.s * 0.92, h.s));
      m.setMatrixAt(i, M);
      c.copy(a).lerp(b, h.tone).multiplyScalar(1 - dim * 0.6);
      m.setColorAt(i, c);
    });
    m.count = heads.length;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={ref} args={[geo, mat, heads.length]} frustumCulled={false} receiveShadow />
      {/* hydrophobic core / tails seen between the heads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={new THREE.Color("#3a2220").multiplyScalar(1 - dim * 0.5)} roughness={0.8} />
      </mesh>
    </group>
  );
};
