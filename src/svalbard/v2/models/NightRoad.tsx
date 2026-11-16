/**
 * Night arrival (Part 3 A): a snowy mountainside with a switchback road, a cargo truck with headlights climbing it,
 * and a tiny teal glow (the vault) far up the slope. Units: metres. Slope rises toward −z.
 * Terrain = CPU grid carved flat along the road; snow/rock vertex colours; rock normal map; moonlight + stars.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { usePBR } from "../../../kit/assets";
import { canvasTex, fbm, rng, sstep } from "../../three/util";
import { P } from "../palette";
import { Instanced, useSteelMat } from "./Corridor";
import { Stars } from "./Earth";
import { LightCone } from "./Portal";
import { SkyDome } from "./Crops";

type V = [number, number, number];

const baseH = (x: number, z: number) => 0.3 * Math.max(0, 40 - z) + (fbm(x / 90 + 2, z / 90 + 5, 4) - 0.5) * 22 + (fbm(x / 14, z / 14, 3) - 0.5) * 1.6;

/* ───────────── switchback road path (xz) ───────────── */
const ROAD_W = 6.5;
const LEG = { x: 62, dz: 30, r: 10 } as const;
const roadXZ = (() => {
  const pts: [number, number][] = [];
  let z = 40;
  for (let i = 0; i < 7; i++) {
    const s = i % 2 === 0 ? 1 : -1;
    for (let k = 0; k <= 24; k++) {
      const u = k / 24;
      pts.push([-s * LEG.x + 2 * s * LEG.x * u, z - LEG.dz * u]);
    }
    z -= LEG.dz;
    const cx = s * LEG.x;
    const cz = z - LEG.r;
    for (let k = 1; k < 12; k++) {
      const a = (k / 12) * Math.PI;
      pts.push([cx + s * LEG.r * Math.sin(a), cz + LEG.r * Math.cos(a)]);
    }
    z -= 2 * LEG.r;
  }
  // smooth + resample at ~1.5 m
  const c = new THREE.CatmullRomCurve3(pts.map(([x, zz]) => new THREE.Vector3(x, 0, zz)), false, "centripetal");
  const n = Math.round(c.getLength() / 1.5);
  return c.getSpacedPoints(n).map((p) => [p.x, p.z] as [number, number]);
})();
const roadH = roadXZ.map(([x, z]) => baseH(x, z));
const roadLen = (() => {
  const L = [0];
  for (let i = 1; i < roadXZ.length; i++) L.push(L[i - 1] + Math.hypot(roadXZ[i][0] - roadXZ[i - 1][0], roadXZ[i][1] - roadXZ[i - 1][1]));
  return L;
})();
export const ROAD_LENGTH = roadLen[roadLen.length - 1];

/** point + heading on the road at distance s (m) */
export const roadAt = (s: number): { p: V; yaw: number; pitch: number } => {
  let i = 1;
  while (i < roadLen.length - 1 && roadLen[i] < s) i++;
  const k = (s - roadLen[i - 1]) / (roadLen[i] - roadLen[i - 1]);
  const [x0, z0] = roadXZ[i - 1];
  const [x1, z1] = roadXZ[i];
  const y = roadH[i - 1] + (roadH[i] - roadH[i - 1]) * k;
  const d = Math.hypot(x1 - x0, z1 - z0);
  return { p: [x0 + (x1 - x0) * k, y, z0 + (z1 - z0) * k], yaw: Math.atan2(x1 - x0, z1 - z0), pitch: -Math.atan2(roadH[i] - roadH[i - 1], d) };
};

const last = roadXZ[roadXZ.length - 1];
export const GLOW_POS: V = [last[0] * 0.4, baseH(last[0] * 0.4, last[1] - 60) + 2, last[1] - 60];

/** nearest road sample (distance, index) — coarse grid acceleration */
const nearestRoad = (x: number, z: number) => {
  let best = 1e9;
  let bi = 0;
  for (let i = 0; i < roadXZ.length; i += 3) {
    const dx = roadXZ[i][0] - x;
    const dz = roadXZ[i][1] - z;
    const d = dx * dx + dz * dz;
    if (d < best) {
      best = d;
      bi = i;
    }
  }
  for (let i = Math.max(0, bi - 3); i < Math.min(roadXZ.length, bi + 4); i++) {
    const dx = roadXZ[i][0] - x;
    const dz = roadXZ[i][1] - z;
    const d = dx * dx + dz * dz;
    if (d < best) {
      best = d;
      bi = i;
    }
  }
  return { d: Math.sqrt(best), i: bi };
};

