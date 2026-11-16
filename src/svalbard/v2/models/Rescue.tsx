/**
 * Svalbard v2 · Part 5 A–C models (metres, y up). All deterministic.
 *  LightCone   — additive fresnel cone for a lamp beam (volumetric look).
 *  Motes       — drifting/falling particles (frost, dust, snow) as points; positions from t.
 *  SpotFloor   — dark concrete floor patch for the lone-crate shot.
 *  AleppoCity  — dusk war-damage diorama: instanced broken concrete blocks (world-space windows), rubble, greenhouses,
 *                research station, smoke columns, fires.
 *  VaultExit   — white-rock corridor ending in a doorway full of daylight.
 *  PalletTruck — hand pallet jack (amber paint) carrying a pallet of crates, pulled by a parka-clad operator (walk cycle
 *                driven by the truck's z, so the stride matches the travel).
 */
import { useMemo } from "react";
import * as THREE from "three";
import { usePBR } from "../../../kit/assets";
import { canvasTex, rng } from "../../three/util";
import { P } from "../palette";
import { Instanced, Puffs, frostify, usePuffTex, useWhiteRockMat } from "./Corridor";
import { m4 } from "./SeedMacro";
import { CRATE, CRATES, Crate, PALLET_H, Pallet, SLOTS } from "./SeedCrates";

type V = readonly [number, number, number];

/* ───────────── light cone ───────────── */
export const LightCone: React.FC<{ readonly position: V; readonly height: number; readonly radius: number; readonly color: string; readonly k?: number; readonly rotation?: V }> = ({
  position,
  height,
  radius,
  color,
  k = 1,
  rotation = [0, 0, 0],
}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uCol: { value: new THREE.Color(color) }, uK: { value: 1 } },
        vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV;
          void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 uCol; uniform float uK; varying float vY; varying vec3 vN; varying vec3 vV;
          void main(){ float f = pow(abs(dot(vN, vV)), 1.6); float a = f * mix(0.05, 0.5, vY) * uK; gl_FragColor = vec4(uCol * a, 1.0); }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [color],
  );
  mat.uniforms.uK.value = k;
  return (
    <mesh position={[position[0], position[1] - height / 2, position[2]]} rotation={rotation as [number, number, number]} material={mat}>
      <coneGeometry args={[radius, height, 40, 1, true]} />
    </mesh>
  );
};

/* ───────────── motes ───────────── */
export const Motes: React.FC<{
  readonly count: number;
  readonly seed: number;
  readonly box: readonly [number, number, number, number, number, number];
  readonly t: number;
  readonly fall: number;
  readonly drift?: number;
  readonly size: number;
  readonly color?: string;
  readonly opacity?: number;
}> = ({ count, seed, box, t, fall, drift = 0.1, size, color = P.snow, opacity = 0.8 }) => {
  const tex = usePuffTex();
  const base = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => [r(), r(), r(), r() * 6.28, 0.6 + r() * 0.8] as const);
  }, [count, seed]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const mat = useMemo(() => new THREE.PointsMaterial({ map: tex, color, size, transparent: true, opacity, depthWrite: false, sizeAttenuation: true }), [tex, color, size, opacity]);
  const arr = geo.attributes.position.array as Float32Array;
  const H = box[3] - box[2];
  base.forEach(([u, v, w, ph, sp], i) => {
    const y = box[3] - ((v * H + t * fall * sp) % H);
    arr[i * 3] = box[0] + u * (box[1] - box[0]) + Math.sin(t * 0.9 * sp + ph) * drift;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = box[4] + w * (box[5] - box[4]) + Math.cos(t * 0.7 * sp + ph) * drift;
  });
  geo.attributes.position.needsUpdate = true;
  return <points geometry={geo} material={mat} frustumCulled={false} />;
};

/* ───────────── A · floor ───────────── */
export const SpotFloor: React.FC = () => {
  const pbr = usePBR("concrete_wall_008", [3, 3]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[12, 12]} />
      <meshStandardMaterial {...pbr} color="#5b636c" roughness={0.75} />
    </mesh>
  );
};

/* ───────────── B · Aleppo diorama ───────────── */
/** Limestone/concrete facade shader in world space: window grid with stone surrounds, slab bands, ground-floor shutters,
 *  blown-out bays, soot plumes over burnt windows, grime at street level, a few windows glowing with fire inside. */
