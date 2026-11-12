/**
 * Shared parts for shots S12 to S17 (control rods → turbine).
 * Units: metres. Vessel dims from VVER-1200 references: RPV Ø 4.57 m, ~11 m long,
 * 163 hexagonal assemblies (pitch ~0.236 m), active core ~3.7 m, ~121 control-rod drives.
 */
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import { interpolate } from "remotion";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { usePBR } from "../kit/assets";
import { clamp, ease, prog, useSeconds } from "../kit/time";
import { C, bodyFont, headFont } from "../theme";
import { softSprite } from "../three/textures";

export const bn = (s: string | number) => String(s).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

/** Enables material clipping planes on this canvas (used for cutaways). */
export const ClipEnable: React.FC = () => {
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    gl.localClippingEnabled = true;
  }, [gl]);
  return null;
};

/** Brushed stainless / forged steel with real PBR maps. */
export const useSteel = (color = "#b7bcc2", rough = 0.32, repeat: [number, number] = [2, 2]) => {
  const tex = usePBR("metal_plate", repeat);
  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        metalness: 0.9,
        roughness: rough,
        normalMap: tex.normalMap,
        normalScale: new THREE.Vector2(0.3, 0.3),
        roughnessMap: tex.roughnessMap,
        side: THREE.DoubleSide,
        clearcoat: 0.1,
      }),
    [tex, color, rough],
  );
};

export const useGlowTex = () => useMemo(() => softSprite("rgba(255,255,255,1)"), []);

export const Glow: React.FC<{
  tex: THREE.Texture;
  at: readonly number[];
  size: number;
  color: string;
  opacity: number;
}> = ({ tex, at, size, color, opacity }) =>
  opacity <= 0.001 ? null : (
    <sprite position={[at[0], at[1], at[2]]} scale={[size, size, 1]}>
      <spriteMaterial
        map={tex}
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );

/** Glowing particle cloud; positions are recomputed every frame by `place(i, out)`. */
export const Particles: React.FC<{
  count: number;
  size: number;
  color: string;
  opacity?: number;
  additive?: boolean;
  place: (i: number, out: THREE.Vector3) => boolean; // return false to hide
  clip?: THREE.Plane[];
}> = ({ count, size, color, opacity = 1, additive = true, place, clip }) => {
  const tex = useGlowTex();
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const v = new THREE.Vector3();
  const arr = geo.attributes.position.array as Float32Array;
  for (let i = 0; i < count; i++) {
    const ok = place(i, v);
    if (ok) arr.set([v.x, v.y, v.z], i * 3);
    else arr.set([0, -9999, 0], i * 3);
  }
  geo.attributes.position.needsUpdate = true;
  geo.computeBoundingSphere();
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial
        map={tex}
        size={size}
        color={color}
        transparent
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
        blending={additive ? THREE.AdditiveBlending : THREE.NormalBlending}
        toneMapped={false}
        clippingPlanes={clip ?? null}
      />
    </points>
  );
};

