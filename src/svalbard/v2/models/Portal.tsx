/**
 * Svalbard Global Seed Vault — entrance portal (v2), modelled from entrance_feb2025 / entrance_2020 / entrance_night /
 * top_view (bible §3). Built in METRES in portal-local space:
 *   x = across the 4.5 m front, y = up (0 = threshold), z = back into the mountain; front face at z = 0 faces −z.
 * <PortalSite/> drops it into SvalbardLandscape's world (1 unit = 10 m) at VAULT_POS, with a fine near-field ground
 * patch (snapped to the landscape grid, seamless at its edge), wind-packed snow drift against the uphill (−x) wall,
 * scattered rocks, galvanised truss bridge, practical lights, blowing snow and ground spindrift.
 * Everything is deterministic (rng / frame time).
 */
import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { usePBR } from "../../../kit/assets";
import { canvasTex, fbm, rng, sstep } from "../../three/util";
import { P } from "../palette";
import { NOISE_GLSL } from "./glsl";
import { VAULT_POS, gridHeightAt, heightAt, siteBounds, useTerrainMaterial } from "./SvalbardLandscape";

/** portal dimensions (m) */
export const PORTAL = { W: 4.5, H: 11, L: 26, roofEnd: 1, notch: 0.8 } as const;
/** portal axis yaw in the landscape: local +z (into the hill) → world ≈ (0.95, 0, 0.31), front faces down-fjord */
export const PORTAL_YAW = 1.257;
const CY = Math.cos(PORTAL_YAW);
const SY = Math.sin(PORTAL_YAW);
const U = 0.1; // metres → landscape units

export const roofY = (z: number) => PORTAL.H - ((PORTAL.H - PORTAL.roofEnd) * z) / PORTAL.L;

/** portal-local metres → landscape world units */
export const siteToWorld = (l: readonly number[]): [number, number, number] => {
  const [lx, ly, lz] = l;
  return [VAULT_POS[0] + (lx * CY + lz * SY) * U, VAULT_POS[1] + ly * U, VAULT_POS[2] + (-lx * SY + lz * CY) * U];
};
const worldToLocal = (wx: number, wz: number) => {
  const dx = (wx - VAULT_POS[0]) / U;
  const dz = (wz - VAULT_POS[2]) / U;
  return { lx: dx * CY - dz * SY, lz: dx * SY + dz * CY };
};

/** distance from a point to an axis-aligned rectangle (0 inside) */
const rectDist = (x: number, z: number, x0: number, x1: number, z0: number, z1: number) =>
  Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1));

/** designed ground around the portal (metres above the threshold) */
const designLocal = (lx: number, lz: number) => {
  // the real slope here rises ~0.26 towards world +z = local −x (uphill side) and a little to +z
  const tilt = -0.251 * lx + 0.0816 * lz;
  const pad = 1 - sstep(0, 7, rectDist(lx, lz, -6.5, 8, -19, 1.5));
  let h = tilt * (1 - pad);
  // the hill swallows the back of the wedge
  h += Math.max(0, lz - 11) * 0.34 * sstep(11, 22, lz) * (1 - sstep(7, 18, Math.abs(lx)));
  // pit under the bridge
  h -= 1.25 * (1 - sstep(1.25, 2.3, Math.abs(lx))) * sstep(-11.6, -10.2, lz) * (1 - sstep(-1.0, -0.1, lz));
  // ploughed banks either side of the approach
  h += 0.55 * Math.exp(-Math.pow((Math.abs(lx) - 3.4) / 0.9, 2)) * sstep(-22, -15, lz) * (1 - sstep(-3, -1, lz));
  // micro relief
  h += (fbm(lx / 7 + 3.1, lz / 7 + 1.7, 3) - 0.5) * 0.7 * (1 - pad * 0.75);
  return h;
};

const SITE_DETAIL = 400;

/** final world-unit ground height of the near-field patch (seamless with the landscape mesh at the patch border) */
export const siteHeight = (wx: number, wz: number, detail = SITE_DETAIL) => {
  const sb = siteBounds(detail);
  const { lx, lz } = worldToLocal(wx, wz);
  const r = Math.hypot(lx, lz);
  const real = heightAt(wx, wz);
  const design = VAULT_POS[1] + designLocal(lx, lz) * U;
  let h = real + (design - real) * (1 - sstep(35, 115, r));
  const cheb = Math.max(Math.abs(wx - sb.cx), Math.abs(wz - sb.cz));
  const wg = sstep(sb.half * 0.62, sb.half * 0.995, cheb);
  if (wg > 0) h += (gridHeightAt(wx, wz, detail) - h) * wg;
  return h;
};
/** ground in portal-local metres */
export const groundLocal = (lx: number, lz: number) => {
  const [wx, , wz] = siteToWorld([lx, 0, lz]);
  return (siteHeight(wx, wz) - VAULT_POS[1]) / U;
};

/* ───────────────────────────── materials ───────────────────────────── */

