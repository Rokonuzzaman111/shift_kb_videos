/**
 * OWNER: props3d agent. SH5 · time (VO "time", ~12 s).
 *  A  0 → অর্ধেক     Tea glass on the night desk; push-in on চা. A cyan timer ring on the desk around the glass fills
 *                    to 20 min on বিশ and stretches to 30 on ত্রিশ. Title "২০–৩০ মিনিট". On ক্যাফেইন cyan sparks
 *                    appear in the tea; label "ক্যাফেইন কাজ শুরু" on কাজ.
 *  B  অর্ধেক → দশটায়  Cut to a glass cylinder of glowing cyan "caffeine": level drains 100% → 50% (title counter),
 *                    bracket "৫ ঘণ্টা" draws on পাঁচ.
 *  C  দশটায় → end   New place: a dark bedroom at night. One wall clock time-lapses 10:00 → 3:00 (lands on
 *                    তিনটাতেও) while the moon crosses the window and the sleeper tosses under the duvet; the
 *                    half-full tea on the nightstand still glows cyan. Live label "রাত ১০টা … ৩টা";
 *                    on অর্ধেকটা a cyan label "ক্যাফেইন এখনো ৫০%".
 */
import { useEffect, useState } from "react";
import { AbsoluteFill, interpolate, useDelayRender } from "remotion";
import type * as THREE from "three";
import { PostFX } from "../../kit/PostFX";
import { Lens, Stage } from "../../kit/Stage";
import { clamp, ease, mix, mix3, prog, useSeconds } from "../../kit/time";
import { CUP_POS, CUP_SCALE, Desk } from "../three/Desk";
import { Bedroom, WALL_CLOCK, makeClockFace } from "../three/props/Bedroom";
import { CaffeineTube, TUBE_BASE, TUBE_H, TimerRing, project } from "../three/props/Meter";
import { K, bodyFont, headFont } from "../theme";
import type { Cue } from "../types";
import { Label, Title, bn } from "../ui/Text";
import { shotDuration, wordAt } from "../vo";

export const SH5_DURATION = shotDuration("time");
/** Caption words (exact VO tokens) to highlight. */
export const SH5_KEYWORDS: string[] = ["বিশ", "ত্রিশ", "পাঁচ", "তিনটাতেও"];

const T = {
  tea: wordAt("time", "চা"),
  twenty: wordAt("time", "বিশ"),
  thirty: wordAt("time", "ত্রিশ"),
  caff: wordAt("time", "ক্যাফেইন"),
  work: wordAt("time", "কাজ"),
  and: wordAt("time", "আর"),
  cutB: wordAt("time", "অর্ধেক") - 0.1,
  five: wordAt("time", "পাঁচ"),
  cutC: wordAt("time", "দশটায়") - 0.12,
  three: wordAt("time", "তিনটাতেও"),
  half: wordAt("time", "অর্ধেকটা"),
};
const SPIN_A = T.cutC + 0.45;
const SPIN_B = T.three + 0.05;

/** Sound cues for this shot (sparse!). */
export const SH5_CUES: Cue[] = [
  { at: T.twenty, sfx: "timer_wind", volume: 0.6 },
  { at: T.cutB + 0.25, sfx: "liquid_drop", volume: 0.5 },
  { at: SPIN_A - 0.05, sfx: "tick_fast", volume: 0.55 },
];

const CUP_TOP_Y = 0.9 * CUP_SCALE;
const TUBE_POS: [number, number, number] = [CUP_POS[0], 0, CUP_POS[2]];

type Cam = { pos: [number, number, number]; target: [number, number, number]; mm: number; focusPt: [number, number, number]; range: number };