const useWarConcrete = () => {
  const pbr = usePBR("concrete_wall_008", [1, 1]);
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: pbr.map, color: "#ffffff", roughness: 0.93 });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader =
        "varying vec3 vWp; varying vec3 vWn;\n" +
        sh.vertexShader.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          vec4 wp4 = vec4(transformed, 1.0); vec3 wn3 = objectNormal;
          #ifdef USE_INSTANCING
            wp4 = instanceMatrix * wp4; wn3 = mat3(instanceMatrix) * wn3;
          #endif
          vWp = (modelMatrix * wp4).xyz; vWn = normalize(mat3(modelMatrix) * wn3);`,
        );
      sh.fragmentShader =
        "varying vec3 vWp; varying vec3 vWn;\nfloat wHash(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }\n" +
        sh.fragmentShader
          .replace(
            "#include <map_fragment>",
            `vec3 wAn = abs(vWn);
            vec2 wUv = wAn.y > 0.5 ? vWp.xz : vec2(wAn.x > 0.5 ? vWp.z : vWp.x, vWp.y);
            diffuseColor *= texture2D(map, wUv * 0.21);
            diffuseColor.rgb *= 0.9 + 0.2 * texture2D(map, wUv * 0.031).g;`,
          )
          .replace(
            "#include <color_fragment>",
            `#include <color_fragment>
            float wSide = 1.0 - step(0.7, wAn.y);
            float wOther = wAn.x > 0.5 ? vWp.x : vWp.z;
            vec2 wc = vec2((wAn.x > 0.5 ? vWp.z : vWp.x) / 2.6, vWp.y / 3.1);
            vec2 wf = fract(wc);
            float wh = wHash(vec3(floor(wc), floor(wOther * 0.5)));
            float wGround = 1.0 - step(1.0, wc.y);
            float wWin = step(0.22, wf.x) * step(wf.x, 0.72) * step(0.3, wf.y) * step(wf.y, 0.78) * (1.0 - wGround);
            float wFrame = step(0.18, wf.x) * step(wf.x, 0.76) * step(0.25, wf.y) * step(wf.y, 0.83) * (1.0 - wGround) - wWin;
            float wShop = step(0.08, wf.x) * step(wf.x, 0.92) * step(0.03, wf.y) * step(wf.y, 0.74) * wGround;
            float wBlown = step(0.9, wh) * (1.0 - wGround) * step(0.04, wf.x) * step(wf.x, 0.96) * step(0.1, wf.y) * step(wf.y, 0.97);
            float wHole = max(wWin, wBlown);
            float wBand = step(wf.y, 0.07) * (1.0 - wGround);
            float wBurnt = step(0.74, wh);
            float wSoot = wBurnt * (1.0 - wGround) * smoothstep(0.7, 1.0, wf.y) * clamp(1.0 - abs(wf.x - 0.47) * 2.6, 0.0, 1.0);
            vec3 wCol = diffuseColor.rgb;
            wCol *= mix(1.0, 1.16, wFrame * wSide);
            wCol *= mix(1.0, 1.08, wBand * wSide);
            wCol *= mix(1.0, 0.42, wShop * wSide);
            wCol *= 1.0 - 0.8 * wSoot * wSide;
            wCol *= mix(0.62, 1.0, smoothstep(0.0, 2.8, vWp.y));
            wCol = mix(wCol, vec3(0.022, 0.019, 0.017), wHole * wSide);
            diffuseColor.rgb = wCol;
            float wGlow = step(0.975, fract(wh * 13.7)) * wHole * wSide * step(4.0, vWp.y);`,
          )
          .replace(
            "#include <emissivemap_fragment>",
            `#include <emissivemap_fragment>
            totalEmissiveRadiance += vec3(1.0, 0.4, 0.1) * wGlow * 1.8;`,
          );
    };
    m.customProgramCacheKey = () => "war-concrete-v2";
    return m;
  }, [pbr]);
};

/** InstancedMesh with per-instance colour (matrices + colours are deterministic, built once). */
type Item = { m: THREE.Matrix4; c: THREE.Color };
const InstancedC: React.FC<{ readonly geo: THREE.BufferGeometry; readonly mat: THREE.Material; readonly items: Item[]; readonly shadows?: boolean }> = ({ geo, mat, items, shadows = true }) => {
  const mesh = useMemo(() => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
    im.frustumCulled = false;
    im.castShadow = shadows;
    im.receiveShadow = shadows;
    items.forEach((it, i) => {
      im.setMatrixAt(i, it.m);
      im.setColorAt(i, it.c);
    });
    im.count = items.length;
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    return im;
  }, [geo, mat, items, shadows]);
  return <primitive object={mesh} />;
};

const FH = 3.1; // storey height (matches the facade shader)
export const ALEPPO_STATION: V = [0, 7.4, -62];
const UP = new THREE.Vector3(0, 1, 0);
const m4q = (p: V, s: V, dir: THREE.Vector3) => new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()), new THREE.Vector3(...s));

type City = { walls: Item[]; slabs: Item[]; rubble: Item[]; chunks: Item[]; rebar: THREE.Matrix4[] };
const buildCity = (): City => {
  const r = rng(515);
  const walls: Item[] = [];
  const slabs: Item[] = [];
  const rubble: Item[] = [];
  const chunks: Item[] = [];
  const rebar: THREE.Matrix4[] = [];
  const tint = (base: number, warm: number) => new THREE.Color().setRGB(base * (0.98 + warm * 0.08), base * (0.93 + warm * 0.03), base * (0.84 - warm * 0.04));
  const debrisCol = () => {
    const q = r();
    return q < 0.15 ? new THREE.Color("#3b3632") : tint(0.55 + r() * 0.35, r());
  };
  const heap = (x: number, z: number, R: number, H: number, n: number) => {
    rubble.push({ m: m4([x, -H * 0.12, z], [R, H, R * (0.8 + r() * 0.3)], [0, r() * 6, 0]), c: tint(0.62 + r() * 0.15, r()) });
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const d = R * Math.sqrt(r()) * 1.05;
      const y = H * Math.pow(Math.max(0, 1 - d / R), 1.2) * (0.75 + r() * 0.3);
      const px = x + Math.cos(a) * d;
      const pz = z + Math.sin(a) * d;
      if (r() < 0.6) {
        const sx = 0.3 + r() * 1.4;
        chunks.push({ m: m4([px, y, pz], [sx, 0.12 + r() * 0.3, 0.3 + r() * 1.0], [(r() - 0.5) * 1.4, r() * 6, (r() - 0.5) * 1.4]), c: debrisCol() });
        if (r() < 0.25) rebar.push(m4q([px, y, pz], [1, 0.4 + r() * 1.0, 1], new THREE.Vector3(r() - 0.5, 0.3 + r(), r() - 0.5)));
      } else {
        const s = 0.15 + r() * 0.6;
        rubble.push({ m: m4([px, y, pz], [s, s * 0.7, s], [r() * 3, r() * 3, r() * 3]), c: debrisCol() });
      }
    }
  };
  for (let gx = -7; gx <= 7; gx++)
    for (let gz = -12; gz <= 2; gz++) {
      if (gx === 0 && gz >= -4) continue; // the street
      if (Math.abs(gx) <= 1 && gz === -5) continue; // research-station plot
      if (r() < 0.07) continue;
      const near = Math.abs(gx) <= 2 && gz >= -7;
      const w = 7 + r() * 3;
      const d = 8 + r() * 3;
      const cx = gx * 12 + (gx === 0 ? 0 : (r() - 0.5) * 1.2);
      const cz = gz * 12 + (r() - 0.5) * 1.2;
      const fl = 3 + Math.floor(r() * 5);
      const q = r();
      const dmg = q < 0.38 ? 0 : q < 0.8 ? 1 : 2;
      const col = tint(0.78 + r() * 0.24, r());
      // local frame: n = street-facing normal, t = along the facade
      const sx = gx > 0 ? -1 : gx < 0 ? 1 : 0;
      const n: V = sx !== 0 ? [sx, 0, 0] : [0, 0, 1];
      const tv: V = sx !== 0 ? [0, 0, 1] : [1, 0, 0];
      const hu = sx !== 0 ? w / 2 : d / 2; // half depth toward street
      const hv = sx !== 0 ? d / 2 : w / 2; // half width along facade
      const P = (u: number, v: number, y: number): V => [cx + n[0] * u + tv[0] * v, y, cz + n[2] * u + tv[2] * v];
      const S = (su: number, sv: number, sy: number): V => (sx !== 0 ? [su, sy, sv] : [sv, sy, su]);
      const tilt = (a: number): V => (sx !== 0 ? [0, 0, -sx * a] : [a, 0, 0]);
      const dirU = new THREE.Vector3(n[0], 0, n[2]);
      const dirV = new THREE.Vector3(tv[0], 0, tv[2]);
      const box = (list: Item[], u: number, v: number, y: number, su: number, sv: number, sy: number, c: THREE.Color, rot: V = [0, 0, 0]) =>
        list.push({ m: m4(P(u, v, y), S(su, sv, sy), rot), c });
      const slabCol = () => tint(0.6 + r() * 0.12, 0.3);
      const balconies = (fromFloor: number, toFloor: number) => {
        if (!near) return;
        const center = sx !== 0 ? cz : cx;
        for (let f = Math.max(1, fromFloor); f < toFloor; f++)
          for (let k = Math.floor((center - hv) / 2.6); k <= Math.ceil((center + hv) / 2.6); k++) {
            if (r() < 0.35) continue;
            // balcony grid follows the world-space window grid (2.6 m bays, 0.47 = window centre)
            const vc = (k + 0.47) * 2.6 - center;
            if (Math.abs(vc) > hv - 0.9) continue;
            const broken = r() < 0.18;
            box(slabs, hu + 0.5, vc, f * FH + 0.05, 1.0, 1.7, 0.16, slabCol(), broken ? tilt(0.35) : [0, 0, 0]);
            if (!broken) box(slabs, hu + 0.97, vc, f * FH + 0.55, 0.06, 1.7, 0.85, tint(0.35 + r() * 0.2, 0.2));
          }
      };
      if (dmg === 0) {
        const H = fl * FH + 0.45;
        box(walls, 0, 0, H / 2, hu * 2, hv * 2, H, col);
        balconies(1, fl);
        for (let i = 0; i < 2; i++) box(slabs, (r() - 0.5) * hu, (r() - 0.5) * hv, H + 0.5, 1.1, 1.1, 1.0, tint(0.5, 0.1));
        continue;
      }
      if (dmg === 1) {
        // partial collapse: intact lower storeys, blown-out street facade above, skeleton of slabs + columns, hanging slabs
        const f1 = Math.max(1, Math.floor(fl * (0.35 + r() * 0.3)));
        box(walls, 0, 0, (f1 * FH) / 2, hu * 2, hv * 2, f1 * FH, col);
        balconies(1, f1);
        const topBack = (f1 + (fl - f1) * (0.6 + r() * 0.4)) * FH;
        box(walls, -hu + 0.18, 0, (f1 * FH + topBack) / 2, 0.36, hv * 2, topBack - f1 * FH, col); // back wall
        const sideV = r() < 0.5 ? -1 : 1;
        const sideTop = (f1 + Math.max(1, Math.floor((fl - f1) * r()))) * FH;
        box(walls, -hu * 0.25, sideV * (hv - 0.18), (f1 * FH + sideTop) / 2, hu * 1.5, 0.36, sideTop - f1 * FH, col); // ragged side wall
        for (let L = f1 + 1; L <= fl; L++) {
          const y = L * FH;
          const up = (L - f1) / (fl - f1 + 1);
          const q2 = r();
          if (q2 < 0.15 + up * 0.35) continue; // slab gone
          const depth = hu * 2 * (0.45 + r() * 0.4); // slab reaches from the back wall toward the street, broken edge
          const edge = -hu + depth;
          box(slabs, -hu + depth / 2, 0, y, depth, hv * 2 - 0.2, 0.26, slabCol());
          for (const cv of [-hv + 0.4, 0, hv - 0.4]) box(slabs, -hu + 0.6, cv, y - FH / 2, 0.38, 0.38, FH, slabCol()); // columns
          if (q2 > 0.55) {
            // pancaking slab hinged at the broken edge, drooping toward the street
            const a = 0.35 + r() * 0.6;
            const Ls = hu * 2 - depth + 0.4;
            const ny = y - (Ls / 2) * Math.sin(a);
            box(slabs, edge + (Ls / 2) * Math.cos(a), (r() - 0.5) * 0.6, ny, Ls, hv * 2 * (0.5 + r() * 0.4), 0.24, slabCol(), tilt(a));
          }
          // exposed rebar along the broken edge
          for (let i = 0; i < 7; i++) {
            const v = (r() - 0.5) * (hv * 2 - 0.6);
            const dir = dirU.clone().add(dirV.clone().multiplyScalar((r() - 0.5) * 0.7)).add(new THREE.Vector3(0, -0.2 - r() * 0.9, 0));
            rebar.push(m4q(P(edge, v, y), [1, 0.6 + r() * 1.2, 1], dir));
          }
        }
        heap(P(hu + 2.2, 0, 0)[0], P(hu + 2.2, 0, 0)[2], near ? 4 + r() * 2.5 : 3.5, 1.4 + r() * 1.6, near ? 70 : 12);
        continue;
      }
      // dmg 2 — pancake collapse: ground storey survives, the floors above lie stacked on it
      box(walls, 0, 0, FH / 2, hu * 2, hv * 2, FH, col);
      let y = FH + 0.13;
      for (let L = 1; L < fl; L++) {
        const a = (r() - 0.5) * 0.18;
        box(slabs, (r() - 0.5) * 1.2, (r() - 0.5) * 1.0, y, hu * 2 * (0.85 + r() * 0.2), hv * 2 * (0.85 + r() * 0.2), 0.28, slabCol(), [sx !== 0 ? (r() - 0.5) * 0.12 : a, 0, sx !== 0 ? a : (r() - 0.5) * 0.12]);
        for (let i = 0; i < 4; i++) {
          const dir = dirU.clone().multiplyScalar(r() < 0.5 ? 1 : -1).add(new THREE.Vector3(0, (r() - 0.5) * 0.8, 0));
          rebar.push(m4q(P(hu * (r() < 0.5 ? 0.9 : -0.9), (r() - 0.5) * hv * 1.6, y), [1, 0.5 + r() * 1.0, 1], dir));
        }
        y += 0.42 + r() * 0.35;
      }
      heap(cx, cz, Math.max(hu, hv) + 2.5, y * 0.55, near ? 90 : 18);
    }
  // street debris
  for (let i = 0; i < 420; i++) {
    const px = (r() - 0.5) * 13;
    const pz = -56 + r() * 82;
    const s = 0.08 + r() * 0.42;
    if (r() < 0.5) chunks.push({ m: m4([px, s * 0.15, pz], [s * 2, s * 0.35, s * 1.4], [(r() - 0.5) * 0.4, r() * 6, (r() - 0.5) * 0.4]), c: debrisCol() });
    else rubble.push({ m: m4([px, s * 0.2, pz], [s, s * 0.6, s], [r() * 3, r() * 3, r() * 3]), c: debrisCol() });
  }
  for (const [hx, hz, R, H] of [
    [-4.2, 6, 3.2, 1.3],
    [4.8, -10, 3.8, 1.6],
    [-3.6, -30, 3.0, 1.1],
    [3.5, -44, 4.2, 1.8],
  ] as const)
    heap(hx, hz, R, H, 60);
  return { walls, slabs, rubble, chunks, rebar };
};

const Greenhouses: React.FC = () => {
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#b9c4c8", roughness: 0.35, metalness: 0, transparent: true, opacity: 0.3, side: THREE.DoubleSide }), []);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6c7378", metalness: 0.7, roughness: 0.5 }), []);
  return (
    <group position={[9.5, 0, 0]} scale={0.8}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[i * 3.4, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={i === 1 ? frame : glass}>
            <cylinderGeometry args={[1.5, 1.5, 10, 16, 1, true, Math.PI / 2, i === 1 ? Math.PI * 0.45 : Math.PI]} />
          </mesh>
          {[-4, -2, 0, 2, 4].map((z) => (
            <mesh key={z} position={[0, 0, z]} material={frame}>
              <torusGeometry args={[1.5, 0.03, 4, 16, Math.PI]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

/** One fire: flickering core sprites + point light + a three-layer smoke column lit warm from below, bending downwind. */
const Fire: React.FC<{ readonly at: V; readonly t: number; readonly i: number; readonly scale?: number; readonly light?: boolean }> = ({ at, t, i, scale = 1, light = true }) => {
  const tex = usePuffTex();
  const s = scale;
  const fl = 0.75 + 0.25 * Math.sin(t * 11 + i * 2) * Math.sin(t * 7.3 + i);
  const [x, y, z] = at;
  return (
    <group>
      {[0, 1, 2, 3].map((k) => (
        <sprite key={k} position={[x + Math.sin(k * 2.1 + i) * 0.5 * s, y + (0.3 + k * 0.35) * s, z + Math.cos(k * 1.7) * 0.4 * s]} scale={[(2.4 - k * 0.4) * s * fl, (2.8 - k * 0.3) * s * fl, 1]}>
          <spriteMaterial map={tex} color={new THREE.Color(k < 2 ? "#ff7a1e" : "#ffb14a").multiplyScalar(3.2)} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
      {light ? <pointLight position={[x, y + 1.6 * s, z]} intensity={(140 + 60 * fl) * s} distance={30 * s} decay={2} color="#ff8a3a" /> : null}
      <Puffs count={10} seed={30 + i * 7} box={[x - 1.2 * s, x + 1.2 * s, y + 1 * s, y + 6 * s, z - 1.2 * s, z + 1.2 * s]} size={[3 * s, 6 * s]} t={t} drift={[0.3, 1.4, 0]} k={1} color="#a8643a" opacity={0.6} />
      <Puffs count={14} seed={31 + i * 7} box={[x - 2 * s, x + 3 * s, y + 5 * s, y + 20 * s, z - 2 * s, z + 2 * s]} size={[6 * s, 12 * s]} t={t} drift={[0.8, 1.6, 0]} k={1} color="#5f4d42" opacity={0.7} />
      <Puffs count={16} seed={32 + i * 7} box={[x + 2 * s, x + 14 * s, y + 18 * s, y + 46 * s, z - 3 * s, z + 3 * s]} size={[12 * s, 24 * s]} t={t} drift={[1.6, 1.2, 0]} k={1} color="#4a4644" opacity={0.6} />
    </group>
  );
};

export const AleppoCity: React.FC<{ readonly t: number }> = ({ t }) => {
  const wall = useWarConcrete();
  const ground = usePBR("concrete_wall_008", [40, 40]);
  const slabPbr = usePBR("concrete_wall_008", [1, 1]);
  const city = useMemo(() => buildCity(), []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const rubbleGeo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const rodGeo = useMemo(() => new THREE.CylinderGeometry(0.022, 0.022, 1, 4).translate(0, 0.5, 0), []);
  const slabMat = useMemo(() => new THREE.MeshStandardMaterial({ map: slabPbr.map, normalMap: slabPbr.normalMap, color: "#ffffff", roughness: 0.95 }), [slabPbr]);
  const debrisMat = useMemo(() => new THREE.MeshStandardMaterial({ map: slabPbr.map, color: "#ffffff", roughness: 1, flatShading: true }), [slabPbr]);
  const rustMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3d2a20", roughness: 0.8, metalness: 0.4 }), []);
  const char = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2522", roughness: 0.9, metalness: 0.3 }), []);
  const rust = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5c3a26", roughness: 0.9, metalness: 0.2 }), []);
  const tex = usePuffTex();
  const fires: { at: V; s: number; light: boolean }[] = [
    { at: [-4.6, 1.0, 5], s: 1.1, light: true },
    { at: [5.2, 1.2, -11], s: 1.3, light: true },
    { at: [-5.4, 0.8, -27], s: 0.9, light: true },
    { at: [24, 0.5, -40], s: 1.4, light: false },
    { at: [-30, 0.5, -78], s: 1.8, light: false },
    { at: [14, 0.5, -112], s: 2.2, light: false },
  ];
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial {...ground} color="#9a8d7c" roughness={1} />
      </mesh>
      {/* the street: dusty asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -20]} receiveShadow>
        <planeGeometry args={[11, 100]} />
        <meshStandardMaterial map={ground.map} color="#6a625a" roughness={1} />
      </mesh>
      <InstancedC geo={box} mat={wall} items={city.walls} />
      <InstancedC geo={box} mat={slabMat} items={city.slabs} />
      <InstancedC geo={box} mat={debrisMat} items={city.chunks} />
      <InstancedC geo={rubbleGeo} mat={debrisMat} items={city.rubble} />
      <Instanced geo={rodGeo} mat={rustMat} mats={city.rebar} />
      {/* burnt-out cars */}
      {(
        [
          [-3.4, 1, 0.4],
          [3.6, -19, -0.3],
          [-3.2, -37, 2.9],
        ] as const
      ).map(([x, z, ry], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, ry, i === 1 ? 0.08 : 0]}>
          <mesh position={[0, 0.55, 0]} material={i === 2 ? rust : char} castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.7, 4.2]} />
          </mesh>
          <mesh position={[0, 1.15, -0.2]} material={char} castShadow>
            <boxGeometry args={[1.6, 0.55, 2.1]} />
          </mesh>
          {[-1.3, 1.3].map((wz) => (
            <mesh key={wz} position={[0, 0.3, wz]} rotation={[0, 0, Math.PI / 2]} material={rustMat}>
              <cylinderGeometry args={[0.32, 0.32, 1.85, 10]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* the genebank research station at the end of the street */}
      <group position={[ALEPPO_STATION[0], 0, ALEPPO_STATION[2]]}>
        <mesh position={[0, 3.2, 0]} castShadow receiveShadow material={wall}>
          <boxGeometry args={[14, 6.4, 7]} />
        </mesh>
        <mesh position={[-5.5, 7.6, -1.5]} castShadow>
          <cylinderGeometry args={[1.2, 1.2, 2.2, 14]} />
          <meshStandardMaterial color="#9aa0a3" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[-5.5, 6.6, -1.5]}>
          <cylinderGeometry args={[0.15, 0.15, 0.6, 6]} />
          <meshStandardMaterial color="#555b60" />
        </mesh>
        <Greenhouses />
      </group>
      {fires.map((f, i) => (
        <Fire key={i} at={f.at} t={t} i={i} scale={f.s} light={f.light} />
      ))}
      {/* low dust haze along the street */}
      <Puffs count={26} seed={88} box={[-9, 9, 0.5, 6, -70, 20]} size={[9, 18]} t={t} drift={[0.5, 0.05, 0]} k={1} color="#b59478" opacity={0.15} />
      {/* hazy low sun behind the far end of the street */}
      <sprite position={[-70, 48, -480]} scale={[260, 260, 1]}>
        <spriteMaterial map={tex} color={new THREE.Color("#ffb070").multiplyScalar(0.9)} transparent opacity={0.55} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh position={[-70, 48, -482]}>
        <circleGeometry args={[11, 40]} />
        <meshBasicMaterial color={new THREE.Color("#ffd6a0").multiplyScalar(2.2)} fog={false} />
      </mesh>
    </group>
  );
};

/* ───────────── C · corridor to daylight ───────────── */
export const EXIT = { W: 4, H: 3.6, z1: -14, doorW: 2.4, doorH: 2.8 } as const;

export const VaultExit: React.FC<{ readonly t: number }> = ({ t }) => {
  const rock = useWhiteRockMat([3, 2], 0.35);
  const floorPbr = usePBR("concrete_wall_008", [2, 6]);
  const floor = useMemo(() => frostify(new THREE.MeshStandardMaterial({ ...floorPbr, color: "#7e8790", roughness: 0.45 }), 0.3), [floorPbr]);
  const L = 20;
  const zc = EXIT.z1 + L / 2;
  const { W, H, doorW, doorH } = EXIT;
  const glare = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(P.snow).multiplyScalar(5) }), []);
  const shaft = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: canvasTex(4, 128, (g) => {
          const gr = g.createLinearGradient(0, 0, 0, 128);
          gr.addColorStop(0, "rgba(232,238,243,0.28)");
          gr.addColorStop(1, "rgba(232,238,243,0)");
          g.fillStyle = gr;
          g.fillRect(0, 0, 4, 128);
        }),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const side = (W - doorW) / 2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]} material={floor} receiveShadow>
        <planeGeometry args={[W, L]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, zc]} material={rock}>
        <planeGeometry args={[W, L]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[0, (-s * Math.PI) / 2, 0]} position={[(s * W) / 2, H / 2, zc]} material={rock} receiveShadow>
          <planeGeometry args={[L, H]} />
        </mesh>
      ))}
      {/* end wall with doorway */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (doorW / 2 + side / 2), H / 2, EXIT.z1]} material={rock}>
          <boxGeometry args={[side, H, 0.4]} />
        </mesh>
      ))}
      <mesh position={[0, doorH + (H - doorH) / 2, EXIT.z1]} material={rock}>
        <boxGeometry args={[doorW, H - doorH, 0.4]} />
      </mesh>
      {/* daylight beyond */}
      <mesh position={[0, 2, EXIT.z1 - 3]} material={glare}>
        <planeGeometry args={[14, 8]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, EXIT.z1 - 2]} material={glare}>
        <planeGeometry args={[8, 4]} />
      </mesh>
      {/* light shaft spilling in along the floor */}
      <mesh position={[0, doorH / 2, EXIT.z1 + 3]} rotation={[Math.PI / 2, 0, 0]} material={shaft}>
        <planeGeometry args={[doorW, 6]} />
      </mesh>
      <mesh position={[0, 0.03, EXIT.z1 + 4]} rotation={[-Math.PI / 2, 0, 0]} material={shaft}>
        <planeGeometry args={[doorW * 1.1, 8]} />
      </mesh>
      {/* dim ceiling lamps */}
      {[-2, -7].map((z) => (
        <mesh key={z} position={[0, H - 0.05, z]}>
          <boxGeometry args={[0.9, 0.06, 0.25]} />
          <meshBasicMaterial color={new THREE.Color("#cfe0ee").multiplyScalar(1.5)} />
        </mesh>
      ))}
      <Puffs count={14} seed={52} box={[-1.6, 1.6, 0.2, 2.4, EXIT.z1 + 0.5, EXIT.z1 + 4]} size={[1.2, 2.4]} t={t} drift={[0.05, 0.03, 0.25]} k={1} color="#dfe8f0" opacity={0.25} />
    </group>
  );
};

/* ───────────── C · pallet truck ───────────── */
/** Warehouse operator seen from behind (facing -z, toward the door), right hand back on the pallet-truck handle grip. */
const Operator: React.FC<{ readonly phase: number }> = ({ phase }) => {
  const parka = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2b3646", roughness: 0.85 }), []);
  const pants = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1c2027", roughness: 0.9 }), []);
  const boot = useMemo(() => new THREE.MeshStandardMaterial({ color: "#121315", roughness: 0.7 }), []);
  const stripe = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c8cfc4", roughness: 0.3, metalness: 0.2 }), []);
  const fur = useMemo(() => new THREE.MeshStandardMaterial({ color: "#6b6258", roughness: 1 }), []);
  const sw = Math.sin(phase);
  const bob = Math.abs(Math.cos(phase)) * 0.025;
  return (
    <group position={[0.05, bob, -1.5]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.1, 0.9, 0]} rotation={[s * sw * 0.38, 0, 0]}>
          <mesh position={[0, -0.42, 0]} material={pants} castShadow>
            <capsuleGeometry args={[0.072, 0.66, 6, 12]} />
          </mesh>
          <mesh position={[0, -0.83, -0.05]} material={boot} castShadow>
            <boxGeometry args={[0.12, 0.12, 0.28]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.2, 0]} scale={[1, 1, 0.78]} material={parka} castShadow>
        <capsuleGeometry args={[0.2, 0.42, 8, 16]} />
      </mesh>
      {[1.04, 1.3].map((y) => (
        <mesh key={y} position={[0, y, 0]} scale={[1, 1, 0.78]} material={stripe}>
          <cylinderGeometry args={[0.204, 0.204, 0.035, 20, 1, true]} />
        </mesh>
      ))}
      {/* hood with fur ruff */}
      <mesh position={[0, 1.64, 0.02]} material={parka} castShadow>
        <sphereGeometry args={[0.13, 16, 12]} />
      </mesh>
      <mesh position={[0, 1.64, -0.06]} rotation={[0, 0, 0]} material={fur}>
        <torusGeometry args={[0.11, 0.035, 8, 18]} />
      </mesh>
      {/* left arm swings, right arm reaches back to the handle */}
      <group position={[-0.24, 1.46, 0]} rotation={[-sw * 0.3, 0, 0.12]}>
        <mesh position={[0, -0.3, 0]} material={parka} castShadow>
          <capsuleGeometry args={[0.06, 0.48, 6, 10]} />
        </mesh>
      </group>
      <group position={[0.22, 1.46, 0.02]} rotation={[-1.2, 0, 0.32]}>
        <mesh position={[0, -0.27, 0]} material={parka} castShadow>
          <capsuleGeometry args={[0.06, 0.44, 6, 10]} />
        </mesh>
        <mesh position={[0, -0.55, 0]} material={boot}>
          <sphereGeometry args={[0.055, 10, 8]} />
        </mesh>
      </group>
    </group>
  );
};

export const PalletTruck: React.FC<{ readonly position: V }> = ({ position }) => {
  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d9902e", roughness: 0.45, metalness: 0.3 }), []);
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9aa3ab", roughness: 0.3, metalness: 0.9 }), []);
  const rubber = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1b1e21", roughness: 0.8 }), []);
  const crates = SLOTS.slice(0, 8);
  return (
    <group position={position as [number, number, number]}>
      {/* forks run under the pallet along z; pump + handle at the -z (door) end */}
      {[-0.17, 0.17].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.045, 0.05]} material={paint} castShadow>
            <boxGeometry args={[0.16, 0.05, 1.15]} />
          </mesh>
          <mesh position={[x, 0.03, 0.55]} rotation={[0, 0, Math.PI / 2]} material={rubber}>
            <cylinderGeometry args={[0.035, 0.035, 0.1, 12]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.16, -0.58]} material={paint} castShadow>
        <boxGeometry args={[0.52, 0.26, 0.14]} />
      </mesh>
      <mesh position={[0, 0.34, -0.6]} material={steel} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 14]} />
      </mesh>
      <mesh position={[0, 0.07, -0.66]} rotation={[0, 0, Math.PI / 2]} material={rubber}>
        <cylinderGeometry args={[0.08, 0.08, 0.16, 16]} />
      </mesh>
      <group position={[0, 0.48, -0.62]} rotation={[-0.45, 0, 0]}>
        <mesh position={[0, 0.5, 0]} material={paint} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.0, 8]} />
        </mesh>
        <mesh position={[0, 1.05, 0]} rotation={[0, 0, Math.PI / 2]} material={paint}>
          <torusGeometry args={[0.12, 0.02, 6, 16]} />
        </mesh>
      </group>
      <Operator phase={position[2] * ((Math.PI * 2) / 1.5)} />
      <group position={[0, 0.03, 0.05]} rotation={[0, Math.PI / 2, 0]}>
        <Pallet />
        {crates.map((s, i) => (
          <Crate key={i} info={CRATES[i === 4 ? 8 : (i + 2) % 9]} seed={500 + i} position={s} />
        ))}
      </group>
    </group>
  );
};

export { CRATE, PALLET_H };
