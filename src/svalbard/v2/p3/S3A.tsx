/**
 * Part 3 · Section 3A–3D (0 → cut before "বাক্সে").
 * A "তাই বিভিন্ন দেশ … বাড়তি কপি পাঠিয়ে দেয় এখানে" — night aerial: a truck climbs a snowy switchback toward a distant
 *   teal glow; then 3 fast close-ups of hero crates (genebank codes + flag decals) landing on a pallet. Chip "বাড়তি কপি".
 * B "প্রতিটা নমুনায় গড়ে প্রায় পাঁচশোটা বীজ" — macro push: seeds pour into an open foil pouch on a lab scale. Amber "≈৫০০টি বীজ".
 * C "বীজগুলো আগে ভালো করে শুকানো হয়" — drying room, slow lateral slide; humidity needle drops. Label "আর্দ্রতা ↓".
 * D "তারপর তিন স্তরের ফয়েলের প্যাকেটে সিল করে" — orbit: pouch splits into 3 layers, re-merges, heat sealer clamps. "৩ স্তরের ফয়েল".
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { HDRI, Lighting } from "../../../kit/assets";
import { PostFX } from "../../../kit/PostFX";
import { Lens, Stage } from "../../../kit/Stage";
import { ease, handheld, mix, mix3, prog } from "../../../kit/time";
import { NV, SV } from "../../PartPlayer";
import { headFont, numFont } from "../../theme";
import type { V3 } from "../../three/util";
import { atAfter } from "../../vo";
import { NightRoad, ROAD_LENGTH, GLOW_POS, roadAt } from "../models/NightRoad";
import { DryingRoom, ExplodedPouch, FLAT, HumidityDial, LabScale, OpenPouch, POUCH, POUCH_Y, RACK, SCALE, SeedPour } from "../models/Packaging";
import { CrateStack, LoadingBay, labelPos } from "../models/SeedCrates";
import { KeyLight, Slate } from "../models/SeedMacro";
import { P, bn, pa } from "../palette";
import { Block, headline, pop, rise } from "../p2/S2A";

export const S3A_END_WORD = "বাক্সে";
export const s3aEnd = (a = 0) => atAfter("p3", S3A_END_WORD, a) - 0.15;

const times = (a: number) => {
  const w = (word: string) => atAfter("p3", word, a) - a;
  const T = {
    tai: w("তাই"),
    desh: w("দেশ"),
    barti: w("বাড়তি"),
    kopi: w("কপি"),
    pathiye: w("পাঠিয়ে"),
    ekhane: w("এখানে"),
    protita: w("প্রতিটা"),
    gore: w("গড়ে"),
    pachsho: w("পাঁচশোটা"),
    bij: atAfter("p3", "বীজ", atAfter("p3", "গড়ে", a)) - a, // not "বীজের"
    bijgulo: w("বীজগুলো"),
    shukano: w("শুকানো"),
    tarpor: w("তারপর"),
    tin: w("তিন"),
    foil: w("ফয়েলের"),
    packet: w("প্যাকেটে"),
    sil: w("সিল"),
    end: s3aEnd(a) - a,
  };
  const cutA2 = T.barti - 0.1;
  const cutB = T.protita - 0.12;
  const cl = (cutB - cutA2) / 3;
  return { ...T, cutA2, cutA3: cutA2 + cl, cutA4: cutA2 + 2 * cl, cutB, cutC: T.bijgulo - 0.12, cutD: T.tarpor - 0.1 };
};
type T = ReturnType<typeof times>;

export const s3aCuts = (a = 0) => {
  const T = times(a);
  return [T.cutA2, T.cutA3, T.cutA4, T.cutB, T.cutC, T.cutD].map((c) => a + c);
};

type Cam = { position: V3; target: V3; mm: number };

/* ───────────── cameras ───────────── */
const S0 = ROAD_LENGTH * 0.42;
const truckS = (t: number) => S0 + t * 9;
const camA = (t: number): Cam => {
  const p = roadAt(truckS(t)).p;
  const k = ease.cine(prog(t, 0, 2.6));
  const pos = mix3([p[0] + 70, p[1] + 75, p[2] + 95], [p[0] + 45, p[1] + 52, p[2] + 70], k);
  const tgt = mix3(p, [mix(p[0], GLOW_POS[0], 0.35), mix(p[1], GLOW_POS[1], 0.35), mix(p[2], GLOW_POS[2], 0.35)], 0.55 + 0.2 * k);
  return { position: pos, target: tgt, mm: 32 };
};

