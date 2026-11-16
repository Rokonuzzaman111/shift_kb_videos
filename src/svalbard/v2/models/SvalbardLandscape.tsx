/**
 * Svalbard landscape (v2): Adventfjorden + flat-topped, horizontally striped snow mountains (Hiorthfjellet side)
 * across the fjord, Platåberget slope on the near side with the vault portal spot.
 * Units: 1 = 10 m. Fjord runs along x; the far shore is −z, Platåberget/near side +z.
 * Terrain = CPU-displaced grid; snow/rock by slope + strata bands in a patched MeshStandardMaterial
 * (rock_boulder_dry normal + albedo detail); reflective rippled fjord; polar-twilight sky dome; exp fog.
 * Reused by later sections behind the portal: `detail` raises grid resolution, VAULT_POS marks the portal.
 */
import { Environment, MeshReflectorMaterial, useTexture } from "@react-three/drei";
import { HDRI } from "../../../kit/assets";
import { useMemo } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";
import { fbm, noise2, rng, sstep } from "../../three/util";
import { P } from "../palette";
import { NOISE_GLSL } from "./glsl";

export const LAND = { size: 3200, x0: 0, z0: -300 } as const;

const fjordZ = (x: number) => -60 + 45 * Math.sin(x / 900 + 0.6) + 18 * Math.sin(x / 310 + 1.3);

/** mesa profile: concave scree slope → steep cliff band → flat plateau */
const profile = (m: number) => 0.4 * Math.pow(sstep(0, 0.7, m), 1.6) + 0.6 * sstep(0.58, 0.8, m);

export const heightAt = (x: number, z: number) => {
  const d = z - fjordZ(x); // >0 near side, <0 far side
  const nA = fbm(x / 260 + 3, z / 260 + 7, 4) - 0.5;
  // seabed / shores (fjord ≈ 3 km wide)
  const dS = d + (fbm(x / 120 + 5, z / 120, 3) - 0.5) * 70;
  const sea = -7 * (1 - sstep(40, 95, dS)) * (1 - sstep(-200, -255, dS));
  const plain = 1.2 * sstep(70, 140, dS) + 1.0 * sstep(-230, -280, dS) + (fbm(x / 60, z / 60, 3) - 0.5) * 1.2 * sstep(60, 160, Math.abs(d + 80));
  // far side: separate massifs between broad U-valleys — mostly flat-topped (Hiorthfjellet), some pyramidal
  const farRise = sstep(230, 600, -d + nA * 260);
  const vx = x / 700 + (fbm(x / 500 + 4, z / 500, 3) - 0.5) * 1.6;
  const valley = Math.abs(Math.sin(vx * Math.PI));
  const blob = fbm(x / 380 + 21, z / 380 + 3, 4);
  const ragged = (fbm(x / 95 + 2, z / 95 + 8, 3) - 0.5) * 0.42; // broken plateau outlines / spurs
  const massif = farRise * sstep(0, 0.95, valley * 0.9 + (blob - 0.5) * 0.9 + ragged + 0.25 * sstep(900, 1500, -d));
  const top = 34 + 112 * fbm(x / 430 + 11, z / 520, 3) + 25 * sstep(450, 1100, -d);
  let far = top * profile(massif);
  // pyramidal summits on some massifs
  const ridge = 1 - Math.abs(2 * noise2(x / 240 + 3.3, z / 240 + 1.1) - 1);
  const peakMask = sstep(0.48, 0.66, fbm(x / 800 + 40, z / 800 + 2, 2));
  far += 62 * Math.pow(ridge, 3) * sstep(0.55, 1, massif) * peakMask;
  // sedimentary benches on the cliff/scree band (warped, uneven step heights)
  const cliff = sstep(0.08, 0.32, massif) * (1 - sstep(0.86, 0.99, massif));
  if (far > 1 && cliff > 0) {
    const stepH = 6.5 + 4 * fbm(x / 600 + 1, z / 600, 2);
    const off = (fbm(x / 300 + 9, z / 300, 2) - 0.5) * 0.9;
    const ph = far / stepH + off;
    const fl = Math.floor(ph);
    far = far + ((fl + sstep(0.3, 1, ph - fl) - off) * stepH - far) * 0.5 * cliff;
  }
  // erosion gullies down the scree slopes (along the fall line ≈ z) + debris fans at their mouths
  const g = 1 - Math.abs(2 * noise2(x / 26 + fbm(x / 130, z / 130, 2) * 2.5, z / 110) - 1);
  far -= Math.pow(g, 3) * 12 * sstep(0.04, 0.3, massif) * (1 - sstep(0.62, 0.86, massif));
  far += Math.pow(g, 2) * 4.5 * sstep(0.0, 0.05, massif) * (1 - sstep(0.07, 0.2, massif));
  // near side: Platåberget (~450 m plateau)
  // concave (bowl) slope so the portal is seen from the drone above and behind it
  const nr = Math.min(1, Math.max(0, (d + nA * 140 - 170) / 560));
  const nearRise = nr;
  let near = 44 * (Math.pow(nr, 1.45) * 0.92 + 0.08 * sstep(0, 1, nr));
  near -= Math.pow(1 - Math.abs(2 * noise2(x / 30, z / 90 + 5) - 1), 3) * 4 * sstep(0.05, 0.3, nearRise) * (1 - sstep(0.7, 0.9, nearRise));
  near += (fbm(x / 18, z / 18, 3) - 0.5) * 0.8 * sstep(100, 200, d);
  return sea + plain + Math.max(0, far) + Math.max(0, near);
};

