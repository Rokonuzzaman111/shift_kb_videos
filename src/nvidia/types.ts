/**
 * Nvidia explainer — contracts between agents (OWNER: lead).
 *
 * TIME MODEL: there is ONE tightened voiceover (public/nvidia/vo/vo.wav) and ONE global word list
 * (src/nvidia/vo-words.json, ms on the final video timeline). Every scene covers [from, to) seconds of
 * that same timeline. Inside a scene component, frame 0 = scene start, so use the helpers in ./vo.ts:
 *   const at = useAt("SC03");          // at("জিপিইউ") → scene-local seconds when that word starts
 * and drive animation with   interpolate(frame, [at("…")*fps, …], …).
 * Never hard-code seconds that are meant to hit a spoken word — always derive from at().
 */

/** SFX names available in public/nvidia/sfx/<name>.wav (made by the audio agent). */
export const SFX_NAMES = [
  "whoosh",
  "whoosh_big",
  "swoosh_up",
  "impact",
  "impact_deep",
  "riser",
  "riser_short",
  "hit_glitch",
  "tick",
  "ui_click",
  "ui_pop",
  "type",
  "cash",
  "drop_down",
  "alarm_soft",
  "power_on",
  "power_down",
  "bass_drop",
  "shimmer",
  "camera_shutter",
  "heartbeat",
  "news_sting",
  "reverse_swell",
  "data_stream",
] as const;

export type SfxName = (typeof SFX_NAMES)[number];

/**
 * A sound cue. `at` = scene-local seconds. Prefer `word` (cue lands on that spoken word, + `offset` s).
 * Keep SFX SPARSE: only on important beats (big numbers, reveals, scene turns). ~1 per 5–8 s on average.
 */
export type Cue = {
  readonly sfx: SfxName;
  readonly at?: number;
  readonly word?: string;
  readonly nth?: number;
  readonly offset?: number;
  readonly volume?: number;
};

export type Word = { text: string; startMs: number; endMs: number };
