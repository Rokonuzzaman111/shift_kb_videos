/**
 * Rooppur NPP site model, laid out from satellite imagery (Google Maps, 24.0659 N, 89.0460 E).
 * World: metres, x = east, z = south, origin = midpoint between the two reactor buildings.
 *
 *  - 4 natural-draught cooling towers (175 m, basin Ø ~136 m) in a rotated 2×2 cluster SW of the units
 *  - 2 reactor buildings ~190 m apart on a NW–SE diagonal; turbine halls on their NE side
 *  - Padma to the west, N704 highway along the north edge, dense village tree cover to the east
 *  - Reactor building: outer containment Ø ~50 m, 65.4 m to dome top, PHRS ducts to 74.85 m
 */
import { useLayoutEffect, useMemo, useRef } from "react";
import { random } from "remotion";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { usePBR } from "../kit/assets";
import { fieldTexture, softSprite } from "./textures";

export const TOWER_H = 175;
const BASE_R = 68;
const THROAT_R = 40;
const THROAT_Y = 0.78 * TOWER_H;
const SITE_ROT = 0.58; // site grid rotation (rad), long axis NW→SE

export const TOWERS: [number, number][] = [
  [-517, 220],
  [-380, 120],
  [-255, 258],
  [-392, 358],
];
export const UNITS: [number, number][] = [
  [-67, -80],
  [45, 70],
];

const towerShell = () => {
  const c = THROAT_Y / Math.sqrt((BASE_R / THROAT_R) ** 2 - 1);
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 60; i++) {
    const y = 11 + (i / 60) * (TOWER_H - 11);
    pts.push(new THREE.Vector2(THROAT_R * Math.sqrt(1 + ((y - THROAT_Y) / c) ** 2), y));
  }
  return new THREE.LatheGeometry(pts, 160);
};

/** Diagonal raker columns (X-legs) that carry the shell above the air inlet, merged into one mesh. */
const rakerColumns = () => {
  const n = 48;
  const parts: THREE.BufferGeometry[] = [];
  const len = Math.hypot(11, 9);
  for (let i = 0; i < n; i++) {
    for (const s of [-1, 1]) {
      const g = new THREE.CylinderGeometry(0.9, 0.9, len, 8);
      const a = (i / n) * Math.PI * 2;
      const m = new THREE.Matrix4()
        .makeRotationY(-a)
        .multiply(new THREE.Matrix4().makeTranslation(BASE_R - 1.5, 5.5, 0))
        .multiply(new THREE.Matrix4().makeRotationX(s * Math.atan2(9, 11)));
      g.applyMatrix4(m);
      parts.push(g);
    }
  }
  return mergeGeometries(parts);
};

/** Rain-streak weathering on cooling-tower concrete (vertical dark streaks, lighter top band). */
const streakTexture = () => {
  const w = 1024;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#d9d3c8";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const x = random(`sk${i}`) * w;
    const len = 40 + random(`sl${i}`) * 300;
    const y = random(`sy${i}`) * h * 0.6;
    const g = ctx.createLinearGradient(0, y, 0, y + len);
    const a = 0.05 + random(`sa${i}`) * 0.12;
    g.addColorStop(0, `rgba(70,66,60,${a})`);
    g.addColorStop(1, "rgba(70,66,60,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, 1 + random(`sw${i}`) * 3, len);
  }
  // construction lifts: faint horizontal bands every ~1.5 m
  ctx.fillStyle = "rgba(0,0,0,0.035)";
  for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
};

const Steam: React.FC<{ t: number; tex: THREE.Texture; seed: number; tint: string }> = ({ t, tex, seed, tint }) => {
  const N = 30;
  const L = 14;
  return (
    <group>
      {new Array(N).fill(0).map((_, k) => {
        const age = (t + (k * L) / N + seed * 3.3) % L;
        const life = age / L;
        const s = 85 + age * 24;
        const o = 0.85 * Math.min(1, age / 1.0) * Math.pow(1 - life, 1.3);
        return (
          <sprite
            key={k}
            position={[age * 7 + Math.sin(k * 1.9 + seed) * 12, TOWER_H + 10 + age * 16, Math.cos(k * 2.3 + seed) * 12]}
            scale={[s, s * 0.82, 1]}
          >
            <spriteMaterial map={tex} color={k % 3 === 0 ? "#cfc6bd" : tint} transparent opacity={o} depthWrite={false} />
          </sprite>
        );
      })}
    </group>
  );
};

