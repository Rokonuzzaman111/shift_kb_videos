/**
 * OWNER: science3d agent.
 * Realistic translucent human brain, built procedurally. Centred near origin,
 * ~1.8 units wide (x), ~1.7 tall (y, incl. stem), ~2.1 long (z), front faces +z.
 *  - Two cerebral hemispheres with a longitudinal fissure, temporal lobes and a Sylvian fissure;
 *    gyri/sulci from zero-crossings of 3D noise (sharp sulci, rounded gyri), cavity-shaded vertex colours.
 *  - Cerebellum with fine folia, brain stem.
 *  - Shader: fresnel rim (subsurface look), emissive neural sparks driven by `glow`, desaturate/darken by `dim`.
 *  - glow: 0..1 overall alertness glow · dim: 0..1 sleepiness · t: shot seconds (deterministic)
 */
import { useMemo } from "react";
import * as THREE from "three";
import { glowTexture, makeNoise3, smoothstep } from "./sci/util";

const GROOVE = new THREE.Color("#4a1c20");
const MID = new THREE.Color("#a8676a");
const CROWN = new THREE.Color("#e2ae9f");

/** Cerebral hemisphere. side = -1 (left, x<0) or +1 (right). */
const buildHemisphere = (side: 1 | -1, rings = 300, segs = 440) => {
  const n1 = makeNoise3(`gyri${side}`);
  const n2 = makeNoise3(`gyri2${side}`);
  const nb = makeNoise3(`shape${side}`);
  const cx = side * 0.47;
  const verts: number[] = [];
  const cols: number[] = [];
  const crown: number[] = [];
  const idx: number[] = [];
  const col = new THREE.Color();
  for (let i = 0; i <= rings; i++) {
    const th = (i / rings) * Math.PI; // from lateral pole to medial pole (axis = x)
    for (let j = 0; j <= segs; j++) {
      const ph = (j / segs) * Math.PI * 2;
      // dir: lx = lateral-ness (+ outward), y up, z front
      const lx = Math.cos(th);
      const dy = Math.sin(th) * Math.cos(ph);
      const dz = Math.sin(th) * Math.sin(ph);
      // base ellipsoid with flat medial wall and flatter underside
      let x = lx >= 0 ? 0.47 * lx : -0.45 * Math.pow(-lx, 0.32);
      let y = dy >= 0 ? 0.74 * dy : 0.42 * dy;
      let z = dz >= 0 ? 1.0 * dz : 1.06 * dz;
      // occipital narrower, frontal blunt
      const back = Math.max(0, -dz);
      x *= 1 - 0.18 * back * back;
      y *= 1 - 0.12 * back * back;
      // higher at the crown, slightly towards the back
      y += 0.06 * Math.exp(-((dz + 0.15) ** 2) / 0.3) * Math.max(0, dy);
      // temporal lobe bulge: lateral, below, front-mid
      const tl = Math.max(0, lx + 0.2) * Math.max(0, -dy) * Math.exp(-((dz - 0.15) ** 2) / 0.18);
      y -= 0.28 * tl;
      x += 0.06 * tl;
      // underside frontal lobe tucked up
      if (dy < 0 && dz > 0.3) y *= 1 - 0.35 * (dz - 0.3);
      // gentle large-scale irregularity
      const pre = nb(x * 1.4, y * 1.4, z * 1.4) * 0.03;
      const r = Math.hypot(x, y, z) || 1;
      x += (x / r) * pre;
      y += (y / r) * pre;
      z += (z / r) * pre;

      // --- gyri & sulci (lateral-ish surfaces only; medial wall stays smooth)
      const px = x * side + cx; // world-ish for noise variety
      // winding gyri = evenly spaced "contour lines" of a domain-warped low-frequency field
      const wx = n2(px * 2.2 + 3, y * 2.2, z * 2.2) * 0.6;
      const nv = n1(px * 1.7 + 11 + wx, y * 1.9 - wx, z * 1.6 + wx) + 0.35 * n2(px * 3.4, y * 3.4 + 4, z * 3.4);
      const s = Math.sin(nv * 17);
      const a = Math.abs(s);
      const crownK = Math.pow(a, 0.4); // narrow V sulcus at 0, broad rounded crown
      // Sylvian (lateral) fissure: oblique groove on the lateral face
      const sy = (() => {
        if (lx < 0.15) return 0;
        const t0 = Math.min(1, Math.max(0, (0.62 - z) / 0.95));
        const ly = mixf(-0.12, 0.2, t0);
        const dist = Math.abs(y - ly);
        return (z < 0.62 && z > -0.4 ? 1 : 0) * Math.exp(-((dist / 0.035) ** 2)) * smoothstep(0.15, 0.4, lx);
      })();
      // central sulcus: a deeper vertical-ish groove from crown down the side
      const cs = Math.exp(-(((z + 0.05 - 0.18 * y) / 0.03) ** 2)) * smoothstep(0.1, 0.5, y + 0.2 * lx) * 0.6;
      const medial = lx < -0.15 ? smoothstep(-0.15, -0.45, lx) : 0;
      const depth = 0.06 * (1 - medial * 0.85);
      const disp = depth * (crownK - 1) - 0.07 * sy - 0.04 * cs + 0.008 * crownK;
      const rr = Math.hypot(x, y, z) || 1;
      x += (x / rr) * disp;
      y += (y / rr) * disp;
      z += (z / rr) * disp;
      verts.push(x * side + cx, y + 0.12, z);
      const cav = Math.min(Math.pow(a, 0.75), 1 - sy * 0.9, 1 - cs * 0.5);
      col.copy(GROOVE).lerp(MID, smoothstep(0, 0.45, cav)).lerp(CROWN, smoothstep(0.45, 1, cav));
      cols.push(col.r, col.g, col.b);
      crown.push(cav);
    }
  }
  const row = segs + 1;
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * row + j;
      const b = a + row;
      // winding so normals face outwards for both sides
      if (side === 1) idx.push(a, b, a + 1, b, b + 1, a + 1);
      else idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  g.setAttribute("aCrown", new THREE.Float32BufferAttribute(crown, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};
const mixf = (a: number, b: number, k: number) => a + (b - a) * k;

const buildCerebellum = () => {
  const g = new THREE.SphereGeometry(1, 160, 100);
  const n = makeNoise3("cbl");
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const cols: number[] = [];
  const crown: number[] = [];
  const v = new THREE.Vector3();
  const col = new THREE.Color();
  for (let k = 0; k < pos.count; k++) {
    v.fromBufferAttribute(pos, k);
    const d = v.clone();
    // two lobes with a vermis notch at the back
    let x = d.x * 0.6;
    let y = d.y * (d.y > 0 ? 0.27 : 0.25);
    let z = d.z * 0.4;
    const notch = Math.exp(-((d.x / 0.12) ** 2)) * Math.max(0, -d.z) * 0.08;
    z += notch;
    // folia: fine parallel grooves (curved)
    const f = Math.sin((d.y * 0.27 + 0.05 * n(d.x * 2, d.y * 2, d.z * 2)) * 70 + d.x * d.x * 4);
    const a = Math.abs(f);
    const crownK = 1 - (1 - a) * (1 - a);
    const disp = 0.018 * (crownK - 1);
    const r = Math.hypot(x, y, z) || 1;
    x += (x / r) * disp;
    y += (y / r) * disp;
    z += (z / r) * disp;
    pos.setXYZ(k, x, y - 0.4, z - 0.68);
    col.copy(GROOVE).lerp(MID, smoothstep(0, 0.5, crownK)).lerp(CROWN, smoothstep(0.5, 1, crownK) * 0.8);
    cols.push(col.r, col.g, col.b);
    crown.push(crownK);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  g.setAttribute("aCrown", new THREE.Float32BufferAttribute(crown, 1));
  g.computeVertexNormals();
  return g;
};

const buildStem = () => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const k = i / 24;
    const pons = Math.exp(-(((k - 0.35) / 0.15) ** 2)) * 0.06;
    pts.push(new THREE.Vector2(0.16 - 0.06 * k + pons, -k * 0.75));
  }
  const g = new THREE.LatheGeometry(pts, 48);
  const pos = g.getAttribute("position") as THREE.BufferAttribute;
  const cols: number[] = [];
  const crown: number[] = [];
  for (let k = 0; k < pos.count; k++) {
    cols.push(MID.r * 0.95, MID.g * 0.9, MID.b * 0.9);
    crown.push(0.6);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  g.setAttribute("aCrown", new THREE.Float32BufferAttribute(crown, 1));
  g.translate(0, -0.12, 0);
  g.rotateX(0.32);
  g.translate(0, 0, -0.3);
  return g;
};

let CACHE: { left: THREE.BufferGeometry; right: THREE.BufferGeometry; cbl: THREE.BufferGeometry; stem: THREE.BufferGeometry } | null = null;
const geos = () => {
  if (!CACHE) CACHE = { left: buildHemisphere(-1), right: buildHemisphere(1), cbl: buildCerebellum(), stem: buildStem() };
  return CACHE;
};

const NOISE_GLSL = /* glsl */ `
uniform float uTime;
uniform float uGlow;
uniform float uDim;
uniform vec3 uRim;
uniform vec3 uAct;
varying vec3 vPos;
varying float vCrown;
float bh(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(bh(i+vec3(0,0,0)), bh(i+vec3(1,0,0)), f.x), mix(bh(i+vec3(0,1,0)), bh(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(bh(i+vec3(0,0,1)), bh(i+vec3(1,0,1)), f.x), mix(bh(i+vec3(0,1,1)), bh(i+vec3(1,1,1)), f.x), f.y), f.z);
}
`;

const makeMaterial = (uniforms: Record<string, THREE.IUniform>) => {
  const m = new THREE.MeshPhysicalMaterial({
    vertexColors: true,
    roughness: 0.38,
    clearcoat: 0.45,
    clearcoatRoughness: 0.28,
    sheen: 0.5,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color("#ffc4bd"),
    specularIntensity: 0.6,
  });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aCrown;\nvarying vec3 vPos;\nvarying float vCrown;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPos = position;\nvCrown = aCrown;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${NOISE_GLSL}`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lum) * vec3(0.62, 0.6, 0.66), uDim * 0.85);
        diffuseColor.rgb *= 1.0 - uDim * 0.45;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        {
          vec3 Vd = normalize(vViewPosition);
          float fr = pow(1.0 - clamp(abs(dot(normal, Vd)), 0.0, 1.0), 2.2);
          // subsurface-ish: light leaking at grazing angles and in thin crowns
          totalEmissiveRadiance += uRim * fr * (0.55 + 0.45 * vCrown) * (1.0 - uDim * 0.75);
          totalEmissiveRadiance += vec3(0.16, 0.05, 0.05) * vCrown * (1.0 - uDim);
          float a = vnoise(vPos * 9.0 + vec3(0.0, uTime * 0.7, uTime * 0.35));
          float b = vnoise(vPos * 2.6 - vec3(uTime * 0.22, 0.0, uTime * 0.17));
          float spark = smoothstep(0.74, 0.96, a) * smoothstep(0.45, 0.85, b);
          float flick = 0.55 + 0.45 * sin(uTime * 11.0 + dot(floor(vPos * 9.0), vec3(3.1, 1.7, 2.3)));
          totalEmissiveRadiance += uAct * spark * flick * uGlow * 2.6 * (0.4 + 0.6 * vCrown);
        }`,
      );
  };
  return m;
};

