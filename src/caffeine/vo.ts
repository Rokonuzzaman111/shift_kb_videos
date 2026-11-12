/**
 * Voiceover timing contract for the caffeine reel.
 *  - Each shot plays exactly one VO key; the assembler starts it at shot time VO_LEAD.
 *  - Shot duration = VO_LEAD + VO length + VO_TAIL (+ extra) → use shotDuration(key).
 *  - wordAt(key, "word") = shot-local seconds when that word starts (VO_LEAD included).
 * Regenerate VO with: python -I -X utf8 scripts/tts_caffeine.py --force
 */
import lengths from "./vo-lengths.json";
import hook from "../../public/vo/caffeine/hook.json";
import adeno from "../../public/vo/caffeine/adeno.json";
import caff from "../../public/vo/caffeine/caff.json";
import energy from "../../public/vo/caffeine/energy.json";
import time from "../../public/vo/caffeine/time.json";
import crash from "../../public/vo/caffeine/crash.json";
import memory from "../../public/vo/caffeine/memory.json";
import tolerance from "../../public/vo/caffeine/tolerance.json";
import tips from "../../public/vo/caffeine/tips.json";
import type { Word } from "../ui";

export const VO_LEAD = 0.4;
export const VO_TAIL = 0.5;

export const VO_WORDS = { hook, adeno, caff, energy, time, crash, memory, tolerance, tips } satisfies Record<
  string,
  Word[]
>;

export type VoKey = keyof typeof VO_WORDS;

export const voLength = (key: VoKey) => (lengths as Record<string, number>)[key];

export const shotDuration = (key: VoKey, extra = 0) => +(VO_LEAD + voLength(key) + VO_TAIL + extra).toFixed(2);

/** Shot-local time (s) when the n-th occurrence (0-based) of `word` starts. Prefix match allowed. */
export const wordAt = (key: VoKey, word: string, nth = 0) => {
  const hits = VO_WORDS[key].filter((w) => w.text === word || w.text.startsWith(word));
  const w = hits[Math.min(nth, hits.length - 1)];
  if (!w) throw new Error(`wordAt: "${word}" not in VO "${key}"`);
  return VO_LEAD + w.startMs / 1000;
};

/** Shot-local time (s) when that word finishes. */
export const wordEnd = (key: VoKey, word: string, nth = 0) => {
  const hits = VO_WORDS[key].filter((w) => w.text === word || w.text.startsWith(word));
  const w = hits[Math.min(nth, hits.length - 1)];
  if (!w) throw new Error(`wordEnd: "${word}" not in VO "${key}"`);
  return VO_LEAD + w.endMs / 1000;
};