const concreteFrag = /* glsl */ `
float lumC = dot(diffuseColor.rgb, vec3(0.333));
diffuseColor.rgb = mix(vec3(lumC), diffuseColor.rgb, 0.3) * vec3(0.96, 1.0, 1.04) * 1.55;
bool sideW = abs(vON.x) > 0.5;
float sC = sideW ? vP.z : vP.x;
float topY = (sideW || vON.y > 0.3) ? (11.0 - vP.z * 10.0 / 26.0) : 11.0;
float below = max(topY - vP.y, 0.0);
float sn = fbm2(vec2(sC * 1.5, vP.y * 0.05));
float sn2 = fbm2(vec2(sC * 6.0, vP.y * 0.35) + 3.0);
float sLen = 1.5 + 7.0 * fbm2(vec2(sC * 0.8, 5.0));
float streak = smoothstep(0.5, 0.74, sn * 0.7 + sn2 * 0.4) * exp(-below / sLen);
float drip = smoothstep(0.78, 0.95, n2(vec2(sC * 13.0, vP.y * 0.25))) * smoothstep(0.35, 0.7, fbm2(vec2(sC * 3.0, vP.y * 0.2)));
float band = 1.0 - smoothstep(2.6, 4.4, vP.y + (fbm2(vec2(sC * 0.7, 1.0)) - 0.5) * 2.4);
float mott = fbm2(vec2(sC, vP.y) * 0.8);
float rime = smoothstep(0.64, 0.8, fbm2(vec2(sC * 0.9, vP.y * 0.6) + 7.0)) * smoothstep(5.0, 9.0, vP.y);
diffuseColor.rgb *= (1.0 - 0.5 * streak) * (1.0 - 0.25 * drip) * (1.0 - 0.22 * band) * (0.86 + 0.28 * mott);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.80, 0.83, 0.86), rime * 0.3);
`;

const useConcrete = () => {
  const pbr = usePBR("concrete_wall_008", [0.1, 0.1]);
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: pbr.map,
      normalMap: pbr.normalMap,
      roughnessMap: pbr.roughnessMap,
      normalScale: new THREE.Vector2(1.3, 1.3),
      color: "#ffffff",
      roughness: 1,
      metalness: 0,
    });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = "varying vec3 vP; varying vec3 vON;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vP = position; vON = normal;");
      sh.fragmentShader =
        "varying vec3 vP; varying vec3 vON;\n" +
        NOISE_GLSL +
        sh.fragmentShader
          .replace("#include <color_fragment>", "#include <color_fragment>\n" + concreteFrag)
          .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n roughnessFactor = clamp(roughnessFactor * (1.0 - 0.3 * streak), 0.3, 1.0);");
    };
    m.customProgramCacheKey = () => "svalbard-concrete-v2";
    return m;
  }, [pbr]);
};

const useSteel = (tint = "#b8c0c7", rough = 0.42, metal = 0.85, rep: [number, number] = [0.6, 0.6]) => {
  const pbr = usePBR("metal_plate", rep);
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: tint,
        map: pbr.map,
        normalMap: pbr.normalMap,
        roughnessMap: pbr.roughnessMap,
        normalScale: new THREE.Vector2(0.6, 0.6),
        roughness: rough,
        metalness: metal,
        envMapIntensity: 1.4,
      }),
    [pbr, tint, rough, metal],
  );
};

/** wind-packed snow (drifts): soft ripples + sastrugi bump in world space, faint sparkle */
const snowFrag = /* glsl */ `
vec3 sm = vSW * 10.0;
float sw = fbm2(sm.xz * 0.35);
float rp = sin(dot(sm.xz, vec2(-0.6, 0.8)) * 7.0 + sw * 9.0 + sm.y * 1.5) * 0.5 + 0.5;
float hS = pow(rp, 3.0) * 0.02 + fbm2(sm.xz * 0.6 + sm.y * 0.3) * 0.12 + fbm2(sm.xz * 3.0) * 0.02;
`;
const useSnow = () =>
  useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: "#d6dde6", roughness: 0.78, metalness: 0 });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = "varying vec3 vSW;\n" + sh.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\n vSW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader =
        "varying vec3 vSW;\n" +
        NOISE_GLSL +
        `vec3 bumpS(vec3 p, vec3 n, vec2 d){ vec3 sx=dFdx(p), sy=dFdy(p); vec3 r1=cross(sy,n), r2=cross(n,sx); float det=dot(sx,r1); return normalize(abs(det)*n - sign(det)*(d.x*r1+d.y*r2)); }\n` +
        sh.fragmentShader
          .replace("#include <color_fragment>", "#include <color_fragment>\n" + snowFrag + "\n diffuseColor.rgb *= 0.93 + 0.1 * sw;")
          .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\n normal = bumpS(-vViewPosition, normal, vec2(dFdx(hS), dFdy(hS)) * 0.1);");
    };
    m.customProgramCacheKey = () => "svalbard-snow-v1";
    return m;
  }, []);

/* ───────────────────────────── geometry helpers ───────────────────────────── */

type Seg = [readonly [number, number, number], readonly [number, number, number], number];

