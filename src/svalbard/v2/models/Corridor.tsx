/**
 * Svalbard v2 — the way in (refs: tunnel_entry, tunnel_down, vault_door2).
 * Metres, +z = into the mountain, floor y = 0.
 *  vestibule z −5…0 → steel double door (opens toward −z) → board-formed concrete corridor z 0…26 (wall lamps,
 *  ducts/pipes, ceiling frame, steel stair on the right) → corrugated steel tube z 26…118 (blue floor uplights,
 *  ceiling lamp strips) → transverse hall z 118…130 with three frosted, rimed vault doors on the far wall.
 * Practical lights: a fixed pool of point lights is moved each frame to the lamps nearest the camera (no recompiles).
 * Also exports shared bits for the vault room: frostify(), usePuffTex(), Puffs.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { usePBR } from "../../../kit/assets";
import { canvasTex, rng } from "../../three/util";
import { P } from "../palette";
import { NOISE_GLSL } from "./glsl";

export const CORR = { W: 4, H: 4.2, z1: 26 } as const;
export const TUBE = { R: 2.3, cy: 0.9, z0: 26, z1: 118 } as const;
export const HALL = { z0: 118, z1: 130, x0: -10, x1: 10, H: 5.4 } as const;
export const DOOR_X = [-4.5, 0, 4.5] as const;
const VEST = { z0: -5, W: 4.4, H: 3.6 } as const;
const DOOR = { W: 2.6, H: 2.8 } as const;
const TUBE_BLUE = "#4f8fd6";
const LAMP_WARM = "#ffe2bd";

/* ───────────────────────────── shared helpers ───────────────────────────── */

/**
 * Hoar-frost on a standard material: world-space crystalline noise, heavier on up-facing surfaces, sparkling specks.
 * Works on instanced meshes. `amount` 0…1 is baked at compile time (key it).
 */
export const frostify = <M extends THREE.MeshStandardMaterial>(m: M, amount: number, scale = 1): M => {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader =
      "varying vec3 vFW;\n" +
      sh.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec4 fw = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          fw = instanceMatrix * fw;
        #endif
        vFW = (modelMatrix * fw).xyz;`,
      );
    sh.fragmentShader =
      "varying vec3 vFW;\n" +
      NOISE_GLSL +
      sh.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
        {
          vec3 wN = inverseTransformDirection(normal, viewMatrix);
          float up = smoothstep(0.15, 0.85, wN.y);
          float n = fbm3(vFW * ${(5.0 * scale).toFixed(2)});
          float spk = smoothstep(0.8, 0.95, n3(vFW * ${(70.0 * scale).toFixed(1)}));
          float f = ${amount.toFixed(3)} * (0.45 + 0.55 * up) * smoothstep(0.42, 0.62, n + ${(amount * 0.25).toFixed(3)});
          f = clamp(f + spk * ${(amount * 0.6).toFixed(3)}, 0.0, 1.0);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.84, 0.89, 0.94), f * 0.9);
          roughnessFactor = mix(roughnessFactor, 0.62, f);
          metalnessFactor = mix(metalnessFactor, 0.0, f * 0.9);
        }`,
      );
  };
  m.customProgramCacheKey = () => `frost-${amount.toFixed(3)}-${scale}`;
  return m;
};

/** soft round puff (fog / breath / steam sprites) */
export const usePuffTex = () =>
  useMemo(
    () =>
      canvasTex(128, 128, (g) => {
        const r = rng(7);
        for (let i = 0; i < 9; i++) {
          const x = 40 + r() * 48;
          const y = 40 + r() * 48;
          const gr = g.createRadialGradient(x, y, 0, x, y, 30 + r() * 30);
          gr.addColorStop(0, "rgba(255,255,255,0.22)");
          gr.addColorStop(1, "rgba(255,255,255,0)");
          g.fillStyle = gr;
          g.fillRect(0, 0, 128, 128);
        }
      }),
    [],
  );

