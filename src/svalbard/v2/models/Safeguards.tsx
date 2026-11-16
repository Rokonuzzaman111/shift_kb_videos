/**
 * Svalbard v2 · Part 4 (A–C) props. Units: metres unless noted (CoastSection uses 1 unit = 10 m).
 *  CoastSection    — side cross-section diorama of Platåberget: rock strata cut face, snowy slope, plateau ice cap that
 *                    melts, rising sea (wave plane + water body), vault wedge with teal glow, amber 130 m ruler.
 *  PermafrostRock  — macro of dark frozen rock: displaced PBR rock, glossy ice filling the cracks, growing frost plates.
 *  BreakerPanel    — steel breaker panel: rows of breakers with teal LEDs, main breaker trips, spark burst, lamp dies.
 *  WallThermometer — rugged digital thermometer on frosted white rock; live LCD (value + trend line).
 */
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { usePBR } from "../../../kit/assets";
import { numFont } from "../../theme";
import { canvasTex, fbm, grain, rng } from "../../three/util";
import { P } from "../palette";
import { Instanced, frostify, useSteelMat, useWhiteRockMat } from "./Corridor";
import { m4 } from "./SeedMacro";

type V = readonly [number, number, number];
const v3 = (p: V) => p as [number, number, number];

/* ═════════════════════════ A · coast cross-section ═════════════════════════ */
/** terrain profile (x, y) in 10 m units; sea level today = 0 */
const PROFILE: [number, number][] = [
  [-70, -32],
  [-70, -9],
  [-30, -8.4],
  [-14, -6.5],
  [-6, -0.8],
  [-2, 1.6],
  [4, 5.8],
  [9, 10.6],
  [12, 12.6],
  [15, 13.2],
  [19, 16.5],
  [25, 23],
  [31, 28.2],
  [80, 29],
  [80, -32],
];
export const VAULT_PT: V = [13, 13, 0];
export const COAST_DEPTH = 40;

const useStrataTex = () =>
  useMemo(() => {
    const W = 512;
    const H = 1024;
    return canvasTex(
      W,
      H,
      (g) => {
        grain(g, W, H, [96, 94, 90], 20, 11);
        const r = rng(4);
        // horizontal sedimentary bands (sandstone / shale), slight waviness
        for (let i = 0; i < 26; i++) {
          const y = (i / 26) * H + r() * 20;
          const th = 6 + r() * 30;
          const l = 70 + Math.floor(r() * 70);
          g.fillStyle = `rgba(${l + 6},${l + 3},${l},0.5)`;
          g.beginPath();
          g.moveTo(0, y);
          for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 6);
          g.lineTo(W, y + th);
          for (let x = W; x >= 0; x -= 32) g.lineTo(x, y + th + Math.sin(x * 0.012 + i * 2) * 5);
          g.closePath();
          g.fill();
        }
        for (let i = 0; i < 900; i++) {
          g.fillStyle = `rgba(232,238,243,${0.03 + r() * 0.06})`;
          g.fillRect(r() * W, r() * H, 1 + r() * 3, 1);
        }
      },
      [1 / 40, 1 / 70],
    );
  }, []);

const RidgeBack: React.FC<{ readonly mat: THREE.Material }> = ({ mat }) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-90, -10);
    const r = rng(9);
    for (let x = -90; x <= 100; x += 10) s.lineTo(x, 22 + Math.sin(x * 0.05) * 6 + r() * 3);
    s.lineTo(100, -10);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 10, bevelEnabled: false });
  }, []);
  return <mesh geometry={geo} material={mat} position={[0, 0, -95]} />;
};

