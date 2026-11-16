/**
 * Photoreal Earth (v2): NASA Blue Marble day map + city-lights night map, soft sun terminator,
 * ocean sun-glint, procedural fbm cloud shell with cloud shadows, limb atmosphere scattering, starfield + sun.
 * Farmland belts (procedural lat/lon regions × land mask) glow green (`glow`) and die to brown/grey (`desat` 0..1,
 * spreading across the globe through a noise front).
 * The Earth sits at the origin, unrotated: lon 0 faces +z, north = +y (same convention as util.latLon).
 */
import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { staticFile } from "remotion";
import * as THREE from "three";
import { rng } from "../../three/util";
import { NOISE_GLSL } from "./glsl";

export const EARTH_R = 10;

/** farmland regions: lat, lon, half-size lat, half-size lon (deg) */
const FARMS: [number, number, number, number][] = [
  [26, 84, 5, 11], // Ganges plain → Bangladesh
  [23.8, 90.3, 2.5, 2.5], // Bangladesh delta
  [30.5, 75, 3.5, 4], // Punjab
  [19, 77, 5, 5], // Deccan
  [35, 116, 5, 5], // North China plain
  [30, 112, 3, 6], // Yangtze
  [46, 126, 4, 5], // NE China
  [15, 102, 4, 4], // Thailand / Mekong
  [42, -92, 5, 11], // US Midwest corn belt
  [38, -99, 5, 4], // Great Plains
  [49, 12, 5, 16], // Europe
  [48.5, 33, 3.5, 9], // Ukraine
  [52, 70, 3, 9], // Kazakh steppe wheat
  [-16, -50, 7, 8], // Brazil cerrado
  [-34, -61, 4, 5], // Pampas
  [-33, 145, 3, 5], // Murray-Darling
];

const farmGLSL = `
float farmMask(float lat, float lon){
  float m = 0.;
  ${FARMS.map(([la, lo, a, b]) => `{ vec2 d = vec2((lat-(${la.toFixed(1)}))/${a.toFixed(1)}, (lon-(${lo.toFixed(1)}))/${b.toFixed(1)}); m = max(m, exp(-dot(d,d)*1.6)); }`).join("\n  ")}
  return m;
}`;

const SHARED = /* glsl */ `
${NOISE_GLSL}
float cloudDensity(vec3 n, float t){
  vec3 p = n*3.2;
  vec3 q = vec3(fbm3(p + vec3(0.0, t*0.02, 0.0)), fbm3(p + vec3(5.2, 1.3, 2.8)), fbm3(p + vec3(1.7, 9.2, 3.1)));
  float c = fbm3(p*1.6 + q*2.2 + vec3(t*0.015, 0.0, 0.0));
  float lat = abs(n.y);
  // more cloud in the storm tracks (~50-65°) and ITCZ, clear subtropics
  float band = 0.55 + 0.25*smoothstep(0.55, 0.85, lat) + 0.12*(1.0 - smoothstep(0.0, 0.15, lat)) - 0.12*smoothstep(0.3, 0.45, lat)*(1.0-smoothstep(0.45,0.6,lat));
  float d = smoothstep(0.62 - band*0.18, 0.78 - band*0.12, c);
  float det = fbm3(n*28.0 + q*3.0);
  float fine = fbm3(n*90.0 + q*5.0);
  return clamp(d * (0.35 + 0.7*det) * (0.6 + 0.6*fine), 0.0, 1.0);
}`;

