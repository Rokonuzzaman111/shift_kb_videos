/**
 * Svalbard v2 — vault hall interior (refs: inside_vault, inside_boxes, foil_bags) + the X-ray mountain section.
 * VaultRoom (metres, +z down the hall, floor y = 0): white-painted rock walls, pallet racks with BLUE perforated
 * uprights + ORANGE beams + galvanised decks, grey plastic seed crates (instanced, 2 deep, 3 high) with barcode labels
 * and coloured stickers, a few wooden crates, yellow aisle signs, ceiling cooling units with fans, pipes, frost.
 * VaultXray: the mountain as a contour-lined X-ray shell, tunnel + transverse hall + 3 glass halls; hall 1 full,
 * halls 2/3 fill as teal holograms.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { canvasTex, fbm, rng, sstep } from "../../three/util";
import { P } from "../palette";
import { Instanced, Puffs, frostify, mat4, useSteelMat, useWhiteRockMat } from "./Corridor";
import { usePBR } from "../../../kit/assets";

/* ───────────────────────────── layout ───────────────────────────── */

export const ROOM = { x0: -5.2, x1: 4.4, z0: 0, z1: 26.5, H: 5.4 } as const;
const BAY = 2.7;
const BAYS = 8;
const RACK_Z0 = 2;
const LEVELS = [0.12, 1.12, 2.12, 3.12] as const;
const DEPTH = 1.1;
/** rack rows: x of the aisle-facing face, and facing direction (+1 → faces +x) */
const ROWS = [
  { face: -3.6, dir: 1 },
  { face: -1.6, dir: -1 },
  { face: 0.6, dir: 1 },
  { face: 2.6, dir: -1 },
] as const;
export const AISLE_X = -2.6;
const CRATE = { w: 0.58, h: 0.29, d: 0.4 } as const;
/** the crate the camera racks focus onto (row 1, bay 3, level 1, column 1, stack 1) */
const HERO = { row: 1, bay: 3, level: 1, col: 1, stack: 1 } as const;
const crateCenter = (row: number, bay: number, level: number, col: number, stack: number, deep: number) => {
  const R = ROWS[row];
  const x = R.face - R.dir * (0.03 + CRATE.d / 2 + deep * (CRATE.d + 0.12));
  const y = LEVELS[level] + 0.1 + CRATE.h / 2 + stack * (CRATE.h + 0.005);
  const z = RACK_Z0 + bay * BAY + 0.18 + CRATE.w / 2 + col * 0.63;
  return [x, y, z] as const;
};
const hc = crateCenter(HERO.row, HERO.bay, HERO.level, HERO.col, HERO.stack, 0);
/** centre of the hero label (on the aisle face) */
export const HERO_LABEL: readonly [number, number, number] = [hc[0] + ROWS[HERO.row].dir * (CRATE.d / 2 + 0.004), hc[1] + 0.01, hc[2] + 0.1];

/* ───────────────────────────── textures ───────────────────────────── */

const barcode = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) => {
  const r = rng(seed);
  g.fillStyle = "#111";
  let cx = x;
  while (cx < x + w) {
    const bw = 1 + Math.floor(r() * 3);
    if (r() > 0.45) g.fillRect(cx, y, bw, h);
    cx += bw + 1;
  }
};

const STICKERS = [P.vaultTeal, P.amber, "#3a8f4f", P.snow, "#c9d0d6", P.vaultTeal];
const labelTex = (i: number, scale = 1) =>
  canvasTex(256 * scale, 160 * scale, (g) => {
    g.scale(scale, scale);
    g.fillStyle = "#f2f2ee";
    g.fillRect(0, 0, 256, 160);
    g.fillStyle = STICKERS[i % STICKERS.length];
    g.fillRect(0, 0, 256, 34);
    g.fillStyle = "#1a1d21";
    g.font = "bold 22px Arial";
    g.fillText(["NORDGEN", "CGN", "IRRI", "ICARDA", "IPK", "CIMMYT"][i % 6], 10, 25);
    g.font = "bold 44px Arial";
    g.fillText(`Box ${String(12 + i * 7).padStart(2, "0")}`, 10, 84);
    barcode(g, 10, 96, 170, 40, 40 + i);
    g.font = "18px Arial";
    g.fillText(`2E0${200 + i * 13}`, 12, 154);
    g.strokeStyle = "#999";
    g.lineWidth = 2;
    g.strokeRect(1, 1, 254, 158);
  });

