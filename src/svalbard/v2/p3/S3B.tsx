/**
 * Part 3 · Section 3E–3G ("বাক্সে" → end).
 * E "বাক্সে ভরে রাখা হয় তাকে" — top-down: labelled foil pouches drop into a crate, lid swings shut, barcode stamp; tilt.
 * F "মাইনাস আঠারো ডিগ্রিতে বীজ যেন ঘুমিয়ে পড়ে, ভেতরের সব কাজ প্রায় থেমে যায়" — LONG slow push on a cut-away seed: frost creeps
 *   in from the rim, glowing metabolism particles slow and stop, a heartbeat line flattens. Amber "−১৮°C", chip "ঘুমন্ত বীজ".
 * G "ফলে অনেক জাত, শত শত বছর পরেও আবার অঙ্কুরিত হতে পারে" — macro time-lapse on moist soil (models/Germination): year counter races,
 *   frost melts to droplets, warm side light, coat splits, radicle + root hairs, coleoptile, first leaf unrolls; crane up. Amber "শত শত বছর পরেও", headline "আবার অঙ্কুরিত".
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { HDRI, Lighting } from "../../../kit/assets";
import { PostFX } from "../../../kit/PostFX";
import { Lens, Stage } from "../../../kit/Stage";
import { ease, handheld, mix, mix3, prog } from "../../../kit/time";
import { NV, SV } from "../../PartPlayer";
import type { V3 } from "../../three/util";
import { atAfter } from "../../vo";
import * as THREE from "three";
import { BOX, CutSeed, OpenCrate, SealedPouch, Stamp, lifePhase, pouchSlot } from "../models/Dormancy";
import { Bokeh, GerminatingSeed, Motes, SEED_Y, SEED_YAW, Soil, SoilWater, seedToWorld } from "../models/Germination";
import { KeyLight, Slate } from "../models/SeedMacro";
import { P, bn, pa } from "../palette";
import { Block, headline, pop, rise } from "../p2/S2A";
import { Chip, amberNum } from "./S3A";

const times = (a: number) => {
  const w = (word: string) => atAfter("p3", word, a) - a;
  const T = {
    bakshe: w("বাক্সে"),
    bhore: w("ভরে"),
    hoy: w("হয়"),
    take: w("তাকে"),
    minus: w("মাইনাস"),
    degree: w("ডিগ্রিতে"),
    ghumiye: w("ঘুমিয়ে"),
    bhetorer: w("ভেতরের"),
    theme: w("থেমে"),
    jay: w("যায়"),
    phole: w("ফলে"),
    shot: w("শত"),
    porew: w("পরেও"),
    abar: w("আবার"),
    ankurito: w("অঙ্কুরিত"),
    pare: w("পারে"),
  };
  return { ...T, cutF: T.minus - 0.15, cutG: T.phole - 0.12, end: T.pare + 1.4 };
};
type T = ReturnType<typeof times>;

export const s3bCuts = (a = 0) => {
  const T = times(a);
  return [a + T.cutF, a + T.cutG];
};

type Cam = { position: V3; target: V3; mm: number };

/* ───────────── cameras ───────────── */
const camE = (t: number, T: T): Cam => {
  const k = ease.inOut(prog(t, T.take - 0.1, T.cutF));
  const hh = handheld(t, 0.002, 11);
  return {
    position: mix3([0.0 + hh[0], 1.45, 0.02 + hh[1]], [0.0, 0.95, 0.85], k),
    target: [0, BOX.h * 0.5, 0],
    mm: mix(30, 36, k),
  };
};

const camF = (t: number, T: T): Cam => {
  const k = prog(t, T.cutF, T.cutG, (x) => 0.35 * x + 0.65 * ease.inOut(x));
  const ang = mix(0.35, 0.12, k);
  const r = mix(2.7, 1.85, k);
  const tgt: V3 = [mix(0, -0.14, k), 0, 0];
  return { position: [tgt[0] + Math.sin(ang) * r, mix(0.3, 0.14, k), Math.cos(ang) * r], target: tgt, mm: 35 };
};