const T = { x0: -260, x1: 260, z0: -560, z1: 120, nx: 170, nz: 220 } as const;

const useTerrain = () =>
  useMemo(() => {
    const g = new THREE.PlaneGeometry(T.x1 - T.x0, T.z1 - T.z0, T.nx, T.nz);
    g.rotateX(-Math.PI / 2);
    g.translate((T.x0 + T.x1) / 2, 0, (T.z0 + T.z1) / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    const col = new Float32Array(p.count * 3);
    const snow = new THREE.Color("#e3eaf1");
    const rock = new THREE.Color("#353b44");
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const h0 = baseH(x, z);
      const n = nearestRoad(x, z);
      const k = sstep(ROAD_W * 0.55, ROAD_W * 1.9, n.d);
      // carved road bed with a small snow bank on its edge
      const bank = Math.exp(-Math.pow((n.d - ROAD_W * 0.75) / 0.9, 2)) * 0.5;
      p.setY(i, roadH[n.i] - 0.05 + (h0 - roadH[n.i]) * k + bank);
      const r = sstep(0.62, 0.74, fbm(x / 26 + 9, z / 26 + 3, 4)) * sstep(ROAD_W, ROAD_W * 2, n.d);
      c.copy(snow).lerp(rock, r * 0.85);
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, []);

const useRoadGeo = () =>
  useMemo(() => {
    const n = roadXZ.length;
    const pos = new Float32Array(n * 2 * 3);
    const uv = new Float32Array(n * 2 * 2);
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = roadXZ[Math.max(0, i - 1)];
      const b = roadXZ[Math.min(n - 1, i + 1)];
      const tx = b[0] - a[0];
      const tz = b[1] - a[1];
      const l = Math.hypot(tx, tz) || 1;
      const nx = -tz / l;
      const nz = tx / l;
      const [x, z] = roadXZ[i];
      for (let s = 0; s < 2; s++) {
        const o = (s === 0 ? -1 : 1) * ROAD_W * 0.5;
        pos.set([x + nx * o, roadH[i] + 0.04, z + nz * o], (i * 2 + s) * 3);
        uv.set([s, roadLen[i] / 8], (i * 2 + s) * 2);
      }
      if (i < n - 1) {
        const q = i * 2;
        idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    if (g.attributes.normal.getY(0) < 0) g.index!.array.reverse();
    g.computeVertexNormals();
    return g;
  }, []);

const useRoadMat = () =>
  useMemo(() => {
    const tex = canvasTex(
      128,
      512,
      (g) => {
        const r = rng(4);
        g.fillStyle = "#b9c3cd";
        g.fillRect(0, 0, 128, 512);
        // compacted tyre tracks (darker, slightly icy)
        for (const cx of [30, 98]) {
          const gr = g.createLinearGradient(cx - 16, 0, cx + 16, 0);
          gr.addColorStop(0, "rgba(60,70,82,0)");
          gr.addColorStop(0.5, "rgba(60,70,82,0.85)");
          gr.addColorStop(1, "rgba(60,70,82,0)");
          g.fillStyle = gr;
          g.fillRect(cx - 16, 0, 32, 512);
        }
        for (let i = 0; i < 1400; i++) {
          g.fillStyle = `rgba(${r() < 0.5 ? "230,236,242" : "70,80,92"},${0.15 + r() * 0.3})`;
          g.fillRect(r() * 128, r() * 512, 1 + r() * 2, 2 + r() * 5);
        }
        // snow edges
        const e = g.createLinearGradient(0, 0, 128, 0);
        e.addColorStop(0, "rgba(232,238,243,1)");
        e.addColorStop(0.12, "rgba(232,238,243,0)");
        e.addColorStop(0.88, "rgba(232,238,243,0)");
        e.addColorStop(1, "rgba(232,238,243,1)");
        g.fillStyle = e;
        g.fillRect(0, 0, 128, 512);
      },
      [1, 1],
    );
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 });
  }, []);

/* ───────────── road poles (instanced) ───────────── */
const Poles: React.FC = () => {
  const { pole, tip, mats } = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (let i = 4; i < roadXZ.length - 4; i += 9) {
      const a = roadXZ[i - 1];
      const b = roadXZ[i + 1];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const nx = -(b[1] - a[1]) / l;
      const nz = (b[0] - a[0]) / l;
      const [x, z] = roadXZ[i];
      out.push(new THREE.Matrix4().makeTranslation(x + nx * ROAD_W * 0.62, roadH[i] + 0.8, z + nz * ROAD_W * 0.62));
    }
    return {
      pole: new THREE.CylinderGeometry(0.035, 0.035, 1.6, 6),
      tip: new THREE.BoxGeometry(0.09, 0.14, 0.02),
      mats: out,
    };
  }, []);
  const poleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1d2733", roughness: 0.6 }), []);
  const tipMat = useMemo(() => new THREE.MeshStandardMaterial({ color: P.snow, emissive: P.snow, emissiveIntensity: 0.35, roughness: 0.3 }), []);
  const tipMats = useMemo(() => mats.map((m) => m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.65, 0))), [mats]);
  return (
    <>
      <Instanced geo={pole} mat={poleMat} mats={mats} />
      <Instanced geo={tip} mat={tipMat} mats={tipMats} />
    </>
  );
};