export const CoastSection: React.FC<{ readonly t: number; readonly sea: number; readonly melt: number; readonly ruler: number; readonly glow: number }> = ({
  t,
  sea,
  melt,
  ruler,
  glow,
}) => {
  const rock = usePBR("rock_boulder_dry", [0.12, 0.12]);
  const strata = useStrataTex();
  const conc = usePBR("concrete_wall_008", [0.5, 0.5]);
  const mats = useMemo(() => {
    const cut = new THREE.MeshStandardMaterial({ map: strata, normalMap: rock.normalMap, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.9 });
    const top = frostify(new THREE.MeshStandardMaterial({ color: "#dfe7ee", roughnessMap: rock.roughnessMap, normalMap: rock.normalMap, roughness: 0.85 }), 0.6, 0.3);
    const back = new THREE.MeshStandardMaterial({ color: "#46505c", roughness: 0.95 });
    const ice = new THREE.MeshPhysicalMaterial({ color: "#d6e6f1", roughness: 0.25, clearcoat: 0.6, normalMap: rock.normalMap, normalScale: new THREE.Vector2(0.25, 0.25) });
    const water = new THREE.MeshStandardMaterial({ color: "#1f4a6a", roughness: 0.3, metalness: 0, envMapIntensity: 0.5, transparent: true, opacity: 0.95 });
    const body = new THREE.MeshStandardMaterial({ color: "#1d4d6c", emissive: "#0b2a3e", roughness: 0.3, transparent: true, opacity: 0.9 });
    const vault = new THREE.MeshStandardMaterial({ map: conc.map, normalMap: conc.normalMap, roughness: 0.9, color: "#b4b8bc" });
    const teal = new THREE.MeshStandardMaterial({ color: P.vaultTeal, emissive: P.vaultTeal, emissiveIntensity: 2.2 });
    const amber = new THREE.MeshStandardMaterial({ color: P.amber, emissive: P.amber, emissiveIntensity: 1.8, roughness: 0.4 });
    return { cut, top, back, ice, water, body, vault, teal, amber };
  }, [rock, strata, conc]);

  const terrain = useMemo(() => {
    const s = new THREE.Shape();
    PROFILE.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: COAST_DEPTH, bevelEnabled: false, curveSegments: 1 });
    g.translate(0, 0, -COAST_DEPTH);
    return g;
  }, []);

  // ice cap on the plateau: dome profile, melts (thins + recedes from the cliff edge)
  const capGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      s.lineTo(u * 48, Math.pow(Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5), 0.6) * 8 + Math.sin(u * 30) * 0.15);
    }
    s.lineTo(48, 0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: COAST_DEPTH - 2, bevelEnabled: true, bevelThickness: 0.6, bevelSize: 0.6, bevelSegments: 2 });
    g.translate(0, 0, -COAST_DEPTH + 1);
    return g;
  }, []);

  // wave surface (re-displaced every frame; deterministic)
  const wave = useMemo(() => {
    const g = new THREE.PlaneGeometry(90, COAST_DEPTH, 90, 24);
    g.rotateX(-Math.PI / 2);
    g.translate(-25, 0, -COAST_DEPTH / 2);
    return g;
  }, []);
  const pos = wave.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, Math.sin(x * 0.55 + t * 2.2) * 0.12 + Math.sin(z * 0.7 - t * 1.6 + x * 0.2) * 0.08);
  }
  pos.needsUpdate = true;
  wave.computeVertexNormals();

  // floating ice floes in the bay, shrinking as the ice melts
  const floeGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const floes = useMemo(() => {
    const r = rng(21);
    return Array.from({ length: 14 }, () => ({ x: -60 + r() * 50, z: -4 - r() * 30, s: 0.8 + r() * 1.6, ry: r() * 6 }));
  }, []);
  const floeMats = floes.map((f) => {
    const k = Math.max(0.05, 1 - melt * 0.9);
    return m4([f.x + Math.sin(t * 0.4 + f.ry) * 0.3, sea + 0.05, f.z], [f.s * k * 1.4, f.s * k * 0.35, f.s * k], [0, f.ry, 0]);
  });

  // ruler ticks every 10 m (1 unit) up to the vault level
  const tickGeo = useMemo(() => new THREE.BoxGeometry(1, 0.08, 0.1), []);
  const RX = -3;
  const top = 13 * ruler;
  const ticks: THREE.Matrix4[] = [];
  for (let i = 0; i <= 13; i++) if (i <= top + 0.01) ticks.push(m4([RX + (i % 5 === 0 ? 0.55 : 0.35), i, 2], [i % 5 === 0 ? 1.1 : 0.7, 1, 1]));
  const dash = ruler > 0.98 ? Math.min(1, (ruler - 0.98) * 50) : 0;

  return (
    <group>
      <mesh geometry={terrain} material={[mats.cut, mats.top]} castShadow receiveShadow />
      <RidgeBack mat={mats.back} />
      {/* ice cap */}
      <mesh geometry={capGeo} material={mats.ice} position={[31 + melt * 9, 28.4, 0]} scale={[1 - melt * 0.25, Math.max(0.12, 1 - melt * 0.82), 1]} castShadow receiveShadow />
      {/* sea: water body sits 5 cm behind the cut plane so the rock face hides it inside the ground */}
      <mesh material={mats.body} position={[-25, (sea - 32) / 2, -COAST_DEPTH / 2 - 0.05]}>
        <boxGeometry args={[90, sea + 32, COAST_DEPTH - 0.1]} />
      </mesh>
      <mesh geometry={wave} material={mats.water} position={[0, sea + 0.02, -0.05]} receiveShadow />
      <Instanced geo={floeGeo} mat={mats.ice} mats={floeMats} />
      {/* vault wedge sticking out of the slope */}
      <group position={v3(VAULT_PT)} scale={1.6}>
        <mesh material={mats.vault} position={[-0.6, 0.9, -1.2]} rotation={[0, 0, 0.12]} castShadow>
          <boxGeometry args={[2.2, 2.0, 1.6]} />
        </mesh>
        <mesh material={mats.teal} position={[-1.72, 1.35, -1.2]}>
          <boxGeometry args={[0.05, 0.8, 1.2]} />
        </mesh>
        <pointLight position={[-2.6, 1.4, 0.8]} color={P.vaultTeal} intensity={140 * glow} distance={16} decay={2} />
      </group>
      {/* amber 130 m ruler (sea level today → vault) */}
      {ruler > 0.001 ? (
        <group>
          <mesh material={mats.amber} position={[RX, top / 2, 2]}>
            <boxGeometry args={[0.14, Math.max(0.01, top), 0.14]} />
          </mesh>
          <Instanced geo={tickGeo} mat={mats.amber} mats={ticks} />
          <mesh material={mats.amber} position={[RX + 0.0, 0, 2]}>
            <boxGeometry args={[1.8, 0.12, 0.14]} />
          </mesh>
          {dash > 0 ? (
            <mesh material={mats.amber} position={[RX + (VAULT_PT[0] - 2 - RX) * dash * 0.5, 13, 2]}>
              <boxGeometry args={[(VAULT_PT[0] - 2 - RX) * dash, 0.1, 0.1]} />
            </mesh>
          ) : null}
        </group>
      ) : null}
    </group>
  );
};