/** G time-lapse beats (section time) */
const germ = (t: number, T: T) => ({
  melt: prog(t, T.cutG + 0.05, T.shot + 0.25, ease.inOut),
  warm: prog(t, T.cutG, T.porew, ease.inOut),
  split: prog(t, T.shot - 0.2, T.porew, ease.inOut),
  root: prog(t, T.shot + 0.05, T.pare + 0.6, ease.inOut),
  side: prog(t, T.porew, T.pare + 0.7, ease.inOut),
  coleo: prog(t, T.porew - 0.15, T.ankurito + 0.35, ease.inOut),
  emerge: prog(t, T.ankurito, T.pare + 0.7, ease.inOut),
  unfurl: prog(t, T.ankurito + 0.35, T.pare + 0.95, ease.inOut),
});

const dirTo = (tgt: V3, d: V3, r: number): V3 => {
  const l = Math.hypot(d[0], d[1], d[2]);
  return [tgt[0] + (d[0] / l) * r, tgt[1] + (d[1] / l) * r, tgt[2] + (d[2] / l) * r];
};
/** crane progress (push on the frosted grain first, then up + back with the shoot) */
const craneK = (t: number, T: T) => ease.inOut(prog(t, T.porew - 0.2, T.pare + 0.95));
const camG = (t: number, T: T): Cam => {
  const k1 = ease.inOut(prog(t, T.cutG, T.porew));
  const k2 = craneK(t, T);
  const t0: V3 = [0.05, 0.2, 0.05];
  const t1: V3 = [0.12, 0.22, 0.05];
  const t2: V3 = [0.15, 0.6, 0.05];
  const p0 = dirTo(t0, [0.25, 0.2, 1], 2.6);
  const p1 = dirTo(t1, [0.3, 0.17, 1], 2.35);
  const p2 = dirTo(t2, [0.12, 0.15, 1], 4.0);
  const hh = handheld(t, 0.002, 21);
  const pos = mix3(mix3(p0, p1, k1), p2, k2);
  return { position: [pos[0] + hh[0], pos[1] + hh[1], pos[2]], target: mix3(mix3(t0, t1, k1), t2, k2), mm: mix(40, 35, k2) };
};

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/* ───────────── scenes ───────────── */
const SceneE: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const close = ease.inOut(prog(t, T.hoy + 0.05, T.take + 0.15));
  const sd = T.take + 0.25;
  const down = prog(t, sd, sd + 0.12, ease.inQuad) * (1 - prog(t, sd + 0.25, sd + 0.5, ease.outCubic));
  const stamp = prog(t, sd + 0.12, sd + 0.16);
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.02} far={20} />
      <color attach="background" args={["#0c141e"]} />
      <fogExp2 attach="fog" args={["#0c141e", 0.12]} />
      <Lighting hdri={HDRI.studio} intensity={0.85} rotation={0.9} />
      <KeyLight position={[-0.9, 2.4, 0.9]} intensity={2.4} half={0.7} color="#eef3f8" />
      <spotLight position={[0.8, 1.2, -0.6]} angle={0.7} penumbra={0.9} intensity={5} color={P.vaultTeal} distance={3} decay={2} />
      <Slate size={[2.2, 0.04, 1.8]} position={[0, -0.02, 0]} repeat={2} />
      <OpenCrate close={close} stamp={stamp} />
      {Array.from({ length: 16 }, (_, i) => {
        const p = pouchSlot(i);
        const from = T.bakshe - 0.1 + (i - 8) * 0.11;
        const k = i < 8 ? 1 : prog(t, from, from + 0.32, ease.inQuad);
        if (k <= 0) return null;
        const y = p[1] + (1 - k) * 0.7;
        return <SealedPouch key={i} i={i} position={[p[0], y, p[2]]} yaw={((i * 37) % 7 - 3) * 0.02} tilt={(1 - k) * 0.3} />;
      })}
      {down > 0 ? <Stamp down={down} /> : null}
      <PostFX focus={dist(cam.position, [0, BOX.h, 0])} focusRange={0.6} bokeh={2.5} bloom={0.5} vignette={0.55} />
    </>
  );
};