/* ───────────── cargo truck ───────────── */
const Truck: React.FC<{ readonly s: number }> = ({ s }) => {
  const { p, yaw, pitch } = roadAt(s);
  const box = useSteelMat([3, 1], "#c9d1d9", 0.45, 0.6);
  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color: "#dfe5ea", roughness: 0.35, metalness: 0.2 }), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#14191f", roughness: 0.7 }), []);
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0c141d", roughness: 0.08, metalness: 0.6 }), []);
  const lamp = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff6e6", emissive: "#fff3dc", emissiveIntensity: 8, toneMapped: false }), []);
  const amberM = useMemo(() => new THREE.MeshStandardMaterial({ color: P.amber, emissive: P.amber, emissiveIntensity: 6, toneMapped: false }), []);
  const tgt = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0, 0, 30);
    return o;
  }, []);
  const wheels: V[] = [
    [-1.1, 0.5, 3.0],
    [1.1, 0.5, 3.0],
    [-1.1, 0.5, -1.6],
    [1.1, 0.5, -1.6],
    [-1.1, 0.5, -2.9],
    [1.1, 0.5, -2.9],
  ];
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <group rotation={[pitch, 0, 0]}>
        {/* chassis */}
        <mesh position={[0, 0.75, 0]} material={dark} castShadow>
          <boxGeometry args={[2.0, 0.35, 8.4]} />
        </mesh>
        {/* cab */}
        <mesh position={[0, 1.95, 3.2]} material={paint} castShadow>
          <boxGeometry args={[2.4, 2.3, 2.0]} />
        </mesh>
        <mesh position={[0, 2.35, 4.21]} material={glass}>
          <boxGeometry args={[2.2, 1.0, 0.02]} />
        </mesh>
        {/* cargo box */}
        <mesh position={[0, 2.25, -1.2]} material={box} castShadow>
          <boxGeometry args={[2.5, 2.9, 6.0]} />
        </mesh>
        {wheels.map((w, i) => (
          <mesh key={i} position={w} rotation={[0, 0, Math.PI / 2]} material={dark}>
            <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} />
          </mesh>
        ))}
        {/* headlights, marker lamps */}
        {[-0.85, 0.85].map((x) => (
          <group key={x}>
            <mesh position={[x, 1.05, 4.22]} material={lamp}>
              <boxGeometry args={[0.38, 0.2, 0.04]} />
            </mesh>
            <group position={[x, 1.05, 4.3]} rotation={[-Math.PI / 2 + 0.06, 0, 0]}>
              <LightCone position={[0, 0, 0]} height={26} radius={4.2} color="#fff1d8" strength={0.55} />
            </group>
          </group>
        ))}
        {[-1.2, 1.2].map((x) => (
          <mesh key={x} position={[x, 3.68, 1.75]} material={amberM}>
            <boxGeometry args={[0.1, 0.08, 0.1]} />
          </mesh>
        ))}
        {[-1.0, 1.0].map((x) => (
          <mesh key={`r${x}`} position={[x, 1.0, -4.22]} material={amberM}>
            <boxGeometry args={[0.25, 0.15, 0.03]} />
          </mesh>
        ))}
        <primitive object={tgt} />
        <spotLight position={[0, 1.2, 4.4]} target={tgt} angle={0.42} penumbra={0.6} intensity={900} distance={70} decay={1.6} color="#fff1dc" />
        <pointLight position={[0, 1.0, -5]} intensity={6} distance={8} decay={2} color={P.amber} />
      </group>
    </group>
  );
};

