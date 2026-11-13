/**
 * OWNER: audio agent.
 * Music for the NVIDIA explainer, ducked under the voiceover.
 *
 *   <Music voSpans={[[0.4, 3.1], …]} total={totalSeconds} tenseSpan={[a, b]} />
 *
 * `voSpans` = [startSec, endSec] of speech on the final timeline. `tenseSpan` (optional) = [a, b] seconds where
 * the bed crossfades (2 s, equal-power) to the darker loop and back.
 *
 * Files (scripts/make_audio_nvidia.py): public/nvidia/music/bed.wav — 450 s, 96 BPM, D minor, layers change every
 * 50 s, ~-16 LUFS; public/nvidia/music/bed_tense.wav — 90 s seamless loop, same key/tempo, ~-17 LUFS.
 * Both are mastered as loud as the voice, so the gains below are deliberately low.
 */
import { Audio } from "@remotion/media";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import type { SfxName } from "../types";

type Span = readonly [number, number];

/** Music level in gaps between VO lines. */
const GAP = 0.2;
/** Music level while VO is speaking (~-20 dB under the voice). */
const DUCK = 0.075;
/** Level for the opening second and after the last VO line (end card). */
const LIFT = 0.26;
const ATTACK = 0.18; // s — duck finishes right as the voice starts
const RELEASE = 0.6; // s — swell back after the voice stops
const HOLD = 0.35; // s — gaps shorter than this between VO lines stay ducked (no pumping)
const XFADE = 2; // s — bed <-> tense crossfade
const FADE_OUT = 2.5; // s

const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** merge VO spans whose gap is shorter than HOLD so the music doesn't pump between words */
const mergeSpans = (spans: ReadonlyArray<Span>): Span[] => {
  const s = [...spans].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const [a, b] of s) {
    const last = out[out.length - 1];
    if (last && a - last[1] < HOLD) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
};

/** 0 = no speech, 1 = fully ducked. */
const duckAmount = (t: number, spans: ReadonlyArray<Span>) => {
  let d = 0;
  for (const [a, b] of spans) {
    if (t < a - ATTACK || t > b + RELEASE) continue;
    const v = t < a ? smooth((t - (a - ATTACK)) / ATTACK) : t <= b ? 1 : 1 - smooth((t - b) / RELEASE);
    d = Math.max(d, v);
    if (d >= 1) break;
  }
  return d;
};

/** 0 = main bed, 1 = tense bed (centred crossfades of XFADE s at both span edges). */
const tenseAmount = (t: number, span?: Span) => {
  if (!span) return 0;
  const [a, b] = span;
  const h = XFADE / 2;
  return Math.min(smooth((t - (a - h)) / XFADE), 1 - smooth((t - (b - h)) / XFADE));
};

export const Music: React.FC<{
  readonly voSpans: ReadonlyArray<Span>;
  readonly total: number;
  readonly tenseSpan?: Span;
}> = ({ voSpans, total, tenseSpan }) => {
  const { fps } = useVideoConfig();
  const spans = mergeSpans(voSpans);
  const lastEnd = spans.reduce((m, s) => Math.max(m, s[1]), 0);

  /** overall music level at time t (seconds, global timeline) */
  const level = (t: number) => {
    const startLift = 1 - smooth(t / 1.0);
    const endLift = smooth((t - lastEnd) / RELEASE);
    const gap = GAP + (LIFT - GAP) * Math.max(startLift, endLift);
    const v = gap + (DUCK - gap) * duckAmount(t, spans);
    const out = 1 - smooth((t - (total - FADE_OUT)) / FADE_OUT);
    return Math.max(0, v * out);
  };

  // equal-power crossfade gains
  const bedGain = (t: number) => Math.cos((tenseAmount(t, tenseSpan) * Math.PI) / 2);
  const tenseGain = (t: number) => Math.sin((tenseAmount(t, tenseSpan) * Math.PI) / 2);

  const tFrom = tenseSpan ? Math.max(0, tenseSpan[0] - XFADE / 2) : 0;
  const tTo = tenseSpan ? Math.min(total, tenseSpan[1] + XFADE / 2) : 0;
  const tenseFrom = Math.floor(tFrom * fps);
  const tenseFrames = Math.max(1, Math.ceil(tTo * fps) - tenseFrom);

  return (
    <>
      <Audio src={staticFile("nvidia/music/bed.wav")} volume={(f) => level(f / fps) * bedGain(f / fps)} />
      {tenseSpan ? (
        <Sequence from={tenseFrom} durationInFrames={tenseFrames} layout="none" name="music-tense">
          <Audio
            src={staticFile("nvidia/music/bed_tense.wav")}
            loop
            loopVolumeCurveBehavior="extend"
            volume={(f) => {
              const t = (tenseFrom + f) / fps; // f is local to the Sequence
              return level(t) * tenseGain(t);
            }}
          />
        </Sequence>
      ) : null}
    </>
  );
};

/** Master volume multipliers the assembler applies (audio agent tunes these). */
export const MIX = {
  /** creator's own voice, loudness-normalised to about -16 LUFS */
  vo: 0.9,
  /** SFX files peak at -1 dBFS; multiply with the per-cue `volume` (see SFX_GAIN for per-name defaults) */
  sfx: 0.55,
  /** music: already shaped by <Music>; keep at 1 and tune GAP/DUCK above instead */
  music: 1,
} as const;

/**
 * Suggested per-SFX default volume (before MIX.sfx), balancing their different loudness
 * (all files are peak-normalised, so loud sustained ones need trimming and tiny transients a lift).
 */
export const SFX_GAIN: Record<SfxName, number> = {
  whoosh: 0.55,
  whoosh_big: 0.7,
  swoosh_up: 0.45,
  impact: 0.85,
  impact_deep: 1,
  riser: 0.55,
  riser_short: 0.5,
  hit_glitch: 0.7,
  tick: 0.35,
  ui_click: 0.5,
  ui_pop: 0.5,
  type: 0.45,
  cash: 0.4,
  drop_down: 0.55,
  alarm_soft: 0.4,
  power_on: 0.7,
  power_down: 0.65,
  bass_drop: 0.7,
  shimmer: 0.45,
  camera_shutter: 0.9,
  heartbeat: 0.8,
  news_sting: 0.6,
  reverse_swell: 0.55,
  data_stream: 0.35,
};
