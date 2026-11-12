/**
 * S19: Bicycle dynamo on a village road at night (VO "dynamo"). Units: metres.
 * A 26" wheel (Ø ~0.66 m) turns; a bottle dynamo's roller rides on the tyre sidewall and
 * the headlamp flickers on as the word "জ্বলে" is spoken, throwing a warm pool on the road.
 * Low tracking camera rolls along with the bicycle.
 */
import { useMemo } from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HDRI, Lighting, usePBR } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { softSprite } from "../three/textures";
import { C } from "../theme";
import { Chip } from "../ui";

export const S19_DURATION = shotDuration("dynamo", 0.4);

const T = {
  on: wordAt("dynamo", "জ্বলে"),
  label: wordAt("dynamo", "সাইকেলের"),
};

const WHEEL_R = 0.33;
const SPEED = 2.2; // m/s, gentle village riding speed

const Wheel: React.FC<{ angle: number; rubber: THREE.Material; steel: THREE.Material }> = ({ angle, rubber, steel }) => {
  const spokes = useMemo(() => {
    // 32 spokes, alternating sides of the hub, merged into one geometry
    const geos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const side = i % 2 === 0 ? 0.025 : -0.025;
      const g = new THREE.CylinderGeometry(0.0012, 0.0012, WHEEL_R - 0.03, 4);
      g.translate(0, (WHEEL_R - 0.03) / 2, 0);
      const m = new THREE.Matrix4().makeRotationZ(a);
      m.premultiply(new THREE.Matrix4().makeTranslation(0, 0, 0));
      g.applyMatrix4(m);
      g.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0, side * 0.4));
      geos.push(g);
    }
    const merged = new THREE.BufferGeometry();
    const pos: number[] = [];
    const idx: number[] = [];
    let base = 0;
    geos.forEach((g) => {
      const p = g.attributes.position.array as ArrayLike<number>;
      for (let i = 0; i < p.length; i++) pos.push(p[i]);
      const ix = g.index!.array;
      for (let i = 0; i < ix.length; i++) idx.push(ix[i] + base);
      base += g.attributes.position.count;
    });
    merged.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    merged.setIndex(idx);
    merged.computeVertexNormals();
    return merged;
  }, []);
  return (
    <group rotation={[0, 0, -angle]}>
      <mesh material={rubber} castShadow>
        <torusGeometry args={[WHEEL_R - 0.018, 0.019, 16, 96]} />
      </mesh>
      <mesh material={steel}>
        <torusGeometry args={[WHEEL_R - 0.042, 0.008, 8, 96]} />
      </mesh>
      <mesh geometry={spokes} material={steel} />
      <mesh material={steel} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 24]} />
      </mesh>
    </group>
  );
};

