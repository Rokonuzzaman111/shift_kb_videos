/**
 * OWNER: props3d agent.
 * Photoreal Bangladeshi tong-dokan glass of milk tea (dudh cha), base at `position`, 1 unit tall at scale 1
 * (rim radius ≈ 0.37, base radius ≈ 0.28). Self-contained: no dependency on Desk or a light rig; looks right under
 * HDRI.studio alone (it brings its own contact shadow).
 *  - fill: 0..1 tea level
 *  - steam: 0..1 steam amount (layered noise sprites, animated from t)
 *  - caffeineGlow: 0..1 tiny cyan glowing particles at/above the tea surface + faint cyan tint
 *  - spoon: a steel teaspoon leaning in the glass (default false)
 *  - shadow: soft contact shadow blob under the glass (default true)
 * Exported helpers: TEA_TOP(fill) = local y of the tea surface, CUP_RIM_R.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { K } from "../theme";
import { blobTexture, dotTexture, mulberry32, steamTexture, teaTopTexture } from "./props/tex";

const BASE_IN = 0.1; // inner floor (thick glass base)
const TOP_Y = 0.985;
const R_IN_BOT = 0.262;
const R_IN_TOP = 0.346;
export const CUP_RIM_R = 0.369;

const rIn = (y: number) => R_IN_BOT + ((y - BASE_IN) / (TOP_Y - BASE_IN)) * (R_IN_TOP - R_IN_BOT);
const rOut = (y: number) => 0.284 + ((y - 0.04) / (TOP_Y - 0.04)) * (CUP_RIM_R - 0.284);

export const TEA_TOP = (fill: number) => BASE_IN + Math.max(0.02, Math.min(1, fill)) * 0.83;

const SEG = 128;

const glassGeometry = () => {
  const pts: [number, number][] = [
    [0.0005, 0],
    [0.24, 0],
    [0.268, 0.005],
    [0.281, 0.02],
    [0.284, 0.04],
  ];
  const outerStart = pts.length;
  for (let i = 1; i <= 24; i++) {
    const y = 0.04 + (i / 24) * (TOP_Y - 0.04);
    pts.push([rOut(y), y]);
  }
  const outerEnd = pts.length;
  pts.push([0.3675, 0.994], [0.3625, 0.9995], [0.355, 0.999], [0.349, 0.993]);
  for (let i = 0; i <= 20; i++) {
    const y = TOP_Y - (i / 20) * (TOP_Y - (BASE_IN + 0.02));
    pts.push([rIn(y), y]);
  }
  pts.push([R_IN_BOT - 0.012, BASE_IN + 0.003], [R_IN_BOT - 0.04, BASE_IN], [0.0005, BASE_IN - 0.004]);
  const prof = pts.map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(prof, SEG);
  // Shallow vertical flutes on the lower outer wall, like the classic tong-dokan glass.
  const pos = g.attributes.position as THREE.BufferAttribute;
  const n = prof.length;
  for (let i = 0; i < pos.count; i++) {
    const j = i % n;
    if (j < outerStart || j >= outerEnd) continue;
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const th = Math.atan2(z, x);
    const fade = 1 - THREE.MathUtils.smoothstep(y, 0.32, 0.52);
    const k = 1 - 0.022 * fade * Math.pow(0.5 + 0.5 * Math.cos(th * 16), 0.6);
    pos.setXYZ(i, x * k, y, z * k);
  }
  g.computeVertexNormals();
  return g;
};

const teaBodyGeometry = (top: number) => {
  const pts: [number, number][] = [
    [0.0005, BASE_IN + 0.001],
    [rIn(BASE_IN + 0.01) - 0.035, BASE_IN + 0.001],
    [rIn(BASE_IN + 0.01) - 0.006, BASE_IN + 0.01],
  ];
  for (let i = 1; i <= 10; i++) {
    const y = BASE_IN + 0.01 + (i / 10) * (top - BASE_IN - 0.01);
    pts.push([rIn(y) - 0.003, y]);
  }
  const g = new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    96,
  );
  g.computeVertexNormals();
  return g;
};

/** Surface with a meniscus climbing the glass wall; planar UVs for the foam texture. */
const teaTopGeometry = (top: number) => {
  const r = rIn(top) - 0.003;
  const pts: [number, number][] = [];
  const N = 14;
  for (let i = 0; i <= N; i++) {
    const k = i / N; // 0 = rim, 1 = centre
    const rr = r * (1 - Math.pow(k, 1.6));
    const rise = 0.016 * Math.pow(Math.max(0, 1 - (r - rr) / 0.05), 2.4);
    pts.push([Math.max(0.0005, rr), top + rise]);
  }
  const g = new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    96,
  );
  const P = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < P.count; i++) {
    uv.setXY(i, 0.5 + (P.getX(i) / r) * 0.5, 0.5 + (P.getZ(i) / r) * 0.5);
  }
  g.computeVertexNormals();
  return g;
};