const camCrate = (t: number, T: T, i: number): Cam => {
  const from = [T.cutA2, T.cutA3, T.cutA4][i];
  const l = labelPos(6 + i);
  const k = prog(t, from, from + 0.65);
  const side = i === 1 ? -1 : 1;
  const hh = handheld(t, 0.004, 4 + i);
  return {
    position: [l[0] + side * mix(0.4, 0.3, k) + hh[0], l[1] + 0.09 + hh[1], l[2] + mix(0.72, 0.58, k)],
    target: [l[0] - 0.02 * side, l[1] - 0.01, l[2]],
    mm: 50,
  };
};

const SCALE_TOP = SCALE.h + SCALE.pan;
const camB = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, T.cutB - 0.1, T.cutC + 0.1));
  const hh = handheld(t, 0.0012, 7);
  const pos = mix3([0.22, SCALE_TOP + 0.36, 0.62], [0.08, SCALE_TOP + 0.3, 0.36], k);
  return { position: [pos[0] + hh[0], pos[1] + hh[1], pos[2]], target: [0, SCALE_TOP + POUCH.h * 0.75, 0], mm: 50 };
};

/** clamped to the front face of the right-most front rack post (x ≈ 1.30, z ≈ 0.26) */
const DIAL: V3 = [RACK.trayW * 1.5 + 0.1, 1.25, (RACK.trayD + 0.02) / 2 + 0.045];
const camC = (t: number, T: T): Cam => {
  const k = prog(t, T.cutC - 0.05, T.cutD + 0.05, (x) => 0.2 * x + 0.8 * ease.inOut(x));
  const x = mix(-0.9, 1.15, k);
  const hh = handheld(t, 0.004, 9);
  return { position: [x + hh[0], 1.25 + hh[1], 1.55], target: [x + 0.55, 0.95, 0], mm: 30 };
};

const camD = (t: number, T: T): Cam => {
  const k = prog(t, T.cutD - 0.05, T.end + 0.05, ease.inOut);
  const ang = mix(0.95, -0.35, k);
  const r = mix(0.82, 0.68, k);
  const c: V3 = [0, POUCH_Y + FLAT.h * 0.55, 0.04];
  return { position: [c[0] + Math.sin(ang) * r, c[1] + mix(0.22, 0.12, k), c[2] + Math.cos(ang) * r], target: c, mm: 45 };
};

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/* ───────────── scenes ───────────── */
const SceneA: React.FC<{ readonly t: number; readonly cam: Cam }> = ({ t, cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={1} far={3000} />
    <color attach="background" args={[P.night]} />
    <NightRoad truckS={truckS(t)} t={t} glow={0.6 + 0.4 * prog(t, 0, 2)} cam={cam.position as [number, number, number]} />
    <PostFX bloom={1.0} bloomThreshold={0.7} vignette={0.6} aberration={0.0008} />
  </>
);

const SceneCrates: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const d = (from: number) => prog(t, from - 0.05, from + 0.4, ease.outCubic);
  const drop: [number, number, number] = [d(T.cutA2), d(T.cutA3), d(T.cutA4)];
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.02} far={30} />
      <color attach="background" args={["#0d1520"]} />
      <fogExp2 attach="fog" args={["#0d1520", 0.18]} />
      <Lighting hdri={HDRI.studio} intensity={0.35} rotation={0.8} />
      <KeyLight position={[-1.4, 2.6, 1.8]} intensity={2.2} half={1.2} color="#dfe8f2" />
      <spotLight position={[1.5, 1.2, -0.8]} angle={0.6} penumbra={0.8} intensity={14} color={P.amber} distance={5} decay={2} />
      <LoadingBay />
      <CrateStack drop={drop} />
      <PostFX focus={dist(cam.position, cam.target)} focusRange={0.25} bokeh={4} bloom={0.5} vignette={0.55} />
    </>
  );
};