/** deterministic drifting fog sprites in a box; opacity scaled by `k` */
export const Puffs: React.FC<{
  readonly count: number;
  readonly seed: number;
  readonly box: readonly [number, number, number, number, number, number];
  readonly size: readonly [number, number];
  readonly t: number;
  readonly drift: readonly [number, number, number];
  readonly k: number;
  readonly color?: string;
  readonly opacity?: number;
}> = ({ count, seed, box, size, t, drift, k, color = "#c8d4df", opacity = 0.35 }) => {
  const tex = usePuffTex();
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({
      p: [box[0] + r() * (box[1] - box[0]), box[2] + r() * (box[3] - box[2]), box[4] + r() * (box[5] - box[4])] as const,
      s: size[0] + r() * (size[1] - size[0]),
      ph: r() * Math.PI * 2,
      sp: 0.6 + r() * 0.8,
      rot: r() * Math.PI * 2,
    }));
  }, [count, seed, box, size]);
  if (k <= 0.001) return null;
  return (
    <group>
      {items.map((it, i) => {
        const tt = t * it.sp;
        const grow = 1 + 0.25 * Math.min(1, t * 0.5);
        return (
          <sprite
            key={i}
            position={[
              it.p[0] + drift[0] * tt + Math.sin(tt * 0.7 + it.ph) * 0.15,
              it.p[1] + drift[1] * tt + Math.sin(tt * 0.5 + it.ph * 2) * 0.08,
              it.p[2] + drift[2] * tt,
            ]}
            scale={[it.s * grow, it.s * grow, 1]}
          >
            <spriteMaterial map={tex} color={color} transparent opacity={opacity * k * (0.6 + 0.4 * Math.sin(it.ph + t))} depthWrite={false} rotation={it.rot + t * 0.1} />
          </sprite>
        );
      })}
    </group>
  );
};

/** a lamp: box housing + emissive lens; returns nothing fancy */
const Lamp: React.FC<{ readonly position: readonly [number, number, number]; readonly size: readonly [number, number, number]; readonly color: string; readonly power: number; readonly housing: THREE.Material }> = ({
  position,
  size,
  color,
  power,
  housing,
}) => (
  <group position={position as [number, number, number]}>
    <mesh material={housing}>
      <boxGeometry args={[size[0] * 1.15, size[1] * 1.15, size[2] * 0.8]} />
    </mesh>
    <mesh position={[0, 0, size[2] * 0.42]}>
      <boxGeometry args={[size[0], size[1], size[2] * 0.2]} />
      <meshStandardMaterial color="#000" emissive={color} emissiveIntensity={power} toneMapped />
    </mesh>
  </group>
);

/* ───────────────────────────── materials ───────────────────────────── */

const useConcreteMat = (repeat: [number, number], rough = 1, tint = "#ffffff", frost = 0) => {
  const pbr = usePBR("concrete_wall_008", repeat);
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: pbr.map,
      normalMap: pbr.normalMap,
      roughnessMap: pbr.roughnessMap,
      normalScale: new THREE.Vector2(1.2, 1.2),
      color: tint,
      roughness: rough,
      metalness: 0,
    });
    return frost > 0 ? frostify(m, frost, 0.8) : m;
  }, [pbr, rough, tint, frost]);
};

export const useSteelMat = (repeat: [number, number], tint = "#aeb8c2", rough = 0.4, metal = 0.85, frost = 0) => {
  const pbr = usePBR("metal_plate", repeat);
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: pbr.map,
      normalMap: pbr.normalMap,
      roughnessMap: pbr.roughnessMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      color: tint,
      roughness: rough,
      metalness: metal,
      envMapIntensity: 1.2,
    });
    return frost > 0 ? frostify(m, frost, 1.4) : m;
  }, [pbr, tint, rough, metal, frost]);
};