const LatticeTower: React.FC<{ mat: THREE.Material; h?: number }> = ({ mat, h = 48 }) => {
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    const leg = (x: number, z: number) => {
      const g = new THREE.CylinderGeometry(0.25, 0.4, h, 6);
      const top = new THREE.Vector3(x * 0.25, h / 2, z * 0.25);
      const bot = new THREE.Vector3(x, -h / 2, z);
      const dir = top.clone().sub(bot);
      g.applyMatrix4(
        new THREE.Matrix4().compose(
          bot.clone().add(top).multiplyScalar(0.5),
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()),
          new THREE.Vector3(1, dir.length() / h, 1),
        ),
      );
      parts.push(g);
    };
    leg(-4, -4);
    leg(4, -4);
    leg(-4, 4);
    leg(4, 4);
    const arm = new THREE.BoxGeometry(22, 0.6, 0.6);
    arm.translate(0, h / 2 - 4, 0);
    parts.push(arm);
    const arm2 = new THREE.BoxGeometry(16, 0.6, 0.6);
    arm2.translate(0, h / 2 - 11, 0);
    parts.push(arm2);
    return mergeGeometries(parts);
  }, [h]);
  return <mesh geometry={geo} material={mat} position={[0, h / 2, 0]} castShadow />;
};

const Trees: React.FC<{ count: number }> = ({ count }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => {
    const out: { p: THREE.Vector3; s: number; c: THREE.Color }[] = [];
    const palette = ["#22331a", "#2c4220", "#344b25", "#1d2c17"].map((c) => new THREE.Color(c));
    for (let i = 0; out.length < count && i < count * 10; i++) {
      // denser to the east (village), sparse to the south/north-west; none in river or on site
      const x = -700 + random(`tx${i}`) * 2600;
      const z = -1500 + random(`tz${i}`) * 3000;
      const east = x > 420 ? 1 : 0.25;
      if (random(`tk${i}`) > east) continue;
      const u = x * Math.cos(SITE_ROT) - z * Math.sin(SITE_ROT);
      const v = x * Math.sin(SITE_ROT) + z * Math.cos(SITE_ROT);
      if (Math.abs(u + 120) < 560 && Math.abs(v - 40) < 520) continue; // plant site
      if (Math.abs(z + 520) < 26) continue; // highway
      const s = 5 + random(`ts${i}`) * 7;
      out.push({ p: new THREE.Vector3(x, s * 0.85, z), s, c: palette[i % palette.length] });
    }
    return out;
  }, [count]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const mat = new THREE.Matrix4();
    items.forEach((it, i) => {
      mat.compose(it.p, new THREE.Quaternion(), new THREE.Vector3(it.s, it.s * 0.8, it.s));
      m.setMatrixAt(i, mat);
      m.setColorAt(i, it.c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial roughness={1} />
    </instancedMesh>
  );
};

/** Whole site. `t` drives steam; `night` 0→1 switches on site lighting and darkens materials. */
export const RooppurPlant: React.FC<{ t: number; night?: number; steamTint?: string }> = ({
  t,
  night = 0,
  steamTint = "#e9ded2",
}) => {
  const concrete = usePBR("concrete_wall_008", [4, 4]);
  const steelTex = usePBR("metal_plate", [8, 8]);
  const shell = useMemo(towerShell, []);
  const rakers = useMemo(rakerColumns, []);
  const streaks = useMemo(streakTexture, []);
  const puff = useMemo(() => softSprite("rgba(255,255,255,0.95)"), []);
  const fields = useMemo(() => {
    const tx = fieldTexture();
    tx.repeat.set(30, 30);
    return tx;
  }, []);

  const towerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: streaks,
        color: "#cfc8bb",
        normalMap: concrete.normalMap,
        normalScale: new THREE.Vector2(0.6, 0.6),
        roughness: 0.92,
        side: THREE.DoubleSide,
      }),
    [streaks, concrete],
  );
  const wall = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e6e1d7",
        map: concrete.map,
        normalMap: concrete.normalMap,
        roughnessMap: concrete.roughnessMap,
        roughness: 0.9,
      }),
    [concrete],
  );
  const darkConcrete = useMemo(() => {
    const m = wall.clone();
    m.color.set("#a29d93");
    return m;
  }, [wall]);
  const steel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#9aa3ab", metalness: 0.7, roughness: 0.4, normalMap: steelTex.normalMap }),
    [steelTex],
  );
  const ribs = useMemo(() => {
    const n = steelTex.normalMap.clone();
    n.repeat.set(70, 3);
    n.needsUpdate = true;
    return n;
  }, [steelTex]);
  const cladding = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c6cdd4", metalness: 0.45, roughness: 0.5, normalMap: ribs, normalScale: new THREE.Vector2(1.4, 0.2) }),
    [ribs],
  );
  const roof = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5d6f80", metalness: 0.5, roughness: 0.45 }), []);
  const asphalt = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a3a38", roughness: 0.95 }), []);
  const lamp = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffd9a0", toneMapped: false }), []);
  [wall, darkConcrete, towerMat, cladding].forEach((m) => {
    m.emissive.set("#000000");
  });

  const lamps = useMemo(
    () =>
      new Array(120).fill(0).map((_, i) => {
        const u = -520 + random(`lu${i}`) * 900;
        const v = -460 + random(`lv${i}`) * 960;
        return [u * Math.cos(-SITE_ROT) - v * Math.sin(-SITE_ROT), 6 + random(`lh${i}`) * 20, u * Math.sin(-SITE_ROT) + v * Math.cos(-SITE_ROT)] as const;
      }),
    [],
  );

  return (
    <group>
      {/* Ground: fields, site platform, river, sand bars, highway */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[14000, 14000]} />
        <meshStandardMaterial map={fields} color="#9ea386" roughness={1} />
      </mesh>
      <group rotation-y={SITE_ROT} position={[-120, 0, 40]}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.3, 0]} receiveShadow>
          <planeGeometry args={[1120, 1040]} />
          <meshStandardMaterial color="#b2ada1" map={concrete.map} roughness={0.95} />
        </mesh>
        {/* internal road grid */}
        {[-380, -120, 140, 400].map((v) => (
          <mesh key={`r${v}`} material={asphalt} rotation-x={-Math.PI / 2} position={[0, 0.5, v]}>
            <planeGeometry args={[1100, 12]} />
          </mesh>
        ))}
        {[-460, 60, 470].map((u) => (
          <mesh key={`c${u}`} material={asphalt} rotation-x={-Math.PI / 2} position={[u, 0.5, 0]}>
            <planeGeometry args={[12, 1020]} />
          </mesh>
        ))}
        {/* ancillary blocks (workshops, stores, switchgear) */}
        {new Array(26).fill(0).map((_, i) => {
          const u = -500 + random(`bu${i}`) * 1000;
          const v = -480 + random(`bv${i}`) * 960;
          const near = UNITS.concat(TOWERS).some(([x, z]) => {
            const lu = (x + 120) * Math.cos(SITE_ROT) - (z - 40) * Math.sin(SITE_ROT);
            const lv = (x + 120) * Math.sin(SITE_ROT) + (z - 40) * Math.cos(SITE_ROT);
            return Math.hypot(lu - u, lv - v) < 120;
          });
          if (near) return null;
          const w = 20 + random(`bw${i}`) * 50;
          const d = 16 + random(`bd${i}`) * 34;
          const h = 7 + random(`bh${i}`) * 14;
          return (
            <mesh key={i} material={i % 3 === 0 ? cladding : wall} position={[u, h / 2, v]} castShadow receiveShadow>
              <boxGeometry args={[w, h, d]} />
            </mesh>
          );
        })}
      </group>
      {/* Padma (west) with sand bank */}
      <mesh rotation-x={-Math.PI / 2} position={[-905, 0.45, 0]} rotation-z={0.12}>
        <planeGeometry args={[140, 14000]} />
        <meshStandardMaterial color="#cdb892" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-2200, 0.6, 0]} rotation-z={0.12}>
        <planeGeometry args={[2500, 14000]} />
        <meshPhysicalMaterial
          color="#4c666d"
          roughness={0.07}
          clearcoat={1}
          clearcoatRoughness={0.05}
          normalMap={steelTex.normalMap}
          normalScale={new THREE.Vector2(0.12, 0.12)}
        />
      </mesh>
      {/* N704 highway along the north edge */}
      <mesh material={asphalt} rotation-x={-Math.PI / 2} position={[300, 0.55, -520]} rotation-z={-0.36}>
        <planeGeometry args={[4200, 30]} />
      </mesh>

      {/* Cooling towers */}
      {TOWERS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation-y={i * 1.3}>
          <mesh geometry={shell} material={towerMat} castShadow receiveShadow />
          <mesh geometry={rakers} material={darkConcrete} castShadow />
          <mesh position={[0, 0.8, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[BASE_R + 2, 96]} />
            <meshStandardMaterial color="#3b4447" roughness={0.3} metalness={0.1} />
          </mesh>
          <mesh position={[0, TOWER_H, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[THROAT_R * Math.sqrt(1 + ((TOWER_H - THROAT_Y) / (THROAT_Y / Math.sqrt((BASE_R / THROAT_R) ** 2 - 1))) ** 2), 1.2, 8, 128]} />
            <meshStandardMaterial color="#b9b2a6" roughness={0.9} />
          </mesh>
          <group rotation-y={-i * 1.3}>
            <Steam t={t} tex={puff} seed={i} tint={steamTint} />
          </group>
        </group>
      ))}

      {/* Units */}
      {UNITS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]} rotation-y={SITE_ROT}>
          {/* outer containment + dome */}
          <mesh material={wall} position={[0, 22.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[25, 25.6, 45, 160]} />
          </mesh>
          <mesh material={wall} position={[0, 45, 0]} castShadow receiveShadow scale={[1, 0.82, 1]}>
            <sphereGeometry args={[25, 160, 48, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          {/* PHRS: 8 air heat-exchanger ducts + outlet header + deflector */}
          {new Array(8).fill(0).map((_, k) => {
            const a = (k / 8) * Math.PI * 2;
            return (
              <mesh key={k} material={steel} position={[Math.cos(a) * 15.5, 57, Math.sin(a) * 15.5]} rotation={[0, -a, 0]} castShadow>
                <boxGeometry args={[4.5, 13, 7]} />
              </mesh>
            );
          })}
          <mesh material={steel} position={[0, 67, 0]} castShadow>
            <cylinderGeometry args={[11, 13, 6, 64]} />
          </mesh>
          <mesh material={steel} position={[0, 72.5, 0]} castShadow>
            <cylinderGeometry args={[16, 12, 4.7, 64]} />
          </mesh>
          {/* stair/lift tower and equipment hatch housing */}
          <mesh material={darkConcrete} position={[-24, 30, 14]} castShadow>
            <boxGeometry args={[9, 60, 9]} />
          </mesh>
          <mesh material={wall} position={[0, 10, 30]} castShadow receiveShadow>
            <boxGeometry args={[26, 20, 14]} />
          </mesh>
          {/* auxiliary / safeguard buildings around the base */}
          <mesh material={wall} position={[-44, 15, 0]} castShadow receiveShadow>
            <boxGeometry args={[34, 30, 70]} />
          </mesh>
          <mesh material={wall} position={[0, 9, -42]} castShadow receiveShadow>
            <boxGeometry args={[70, 18, 30]} />
          </mesh>
          {/* turbine hall (NE side) with roof monitor */}
          <mesh material={cladding} position={[118, 22, 0]} castShadow receiveShadow>
            <boxGeometry args={[150, 44, 74]} />
          </mesh>
          <mesh material={roof} position={[118, 44.6, 0]} castShadow>
            <boxGeometry args={[151, 1.2, 75]} />
          </mesh>
          <mesh material={cladding} position={[118, 48, 0]} castShadow>
            <boxGeometry args={[140, 6, 14]} />
          </mesh>
          {/* pipe/cable bridge reactor → turbine hall */}
          <mesh material={steel} position={[52, 26, 0]} castShadow>
            <boxGeometry args={[36, 5, 6]} />
          </mesh>
          {/* step-up transformers */}
          {[0, 1, 2].map((k) => (
            <mesh key={k} material={steel} position={[205, 6, -24 + k * 24]} castShadow>
              <boxGeometry args={[12, 12, 16]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Ventilation stack beside Unit 1 */}
      <mesh material={steel} position={[-120, 50, -150]} castShadow>
        <cylinderGeometry args={[2.6, 3.4, 100, 32]} />
      </mesh>

      {/* 400 kV lines leaving to the NE */}
      {new Array(7).fill(0).map((_, k) => (
        <group key={k} position={[420 + k * 260, 0, -300 - k * 170]} rotation-y={-0.58}>
          <LatticeTower mat={steel} />
        </group>
      ))}

      <Trees count={2600} />

      {/* Site lighting at night */}
      {night > 0.01
        ? lamps.map((p, i) => (
            <mesh key={i} position={[p[0], p[1], p[2]]} material={lamp} scale={1.6 + night * 1.2}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          ))
        : null}
    </group>
  );
};