/** the vault portal sits on Platåberget's lower slope at ~130 m (13 units) */
export const VAULT_POS: [number, number, number] = (() => {
  const x = -140;
  let z = fjordZ(x) + 100;
  while (heightAt(x, z) < 13 && z < 1000) z += 1;
  return [x, heightAt(x, z), z];
})();

/** Svalbard Lufthavn runway along the near shore plain ([x, z] ends) */
export const RUNWAY: [[number, number], [number, number]] = [
  [-950, fjordZ(-950) + 125],
  [180, fjordZ(180) + 125],
];

/** small settlements (airport buildings, Longyearbyen) as instanced boxes + warm lamps */
const SETTLE = (() => {
  const r = rng(11);
  const boxes: { p: [number, number, number]; s: [number, number, number]; ry: number; c: number }[] = [];
  const lamps: [number, number, number][] = [];
  const add = (cx: number, cz: number, spread: [number, number], n: number) => {
    for (let i = 0; i < n * 3 && boxes.length < 400; i++) {
      const x = cx + (r() - 0.5) * spread[0];
      const z = cz + (r() - 0.5) * spread[1];
      const h = heightAt(x, z);
      const h2 = heightAt(x + 3, z + 3);
      if (h < 0.6 || Math.abs(h2 - h) > 1.2) continue;
      const big = r() < 0.2;
      const sx = big ? 4 + r() * 5 : 1.2 + r() * 2.2;
      const sz = big ? 2 + r() * 3 : 0.8 + r() * 1.2;
      const sy = big ? 1.2 + r() * 1.2 : 0.7 + r() * 0.6;
      boxes.push({ p: [x, h + sy / 2 - 0.15, z], s: [sx, sy, sz], ry: Math.round(r() * 2) * 0.3 + (r() - 0.5) * 0.1, c: r() });
      if (r() < 0.6) lamps.push([x + (r() - 0.5) * sx, h + 0.4, z + sz / 2 + 0.6]);
      if (boxes.length % 3 === 0 && i >= n) break;
    }
  };
  add(260, fjordZ(260) + 150, [120, 50], 10); // airport terminal & hangars
  add(640, fjordZ(640) + 160, [260, 120], 34); // Longyearbyen
  add(900, fjordZ(900) + 120, [140, 60], 12); // harbour / coal quay
  return { boxes, lamps };
})();