/* ═════════════════════════ B · permafrost rock macro ═════════════════════════ */
const ROCK = 0.7; // plane size (m)
const SEG = 180;
const CR = 512; // crack canvas res

type Crack = { pts: [number, number][]; w: number };
const makeCracks = (): Crack[] => {
  const r = rng(33);
  const out: Crack[] = [];
  for (let c = 0; c < 9; c++) {
    let x = r() * CR;
    let y = r() * CR;
    let a = r() * Math.PI * 2;
    const pts: [number, number][] = [[x, y]];
    const n = 14 + Math.floor(r() * 14);
    for (let i = 0; i < n; i++) {
      a += (r() - 0.5) * 0.9;
      const st = 12 + r() * 16;
      x += Math.cos(a) * st;
      y += Math.sin(a) * st;
      pts.push([x, y]);
    }
    out.push({ pts, w: c < 3 ? 9 + r() * 5 : 3 + r() * 4 });
  }
  return out;
};

export const PermafrostRock: React.FC<{ readonly grow: number }> = ({ grow }) => {
  const pbr = usePBR("rock_boulder_dry", [2.5, 2.5]);
  const data = useMemo(() => {
    const cracks = makeCracks();
    const cv = document.createElement("canvas");
    cv.width = cv.height = CR;
    const g = cv.getContext("2d")!;
    g.fillStyle = "#000";
    g.fillRect(0, 0, CR, CR);
    g.strokeStyle = "#fff";
    g.lineCap = "round";
    g.lineJoin = "round";
    g.shadowColor = "#fff";
    g.shadowBlur = 4;
    for (const c of cracks) {
      g.lineWidth = c.w;
      g.beginPath();
      c.pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    }
    const img = g.getImageData(0, 0, CR, CR).data;
    const mask = (u: number, v: number) => {
      const x = Math.min(CR - 1, Math.max(0, Math.floor(u * CR)));
      const y = Math.min(CR - 1, Math.max(0, Math.floor(v * CR)));
      return img[(y * CR + x) * 4] / 255;
    };
    const alpha = new THREE.CanvasTexture(cv);
    alpha.colorSpace = THREE.NoColorSpace;
    const height = (u: number, v: number) => fbm(u * 6, v * 6, 5) * 0.035 + fbm(u * 26 + 7, v * 26, 3) * 0.006;
    const rockG = new THREE.PlaneGeometry(ROCK, ROCK, SEG, SEG);
    rockG.rotateX(-Math.PI / 2);
    const iceG = rockG.clone();
    const rp = rockG.attributes.position as THREE.BufferAttribute;
    const ip = iceG.attributes.position as THREE.BufferAttribute;
    const uv = rockG.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < rp.count; i++) {
      const u = uv.getX(i);
      const v = 1 - uv.getY(i);
      const h = height(u, v);
      rp.setY(i, h - mask(u, v) * 0.012);
      ip.setY(i, h + 0.0008);
    }
    rockG.computeVertexNormals();
    iceG.computeVertexNormals();
    // frost crystal sites along the cracks (world xz + height + growth delay)
    const r = rng(77);
    const sites: { p: V; s: number; rot: V; d: number }[] = [];
    cracks.forEach((c) =>
      c.pts.forEach(([x, y], i) => {
        if (x < 0 || y < 0 || x > CR || y > CR) return;
        for (let k = 0; k < 3; k++) {
          const u = (x + (r() - 0.5) * c.w * 2.2) / CR;
          const v = (y + (r() - 0.5) * c.w * 2.2) / CR;
          sites.push({ p: [(u - 0.5) * ROCK, height(u, v) + 0.001, (v - 0.5) * ROCK], s: 0.0015 + r() * 0.004, rot: [r() * 1.2 - 0.6, r() * 6.28, r() * 1.2 - 0.6], d: (i / c.pts.length) * 0.5 + r() * 0.4 });
        }
      }),
    );
    return { alpha, rockG, iceG, sites };
  }, []);
  const mats = useMemo(() => {
    const rock = frostify(
      new THREE.MeshStandardMaterial({ map: pbr.map, normalMap: pbr.normalMap, roughnessMap: pbr.roughnessMap, normalScale: new THREE.Vector2(1.4, 1.4), color: "#3a4049" }),
      0.16,
      9,
    );
    const ice = new THREE.MeshPhysicalMaterial({
      color: "#cfe3f1",
      roughness: 0.06,
      clearcoat: 1,
      alphaMap: data.alpha,
      transparent: true,
      opacity: 0.9,
      emissive: P.steel,
      emissiveIntensity: 0.12,
      envMapIntensity: 1.1,
      depthWrite: false,
    });
    const frost = new THREE.MeshStandardMaterial({ color: P.snow, roughness: 0.25, emissive: "#9fc0dc", emissiveIntensity: 0.08, envMapIntensity: 0.8 });
    return { rock, ice, frost };
  }, [pbr, data]);
  const hexGeo = useMemo(() => new THREE.CylinderGeometry(1, 1, 0.12, 6), []);
  const crystals = data.sites.map((s) => {
    const k = Math.min(1, Math.max(0, (grow - s.d) / 0.4));
    const sc = s.s * Math.pow(k, 0.7) + 1e-5;
    return m4(s.p, [sc, sc, sc], s.rot);
  });
  return (
    <group>
      <mesh geometry={data.rockG} material={mats.rock} receiveShadow castShadow />
      <mesh geometry={data.iceG} material={mats.ice} />
      <Instanced geo={hexGeo} mat={mats.frost} mats={crystals} shadows />
    </group>
  );
};