const crateTex = () =>
  canvasTex(256, 256, (g) => {
    g.fillStyle = "#55595f";
    g.fillRect(0, 0, 256, 256);
    // lid lip, ribs, handle recess
    g.fillStyle = "#3b3e43";
    g.fillRect(0, 0, 256, 34);
    g.fillStyle = "#62676d";
    g.fillRect(0, 34, 256, 6);
    g.fillStyle = "#2b2e32";
    g.fillRect(70, 52, 116, 38);
    g.fillStyle = "#4a4e54";
    for (let x = 14; x < 256; x += 40) g.fillRect(x, 100, 5, 150);
    g.fillStyle = "#2f3236";
    g.fillRect(0, 248, 256, 8);
  });

const holeTex = (base: string) =>
  canvasTex(64, 512, (g) => {
    g.fillStyle = base;
    g.fillRect(0, 0, 64, 512);
    g.fillStyle = "#0b1622";
    for (let y = 10; y < 512; y += 22) {
      g.fillRect(14, y, 10, 14);
      g.fillRect(40, y, 10, 14);
    }
  });

const fanTex = () =>
  canvasTex(512, 256, (g) => {
    g.fillStyle = "#e6e9ec";
    g.fillRect(0, 0, 512, 256);
    for (const cx of [128, 384]) {
      g.fillStyle = "#24282d";
      g.beginPath();
      g.arc(cx, 128, 100, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#c8ccd0";
      g.lineWidth = 3;
      for (let r = 20; r <= 100; r += 13) {
        g.beginPath();
        g.arc(cx, 128, r, 0, Math.PI * 2);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(cx - 100, 128);
      g.lineTo(cx + 100, 128);
      g.moveTo(cx, 28);
      g.lineTo(cx, 228);
      g.stroke();
      g.fillStyle = "#8d9399";
      g.beginPath();
      g.arc(cx, 128, 16, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#9aa0a6";
    g.font = "bold 20px Arial";
    g.fillText("ALFA LAVAL", 196, 246);
  });

const woodTex = () =>
  canvasTex(256, 256, (g) => {
    const r = rng(5);
    for (let y = 0; y < 256; y += 32) {
      const l = 150 + r() * 40;
      g.fillStyle = `rgb(${l},${l * 0.78},${l * 0.55})`;
      g.fillRect(0, y, 256, 30);
      g.fillStyle = "rgba(60,40,20,0.35)";
      for (let i = 0; i < 6; i++) g.fillRect(0, y + r() * 30, 256, 1);
      g.fillStyle = "#3c2c1c";
      g.fillRect(0, y + 30, 256, 2);
    }
  });

const signTex = (n: string) =>
  canvasTex(256, 256, (g) => {
    g.fillStyle = "#e8c63a";
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#1b1b1b";
    g.font = "bold 200px Arial";
    g.textAlign = "center";
    g.fillText(n, 128, 205);
  });

/** displaced white-rock wall slab (normal +z before rotation) */
const useRockWallGeo = (w: number, h: number, seed: number) =>
  useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h, Math.round(w * 3), Math.round(h * 3));
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      p.setZ(i, (fbm(x / 2.2 + seed, y / 2.2, 4) - 0.5) * 0.5);
    }
    g.computeVertexNormals();
    return g;
  }, [w, h, seed]);

/* ───────────────────────────── vault room ───────────────────────────── */

