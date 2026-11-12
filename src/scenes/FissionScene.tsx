import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { CameraRig, Env } from "../three/Env";
import { softSprite } from "../three/textures";
import { Chip, Flash, Pop } from "../ui";
import { C, bodyFont } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Scene-local timing
export const HIT = 124;
export const SPLIT = 136;
const NEUTRON_IN = 62;

const N_PROTON = 92;
const N_TOTAL = 235;
const R_NUC = 0.11;
const PACK_R = 0.66;

const START: [number, number, number] = [-4.2, 1.9, 0.9];
const IMPACT: [number, number, number] = [-0.62, 0.08, 0.05];
const OUT_DIRS: [number, number, number][] = [
  [0.25, 0.95, 0.3],
  [0.3, -0.92, 0.35],
  [-0.15, 0.1, 1],
];

const lerp3 = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const norm = (v: readonly number[]) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l] as const;
};

const Glow: React.FC<{
  tex: THREE.Texture;
  position: [number, number, number];
  size: number;
  color: string;
  opacity: number;
}> = ({ tex, position, size, color, opacity }) => (
  <sprite position={position} scale={[size, size, 1]}>
    <spriteMaterial
      map={tex}
      color={color}
      transparent
      opacity={opacity}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  </sprite>
);

/** A neutron with a glowing comet trail. `pathAt(f)` gives its position at frame f. */
const Neutron: React.FC<{
  frame: number;
  tex: THREE.Texture;
  pathAt: (f: number) => [number, number, number];
}> = ({ frame, tex, pathAt }) => (
  <group>
    {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
      <Glow
        key={k}
        tex={tex}
        position={pathAt(frame - k * 0.8)}
        size={0.5 - k * 0.04}
        color={C.cyan}
        opacity={0.5 - k * 0.055}
      />
    ))}
    <mesh position={pathAt(frame)}>
      <sphereGeometry args={[R_NUC, 32, 16]} />
      <meshPhysicalMaterial
        color="#bff6ff"
        emissive={C.cyan}
        emissiveIntensity={2.2}
        roughness={0.2}
        clearcoat={1}
      />
    </mesh>
  </group>
);

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const glowTex = useMemo(() => softSprite("rgba(255,255,255,1)"), []);

  const nucleons = useMemo(() => {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const items = new Array(N_TOTAL).fill(0).map((_, i) => {
      const r = PACK_R * Math.cbrt((i + 0.5) / N_TOTAL);
      const y = 1 - (2 * (i + 0.5)) / N_TOTAL;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i * 7.3;
      const j = (k: string) => (random(`${k}${i}`) - 0.5) * 0.05;
      return {
        p: [Math.cos(th) * rad * r + j("x"), y * r + j("y"), Math.sin(th) * rad * r + j("z")] as const,
        proton: false,
      };
    });
    const order = items.map((_, i) => i).sort((a, b) => random(`o${a}`) - random(`o${b}`));
    order.slice(0, N_PROTON).forEach((i) => (items[i].proton = true));
    return items;
  }, []);

  const protonMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: C.proton, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 }),
    [],
  );
  const neutronMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: C.neutron,
        roughness: 0.3,
        metalness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
      }),
    [],
  );
  const sphere = useMemo(() => new THREE.SphereGeometry(R_NUC, 32, 16), []);

  const stars = useMemo(() => {
    const pos = new Float32Array(1400 * 3);
    for (let i = 0; i < 1400; i++) {
      const v = norm([random(`sx${i}`) - 0.5, random(`sy${i}`) - 0.5, random(`sz${i}`) - 0.5]);
      const d = 18 + random(`sd${i}`) * 20;
      pos.set([v[0] * d, v[1] * d, v[2] * d], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const stretch = interpolate(frame, [HIT, SPLIT], [0, 1], { ...clamp, easing: Easing.bezier(0.5, 0, 0.9, 0.6) });
  const relax = interpolate(frame, [SPLIT, SPLIT + 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const elong = stretch * (1 - relax);
  const sep =
    frame < SPLIT ? 0 : 1.05 * Easing.out(Easing.cubic)(Math.min(1, (frame - SPLIT) / 60)) + (frame - SPLIT) * 0.002;
  const wobble =
    1 + Math.sin(frame * 0.35) * 0.012 + (frame > HIT - 20 && frame < HIT ? Math.sin(frame * 1.7) * 0.02 : 0);
  const halfSpin = frame < SPLIT ? 0 : (frame - SPLIT) * 0.012;

  const flash = interpolate(frame, [SPLIT - 1, SPLIT + 2, SPLIT + 26], [0, 1, 0], clamp);
  const heat = interpolate(frame, [SPLIT, SPLIT + 8, SPLIT + 80], [0, 1, 0.35], clamp);

  const inPath = (f: number) =>
    lerp3(START, IMPACT, interpolate(f, [NEUTRON_IN, HIT], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }));

  const orbit = interpolate(frame, [0, 216], [-0.35, 0.35]);
  const shake = frame > SPLIT && frame < SPLIT + 16 ? (16 - (frame - SPLIT)) / 16 : 0;
  const dist = interpolate(frame, [0, HIT, 216], [5.6, 4.6, 6.4], { ...clamp, easing: Easing.inOut(Easing.cubic) });

  return (
    <>
      <Env mode="studio" background="#03050a" envIntensity={0.55} exposure={1.05} />
      <CameraRig
        fov={34}
        position={[
          Math.sin(orbit) * dist + Math.sin(frame * 3.1) * 0.06 * shake,
          0.7 + Math.cos(frame * 2.7) * 0.06 * shake,
          Math.cos(orbit) * dist,
        ]}
        target={[0, 0, 0]}
      />
      <directionalLight position={[3, 4, 5]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-4, -1, -3]} intensity={1.4} color="#5fd3ff" />
      <pointLight position={[0, 0, 0]} intensity={60 * heat} distance={8} decay={2} color="#ff9a3c" />

      <points geometry={stars}>
        <pointsMaterial size={0.06} color="#9fb8ff" transparent opacity={0.6} sizeAttenuation depthWrite={false} />
      </points>

      {/* Split axis tilted near-vertical so fragments stay inside the 9:16 frame */}
      <group rotation={[0, 0, 1.15]} position={[0, -0.25, 0]}>
      {/* U-235 nucleus splitting into two fragments */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * sep, side * sep * 0.12, 0]} rotation={[0, 0, side * halfSpin]}>
          {nucleons.map((n, i) => {
            if ((n.p[0] < 0 ? -1 : 1) !== side) return null;
            const x = n.p[0];
            const neck = Math.exp(-((x / 0.32) ** 2));
            const yzK = (1 - 0.12 * elong) * (1 - 0.45 * elong * neck);
            return (
              <mesh
                key={i}
                geometry={sphere}
                material={n.proton ? protonMat : neutronMat}
                position={[
                  x * (1 + 0.55 * elong) * wobble + side * 0.08 * elong,
                  n.p[1] * yzK * wobble,
                  n.p[2] * yzK * wobble,
                ]}
              />
            );
          })}
        </group>
      ))}

      {[-1, 1].map((side) => (
        <Glow
          key={side}
          tex={glowTex}
          position={[side * sep, side * sep * 0.12, 0]}
          size={2.6}
          color="#ff7a2a"
          opacity={heat * 0.55}
        />
      ))}
      <Glow tex={glowTex} position={[0, 0, 0.2]} size={1 + flash * 9} color="#fff1d6" opacity={flash} />

      {frame >= NEUTRON_IN && frame < HIT + 2 ? <Neutron frame={frame} tex={glowTex} pathAt={inPath} /> : null}

      {frame >= SPLIT
        ? OUT_DIRS.map((d, k) => {
            const n = norm(d);
            const path = (f: number): [number, number, number] => {
              const s = Math.max(0, f - SPLIT) * 0.075;
              return [n[0] * s, n[1] * s, n[2] * s];
            };
            return <Neutron key={k} frame={frame} tex={glowTex} pathAt={path} />;
          })
        : null}
      </group>
    </>
  );
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span
    style={{
      display: "inline-block",
      width: 26,
      height: 26,
      borderRadius: 99,
      background: color,
      boxShadow: `0 0 14px ${color}`,
      marginRight: 10,
      verticalAlign: "middle",
    }}
  />
);