const Settlements: React.FC = () => {
  const { boxes, lamps } = SETTLE;
  const set = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    const cols = [new THREE.Color(P.steel), new THREE.Color(P.concrete), new THREE.Color("#3a3f45"), new THREE.Color("#5b4a42")];
    boxes.forEach((b, i) => {
      o.position.set(...b.p);
      o.scale.set(...b.s);
      o.rotation.set(0, b.ry, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, cols[Math.floor(b.c * cols.length)]);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  };
  const setL = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    lamps.forEach((p, i) => {
      o.position.set(...p);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  };
  return (
    <>
      <instancedMesh ref={set} args={[undefined, undefined, boxes.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.75} metalness={0.1} />
      </instancedMesh>
      <instancedMesh ref={setL} args={[undefined, undefined, lamps.length]}>
        <sphereGeometry args={[0.18, 8, 6]} />
        <meshStandardMaterial color="#331f05" emissive={P.amber} emissiveIntensity={9} />
      </instancedMesh>
    </>
  );
};

const terrainVertPre = /* glsl */ `
varying vec3 vWPos; varying vec3 vWN;
`;
const terrainFragPre = /* glsl */ `
varying vec3 vWPos; varying vec3 vWN;
uniform sampler2D rockAlb; uniform vec4 runway; uniform vec4 vaultF; uniform float trackOn;
${NOISE_GLSL}
vec3 bumpN(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy){
  vec3 sx = dFdx(surf_pos); vec3 sy = dFdy(surf_pos);
  vec3 r1 = cross(sy, surf_norm); vec3 r2 = cross(surf_norm, sx);
  float det = dot(sx, r1);
  vec3 g = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return normalize(abs(det) * surf_norm - g);
}
`;
const terrainColor = /* glsl */ `
vec3 wn = normalize(vWN);
float slope = 1.0 - wn.y;
float nA = fbm2(vWPos.xz * 0.03);
float nB = fbm2(vWPos.xz * 0.22);
// pixel footprint (world units): near-field detail fades in only when it can be resolved (1 unit = 10 m)
float fw = length(fwidth(vWPos.xz));
float nearK = 1.0 - smoothstep(0.006, 0.05, fw);
// broken, fault-offset strata (dark rock beds) on the steep bands
float fault = floor(vWPos.x * 0.006 + fbm2(vWPos.xz * 0.004) * 2.5);
float yW = vWPos.y + (fbm2(vWPos.xz * 0.012) - 0.5) * 9.0 + (h21(vec2(fault, 3.7)) - 0.5) * 10.0;
float strata = sin(yW * 0.3 + nB * 0.6) + 0.45 * sin(yW * 0.83 + nA * 3.0) + 0.25 * sin(yW * 2.1 + nB * 2.0);
float brk = smoothstep(0.3, 0.52, fbm2(vec2(vWPos.x * 0.05 + vWPos.z * 0.02, vWPos.y * 0.3)));
float beds = smoothstep(0.1 + (nA - 0.5) * 0.6, 0.7, strata) * (0.35 + 0.65 * brk);
float tRock = smoothstep(0.24, 0.48, slope + (nB - 0.5) * 0.25) * (0.2 + 0.8 * beds);
// fall-line gullies: snow-filled channel with dark rock ribs either side
float fall = 1.0 - abs(2.0 * n2(vec2(vWPos.x * 0.045 + nA * 3.0, vWPos.z * 0.01)) - 1.0);
float slopeBand = smoothstep(0.12, 0.3, slope);
float rib = smoothstep(0.62, 0.8, fall) * (1.0 - smoothstep(0.86, 0.94, fall));
tRock = max(tRock, rib * slopeBand * 0.85);
tRock *= 1.0 - smoothstep(0.9, 0.97, fall) * slopeBand * 0.8;
tRock = max(tRock, smoothstep(0.52, 0.72, slope + (nA - 0.5) * 0.2));
// scree fans on the lower slopes (rock debris half buried in snow)
float scree = smoothstep(0.08, 0.17, slope) * (1.0 - smoothstep(0.3, 0.42, slope))
  * smoothstep(0.55, 0.75, fbm2(vec2(vWPos.x * 0.02 + nA, vWPos.z * 0.008))) * smoothstep(3.0, 8.0, vWPos.y);
tRock = max(tRock, scree * (0.35 + 0.35 * smoothstep(0.4, 0.7, nB)));
tRock *= smoothstep(0.5, 3.0, vWPos.y);
vec3 ra = mix(texture2D(rockAlb, vWPos.xz * 0.07).rgb, texture2D(rockAlb, vWPos.xz * 1.7).rgb, nearK * 0.7);
float rl = dot(ra, vec3(0.333));
vec3 rockC = vec3(0.062, 0.064, 0.072) * (0.55 + rl * 1.5);
float nC = fbm2(vWPos.xz * vec2(0.9, 2.6));
float nD = fbm2(vWPos.xz * 0.02 + 9.0);
vec3 snowC = vec3(0.80, 0.84, 0.885) * (0.8 + 0.08 * nB + 0.05 * nC + 0.16 * nD);
float spots = smoothstep(0.66, 0.74, fbm2(vWPos.xz * 0.45 + 3.0)) * smoothstep(0.08, 0.2, slope) * smoothstep(2.0, 6.0, vWPos.y);
tRock = max(tRock, spots * 0.8);
// near field: wind ripples + sastrugi (wind from the fjord), scoured patches
vec2 wd = vec2(0.8, 0.6);
float along = dot(vWPos.xz, wd);
float across = dot(vWPos.xz, vec2(-wd.y, wd.x));
float warp = fbm2(vWPos.xz * 3.0);
float rip = sin(across * 75.0 + warp * 12.0 + fbm2(vec2(along * 4.0, across * 9.0)) * 5.0) * 0.5 + 0.5;
float sast = fbm2(vec2(along * 2.2, across * 8.0) + warp * 1.2);
float nearHb = (pow(rip, 3.0) * 0.0022 + smoothstep(0.42, 0.78, sast) * 0.014 + fbm2(vWPos.xz * 34.0) * 0.003) * nearK;
snowC *= 1.0 - nearK * (0.05 * smoothstep(0.5, 0.8, sast) - 0.03 * pow(rip, 4.0));
// tyre ruts + footprints around the vault (portal-local metres)
vec2 dV = (vWPos.xz - vaultF.xy) * 10.0;
float lx = dV.x * vaultF.z - dV.y * vaultF.w;
float lz = dV.x * vaultF.w + dV.y * vaultF.z;
float trk = 0.0;
float pathX = 6.5 + 0.0035 * (lz + 13.0) * (lz + 13.0);
for (int k = 0; k < 2; k++) {
  float off = k == 0 ? -0.85 : 0.85;
  float dd = abs(lx - pathX - off);
  trk = max(trk, (1.0 - smoothstep(0.1, 0.2, dd)) * (0.75 + 0.25 * sin(lz * 28.0)));
}
trk *= step(lz, -12.0) * step(-140.0, lz) * trackOn;
float stepI = floor(lz / 0.36);
float side = mod(stepI, 2.0) * 2.0 - 1.0;
float fpx = 2.4 + 0.7 * sin(lz * 0.07) + side * 0.12 + (h21(vec2(stepI, 1.0)) - 0.5) * 0.06;
vec2 fq = vec2((lx - fpx) / 0.05, (fract(lz / 0.36) - 0.5) * 0.36 / 0.12);
float fp = (1.0 - smoothstep(0.6, 1.0, length(fq))) * step(lz, -9.5) * step(-45.0, lz) * step(0.15, h21(vec2(stepI, 7.0))) * trackOn;
snowC *= 1.0 - 0.1 * trk - 0.03 * fp;
vec3 tc = mix(snowC, rockC, tRock);
float wet = 1.0 - smoothstep(0.1, 0.9, vWPos.y);
tc = mix(tc, vec3(0.03, 0.035, 0.042), wet * 0.85);
// airport runway (straight asphalt strip with ploughed snow edges)
vec2 ra0 = runway.xy, ra1 = runway.zw;
vec2 rd = ra1 - ra0; float rl2 = dot(rd, rd);
float rt = clamp(dot(vWPos.xz - ra0, rd) / rl2, 0.0, 1.0);
float rdist = length(vWPos.xz - (ra0 + rd * rt));
float onRw = (1.0 - smoothstep(2.0, 2.6, rdist)) * step(0.001, rt) * step(rt, 0.999);
tc = mix(tc, vec3(0.05, 0.055, 0.06) * (0.8 + 0.4 * nC), onRw * 0.9);
float apron = (1.0 - smoothstep(5.0, 7.0, rdist)) * (1.0 - onRw) * step(0.001, rt) * step(rt, 0.999);
tc = mix(tc, tc * 0.82, apron);
diffuseColor.rgb = tc;
// wind-carved drifts / sastrugi on snow, erosion relief on rock (bump, world units)
float hb = fbm2(vWPos.xz * vec2(0.16, 0.5)) * 0.35 * (1.0 - tRock) + fbm2(vWPos.xz * 0.3 + 4.0) * 0.9 * tRock
  + (nearHb - trk * 0.008 - fp * 0.0025) * (1.0 - tRock) + fbm2(vWPos.xz * 6.0) * 0.03 * nearK * tRock;
`;

const useWaveNormal = () =>
  useMemo(() => {
    const N = 256;
    const h = new Float32Array(N * N);
    const waves: [number, number, number, number][] = [
      [3, 1, 0.0, 1],
      [-2, 5, 1.3, 0.6],
      [7, -3, 2.1, 0.45],
      [11, 6, 0.7, 0.3],
      [-13, 9, 4.2, 0.22],
      [17, -14, 3.3, 0.15],
      [23, 19, 5.1, 0.1],
    ];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        let v = 0;
        for (const [kx, ky, ph, a] of waves) v += a * Math.sin(((kx * x + ky * y) / N) * Math.PI * 2 + ph);
        h[y * N + x] = v;
      }
    const cv = document.createElement("canvas");
    cv.width = cv.height = N;
    const g = cv.getContext("2d")!;
    const img = g.createImageData(N, N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const dx = h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)];
        const dy = h[((y + 1) % N) * N + x] - h[((y - 1 + N) % N) * N + x];
        const n = new THREE.Vector3(-dx * 0.25, -dy * 0.25, 1).normalize();
        const i = (y * N + x) * 4;
        img.data[i] = (n.x * 0.5 + 0.5) * 255;
        img.data[i + 1] = (n.y * 0.5 + 0.5) * 255;
        img.data[i + 2] = (n.z * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(90, 90);
    return t;
  }, []);

const skyVert = /* glsl */ `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const skyFrag = /* glsl */ `
uniform vec3 sunDir; uniform float time;
varying vec3 vW;
${NOISE_GLSL}
void main(){
  vec3 d = normalize(vW - cameraPosition);
  float y = d.y;
  float sa = max(dot(d, normalize(sunDir)), 0.0);
  // cool horizon → violet-steel mid → deep zenith (polar twilight, top_view.jpg)
  vec3 hor = vec3(0.53, 0.56, 0.67);
  vec3 mid = vec3(0.24, 0.25, 0.40);
  vec3 zen = vec3(0.035, 0.06, 0.11);
  vec3 col = mix(hor, mid, smoothstep(0.0, 0.22, y));
  col = mix(col, zen, smoothstep(0.2, 0.8, y));
  col += vec3(0.75, 0.52, 0.55) * pow(sa, 6.0) * 0.55 * (1.0 - smoothstep(0.0, 0.5, y));
  col += vec3(1.0, 0.85, 0.75) * pow(sa, 400.0) * 3.0;
  float az = atan(d.x, -d.z);
  float el = asin(clamp(y, -1.0, 1.0));
  // upper layer: streaky altostratus sheets lit pink / violet from below by the low sun
  vec2 q2 = vec2(az * 2.6 + time * 0.004, el * 7.0 + az * 0.6);
  float hw = fbm2(q2 * 1.7 + 3.0);
  float hc = fbm2(vec2(q2.x * 1.2, q2.y * 3.6) + hw * 1.6);
  float hc2 = fbm2(vec2(q2.x * 4.0, q2.y * 9.0) + hw * 2.5 + 11.0);
  float hcov = smoothstep(0.42, 0.72, hc * 0.8 + hc2 * 0.3) * smoothstep(0.07, 0.3, y) * (1.0 - smoothstep(0.7, 0.95, y));
  float pinkK = clamp(0.25 + pow(sa, 1.6) * 0.9 + (hw - 0.5) * 0.8 + (hc2 - 0.5) * 0.6, 0.0, 1.0);
  vec3 hcC = mix(vec3(0.24, 0.22, 0.36), vec3(0.96, 0.64, 0.73), pinkK);
  hcC = mix(hcC, vec3(1.0, 0.84, 0.80), pow(sa, 10.0) * 0.6);
  col = mix(col, hcC, hcov * 0.8);
  // lower layer: twilight cloud banks near the horizon
  vec2 q = vec2(az * 9.0 + time * 0.01, el * 34.0 + az * 3.0);
  vec2 w = vec2(fbm2(q * 0.8 + 2.0), fbm2(q * 0.8 + 7.3));
  float c = fbm2(q + w * 1.3);
  float c2 = fbm2(q * 3.3 + w * 2.0 + 5.0);
  float cov = smoothstep(0.4, 0.66, c * 0.85 + c2 * 0.25) * smoothstep(0.01, 0.06, y) * (1.0 - smoothstep(0.16, 0.3, y));
  float rim = smoothstep(0.5, 0.85, c2) * 0.6 + 0.4;
  float litC = clamp(pow(sa, 3.0) * 1.3 * rim + 0.2 * c2, 0.0, 1.0);
  vec3 cloudC = mix(vec3(0.17, 0.17, 0.27), vec3(1.0, 0.70, 0.76), litC);
  cloudC = mix(cloudC, vec3(0.45, 0.46, 0.58), (1.0 - smoothstep(0.0, 0.08, y)) * 0.6);
  col = mix(col, cloudC, cov * 0.9);
  col = mix(col, hor * 0.95, 1.0 - smoothstep(-0.02, 0.05, y));
  gl_FragColor = vec4(col, 1.0);
}`;

export const SKY_FOG = new THREE.Color(0.45, 0.46, 0.57);

/** landscape grid geometry (PlaneGeometry layout) for a given detail */
const gridOf = (detail: number) => {
  const cell = LAND.size / detail;
  return { cell, gx0: LAND.x0 - LAND.size / 2, gz0: LAND.z0 - LAND.size / 2 };
};

/** height of the landscape MESH (piecewise-linear over its triangles), so a finer patch can meet it seamlessly */
export const gridHeightAt = (x: number, z: number, detail: number) => {
  const { cell, gx0, gz0 } = gridOf(detail);
  const fx = (x - gx0) / cell;
  const fz = (z - gz0) / cell;
  const ix = Math.floor(fx);
  const iz = Math.floor(fz);
  const u = fx - ix;
  const v = fz - iz;
  const X0 = gx0 + ix * cell;
  const Z0 = gz0 + iz * cell;
  const ha = heightAt(X0, Z0);
  const hb = heightAt(X0, Z0 + cell);
  const hc = heightAt(X0 + cell, Z0 + cell);
  const hd = heightAt(X0 + cell, Z0);
  return u + v <= 1 ? ha + u * (hd - ha) + v * (hb - ha) : hc + (1 - u) * (hb - hc) + (1 - v) * (hd - hc);
};

/** square near-field site around the vault, snapped to the landscape grid lines (cx, cz, half-size, cell) */
export const siteBounds = (detail: number, cells = 3) => {
  const { cell, gx0, gz0 } = gridOf(detail);
  const cx = gx0 + Math.round((VAULT_POS[0] - gx0) / cell) * cell;
  const cz = gz0 + Math.round((VAULT_POS[2] - gz0) / cell) * cell;
  return { cx, cz, half: cells * cell, cell };
};

/** the terrain material (snow / strata / scree / near-field sastrugi). `vault` = [x, z, yaw] turns on tracks & footprints */
export const useTerrainMaterial = (vault?: readonly [number, number, number]) => {
  const rock = useTexture({
    alb: staticFile("assets/tex/rock_boulder_dry/rock_boulder_dry_diff_2k.jpg"),
    nor: staticFile("assets/tex/rock_boulder_dry/rock_boulder_dry_nor_gl_2k.jpg"),
  });
  const on = vault ? 1 : 0;
  const vx = vault?.[0] ?? 0;
  const vz = vault?.[1] ?? 0;
  const yaw = vault?.[2] ?? 0;
  return useMemo(() => {
    const alb = rock.alb.clone();
    alb.wrapS = alb.wrapT = THREE.RepeatWrapping;
    alb.colorSpace = THREE.SRGBColorSpace;
    alb.needsUpdate = true;
    const nor = rock.nor.clone();
    nor.wrapS = nor.wrapT = THREE.RepeatWrapping;
    nor.repeat.set(220, 220);
    nor.colorSpace = THREE.NoColorSpace;
    nor.needsUpdate = true;
    const m = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8, metalness: 0, normalMap: nor, normalScale: new THREE.Vector2(1.2, 1.2) });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.rockAlb = { value: alb };
      sh.uniforms.runway = { value: new THREE.Vector4(RUNWAY[0][0], RUNWAY[0][1], RUNWAY[1][0], RUNWAY[1][1]) };
      sh.uniforms.vaultF = { value: new THREE.Vector4(vx, vz, Math.cos(yaw), Math.sin(yaw)) };
      sh.uniforms.trackOn = { value: on };
      sh.vertexShader = terrainVertPre + sh.vertexShader.replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);",
      );
      sh.fragmentShader = terrainFragPre + sh.fragmentShader
        .replace("#include <color_fragment>", `#include <color_fragment>\n${terrainColor}`)
        .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n roughnessFactor = mix(0.62, 0.95, tRock);")
        .replace("#include <normal_fragment_maps>", "#include <normal_fragment_maps>\n normal = normalize(mix(nonPerturbedNormal, normal, 0.18 + 0.82 * tRock));\n normal = bumpN(-vViewPosition, normal, vec2(dFdx(hb), dFdy(hb)) * 1.0);");
    };
    m.customProgramCacheKey = () => "svalbard-terrain-v3";
    return m;
  }, [rock, vx, vz, yaw, on]);
};