export const VaultRoom: React.FC<{ readonly t: number; readonly cam: readonly [number, number, number] }> = ({ t, cam }) => {
  const wallM = useWhiteRockMat([5, 1.2], 0.35);
  const ceilM = useWhiteRockMat([4, 6], 0.2);
  const conc = usePBR("concrete_wall_008", [3, 8]);
  const floorM = useMemo(
    () => frostify(new THREE.MeshStandardMaterial({ map: conc.map, normalMap: conc.normalMap, roughnessMap: conc.roughnessMap, color: "#b6bbc0", roughness: 0.7 }), 0.4),
    [conc],
  );
  const steelPBR = usePBR("metal_plate", [0.2, 1.6]);
  const blueM = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: holeTex("#1f4f9e"), normalMap: steelPBR.normalMap, color: "#ffffff", roughness: 0.45, metalness: 0.4 });
    return frostify(m, 0.25, 2);
  }, [steelPBR]);
  const orangeM = useMemo(() => frostify(new THREE.MeshStandardMaterial({ color: "#e0702a", normalMap: steelPBR.normalMap, roughness: 0.42, metalness: 0.35 }), 0.4, 2), [steelPBR]);
  const galv = useSteelMat([0.6, 0.2], "#c6cbd0", 0.45, 0.8, 0.3);
  const crateM = useMemo(() => frostify(new THREE.MeshStandardMaterial({ map: crateTex(), color: "#ffffff", roughness: 0.55, metalness: 0.05 }), 0.38, 1.6), []);
  const woodM = useMemo(() => frostify(new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.85 }), 0.3, 1.6), []);
  const labelMs = useMemo(() => Array.from({ length: 6 }, (_, i) => new THREE.MeshStandardMaterial({ map: labelTex(i), roughness: 0.6 })), []);
  const heroLabelM = useMemo(() => new THREE.MeshStandardMaterial({ map: labelTex(4, 3), roughness: 0.55 }), []);
  const fanM = useMemo(() => new THREE.MeshStandardMaterial({ map: fanTex(), roughness: 0.5, metalness: 0.1 }), []);
  const unitM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e4e7ea", roughness: 0.45, metalness: 0.15 }), []);
  const pipeM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#26292d", roughness: 0.5 }), []);
  const lampM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#000", emissive: "#f3f7fb", emissiveIntensity: 4.5 }), []);
  const signMs = useMemo(() => [signTex("1"), signTex("2")].map((m) => new THREE.MeshStandardMaterial({ map: m, roughness: 0.6 })), []);

  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const crateGeo = useMemo(() => new THREE.BoxGeometry(CRATE.d, CRATE.h, CRATE.w), []);
  const labelGeo = useMemo(() => new THREE.PlaneGeometry(0.2, 0.125), []);

  const layout = useMemo(() => {
    const r = rng(77);
    const uprights: THREE.Matrix4[] = [];
    const beams: THREE.Matrix4[] = [];
    const decks: THREE.Matrix4[] = [];
    const crates: THREE.Matrix4[] = [];
    const wood: THREE.Matrix4[] = [];
    const labels: THREE.Matrix4[][] = Array.from({ length: 6 }, () => []);
    ROWS.forEach((R, ri) => {
      const back = R.face - R.dir * DEPTH;
      for (let b = 0; b <= BAYS; b++) {
        const z = RACK_Z0 + b * BAY;
        for (const x of [R.face, back]) uprights.push(mat4([x, 2.1, z], [0.08, 4.2, 0.07]));
      }
      for (let b = 0; b < BAYS; b++) {
        const zc = RACK_Z0 + (b + 0.5) * BAY;
        LEVELS.forEach((y, li) => {
          for (const x of [R.face, back]) beams.push(mat4([x, y + 0.06, zc], [0.06, 0.12, BAY - 0.08]));
          decks.push(mat4([(R.face + back) / 2, y + 0.085, zc], [DEPTH, 0.02, BAY - 0.08]));
          if (li === 0 && b >= 5 && r() < 0.6) {
            // wooden crates on the floor level at the far end (foil_bags ref)
            wood.push(mat4([R.face - R.dir * 0.5, y + 0.1 + 0.32, zc], [0.9, 0.64, 2.2]));
            return;
          }
          for (let c = 0; c < 4; c++) {
            const stacks = r() < 0.12 ? 1 + Math.floor(r() * 2) : 3;
            for (let s = 0; s < stacks; s++) {
              for (let d = 0; d < 2; d++) {
                const isHero = ri === HERO.row && b === HERO.bay && li === HERO.level && c === HERO.col && s === HERO.stack && d === 0;
                const p = crateCenter(ri, b, li, c, s, d);
                const jitter: [number, number, number] = [(r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.03];
                if (!isHero) crates.push(mat4([p[0] + jitter[0], p[1], p[2] + jitter[2]], [1, 1, 1], (r() - 0.5) * 0.03));
                if (d === 0 && !isHero && r() < 0.92) {
                  const lp = [p[0] + jitter[0] + R.dir * (CRATE.d / 2 + 0.004), p[1] + 0.01, p[2] + jitter[2] + 0.1];
                  labels[Math.floor(r() * 6)].push(mat4(lp, [1, 1, 1], (R.dir * Math.PI) / 2));
                }
              }
            }
          }
        });
      }
    });
    return { uprights, beams, decks, crates, wood, labels };
  }, []);

  const lampZ = useMemo(() => Array.from({ length: 8 }, (_, i) => 2.5 + i * 3.2), []);
  const unitZ = [5, 13.5, 22] as const;
  const lights = useMemo(() => {
    const L: { p: [number, number, number]; w: number }[] = [];
    for (const z of lampZ) for (const x of [AISLE_X, 1.6]) L.push({ p: [x, 4.9, z], w: 16 });
    return L;
  }, [lampZ]);
  const pool = [...lights].sort((a, b) => Math.hypot(a.p[0] - cam[0], a.p[2] - cam[2] - 3) - Math.hypot(b.p[0] - cam[0], b.p[2] - cam[2] - 3)).slice(0, 6);
  const wallGeo = useRockWallGeo(ROOM.z1, ROOM.H, 3);
  const endGeo = useRockWallGeo(ROOM.x1 - ROOM.x0, ROOM.H, 9);
  const sun = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(-1.5, 0, 9);
    return o;
  }, []);

  return (
    <group>
      <hemisphereLight args={["#e8eef5", "#6b747d", 0.55]} />
      {pool.map((l, i) => (
        <pointLight key={i} position={l.p} intensity={l.w} distance={14} decay={2} color="#eef4fa" />
      ))}
      <primitive object={sun} />
      <directionalLight
        position={[-3.2, 9, 6]}
        target={sun}
        intensity={0.9}
        color="#f2f6fa"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      {/* shell */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(ROOM.x0 + ROOM.x1) / 2, 0, ROOM.z1 / 2]} material={floorM} receiveShadow>
        <planeGeometry args={[ROOM.x1 - ROOM.x0, ROOM.z1]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[(ROOM.x0 + ROOM.x1) / 2, ROOM.H, ROOM.z1 / 2]} material={ceilM}>
        <planeGeometry args={[ROOM.x1 - ROOM.x0, ROOM.z1]} />
      </mesh>
      <mesh geometry={wallGeo} material={wallM} position={[ROOM.x0, ROOM.H / 2, ROOM.z1 / 2]} rotation={[0, Math.PI / 2, 0]} receiveShadow />
      <mesh geometry={wallGeo} material={wallM} position={[ROOM.x1, ROOM.H / 2, ROOM.z1 / 2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow />
      <mesh geometry={endGeo} material={wallM} position={[(ROOM.x0 + ROOM.x1) / 2, ROOM.H / 2, ROOM.z1]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={endGeo} material={wallM} position={[(ROOM.x0 + ROOM.x1) / 2, ROOM.H / 2, -0.3]} />

      {/* racks + crates */}
      <Instanced geo={box} mat={blueM} mats={layout.uprights} shadows />
      <Instanced geo={box} mat={orangeM} mats={layout.beams} shadows />
      <Instanced geo={box} mat={galv} mats={layout.decks} shadows />
      <Instanced geo={crateGeo} mat={crateM} mats={layout.crates} shadows />
      <Instanced geo={box} mat={woodM} mats={layout.wood} shadows />
      {layout.labels.map((m, i) => (
        <Instanced key={i} geo={labelGeo} mat={labelMs[i]} mats={m} />
      ))}
      {/* hero crate + its label (rack-focus target) */}
      <mesh geometry={crateGeo} material={crateM} position={hc as unknown as [number, number, number]} castShadow receiveShadow />
      <mesh geometry={labelGeo} material={heroLabelM} position={HERO_LABEL as [number, number, number]} rotation={[0, (ROWS[HERO.row].dir * Math.PI) / 2, 0]} />

      {/* yellow aisle signs on the rack ends */}
      {[
        [AISLE_X - 0.75, 0],
        [1.6 - 0.75, 1],
      ].map(([x, i]) => (
        <mesh key={i} position={[x, 3.7, RACK_Z0 - 0.06]} rotation={[0, Math.PI, 0]} material={signMs[i]}>
          <planeGeometry args={[0.42, 0.5]} />
        </mesh>
      ))}

      {/* ceiling: lamp strips, cooling units with fans, pipes */}
      {lampZ.flatMap((z) =>
        [AISLE_X, 1.6].map((x) => (
          <mesh key={`${x}-${z}`} position={[x, ROOM.H - 0.05, z]} material={lampM}>
            <boxGeometry args={[0.16, 0.05, 1.3]} />
          </mesh>
        )),
      )}
      {unitZ.flatMap((z) =>
        [AISLE_X + 0.3, 1.6].map((x) => (
          <group key={`${x}-${z}`} position={[x, 4.75, z]}>
            <mesh material={unitM} castShadow>
              <boxGeometry args={[1.5, 0.62, 0.7]} />
            </mesh>
            <mesh position={[0, 0, -0.352]} rotation={[0, Math.PI, 0]} material={fanM}>
              <planeGeometry args={[1.44, 0.58]} />
            </mesh>
            <mesh position={[0, 0.5, 0]} material={pipeM}>
              <boxGeometry args={[0.05, 0.4, 0.05]} />
            </mesh>
          </group>
        )),
      )}
      {[-4.3, -0.4, 3.6].map((x) => (
        <mesh key={x} position={[x, ROOM.H - 0.25, ROOM.z1 / 2]} rotation={[Math.PI / 2, 0, 0]} material={pipeM}>
          <cylinderGeometry args={[0.07, 0.07, ROOM.z1, 12, 1, true]} />
        </mesh>
      ))}

      {/* cold breath haze in the aisle */}
      <Puffs count={26} seed={11} box={[AISLE_X - 0.8, AISLE_X + 0.8, 0.3, 2.4, 1, 16]} size={[0.9, 2.0]} t={t} drift={[0.02, 0.03, 0.05]} k={1} opacity={0.14} color="#e3eaf1" />
      <Puffs count={14} seed={12} box={[AISLE_X - 1, AISLE_X + 1, 0.05, 0.4, 2, 18]} size={[1.5, 3]} t={t} drift={[0, 0, 0.03]} k={1} opacity={0.16} color="#dfe7ee" />
    </group>
  );
};

/* ───────────────────────────── X-ray mountain section ───────────────────────────── */

export const XR = { tunnel: [-4, 100] as const, cross: [100, 106] as const, halls: [-14, 0, 14] as const, hallLen: 27, hallW: 10, hallH: 6 } as const;

const mountainH = (x: number, z: number) => {
  const slope = Math.min(62, Math.max(0, 0.62 * (z + 6)));
  const n = (fbm(x / 45 + 3, z / 45, 4) - 0.5) * 16 * sstep(-5, 40, z);
  return -2 + slope + n + 4 * Math.sin(x / 37) * sstep(0, 60, z);
};

const xrayVert = /* glsl */ `
varying vec3 vW; varying vec3 vN;
void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
const xrayFrag = /* glsl */ `
uniform vec3 uCam; uniform float uK; uniform vec3 uA; uniform vec3 uB;
varying vec3 vW; varying vec3 vN;
void main(){
  vec3 V = normalize(uCam - vW);
  float fr = pow(1.0 - abs(dot(normalize(vN), V)), 2.5);
  float c = abs(fract(vW.y / 3.0) - 0.5);
  float line = 1.0 - smoothstep(0.0, 0.035, c - 0.46 + 0.0);
  line = smoothstep(0.44, 0.5, c);
  vec3 col = mix(uA, uB, fr * 0.8 + line * 0.5);
  float a = (0.05 + fr * 0.4 + line * 0.22) * uK;
  gl_FragColor = vec4(col * (1.0 + fr), a);
}`;

export const VaultXray: React.FC<{
  readonly cam: readonly [number, number, number];
  /** shell visibility 0…1 */
  readonly shell: number;
  /** hologram fill of hall 2 / 3 (0…1) */
  readonly fill2: number;
  readonly fill3: number;
  readonly t: number;
}> = ({ cam, shell, fill2, fill3, t }) => {
  const rock = usePBR("rock_boulder_dry", [10, 10]);
  const shellGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(320, 320, 160, 160);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, 60);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, mountainH(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    return g;
  }, []);
  const u = useMemo(() => ({ uCam: { value: new THREE.Vector3() }, uK: { value: 1 }, uA: { value: new THREE.Color(P.steel) }, uB: { value: new THREE.Color("#bcd3e6") } }), []);
  u.uCam.value.set(cam[0], cam[1], cam[2]);
  u.uK.value = shell;
  const groundM = useMemo(() => new THREE.MeshStandardMaterial({ map: rock.map, normalMap: rock.normalMap, color: "#3a4552", roughness: 0.95 }), [rock]);
  const glassM = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#cfe3f0", roughness: 0.15, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide }), []);
  const edgeM = useMemo(() => new THREE.LineBasicMaterial({ color: P.vaultTeal, transparent: true, opacity: 0.8 }), []);
  const crateM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7d8691", roughness: 0.6, metalness: 0.1, emissive: "#1a2633" }), []);
  const holoM = useMemo(() => new THREE.MeshBasicMaterial({ color: P.vaultTeal, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const tubeM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7d97b2", emissive: "#183a5c", roughness: 0.4, metalness: 0.6 }), []);
  const concM = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9a9ea2", roughness: 0.9 }), []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const boxEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);

  // rack blocks inside a hall: 4 rows × 9 bays × 4 levels, ordered floor-up so holograms "fill"
  const blocks = (hx: number) => {
    const out: THREE.Matrix4[] = [];
    for (let lv = 0; lv < 4; lv++)
      for (let b = 0; b < 9; b++)
        for (const rx of [-3.6, -1.3, 1.3, 3.6]) out.push(mat4([hx + rx, 0.6 + lv * 1.25, XR.cross[1] + 1.5 + b * 2.75], [1.1, 1.05, 2.5]));
    return out;
  };
  const b1 = useMemo(() => blocks(XR.halls[0]), []); // eslint-disable-line react-hooks/exhaustive-deps
  const b2all = useMemo(() => blocks(XR.halls[1]), []); // eslint-disable-line react-hooks/exhaustive-deps
  const b3all = useMemo(() => blocks(XR.halls[2]), []); // eslint-disable-line react-hooks/exhaustive-deps
  const zero = useMemo(() => new THREE.Matrix4().makeScale(0, 0, 0), []);
  const fillMats = (all: THREE.Matrix4[], f: number) => all.map((m, i) => (i < Math.floor(f * all.length) ? m : zero));
  const hallZ = XR.cross[1] + XR.hallLen / 2;
  const scan = (t * 0.6) % 1;

  return (
    <group>
      <hemisphereLight args={["#a9bdd3", "#0a1018", 0.6]} />
      <directionalLight position={[60, 90, -40]} intensity={1.6} color="#dfe8f2" />
      {/* bedrock floor under the section (dark, textured) and the fjord shore */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 60]} material={groundM}>
        <planeGeometry args={[320, 320]} />
      </mesh>
      {/* the mountain as an X-ray shell */}
      <mesh geometry={shellGeo}>
        <shaderMaterial vertexShader={xrayVert} fragmentShader={xrayFrag} uniforms={u} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* portal wedge + tunnel */}
      <mesh position={[0, 4, -7]} material={concM}>
        <boxGeometry args={[4.5, 9, 6]} />
      </mesh>
      <mesh position={[0, 7.4, -10.05]}>
        <planeGeometry args={[4.1, 3.6]} />
        <meshBasicMaterial color={P.vaultTeal} />
      </mesh>
      <mesh position={[0, 1.2, (XR.tunnel[0] + XR.tunnel[1]) / 2]} rotation={[Math.PI / 2, 0, 0]} material={tubeM}>
        <cylinderGeometry args={[2.3, 2.3, XR.tunnel[1] - XR.tunnel[0], 24, 1, true]} />
      </mesh>
      {/* transverse hall + 3 halls as glass volumes with teal edges */}
      {[
        { p: [0, XR.hallH / 2, (XR.cross[0] + XR.cross[1]) / 2], s: [44, XR.hallH, XR.cross[1] - XR.cross[0]] },
        ...XR.halls.map((x) => ({ p: [x, XR.hallH / 2, hallZ], s: [XR.hallW, XR.hallH, XR.hallLen] })),
      ].map((v, i) => (
        <group key={i} position={v.p as [number, number, number]} scale={v.s as [number, number, number]}>
          <mesh geometry={box} material={glassM} />
          <lineSegments geometry={boxEdges} material={edgeM} />
        </group>
      ))}
      <Instanced geo={box} mat={crateM} mats={b1} />
      <Instanced geo={box} mat={holoM} mats={fillMats(b2all, fill2)} />
      <Instanced geo={box} mat={holoM} mats={fillMats(b3all, fill3)} />
      {/* hologram scan planes rising through the filling halls */}
      {[
        [XR.halls[1], fill2],
        [XR.halls[2], fill3],
      ].map(([x, f]) =>
        f > 0 && f < 1 ? (
          <mesh key={x} position={[x, 0.2 + f * 5.2, hallZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[XR.hallW, XR.hallLen]} />
            <meshBasicMaterial color={P.vaultTeal} transparent opacity={0.22 + 0.1 * scan} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ) : null,
      )}
    </group>
  );
};