/** Big number readout panel (top area), pops in at `at` seconds. */
export const Gauge: React.FC<{
  at: number;
  until?: number;
  value: string;
  label: string;
  accent?: string;
  size?: number;
}> = ({ at, until = 1e9, value, label, accent = C.amber, size = 150 }) => {
  const t = useSeconds();
  const p = prog(t, at, at + 0.45, ease.out);
  const o = prog(t, until, until + 0.3);
  if (p <= 0 || o >= 1) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        opacity: p * (1 - o),
        scale: interpolate(p, [0, 1], [0.85, 1]),
      }}
    >
      <div
        style={{
          fontFamily: headFont,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1,
          color: accent,
          WebkitTextStroke: "8px rgba(0,0,0,0.5)",
          paintOrder: "stroke fill",
          textShadow: `0 0 40px ${accent}77, 0 8px 30px rgba(0,0,0,0.6)`,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 8,
          fontFamily: bodyFont,
          fontWeight: 700,
          fontSize: 44,
          color: C.ink,
          textShadow: "0 4px 20px rgba(0,0,0,0.8)",
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reactor pressure vessel rig (shared by S12 Control and S13 Scram)
// ---------------------------------------------------------------------------
export const RPV = { r: 2.285, wall: 0.2, bottomY: 1.2, topY: 9.2, coreY0: 2.2, coreH: 3.7, pitch: 0.236 };

/** 163 assembly centres on a hex lattice (closest to the axis). */
export const coreLattice = () => {
  const pts: [number, number][] = [];
  const p = RPV.pitch;
  for (let q = -8; q <= 8; q++) {
    for (let r = -8; r <= 8; r++) {
      const x = p * (q + r / 2);
      const z = p * (r * Math.sqrt(3)) / 2;
      pts.push([x, z]);
    }
  }
  pts.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
  return pts.slice(0, 163);
};

const CUT_START = Math.PI * 0.32;
const CUT_LEN = Math.PI * 2 - Math.PI * 0.64;

export const VesselRig: React.FC<{
  /** 0 = rods fully withdrawn above the core, 1 = fully inserted */
  insert: number;
  /** 0..1 reactor power: drives the core's glow */
  power: number;
  /** 0..1 red alarm beacon */
  alarm?: number;
  t: number;
}> = ({ insert, power, alarm = 0, t }) => {
  const steel = useSteel("#aeb4bb", 0.36, [3, 3]);
  const darkSteel = useSteel("#6c737b", 0.45, [2, 2]);
  const glow = useGlowTex();
  const lattice = useMemo(coreLattice, []);
  // 121 rod clusters/drives: every assembly except the outermost 42
  const rodPts = useMemo(() => lattice.slice(0, 121), [lattice]);

  const coreGeo = useMemo(
    () =>
      mergeGeometries(
        lattice.map(([x, z]) => {
          const g = new THREE.CylinderGeometry(RPV.pitch * 0.49, RPV.pitch * 0.49, RPV.coreH, 6);
          g.rotateY(Math.PI / 6);
          g.translate(x, RPV.coreY0 + RPV.coreH / 2, z);
          return g;
        }),
      ),
    [lattice],
  );
  const rodGeo = useMemo(
    () =>
      mergeGeometries(
        rodPts.flatMap(([x, z]) => {
          const absorber = new THREE.CylinderGeometry(0.045, 0.045, RPV.coreH, 8);
          absorber.translate(x, RPV.coreH / 2, z);
          const drive = new THREE.CylinderGeometry(0.018, 0.018, 7.5, 6);
          drive.translate(x, RPV.coreH + 3.75, z);
          return [absorber, drive];
        }),
      ),
    [rodPts],
  );
  const crdmGeo = useMemo(
    () =>
      mergeGeometries(
        rodPts.map(([x, z]) => {
          const g = new THREE.CylinderGeometry(0.075, 0.075, 3.6, 10);
          g.translate(x * 1.08, RPV.topY + 1.25 + 1.8, z * 1.08);
          return g;
        }),
      ),
    [rodPts],
  );

  const coreMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#46505c", metalness: 0.7, roughness: 0.35, emissive: "#2f8dff" }),
    [],
  );
  coreMat.emissiveIntensity = 0.15 + power * 1.8;
  const rodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1d2127", metalness: 0.8, roughness: 0.4 }), []);

  // Rods: withdrawn = bottom of absorber sits just above the core top
  const rodY = RPV.coreY0 + (1 - insert) * (RPV.coreH + 0.15);
  const beacon = alarm * (0.55 + 0.45 * Math.sin(t * 9));

  return (
    <group>
      {/* Cylindrical shell, front cut away, with visible wall thickness */}
      <mesh material={steel} position={[0, (RPV.bottomY + RPV.topY) / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[RPV.r, RPV.r, RPV.topY - RPV.bottomY, 96, 1, true, CUT_START, CUT_LEN]} />
      </mesh>
      <mesh material={darkSteel} position={[0, (RPV.bottomY + RPV.topY) / 2, 0]}>
        <cylinderGeometry args={[RPV.r - RPV.wall, RPV.r - RPV.wall, RPV.topY - RPV.bottomY, 96, 1, true, CUT_START, CUT_LEN]} />
      </mesh>
      {[CUT_START, CUT_START + CUT_LEN].map((a, i) => (
        <mesh
          key={i}
          material={steel}
          position={[Math.sin(a) * (RPV.r - RPV.wall / 2), (RPV.bottomY + RPV.topY) / 2, Math.cos(a) * (RPV.r - RPV.wall / 2)]}
          rotation={[0, a, 0]}
        >
          <boxGeometry args={[0.02, RPV.topY - RPV.bottomY, RPV.wall]} />
        </mesh>
      ))}
      {/* Bottom head */}
      <mesh material={steel} position={[0, RPV.bottomY, 0]} scale={[1, 0.62, 1]}>
        <sphereGeometry args={[RPV.r, 96, 32, Math.PI / 2 + CUT_START, CUT_LEN, Math.PI / 2, Math.PI / 2]} />
      </mesh>
      {/* Top head + flange */}
      <mesh material={steel} position={[0, RPV.topY + 0.35, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[RPV.r, 96, 32, Math.PI / 2 + CUT_START, CUT_LEN, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={darkSteel} position={[0, RPV.topY + 0.17, 0]}>
        <cylinderGeometry args={[RPV.r + 0.32, RPV.r + 0.32, 0.36, 96, 1, false, CUT_START, CUT_LEN]} />
      </mesh>
      {/* Control-rod drive housings on the head */}
      <mesh geometry={crdmGeo} material={steel} castShadow />

      {/* Core: 163 hexagonal fuel assemblies, Cherenkov-blue glow with power */}
      <mesh geometry={coreGeo} material={coreMat} />
      <pointLight position={[0, RPV.coreY0 + RPV.coreH / 2, 0.5]} intensity={power * 40} distance={9} decay={2} color="#4aa8ff" />
      <Glow tex={glow} at={[0, RPV.coreY0 + RPV.coreH / 2, 1.2]} size={5.5} color="#3f8fff" opacity={power * 0.35} />

      {/* Absorber rods + drive shafts (move together) */}
      <mesh geometry={rodGeo} material={rodMat} position={[0, rodY, 0]} />

      {/* Alarm beacon */}
      {alarm > 0 ? (
        <>
          <pointLight
            position={[Math.sin(t * 6) * 4, RPV.topY + 4, Math.cos(t * 6) * 4]}
            intensity={beacon * 60}
            distance={18}
            decay={2}
            color="#ff2a1a"
          />
          <Glow tex={glow} at={[2.6, RPV.topY + 4.2, 1.5]} size={1.4} color="#ff3b2a" opacity={beacon} />
        </>
      ) : null}
    </group>
  );
};

/** Live power trace (2D, SVG) drawn up to time t. */
export const PowerGraph: React.FC<{ t: number; from: number; power: (tt: number) => number; label: string; opacity: number }> = ({
  t,
  from,
  power,
  label,
  opacity,
}) => {
  const W = 760;
  const H = 230;
  const span = 8;
  const pts: string[] = [];
  for (let k = 0; k <= 120; k++) {
    const tt = from + (k / 120) * span;
    if (tt > t) break;
    pts.push(`${(k / 120) * W},${H - power(tt) * (H - 20) - 10}`);
  }
  const last = pts[pts.length - 1]?.split(",").map(Number);
  return (
    <div
      style={{
        opacity,
        background: C.panel,
        border: `2px solid ${C.panelBorder}`,
        borderRadius: 28,
        padding: "22px 30px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 36, color: C.ink, marginBottom: 8 }}>{label}</div>
      <svg width={W} height={H}>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
        ))}
        <polyline points={pts.join(" ")} fill="none" stroke={C.amber} strokeWidth={7} strokeLinejoin="round" />
        {last ? <circle cx={last[0]} cy={last[1]} r={11} fill={C.amber} style={{ filter: `drop-shadow(0 0 10px ${C.amber})` }} /> : null}
      </svg>
    </div>
  );
};

export const fade = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
