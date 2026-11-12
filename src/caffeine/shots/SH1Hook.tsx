/**
 * OWNER: props3d agent. SH1 · hook (VO "hook", ~9 s).
 *  A  0 → পরদিন   3D night desk. Opens close on the steaming glass of milk tea (book, lamp glow, moon window behind);
 *                 slow push + rack focus from the cup to the alarm clock reading 2:00. Title "রাত ২টা" on চা.
 *  B  পরদিন → কীভাবে  Hard cut: 2D exam hall, student studying → head drops on ঝিমানোর. Title "পরীক্ষার হল".
 *  C  কীভাবে → end  Whip back to the tea glass, then a fast zoom down INTO the tea surface (hands over to SH2's brain).
 */
import { AbsoluteFill, interpolate } from "remotion";
import { PostFX } from "../../kit/PostFX";
import { Lens, Stage } from "../../kit/Stage";
import { clamp, ease, mix, mix3, prog, useSeconds } from "../../kit/time";
import { CLOCK_POS, CUP_POS, CUP_SCALE, Desk } from "../three/Desk";
import { TEA_TOP } from "../three/TeaCup";
import { ExamHall } from "../two/ExamHall";
import { Student } from "../two/Student";
import { K } from "../theme";
import type { Cue } from "../types";
import { Title } from "../ui/Text";
import { shotDuration, wordAt } from "../vo";

export const SH1_DURATION = shotDuration("hook");
/** Caption words (exact VO tokens) to highlight. */
export const SH1_KEYWORDS: string[] = ["রাতে", "চা", "ঝিমানোর"];

const T = {
  tea: wordAt("hook", "চা"),
  cutHall: wordAt("hook", "পরদিন") - 0.08,
  nod: wordAt("hook", "ঝিমানোর"),
  cutBack: wordAt("hook", "কীভাবে") - 0.08,
};

/** Sound cues for this shot (sparse!). */
export const SH1_CUES: Cue[] = [
  { at: 0.25, sfx: "clink", volume: 0.8 },
  { at: T.cutBack - 0.12, sfx: "whoosh_fast", volume: 0.7 },
];

const CUP_C: [number, number, number] = [CUP_POS[0], CUP_POS[1] + 0.5 * CUP_SCALE, CUP_POS[2]];
const TEA_Y = CUP_POS[1] + TEA_TOP(0.82) * CUP_SCALE;
const dist = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

type Cam = { pos: [number, number, number]; target: [number, number, number]; mm: number; focus: number; range: number };

const camAt = (t: number): Cam => {
  if (t < T.cutBack) {
    // A: cup → clock push with rack focus
    const a = prog(t, 0, T.cutHall + 0.4, ease.cine);
    const pos = mix3([2.6, 2.3, 5.0], [1.75, 1.5, 3.7], a);
    const target = mix3([0.85, 0.38, 0.35], [0.3, 0.62, -0.75], a);
    const rack = prog(t, 1.3, 2.7, ease.inOut);
    const focus = mix(dist(pos, CUP_C), dist(pos, CLOCK_POS), rack);
    return { pos, target, mm: mix(35, 40, a), focus, range: 1.1 };
  }
  // C: whip back then dive into the tea
  const w = prog(t, T.cutBack, T.cutBack + 0.32, ease.outCubic);
  const d = prog(t, T.cutBack + 0.2, SH1_DURATION, ease.inOut);
  const pos = mix3([2.45, 1.85, 3.0], [CUP_POS[0] + 0.02, TEA_Y + 0.72, CUP_POS[2] + 0.2], d);
  const look: [number, number, number] = [CUP_POS[0], TEA_Y - 0.05 * (1 - d), CUP_POS[2] + 0.1 * d];
  const target = mix3([look[0] - 2.4, look[1] + 0.4, look[2] - 0.6], look, w);
  return { pos, target, mm: mix(40, 58, d), focus: dist(pos, [CUP_POS[0], TEA_Y, CUP_POS[2]]), range: mix(0.8, 0.25, d) };
};

const World: React.FC = () => {
  const t = useSeconds();
  const c = camAt(t);
  const inC = t >= T.cutBack;
  return (
    <>
      <Lens position={c.pos} target={c.target} mm={c.mm} near={0.02} far={80} />
      <Desk t={t} clockHours={2} lampOn={1} steam={inC ? 0.9 * (1 - prog(t, T.cutBack + 0.4, SH1_DURATION - 0.7)) : 0.8} cupGlow={inC ? prog(t, SH1_DURATION - 1.2, SH1_DURATION, ease.inQuad) * 0.3 : 0} />
      <PostFX focus={c.focus} focusRange={c.range} bokeh={inC ? 3 : 5} bloom={0.7} bloomThreshold={0.82} vignette={0.55} />
    </>
  );
};

const Hall: React.FC = () => {
  const t = useSeconds();
  const p = prog(t, T.cutHall, T.cutBack, ease.cine);
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      <AbsoluteFill style={{ scale: 1 + p * 0.06 }}>
        <ExamHall t={t} />
        <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 1920 - 1260 }}>
          <Student t={t} pose={t >= T.nod ? "nodding" : "study"} poseAt={t >= T.nod ? T.nod : T.cutHall} width={720} />
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SH1Hook: React.FC = () => {
  const t = useSeconds();
  const inHall = t >= T.cutHall && t < T.cutBack;
  const whip = interpolate(t, [T.cutBack, T.cutBack + 0.06, T.cutBack + 0.34], [0, 60, 0], clamp);
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="sh1whip" x="-10%" y="0%" width="120%" height="100%">
          <feGaussianBlur stdDeviation={`${whip} ${whip * 0.08}`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: whip > 0.5 ? "url(#sh1whip)" : undefined }}>
        <Stage background="#070504">
          <World />
        </Stage>
      </AbsoluteFill>
      {inHall ? <Hall /> : null}

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        {t < T.cutHall ? (
          <Title at={T.tea} until={T.cutHall - 0.1} size={124} color={K.ink}>
            রাত ২টা
          </Title>
        ) : null}
        {inHall ? (
          <Title at={T.cutHall + 0.05} size={110} color={K.amber}>
            পরীক্ষার হল
          </Title>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