/** white-painted rock (vault/hall walls): rock normal map, near-white tint */
export const useWhiteRockMat = (repeat: [number, number], frost = 0) => {
  const pbr = usePBR("rock_boulder_dry", repeat);
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: pbr.map,
      normalMap: pbr.normalMap,
      roughnessMap: pbr.roughnessMap,
      normalScale: new THREE.Vector2(1.6, 1.6),
      color: "#f4f6f8",
      roughness: 0.95,
    });
    m.onBeforeCompile = (sh) => {
      // paint: lift the albedo towards white, keep the rock's light/dark variation subtle
      sh.fragmentShader = sh.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        { float l = dot(diffuseColor.rgb, vec3(0.33)); diffuseColor.rgb = vec3(0.80 + 0.35 * (l - 0.35)) * vec3(0.97, 0.985, 1.0); }`,
      );
    };
    m.customProgramCacheKey = () => "white-rock";
    return frost > 0 ? frostify(m, frost) : m;
  }, [pbr, frost]);
};

/* ───────────────────────────── geometry helpers ───────────────────────────── */

const Plane: React.FC<{ readonly w: number; readonly h: number; readonly p: readonly [number, number, number]; readonly r?: readonly [number, number, number]; readonly m: THREE.Material; readonly seg?: number }> = ({
  w,
  h,
  p,
  r = [0, 0, 0],
  m,
}) => (
  <mesh position={p as [number, number, number]} rotation={r as [number, number, number]} material={m} receiveShadow>
    <planeGeometry args={[w, h]} />
  </mesh>
);

const Box: React.FC<{ readonly s: readonly [number, number, number]; readonly p: readonly [number, number, number]; readonly m: THREE.Material; readonly r?: readonly [number, number, number] }> = ({ s, p, m, r = [0, 0, 0] }) => (
  <mesh position={p as [number, number, number]} rotation={r as [number, number, number]} material={m}>
    <boxGeometry args={s as [number, number, number]} />
  </mesh>
);

const Pipe: React.FC<{ readonly r: number; readonly x: number; readonly y: number; readonly z0: number; readonly z1: number; readonly m: THREE.Material }> = ({ r, x, y, z0, z1, m }) => (
  <mesh position={[x, y, (z0 + z1) / 2]} rotation={[Math.PI / 2, 0, 0]} material={m}>
    <cylinderGeometry args={[r, r, z1 - z0, 20, 1, true]} />
  </mesh>
);

/** instanced boxes from a list of matrices */
export const Instanced: React.FC<{ readonly geo: THREE.BufferGeometry; readonly mat: THREE.Material; readonly mats: THREE.Matrix4[]; readonly shadows?: boolean }> = ({ geo, mat, mats, shadows = false }) => {
  const mesh = useMemo(() => {
    const im = new THREE.InstancedMesh(geo, mat, mats.length);
    im.frustumCulled = false;
    im.castShadow = shadows;
    im.receiveShadow = shadows;
    return im;
  }, [geo, mat, mats.length, shadows]);
  // matrices are (re)written every render — cheap, deterministic, no new GPU buffers
  mats.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

export const mat4 = (p: readonly number[], s: readonly number[] = [1, 1, 1], ry = 0, rx = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(p[0], p[1], p[2]), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, 0)), new THREE.Vector3(s[0], s[1], s[2]));

/** corrugated steel tube (axis along +z), radial corrugation 0.2 m pitch */
const useTubeGeometry = () =>
  useMemo(() => {
    const L = TUBE.z1 - TUBE.z0;
    const g = new THREE.CylinderGeometry(TUBE.R, TUBE.R, L, 64, Math.round((L / 0.2) * 5), true);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const z = p.getZ(i);
      const r = Math.hypot(x, z) || 1;
      const k = (TUBE.R + 0.055 * Math.sin((2 * Math.PI * y) / 0.2)) / r;
      p.setXYZ(i, x * k, y, z * k);
    }
    g.computeVertexNormals();
    g.rotateX(Math.PI / 2);
    g.translate(0, TUBE.cy, (TUBE.z0 + TUBE.z1) / 2);
    return g;
  }, []);

/** corridor end wall with the tube collar opening (shape with a hole) */
const useCollarGeometry = () =>
  useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-CORR.W / 2, 0);
    s.lineTo(CORR.W / 2, 0);
    s.lineTo(CORR.W / 2, CORR.H);
    s.lineTo(-CORR.W / 2, CORR.H);
    s.closePath();
    const hole = new THREE.Path();
    const r = 1.92;
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const x = Math.max(-1.9, Math.min(1.9, Math.cos(a) * r));
      const y = Math.max(0.03, TUBE.cy + Math.sin(a) * r);
      pts.push(new THREE.Vector2(x, y));
    }
    hole.setFromPoints(pts);
    s.holes.push(hole);
    return new THREE.ShapeGeometry(s, 24);
  }, []);

/* ───────────────────────────── lights ───────────────────────────── */

type LampDef = { p: [number, number, number]; c: string; w: number; zone: "corr" | "tube" | "hall" | "vest" };
const LAMPS: LampDef[] = (() => {
  const L: LampDef[] = [{ p: [0, 3.3, -3.6], c: "#9fb4c8", w: 2.2, zone: "vest" }];
  for (let z = 3; z < CORR.z1; z += 5) L.push({ p: [-1.6, 2.5, z], c: LAMP_WARM, w: 9, zone: "corr" });
  for (let z = TUBE.z0 + 3; z < TUBE.z1; z += 6) {
    L.push({ p: [-1.7, 0.35, z], c: TUBE_BLUE, w: 7, zone: "tube" });
    L.push({ p: [1.7, 0.35, z + 3], c: TUBE_BLUE, w: 7, zone: "tube" });
  }
  DOOR_X.forEach((x) => L.push({ p: [x, 3.3, HALL.z1 - 0.6], c: P.amber, w: 6, zone: "hall" }));
  L.push({ p: [-5, 4.8, 123], c: "#dfe8f0", w: 14, zone: "hall" }, { p: [5, 4.8, 123], c: "#dfe8f0", w: 14, zone: "hall" });
  return L;
})();
const POOL = 7;

const LightPool: React.FC<{ readonly cam: readonly [number, number, number]; readonly open: number }> = ({ cam, open }) => {
  // lamps ahead of the camera matter most: score by distance to a point 4 m ahead
  const ax = cam[0];
  const az = cam[2] + 4;
  const pick = [...LAMPS]
    .map((l) => ({ l, d: Math.hypot(l.p[0] - ax, l.p[2] - az) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, POOL);
  return (
    <>
      {pick.map(({ l }, i) => {
        // while the camera is in the vestibule, corridor light only leaks through the opening door
        const gate = cam[2] < 0.3 && l.zone !== "vest" ? 0.04 + 0.96 * open : 1;
        return <pointLight key={i} position={l.p} color={l.c} intensity={l.w * gate} distance={l.zone === "tube" ? 9 : 16} decay={2} />;
      })}
    </>
  );
};

/* ───────────────────────────── model ───────────────────────────── */

export type CorridorProps = {
  /** camera position (drives the light pool) */
  readonly cam: readonly [number, number, number];
  /** entrance door 0 closed → 1 open */
  readonly open: number;
  /** camera speed m/s (stretches lamp strips into streaks) */
  readonly speed: number;
  readonly t: number;
};

export const Corridor: React.FC<CorridorProps> = ({ cam, open, speed, t }) => {
  const wallM = useConcreteMat([7, 1.2], 1);
  const floorM = useConcreteMat([1.4, 9], 0.55, "#b9bcc0");
  const ceilM = useConcreteMat([1.4, 9], 1, "#8c9096");
  const vestM = useConcreteMat([1.5, 1.2], 1, "#9da2a8");
  const collarM = useConcreteMat([0.3, 0.3], 1);
  const tubeFloorM = useConcreteMat([1.4, 30], 0.42, "#a7adb5", 0.25);
  const hallWallM = useWhiteRockMat([4, 1.2], 0.45);
  const hallFloorM = useConcreteMat([5, 3], 0.6, "#c4c8cc", 0.5);
  const steel = useSteelMat([0.5, 0.5]);
  const galv = useSteelMat([0.3, 0.3], "#c3c8cc", 0.5, 0.8);
  const duct = useSteelMat([0.2, 6], "#d4d8dc", 0.32, 0.9);
  const doorLeafM = useSteelMat([0.6, 0.6], "#b9c4cf", 0.34, 0.85, 0.35);
  const vaultDoorM = useSteelMat([0.7, 0.7], "#aab8c6", 0.3, 0.85, 0.95);
  const darkM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1d2329", roughness: 0.6, metalness: 0.3 }), []);
  const pipeBlack = useMemo(() => new THREE.MeshStandardMaterial({ color: "#23272c", roughness: 0.55 }), []);
  const tubeM = useMemo(() => {
    const m = steel.clone();
    m.color.set("#8fa3b8");
    m.roughness = 0.36;
    m.metalness = 0.78;
    m.side = THREE.BackSide;
    m.emissive.set("#0d2340");
    m.map = steel.map!.clone();
    m.map.repeat.set(10, 70);
    m.normalMap = steel.normalMap!.clone();
    m.normalMap.repeat.set(10, 70);
    m.roughnessMap = steel.roughnessMap!.clone();
    m.roughnessMap.repeat.set(10, 70);
    return m;
  }, [steel]);
  const tubeGeo = useTubeGeometry();
  const collarGeo = useCollarGeometry();

  const ang = open * 1.72;
  const corrMid = CORR.z1 / 2;

  // instanced repeats
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const frameMats = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let z = 1; z < CORR.z1; z += 1.5) out.push(mat4([0, 3.55, z], [CORR.W, 0.08, 0.1]));
    for (let z = 1; z < CORR.z1; z += 6) out.push(mat4([-1.2, 3.85, z], [0.06, 0.6, 0.06]), mat4([1.2, 3.85, z], [0.06, 0.6, 0.06]));
    return out;
  }, []);
  const treadMats = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    const n = 22;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      out.push(mat4([1.5, 0.18 + k * (CORR.H - 0.3), 17 - k * 7], [0.86, 0.035, 0.26]));
    }
    return out;
  }, []);
  const stringerLen = Math.hypot(7, CORR.H - 0.3);
  const stringerAng = Math.atan2(CORR.H - 0.3, 7);
  const upMats = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let z = TUBE.z0 + 1.5; z < TUBE.z1; z += 2.5) out.push(mat4([-1.95, 0.08, z], [0.18, 0.12, 0.28]), mat4([1.95, 0.08, z + 1.25], [0.18, 0.12, 0.28]));
    return out;
  }, []);
  const stripMats = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let z = TUBE.z0 + 1.5; z < TUBE.z1; z += 3) out.push(mat4([0, TUBE.cy + TUBE.R - 0.2, z], [0.14, 0.05, 1]));
    return out;
  }, []);
  const streak = 1 + Math.min(6, Math.abs(speed) * 0.09);
  const upLensM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#000", emissive: TUBE_BLUE, emissiveIntensity: 5 }), []);
  const stripM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#000", emissive: "#eaf3ff", emissiveIntensity: 4 }), []);

  return (
    <group>
      <hemisphereLight args={["#9eb3c9", "#1a222b", 0.12]} />
      <LightPool cam={cam} open={open} />

      {/* ── vestibule ── */}
      <Plane w={VEST.W} h={-VEST.z0} p={[0, 0, VEST.z0 / 2]} r={[-Math.PI / 2, 0, 0]} m={floorM} />
      <Plane w={VEST.W} h={-VEST.z0} p={[0, VEST.H, VEST.z0 / 2]} r={[Math.PI / 2, 0, 0]} m={vestM} />
      <Plane w={-VEST.z0} h={VEST.H} p={[-VEST.W / 2, VEST.H / 2, VEST.z0 / 2]} r={[0, Math.PI / 2, 0]} m={vestM} />
      <Plane w={-VEST.z0} h={VEST.H} p={[VEST.W / 2, VEST.H / 2, VEST.z0 / 2]} r={[0, -Math.PI / 2, 0]} m={vestM} />
      {/* door wall (3 pieces around the opening) */}
      <Box s={[(VEST.W - DOOR.W) / 2, CORR.H, 0.3]} p={[-(VEST.W + DOOR.W) / 4, CORR.H / 2, 0]} m={vestM} />
      <Box s={[(VEST.W - DOOR.W) / 2, CORR.H, 0.3]} p={[(VEST.W + DOOR.W) / 4, CORR.H / 2, 0]} m={vestM} />
      <Box s={[VEST.W, CORR.H - DOOR.H, 0.3]} p={[0, (CORR.H + DOOR.H) / 2, 0]} m={vestM} />
      {/* steel frame */}
      <Box s={[0.12, DOOR.H + 0.12, 0.36]} p={[-DOOR.W / 2 - 0.06, DOOR.H / 2, 0]} m={steel} />
      <Box s={[0.12, DOOR.H + 0.12, 0.36]} p={[DOOR.W / 2 + 0.06, DOOR.H / 2, 0]} m={steel} />
      <Box s={[DOOR.W + 0.24, 0.12, 0.36]} p={[0, DOOR.H + 0.06, 0]} m={steel} />
      {/* leaves swing toward the camera (−z) */}
      {[-1, 1].map((s) => (
        <group key={s} position={[(s * DOOR.W) / 2, 0, -0.17]} rotation={[0, s * -ang, 0]}>
          <Box s={[DOOR.W / 2 - 0.02, DOOR.H - 0.02, 0.07]} p={[(-s * DOOR.W) / 4, DOOR.H / 2, -0.035]} m={doorLeafM} />
          <Box s={[0.05, 0.9, 0.05]} p={[-s * (DOOR.W / 2 - 0.16), 1.15, -0.12]} m={galv} />
          <Box s={[0.05, 0.05, 0.08]} p={[-s * (DOOR.W / 2 - 0.16), 0.75, -0.08]} m={galv} />
          <Box s={[0.05, 0.05, 0.08]} p={[-s * (DOOR.W / 2 - 0.16), 1.55, -0.08]} m={galv} />
        </group>
      ))}
      <Lamp position={[0, 3.3, -3.6]} size={[0.5, 0.12, 0.22]} color="#c5d4e2" power={1.6} housing={darkM} />

      {/* ── concrete corridor ── */}
      <Plane w={CORR.W} h={CORR.z1} p={[0, 0, corrMid]} r={[-Math.PI / 2, 0, 0]} m={floorM} />
      <Plane w={CORR.W} h={CORR.z1} p={[0, CORR.H, corrMid]} r={[Math.PI / 2, 0, 0]} m={ceilM} />
      <Plane w={CORR.z1} h={CORR.H} p={[-CORR.W / 2, CORR.H / 2, corrMid]} r={[0, Math.PI / 2, 0]} m={wallM} />
      <Plane w={CORR.z1} h={CORR.H} p={[CORR.W / 2, CORR.H / 2, corrMid]} r={[0, -Math.PI / 2, 0]} m={wallM} />
      <mesh geometry={collarGeo} material={collarM} position={[0, 0, CORR.z1 + 0.02]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={collarGeo} material={collarM} position={[0, 0, CORR.z1 - 0.02]} />
      {/* ceiling services: insulated duct, pipes, cable tray, steel frame */}
      <Pipe r={0.32} x={-1.25} y={3.72} z0={0.2} z1={CORR.z1} m={duct} />
      <Pipe r={0.09} x={-0.45} y={3.95} z0={0.2} z1={CORR.z1} m={pipeBlack} />
      <Pipe r={0.07} x={-0.18} y={3.98} z0={0.2} z1={CORR.z1} m={galv} />
      <Pipe r={0.11} x={0.3} y={3.92} z0={0.2} z1={CORR.z1} m={duct} />
      <Box s={[0.6, 0.08, CORR.z1]} p={[1.15, 3.95, corrMid]} m={galv} />
      <Instanced geo={box} mat={galv} mats={frameMats} />
      {/* wall lamps (left wall, boxy, warm) */}
      {LAMPS.filter((l) => l.zone === "corr").map((l, i) => (
        <group key={i} position={[-CORR.W / 2 + 0.09, 2.5, l.p[2]]} rotation={[0, Math.PI / 2, 0]}>
          <Lamp position={[0, 0, 0]} size={[0.36, 0.42, 0.16]} color={LAMP_WARM} power={5} housing={darkM} />
        </group>
      ))}
      {/* steel stair on the right */}
      <Instanced geo={box} mat={galv} mats={treadMats} />
      {[1.05, 1.95].map((x) => (
        <mesh key={x} position={[x, (CORR.H - 0.3) / 2 + 0.1, 13.5]} rotation={[stringerAng, 0, 0]} material={galv}>
          <boxGeometry args={[0.06, 0.24, stringerLen]} />
        </mesh>
      ))}
      <mesh position={[1.05, (CORR.H - 0.3) / 2 + 1.0, 13.5]} rotation={[stringerAng, 0, 0]} material={galv}>
        <boxGeometry args={[0.04, 0.04, stringerLen]} />
      </mesh>
      {[12.2, 15].map((z) => (
        <Box key={z} s={[0.07, z === 12.2 ? 2.9 : 1.2, 0.07]} p={[1.08, z === 12.2 ? 1.45 : 0.6, z]} m={galv} />
      ))}

      {/* ── corrugated steel tube ── */}
      <mesh geometry={tubeGeo} material={tubeM} />
      <Plane w={4.2} h={TUBE.z1 - TUBE.z0} p={[0, 0.02, (TUBE.z0 + TUBE.z1) / 2]} r={[-Math.PI / 2, 0, 0]} m={tubeFloorM} />
      <Pipe r={0.09} x={-0.62} y={TUBE.cy + TUBE.R - 0.32} z0={TUBE.z0} z1={TUBE.z1} m={duct} />
      <Pipe r={0.07} x={0.62} y={TUBE.cy + TUBE.R - 0.3} z0={TUBE.z0} z1={TUBE.z1} m={pipeBlack} />
      <Instanced geo={box} mat={upLensM} mats={upMats} />
      <Instanced geo={box} mat={stripM} mats={stripMats} />
      <StreakStrips mats={stripMats} streak={streak} geo={box} mat={stripM} />

      {/* ── transverse hall + three vault doors ── */}
      <Plane w={HALL.x1 - HALL.x0} h={HALL.z1 - HALL.z0} p={[0, 0, (HALL.z0 + HALL.z1) / 2]} r={[-Math.PI / 2, 0, 0]} m={hallFloorM} />
      <Plane w={HALL.x1 - HALL.x0} h={HALL.z1 - HALL.z0} p={[0, HALL.H, (HALL.z0 + HALL.z1) / 2]} r={[Math.PI / 2, 0, 0]} m={hallWallM} />
      <Plane w={HALL.x1 - HALL.x0} h={HALL.H} p={[0, HALL.H / 2, HALL.z1]} r={[0, Math.PI, 0]} m={hallWallM} />
      <Plane w={HALL.z1 - HALL.z0} h={HALL.H} p={[HALL.x0, HALL.H / 2, (HALL.z0 + HALL.z1) / 2]} r={[0, Math.PI / 2, 0]} m={hallWallM} />
      <Plane w={HALL.z1 - HALL.z0} h={HALL.H} p={[HALL.x1, HALL.H / 2, (HALL.z0 + HALL.z1) / 2]} r={[0, -Math.PI / 2, 0]} m={hallWallM} />
      <Plane w={HALL.x1 - HALL.x0} h={HALL.H} p={[0, HALL.H / 2, HALL.z0]} m={hallWallM} />
      {[-5, 5].map((x) => (
        <Lamp key={x} position={[x, HALL.H - 0.08, 123]} size={[0.25, 0.06, 1.6]} color="#eef4fa" power={4} housing={darkM} />
      ))}
      <Pipe r={0.14} x={-7} y={HALL.H - 0.4} z0={HALL.z0} z1={HALL.z1} m={pipeBlack} />
      <mesh position={[0, HALL.H - 0.4, HALL.z1 - 0.5]} rotation={[0, 0, Math.PI / 2]} material={pipeBlack}>
        <cylinderGeometry args={[0.12, 0.12, HALL.x1 - HALL.x0, 16, 1, true]} />
      </mesh>
      {DOOR_X.map((x) => (
        <group key={x} position={[x, 0, HALL.z1]}>
          {/* recess frame */}
          <Box s={[0.18, 2.75, 0.3]} p={[-1.12, 1.375, -0.1]} m={vaultDoorM} />
          <Box s={[0.18, 2.75, 0.3]} p={[1.12, 1.375, -0.1]} m={vaultDoorM} />
          <Box s={[2.42, 0.18, 0.3]} p={[0, 2.75, -0.1]} m={vaultDoorM} />
          {/* rimed leaf + lever handle + lock plate */}
          <Box s={[2.06, 2.62, 0.1]} p={[0, 1.31, -0.08]} m={vaultDoorM} />
          <Box s={[0.012, 2.6, 0.02]} p={[0.2, 1.31, -0.135]} m={darkM} />
          <Box s={[0.1, 0.36, 0.04]} p={[0.38, 1.12, -0.15]} m={vaultDoorM} />
          <mesh position={[0.38, 1.05, -0.2]} rotation={[0, 0, Math.PI / 2]} material={galv}>
            <cylinderGeometry args={[0.022, 0.022, 0.28, 10]} />
          </mesh>
          <Lamp position={[0, 3.3, -0.1]} size={[0.32, 0.14, 0.14]} color={P.amber} power={5} housing={darkM} />
        </group>
      ))}
      {/* cold mist pooling at the door sills */}
      <Puffs count={22} seed={31} box={[-7, 7, 0.1, 0.7, HALL.z1 - 1.6, HALL.z1 - 0.3]} size={[1.2, 2.6]} t={t} drift={[0, 0.02, -0.12]} k={1} opacity={0.28} color="#cfdbe6" />
    </group>
  );
};

/** lamp strips in the tube; stretched along z with camera speed → light streaks */
const StreakStrips: React.FC<{ readonly mats: THREE.Matrix4[]; readonly streak: number; readonly geo: THREE.BufferGeometry; readonly mat: THREE.Material }> = ({ mats, streak, geo, mat }) => {
  const scaled = useMemo(() => mats.map((m) => m.clone().multiply(new THREE.Matrix4().makeScale(0.6, 0.6, streak))), [mats, streak]);
  if (streak < 1.3) return null;
  return <Instanced geo={geo} mat={mat} mats={scaled} />;
};
