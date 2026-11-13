/**
 * SH1 · hook (VO "hook", ~7.6 s): "বিকেল চারটা বাজলেই এক কাপ চা লাগে? না পেলে মাথা কাজ করে না? কারণটা আপনার মগজে।"
 *  A  0 → চা          Study desk at 4 pm: low golden sun through venetian blinds paints stripes over the desk and wall.
 *                     Slow push to the alarm clock; its minute hand clicks onto 4:00 on চারটা. Title "বিকেল ৪টা".
 *  B  চা → না         A glass of milk tea slides in from the right and lands (clink) in the sunlight; steam.
 *  C  না → কারণটা     The tea slides back out of reach. POV gets drowsy: picture blurs and greys, heavy eyelids
 *                     close, jerk open, close again. Title "মাথা কাজ করে না" on মাথা.
 *  D  কারণটা → end    Eyes snap open, fast push-in with zoom blur toward the frame centre → hands over to SH2's brain.
 */
import { AbsoluteFill, interpolate } from "remotion";
import { PostFX } from "../../kit/PostFX";
import { Lens, Stage } from "../../kit/Stage";
import { clamp, ease, mix, mix3, prog, useSeconds } from "../../kit/time";
import { CLOCK_POS, CUP_POS, CUP_SCALE, Desk } from "../three/Desk";
import { TeaCup } from "../three/TeaCup";
import { Eyelids } from "../two/Eyelids";
import { K } from "../theme";
import type { Cue } from "../types";
import { Title } from "../ui/Text";
import { shotDuration, wordAt } from "../vo";

export const SH1_DURATION = shotDuration("hook");
/** Caption words (exact VO tokens) to highlight. */
export const SH1_KEYWORDS: string[] = ["চারটা", "চা", "মাথা"];

const T = {
  four: wordAt("hook", "চারটা"),
  tea: wordAt("hook", "চা", 1), // nth=1: "চারটা" also prefix-matches "চা"
  no: wordAt("hook", "না"),
  head: wordAt("hook", "মাথা"),
  why: wordAt("hook", "কারণটা"),
};
const LAND = T.tea - 0.05; // cup lands on the desk
const AWAY = T.no + 0.05; // cup slides back out

/** Sound cues for this shot (sparse!). */
export const SH1_CUES: Cue[] = [
  { at: T.four, sfx: "tick", volume: 0.7 },
  { at: LAND, sfx: "clink", volume: 0.75 },
  { at: T.no + 0.25, sfx: "drowsy", volume: 0.6 },
  { at: T.why - 0.1, sfx: "whoosh_fast", volume: 0.6 },
];

type V3 = [number, number, number];
const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const CUP_C: V3 = [CUP_POS[0], CUP_POS[1] + 0.5 * CUP_SCALE, CUP_POS[2]];
const CLOCK: V3 = [...CLOCK_POS];

/** Cup x offset: slides in from the right before LAND, back out after AWAY. */
const cupSlide = (t: number) => {
  const inK = prog(t, LAND - 0.55, LAND, ease.outCubic);
  const outK = prog(t, AWAY, AWAY + 0.6, ease.inOut);
  return (1 - inK) * 3.2 + outK * 3.6;
};

const camAt = (t: number) => {
  // A: wide → clock
  const a = prog(t, 0, T.four + 0.6, ease.cine);
  let pos = mix3([-0.6, 2.3, 5.2], [-0.15, 1.45, 3.2], a);
  let target = mix3([0.4, 0.75, -0.4], [CLOCK[0], CLOCK[1] - 0.05, CLOCK[2]], a);
  let focusPt: V3 = CLOCK;
  // B: swing to where the cup lands
  const b = prog(t, T.four + 0.7, LAND + 0.4, ease.cine);
  pos = mix3(pos, [2.5, 1.55, 3.9], b);
  target = mix3(target, [CUP_C[0] - 0.25, 0.45, CUP_C[2] - 0.2], b);
  focusPt = mix3(focusPt, CUP_C, b);
  // C: drowsy drift, slight droop
  const c = prog(t, T.no, T.why, ease.inOut);
  pos = mix3(pos, [2.2, 1.3, 3.5], c);
  target = mix3(target, [CUP_C[0] - 0.6, 0.25, CUP_C[2] - 0.6], c);
  // D: fast push-in
  const d = prog(t, T.why - 0.05, SH1_DURATION, ease.inQuad);
  pos = mix3(pos, [1.0, 0.95, 1.4], d);
  const mm = mix(mix(34, 42, a), 70, d);
  return { pos, target, mm, focus: dist(pos, focusPt), range: mix(1.2, 0.6, c) };
};

/** Lid closure over time: heavy, jerk open, heavier, snap open on কারণটা. */
const lidsAt = (t: number) =>
  interpolate(
    t,
    [T.no + 0.2, T.head, T.head + 0.35, T.head + 0.55, T.why - 0.25, T.why - 0.05, T.why + 0.08],
    [0, 0.55, 0.62, 0.18, 0.86, 0.9, 0],
    clamp,
  );

const World: React.FC = () => {
  const t = useSeconds();
  const c = camAt(t);
  const minuteSnap = prog(t, T.four - 0.04, T.four + 0.06, ease.out);
  const clockHours = 15 + (54 + 6 * minuteSnap) / 60; // 3:54 → 4:00
  const slide = cupSlide(t);
  return (
    <>
      <Lens position={c.pos} target={c.target} mm={c.mm} near={0.02} far={80} />
      <Desk t={t} mood="afternoon" clockHours={clockHours} lampOn={0} showCup={false} />
      {slide < 3.5 ? <TeaCup t={t} position={[CUP_POS[0] + slide, CUP_POS[1], CUP_POS[2]]} scale={CUP_SCALE} fill={0.82} steam={0.75} /> : null}
      <PostFX focus={c.focus} focusRange={c.range} bokeh={5} bloom={0.6} bloomThreshold={0.85} vignette={0.5} />
    </>
  );
};

export const SH1Hook: React.FC = () => {
  const t = useSeconds();
  const lids = lidsAt(t);
  const push = prog(t, T.why - 0.05, SH1_DURATION, ease.inQuad);
  const groggy = lids * 0.9 + push * 0.6;
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      <AbsoluteFill
        style={{
          filter: groggy > 0.02 ? `blur(${groggy * 9}px) saturate(${1 - lids * 0.55}) brightness(${1 - push * 0.55})` : undefined,
          scale: 1 + push * 0.12,
        }}
      >
        <Stage background="#2a1c12">
          <World />
        </Stage>
      </AbsoluteFill>
      <Eyelids k={lids} />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        {t < T.no ? (
          <Title at={T.four} until={T.no - 0.15} size={124} color={K.ink}>
            বিকেল ৪টা
          </Title>
        ) : null}
        {t >= T.no && t < T.why ? (
          <Title at={T.head} until={T.why - 0.15} size={108} color={K.amber}>
            মাথা কাজ করে না
          </Title>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