export const Brain: React.FC<{
  readonly t: number;
  readonly glow?: number;
  readonly dim?: number;
  readonly position?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: number;
  /** activity colour (default amber-white sparks) */
  readonly activity?: string;
  /** inner backlight glow amount (translucency) */
  readonly inner?: number;
}> = ({ t, glow = 0.5, dim = 0, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, activity = "#ffd08a", inner = 1 }) => {
  const g = geos();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uGlow: { value: 0 },
      uDim: { value: 0 },
      uRim: { value: new THREE.Color("#ff8f86") },
      uAct: { value: new THREE.Color("#ffd08a") },
    }),
    [],
  );
  const mat = useMemo(() => makeMaterial(uniforms), [uniforms]);
  uniforms.uTime.value = t;
  uniforms.uGlow.value = glow;
  uniforms.uDim.value = dim;
  (uniforms.uRim.value as THREE.Color).set("#ff8f86").multiplyScalar(0.55);
  (uniforms.uAct.value as THREE.Color).set(activity);
  return (
    <group position={position as [number, number, number]} rotation={rotation as [number, number, number]} scale={scale}>
      <mesh geometry={g.left} material={mat} castShadow receiveShadow />
      <mesh geometry={g.right} material={mat} castShadow receiveShadow />
      <mesh geometry={g.cbl} material={mat} castShadow receiveShadow />
      <mesh geometry={g.stem} material={mat} castShadow />
      {/* translucency: warm light glowing through from inside/behind */}
      <sprite position={[0, 0.1, -0.4]} scale={[3.4, 3.0, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color="#ff7a6a"
          transparent
          opacity={0.22 * inner * (1 - dim * 0.8)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
};