/** instanced square bars between point pairs (truss members, frames) */
const Bars: React.FC<{ readonly segs: Seg[]; readonly material: THREE.Material; readonly cast?: boolean }> = ({ segs, material, cast = true }) => {
  const set = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    const up = new THREE.Vector3(0, 1, 0);
    segs.forEach(([a, b, w], i) => {
      const A = new THREE.Vector3(...a);
      const B = new THREE.Vector3(...b);
      const d = B.clone().sub(A);
      o.position.copy(A).addScaledVector(d, 0.5);
      o.quaternion.setFromUnitVectors(up, d.clone().normalize());
      o.scale.set(w, d.length(), w);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  };
  return (
    <instancedMesh ref={set} args={[undefined, material, segs.length]} castShadow={cast} receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
    </instancedMesh>
  );
};

/** the concrete wedge (one merged geometry in portal space, so streaks/panels are continuous) */
const useWedgeGeometry = () =>
  useMemo(() => {
    const { W, L, notch } = PORTAL;
    const s = new THREE.Shape();
    // shape space: x = portal z, y = portal y
    s.moveTo(0, -1.6);
    s.lineTo(0, 2.75);
    s.lineTo(notch, 2.75);
    s.lineTo(notch, 10.75);
    s.lineTo(0, 10.75);
    s.lineTo(0, 11);
    s.lineTo(L, PORTAL.roofEnd);
    s.lineTo(L, -1.6);
    s.closePath();
    const bt = 0.045;
    const g = new THREE.ExtrudeGeometry(s, { depth: W - 2 * bt, bevelEnabled: true, bevelThickness: bt, bevelSize: 0.045, bevelSegments: 2, steps: 1 });
    g.rotateY(-Math.PI / 2);
    g.translate(W / 2 - bt, 0, 0);
    // side jambs of the recess
    const jamb = (sx: number) => {
      const b = new THREE.BoxGeometry(0.3, 8.0, notch + 0.02, 1, 1, 1).toNonIndexed();
      b.translate(sx * (W / 2 - 0.15), 6.75, notch / 2 - 0.01);
      return b;
    };
    const gg = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(gg.attributes)) if (!["position", "normal", "uv"].includes(k)) gg.deleteAttribute(k);
    const parts = [gg, jamb(-1), jamb(1)];
    for (const p of parts) for (const k of Object.keys(p.attributes)) if (!["position", "normal", "uv"].includes(k)) p.deleteAttribute(k);
    parts.forEach((p) => p.clearGroups());
    const m = mergeGeometries(parts, false)!;
    m.computeBoundingSphere();
    return m;
  }, []);

/** crumpled mirror triangle (a triangle folded along a crease) */
const useShardGeometry = () =>
  useMemo(() => {
    const g = new THREE.BufferGeometry();
    const A = [-0.5, -0.35, 0];
    const B = [0.5, -0.3, 0];
    const C = [0.05, 0.55, 0];
    const M = [0.0, -0.33, 0.16];
    const pos = [...A, ...M, ...C, ...M, ...B, ...C];
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
  }, []);

const SHARDS = (() => {
  const r = rng(2008);
  const out: { p: [number, number, number]; e: [number, number, number]; s: [number, number, number]; lit: boolean }[] = [];
  for (let i = 0; i < 520; i++) {
    const s = 0.18 + Math.pow(r(), 1.6) * 0.5;
    out.push({
      p: [-1.85 + r() * 3.7, 6.75 + r() * 3.95, 0.08 + r() * 0.66],
      e: [r() * Math.PI * 2, r() * Math.PI * 2, r() * Math.PI * 2],
      s: [s * (0.7 + r() * 0.6), s, s * (0.6 + r() * 0.8)],
      lit: r() < 0.14,
    });
  }
  return out;
})();
const LEDS = (() => {
  const r = rng(77);
  return Array.from({ length: 46 }, () => [-1.8 + r() * 3.6, 6.8 + r() * 3.85, 0.15 + r() * 0.55] as [number, number, number]);
})();

const setInstances = (items: { p: readonly number[]; e?: readonly number[]; s?: readonly number[] }[]) => (m: THREE.InstancedMesh | null) => {
  if (!m) return;
  const o = new THREE.Object3D();
  items.forEach((it, i) => {
    o.position.set(it.p[0], it.p[1], it.p[2]);
    if (it.e) o.rotation.set(it.e[0], it.e[1], it.e[2]);
    else o.rotation.set(0, 0, 0);
    if (it.s) o.scale.set(it.s[0], it.s[1], it.s[2]);
    else o.scale.set(1, 1, 1);
    o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
  });
  m.instanceMatrix.needsUpdate = true;
};

/* ───────────────────────────── canvas textures ───────────────────────────── */

const LOGO_PTS: [number, number][] = [
  [0, 0.82],
  [0.16, 0.82],
  [0.16, 0.2],
  [1.62, 0.2],
  [1.98, -0.02],
  [0, -0.02],
];