const earthVert = /* glsl */ `
varying vec3 vN; varying vec3 vW;
void main(){
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const earthFrag = /* glsl */ `
uniform sampler2D dayMap; uniform sampler2D nightMap;
uniform vec3 sunDir; uniform float desat; uniform float glow; uniform float time; uniform float cloudShadow;
varying vec3 vN; varying vec3 vW;
${SHARED}
${farmGLSL}
vec4 sampleEq(sampler2D tex, vec3 n){
  float lat = asin(clamp(n.y, -1.0, 1.0));
  float lon = atan(n.x, n.z);
  vec2 uv = vec2(lon / 6.2831853 + 0.5, lat / 3.1415927 + 0.5);
  vec2 uv2 = vec2(fract(uv.x + 0.5), uv.y);
  vec2 dx = dFdx(uv), dy = dFdy(uv), dx2 = dFdx(uv2), dy2 = dFdy(uv2);
  if (abs(dx.x) + abs(dy.x) > abs(dx2.x) + abs(dy2.x)) { dx = dx2; dy = dy2; }
  return textureGrad(tex, uv, dx, dy);
}
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(cameraPosition - vW);
  vec3 L = normalize(sunDir);
  float ndl = dot(n, L);
  vec3 day = sampleEq(dayMap, n).rgb;
  vec3 night = sampleEq(nightMap, n).rgb;
  vec3 ds = pow(day, vec3(1.0/2.2));
  float land = smoothstep(0.015, 0.07, max(ds.r, ds.g) - ds.b*0.78);
  float ice = smoothstep(0.55, 0.75, ds.b) * land;
  float lat = degrees(asin(clamp(n.y,-1.0,1.0)));
  float lon = degrees(atan(n.x, n.z));
  // farmland: regional mask broken into field patches
  float patchy = smoothstep(0.35, 0.6, fbm3(n*60.0)) * 0.5 + 0.5;
  float farm = farmMask(lat, lon) * land * (1.0 - ice) * patchy;
  float lum = dot(day, vec3(0.2126, 0.7152, 0.0722));
  vec3 green = vec3(0.03, 0.13, 0.012) * (0.9 + 2.5*lum);
  vec3 col = mix(day, green, clamp(farm * glow, 0.0, 1.0));
  // death front: noise threshold sweeping from Asia outward
  float thr = 0.12 + 0.55*fbm3(n*2.5) + 0.25*(1.0 - smoothstep(-60.0, 120.0, abs(lon - 85.0)));
  thr = 1.0 - thr;
  float dead = smoothstep(thr - 0.08, thr + 0.08, desat);
  vec3 dry = vec3(lum) * vec3(1.0, 0.82, 0.62) * 1.3;
  col = mix(col, dry, dead * land * (1.0 - ice) * (0.6 + 0.4*clamp(farm*1.6, 0.0, 1.0)));
  // sun
  float lit = clamp(ndl, 0.0, 1.0);
  float twi = smoothstep(-0.12, 0.08, ndl);
  float shadow = 1.0 - cloudShadow * cloudDensity(normalize(n + L*0.012), time) * 0.6;
  vec3 c = col * (lit * 2.1 + 0.015) * shadow * twi;
  // ocean glint
  float ocean = 1.0 - land;
  vec3 h = normalize(L + v);
  float nh = max(dot(n, h), 0.0);
  float fresO = pow(1.0 - max(dot(n, v), 0.0), 5.0);
  c += vec3(1.0, 0.95, 0.88) * ocean * twi * (pow(nh, 400.0) * 5.0 + pow(nh, 60.0) * 0.12 + fresO*0.08) * shadow;
  // city lights on the night side
  float dark = 1.0 - smoothstep(-0.18, 0.04, ndl);
  c += night * vec3(1.0, 0.72, 0.38) * 2.6 * dark * land;
  // aerial perspective + limb scattering
  float mu = max(dot(n, v), 0.0);
  float fres = pow(1.0 - mu, 2.6);
  vec3 sky = vec3(0.18, 0.42, 1.0);
  float sunSide = smoothstep(-0.25, 0.45, ndl);
  c = mix(c, sky * (0.12 + lit*0.5), (0.07 + 0.65*fres) * sunSide);
  c += sky * pow(1.0 - mu, 6.0) * sunSide * 0.6;
  gl_FragColor = vec4(c, 1.0);
}`;

const cloudFrag = /* glsl */ `
uniform vec3 sunDir; uniform float time; uniform float opacity;
varying vec3 vN; varying vec3 vW;
${SHARED}
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(cameraPosition - vW);
  float ndl = dot(n, normalize(sunDir));
  float d = cloudDensity(n, time);
  float lit = clamp(ndl * 1.1 + 0.05, 0.0, 1.0);
  float twi = smoothstep(-0.15, 0.1, ndl);
  float edge = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 c = vec3(1.0, 0.99, 0.97) * (lit * 1.35 + 0.01) * twi;
  c = mix(c, vec3(0.6, 0.75, 1.0) * lit, edge * 0.5);
  gl_FragColor = vec4(c, d * opacity * (1.0 - edge*0.6));
}`;

const atmoVert = /* glsl */ `
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const atmoFrag = /* glsl */ `
uniform vec3 sunDir; uniform float R; uniform float H; uniform float strength;
varying vec3 vW;
void main(){
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vW - ro);
  float tca = max(dot(-ro, rd), 0.0);
  vec3 pc = ro + rd*tca;
  float b = length(pc);
  float alt = b - R;
  float g = alt > 0.0 ? exp(-alt / H) : exp(alt / (H*0.35)) * 0.9;
  vec3 up = normalize(pc);
  float sun = smoothstep(-0.35, 0.4, dot(up, normalize(sunDir)));
  vec3 col = mix(vec3(0.10, 0.30, 1.0), vec3(0.55, 0.78, 1.0), smoothstep(0.0, 1.0, g));
  gl_FragColor = vec4(col * g * sun * strength, 1.0);
}`;