const World: React.FC = () => {
  const t = useSeconds();
  const dirt = usePBR("rock_boulder_dry", [40, 6]);
  const steelTex = usePBR("metal_plate", [1, 1]);
  const glow = useMemo(() => softSprite("rgba(255,255,255,1)"), []);
  const pool = useMemo(() => softSprite("rgba(255,214,150,1)"), []);

  const rubber = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#151515", roughness: 0.82, metalness: 0 }), []);
  const steel = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#c4c9cf", metalness: 1, roughness: 0.3, normalMap: steelTex.normalMap, normalScale: new THREE.Vector2(0.1, 0.1) }),
    [steelTex],
  );
  const paint = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#1d3a5c", metalness: 0.4, roughness: 0.35, clearcoat: 0.8 }), []);
  const road = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#6e5b45",
        map: dirt.map,
        normalMap: dirt.normalMap,
        roughnessMap: dirt.roughnessMap,
        roughness: 1,
      }),
    [dirt],
  );

  // Village silhouettes: bushes, banana/betel trees and a few distant warm windows
  const bushes = useMemo(
    () =>
      new Array(70).fill(0).map((_, i) => ({
        x: (random(`bx${i}`) > 0.5 ? 1 : -1) * (2.2 + random(`bd${i}`) * 6),
        z: -random(`bz${i}`) * 60 + 6,
        s: 0.6 + random(`bs${i}`) * 1.8,
      })),
    [],
  );
  const windows = useMemo(
    () => new Array(9).fill(0).map((_, i) => ({ x: -18 + random(`wx${i}`) * 36, z: -40 - random(`wz${i}`) * 30, y: 1 + random(`wy${i}`) })),
    [],
  );

  const travel = t * SPEED;
  const angle = travel / WHEEL_R;
  const bikeZ = -travel;

  // Lamp: off → flickers in with the wheel → steady
  const on = prog(t, T.on, T.on + 0.5, ease.out);
  const flicker = on < 1 ? 0.55 + 0.45 * Math.abs(Math.sin(angle * 3.1)) : 1;
  const lamp = on * flicker;

  // Low camera beside the front wheel, tracking with the bike
  const hh = handheld(t, 0.006, 3);
  const k = prog(t, 0, S19_DURATION, ease.inOut);
  const camPos: [number, number, number] = [mix(0.75, 0.62, k) + hh[0], 0.32 + hh[1], bikeZ + mix(0.55, 0.15, k) + hh[2]];
  const target: [number, number, number] = [0.02, mix(0.42, 0.5, k), bikeZ - mix(0.1, 0.35, k)];
  const focus = Math.hypot(camPos[0] - target[0], camPos[1] - target[1], camPos[2] - target[2]);

  return (
    <>
      <Lighting hdri={HDRI.dusk} intensity={0.06} background blur={0.15} rotation={3.6} />
      <fog attach="fog" args={["#0b1020", 6, 55]} />
      <directionalLight position={[-8, 12, 6]} intensity={0.25} color="#8aa6ff" />
      <pointLight position={[0.05, 0.45, bikeZ - 0.9]} intensity={lamp * 6} distance={7} decay={2} color="#ffd59a" />

      <Lens mm={28} position={camPos} target={target} near={0.02} far={300} />

      {/* Village dirt road + grassy verges */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -20]} material={road} receiveShadow>
        <planeGeometry args={[3.2, 120]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, -20]}>
        <planeGeometry args={[60, 120]} />
        <meshStandardMaterial color="#1c2a16" roughness={1} />
      </mesh>
      {/* Warm light pool thrown on the road ahead */}
      <mesh rotation-x={-Math.PI / 2} position={[0.05, 0.005, bikeZ - 2.1]} scale={[1.2, 2.6, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={pool} transparent opacity={lamp * 0.75} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      {bushes.map((b, i) => (
        <mesh key={i} position={[b.x, b.s * 0.5, b.z]} scale={[b.s, b.s * 0.8, b.s]}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color="#0f1a0d" roughness={1} />
        </mesh>
      ))}
      {windows.map((w, i) => (
        <sprite key={i} position={[w.x, w.y, w.z]} scale={[0.9, 0.9, 1]}>
          <spriteMaterial map={glow} color="#ffb768" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}

      {/* Front of the bicycle */}
      <group position={[0, WHEEL_R, bikeZ]} rotation={[0, Math.PI / 2, 0]}>
        <Wheel angle={angle} rubber={rubber} steel={steel} />
        {/* fork blades */}
        {[-1, 1].map((s) => (
          <mesh key={s} material={paint} position={[0.02, 0.24, s * 0.05]} rotation={[0, 0, -0.18]}>
            <cylinderGeometry args={[0.011, 0.014, 0.5, 16]} />
          </mesh>
        ))}
        {/* bottle dynamo on the fork, roller on the tyre sidewall */}
        <group position={[0.12, 0.27, 0.06]} rotation={[0, 0, -0.42]}>
          <mesh material={steel}>
            <cylinderGeometry args={[0.018, 0.018, 0.075, 24]} />
          </mesh>
          <mesh material={rubber} position={[0, -0.05, 0]} rotation={[0, angle * 9, 0]}>
            <cylinderGeometry args={[0.009, 0.011, 0.025, 16]} />
          </mesh>
        </group>
        {/* headlamp on the fork crown */}
        <group position={[0.18, 0.5, 0]}>
          <mesh material={steel} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.03, 0.07, 32]} />
          </mesh>
          <mesh position={[0.036, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.03, 32]} />
            <meshStandardMaterial color="#fff2d6" emissive="#ffd28a" emissiveIntensity={lamp * 6} toneMapped={false} />
          </mesh>
        </group>
      </group>
      {/* lamp glare */}
      <sprite position={[0.0, 0.5 + WHEEL_R - 0.33 + 0.33, bikeZ - 0.2]} scale={[0.6, 0.6, 1]}>
        <spriteMaterial map={glow} color="#ffd59a" transparent opacity={lamp * 0.8} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>

      <PostFX focus={focus} focusRange={0.35} bokeh={5} bloom={0.9} bloomThreshold={0.75} />
    </>
  );
};

export const S19Dynamo: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#070a12">
        <World />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 260 }}>
        <Chip at={f(T.label)} accent={C.amber} size={48}>
          সাইকেলের ডায়নামো
        </Chip>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