export type LandscapeProps = {
  /** grid segments across the 32 km tile (400 drone-wide … 700 near the portal) */
  readonly detail?: number;
  readonly sunDir: THREE.Vector3;
  readonly time?: number;
  /** 0..1 teal glow of the vault speck */
  readonly vaultGlow?: number;
  readonly fog?: number;
  readonly sunIntensity?: number;
  /** focus the sun's 1024 shadow map on a small box (near-field shots) instead of the whole tile */
  readonly sunShadow?: { readonly target: readonly [number, number, number]; readonly half: number; readonly normalBias?: number; readonly bias?: number };
  /** draw the far-away vault speck (drone shots); off when the real portal is in the scene */
  readonly speck?: boolean;
  /** sink the tile under siteBounds(detail) so a finer near-field patch can replace it */
  readonly hole?: boolean;
  /** [x, z, yaw] of the portal → tyre tracks & footprints in the snow */
  readonly vault?: readonly [number, number, number];
  readonly envIntensity?: number;
};

export const SvalbardLandscape: React.FC<LandscapeProps> = ({
  detail = 400,
  sunDir,
  time = 0,
  vaultGlow = 1,
  fog = 0.00042,
  sunIntensity = 5.2,
  sunShadow,
  speck = true,
  hole = false,
  vault,
  envIntensity = 0.18,
}) => {
  const waveN = useWaveNormal();
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(LAND.size, LAND.size, detail, detail);
    g.rotateX(-Math.PI / 2);
    g.translate(LAND.x0, 0, LAND.z0);
    const p = g.attributes.position as THREE.BufferAttribute;
    const sb = hole ? siteBounds(detail) : null;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      let h = heightAt(x, z);
      if (sb && Math.abs(x - sb.cx) < sb.half - sb.cell * 0.5 && Math.abs(z - sb.cz) < sb.half - sb.cell * 0.5) h -= 6;
      p.setY(i, h);
    }
    g.computeVertexNormals();
    return g;
  }, [detail, hole]);
  const mat = useTerrainMaterial(vault);
  const skyU = useMemo(() => ({ sunDir: { value: new THREE.Vector3() }, time: { value: 0 } }), []);
  skyU.sunDir.value.copy(sunDir);
  skyU.time.value = time;
  waveN.offset.set(time * 0.004, time * 0.0025);
  const sd = sunDir.clone().normalize();
  const tgt = useMemo(() => new THREE.Object3D(), []);
  const st = sunShadow?.target ?? [0, 0, 0];
  tgt.position.set(st[0], st[1], st[2]);
  tgt.updateMatrixWorld();
  const sunPos = sunShadow ? sd.clone().multiplyScalar(sunShadow.half * 8).add(new THREE.Vector3(st[0], st[1], st[2])) : sd.clone().multiplyScalar(2000);
  const sh = sunShadow?.half ?? 1800;
  return (
    <group>
      <fogExp2 attach="fog" args={[SKY_FOG, fog]} />
      <mesh>
        <sphereGeometry args={[4200, 64, 32]} />
        <shaderMaterial vertexShader={skyVert} fragmentShader={skyFrag} uniforms={skyU} side={THREE.BackSide} depthWrite={false} fog={false} />
      </mesh>
      <Environment files={HDRI.dusk} environmentIntensity={envIntensity} resolution={256} />
      <hemisphereLight args={["#8d9fbe", P.steel, 0.38]} />
      <primitive object={tgt} />
      <directionalLight
        position={sunPos}
        target={tgt}
        intensity={sunIntensity}
        color="#ffe6dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-sh}
        shadow-camera-right={sh}
        shadow-camera-top={sh}
        shadow-camera-bottom={-sh}
        shadow-camera-near={sunShadow ? 0.1 : 10}
        shadow-camera-far={sunShadow ? sunShadow.half * 20 : 5000}
        shadow-bias={sunShadow?.bias ?? -0.0004}
        shadow-normalBias={sunShadow?.normalBias ?? 2.5}
      />
      <directionalLight position={[300, 500, 900]} intensity={0.35} color="#b9c8de" />
      <mesh geometry={geo} material={mat} castShadow={!sunShadow} receiveShadow />
      <mesh rotation-x={-Math.PI / 2} position={[LAND.x0, 0, LAND.z0]}>
        <planeGeometry args={[LAND.size, LAND.size]} />
        <MeshReflectorMaterial
          resolution={512}
          blur={[120, 40]}
          mixBlur={0.5}
          mixStrength={3.4}
          mirror={0.96}
          roughness={0.45}
          metalness={0.92}
          color="#c3ceda"
          normalMap={waveN}
          normalScale={new THREE.Vector2(0.25, 0.25)}
          distortionMap={waveN}
          distortion={0.35}
        />
      </mesh>
      <Settlements />
      {speck ? <VaultSpeck glow={vaultGlow} /> : null}
    </group>
  );
};