const starVert = /* glsl */ `
attribute float mag; varying float vMag;
void main(){ vMag = mag; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 1.0 + mag*2.2; }`;
const starFrag = /* glsl */ `
varying float vMag;
void main(){ vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.5, 0.0, length(d)); gl_FragColor = vec4(vec3(0.85,0.9,1.0) * (0.25 + vMag*1.1) * a, 1.0); }`;

const sunFrag = /* glsl */ `
varying vec2 vUv;
void main(){ float r = length(vUv - 0.5)*2.0; float core = smoothstep(0.08, 0.0, r); float halo = exp(-r*5.0)*0.6 + exp(-r*14.0);
  gl_FragColor = vec4(vec3(1.0,0.97,0.92) * (core*8.0 + halo*1.6), 1.0); }`;
const uvVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

export const Stars: React.FC<{ readonly count?: number; readonly radius?: number }> = ({ count = 2600, radius = 1500 }) => {
  const geo = useMemo(() => {
    const r = rng(7);
    const pos = new Float32Array(count * 3);
    const mag = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos.set([Math.cos(th) * s * radius, u * radius, Math.sin(th) * s * radius], i * 3);
      mag[i] = Math.pow(r(), 6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("mag", new THREE.BufferAttribute(mag, 1));
    return g;
  }, [count, radius]);
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial vertexShader={starVert} fragmentShader={starFrag} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

export const Sun: React.FC<{ readonly dir: THREE.Vector3; readonly dist?: number; readonly size?: number }> = ({ dir, dist = 1200, size = 60 }) => {
  const p = dir.clone().normalize().multiplyScalar(dist);
  return (
    <mesh position={p} onUpdate={(m) => m.lookAt(0, 0, 0)}>
      <planeGeometry args={[size, size]} />
      <shaderMaterial vertexShader={uvVert} fragmentShader={sunFrag} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};

export type EarthProps = {
  /** 0..1 crops die (spreading front) */
  readonly desat?: number;
  /** 0..1 farmland green emphasis */
  readonly glow?: number;
  readonly cloudOpacity?: number;
  /** seconds, drives cloud drift */
  readonly time?: number;
  readonly sunDir: THREE.Vector3;
  /** camera distance from the Earth's centre (picks the atmosphere shell side) */
  readonly camDist: number;
  readonly atmosphere?: number;
};

export const Earth: React.FC<EarthProps> = ({ desat = 0, glow = 0, cloudOpacity = 1, time = 0, sunDir, camDist, atmosphere = 1 }) => {
  const [dayMap, nightMap] = useTexture([staticFile("svalbard/tex/earth_day.jpg"), staticFile("svalbard/tex/earth_night.jpg")]);
  useMemo(() => {
    for (const t of [dayMap, nightMap]) {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.wrapS = THREE.RepeatWrapping;
      t.needsUpdate = true;
    }
  }, [dayMap, nightMap]);
  const earthU = useMemo(
    () => ({
      dayMap: { value: dayMap },
      nightMap: { value: nightMap },
      sunDir: { value: new THREE.Vector3() },
      desat: { value: 0 },
      glow: { value: 0 },
      time: { value: 0 },
      cloudShadow: { value: 1 },
    }),
    [dayMap, nightMap],
  );
  const cloudU = useMemo(() => ({ sunDir: { value: new THREE.Vector3() }, time: { value: 0 }, opacity: { value: 1 } }), []);
  const atmoU = useMemo(() => ({ sunDir: { value: new THREE.Vector3() }, R: { value: EARTH_R }, H: { value: EARTH_R * 0.014 }, strength: { value: 1 } }), []);
  earthU.sunDir.value.copy(sunDir);
  earthU.desat.value = desat;
  earthU.glow.value = glow;
  earthU.time.value = time;
  earthU.cloudShadow.value = cloudOpacity;
  cloudU.sunDir.value.copy(sunDir);
  cloudU.time.value = time;
  cloudU.opacity.value = cloudOpacity;
  atmoU.sunDir.value.copy(sunDir);
  atmoU.strength.value = 1.6 * atmosphere;
  const shell = EARTH_R * 1.08;
  return (
    <group>
      <mesh>
        <sphereGeometry args={[EARTH_R, 256, 128]} />
        <shaderMaterial vertexShader={earthVert} fragmentShader={earthFrag} uniforms={earthU} />
      </mesh>
      <mesh scale={1.007}>
        <sphereGeometry args={[EARTH_R, 192, 96]} />
        <shaderMaterial vertexShader={earthVert} fragmentShader={cloudFrag} uniforms={cloudU} transparent depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[shell, 128, 64]} />
        <shaderMaterial
          vertexShader={atmoVert}
          fragmentShader={atmoFrag}
          uniforms={atmoU}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={camDist > shell ? THREE.FrontSide : THREE.BackSide}
        />
      </mesh>
    </group>
  );
};