const useSignTextures = () =>
  useMemo(() => {
    const letters = canvasTex(1024, 512, (g) => {
      g.clearRect(0, 0, 1024, 512);
      g.fillStyle = "#fff";
      g.font = "600 128px Arial, Helvetica, sans-serif";
      (g as unknown as { letterSpacing: string }).letterSpacing = "6px";
      g.textBaseline = "top";
      ["SVALBARD", "GLOBAL", "SEED VAULT"].forEach((l, i) => g.fillText(l, 8, 16 + i * 160));
    });
    const halo = canvasTex(512, 256, (g) => {
      g.clearRect(0, 0, 512, 256);
      const sx = 200;
      const tx = (x: number) => 56 + x * sx;
      const ty = (y: number) => 200 - y * sx;
      g.filter = "blur(22px)";
      g.fillStyle = "rgba(255,182,72,0.9)";
      g.beginPath();
      LOGO_PTS.forEach(([x, y], i) => (i ? g.lineTo(tx(x), ty(y)) : g.moveTo(tx(x), ty(y))));
      g.closePath();
      g.fill();
      g.filter = "blur(6px)";
      g.strokeStyle = "rgba(255,214,150,1)";
      g.lineWidth = 9;
      g.stroke();
    });
    const grating = canvasTex(
      128,
      128,
      (g) => {
        g.fillStyle = "#0a0d10";
        g.fillRect(0, 0, 128, 128);
        g.fillStyle = "#9aa2a8";
        for (let i = 0; i < 4; i++) g.fillRect(i * 32, 0, 6, 128);
        for (let j = 0; j < 2; j++) g.fillRect(0, j * 64, 128, 5);
      },
      [7, 34],
    );
    const roofGlass = canvasTex(512, 1024, (g) => {
      g.fillStyle = "#06120f";
      g.fillRect(0, 0, 512, 1024);
      const r = rng(5);
      for (let i = 0; i < 260; i++) {
        const x = r() * 512;
        const y = r() * 1024;
        const s = 14 + r() * 40;
        const a = r() * Math.PI * 2;
        const l = r();
        g.fillStyle = l > 0.86 ? "rgba(120,255,232,0.95)" : `rgba(${40 + l * 60},${150 + l * 70},${140 + l * 60},${0.25 + l * 0.35})`;
        g.beginPath();
        for (let k = 0; k < 3; k++) g.lineTo(x + Math.cos(a + k * 2.1 + r() * 0.5) * s, y + Math.sin(a + k * 2.1 + r() * 0.5) * s);
        g.fill();
      }
      g.strokeStyle = "rgba(160,170,180,0.9)";
      g.lineWidth = 8;
      for (let j = 1; j < 6; j++) {
        g.beginPath();
        g.moveTo(0, (j * 1024) / 6);
        g.lineTo(512, (j * 1024) / 6);
        g.stroke();
      }
      g.strokeRect(0, 0, 512, 1024);
    });
    return { letters, halo, grating, roofGlass };
  }, []);

/* ───────────────────────────── the portal ───────────────────────────── */

export type PortalProps = {
  /** 0..1 art-panel glow */
  readonly glow?: number;
  /** seconds (shimmer of the panel lights) */
  readonly time?: number;
};

