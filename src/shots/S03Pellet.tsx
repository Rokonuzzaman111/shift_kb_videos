/**
 * S03 + S04: Pellet macro → 1 ton of coal (one continuous take, ~8.8s), timed to public/vo/pellet.json.
 * Units: 1 = 1 mm. Real pellet: Ø7.6 mm, Ø1.2 mm central hole, ~10 mm tall, chamfered, dished ends.
 *
 *  0.0 to 2.8  100 mm macro: stainless tweezers hold the pellet. Rack focus from the tweezer tip to the pellet face.
 *  2.8 to 4.4  The tweezers lower the pellet onto a steel tray and lift away. Label: ইউরেনিয়াম পেলেট · Ø ৭.৬ মিমি
 *  4.6 to 6.6  Coal pours into a ~1 ton heap behind (≈1.2 m wide), first out of focus
 *  5.0 to 8.8  Pull-back and crane up. The tiny pellet stays marked with a ring. Title "১টি পেলেট = ~১ টন কয়লা" on "কয়লার"
 */
import { useMemo } from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HDRI, Lighting, usePBR } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix, mix3, prog, useSeconds } from "../kit/time";
import { C } from "../theme";
import { Chip, Pop } from "../ui";

export const S03_DURATION = 8.8;
const VO = 0.3;
const T = {
  rack: 0.6,
  lower: 2.8 + VO,
  release: 3.9 + VO,
  label: 3.4 + VO,
  pour: 4.5 + VO,
  pull: 4.9 + VO,
  title: 5.86 + VO,
};

const PEL_R = 3.8;
const PEL_H = 10;
const HOLE = 0.6;
const TRAY_Y = 0;
const HEAP_C = new THREE.Vector3(260, 0, -900);
const HEAP_R = 640;
const HEAP_H = 520;
const CHUNKS = 380;

/** Chamfered annular pellet with shallow dished end faces (lathe profile, mm). */
const pelletGeometry = () => {
  const p = [
    [HOLE, 0.25],
    [PEL_R - 0.9, 0.0],
    [PEL_R - 0.35, 0.0],
    [PEL_R, 0.35],
    [PEL_R, PEL_H - 0.35],
    [PEL_R - 0.35, PEL_H],
    [PEL_R - 0.9, PEL_H],
    [HOLE, PEL_H - 0.25],
    [HOLE, 0.25],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(p, 160);
  g.computeVertexNormals();
  return g;
};

/** Irregular coal lump: subdivided icosahedron with layered angular displacement. */
const lumpGeometry = (seed: number) => {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 3);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const planes = new Array(7).fill(0).map((_, k) =>
    new THREE.Vector3(random(`pl${seed}${k}x`) - 0.5, random(`pl${seed}${k}y`) - 0.5, random(`pl${seed}${k}z`) - 0.5).normalize(),
  );
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    let k = 1;
    // fractured faces: clip against random planes, like broken coal
    planes.forEach((n, j) => {
      const d = v.dot(n);
      const cut = 0.55 + random(`cut${seed}${j}`) * 0.3;
      if (d > cut) k = Math.min(k, cut / d);
    });
    const noise = 1 + (random(`n${seed}${i}`) - 0.5) * 0.06;
    v.multiplyScalar(k * noise);
    pos.setXYZ(i, v.x, v.y * 0.8, v.z);
  }
  g = g.toNonIndexed();
  g.computeVertexNormals();
  // Box-projected UVs per face so the rock texture wraps without stretching
  const P = g.attributes.position as THREE.BufferAttribute;
  const Nn = g.attributes.normal as THREE.BufferAttribute;
  const uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) {
    const ax = Math.abs(Nn.getX(i));
    const ay = Math.abs(Nn.getY(i));
    const az = Math.abs(Nn.getZ(i));
    const [u, w] = ax >= ay && ax >= az ? [P.getZ(i), P.getY(i)] : ay >= az ? [P.getX(i), P.getZ(i)] : [P.getX(i), P.getY(i)];
    uv[i * 2] = u * 0.5 + 0.5 + seed * 0.17;
    uv[i * 2 + 1] = w * 0.5 + 0.5;
  }
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
};

