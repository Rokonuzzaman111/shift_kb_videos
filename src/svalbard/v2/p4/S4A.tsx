/**
 * Part 4 · Section 4A–4C (0 → cut before "মজার").
 * A "ভল্টটা সমুদ্র থেকে প্রায় একশো ত্রিশ মিটার উঁচুতে, মেরুর বরফ গললেও পানি পৌঁছাবে না" — coast cross-section diorama:
 *   ice cap melts, sea rises and stops far below the vault; amber ruler "১৩০ মিটার", chip "বরফ গললেও নিরাপদ".
 * B "আর চারপাশের জমাট পাথর, মানে পারমাফ্রস্ট" — macro slide over dark frozen rock, ice cracks, frost growing. "পারমাফ্রস্ট".
 * C "বিদ্যুৎ চলে গেলেও ভল্টকে ঠান্ডা রাখে" — breaker panel dies (spark), then a thermometer drifts up and stops at −4 °C.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { HDRI, Lighting } from "../../../kit/assets";
import { PostFX } from "../../../kit/PostFX";
import { Lens, Stage } from "../../../kit/Stage";
import { ease, handheld, mix, mix3, prog } from "../../../kit/time";
import { NV, SV } from "../../PartPlayer";
import type { V3 } from "../../three/util";
import { atAfter } from "../../vo";
import { BreakerPanel, CoastSection, MAIN_POS, PermafrostRock, THERMO, WallThermometer } from "../models/Safeguards";
import { KeyLight } from "../models/SeedMacro";
import { P, bn } from "../palette";
import { Block, headline, pop, rise } from "../p2/S2A";
import { Chip, amberNum } from "../p3/S3A";

export const S4A_END_WORD = "মজার";
export const s4aEnd = (a = 0) => atAfter("p4", S4A_END_WORD, a) - 0.15;

const times = (a: number) => {
  const w = (word: string) => atAfter("p4", word, a) - a;
  const T = {
    somudro: w("সমুদ্র"),
    eksho: w("একশো"),
    meter: w("মিটার"),
    meru: w("মেরুর"),
    borof: w("বরফ"),
    gollew: w("গললেও"),
    pani: w("পানি"),
    na: w("না"),
    ar: w("আর"),
    jomat: w("জমাট"),
    perma: w("পারমাফ্রস্ট"),
    biddut: w("বিদ্যুৎ"),
    chole: w("চলে"),
    gele: w("গেলেও"),
    thanda: w("ঠান্ডা"),
    rakhe: w("রাখে"),
    end: s4aEnd(a) - a,
  };
  return { ...T, cutB: T.ar - 0.12, cutC: T.biddut - 0.1, cutC2: T.gele - 0.04 };
};
type T = ReturnType<typeof times>;

export const s4aCuts = (a = 0) => {
  const T = times(a);
  return [T.cutB, T.cutC, T.cutC2].map((c) => a + c);
};

type Cam = { position: V3; target: V3; mm: number };
const dist = (p: V3, q: V3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

/* ───────────── cameras ───────────── */
const camA = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, 0, T.cutB));
  return { position: mix3([22, 18, 62], [20, 19, 82], k), target: mix3([22, 15, 0], [20, 16, 0], k), mm: 24 };
};
const camB = (t: number, T: T): Cam => {
  const k = prog(t, T.cutB - 0.05, T.cutC + 0.05, (x) => 0.25 * x + 0.75 * ease.inOut(x));
  const x = mix(-0.14, 0.12, k);
  return { position: [x - 0.03, 0.075, 0.15], target: [x + 0.03, 0.012, 0.0], mm: 55 };
};
const camC1 = (t: number, T: T): Cam => {
  const k = ease.out(prog(t, T.cutC, T.cutC + 0.45));
  const hh = handheld(t, 0.003, 3);
  const tg: V3 = [MAIN_POS[0] + 0.12, MAIN_POS[1] - 0.08, MAIN_POS[2]];
  return { position: mix3([0.32 + hh[0], 0.05 + hh[1], 1.05], [0.2 + hh[0], 0.12 + hh[1], 0.62], k), target: tg, mm: 40 };
};
/** aim below the device centre so the whole thermometer sits between the top text and the caption band */
const SCREEN: V3 = [0, -0.027, THERMO.d];
const camC2 = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, T.cutC2, T.end + 0.2));
  const hh = handheld(t, 0.0015, 6);
  return { position: mix3([0.1 + hh[0], 0.0 + hh[1], 1.0], [0.03 + hh[0], -0.012 + hh[1], 0.8], k), target: SCREEN, mm: 50 };
};

