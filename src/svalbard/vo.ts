/**
 * Voiceover timing for the Svalbard parts. Word lists are made by scripts/tts_svalbard.py (part time, ms).
 * at(words, "শব্দ", nth) → part seconds when that word starts. Never hard-code a time meant to hit a word.
 */
import p1 from "./vo/p1.json";
import p2 from "./vo/p2.json";
import p3 from "./vo/p3.json";
import p4 from "./vo/p4.json";
import p5 from "./vo/p5.json";
import type { Word } from "./theme";

export const VO = { p1: p1 as Word[], p2: p2 as Word[], p3: p3 as Word[], p4: p4 as Word[], p5: p5 as Word[] } as const;
export type PartId = keyof typeof VO;

const norm = (s: string) => s.replace(/[,.;:!?।"“”‘’'()\-–—]/g, "");

const hit = (words: Word[], word: string, nth = 0) => {
  const w0 = norm(word);
  const hits = words.filter((w) => norm(w.text).startsWith(w0));
  const w = hits[nth];
  if (!w) throw new Error(`VO word "${word}" #${nth} not found`);
  return w;
};

export const at = (part: PartId, word: string, nth = 0) => hit(VO[part], word, nth).startMs / 1000;
/** first (nth) occurrence that starts at/after `from` seconds — used by shots so a repeated word hits the right one */
export const atAfter = (part: PartId, word: string, from: number, nth = 0) =>
  hit(VO[part].filter((w) => w.startMs >= from * 1000 - 60), word, nth).startMs / 1000;
export const atEnd = (part: PartId, word: string, nth = 0) => hit(VO[part], word, nth).endMs / 1000;