const Tweezers: React.FC<{ y: number; open: number; steel: THREE.Material }> = ({ y, open, steel }) => {
  // Two tapered stainless prongs meeting at the tip, angled down toward the pellet.
  const prong = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(1.2, 0);
    s.lineTo(4.5, 110);
    s.lineTo(-1.8, 110);
    s.lineTo(0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25, bevelSegments: 3 });
    g.translate(-0.6, 0, -0.4);
    return g;
  }, []);
  return (
    // Blades grip the pellet's left/right sides (flat face on the pellet), rising up and back out of frame.
    <group position={[0, y + PEL_H * 0.45, 0]} rotation={[-0.75, 0, 0.12]}>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          geometry={prong}
          material={steel}
          castShadow
          position={[s * (PEL_R + 0.45 + open), 0, 0]}
          rotation={[0, Math.PI / 2, s * -0.03]}
        />
      ))}
    </group>
  );
};

const World: React.FC = () => {
  const t = useSeconds();
  const pellet = useMemo(pelletGeometry, []);
  const lumps = useMemo(() => [0, 1, 2, 3, 4, 5].map(lumpGeometry), []);
  const floorTex = usePBR("concrete_wall_008", [6, 6]);
  const steelTex = usePBR("metal_plate", [0.6, 0.6]);
  const rockTex = usePBR("rock_boulder_dry", [0.6, 0.6]);

  const pelletMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#3b3c3f",
        metalness: 0.42,
        roughness: 0.5,
        normalMap: steelTex.normalMap,
        normalScale: new THREE.Vector2(0.25, 0.25),
        roughnessMap: steelTex.roughnessMap,
        clearcoat: 0.12,
        clearcoatRoughness: 0.4,
      }),
    [steelTex],
  );
  const steel = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#c9cdd2",
        metalness: 1,
        roughness: 0.22,
        normalMap: steelTex.normalMap,
        normalScale: new THREE.Vector2(0.15, 0.15),
        roughnessMap: steelTex.roughnessMap,
      }),
    [steelTex],
  );
  const coal = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#151516",
        roughness: 0.42,
        metalness: 0.18,
        roughnessMap: rockTex.roughnessMap,
        normalMap: rockTex.normalMap,
        normalScale: new THREE.Vector2(0.8, 0.8),
        clearcoat: 0.35,
        clearcoatRoughness: 0.35,
        flatShading: true,
      }),
    [rockTex],
  );
  const floor = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: floorTex.map,
        normalMap: floorTex.normalMap,
        roughnessMap: floorTex.roughnessMap,
        color: "#8a8780",
      }),
    [floorTex],
  );

  const chunks = useMemo(
    () =>
      new Array(CHUNKS).fill(0).map((_, i) => {
        const r = HEAP_R * Math.sqrt(random(`cr${i}`));
        const a = random(`ca${i}`) * Math.PI * 2;
        const hMax = HEAP_H * Math.pow(1 - r / HEAP_R, 1.15);
        const y = hMax * Math.pow(random(`cy${i}`), 0.4);
        const s = 34 + random(`cs${i}`) * 70;
        return {
          end: new THREE.Vector3(HEAP_C.x + Math.cos(a) * r, y + s * 0.5, HEAP_C.z + Math.sin(a) * r),
          s: [s * (0.8 + random(`sx${i}`) * 0.5), s * (0.7 + random(`sy${i}`) * 0.4), s * (0.8 + random(`sz${i}`) * 0.5)] as const,
          rot: [random(`rx${i}`) * 6, random(`ry${i}`) * 6, random(`rz${i}`) * 6] as const,
          spin: (random(`sp${i}`) - 0.5) * 9,
          delay: T.pour + (y / HEAP_H) * 1.3 + random(`d${i}`) * 0.5,
          geo: i % 6,
        };
      }),
    [],
  );

  // ---- Pellet + tweezers ----
  const lower = prog(t, T.lower, T.release - 0.2, ease.inOut);
  const pelletY = mix(16, TRAY_Y + 0.6, lower);
  const open = prog(t, T.release - 0.2, T.release + 0.3, ease.out) * 1.6;
  const lift = prog(t, T.release + 0.2, T.release + 1.4, ease.inOut) * 60;

  // ---- Camera: 100 mm macro → wide reveal ----
  const pull = prog(t, T.pull, S03_DURATION, ease.cine);
  const hh = handheld(t, mix(0.18, 9, pull), 1);
  const macroPos = new THREE.Vector3(mix(-6, 4, prog(t, 0, T.pull)), pelletY + mix(14, 9, lower), 62 - lower * 6);
  const widePos = new THREE.Vector3(-900, 1250, 2600);
  const camPos = mix3(macroPos.toArray(), widePos.toArray(), Math.pow(pull, 1.6));
  const target = mix3([0, pelletY + PEL_H * 0.5, 0], [180, 160, -560], Math.pow(pull, 1.3));
  const mm = mix(100, 50, pull);
  const camDist = Math.hypot(camPos[0] - target[0], camPos[1] - target[1], camPos[2] - target[2]);
  // rack focus: tweezer tip (behind) → pellet face; during the pull keep focus on the heap
  const rack = prog(t, T.rack, T.rack + 1.1, ease.inOut);
  const focus = pull > 0.02 ? camDist : mix(camDist + 18, camDist - 2, rack);
  const focusRange = mix(3.5, 900, pull);

  // ring that keeps the tiny pellet findable once the camera is far away
  const ring = prog(t, T.pull + 1.2, T.pull + 1.8, ease.out);

  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={0.55} rotation={1.2} />
      <fog attach="fog" args={["#0b0c0e", 2200, 7500]} />
      <spotLight
        position={[-700, 1800, 900]}
        angle={0.7}
        penumbra={0.9}
        intensity={3.2}
        decay={0}
        color="#fff1e0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-camera-near={100}
        shadow-camera-far={6000}
      />
      <directionalLight position={[600, 300, -1600]} intensity={1.2} color="#8fd3ff" />
      <pointLight position={[-30, 40, 40]} intensity={mix(0.9, 0, pull)} decay={0} color="#ffd2a6" />

      <Lens mm={mm} position={[camPos[0] + hh[0], camPos[1] + hh[1], camPos[2] + hh[2]]} target={target} near={1} far={20000} />

      {/* Concrete floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -3, 0]} receiveShadow material={floor}>
        <planeGeometry args={[12000, 12000]} />
      </mesh>

      {/* Stainless tray */}
      <group position={[0, -3, 0]}>
        <mesh receiveShadow castShadow material={steel} position={[0, 1.5, 0]}>
          <boxGeometry args={[150, 3, 100]} />
        </mesh>
      </group>

      {/* Fuel pellet */}
      <mesh geometry={pellet} material={pelletMat} castShadow receiveShadow position={[0, pelletY, 0]} rotation={[0, t * 0.08, 0]} />
      <Tweezers y={pelletY + lift} open={open} steel={steel} />

      {/* Coal: ~1 tonne heap */}
      {chunks.map((c, i) => {
        const k = prog(t, c.delay, c.delay + 0.45);
        if (k <= 0) return null;
        const fall = 1 - k * k;
        return (
          <mesh
            key={i}
            geometry={lumps[c.geo]}
            material={coal}
            castShadow
            receiveShadow
            position={[c.end.x, c.end.y + fall * 1600, c.end.z]}
            rotation={[c.rot[0] + fall * c.spin, c.rot[1], c.rot[2] + fall * c.spin * 0.6]}
            scale={c.s as unknown as [number, number, number]}
          />
        );
      })}

      {/* Marker ring around the pellet for the wide shot */}
      {ring > 0 ? (
        <mesh rotation-x={-Math.PI / 2} position={[0, 2, 0]}>
          <ringGeometry args={[46, 54, 64]} />
          <meshBasicMaterial color={C.amber} transparent opacity={ring} toneMapped={false} />
        </mesh>
      ) : null}

      <PostFX focus={focus} focusRange={focusRange} bokeh={mix(7, 2.5, pull)} bloom={0.35} bloomThreshold={0.92} />
    </>
  );
};

export const S03Pellet: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#0b0c0e">
        <World />
      </Stage>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <Chip at={f(T.label)} until={f(T.pull + 0.6)} accent={C.cyan} size={42}>
          ইউরেনিয়াম পেলেট · Ø ৭.৬ মিমি
        </Chip>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210 }}>
        <Pop at={f(T.title - 0.6)} size={96}>
          ১টি পেলেট
        </Pop>
        <Pop at={f(T.title - 0.3)} size={70} color={C.muted} style={{ margin: "-8px 0" }}>
          =
        </Pop>
        <Pop at={f(T.title)} size={128} color={C.amber} glow>
          ~১ টন কয়লা
        </Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
