/**
 * Part 1 · Section 1A (storyboard A1–A3): Earth hook → dive to Svalbard → where (globe, north-pole view).
 * A1 "পৃথিবীর সব ফসল একদিন হারিয়ে গেলে" — photoreal Earth, slow orbit + push; farmland belts glow green on "ফসল",
 *    die to brown across the globe from "হারিয়ে".
 * A2 "আবার শুরু হবে এই পাহাড়ের ভেতর থেকে" — speed-ramped dive through the cloud deck to a drone view of
 *    Adventfjorden; the vault's teal speck on Platåberget brightens on "ভেতর".
 * A3 "নরওয়ের স্‌ভালবার্ড দ্বীপপুঞ্জে, উত্তর মেরুর কাছাকাছি" — crane out to the globe over the Arctic: pins নরওয়ে →
 *    স্‌ভালবার্ড, dashed arc to the Pole + "উত্তর মেরু / ~১,৩০০ কিমি".
 * One ThreeCanvas; the globe and the landscape are swapped under cloud whiteouts. Every beat keys off a VO word.
 */
import { useTexture } from "@react-three/drei";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { PostFX } from "../../../kit/PostFX";
import { Lens, Stage } from "../../../kit/Stage";
import { ease, mix, mix3, prog } from "../../../kit/time";
import { latLon, project, rng, type V3 } from "../../three/util";
import { atAfter } from "../../vo";
import { EARTH_R, Earth, Stars, Sun } from "../models/Earth";
import { NOISE_GLSL } from "../models/glsl";
import { SvalbardLandscape, VAULT_POS } from "../models/SvalbardLandscape";
import { P, bn, pa } from "../palette";
import { DashedArc, PinLabel } from "../ui/PinLabel";

useTexture.preload([staticFile("svalbard/tex/earth_day.jpg"), staticFile("svalbard/tex/earth_night.jpg")]);

/** the word the part assembler cuts on (cut sits just before it) */
export const S1A_END_WORD = "একটা";
export const s1aEnd = (a = 0) => atAfter("p1", S1A_END_WORD, a) - 0.12;

const W = 1080;
const H = 1920;

type Cam = { position: V3; target: V3; mm: number; near: number; far: number; scene: "globe" | "land"; desat: number };

const v3 = (p: readonly number[]): V3 => [p[0], p[1], p[2]];
const scale3 = (p: readonly number[], k: number): V3 => [p[0] * k, p[1] * k, p[2] * k];
const norm3 = (p: readonly number[]): V3 => {
  const l = Math.hypot(p[0], p[1], p[2]);
  return [p[0] / l, p[1] / l, p[2] / l];
};
/** slerp-ish between two directions (normalised lerp is enough for these spans) */
const dirMix = (a: readonly number[], b: readonly number[], k: number) => norm3(mix3(a, b, k));

const SVALBARD = [78.2, 15.6] as const;
const NORWAY = [61.8, 9.5] as const;

const times = (a: number) => {
  const w = (word: string) => atAfter("p1", word, a) - a;
  const fasol = w("ফসল");
  const harie = w("হারিয়ে");
  const abar = w("আবার");
  const shuru = w("শুরু");
  const bhetor = w("ভেতর");
  const norway = w("নরওয়ের");
  const svalbard = w("স্‌ভালবার্ড");
  const uttor = w("উত্তর");
  const meru = w("মেরুর");
  const end = s1aEnd(a) - a;
  const dive = abar - 0.12; // dive starts on "আবার"
  const swap = shuru + 0.12; // through the clouds → landscape
  const a3 = norway - 0.32; // crane out → globe
  return { fasol, harie, abar, shuru, bhetor, norway, svalbard, uttor, meru, end, dive, swap, a3 };
};

const SUN_A1 = new THREE.Vector3(...latLon(12, 2)).normalize();
const SUN_A3 = new THREE.Vector3(...latLon(18, -28)).normalize();
const SUN_LAND = new THREE.Vector3(0.5, 0.1, -0.86).normalize();

