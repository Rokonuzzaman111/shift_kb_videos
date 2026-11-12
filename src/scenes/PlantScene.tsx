import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { CameraRig, Env } from "../three/Env";
import { fieldTexture, noiseTexture, softSprite } from "../three/textures";
import { Chip, Pop } from "../ui";
import { C, bodyFont } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const TOWER_H = 165;
const TOWERS: [number, number][] = [
  [-205, -250],
  [-75, -330],
  [75, -330],
  [205, -250],
];
const REACTORS: [number, number][] = [
  [-62, 10],
  [62, 10],
];

/** Hyperboloid natural-draft cooling tower profile. */
const towerGeometry = () => {
  const waist = 34;
  const yw = 122;
  const c = 96;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 40; i++) {
    const y = (i / 40) * TOWER_H;
    pts.push(new THREE.Vector2(waist * Math.sqrt(1 + ((y - yw) / c) ** 2), y));
  }
  return new THREE.LatheGeometry(pts, 96);
};

const concrete = (color: string, rough: THREE.Texture) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.02, bumpMap: rough, bumpScale: 0.4 });

const Steam: React.FC<{ frame: number; x: number; z: number; seed: number; tex: THREE.Texture }> = ({
  frame,
  x,
  z,
  seed,
  tex,
}) => {
  const N = 16;
  const L = 240;
  return (
    <group>
      {new Array(N).fill(0).map((_, k) => {
        const ph = (frame * 0.9 + (k * L) / N + seed * 37) % L;
        const life = ph / L;
        const s = 45 + ph * 0.7;
        const o = 0.3 * Math.min(1, ph / 25) * (1 - life) ** 1.4;
        return (
          <sprite
            key={k}
            position={[x + ph * 0.42 + Math.sin(k * 2.1) * 8, TOWER_H + 8 + ph * 0.75, z + Math.cos(k * 1.7) * 8]}
            scale={[s, s * 0.85, 1]}
          >
            <spriteMaterial map={tex} color="#f6efe6" transparent opacity={o} depthWrite={false} />
          </sprite>
        );
      })}
    </group>
  );
};

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const field = useMemo(() => {
    const t = fieldTexture();
    t.repeat.set(5, 5);
    return t;
  }, []);
  const rough = useMemo(() => noiseTexture("concrete", 256, 70), []);
  const tower = useMemo(towerGeometry, []);
  const steamTex = useMemo(() => softSprite("rgba(255,255,255,0.9)"), []);
  const towerMat = useMemo(() => {
    const m = concrete("#d3cec4", rough);
    m.side = THREE.DoubleSide;
    return m;
  }, [rough]);
  const domeMat = useMemo(() => concrete("#e6e3dc", rough), [rough]);
  const hallMat = useMemo(() => concrete("#c3cad1", rough), [rough]);

  const trees = useMemo(() => {
    const out: { p: [number, number, number]; s: number; c: string }[] = [];
    for (let i = 0; out.length < 420 && i < 4000; i++) {
      const x = (random(`tx${i}`) - 0.5) * 2200;
      const z = (random(`tz${i}`) - 0.5) * 2000 - 100;
      const onSite = Math.abs(x) < 360 && z > -440 && z < 210;
      const inRiver = z < -620 && z > -1300;
      if (onSite || inRiver) continue;
      const s = 7 + random(`ts${i}`) * 9;
      out.push({ p: [x, s * 0.8, z], s, c: random(`tc${i}`) > 0.5 ? "#2e4622" : "#3a5426" });
    }
    return out;
  }, []);

  const buildings = useMemo(
    () =>
      new Array(16).fill(0).map((_, i) => ({
        x: -300 + random(`bx${i}`) * 600,
        z: 60 + random(`bz${i}`) * 130,
        w: 18 + random(`bw${i}`) * 40,
        d: 14 + random(`bd${i}`) * 30,
        h: 8 + random(`bh${i}`) * 16,
      })),
    [],
  );

  const t = interpolate(frame, [0, 200], [0, 1], { ...clamp, easing: Easing.bezier(0.33, 0, 0.3, 1) });
  const ang = interpolate(t, [0, 1], [-0.42, -0.2]);
  const dist = interpolate(t, [0, 1], [1250, 1040]);
  const camY = interpolate(t, [0, 1], [520, 430]);
  const target: [number, number, number] = [0, 10, -190];

  return (
    <>
      <Env
        mode="sky"
        skyStops={[
          [0, "#24345a"],
          [0.45, "#7f7f95"],
          [0.78, "#e9a46b"],
          [1, "#f6c58c"],
        ]}
        envIntensity={0.7}
        exposure={1.0}
      />
      <fog attach="fog" args={["#d7a982", 500, 2300]} />
      <CameraRig
        fov={46}
        position={[Math.sin(ang) * dist, camY, -190 + Math.cos(ang) * dist]}
        target={target}
      />

      <hemisphereLight args={["#a9c6ff", "#5a4630", 0.7]} />
      <directionalLight
        position={[-480, 520, 160]}
        intensity={2.8}
        color="#ffc98f"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-camera-left={-500}
        shadow-camera-right={500}
        shadow-camera-top={500}
        shadow-camera-bottom={-500}
        shadow-camera-far={2000}
      />

      {/* Countryside */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[6000, 6000]} />
        <meshStandardMaterial map={field} roughness={1} />
      </mesh>
      {/* Site pad */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.3, -120]} receiveShadow>
        <planeGeometry args={[720, 660]} />
        <meshStandardMaterial color="#8d8b84" roughness={0.95} bumpMap={rough} />
      </mesh>
      {/* Roads */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.5, 140]} receiveShadow>
        <planeGeometry args={[720, 14]} />
        <meshStandardMaterial color="#3d3d3a" roughness={0.9} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.5, 400]} receiveShadow>
        <planeGeometry args={[14, 520]} />
        <meshStandardMaterial color="#3d3d3a" roughness={0.9} />
      </mesh>

      {/* Padma river */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.8, -960]} rotation-z={0.06}>
        <planeGeometry args={[7000, 640]} />
        <meshPhysicalMaterial color="#56707a" roughness={0.07} metalness={0.05} clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      {/* Sand bank */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.6, -620]} rotation-z={0.06}>
        <planeGeometry args={[7000, 70]} />
        <meshStandardMaterial color="#c9b48d" roughness={1} />
      </mesh>

      {/* Cooling towers */}
      {TOWERS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh geometry={tower} material={towerMat} castShadow receiveShadow />
          <mesh position={[0, TOWER_H, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[34 * Math.sqrt(1 + ((TOWER_H - 122) / 96) ** 2), 1.4, 8, 96]} />
            <meshStandardMaterial color="#b9b3a8" roughness={0.9} />
          </mesh>
          <mesh position={[0, 4, 0]}>
            <cylinderGeometry args={[57, 58, 8, 96, 1, true]} />
            <meshStandardMaterial color="#6f6a62" roughness={1} side={THREE.DoubleSide} />
          </mesh>
          <Steam frame={frame} x={0} z={0} seed={i} tex={steamTex} />
        </group>
      ))}

      {/* Reactor buildings (double containment + dome) */}
      {REACTORS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh material={domeMat} position={[0, 24, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[25, 25, 48, 96]} />
          </mesh>
          <mesh material={domeMat} position={[0, 48, 0]} castShadow>
            <sphereGeometry args={[25, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 47.5, 0]}>
            <cylinderGeometry args={[25.4, 25.4, 2, 96, 1, true]} />
            <meshStandardMaterial color="#9aa1a8" roughness={0.6} />
          </mesh>
          {/* Auxiliary block */}
          <mesh material={hallMat} position={[0, 14, 38]} castShadow receiveShadow>
            <boxGeometry args={[46, 28, 26]} />
          </mesh>
          {/* Turbine hall */}
          <mesh material={hallMat} position={[0, 17, -66]} castShadow receiveShadow>
            <boxGeometry args={[46, 34, 80]} />
          </mesh>
          <mesh position={[0, 34.5, -66]} castShadow>
            <boxGeometry args={[47, 1.5, 81]} />
            <meshStandardMaterial color="#4f6478" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Ancillary buildings */}
      {buildings.map((b, i) => (
        <mesh key={i} material={hallMat} position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
        </mesh>
      ))}

      {/* Trees */}
      {trees.map((tr, i) => (
        <mesh key={i} position={tr.p} scale={[tr.s, tr.s * 0.9, tr.s]} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={tr.c} roughness={1} flatShading />
        </mesh>
      ))}
    </>
  );
};

