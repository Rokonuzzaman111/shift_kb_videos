/**
 * OWNER: audio agent.
 * Background music bed for the whole reel, ducked under the voiceover.
 * `voSpans` = [startSec, endSec] of every spoken VO in reel time (computed by the assembler).
 *
 * Bed: public/music/caffeine_bed.wav (scripts/make_audio_caffeine.py) — 75 BPM lo-fi in D major,
 * Dmaj9 | Bm9 | Gmaj9 | A7sus4, mastered ~-16 LUFS, so the volumes below are deliberately low.
 */
import { Audio } from "@remotion/media";
import { staticFile, useVideoConfig } from "remotion";

/** Music level in gaps between VO lines. */
const GAP = 0.19;
/** Music level while VO is speaking. */
const DUCK = 0.06;
/** Level at the very start (hook) and after the last VO line (end card). */
const LIFT = 0.23;
const ATTACK = 0.15; // s — duck in (finishes right as the voice starts)
const RELEASE = 0.4; // s — swell back after the voice stops
const FADE_OUT = 1.5; // s

const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** 0 = no speech, 1 = fully ducked. */
const duckAmount = (t: number, spans: ReadonlyArray<readonly [number, number]>) => {
  let d = 0;
  for (const [a, b] of spans) {
    if (t < a - ATTACK || t > b + RELEASE) continue;
    const v = t < a ? smooth((t - (a - ATTACK)) / ATTACK) : t <= b ? 1 : 1 - smooth((t - b) / RELEASE);
    d = Math.max(d, v);
    if (d >= 1) break;
  }
  return d;
};

export const Music: React.FC<{ readonly voSpans: ReadonlyArray<readonly [number, number]>; readonly total: number }> = ({
  voSpans,
  total,
}) => {
  const { fps } = useVideoConfig();
  const lastEnd = voSpans.reduce((m, s) => Math.max(m, s[1]), 0);

  const volume = (f: number) => {
    const t = f / fps;
    // gap level: lifted for the first 0.8 s and after the final VO line
    const startLift = 1 - smooth(t / 0.8);
    const endLift = smooth((t - lastEnd) / RELEASE);
    const gap = GAP + (LIFT - GAP) * Math.max(startLift, endLift);
    const d = duckAmount(t, voSpans);
    const v = gap + (DUCK - gap) * d;
    const out = 1 - smooth((t - (total - FADE_OUT)) / FADE_OUT);
    return Math.max(0, v * out);
  };

  return <Audio src={staticFile("music/caffeine_bed.wav")} volume={volume} />;
};

/** Master volume multipliers the assembler applies (audio agent tunes these). */
export const MIX = {
  /** creator's own recording, loudness-normalised to about -16 LUFS */
  vo: 0.86,
  /** SFX files peak at -1 dBFS; balanced against the -16 LUFS voice so cues sit clearly under it. */
  sfx: 0.75,
  /** whoosh played by the assembler on every shot cut — a subtle air movement, not an effect */
  cutWhoosh: 0.18,
};
