/**
 * Svalbard v2 — PART 5 (final) assembler. Sections: 5A–5D (S5A) → 5E–5G (S5B).
 * Music continues from the end of Part 4 and fades out over the last 2.5 s; the picture fades to night over the last
 * 0.6 s (end of the video). Beat layer: a low kick on every shot cut. SFX: 6 total (3 + 3).
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { PartPlayer, SV, partDuration, type Cue, type Shot } from "../../PartPlayer";
import { VO } from "../../vo";
import { CAPTION_V2, P } from "../palette";
import { S5A, s5aCues, s5aCuts, s5aEnd } from "./S5A";
import { S5B, s5bCues, s5bCuts } from "./S5B";

const words = VO.p5;
export const V2_P5_DURATION = partDuration(words);
/** Part 1 + 2 + 3 + 4 length = where the music bed picks up */
const MUSIC_FROM = partDuration(VO.p1) + partDuration(VO.p2) + partDuration(VO.p3) + partDuration(VO.p4);

const S5A_END = s5aEnd(0);
const S5B_FROM = Math.round(S5A_END * 30) / 30;

const CUTS = [0, S5A_END, V2_P5_DURATION];
const SHOTS: Shot[] = [
  { id: "5A-5D-crate-aleppo-return-map", Comp: S5A },
  { id: "5E-5G-ukraine-seed-paddy-cta", Comp: S5B },
];
const KEYWORDS = ["সত্যিই", "আলেপ্পোর", "ইতিহাসে", "প্রথমবার", "লেবানন", "মরক্কোয়", "একুশটা", "ইউক্রেনও", "আজকের", "বীজ", "বাংলাদেশের", "ধানের", "কমেন্টে"];
const BEATS = [...s5aCuts(0), S5B_FROM, ...s5bCuts(S5B_FROM)];
const CUES: Cue[] = [...s5aCues(0), ...s5bCues(S5B_FROM), ...BEATS.map((t) => ({ t: t - 0.02, src: SV("kick"), vol: 0.32 }))];

const EndFade: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const o = interpolate(frame, [durationInFrames - 0.6 * fps, durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: P.night, opacity: o, pointerEvents: "none" }} />;
};

export const SvalbardV2Part5: React.FC = () => (
  <AbsoluteFill>
    <PartPlayer
      words={words}
      shots={SHOTS}
      cuts={CUTS}
      keywords={KEYWORDS}
      cues={CUES}
      vo="svalbard/vo/p5.wav"
      musicFrom={MUSIC_FROM}
      captionColors={CAPTION_V2}
      background={P.night}
      musicFadeOut={2.5}
    />
    <EndFade />
  </AbsoluteFill>
);

export { KEYWORDS as V2_P5_KEYWORDS, S5A_END as V2_S5A_END, S5B_FROM as V2_S5B_FROM, CUES as V2_P5_CUES };