/* ───────────── scenes ───────────── */
const SceneA: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const melt = prog(t, T.borof - 0.1, T.na + 0.3, ease.inOut);
  const sea = mix(0, 4, prog(t, T.borof + 0.1, T.na + 0.1, ease.inOut));
  const ruler = prog(t, T.eksho - 0.05, T.meter + 0.25, ease.outCubic);
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.5} far={600} />
      <color attach="background" args={["#18293b"]} />
      <fogExp2 attach="fog" args={["#18293b", 0.0055]} />
      <Lighting hdri={HDRI.dusk} intensity={0.55} rotation={2.2} />
      <KeyLight position={[-40, 55, 45]} intensity={1.6} half={60} far={200} color="#dce6f0" />
      <CoastSection t={t} sea={sea} melt={melt} ruler={ruler} glow={0.7 + 0.3 * Math.sin(t * 3)} />
      <PostFX bloom={0.8} bloomThreshold={0.75} vignette={0.5} aberration={0.0006} />
    </>
  );
};

const SceneB: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.005} far={10} />
    <color attach="background" args={[P.night]} />
    <fogExp2 attach="fog" args={[P.night, 2.2]} />
    <Lighting hdri={HDRI.studio} intensity={0.2} rotation={3.6} />
    <KeyLight position={[-0.4, 0.35, -0.5]} intensity={1.5} half={0.5} color="#a9c8e6" far={3} />
    <pointLight position={[0.1, 0.12, 0.1]} intensity={0.35} distance={0.6} decay={2} color="#7fa6c8" />
    <PermafrostRock grow={prog(t, T.cutB, T.cutC + 0.3)} />
    <PostFX focus={dist(cam.position, cam.target)} focusRange={0.05} bokeh={5} bloom={0.6} bloomThreshold={0.8} vignette={0.55} />
  </>
);

const SceneC1: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const cut = T.chole;
  // overhead lamp: steady, flickers and dies on "চলে"
  const lt = t - cut;
  const flick = lt < 0 ? 1 : lt < 0.25 ? (Math.sin(lt * 90) > 0 ? 0.6 : 0.1) : 0;
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.02} far={20} />
      <color attach="background" args={[P.night]} />
      <fogExp2 attach="fog" args={[P.night, 0.35]} />
      <Lighting hdri={HDRI.studio} intensity={0.12 + 0.25 * flick} rotation={1.2} />
      <spotLight position={[0.2, 1.3, 0.9]} angle={0.7} penumbra={0.7} intensity={14 * flick} color="#e8eef3" distance={4} decay={2} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-0.6, 0.4, 0.8]} intensity={0.25} distance={3} decay={2} color="#6f8eae" />
      <BreakerPanel t={t} cut={cut} />
      <PostFX focus={dist(cam.position, cam.target)} focusRange={0.25} bokeh={3} bloom={1.0} bloomThreshold={0.7} vignette={0.6} />
    </>
  );
};

const thermoTemp = (t: number, T: T) => -18 + 14 * ease.outCubic(prog(t, T.cutC2 + 0.1, T.rakhe + 0.1));