export const Portal: React.FC<PortalProps> = ({ glow = 1, time = 0 }) => {
  const concrete = useConcrete();
  const steel = useSteel("#c3cad0", 0.38, 0.9, [0.5, 0.5]);
  const galv = useSteel("#d5dbe0", 0.42, 0.6, [0.8, 0.8]);
  const darkSteel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1a1f25", roughness: 0.55, metalness: 0.7 }), []);
  const wedge = useWedgeGeometry();
  const shard = useShardGeometry();
  const tx = useSignTextures();
  const mirror = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e6eef0", metalness: 1, roughness: 0.1, side: THREE.DoubleSide, envMapIntensity: 1.6 }), []);
  const litMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#123b36", emissive: P.vaultTeal, emissiveIntensity: 1, metalness: 0.6, roughness: 0.25, side: THREE.DoubleSide }), []);
  litMat.emissiveIntensity = (1.6 + 0.35 * Math.sin(time * 2.1)) * glow;
  const ledMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(P.vaultTeal).multiplyScalar(6) }), []);
  ledMat.color.set(P.vaultTeal).multiplyScalar(5 * glow);
  const { W } = PORTAL;
  const shardsMirror = SHARDS.filter((s) => !s.lit);
  const shardsLit = SHARDS.filter((s) => s.lit);
  const slats = Array.from({ length: 24 }, (_, i) => ({ p: [0, 2.92 + i * 0.155, 0.12] as const, e: [-0.62, 0, 0] as const }));

  // truss bridge: deck from z −10.6 to −0.15, sides at x = ±1.05
  const truss = useMemo(() => {
    const segs: Seg[] = [];
    const z0 = -10.6;
    const z1 = -0.18;
    const n = 6;
    const yb = 0.1;
    const yt = 1.12;
    for (const sx of [-1.05, 1.05]) {
      segs.push([[sx, yb, z0], [sx, yb, z1], 0.07]);
      const zt0 = z0 + (z1 - z0) / (2 * n);
      segs.push([[sx, yt, zt0], [sx, yt, z1 - (z1 - z0) / (2 * n)], 0.07]);
      for (let i = 0; i < n; i++) {
        const za = z0 + ((z1 - z0) * i) / n;
        const zm = za + (z1 - z0) / (2 * n);
        const zb = za + (z1 - z0) / n;
        segs.push([[sx, yb, za], [sx, yt, zm], 0.055]);
        segs.push([[sx, yt, zm], [sx, yb, zb], 0.055]);
      }
    }
    for (let i = 0; i <= 6; i++) {
      const z = z0 + ((z1 - z0) * i) / 6;
      segs.push([[-1.05, 0.0, z], [1.05, 0.0, z], 0.06]);
    }
    return segs;
  }, []);
  const frame = useMemo<Seg[]>(
    () => [
      [[-1.95, 0, -0.06], [-1.95, 10.8, -0.06], 0.09],
      [[1.95, 0, -0.06], [1.95, 10.8, -0.06], 0.09],
      [[-1.99, 10.76, -0.06], [1.99, 10.76, -0.06], 0.09],
      [[-1.99, 6.66, -0.06], [1.99, 6.66, -0.06], 0.12],
      [[-1.99, 2.78, -0.06], [1.99, 2.78, -0.06], 0.1],
    ],
    [],
  );

  return (
    <group>
      {/* concrete wedge */}
      <mesh geometry={wedge} material={concrete} castShadow receiveShadow />

      {/* steel front frame + sills */}
      <Bars segs={frame} material={steel} />
      <mesh position={[0, 6.6, 0.36]} castShadow material={steel}>
        <boxGeometry args={[3.9, 0.1, 0.84]} />
      </mesh>

      {/* art panel: back wall, mirror shards, lit shards, LEDs, frosted glass */}
      <mesh position={[0, 8.72, PORTAL.notch - 0.04]}>
        <planeGeometry args={[3.9, 4.0]} />
        <meshStandardMaterial color="#071715" emissive={P.vaultTeal} emissiveIntensity={0.16 * glow} roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={setInstances(shardsMirror)} args={[shard, mirror, shardsMirror.length]} />
      <instancedMesh ref={setInstances(shardsLit)} args={[shard, litMat, shardsLit.length]} />
      <instancedMesh ref={setInstances(LEDS.map((p) => ({ p })))} args={[undefined, ledMat, LEDS.length]}>
        <sphereGeometry args={[0.022, 6, 4]} />
      </instancedMesh>
      <pointLight position={[-0.9, 7.8, 0.45]} color={P.vaultTeal} intensity={0.07 * glow} distance={0.35} decay={2} />
      <pointLight position={[0.8, 9.7, 0.4]} color="#5cf0d6" intensity={0.07 * glow} distance={0.35} decay={2} />
      <pointLight position={[0.2, 8.6, -0.25]} color="#d9fff8" intensity={0.03 * glow} distance={0.3} decay={2} />
      <mesh position={[0, 8.72, -0.02]}>
        <planeGeometry args={[3.84, 3.96]} />
        <meshStandardMaterial color="#dfeeee" transparent opacity={0.16} roughness={0.12} metalness={0.1} envMapIntensity={2} depthWrite={false} />
      </mesh>

      {/* louvre grille */}
      <mesh position={[0, 4.7, 0.62]}>
        <planeGeometry args={[3.9, 3.9]} />
        <meshStandardMaterial color="#07090c" roughness={0.9} />
      </mesh>
      <instancedMesh ref={setInstances(slats)} args={[undefined, steel, slats.length]} castShadow receiveShadow>
        <boxGeometry args={[3.86, 0.018, 0.2]} />
      </instancedMesh>

      {/* double door, bar handle, keypad */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.975, 1.36, -0.05]} castShadow receiveShadow material={steel}>
          <boxGeometry args={[1.93, 2.68, 0.06]} />
        </mesh>
      ))}
      <mesh position={[0, 1.36, -0.085]} material={darkSteel}>
        <boxGeometry args={[0.02, 2.68, 0.01]} />
      </mesh>
      <mesh position={[0.16, 1.25, -0.16]} material={steel} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 1.25, 10]} />
      </mesh>
      {[0.68, 1.82].map((y) => (
        <mesh key={y} position={[0.16, y, -0.12]} rotation-x={Math.PI / 2} material={steel}>
          <cylinderGeometry args={[0.012, 0.012, 0.09, 6]} />
        </mesh>
      ))}
      <mesh position={[1.45, 1.45, -0.1]} material={darkSteel}>
        <boxGeometry args={[0.16, 0.22, 0.04]} />
      </mesh>

      {/* lit glass strip on the roof (first ~8 m) */}
      <mesh position={[0, roofY(4.1) + 0.03, 4.1]} rotation-x={-Math.PI / 2 + Math.atan((PORTAL.H - PORTAL.roofEnd) / PORTAL.L)}>
        <planeGeometry args={[3.5, 8.6]} />
        <meshStandardMaterial map={tx.roofGlass} emissiveMap={tx.roofGlass} emissive="#ffffff" emissiveIntensity={0.9 * glow} roughness={0.08} metalness={0.2} />
      </mesh>

      {/* side wall (−x, uphill): amber back-lit logo bracket + raised steel letters */}
      <group position={[-W / 2 - 0.004, 0, 0]} rotation-y={-Math.PI / 2}>
        <mesh position={[3.95, 6.95, 0.0]}>
          <planeGeometry args={[2.56, 1.28]} />
          <meshBasicMaterial map={tx.halo} transparent blending={THREE.AdditiveBlending} depthWrite={false} color={new THREE.Color(1.6, 1.2, 0.8)} toneMapped={false} />
        </mesh>
        <mesh position={[2.95 + 0.22, 6.55, 0.06]} castShadow>
          <extrudeGeometry args={[new THREE.Shape(LOGO_PTS.map(([x, y]) => new THREE.Vector2(x, y))), { depth: 0.05, bevelEnabled: false }]} />
          <meshStandardMaterial color="#d7dde2" metalness={0.8} roughness={0.35} emissive={P.amber} emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[4.4 + 0.03, 5.45 - 0.03, 0.006]}>
          <planeGeometry args={[2.3, 1.15]} />
          <meshBasicMaterial alphaMap={tx.letters} transparent color="#000000" opacity={0.55} depthWrite={false} />
        </mesh>
        <mesh position={[4.4, 5.45, 0.02]}>
          <planeGeometry args={[2.3, 1.15]} />
          <meshStandardMaterial alphaMap={tx.letters} transparent color="#d4dade" metalness={0.75} roughness={0.32} depthWrite={false} />
        </mesh>
        <pointLight position={[4.0, 7.0, 0.35]} color={P.amber} intensity={0.006} distance={0.25} decay={2} />
      </group>

      {/* security cameras */}
      {(
        [
          [-2.3, 3.7, -0.1, -0.6],
          [-2.32, 4.35, 1.6, -1.2],
          [2.3, 3.4, -0.1, 0.6],
        ] as const
      ).map(([x, y, z, r], i) => (
        <group key={i} position={[x, y, z]} rotation-y={r}>
          <mesh position={[0, 0, -0.14]} material={galv} castShadow>
            <boxGeometry args={[0.13, 0.11, 0.26]} />
          </mesh>
          <mesh position={[0, 0.06, 0]} material={galv}>
            <boxGeometry args={[0.04, 0.04, 0.12]} />
          </mesh>
        </group>
      ))}

      {/* door lamp (soft amber practical) */}
      <mesh position={[-1.7, 3.0, -0.14]} material={darkSteel}>
        <boxGeometry args={[0.24, 0.1, 0.16]} />
      </mesh>
      <mesh position={[-1.7, 2.944, -0.14]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[0.2, 0.12]} />
        <meshBasicMaterial color={new THREE.Color(P.amber).multiplyScalar(4)} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[-1.7, 2.8, -0.45]} color={P.amber} intensity={0.035} distance={1.0} decay={2} />
      <LightCone position={[-1.7, 2.94, -0.16]} height={2.9} radius={1.5} color={P.amber} strength={0.22} />

      {/* cool bounce from the snowfield onto the shaded uphill wall (no shadow; default target = world origin, so it arrives along ≈ the −x wall normal) */}
      <directionalLight position={[-10, 4, -6]} intensity={2.2} color="#c6d3e4" />
      {/* teal spill from the art panel onto the snow and bridge */}
      <pointLight position={[0, 8.6, -1.6]} color={P.vaultTeal} intensity={0.1 * glow} distance={2.6} decay={2} />

      {/* galvanised truss bridge + grating deck + bearers */}
      <Bars segs={truss} material={galv} />
      <mesh position={[0, 0.02, -5.39]} receiveShadow castShadow>
        <boxGeometry args={[2.1, 0.05, 10.42]} />
        <meshStandardMaterial map={tx.grating} color="#c9d0d6" roughness={0.55} metalness={0.7} />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, -0.2, -5.4]} material={darkSteel} castShadow>
          <boxGeometry args={[0.12, 0.34, 10.6]} />
        </mesh>
      ))}
      <mesh position={[0, -0.75, -11.0]} material={concrete} receiveShadow>
        <boxGeometry args={[2.6, 1.5, 1.0]} />
      </mesh>
    </group>
  );
};