const camAt = (t: number, T: ReturnType<typeof times>): Cam => {
  const R = EARTH_R;
  if (t < T.swap) {
    // A1: slow orbit + push over South Asia
    const k1 = prog(t, 0, T.dive + 0.4);
    const lat = mix(20, 24, k1);
    const lon = mix(70, 80, k1);
    const dist0 = mix(29, 26, ease.outCubic(prog(t, 0, T.dive + 0.4)));
    const dirA1 = latLon(lat, lon);
    const tgtA1: V3 = [0, 2.2, 0];
    if (t < T.dive) {
      return { position: scale3(dirA1, dist0), target: tgtA1, mm: 35, near: 0.05, far: 4000, scene: "globe", desat: 0 };
    }
    // A2 dive: speed-ramped (accelerating) fall towards Svalbard
    const k = prog(t, T.dive, T.swap);
    const kd = ease.cine(prog(t, T.dive, T.swap - 0.05));
    const dirEnd = latLon(73.5, 14);
    const dir = dirMix(dirA1, dirEnd, kd);
    const alt0 = dist0 - R;
    const alt = alt0 * Math.pow(0.4 / alt0, Math.pow(k, 1.5));
    const tgt = mix3(tgtA1, latLon(SVALBARD[0], SVALBARD[1], R), ease.cine(prog(t, T.dive, T.dive + 0.35)));
    return { position: scale3(dir, R + alt), target: v3(tgt), mm: mix(35, 24, k), near: 0.01, far: 4000, scene: "globe", desat: 0 };
  }
  if (t < T.a3) {
    // A2 landing: fall through the cloud deck, flare out into a drone view across Adventfjorden
    const [vx, vy, vz] = VAULT_POS;
    const kf = ease.out(prog(t, T.swap, T.swap + 1.15));
    const ks = prog(t, T.swap + 0.6, T.a3);
    const p0: V3 = [vx + 160, 640, vz + 700];
    const p1: V3 = [vx + 46, vy + 74, vz + 410];
    const p2: V3 = [vx + 40, vy + 70, vz + 380];
    const t0: V3 = [vx - 20, 0, vz - 220];
    const t1: V3 = [vx - 20, vy + 70 - 105, vz + 380 - 1000];
    let pos = mix3(mix3(p0, p1, kf), p2, ks * 0.6);
    // last beat: rise back out (crane up into the clouds)
    const up = ease.inQuad(prog(t, T.a3 - 0.3, T.a3));
    pos = mix3(pos, [pos[0], pos[1] + 260, pos[2] + 80], up);
    const tgt = mix3(t0, t1, ease.out(prog(t, T.swap + 0.05, T.swap + 1.2)));
    return { position: pos, target: tgt, mm: mix(22, 55, kf), near: 0.5, far: 9000, scene: "land", desat: 0 };
  }
  // A3: crane up/out over the Arctic
  const kc = ease.cine(prog(t, T.a3, T.a3 + 1.5));
  const kd = prog(t, T.a3, T.end);
  const dir = dirMix(latLon(74, 16), latLon(63, 20 + kd * 4), kc);
  const dist = mix(R + 1.2, R + 13.5, kc) + kd * 0.6;
  const tgt = mix3(latLon(SVALBARD[0], SVALBARD[1], R), latLon(72.5, 12, R * 0.96), kc);
  return { position: scale3(dir, dist), target: v3(tgt), mm: 35, near: 0.02, far: 4000, scene: "globe", desat: 1 };
};

/** layered cloud deck the camera falls through (landscape scale) */
const deckFrag = /* glsl */ `
uniform float seed; uniform float op; varying vec2 vUv;
${NOISE_GLSL}
void main(){
  vec2 p = vUv * 9.0 + seed;
  float c = fbm2(p + fbm2(p*0.6 + seed*1.7)*1.6);
  float a = smoothstep(0.42, 0.72, c) * op;
  float r = length(vUv - 0.5) * 2.0;
  a *= 1.0 - smoothstep(0.6, 1.0, r);
  vec3 col = mix(vec3(0.42, 0.42, 0.55), vec3(0.95, 0.86, 0.90), smoothstep(0.45, 0.85, c));
  gl_FragColor = vec4(col, a);
}`;
const deckVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

