/**
 * OWNER: props3d agent. SH9 · tips (VO "tips", ~12.9 s).
 *  0 → তাহলে   Calm night desk. A glass checklist card (title zone) ticks on the spoken words while the camera
 *              drifts to the matching prop:
 *                ছয়-সাত  ✅ রাতে ৬–৭ ঘণ্টা ঘুম        → camera settles on the alarm clock
 *                সন্ধ্যার ✅ চা সন্ধ্যার আগে            → camera moves to the tea glass
 *                দুই-তিন ✅ দিনে ২–৩ কাপের বেশি না   → closer on the tea glass
 *  তাহলে → end  Card slides away; wide on clock + lamp. Clock hands wind back 2:00 → 11:00 ("রাত ১১টা"),
 *              lamp clicks off to moonlight; the reel ends on that calm frame.
 */
import { AbsoluteFill } from "remotion";
import { PostFX } from "../../kit/PostFX";
import { Lens, Stage } from "../../kit/Stage";
import { ease, mix, mix3, prog, useSeconds } from "../../kit/time";
import { CLOCK_POS, CUP_POS, CUP_SCALE, Desk } from "../three/Desk";
import { K, bodyFont } from "../theme";
import type { Cue } from "../types";
import { Check, Title } from "../ui/Text";
import { shotDuration, wordAt } from "../vo";

export const SH9_DURATION = shotDuration("tips");
/** Caption words (exact VO tokens) to highlight. */
export const SH9_KEYWORDS: string[] = ["ছয়-সাত", "সন্ধ্যার", "দুই-তিন", "পরিষ্কার"];

const T = {
  sleep: wordAt("tips", "ছয়-সাত"),
  evening: wordAt("tips", "সন্ধ্যার"),
  morning: wordAt("tips", "দুই-তিন"),
  then: wordAt("tips", "তাহলে"),
  less: wordAt("tips", "থাকবে"),
};
const WIND_A = T.then + 0.35;
const WIND_B = T.then + 1.15;
const LAMP_OFF = WIND_B + 0.1;

/** Sound cues for this shot (sparse!). */
export const SH9_CUES: Cue[] = [
  { at: T.sleep, sfx: "ding", volume: 0.6 },
  { at: T.evening, sfx: "ding_2", volume: 0.6 },
  { at: T.morning, sfx: "ding_3", volume: 0.6 },
  { at: WIND_A, sfx: "clock_wind", volume: 0.45 },
  { at: LAMP_OFF, sfx: "lamp_click", volume: 0.8 },
];

type V3 = [number, number, number];
type Key = { at: number; dur: number; pos: V3; target: V3; mm: number; focus: V3 };

const CUP_C: V3 = [CUP_POS[0], 0.48 * CUP_SCALE, CUP_POS[2]];
const CLOCK: V3 = [...CLOCK_POS];

/** Camera keys: each move starts at `at` and eases (cine) over `dur` to the new framing. */
const KEYS: Key[] = [
  { at: 0, dur: 0, pos: [-0.8, 2.4, 5.5], target: [0.55, 0.55, 0.0], mm: 31, focus: CUP_C },
  { at: 0, dur: T.sleep, pos: [-0.55, 2.2, 5.0], target: [0.55, 0.5, 0.0], mm: 32, focus: CUP_C },
  { at: T.sleep - 0.1, dur: 1.6, pos: [-0.35, 1.5, 3.5], target: [CLOCK[0], CLOCK[1] + 0.1, CLOCK[2]], mm: 33, focus: CLOCK },
  { at: T.evening - 0.1, dur: 1.6, pos: [2.55, 1.75, 4.1], target: [CUP_C[0] - 0.1, 0.42, CUP_C[2]], mm: 38, focus: CUP_C },
  { at: T.morning - 0.1, dur: 1.6, pos: [2.15, 1.3, 3.15], target: [CUP_C[0] - 0.05, 0.42, CUP_C[2]], mm: 44, focus: CUP_C },
  { at: T.then - 0.15, dur: 1.2, pos: [0.85, 1.75, 4.6], target: [0.45, 1.05, -0.7], mm: 34, focus: CLOCK },
  { at: T.then + 1.05, dur: SH9_DURATION - T.then - 1.05, pos: [0.75, 1.6, 4.1], target: [0.4, 1.05, -0.75], mm: 35, focus: CLOCK },
];

const camAt = (t: number) => {
  let pos: V3 = KEYS[0].pos;
  let target: V3 = KEYS[0].target;
  let mm = KEYS[0].mm;
  let focus: V3 = KEYS[0].focus;
  for (const k of KEYS.slice(1)) {
    const p = prog(t, k.at, k.at + Math.max(0.01, k.dur), ease.cine);
    pos = mix3(pos, k.pos, p);
    target = mix3(target, k.target, p);
    mm = mix(mm, k.mm, p);
    focus = mix3(focus, k.focus, p);
  }
  return { pos, target, mm, focus };
};

const World: React.FC = () => {
  const t = useSeconds();
  const c = camAt(t);
  const wind = prog(t, WIND_A, WIND_B, ease.inOut);
  const lamp = 1 - prog(t, LAMP_OFF, LAMP_OFF + 0.12);
  const fd = Math.hypot(c.pos[0] - c.focus[0], c.pos[1] - c.focus[1], c.pos[2] - c.focus[2]);
  return (
    <>
      <Lens position={c.pos} target={c.target} mm={c.mm} near={0.02} far={80} />
      <Desk t={t} clockHours={mix(26, 23, wind)} lampOn={lamp} steam={0.75 * (0.4 + 0.6 * lamp)} />
      <PostFX focus={fd} focusRange={1.1} bokeh={4} bloom={0.7} bloomThreshold={0.82} vignette={0.55} />
    </>
  );
};

const Card: React.FC<{ t: number }> = ({ t }) => {
  const inP = prog(t, 0.3, 0.8, ease.out);
  const outP = prog(t, T.then - 0.2, T.then + 0.25, ease.inOut);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 200 }}>
      <div
        style={{
          width: 900,
          padding: "34px 44px",
          borderRadius: 40,
          background: "linear-gradient(160deg, rgba(40,28,20,0.72), rgba(16,11,8,0.6))",
          border: `2px solid ${K.panelBorder}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
          backdropFilter: "blur(18px)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: bodyFont,
          fontWeight: 700,
          opacity: inP * (1 - outP),
          translate: `0px ${(1 - inP) * 40 - outP * 60}px`,
          scale: 0.94 + 0.06 * inP,
        }}
      >
        <Check at={T.sleep}>রাতে ৬–৭ ঘণ্টা ঘুম</Check>
        <Check at={T.evening}>চা সন্ধ্যার আগে</Check>
        <Check at={T.morning}>দিনে ২–৩ কাপের বেশি না</Check>
      </div>
    </AbsoluteFill>
  );
};

export const SH9Tips: React.FC = () => {
  const t = useSeconds();
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      <Stage background="#070504">
        <World />
      </Stage>
      {t < T.then + 0.3 ? <Card t={t} /> : null}
      {t >= T.then ? (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 260 }}>
          <Title at={WIND_A} size={120} color={K.ink}>
            রাত ১১টা
          </Title>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