const SceneB: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const pour = prog(t, T.cutB, T.cutB + 0.3);
  const fill = prog(t, T.cutB + 0.2, T.cutC, ease.outCubic);
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.01} far={20} />
      <color attach="background" args={["#0b131d"]} />
      <fogExp2 attach="fog" args={["#0b131d", 0.35]} />
      <Lighting hdri={HDRI.studio} intensity={0.9} rotation={1.4} />
      <KeyLight position={[-0.7, 1.2, 0.8]} intensity={2.6} half={0.4} color="#f3f6fa" />
      <spotLight position={[0.3, 0.5, -0.5]} angle={0.6} penumbra={0.9} intensity={5} color={P.amber} distance={2} decay={2} />
      <Slate size={[1.4, 0.04, 0.9]} position={[0, -0.02, 0]} repeat={1} />
      <LabScale grams={25.4 * fill} />
      <OpenPouch position={[0, SCALE_TOP, 0]} />
      <SeedPour t={t} pour={pour} fill={fill} position={[0, SCALE_TOP, 0]} />
      <PostFX focus={dist(cam.position, cam.target)} focusRange={0.08} bokeh={5} bloom={0.6} vignette={0.5} />
    </>
  );
};

const SceneC: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const rh = mix(62, 15, prog(t, T.cutC + 0.3, T.cutD - 0.1, ease.inOut));
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.02} far={30} />
      <color attach="background" args={["#101a24"]} />
      <fogExp2 attach="fog" args={["#101a24", 0.12]} />
      <Lighting hdri={HDRI.studio} intensity={0.55} rotation={0.4} />
      <KeyLight position={[1.2, 3.2, 2.0]} intensity={1.8} half={2.2} color="#e6eef6" />
      <DryingRoom t={t} airflow={1} />
      <HumidityDial rh={rh} position={[DIAL[0], DIAL[1], DIAL[2]]} r={0.09} />
      {/* clamp bracket: dial → post */}
      <mesh position={[DIAL[0], DIAL[1], DIAL[2] - 0.032]} castShadow>
        <boxGeometry args={[0.05, 0.07, 0.022]} />
        <meshStandardMaterial color="#9aa3ac" metalness={0.85} roughness={0.35} />
      </mesh>
      <pointLight position={[DIAL[0], DIAL[1] + 0.1, DIAL[2] + 0.3]} intensity={0.6} distance={1.2} decay={2} color={P.amber} />
      <PostFX focus={dist(cam.position, cam.target)} focusRange={0.9} bokeh={2.5} bloom={0.5} vignette={0.5} />
    </>
  );
};

const SceneD: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const explode = ease.inOut(prog(t, T.cutD, T.tin + 0.25)) * (1 - ease.inOut(prog(t, T.foil + 0.1, T.packet + 0.15)));
  const clamp = ease.inOut(prog(t, T.packet + 0.1, T.sil + 0.05));
  const seal = prog(t, T.sil, T.sil + 0.15) * (1 - 0.6 * prog(t, T.sil + 0.4, T.end));
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.01} far={20} />
      <color attach="background" args={["#0a121b"]} />
      <fogExp2 attach="fog" args={["#0a121b", 0.4]} />
      <Lighting hdri={HDRI.studio} intensity={0.55} rotation={2.6} />
      <KeyLight position={[0.8, 1.4, 1.0]} intensity={1.3} half={0.4} color="#eef3f8" />
      <spotLight position={[-0.5, 0.4, -0.5]} angle={0.7} penumbra={0.9} intensity={4} color={P.vaultTeal} distance={2} decay={2} />
      <Slate size={[1.2, 0.04, 0.9]} position={[0, -0.02, 0]} repeat={1} />
      <ExplodedPouch explode={explode} seal={seal} clamp={clamp} />
      <PostFX focus={dist(cam.position, cam.target)} focusRange={0.2} bokeh={3} bloom={0.9} bloomThreshold={0.75} vignette={0.5} />
    </>
  );
};

/* ───────────── text ───────────── */
export const Chip: React.FC<{ readonly text: string; readonly k: number }> = ({ text, k }) => (
  <div
    style={{
      display: "inline-block",
      padding: "9px 22px 12px",
      borderRadius: 999,
      background: P.vaultTeal,
      color: P.night,
      fontFamily: headFont,
      fontWeight: 800,
      fontSize: 40,
      lineHeight: 1,
      transform: `scale(${0.4 + 0.6 * k})`,
      transformOrigin: "left center",
      opacity: Math.min(1, k * 1.6),
      boxShadow: `0 10px 30px ${pa(P.night, 0.45)}`,
    }}
  >
    {text}
  </div>
);
export const amberNum: React.CSSProperties = {
  fontFamily: `${numFont}, ${headFont}`,
  fontWeight: 900,
  color: P.amber,
  lineHeight: 1.05,
  textShadow: `0 0 34px ${pa(P.amber, 0.35)}, 0 4px 24px ${pa(P.night, 0.8)}`,
};

