/**
 * Svalbard v2 — PART 2 assembler. Sections: 2A–2D (S2A) → 2E–2I (S2B).
 * Music continues from the end of Part 1. Beat layer: a low kick on every shot cut.
 */
import { PartPlayer, SV, partDuration, type Cue, type Shot } from "../../PartPlayer";
import { VO } from "../../vo";
import { CAPTION_V2, P } from "../palette";
import { S2A, s2aCues, s2aCuts, s2aEnd } from "./S2A";
import { S2B, s2bCues, s2bCuts } from "./S2B";

const words = VO.p2;
export const V2_P2_DURATION = partDuration(words);
/** Part 1 length = where the music bed picks up */
const P1_DURATION = partDuration(VO.p1);

const S2A_END = s2aEnd(0);

const CUTS = [0, S2A_END, V2_P2_DURATION];
const SHOTS: Shot[] = [
  { id: "2A-2D-plaque-backup-genebank-scoops", Comp: S2A },
  { id: "2E-2I-drought-rust-paddy-threats-lastseed", Comp: S2B },
];
const KEYWORDS = ["ভল্ট", "কৃষির", "ব্যাকআপ", "জিন-ব্যাংকে", "ধান", "গম", "ভুট্টাসহ", "হাজারো", "খরা", "রোগ", "ফলন", "যুদ্ধ", "বন্যা", "আগুন", "যান্ত্রিক", "ধ্বংস", "চিরতরে"];
const S2B_FROM = Math.round(S2A_END * 30) / 30;
const BEATS = [...s2aCuts(0), S2B_FROM, ...s2bCuts(S2B_FROM)];
const CUES: Cue[] = [...s2aCues(0), ...s2bCues(S2B_FROM), ...BEATS.map((t) => ({ t: t - 0.02, src: SV("kick"), vol: 0.32 }))];

export const SvalbardV2Part2: React.FC = () => (
  <PartPlayer
    words={words}
    shots={SHOTS}
    cuts={CUTS}
    keywords={KEYWORDS}
    cues={CUES}
    vo="svalbard/vo/p2.wav"
    musicFrom={P1_DURATION}
    captionColors={CAPTION_V2}
    background={P.night}
  />
);

export { KEYWORDS as V2_P2_KEYWORDS, S2A_END as V2_S2A_END, S2B_FROM as V2_S2B_FROM, CUES as V2_P2_CUES };