const STEAM_N = 16;
const GLOW_N = 90;

const Steam: React.FC<{ t: number; amount: number; top: number }> = ({ t, amount, top }) => {
  const tex = useMemo(() => [steamTexture(0), steamTexture(1), steamTexture(2)], []);
  const seeds = useMemo(() => {
    const r = mulberry32(42);
    return new Array(STEAM_N).fill(0).map(() => ({ ph: r(), dx: r() - 0.5, dz: r() - 0.5, sp: 0.8 + r() * 0.4, rot: r() * 6.28, spin: (r() - 0.5) * 1.2, v: Math.floor(r() * 3) }));
  }, []);
  if (amount <= 0.001) return null;
  return (
    <group>
      {seeds.map((s, i) => {
        const period = 3.6 / s.sp;
        const p = (((t / period + s.ph) % 1) + 1) % 1;
        const y = top + 0.12 + p * 1.25;
        const sway = Math.sin(t * 0.9 + i * 1.7 + p * 3) * 0.08 * p;
        const x = s.dx * 0.18 + sway + p * p * 0.15;
        const z = s.dz * 0.18 + Math.cos(t * 0.7 + i) * 0.05 * p;
        const size = 0.28 + p * 0.85;
        const op = amount * 0.2 * Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.15)), 1.4);
        return (
          <sprite key={i} position={[x, y, z]} scale={[size, size * 1.25, 1]} renderOrder={10}>
            <spriteMaterial map={tex[s.v]} color="#fff4e6" transparent opacity={op} depthWrite={false} rotation={s.rot + s.spin * p} />
          </sprite>
        );
      })}
    </group>
  );
};

const CaffeineSparks: React.FC<{ t: number; glow: number; top: number }> = ({ t, glow, top }) => {
  const seeds = useMemo(() => {
    const r = mulberry32(7);
    return new Array(GLOW_N).fill(0).map(() => ({ a: r() * 6.283, rr: Math.sqrt(r()) * 0.86, ph: r(), rise: 0.06 + r() * 0.3, sz: 0.5 + r() * 0.8, float: r() < 0.65 }));
  }, []);
  const dot = useMemo(dotTexture, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(GLOW_N * 3), 3));
    return g;
  }, []);
  const core = useMemo(() => new THREE.Color(K.cyan).lerp(new THREE.Color("#ffffff"), 0.35).multiplyScalar(2.5), []);
  const halo = useMemo(() => new THREE.Color(K.cyan).multiplyScalar(1.4), []);
  const r0 = rIn(top) - 0.02;
  const P = geo.attributes.position as THREE.BufferAttribute;
  seeds.forEach((s, i) => {
    const p = (((t / 2.8 + s.ph) % 1) + 1) % 1;
    const rr = s.rr * r0;
    if (s.float) {
      const a = s.a + p * 0.6;
      // floaters below their window are parked under the surface (hidden by the opaque tea)
      const vis = Math.sin(Math.PI * p) * s.sz > 0.35;
      P.setXYZ(i, Math.cos(a) * rr * (1 - p * 0.3), vis ? top + 0.01 + p * p * (s.rise + (1 - top) * 0.95) : top - 0.2, Math.sin(a) * rr * (1 - p * 0.3));
    } else {
      const tw = Math.sin(t * 5 + s.ph * 40);
      P.setXYZ(i, Math.cos(s.a) * rr, tw > -0.4 ? top + 0.006 : top - 0.2, Math.sin(s.a) * rr);
    }
  });
  P.needsUpdate = true;
  if (glow <= 0.001) return null;
  return (
    <group>
      <points geometry={geo} frustumCulled={false} renderOrder={12}>
        <pointsMaterial map={dot} color={halo} size={0.16} sizeAttenuation transparent opacity={glow * 0.85} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </points>
      <points geometry={geo} frustumCulled={false} renderOrder={13}>
        <pointsMaterial map={dot} color={core} size={0.04} sizeAttenuation transparent opacity={glow} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </points>
    </group>
  );
};

