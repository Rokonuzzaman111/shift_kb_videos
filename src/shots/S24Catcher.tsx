/**
 * S24: Core catcher (VO "catcher"). Units: metres.
 * The VVER-1200 core catcher (~200 t at Rooppur) is a crucible-shaped steel vessel installed
 * in the concrete pit below the reactor pressure vessel, filled with sacrificial ceramic/oxide
 * material. Camera pushes down from the vessel's bottom head into the pit to reveal it.
 *
 * Beats:
 *  start        Vessel bottom head (Ø 4.57 m) in its concrete pit, camera descends
 *  "চুল্লির"    Chip "চুল্লির ঠিক নিচে"
 *  "কোর"        Pop "কোর ক্যাচার", catcher rim lights up
 *  "বিশাল"      Chip "~২০০ টন ইস্পাতের পাত্র"
 */
import { useMemo } from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HDRI, Lighting, usePBR } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix, mix3, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { softSprite } from "../three/textures";
import { C } from "../theme";
import { Chip, Pop } from "../ui";

export const S24_DURATION = shotDuration("catcher");

const T = {
  below: wordAt("catcher", "চুল্লির"),
  name: wordAt("catcher", "কোর"),
  mass: wordAt("catcher", "বিশাল"),
};

const VESSEL_Y = 9; // bottom of the vessel's lower head
const CATCHER_TOP = 3.2;

/** Crucible: wide cylindrical upper part, conical lower part (lathe, steel wall ~0.3 m). */
const crucibleProfile = () =>
  [
    [0, 0],
    [1.6, 0],
    [3.6, 1.6],
    [3.6, CATCHER_TOP],
    [3.95, CATCHER_TOP],
    [3.95, 1.5],
    [1.8, -0.3],
    [0, -0.3],
  ].map(([x, y]) => new THREE.Vector2(x, y));

const World: React.FC = () => {
  const t = useSeconds();
  const concrete = usePBR("concrete_wall_008", [3, 3]);
  const steelTex = usePBR("metal_plate", [3, 1]);
  const rock = usePBR("rock_boulder_dry", [2, 2]);
  const glow = useMemo(() => softSprite("rgba(255,255,255,1)"), []);

  const wall = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#a39e94", map: concrete.map, normalMap: concrete.normalMap, roughnessMap: concrete.roughnessMap, side: THREE.BackSide }),
    [concrete],
  );
  const steel = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#7d858d",
        metalness: 1,
        roughness: 0.38,
        normalMap: steelTex.normalMap,
        normalScale: new THREE.Vector2(0.3, 0.3),
        emissive: "#ff6a1a",
        emissiveIntensity: 0,
      }),
    [steelTex],
  );
  const vesselMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#a2aab2", metalness: 1, roughness: 0.25, normalMap: steelTex.normalMap, normalScale: new THREE.Vector2(0.15, 0.15) }),
    [steelTex],
  );
  const filler = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#5a4636", map: rock.map, normalMap: rock.normalMap, roughness: 0.95 }),
    [rock],
  );
  const crucible = useMemo(() => new THREE.LatheGeometry(crucibleProfile(), 128), []);
  // Sacrificial material blocks stacked inside the crucible
  const blocks = useMemo(
    () =>
      new Array(120).fill(0).map((_, i) => {
        const ring = Math.floor(i / 24);
        const a = ((i % 24) / 24) * Math.PI * 2 + ring * 0.13;
        const r = 0.8 + ring * 0.55;
        return { p: [Math.cos(a) * r, 1.0 + ring * 0.38 + random(`by${i}`) * 0.05, Math.sin(a) * r] as [number, number, number], a };
      }),
    [],
  );

  const named = prog(t, T.name, T.name + 0.6, ease.out);
  steel.emissiveIntensity = named * 0.25;

  // Camera: from beside the vessel head, descend into the pit, ending looking down into the catcher
  const k = prog(t, 0, S24_DURATION, ease.cine);
  const hh = handheld(t, 0.03, 11);
  const pos = mix3([7.5, 12.5, 9], [5.2, 6.4, 6.2], k);
  const target = mix3([0, VESSEL_Y + 0.6, 0], [0, 1.2, 0], Math.pow(k, 0.9));
  const focus = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);

  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={0.4} rotation={2.1} />
      <spotLight position={[3, 16, 6]} angle={0.7} penumbra={0.9} intensity={60} distance={40} decay={1.6} color="#fff0de" castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 2.2, 0]} intensity={named * 30} distance={9} decay={2} color="#ff8a3a" />
      <pointLight position={[-5, 4, -4]} intensity={6} distance={14} decay={2} color="#6fbfff" />

      <Lens mm={mix(28, 24, k)} position={[pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]]} target={target} near={0.05} far={300} />

      {/* Concrete reactor pit (open toward the camera) */}
      <mesh material={wall} position={[0, 7, 0]}>
        <cylinderGeometry args={[6.5, 6.5, 18, 96, 1, true, Math.PI * 0.35, Math.PI * 1.3]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.32, 0]}>
        <circleGeometry args={[6.5, 64]} />
        <meshStandardMaterial color="#8f8a80" map={concrete.map} normalMap={concrete.normalMap} roughness={0.95} />
      </mesh>

      {/* Reactor pressure vessel: bottom head and lower shell */}
      <group position={[0, VESSEL_Y + 2.3, 0]}>
        <mesh material={vesselMat} position={[0, 3, 0]}>
          <cylinderGeometry args={[2.3, 2.3, 6, 64]} />
        </mesh>
        <mesh material={vesselMat} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[2.3, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
      {/* Cone guiding plate between vessel and catcher */}
      <mesh material={steel} position={[0, 5.4, 0]}>
        <cylinderGeometry args={[3.9, 1.4, 1.6, 64, 1, true]} />
      </mesh>

      {/* Core catcher crucible + sacrificial filler */}
      <mesh geometry={crucible} material={steel} castShadow receiveShadow />
      {blocks.map((b, i) => (
        <mesh key={i} material={filler} position={b.p} rotation={[0, -b.a, 0]}>
          <boxGeometry args={[0.45, 0.34, 0.32]} />
        </mesh>
      ))}
      <sprite position={[0, 2.4, 0]} scale={[7, 7, 1]}>
        <spriteMaterial map={glow} color="#ff7a2a" transparent opacity={named * 0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>

      <PostFX focus={focus} focusRange={4} bokeh={2.5} bloom={0.6} bloomThreshold={0.82} />
    </>
  );
};

export const S24Catcher: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#07080b">
        <World />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 220, gap: 14 }}>
        <Chip at={f(T.below)} until={f(T.name - 0.2)} accent={C.cyan} size={42}>
          চুল্লির ঠিক নিচে
        </Chip>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210, gap: 16 }}>
        <Pop at={f(T.name)} size={136} color={C.amber} glow>
          কোর ক্যাচার
        </Pop>
        <Chip at={f(T.mass)} accent={C.orange} size={40}>
          ~২০০ টন ইস্পাতের পাত্র
        </Chip>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
