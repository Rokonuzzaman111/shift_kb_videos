/**
 * Svalbard v2 — PART 3 assembler. Sections: 3A–3D (S3A) → 3E–3G (S3B).
 * Music continues from the end of Part 2. Beat layer: a low kick on every shot cut. SFX: 6 total (3 + 3).
 */
import { PartPlayer, SV, partDuration, type Cue, type Shot } from "../../PartPlayer";
import { VO } from "../../vo";
import { CAPTION_V2, P } from "../palette";
import { S3A, s3aCues, s3aCuts, s3aEnd } from "./S3A";
import { S3B, s3bCues, s3bCuts } from "./S3B";

const words = VO.p3;
export const V2_P3_DURATION = partDuration(words);
/** Part 1 + Part 2 length = where the music bed picks up */
const MUSIC_FROM = partDuration(VO.p1) + partDuration(VO.p2);

const S3A_END = s3aEnd(0);
const S3B_FROM = Math.round(S3A_END * 30) / 30;

const CUTS = [0, S3A_END, V2_P3_DURATION];
const SHOTS: Shot[] = [
  { id: "3A-3D-arrival-pour-dry-seal", Comp: S3A },
  { id: "3E-3G-crate-sleep-sprout", Comp: S3B },
];
const KEYWORDS = ["বাড়তি", "কপি", "পাঁচশোটা", "শুকানো", "তিন", "ফয়েলের", "সিল", "মাইনাস", "আঠারো", "ঘুমিয়ে", "থেমে", "শত", "অঙ্কুরিত"];
const BEATS = [...s3aCuts(0), S3B_FROM, ...s3bCuts(S3B_FROM)];
const CUES: Cue[] = [...s3aCues(0), ...s3bCues(S3B_FROM), ...BEATS.map((t) => ({ t: t - 0.02, src: SV("kick"), vol: 0.32 }))];

export const SvalbardV2Part3: React.FC = () => (
  <PartPlayer
    words={words}
    shots={SHOTS}
    cuts={CUTS}
    keywords={KEYWORDS}
    cues={CUES}
    vo="svalbard/vo/p3.wav"
    musicFrom={MUSIC_FROM}
    captionColors={CAPTION_V2}
    background={P.night}
  />
);

export { KEYWORDS as V2_P3_KEYWORDS, S3A_END as V2_S3A_END, S3B_FROM as V2_S3B_FROM, CUES as V2_P3_CUES };