const camAt = (t: number): Cam => {
  const cup: [number, number, number] = [CUP_POS[0], CUP_TOP_Y * 0.55, CUP_POS[2]];
  if (t < T.cutB) {
    const p1 = prog(t, T.tea - 0.1, T.thirty + 0.6, ease.cine);
    const p2 = prog(t, T.caff - 0.1, T.and + 0.6, ease.cine);
    const p3 = prog(t, T.and, T.cutB + 0.6, ease.cine);
    let pos = mix3([3.3, 2.4, 4.7], [2.75, 2.15, 3.95], p1);
    pos = mix3(pos, [2.4, 1.85, 3.6], p2);
    pos = mix3(pos, [1.85, 1.9, 3.75], p3);
    const target = mix3([CUP_POS[0] - 0.05, 0.3, CUP_POS[2] - 0.15], [CUP_POS[0], 0.38, CUP_POS[2] - 0.05], p2);
    return { pos, target, mm: mix(34, 40, p1 * 0.5 + p2 * 0.5), focusPt: cup, range: 0.9 };
  }
  if (t < T.cutC) {
    const p = prog(t, T.cutB, T.cutC + 0.5, ease.cine);
    const mid: [number, number, number] = [TUBE_POS[0], TUBE_BASE + TUBE_H * 0.55, TUBE_POS[2]];
    const pos = mix3([TUBE_POS[0] - 1.2, 2.6, TUBE_POS[2] + 5.0], [TUBE_POS[0] - 0.9, 2.4, TUBE_POS[2] + 4.4], p);
    return { pos, target: [mid[0] - 0.05, mid[1] - 0.25, mid[2]], mm: 36, focusPt: mid, range: 1.2 };
  }
  // bedroom (metres): wide on bed + wall clock, slow push to the clock, settle to include the glowing cup
  const p = prog(t, T.cutC, T.three + 0.3, ease.cine);
  const q = prog(t, T.three - 0.2, SH5_DURATION, ease.cine);
  let pos = mix3([0.1, 1.45, 1.45], [0.3, 1.75, 0.35], p);
  pos = mix3(pos, [1.05, 1.4, 0.75], q);
  let target = mix3([-0.4, 1.5, -2.2], [0.0, 1.8, -2.45], p);
  target = mix3(target, [0.75, 1.55, -2.3], q);
  const focusPt = mix3([...WALL_CLOCK] as [number, number, number], [0.9, 1.3, -2.2], q);
  return { pos, target, mm: mix(24, 30, p), focusPt, range: 2.2 };
};

const World: React.FC<{ readonly face: THREE.Texture }> = ({ face }) => {
  const t = useSeconds();
  const c = camAt(t);
  const seg = t < T.cutB ? 0 : t < T.cutC ? 1 : 2;
  const ringA = interpolate(t, [T.twenty, T.twenty + 0.45], [0, 20 / 60], { ...clamp, easing: ease.out });
  const ringB = interpolate(t, [T.thirty, T.thirty + 0.4], [0, 10 / 60], { ...clamp, easing: ease.out });
  const ringShow = prog(t, T.twenty - 0.35, T.twenty);
  const glowA = prog(t, T.caff, T.caff + 0.8, ease.out);
  const level = 1 - 0.5 * prog(t, T.cutB + 0.25, T.five + 0.35, ease.inOut);
  const spin = prog(t, SPIN_A, SPIN_B, ease.inOut);
  const focus = Math.hypot(c.pos[0] - c.focusPt[0], c.pos[1] - c.focusPt[1], c.pos[2] - c.focusPt[2]);
  return (
    <>
      <Lens position={c.pos} target={c.target} mm={c.mm} near={0.02} far={80} />
      {seg === 2 ? (
        <Bedroom t={t} hours={22 + 5 * spin} night={spin} face={face} cupGlow={0.75} />
      ) : (
      <Desk
        t={t}
        clockHours={22}
        lampOn={1}
        steam={0.7}
        cupFill={0.82}
        cupGlow={seg === 0 ? glowA : 0.6}
        showCup={seg !== 1}
        showClock={seg === 0}
      />
      )}
      {seg === 0 ? <TimerRing position={CUP_POS} a={ringA} b={ringB} show={ringShow} /> : null}
      {seg === 1 ? <CaffeineTube position={TUBE_POS} level={level} /> : null}
      <PostFX focus={focus} focusRange={c.range} bokeh={4} bloom={0.7} bloomThreshold={0.82} vignette={0.55} />
    </>
  );
};

const textStyle: React.CSSProperties = {
  fontFamily: headFont,
  fontWeight: 800,
  WebkitTextStroke: "8px rgba(0,0,0,0.55)",
  paintOrder: "stroke fill",
  textShadow: "0 6px 24px rgba(0,0,0,0.6)",
};

