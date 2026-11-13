/**
 * Voiceover timing contract (OWNER: lead).
 * vo-words.json = every spoken word on the FINAL (pause-tightened) timeline, ms from video start.
 * scenes.ts gives each scene's [from, to) seconds on that same timeline.
 *
 * In a scene component:
 *   const at = useAt("H1");
 *   at("ট্রিলিয়ন")      → scene-local seconds when that word starts (prefix match, nth occurrence optional)
 *   atEnd("ট্রিলিয়ন")   → scene-local seconds when it ends
 * Lookups only search words inside that scene's span, so the same word in another scene can't be hit.
 */
import words from "./vo-words.json";
import { SCENE_SPANS } from "./scenes";
import type { Word } from "./types";

export const VO_WORDS = words as Word[];

const norm = (s: string) => s.replace(/[,.;:!?।"“”‘’'()\-–—]/g, "");

const find = (sceneId: string, word: string, nth = 0) => {
  const span = SCENE_SPANS[sceneId];
  if (!span) throw new Error(`unknown scene ${sceneId}`);
  const [a, b] = span;
  const w0 = norm(word);
  const hits = VO_WORDS.filter(
    (w) => w.startMs >= a * 1000 - 50 && w.startMs < b * 1000 && (norm(w.text) === w0 || norm(w.text).startsWith(w0)),
  );
  const w = hits[Math.min(nth, hits.length - 1)];
  if (!w) throw new Error(`word "${word}" not spoken inside scene ${sceneId}`);
  return { w, a };
};

export const useAt = (sceneId: string) => {
  const at = (word: string, nth = 0) => {
    const { w, a } = find(sceneId, word, nth);
    return w.startMs / 1000 - a;
  };
  return at;
};

export const useAtEnd = (sceneId: string) => (word: string, nth = 0) => {
  const { w, a } = find(sceneId, word, nth);
  return w.endMs / 1000 - a;
};

/** Spoken spans (s) merged across short gaps — used for music ducking. */
export const voSpans = (gap = 0.35): [number, number][] => {
  const out: [number, number][] = [];
  for (const w of VO_WORDS) {
    const s = w.startMs / 1000;
    const e = w.endMs / 1000;
    const last = out[out.length - 1];
    if (last && s - last[1] < gap) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
};
