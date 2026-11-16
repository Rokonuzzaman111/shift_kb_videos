/**
 * Svalbard v2 — PART 4 assembler. Sections: 4A–4C (S4A) → 4D–4F (S4B).
 * Music continues from the end of Part 3. Beat layer: a low kick on every shot cut. SFX: 6 total (3 + 3).
 */
import { PartPlayer, SV, partDuration, type Cue, type Shot } from "../../PartPlayer";
import { VO } from "../../vo";
import { CAPTION_V2, P } from "../palette";
import { S4A, s4aCues, s4aCuts, s4aEnd } from "./S4A";
import { S4B, s4bCues, s4bCuts } from "./S4B";

const words = VO.p4;
export const V2_P4_DURATION = partDuration(words);
/** Part 1 + Part 2 + Part 3 length = where the music bed picks up */
const MUSIC_FROM = partDuration(VO.p1) + partDuration(VO.p2) + partDuration(VO.p3);

const S4A_END = s4aEnd(0);
const S4B_FROM = Math.round(S4A_END * 30) / 30;

const CUTS = [0, S4A_END, V2_P4_DURATION];
const SHOTS: Shot[] = [
  { id: "4A-4C-coast-permafrost-power", Comp: S4A },
  { id: "4D-4F-free-blackbox-owner", Comp: S4B },
];
const KEYWORDS = ["একশো", "ত্রিশ", "মিটার", "বরফ", "পারমাফ্রস্ট", "বিদ্যুৎ", "ঠান্ডা", "টাকা", "ব্ল্যাক", "বক্স", "শুধু", "ফেরত"];
const BEATS = [...s4aCuts(0), S4B_FROM, ...s4bCuts(S4B_FROM)];
const CUES: Cue[] = [...s4aCues(0), ...s4bCues(S4B_FROM), ...BEATS.map((t) => ({ t: t - 0.02, src: SV("kick"), vol: 0.32 }))];

export const SvalbardV2Part4: React.FC = () => (
  <PartPlayer
    words={words}
    shots={SHOTS}
    cuts={CUTS}
    keywords={KEYWORDS}
    cues={CUES}
    vo="svalbard/vo/p4.wav"
    musicFrom={MUSIC_FROM}
    captionColors={CAPTION_V2}
    background={P.night}
  />
);

export { KEYWORDS as V2_P4_KEYWORDS, S4A_END as V2_S4A_END, S4B_FROM as V2_S4B_FROM, CUES as V2_P4_CUES };