const SceneC2: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.01} far={20} />
    <color attach="background" args={[P.night]} />
    <fogExp2 attach="fog" args={[P.night, 0.6]} />
    <Lighting hdri={HDRI.studio} intensity={0.18} rotation={0.6} />
    <pointLight position={[0.0, 0.45, 0.35]} intensity={1.4} distance={1.6} decay={2} color={P.amber} castShadow shadow-mapSize={[1024, 1024]} />
    <KeyLight position={[-0.8, 0.6, 1.0]} intensity={0.6} half={0.6} color="#93b3d1" far={4} />
    <WallThermometer temp={thermoTemp(t, T)} hist={0.25 + 0.75 * prog(t, T.cutC2 + 0.1, T.rakhe + 0.1)} t={t} />
    <PostFX focus={dist(cam.position, cam.target)} focusRange={0.1} bokeh={4} bloom={0.8} bloomThreshold={0.78} vignette={0.55} />
  </>
);

/* ───────────── text ───────────── */
const Overlays: React.FC<{ readonly t: number; readonly T: T }> = ({ t, T }) => {
  const { fps } = useVideoConfig();
  const m = Math.round(interpolate(t, [T.eksho - 0.05, T.meter + 0.25], [0, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.outCubic }));
  const deg = Math.round(thermoTemp(t, T));
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Block t={t} inAt={T.eksho - 0.05} outAt={T.cutB - 0.22}>
        {(k) => (
          <>
            <div style={{ ...amberNum, fontSize: 150, ...rise(k) }}>{bn(m)} মিটার</div>
            <div style={{ marginTop: 18, minHeight: 60 }}>{t >= T.gollew - 0.05 ? <Chip text="বরফ গললেও নিরাপদ" k={pop(t, T.gollew - 0.05, fps)} /> : null}</div>
          </>
        )}
      </Block>
      <Block t={t} inAt={T.jomat - 0.05} outAt={T.cutC - 0.2}>
        {(k) => (
          <>
            <Chip text="জমাট পাথর" k={k} />
            {t >= T.perma - 0.05 ? <div style={{ ...headline, marginTop: 16, ...rise(pop(t, T.perma - 0.05, fps)) }}>পারমাফ্রস্ট</div> : null}
          </>
        )}
      </Block>
      <Block t={t} inAt={T.cutC2 + 0.05} outAt={T.end - 0.2}>
        {(k) => (
          <>
            <div style={{ ...amberNum, fontSize: 170, ...rise(k) }}>−{bn(Math.abs(deg))}°C</div>
            <div style={{ marginTop: 14, minHeight: 60 }}>{t >= T.rakhe - 0.1 ? <Chip text="তবুও জমাট" k={pop(t, T.rakhe - 0.1, fps)} /> : null}</div>
          </>
        )}
      </Block>
    </AbsoluteFill>
  );
};

export const S4A: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const T = times(a);
  const shot = t < T.cutB ? 0 : t < T.cutC ? 1 : t < T.cutC2 ? 2 : 3;
  const cam = shot === 0 ? camA(t, T) : shot === 1 ? camB(t, T) : shot === 2 ? camC1(t, T) : camC2(t, T);
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <Stage background={P.night}>
        {shot === 0 ? <SceneA key="a" t={t} T={T} cam={cam} /> : null}
        {shot === 1 ? <SceneB key="b" t={t} T={T} cam={cam} /> : null}
        {shot === 2 ? <SceneC1 key="c1" t={t} T={T} cam={cam} /> : null}
        {shot === 3 ? <SceneC2 key="c2" t={t} T={T} cam={cam} /> : null}
      </Stage>
      <Overlays t={t} T={T} />
    </AbsoluteFill>
  );
};

/** SFX (3): wind bed under the coast, power-down on the trip, frost when the temperature settles */
export const s4aCues = (a: number) => {
  const T = times(a);
  return [
    { t: a + 0, src: SV("wind"), vol: 0.26 },
    { t: a + T.chole - 0.05, src: NV("power_down"), vol: 0.5 },
    { t: a + T.rakhe, src: SV("frost"), vol: 0.35 },
  ];
};