const Spoon: React.FC = () => {
  // Leans from the bottom-left of the glass over the right rim.
  const a = new THREE.Vector3(-0.16, 0.16, 0.04);
  const b = new THREE.Vector3(0.43, 1.32, -0.06);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const len = a.distanceTo(b);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return (
    <group position={mid} quaternion={q}>
      <mesh scale={[1, 1, 0.35]} castShadow>
        <cylinderGeometry args={[0.016, 0.011, len, 12]} />
        <meshStandardMaterial color="#d8d8d8" metalness={1} roughness={0.22} />
      </mesh>
      <mesh position={[0, -len / 2 - 0.05, 0]} scale={[0.07, 0.11, 0.025]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#d8d8d8" metalness={1} roughness={0.22} />
      </mesh>
    </group>
  );
};

export const TeaCup: React.FC<{
  readonly t: number;
  readonly position?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: number;
  readonly fill?: number;
  readonly steam?: number;
  readonly caffeineGlow?: number;
  readonly spoon?: boolean;
  readonly shadow?: boolean;
}> = ({ t, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, fill = 0.85, steam = 0.6, caffeineGlow = 0, spoon = false, shadow = true }) => {
  const top = TEA_TOP(fill);
  const glass = useMemo(glassGeometry, []);
  const body = useMemo(() => teaBodyGeometry(top), [top]);
  const surf = useMemo(() => teaTopGeometry(top), [top]);
  const topTex = useMemo(teaTopTexture, []);
  const blob = useMemo(blobTexture, []);
  const dot = useMemo(dotTexture, []);
  const cyan = useMemo(() => new THREE.Color(K.cyan), []);
  return (
    <group position={position as [number, number, number]} rotation={rotation as [number, number, number]} scale={scale}>
      {shadow ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.03, 0.002, 0.02]} renderOrder={1}>
          <planeGeometry args={[1.05, 1.05]} />
          <meshBasicMaterial map={blob} color="#000000" transparent opacity={0.6} depthWrite={false} />
        </mesh>
      ) : null}
      {/* Milk tea: slightly glossy, creamy */}
      <mesh geometry={body} castShadow receiveShadow>
        <meshPhysicalMaterial color="#c48d5a" roughness={0.4} clearcoat={0.4} clearcoatRoughness={0.25} sheen={0.4} sheenColor="#f2d4a8" emissive={cyan} emissiveIntensity={caffeineGlow * 0.04} />
      </mesh>
      <mesh geometry={surf} receiveShadow>
        <meshPhysicalMaterial map={topTex} roughness={0.3} clearcoat={0.6} clearcoatRoughness={0.12} emissive={cyan} emissiveIntensity={caffeineGlow * 0.22} />
      </mesh>
      {spoon ? <Spoon /> : null}
      {/* Glass: real wall thickness, refraction through transmission */}
      <mesh geometry={glass} renderOrder={5}>
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={1}
          thickness={0.08}
          ior={1.5}
          roughness={0.035}
          metalness={0}
          specularIntensity={1}
          envMapIntensity={1.4}
          attenuationColor="#e3f2ea"
          attenuationDistance={1.5}
          clearcoat={0.6}
          clearcoatRoughness={0.02}
        />
      </mesh>
      {caffeineGlow > 0.001 ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, top + 0.02, 0]} renderOrder={11}>
          <planeGeometry args={[rIn(top) * 2.3, rIn(top) * 2.3]} />
          <meshBasicMaterial map={dot} color={cyan} transparent opacity={caffeineGlow * 0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ) : null}
      <CaffeineSparks t={t} glow={caffeineGlow} top={top} />
      <Steam t={t} amount={steam} top={top} />
    </group>
  );
};