/** particle speed over part-section time: 1 → 0 across F, back up in G */
const speedAt = (T: T) => (t: number) => {
  const slow = 1 - ease.inOut(prog(t, T.ghumiye, T.jay + 0.2));
  const wake = prog(t, T.porew, T.ankurito + 0.3, ease.inOut);
  return Math.max(slow, wake) * 1.6;
};

const SceneSeed: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const frost = prog(t, T.cutF + 0.1, T.jay + 0.3, ease.inOut);
  const life = 1 - ease.inOut(prog(t, T.ghumiye, T.jay + 0.2));
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.01} far={30} />
      <color attach="background" args={[P.night]} />
      <Lighting hdri={HDRI.studio} intensity={0.35} rotation={1.8} />
      <KeyLight position={[1.2, 1.6, 2.0]} intensity={0.9} half={1.6} color="#bcd3ea" />
      <spotLight position={[0.2, 0.8, -1.4]} angle={0.8} penumbra={1} intensity={6} color={P.vaultTeal} distance={4} decay={2} />
      <Bokeh warm={0} z={-4} />
      <CutSeed frost={frost} ph={lifePhase(t, speedAt(T))} life={life} shell={0} grow={0} unfurl={0} />
      <PostFX focus={dist(cam.position, cam.target)} focusRange={0.35} bokeh={3} bloom={0.6} bloomThreshold={0.85} vignette={0.55} aberration={0.0008} />
    </>
  );
};

const SceneGerm: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const g = germ(t, T);
  const focusPt = mix3(seedToWorld([0.3, 0.05, 0.05]), seedToWorld([0.3, 0.55, 0.05]), craneK(t, T));
  const key = new THREE.Color("#a9c3dc").lerp(new THREE.Color("#ffc98a"), g.warm);
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.01} far={40} />
      <color attach="background" args={["#05080c"]} />
      <fogExp2 attach="fog" args={["#05080c", 0.26]} />
      <Lighting hdri={HDRI.studio} intensity={mix(0.2, 0.3, g.warm)} rotation={2.2} />
      {/* warm low side key (left), soft cool fill (front right), warm back rim for leaf / root-hair glow */}
      <KeyLight position={[-2.6, 1.5, 0.9]} intensity={mix(0.6, 3.0, g.warm)} half={2.2} color={`#${key.getHexString()}`} />
      <directionalLight position={[2.4, 1.8, 2.6]} intensity={mix(0.8, 0.5, g.warm)} color="#8fa9c4" />
      <spotLight position={[0.6, 2.2, -2.4]} angle={0.6} penumbra={1} intensity={mix(0.6, 6, g.warm)} color={P.amber} distance={6} decay={2} />
      <Bokeh warm={g.warm} />
      <Soil />
      <SoilWater melt={g.melt} />
      <group position={[0, SEED_Y, 0]} rotation={[0, SEED_YAW, 0.03]}>
        <GerminatingSeed {...g} />
      </group>
      <Motes t={t} />
      <PostFX focus={dist(cam.position, focusPt)} focusRange={0.45} bokeh={5} bloom={0.5} bloomThreshold={0.85} vignette={0.55} aberration={0.0008} />
    </>
  );
};

