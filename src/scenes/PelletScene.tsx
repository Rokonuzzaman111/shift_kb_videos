import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CameraRig, Env } from "../three/Env";
import { noiseTexture } from "../three/textures";
import { Chip, Pop } from "../ui";
import { C } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const camEase = Easing.bezier(0.65, 0, 0.25, 1);

// Timing (scene-local frames)
const COAL_START = 80;
const PULL_START = 84;
const PULL_END = 178;

const PILE_CENTER: [number, number, number] = [0.75, 0, -1.9];
const PILE_R = 1.35;
const PILE_H = 1.25;
const ROCKS = 520;

/** Real fuel pellet proportions: chamfered cylinder with slightly dished ends. */
const pelletGeometry = () => {
  const pts = [
    [0, 0.006],
    [0.084, 0],
    [0.092, 0],
    [0.1, 0.008],
    [0.1, 0.242],
    [0.092, 0.25],
    [0.084, 0.25],
    [0, 0.244],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 128);
};

/** Irregular faceted lump of coal. */
const rockGeometry = (seed: number) => {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 2);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const k = 0.8 + random(`rock${seed}-${i}`) * 0.32;
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.8, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
};

const Pile: React.FC<{ frame: number }> = ({ frame }) => {
  const geos = useMemo(() => [0, 1, 2, 3].map(rockGeometry), []);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#101010",
        roughness: 0.5,
        metalness: 0.2,
        clearcoat: 0.25,
        clearcoatRoughness: 0.5,
        flatShading: true,
      }),
    [],
  );
  const rocks = useMemo(
    () =>
      new Array(ROCKS).fill(0).map((_, i) => {
        const r = PILE_R * Math.sqrt(random(`r${i}`));
        const a = random(`a${i}`) * Math.PI * 2;
        const hMax = PILE_H * (1 - r / PILE_R) ** 1.1;
        const y = hMax * Math.pow(random(`y${i}`), 0.5);
        const s = 0.05 + random(`s${i}`) * 0.08;
        return {
          pos: [PILE_CENTER[0] + Math.cos(a) * r, y + s * 0.6, PILE_CENTER[2] + Math.sin(a) * r] as const,
          s,
          rot: [random(`rx${i}`) * 6, random(`ry${i}`) * 6, random(`rz${i}`) * 6] as const,
          spin: (random(`sp${i}`) - 0.5) * 8,
          delay: COAL_START + (y / PILE_H) * 26 + random(`d${i}`) * 10,
          geo: i % 4,
        };
      }),
    [],
  );

  return (
    <group>
      {rocks.map((rk, i) => {
        const t = interpolate(frame, [rk.delay, rk.delay + 13], [0, 1], clamp);
        if (t <= 0) return null;
        const fall = 1 - t * t; // gravity: accelerate down
        return (
          <mesh
            key={i}
            geometry={geos[rk.geo]}
            material={mat}
            castShadow
            receiveShadow
            position={[rk.pos[0], rk.pos[1] + fall * 5, rk.pos[2]]}
            rotation={[rk.rot[0] + fall * rk.spin, rk.rot[1], rk.rot[2] + fall * rk.spin * 0.5]}
            scale={rk.s}
          />
        );
      })}
    </group>
  );
};

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const pellet = useMemo(pelletGeometry, []);
  const rough = useMemo(() => {
    const t = noiseTexture("pellet", 256, 90);
    t.repeat.set(3, 2);
    return t;
  }, []);

  const pull = interpolate(frame, [PULL_START, PULL_END], [0, 1], { ...clamp, easing: camEase });
  const push = interpolate(frame, [0, PULL_START], [0, 1], clamp);
  const orbit = interpolate(frame, [0, 200], [-0.18, 0.12]);

  // Macro framing → wide reveal
  const dist = interpolate(pull, [0, 1], [1.55 - push * 0.2, 7.6]);
  const camY = interpolate(pull, [0, 1], [0.5, 2.3]);
  const target: [number, number, number] = [
    interpolate(pull, [0, 1], [0, 0.55]),
    interpolate(pull, [0, 1], [0.1, 0.55]),
    interpolate(pull, [0, 1], [0, -1.3]),
  ];

  return (
    <>
      <Env mode="studio" background="#05070b" envIntensity={0.32} exposure={1.05} />
      <fog attach="fog" args={["#05070b", 7, 18]} />
      <CameraRig
        fov={30}
        position={[target[0] + Math.sin(orbit) * dist, camY, target[2] + Math.cos(orbit) * dist]}
        target={target}
      />

      {/* Key, rim and warm fill */}
      <spotLight
        position={[-2.2, 3.8, 2.4]}
        angle={0.55}
        penumbra={0.85}
        intensity={3.2}
        decay={0}
        color="#fff3e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[2.5, 2, -4]} intensity={1.6} color="#7fd8ff" />
      <pointLight position={[1.2, 0.5, 1.2]} intensity={0.7} decay={0} color="#ffb27a" />

      {/* Glossy dark table */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshPhysicalMaterial color="#0a0c10" roughness={0.3} metalness={0.3} clearcoat={0.7} clearcoatRoughness={0.25} />
      </mesh>

      {/* Uranium dioxide fuel pellet */}
      <mesh geometry={pellet} castShadow receiveShadow rotation-y={frame * 0.004}>
        <meshPhysicalMaterial
          color="#3a3b3c"
          metalness={0.62}
          roughness={0.4}
          roughnessMap={rough}
          bumpMap={rough}
          bumpScale={0.6}
          clearcoat={0.15}
        />
      </mesh>

      <Pile frame={frame} />
    </>
  );
};

export const PelletScene: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <ThreeCanvas width={width} height={height} shadows gl={{ antialias: true }} camera={{ fov: 30, near: 0.02, far: 100 }}>
        <World />
      </ThreeCanvas>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <Chip at={14} until={COAL_START - 4} accent={C.cyan}>
          ইউরেনিয়াম ফুয়েল পেলেট · ≈ ১ সেমি
        </Chip>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200, gap: 0 }}>
        <Pop at={COAL_START + 6} size={96}>
          ১টি পেলেট
        </Pop>
        <Pop at={COAL_START + 14} size={80} color={C.muted} style={{ margin: "-6px 0" }}>
          =
        </Pop>
        <Pop at={COAL_START + 22} size={132} color={C.amber} glow>
          ১ টন কয়লা
        </Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