const glowFrag = /* glsl */ `
uniform vec3 color; uniform float k; varying vec2 vUv;
void main(){ float r = length(vUv-0.5)*2.0; float a = exp(-r*r*7.0)*0.7 + exp(-r*28.0)*1.5; gl_FragColor = vec4(color*a*k, 1.0); }`;
const glowVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(0.0,0.0,0.0,1.0); mv.xy += position.xy; gl_Position = projectionMatrix*mv; }`;

/** The portal seen from far away: a concrete wedge with a lit teal front, its glow on the snow and a soft bloom halo. */
export const VaultSpeck: React.FC<{ readonly glow: number }> = ({ glow }) => {
  const u = useMemo(() => ({ color: { value: new THREE.Color(P.vaultTeal) }, k: { value: 1 } }), []);
  u.k.value = glow * 2.4;
  const [x, y, z] = VAULT_POS;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.4, -0.6]} rotation-x={-0.25}>
        <boxGeometry args={[0.45, 1.0, 2.5]} />
        <meshStandardMaterial color={P.concrete} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.75, 0.66]}>
        <planeGeometry args={[0.42, 0.45]} />
        <meshStandardMaterial color="#0b2b28" emissive={P.vaultTeal} emissiveIntensity={4 * glow} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 1.4, 2]} color={P.vaultTeal} intensity={60 * glow} distance={18} decay={2} />
      <mesh position={[0, 0.8, 0.8]}>
        <planeGeometry args={[9, 9]} />
        <shaderMaterial vertexShader={glowVert} fragmentShader={glowFrag} uniforms={u} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
    </group>
  );
};