export const FissionScene: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: true }} camera={{ fov: 34, near: 0.05, far: 100 }}>
        <World />
      </ThreeCanvas>
      <Flash at={SPLIT + 1} color="#ffd59a" len={18} />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 220, gap: 22 }}>
        <Chip at={12} until={SPLIT - 6} accent={C.amber} size={46}>
          ইউরেনিয়াম-২৩৫ নিউক্লিয়াস
        </Chip>
        <div
          style={{
            display: "flex",
            gap: 30,
            fontFamily: bodyFont,
            fontWeight: 700,
            fontSize: 36,
            color: C.ink,
            opacity: interpolate(frame, [24, 36, SPLIT - 6, SPLIT], [0, 1, 1, 0], clamp),
          }}
        >
          <span>
            <Dot color={C.proton} />
            ৯২ প্রোটন
          </span>
          <span>
            <Dot color={C.neutron} />
            ১৪৩ নিউট্রন
          </span>
          <span>
            <Dot color={C.cyan} />
            আগত নিউট্রন
          </span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200 }}>
        <Pop at={SPLIT + 3} size={170} color={C.amber} glow>
          ফিশন!
        </Pop>
        <div style={{ display: "flex", gap: 18, marginTop: 18 }}>
          <Chip at={SPLIT + 16} accent={C.orange} size={40}>
            প্রচণ্ড তাপ
          </Chip>
          <Chip at={SPLIT + 24} accent={C.cyan} size={40}>
            + ৩টি নতুন নিউট্রন
          </Chip>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
