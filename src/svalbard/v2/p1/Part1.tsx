/**
 * Svalbard v2 — PART 1 assembler. Sections: 1A → 1B → 1C.
 * Cuts sit just before section end words; SFX hang off VO words (bible §5).
 * Beat layer (bible §5): a light low kick on every shot cut of the part (section cuts + cuts inside 1A/1C).
 */
import { PartPlayer, SV, partDuration, type Cue, type Shot } from "../../PartPlayer";
import { VO, atAfter } from "../../vo";
import { CAPTION_V2, P } from "../palette";
import { S1A, s1aCues, s1aEnd } from "./S1A";
import { S1B, s1bCues, s1bEnd } from "./S1B";
import { S1C, s1cCues, s1cCuts } from "./S1C";

const words = VO.p1;
export const V2_P1_DURATION = partDuration(words);

const S1A_END = s1aEnd(0);
const S1B_END = s1bEnd(0);
const CUTS = [0, S1A_END, S1B_END, V2_P1_DURATION];
const SHOTS: Shot[] = [
  { id: "1A-earth-dive-where", Comp: S1A },
  { id: "1B-portal-title", Comp: S1B },
  { id: "1C-inside", Comp: S1C },
];
const KEYWORDS = ["ফসল", "স্‌ভালবার্ড", "মেরুর", "সিড", "ভল্ট", "সুড়ঙ্গ", "তিনটা", "মাইনাস", "আঠারো", "চৌদ্দ", "পঁয়তাল্লিশ"];
const S1B_FROM = Math.round(S1A_END * 30) / 30;
const S1C_FROM = Math.round(S1B_END * 30) / 30;
/** every shot cut in Part 1 (s): 1A cloud-dive swap + crane-out, section cuts, 1C internal cuts */
const BEATS = [
  atAfter("p1", "শুরু", 0) + 0.12,
  atAfter("p1", "নরওয়ের", 0) - 0.32,
  S1B_FROM,
  S1C_FROM,
  ...s1cCuts(S1C_FROM),
];
const CUES: Cue[] = [
  ...s1aCues(0),
  ...s1bCues(S1B_FROM),
  ...s1cCues(S1C_FROM),
  ...BEATS.map((t) => ({ t: t - 0.02, src: SV("kick"), vol: 0.32 })),
];

export const SvalbardV2Part1: React.FC = () => (
  <PartPlayer
    words={words}
    shots={SHOTS}
    cuts={CUTS}
    keywords={KEYWORDS}
    cues={CUES}
    vo="svalbard/vo/p1.wav"
    musicFrom={0}
    captionColors={CAPTION_V2}
    background={P.night}
  />
);

export { KEYWORDS as V2_P1_KEYWORDS, S1A_END as V2_S1A_END, S1B_END as V2_S1B_END, CUES as V2_P1_CUES };