/* ───────────── overlays ───────────── */
/** small ECG trace inside the −18°C block (never over the seed) */
const Heartbeat: React.FC<{ readonly t: number; readonly flat: number; readonly o: number }> = ({ t, flat, o }) => {
  const Wd = 460;
  const pts: string[] = [];
  for (let x = 0; x <= Wd; x += 4) {
    const ph = ((x / Wd) * 2.4 + t * 1.2) % 1;
    const beat = ph > 0.45 && ph < 0.6 ? Math.sin(((ph - 0.45) / 0.15) * Math.PI * 2) * (ph < 0.52 ? 30 : 13) : 0;
    pts.push(`${x},${40 - beat * (1 - flat)}`);
  }
  const col = flat > 0.95 ? P.alert : P.vaultTeal;
  return (
    <svg width={Wd} height={80} style={{ display: "block", marginTop: 14, opacity: o }}>
      <polyline points={pts.join(" ")} fill="none" stroke={col} strokeWidth={5} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 10px ${pa(col, 0.7)})` }} />
    </svg>
  );
};

const Overlays: React.FC<{ readonly t: number; readonly T: T }> = ({ t, T }) => {
  const { fps } = useVideoConfig();
  const temp = Math.round(interpolate(t, [T.minus, T.degree + 0.3], [4, -18], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.outCubic }));
  const year = Math.round(interpolate(t, [T.phole, T.porew + 0.2], [2025, 2325], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.inOut }));
  const flat = prog(t, T.bhetorer, T.jay + 0.1, ease.inOut);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Block t={t} inAt={T.minus - 0.05} outAt={T.cutG - 0.22}>
        {(k) => (
          <>
            <div style={{ ...amberNum, fontSize: 190, ...rise(k) }}>{temp < 0 ? "−" : ""}{bn(Math.abs(temp))}°C</div>
            <div style={{ marginTop: 12, minHeight: 64 }}>{t >= T.ghumiye - 0.05 ? <Chip text="ঘুমন্ত বীজ" k={pop(t, T.ghumiye - 0.05, fps)} /> : null}</div>
            <Heartbeat t={t} flat={flat} o={prog(t, T.minus + 0.2, T.minus + 0.6)} />
          </>
        )}
      </Block>
      <Block t={t} inAt={T.phole - 0.02} outAt={T.abar - 0.3}>
        {(k) => (
          <>
            <div style={{ ...amberNum, fontSize: 180, ...rise(k) }}>{bn(year)}</div>
            {t >= T.shot - 0.05 ? <div style={{ ...amberNum, fontSize: 76, fontWeight: 800, ...rise(pop(t, T.shot - 0.05, fps)) }}>শত শত বছর পরেও</div> : null}
          </>
        )}
      </Block>
      <Block t={t} inAt={T.abar - 0.05} outAt={T.end + 1}>
        {(k) => (
          <div style={headline}>
            <span style={rise(k)}>আবার</span>
            <span style={{ ...rise(pop(t, T.ankurito - 0.05, fps)), color: P.vaultTeal }}>অঙ্কুরিত</span>
          </div>
        )}
      </Block>
    </AbsoluteFill>
  );
};

export const S3B: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const T = times(a);
  const shot = t < T.cutF ? 0 : t < T.cutG ? 1 : 2;
  const cam = shot === 0 ? camE(t, T) : shot === 1 ? camF(t, T) : camG(t, T);
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <Stage background={P.night}>
        {shot === 0 ? <SceneE key="e" t={t} T={T} cam={cam} /> : null}
        {shot === 1 ? <SceneSeed key="s" t={t} T={T} cam={cam} /> : null}
        {shot === 2 ? <SceneGerm key="g" t={t} T={T} cam={cam} /> : null}
      </Stage>
      <Overlays t={t} T={T} />
    </AbsoluteFill>
  );
};

/** SFX (3): crate lid thud + stamp, frost crackle on the freeze, heartbeat that stops */
export const s3bCues = (a: number) => {
  const T = times(a);
  return [
    { t: a + T.take + 0.3, src: NV("impact"), vol: 0.4 },
    { t: a + T.cutF + 0.1, src: SV("frost"), vol: 0.45 },
    { t: a + T.bhetorer - 0.3, src: NV("heartbeat"), vol: 0.35 },
  ];
};