const Overlays: React.FC<{ readonly t: number; readonly T: T }> = ({ t, T }) => {
  const { fps } = useVideoConfig();
  const n = Math.round(interpolate(t, [T.gore, T.pachsho + 0.3], [0, 500], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.outCubic }));
  const layerK = (i: number) => pop(t, T.tin + 0.08 * i, fps);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Block t={t} inAt={T.barti - 0.05} outAt={T.cutB - 0.22}>
        {(k) => (
          <>
            <Chip text="বাড়তি কপি" k={k} />
            <div style={{ ...headline, fontSize: 72, marginTop: 16, ...rise(pop(t, T.pathiye - 0.05, fps)) }}>পাঠায় বহু দেশ</div>
          </>
        )}
      </Block>
      <Block t={t} inAt={T.gore - 0.05} outAt={T.cutC - 0.22}>
        {(k) => (
          <>
            <div style={{ ...amberNum, fontSize: 170, ...rise(k) }}>≈{bn(n)}টি</div>
            <div style={{ ...headline, fontSize: 92, ...rise(pop(t, T.bij - 0.05, fps)) }}>বীজ</div>
          </>
        )}
      </Block>
      <Block t={t} inAt={T.shukano - 0.1} outAt={T.cutD - 0.2}>
        {(k) => (
          <div style={{ ...headline, ...rise(k) }}>
            আর্দ্রতা <span style={{ color: P.amber }}>↓</span>
          </div>
        )}
      </Block>
      <Block t={t} inAt={T.tin - 0.05} outAt={T.end - 0.2}>
        {(k) => (
          <>
            <div style={headline}>
              <span style={{ ...rise(k), color: P.vaultTeal }}>৩ স্তরের</span>
              <span style={rise(pop(t, T.foil - 0.05, fps))}>ফয়েল</span>
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 18 }}>
              {["PET", "অ্যালুমিনিয়াম", "PE"].map((s, i) => (
                <span key={s} style={{ ...rise(layerK(i)), display: "inline-block", fontFamily: headFont, fontWeight: 600, fontSize: 34, color: P.snow, padding: "6px 16px", border: `2px solid ${pa(P.snow, 0.6)}`, borderRadius: 10 }}>
                  {s}
                </span>
              ))}
            </div>
          </>
        )}
      </Block>
    </AbsoluteFill>
  );
};

export const S3A: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const T = times(a);
  const shot = t < T.cutA2 ? 0 : t < T.cutA3 ? 1 : t < T.cutA4 ? 2 : t < T.cutB ? 3 : t < T.cutC ? 4 : t < T.cutD ? 5 : 6;
  const cam = shot === 0 ? camA(t) : shot <= 3 ? camCrate(t, T, shot - 1) : shot === 4 ? camB(t, T) : shot === 5 ? camC(t, T) : camD(t, T);
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <Stage background={P.night}>
        {shot === 0 ? <SceneA key="a" t={t} cam={cam} /> : null}
        {shot >= 1 && shot <= 3 ? <SceneCrates key="cr" t={t} T={T} cam={cam} /> : null}
        {shot === 4 ? <SceneB key="b" t={t} T={T} cam={cam} /> : null}
        {shot === 5 ? <SceneC key="c" t={t} T={T} cam={cam} /> : null}
        {shot === 6 ? <SceneD key="d" t={t} T={T} cam={cam} /> : null}
      </Stage>
      <Overlays t={t} T={T} />
    </AbsoluteFill>
  );
};

/** SFX (3): wind under the aerial, seed-pour shimmer, sealer click */
export const s3aCues = (a: number) => {
  const T = times(a);
  return [
    { t: a + 0, src: SV("wind"), vol: 0.3 },
    { t: a + T.cutB + 0.05, src: NV("shimmer"), vol: 0.28 },
    { t: a + T.sil + 0.02, src: NV("ui_click"), vol: 0.5 },
  ];
};