/** Bracket from the 100% mark down to the 50% mark beside the tube, drawn on পাঁচ, with "৫ ঘণ্টা". */
const Bracket: React.FC<{ t: number }> = ({ t }) => {
  const c = camAt(t);
  const top = project([TUBE_POS[0] + 0.42, TUBE_BASE + TUBE_H, TUBE_POS[2]], c);
  const mid = project([TUBE_POS[0] + 0.42, TUBE_BASE + TUBE_H * 0.5, TUBE_POS[2]], c);
  const p = prog(t, T.five - 0.05, T.five + 0.4, ease.out);
  const x = top[0] + 40;
  const h = mid[1] - top[1];
  return (
    <div style={{ position: "absolute", left: x, top: top[1], width: 300, height: h, opacity: Math.min(1, p * 3) }}>
      <svg width={60} height={h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <path
          d={`M 4 2 L 30 2 L 30 ${h - 2} L 4 ${h - 2}`}
          fill="none"
          stroke={K.cyan}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
          style={{ filter: `drop-shadow(0 0 10px ${K.cyan})` }}
        />
      </svg>
      <div style={{ ...textStyle, position: "absolute", left: 52, top: h / 2 - 48, fontSize: 70, color: K.ink, whiteSpace: "nowrap", opacity: prog(t, T.five + 0.1, T.five + 0.35), translate: `${(1 - p) * 20}px 0` }}>
        ৫ ঘণ্টা
      </div>
    </div>
  );
};

/** Draws the Bangla clock face once the font has loaded (holds the render meanwhile). */
const useClockFace = () => {
  const { delayRender, continueRender } = useDelayRender();
  const [face, setFace] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const handle = delayRender("SH5 clock face");
    let done = false;
    document.fonts
      .load(`700 64px "${bodyFont}"`, "১২")
      .catch(() => undefined)
      .then(() => {
        if (done) return;
        setFace(makeClockFace(bodyFont));
        done = true;
        continueRender(handle);
      });
    return () => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    };
  }, [delayRender, continueRender]);
  return face;
};

export const SH5Time: React.FC = () => {
  const t = useSeconds();
  const seg = t < T.cutB ? 0 : t < T.cutC ? 1 : 2;
  const minutes = Math.round(interpolate(t, [T.twenty, T.twenty + 0.45], [0, 20], { ...clamp, easing: ease.out }));
  const thirtyIn = prog(t, T.thirty, T.thirty + 0.25, ease.out);
  const pct = Math.round(100 - 50 * prog(t, T.cutB + 0.25, T.five + 0.35, ease.inOut));
  const hourNow = (((Math.floor(22 + 5 * prog(t, SPIN_A, SPIN_B, ease.inOut) + 0.001) - 1) % 12) + 12) % 12 + 1;
  const face = useClockFace();
  if (!face) return <AbsoluteFill style={{ background: K.bg }} />;
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      <Stage background="#070504">
        <World face={face} />
      </Stage>

      {seg === 0 ? (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, gap: 22 }}>
          <Title at={T.twenty - 0.05} size={130} color={K.cyan}>
            {bn(minutes)}
            <span style={{ opacity: thirtyIn, display: "inline-block", scale: `${0.7 + 0.3 * thirtyIn}` }}>–৩০</span>
            <span style={{ fontSize: 80, color: K.ink }}> মিনিট</span>
          </Title>
          <Label at={T.work} accent={K.cyan} size={52}>
            ক্যাফেইন কাজ শুরু
          </Label>
        </AbsoluteFill>
      ) : null}

      {seg === 1 ? (
        <>
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
            <Title at={T.cutB + 0.05} size={140} color={K.cyan}>
              {bn(pct)}%
            </Title>
          </AbsoluteFill>
          <Bracket t={t} />
        </>
      ) : null}

      {seg === 2 ? (
        <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, gap: 26 }}>
          <Title at={T.cutC + 0.1} size={120} color={hourNow === 3 ? K.cyan : K.ink}>
            রাত {bn(hourNow)}টা
          </Title>
          <Label at={T.half} accent={K.cyan} size={52}>
            ক্যাফেইন এখনো ৫০%
          </Label>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