/* ───────────── distant vault glow ───────────── */
const useGlowTex = () =>
  useMemo(
    () =>
      canvasTex(128, 128, (g) => {
        const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, "rgba(255,255,255,1)");
        gr.addColorStop(0.15, "rgba(255,255,255,0.55)");
        gr.addColorStop(0.5, "rgba(255,255,255,0.12)");
        gr.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = gr;
        g.fillRect(0, 0, 128, 128);
      }),
    [],
  );

export const VaultGlow: React.FC<{ readonly k: number; readonly size?: number }> = ({ k, size = 70 }) => {
  const tex = useGlowTex();
  const [x, y, z] = GLOW_POS;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[4.5, 7, 9]} />
        <meshStandardMaterial color={P.concrete} roughness={0.9} />
      </mesh>
      <mesh position={[0, 5, 4.55]}>
        <planeGeometry args={[4.2, 3.5]} />
        <meshStandardMaterial color="#0b2b28" emissive={P.vaultTeal} emissiveIntensity={6 * k} toneMapped={false} />
      </mesh>
      <sprite position={[0, 5, 6]} scale={[size, size, 1]}>
        <spriteMaterial map={tex} color={P.vaultTeal} transparent opacity={0.55 * k} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </sprite>
      <pointLight position={[0, 6, 10]} color={P.vaultTeal} intensity={1800 * k} distance={90} decay={1.8} />
    </group>
  );
};

/* ───────────── blowing snow (deterministic) ───────────── */
export const SnowFall: React.FC<{ readonly t: number; readonly center: V; readonly size: number; readonly count?: number; readonly px?: number }> = ({ t, center, size, count = 1800, px = 0.18 }) => {
  const { geo, seeds } = useMemo(() => {
    const r = rng(11);
    const sd = new Float32Array(count * 4);
    for (let i = 0; i < count * 4; i++) sd[i] = r();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return { geo: g, seeds: sd };
  }, [count]);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < count; i++) {
    const fall = (seeds[i * 4 + 1] - t * (0.08 + 0.05 * seeds[i * 4 + 3])) % 1;
    const wind = (seeds[i * 4] + t * 0.05) % 1;
    pos.setXYZ(i, center[0] + (wind - 0.5) * size, center[1] + (((fall + 1) % 1) - 0.5) * size, center[2] + (seeds[i * 4 + 2] - 0.5) * size);
  }
  pos.needsUpdate = true;
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial color={P.snow} size={px} sizeAttenuation transparent opacity={0.75} depthWrite={false} />
    </points>
  );
};

/* ───────────── whole night scene ───────────── */
export const NightRoad: React.FC<{ readonly truckS: number; readonly t: number; readonly glow: number; readonly cam: V }> = ({ truckS, t, glow, cam }) => {
  const geo = useTerrain();
  const roadGeo = useRoadGeo();
  const roadMat = useRoadMat();
  const pbr = usePBR("rock_boulder_dry", [40, 52]);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        normalMap: pbr.normalMap,
        normalScale: new THREE.Vector2(0.9, 0.9),
        roughnessMap: pbr.roughnessMap,
        roughness: 0.92,
      }),
    [pbr],
  );
  return (
    <group>
      <SkyDome top={P.night} horizon="#16263a" r={1500} />
      <Stars count={1800} radius={1400} />
      <fogExp2 attach="fog" args={["#0e1926", 0.0042]} />
      <hemisphereLight args={["#5d7290", "#0a1018", 0.35]} />
      {/* moonlight */}
      <directionalLight
        position={[-220, 260, 120]}
        intensity={0.55}
        color="#a9bedb"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-260}
        shadow-camera-right={260}
        shadow-camera-top={260}
        shadow-camera-bottom={-260}
        shadow-camera-near={10}
        shadow-camera-far={1200}
        shadow-bias={-0.0005}
        shadow-normalBias={1.5}
      />
      <mesh geometry={geo} material={mat} receiveShadow />
      <mesh geometry={roadGeo} material={roadMat} receiveShadow />
      <Poles />
      <Truck s={truckS} />
      <VaultGlow k={glow} />
      <SnowFall t={t} center={[cam[0], cam[1] - 25, cam[2] - 30]} size={70} px={0.22} />
    </group>
  );
};