const CloudDeck: React.FC<{ readonly opacity: number }> = ({ opacity }) => {
  const [vx, , vz] = VAULT_POS;
  const layers = [
    { y: 520, s: 1.3 },
    { y: 430, s: 2.7 },
    { y: 340, s: 4.1 },
    { y: 260, s: 5.9 },
  ];
  return (
    <group position={[vx + 100, 0, vz + 300]}>
      {layers.map((l) => (
        <mesh key={l.y} position={[0, l.y, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1600, 1600]} />
          <shaderMaterial
            vertexShader={deckVert}
            fragmentShader={deckFrag}
            uniforms={{ seed: { value: l.s }, op: { value: opacity } }}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
};

/** cloud banks over Svalbard the dive punches through (globe scale, tangent planes) */
const GlobeCloudPass: React.FC<{ readonly opacity: number }> = ({ opacity }) => {
  const n = new THREE.Vector3(...latLon(SVALBARD[0] - 2.5, SVALBARD[1], 1));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  const layers = [
    { r: 10.95, s: 2.6, seed: 3.1, op: 0.8 },
    { r: 10.75, s: 2.0, seed: 7.7, op: 0.9 },
    { r: 10.56, s: 1.5, seed: 1.9, op: 1 },
  ];
  return (
    <>
      {layers.map((l) => (
        <mesh key={l.r} position={n.clone().multiplyScalar(l.r)} quaternion={q}>
          <planeGeometry args={[l.s, l.s]} />
          <shaderMaterial
            vertexShader={deckVert}
            fragmentShader={deckFrag}
            uniforms={{ seed: { value: l.seed }, op: { value: l.op * opacity } }}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </>
  );
};

/** radial motion streaks for the speed ramp (2D, deterministic) */
const STREAKS = (() => {
  const r = rng(31);
  return Array.from({ length: 70 }, () => ({ ang: r() * Math.PI * 2, r0: 0.15 + r() * 0.5, len: 0.12 + r() * 0.3, w: 1 + r() * 2.5, sp: 0.6 + r() }));
})();
const Streaks: React.FC<{ readonly k: number; readonly phase: number }> = ({ k, phase }) => {
  if (k <= 0.01) return null;
  const cx = W / 2;
  const cy = H * 0.5;
  const D = Math.hypot(W, H) * 0.6;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: k, mixBlendMode: "screen", filter: "blur(1.5px)" }}>
      {STREAKS.map((s, i) => {
        const r0 = ((s.r0 + phase * s.sp) % 1) * D * 0.9 + D * 0.12;
        const r1 = r0 + s.len * D * (0.4 + k);
        return (
          <line
            key={i}
            x1={cx + Math.cos(s.ang) * r0}
            y1={cy + Math.sin(s.ang) * r0}
            x2={cx + Math.cos(s.ang) * r1}
            y2={cy + Math.sin(s.ang) * r1}
            stroke={pa(P.snow, 0.35)}
            strokeWidth={s.w}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

const Scene3D: React.FC<{ readonly t: number; readonly T: ReturnType<typeof times>; readonly cam: Cam }> = ({ t, T, cam }) => {
  const camDist = Math.hypot(...cam.position);
  const glow = 0.3 + 0.7 * prog(t, T.fasol - 0.2, T.fasol + 0.5, ease.out);
  const desat = cam.desat ? 1 : prog(t, T.harie - 0.08, T.harie + 1.1, ease.inOut);
  if (cam.scene === "land") {
    const deck = 1 - prog(t, T.swap + 0.25, T.swap + 0.6);
    const vaultGlow = 0.55 + 0.45 * prog(t, T.bhetor - 0.1, T.bhetor + 0.4, ease.out) + 0.08 * Math.sin(t * 5);
    return (
      <>
        <Lens position={cam.position} target={cam.target} mm={cam.mm} near={cam.near} far={cam.far} />
        <SvalbardLandscape sunDir={SUN_LAND} time={t} vaultGlow={vaultGlow} />
        {deck > 0 || t > T.a3 - 0.3 ? <CloudDeck opacity={Math.max(deck, prog(t, T.a3 - 0.3, T.a3 - 0.05))} /> : null}
        <PostFX bloom={0.75} bloomThreshold={0.85} vignette={0.5} aberration={0.0007} />
      </>
    );
  }
  const a3 = t >= T.a3;
  const sun = a3 ? SUN_A3 : SUN_A1;
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={cam.near} far={cam.far} />
      <Stars />
      <Sun dir={sun} />
      {!a3 && t > T.dive ? <GlobeCloudPass opacity={prog(t, T.swap - 0.32, T.swap - 0.12)} /> : null}
      <Earth
        sunDir={sun}
        camDist={camDist}
        desat={a3 ? 1 : desat}
        glow={a3 ? 0.25 : glow}
        cloudOpacity={a3 ? 0.42 : 0.95}
        time={t + (a3 ? 40 : 0)}
      />
      <PostFX bloom={0.6} bloomThreshold={0.85} vignette={0.5} aberration={0.0006} />
    </>
  );
};

const Overlays: React.FC<{ readonly t: number; readonly T: ReturnType<typeof times>; readonly cam: Cam }> = ({ t, T, cam }) => {
  // cloud whiteouts hiding the scene swaps
  const white = Math.max(
    prog(t, T.swap - 0.22, T.swap) * (1 - prog(t, T.swap, T.swap + 0.32)),
    prog(t, T.a3 - 0.16, T.a3) * (1 - prog(t, T.a3, T.a3 + 0.3)),
  );
  const streak = Math.max(prog(t, T.dive + 0.1, T.swap - 0.1) * (1 - prog(t, T.swap, T.swap + 0.45)), 0);
  const labels: React.ReactNode[] = [];
  if (t >= T.a3) {
    const P3 = (lat: number, lon: number, r = EARTH_R) => project(cam, latLon(lat, lon, r), W, H);
    const nor = P3(NORWAY[0], NORWAY[1]);
    const sva = P3(SVALBARD[0], SVALBARD[1]);
    const pole = P3(90, 0);
    const arc = Array.from({ length: 48 }, (_, i) => {
      const s = i / 47;
      return P3(mix(SVALBARD[0], 89.99, s), SVALBARD[1], EARTH_R * (1.004 + 0.035 * Math.sin(Math.PI * s)));
    });
    const kArc = prog(t, T.uttor, T.uttor + 0.6, ease.inOut);
    const km = Math.round(1300 * prog(t, T.meru - 0.05, T.meru + 0.6, ease.outCubic));
    const kmTxt = `~${bn(km.toLocaleString("en-US"))} কিমি`;
    labels.push(
      <DashedArc key="arc" pts={arc} k={kArc} />,
      <PinLabel key="no" x={nor.x} y={nor.y} t={t} inAt={T.norway} outAt={T.uttor - 0.15} text="নরওয়ে" side="left" rise={150} />,
      <PinLabel key="sv" x={sva.x} y={sva.y} t={t} inAt={T.svalbard} text="স্‌ভালবার্ড" side="right" rise={-110} reach={60} />,
      <PinLabel key="po" x={pole.x} y={pole.y} t={t} inAt={T.uttor + 0.45} text="উত্তর মেরু" sub={kmTxt} side="left" rise={120} />,
    );
  }
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Streaks k={streak * 0.55} phase={t * 1.6} />
      {labels}
      {white > 0 ? <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${P.snow}, #c9d3e0 70%, #aab6c8)`, opacity: white }} /> : null}
    </AbsoluteFill>
  );
};

export const S1A: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const T = times(a);
  const cam = camAt(t, T);
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <Stage background={P.night}>
        <Scene3D t={t} T={T} cam={cam} />
      </Stage>
      <Overlays t={t} T={T} cam={cam} />
    </AbsoluteFill>
  );
};

/** SFX for 1A (≤2, bible §5), in part seconds */
export const s1aCues = (a: number) => {
  const T = times(a);
  return [
    { t: a + T.dive - 0.15, src: "nvidia/sfx/whoosh_big.wav", vol: 0.6 },
    { t: a + T.swap + 0.75, src: "nvidia/sfx/impact_deep.wav", vol: 0.4 },
  ];
};