/* ───────────────────────────── volumetric-looking lamp cone ───────────────────────────── */

const coneVert = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying float vH;
void main(){ vH = uv.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }`;
const coneFrag = /* glsl */ `
uniform vec3 color; uniform float k; varying vec3 vN; varying vec3 vV; varying float vH;
void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); float a = f * pow(vH, 1.8) * k; gl_FragColor = vec4(color * a, 1.0); }`;

export const LightCone: React.FC<{ readonly position: readonly [number, number, number]; readonly height: number; readonly radius: number; readonly color: string; readonly strength: number }> = ({
  position,
  height,
  radius,
  color,
  strength,
}) => {
  const u = useMemo(() => ({ color: { value: new THREE.Color(color) }, k: { value: strength } }), [color, strength]);
  return (
    <mesh position={[position[0], position[1] - height / 2, position[2]]}>
      <cylinderGeometry args={[0.06, radius, height, 24, 1, true]} />
      <shaderMaterial vertexShader={coneVert} fragmentShader={coneFrag} uniforms={u} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};

/* ───────────────────────────── snow drift, rocks, posts ───────────────────────────── */

const DRIFT = { x0: -19, x1: -2.2, z0: -3.4, z1: 30, nx: 70, nz: 120 } as const;

/** wind-packed drift height (m) against the uphill (−x) side wall */
const driftH = (lx: number, lz: number, gWall: number) => {
  const d = -2.25 - lx;
  if (d < -0.05) return 0;
  const top = Math.min(4.7 + 0.13 * Math.max(0, lz - 3) + (fbm(lz / 5, 1.3, 3) - 0.5) * 1.4, roofY(lz) + 0.5);
  const front = sstep(-3.3, 2.6, lz);
  const Hw = Math.max(0, top - gWall) * front;
  const D = 4.5 + Hw * 1.15 + (fbm(lz / 8, 4.2, 2) - 0.5) * 3;
  const s = Math.max(0, d) / D;
  if (s >= 1) return 0;
  const crest = Math.pow(1 - s, 1.5) * (1 - 0.1 * Math.exp(-Math.pow(d / 0.35, 2)));
  return Hw * crest + (fbm(lx / 2.5, lz / 2.5, 2) - 0.5) * 0.25 * crest;
};

const useDriftGeometry = () =>
  useMemo(() => {
    const { x0, x1, z0, z1, nx, nz } = DRIFT;
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz);
    g.rotateX(-Math.PI / 2);
    g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    const wallG = new Map<number, number>();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const key = Math.round(z * 100);
      if (!wallG.has(key)) wallG.set(key, groundLocal(-2.25, z));
      const h = driftH(x, z, wallG.get(key)!);
      p.setY(i, groundLocal(x, z) + h - (h < 0.02 ? 0.25 : 0.05));
    }
    g.computeVertexNormals();
    return g;
  }, []);

const ROCKS = (() => {
  const r = rng(404);
  const out: { p: [number, number, number]; e: [number, number, number]; s: [number, number, number] }[] = [];
  let guard = 0;
  while (out.length < 90 && guard++ < 2000) {
    const ang = r() * Math.PI * 2;
    const rad = 7 + Math.pow(r(), 0.8) * 95;
    const lx = Math.cos(ang) * rad;
    const lz = Math.sin(ang) * rad;
    if (Math.abs(lx) < 7 && lz > -22 && lz < 32) continue;
    if (lx < -2 && lx > -20 && lz > -4 && lz < 31) continue;
    const s = (0.25 + Math.pow(r(), 2.5) * 1.6) * (rad > 40 ? 1.5 : 1);
    out.push({ p: [lx, -s * 0.4, lz], e: [r() * 3, r() * 6, r() * 3], s: [s * (0.8 + r() * 0.6), s * (0.45 + r() * 0.35), s * (0.8 + r() * 0.5)] });
  }
  return out;
})();

const useRockGeometry = () =>
  useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
      const k = 0.75 + 0.5 * fbm(v.x * 1.3 + 4, v.y * 1.3 + v.z * 0.7, 3);
      v.multiplyScalar(k);
      v.y = Math.max(v.y, -0.6);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);

/* ───────────────────────────── blowing snow + spindrift ───────────────────────────── */

const flakeVert = /* glsl */ `
attribute vec4 seed;
uniform float time; uniform vec3 bmin; uniform vec3 bsize; uniform vec3 wind; uniform float px;
varying float vA;
void main(){
  vec3 p = seed.xyz * bsize + wind * time * (0.6 + 0.8 * seed.w);
  p += vec3(sin(time * 1.7 + seed.w * 40.0), sin(time * 2.3 + seed.x * 30.0) * 0.6, cos(time * 1.3 + seed.y * 50.0)) * 0.35;
  p = bmin + mod(p, bsize);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float sz = (0.018 + 0.03 * fract(seed.w * 7.13)) * 0.1;
  gl_PointSize = clamp(sz * px / -mv.z, 1.0, 26.0);
  vA = (0.35 + 0.65 * fract(seed.w * 3.7)) * smoothstep(0.02, 0.08, -mv.z) * (1.0 - smoothstep(3.0, 5.5, -mv.z));
  gl_Position = projectionMatrix * mv;
}`;
const flakeFrag = /* glsl */ `
uniform float op; varying float vA;
void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; float a = (1.0 - smoothstep(0.2, 1.0, r)) * vA * op; gl_FragColor = vec4(vec3(0.86, 0.9, 0.96) * a, a); }`;

const Flakes: React.FC<{ readonly time: number; readonly opacity: number; readonly px: number }> = ({ time, opacity, px }) => {
  const geo = useMemo(() => {
    const n = 2600;
    const r = rng(91);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3));
    const s = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) s[i] = r();
    g.setAttribute("seed", new THREE.Float32BufferAttribute(s, 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e5);
    return g;
  }, []);
  const u = useMemo(
    () => ({
      time: { value: 0 },
      bmin: { value: new THREE.Vector3(-30, -1, -34) },
      bsize: { value: new THREE.Vector3(44, 19, 42) },
      wind: { value: new THREE.Vector3(6.5, -0.6, 2.2) },
      px: { value: 1000 },
      op: { value: 1 },
    }),
    [],
  );
  u.time.value = time;
  u.op.value = opacity;
  u.px.value = px;
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial vertexShader={flakeVert} fragmentShader={flakeFrag} uniforms={u} transparent depthWrite={false} blending={THREE.NormalBlending} />
    </points>
  );
};

const driftVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const driftFrag = /* glsl */ `
uniform float time; uniform float op; uniform float seed; varying vec2 vUv;
${NOISE_GLSL}
void main(){
  vec2 q = vec2(vUv.x * 9.0 - time * 1.4, vUv.y * 2.2) + seed;
  float n = fbm2(q + vec2(fbm2(q * 1.7 - time * 0.6), 0.0) * 1.4);
  float a = smoothstep(0.42, 0.85, n) * pow(1.0 - vUv.y, 1.7) * smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x)) * op;
  gl_FragColor = vec4(vec3(0.88, 0.92, 0.97) * a, a);
}`;

const Spindrift: React.FC<{ readonly time: number; readonly opacity: number }> = ({ time, opacity }) => {
  const sheets = [
    { p: [-6, 0.9, -15] as const, ry: 0.55, w: 34, h: 1.9, seed: 1.3 },
    { p: [-2, 0.7, -21] as const, ry: 0.45, w: 40, h: 1.5, seed: 7.1 },
    { p: [-14, 1.4, -4] as const, ry: 0.9, w: 30, h: 2.6, seed: 4.4 },
  ];
  return (
    <>
      {sheets.map((s) => (
        <mesh key={s.seed} position={[s.p[0], s.p[1] + groundLocal(s.p[0], s.p[2]), s.p[2]]} rotation-y={s.ry}>
          <planeGeometry args={[s.w, s.h]} />
          <shaderMaterial
            vertexShader={driftVert}
            fragmentShader={driftFrag}
            uniforms={{ time: { value: time }, op: { value: opacity * 0.5 }, seed: { value: s.seed } }}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
};

/* ───────────────────────────── the site (patch + portal + props) ───────────────────────────── */

const usePatchGeometry = (detail: number) =>
  useMemo(() => {
    const sb = siteBounds(detail);
    const segs = 384;
    const g = new THREE.PlaneGeometry(sb.half * 2, sb.half * 2, segs, segs);
    g.rotateX(-Math.PI / 2);
    g.translate(sb.cx, 0, sb.cz);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, siteHeight(p.getX(i), p.getZ(i), detail));
    g.computeVertexNormals();
    return g;
  }, [detail]);

export type PortalSiteProps = PortalProps & {
  /** landscape detail the patch must stitch into (must match <SvalbardLandscape detail/>) */
  readonly detail?: number;
  /** blowing-snow amount 0..1 */
  readonly snow?: number;
  /** vertical pixel scale for flakes = proj[1][1] * H / 2 */
  readonly px?: number;
};

export const PortalSite: React.FC<PortalSiteProps> = ({ detail = SITE_DETAIL, glow = 1, time = 0, snow = 1, px = 1600 }) => {
  const patch = usePatchGeometry(detail);
  const terrain = useTerrainMaterial(PORTAL_VAULT);
  const snowMat = useSnow();
  const drift = useDriftGeometry();
  const rockGeo = useRockGeometry();
  const rockPbr = usePBR("rock_boulder_dry", [1, 1]);
  const rockMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: rockPbr.map, normalMap: rockPbr.normalMap, roughnessMap: rockPbr.roughnessMap, color: "#5e6064", roughness: 1 }),
    [rockPbr],
  );
  const galvPost = useSteel("#9aa3ab", 0.5, 0.7, [0.3, 0.3]);
  const rocks = useMemo(() => ROCKS.map((r) => ({ ...r, p: [r.p[0], r.p[1] + groundLocal(r.p[0], r.p[2]), r.p[2]] as [number, number, number] })), []);
  const posts = useMemo(
    () =>
      [
        [-9, 24],
        [-4, 27],
        [1.5, 30],
        [7, 33],
        [12.5, 36],
      ].map(([x, z]) => [[x, groundLocal(x, z) - 0.2, z], [x, groundLocal(x, z) + 1.9, z], 0.06] as Seg),
    [],
  );
  return (
    <group>
      <mesh geometry={patch} material={terrain} receiveShadow />
      <group position={VAULT_POS} rotation-y={PORTAL_YAW} scale={U}>
        <Portal glow={glow} time={time} />
        <mesh geometry={drift} material={snowMat} castShadow receiveShadow />
        <instancedMesh ref={setInstances(rocks)} args={[rockGeo, rockMat, rocks.length]} castShadow receiveShadow />
        <Bars segs={posts} material={galvPost} />
        {snow > 0 ? <Spindrift time={time} opacity={snow} /> : null}
        {snow > 0 ? <Flakes time={time} opacity={snow} px={px} /> : null}
      </group>
    </group>
  );
};

const PORTAL_VAULT = [VAULT_POS[0], VAULT_POS[2], PORTAL_YAW] as const;
/** [x, z, yaw] for <SvalbardLandscape vault/> (tracks & footprints in the snow) */
export const VAULT_FRAME = PORTAL_VAULT;

useTexture.preload([
  staticFile("assets/tex/concrete_wall_008/concrete_wall_008_diff_2k.jpg"),
  staticFile("assets/tex/metal_plate/metal_plate_diff_2k.jpg"),
]);