/* ═════════════════════════ C1 · breaker panel ═════════════════════════ */
export const PANEL = { w: 0.56, h: 0.72, d: 0.12 } as const;
export const MAIN_POS: V = [-PANEL.w / 2 + 0.09, PANEL.h / 2 - 0.13, PANEL.d / 2 + 0.03];

const panelLabelTex = () =>
  canvasTex(1024, 128, (g) => {
    g.fillStyle = "#e3e8ec";
    g.fillRect(0, 0, 1024, 128);
    g.fillStyle = P.night;
    g.font = "bold 46px Arial, sans-serif";
    g.fillText("MAIN", 30, 80);
    g.font = "30px Arial, sans-serif";
    for (let i = 0; i < 8; i++) g.fillText(`C${i + 1}`, 250 + i * 95, 78);
  });

export const BreakerPanel: React.FC<{ readonly t: number; readonly cut: number }> = ({ t, cut }) => {
  const steel = useSteelMat([1, 1.4], "#9aa4ae", 0.45, 0.8);
  const conc = usePBR("concrete_wall_008", [1.5, 1.5]);
  const mats = useMemo(() => {
    const wall = new THREE.MeshStandardMaterial({ map: conc.map, normalMap: conc.normalMap, roughnessMap: conc.roughnessMap, color: "#9ea3a8" });
    const plastic = new THREE.MeshStandardMaterial({ color: "#1c2126", roughness: 0.45 });
    const lever = new THREE.MeshStandardMaterial({ color: "#d7dce1", roughness: 0.35 });
    const ledOn = new THREE.MeshStandardMaterial({ color: P.vaultTeal, emissive: P.vaultTeal, emissiveIntensity: 3 });
    const ledOff = new THREE.MeshStandardMaterial({ color: "#1b2a2a", roughness: 0.3 });
    const label = new THREE.MeshStandardMaterial({ map: panelLabelTex(), roughness: 0.7 });
    const spark = new THREE.MeshBasicMaterial({ color: P.amber, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    return { wall, plastic, lever, ledOn, ledOff, label, spark };
  }, [conc]);
  const bodyGeo = useMemo(() => new THREE.BoxGeometry(0.045, 0.1, 0.05), []);
  const levGeo = useMemo(() => new THREE.BoxGeometry(0.014, 0.032, 0.02), []);
  const ledGeo = useMemo(() => new THREE.SphereGeometry(0.0045, 10, 8), []);
  const sparkGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const off = t >= cut;
  // breakers: 2 rows × 8
  const bodies: THREE.Matrix4[] = [];
  const levers: THREE.Matrix4[] = [];
  const leds: THREE.Matrix4[] = [];
  const zf = PANEL.d / 2 + 0.025;
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 8; i++) {
      const x = -PANEL.w / 2 + 0.17 + i * 0.048;
      const y = PANEL.h / 2 - 0.15 - row * 0.2;
      bodies.push(m4([x, y, zf], [1, 1, 1]));
      levers.push(m4([x, y + 0.008, zf + 0.03], [1, 1, 1], [-0.5, 0, 0]));
      leds.push(m4([x, y + 0.062, zf + 0.004], [1, 1, 1]));
    }
  const trip = Math.min(1, Math.max(0, (t - cut) / 0.08));
  // spark burst from the main breaker
  const st = t - cut;
  const sparks: THREE.Matrix4[] = [];
  if (st > 0 && st < 0.5) {
    const r = rng(5);
    for (let i = 0; i < 44; i++) {
      const vx = (r() - 0.5) * 1.6;
      const vy = r() * 1.2 + 0.2;
      const vz = r() * 0.9 + 0.2;
      const life = 0.2 + r() * 0.3;
      if (st > life) {
        r();
        continue;
      }
      const p: V = [MAIN_POS[0] + vx * st, MAIN_POS[1] + vy * st - 4.9 * st * st, MAIN_POS[2] + 0.03 + vz * st];
      const len = 0.012 * (1 - st / life) + 0.002;
      const ang = Math.atan2(vy - 9.8 * st, vx);
      sparks.push(m4(p, [len, 0.0018, 0.0018], [0, 0, ang]));
      r();
    }
  }
  return (
    <group>
      <mesh material={mats.wall} position={[0, 0, -0.01]} receiveShadow>
        <planeGeometry args={[3, 3]} />
      </mesh>
      <RoundedBox args={[PANEL.w, PANEL.h, PANEL.d]} radius={0.01} smoothness={3} material={steel} castShadow receiveShadow position={[0, 0, PANEL.d / 2]} />
      {/* inner backplate */}
      <mesh material={mats.plastic} position={[0, 0, PANEL.d + 0.001]}>
        <planeGeometry args={[PANEL.w - 0.05, PANEL.h - 0.05]} />
      </mesh>
      <mesh material={mats.label} position={[0.02, PANEL.h / 2 - 0.045, PANEL.d + 0.002]}>
        <planeGeometry args={[PANEL.w - 0.08, 0.04]} />
      </mesh>
      <Instanced geo={bodyGeo} mat={mats.plastic} mats={bodies} shadows />
      <Instanced geo={levGeo} mat={mats.lever} mats={levers} />
      <Instanced geo={ledGeo} mat={off ? mats.ledOff : mats.ledOn} mats={leds} />
      {/* main breaker */}
      <group position={v3(MAIN_POS)}>
        <mesh material={mats.plastic} castShadow>
          <boxGeometry args={[0.09, 0.14, 0.06]} />
        </mesh>
        <mesh material={mats.lever} position={[0, 0.01 - 0.03 * trip, 0.04]} rotation={[-0.6 + 1.2 * trip, 0, 0]}>
          <boxGeometry args={[0.05, 0.04, 0.025]} />
        </mesh>
        <mesh material={off ? mats.ledOff : mats.ledOn} position={[0.03, 0.06, 0.031]}>
          <sphereGeometry args={[0.006, 10, 8]} />
        </mesh>
      </group>
      {sparks.length ? <Instanced geo={sparkGeo} mat={mats.spark} mats={sparks} /> : null}
      {st > 0 && st < 0.25 ? <pointLight position={[MAIN_POS[0], MAIN_POS[1], MAIN_POS[2] + 0.08]} color={P.amber} intensity={3 * (1 - st / 0.25)} distance={1.2} decay={2} /> : null}
    </group>
  );
};

/* ═════════════════════════ C2 · wall thermometer ═════════════════════════ */
export const THERMO = { w: 0.17, h: 0.24, d: 0.045 } as const;

/** one canvas + texture, redrawn every render (no per-frame GPU allocations) */
const useLcd = () =>
  useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 320;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { cv, tex };
  }, []);