const Pin: React.FC = () => (
  <svg width="34" height="44" viewBox="0 0 24 32">
    <path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 32 12 32s12-11.2 12-20.1C24 5.3 18.6 0 12 0z" fill={C.orange} />
    <circle cx="12" cy="12" r="4.6" fill="#fff" />
  </svg>
);

export const PlantScene: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }} camera={{ fov: 42, near: 1, far: 8000 }}>
        <World />
      </ThreeCanvas>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 190 }}>
        <Chip at={8} accent={C.orange} size={40} style={{ gap: 14 }}>
          <Pin />
          <span>
            ঈশ্বরদী, পাবনা <span style={{ color: C.muted, fontFamily: bodyFont }}>· পদ্মার পাড়</span>
          </span>
        </Chip>
        <div style={{ height: 34 }} />
        <Pop at={62} size={150} color={C.amber} glow>
          রূপপুর
        </Pop>
        <Pop at={70} size={62}>
          পারমাণবিক বিদ্যুৎকেন্দ্র
        </Pop>
        <div style={{ display: "flex", gap: 20, marginTop: 30 }}>
          <Chip at={86} accent={C.cyan} size={40}>
            ২টি ইউনিট
          </Chip>
          <Chip at={94} accent={C.amber} size={40}>
            ২৪০০ মেগাওয়াট
          </Chip>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