export const WallThermometer: React.FC<{ readonly temp: number; readonly hist: number; readonly t: number }> = ({ temp, hist, t }) => {
  const lcd = useLcd();
  const wall = useWhiteRockMat([1.2, 1.2], 0.7);
  const mats = useMemo(() => {
    const shell = new THREE.MeshStandardMaterial({ color: "#1d2329", roughness: 0.55 });
    const screen = new THREE.MeshStandardMaterial({ map: lcd.tex, emissiveMap: lcd.tex, emissive: "#ffffff", emissiveIntensity: 0.9, roughness: 0.15 });
    const cable = new THREE.MeshStandardMaterial({ color: "#2a3036", roughness: 0.6 });
    return { shell, screen, cable };
  }, [lcd]);
  // draw LCD
  const g = lcd.cv.getContext("2d")!;
  g.fillStyle = "#081016";
  g.fillRect(0, 0, 512, 320);
  g.fillStyle = "rgba(57,224,200,0.08)";
  for (let y = 0; y < 320; y += 4) g.fillRect(0, y, 512, 1);
  g.fillStyle = P.alert;
  g.font = `700 26px ${numFont}, Arial`;
  g.fillText(Math.floor(t * 2) % 2 === 0 ? "● MAINS OFF" : "○ MAINS OFF", 22, 40);
  g.fillStyle = "rgba(232,238,243,0.7)";
  g.fillText("VAULT 2 · BACKUP: PERMAFROST", 22, 300);
  g.fillStyle = P.amber;
  g.font = `900 120px ${numFont}, Arial`;
  const s = `${temp < 0 ? "−" : ""}${Math.abs(temp).toFixed(1)}°`;
  g.fillText(s, 22, 168);
  // trend: flat at −18, then rising and levelling off
  g.strokeStyle = P.amber;
  g.lineWidth = 4;
  g.beginPath();
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    if (u > hist) break;
    const val = u < 0.25 ? -18 : -18 + 14 * (1 - Math.pow(1 - (u - 0.25) / 0.75, 3));
    const x = 22 + u * 468;
    const y = 262 - ((val + 20) / 18) * 60;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
  g.strokeStyle = "rgba(57,224,200,0.6)";
  g.setLineDash([8, 8]);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(22, 262 - (20 / 18) * 60);
  g.lineTo(490, 262 - (20 / 18) * 60);
  g.stroke();
  g.setLineDash([]);
  lcd.tex.needsUpdate = true;

  return (
    <group>
      <mesh material={wall} position={[0, 0, -0.005]} receiveShadow>
        <planeGeometry args={[2.5, 2.5, 1, 1]} />
      </mesh>
      <RoundedBox args={[THERMO.w, THERMO.h, THERMO.d]} radius={0.012} smoothness={4} material={mats.shell} position={[0, 0, THERMO.d / 2]} castShadow />
      <mesh material={mats.screen} position={[0, 0.03, THERMO.d + 0.0015]}>
        <planeGeometry args={[THERMO.w - 0.03, (THERMO.w - 0.03) * 0.625]} />
      </mesh>
      {/* 3 buttons */}
      {[-0.04, 0, 0.04].map((x) => (
        <mesh key={x} material={mats.cable} position={[x, -0.075, THERMO.d + 0.003]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.008, 16]} />
        </mesh>
      ))}
      {/* probe cable down the wall */}
      <mesh material={mats.cable} position={[0.05, -THERMO.h / 2 - 0.3, 0.012]}>
        <cylinderGeometry args={[0.005, 0.005, 0.6, 8]} />
      </mesh>
    </group>
  );
};
