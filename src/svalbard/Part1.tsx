/**
 * Svalbard reel — PART 1 (hook → what & where → inside → numbers), ~27 s.
 * Shot cuts sit in the gaps between words; every SFX hangs off a VO word.
 */
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { P1A, P1B, P1C, P1D, P1E, P1F, P1G, P1H, type ShotProps } from "./shots/P1Shots";
import { S } from "./theme";
import { Captions } from "./ui/Captions";
import { Grade } from "./ui/Grade";
import { VO, at } from "./vo";

const w = (word: string, n = 0) => at("p1", word, n);
const words = VO.p1;
export const P1_DURATION = Math.ceil((words[words.length - 1].endMs / 1000 + 0.75) * 30) / 30;

const CUTS = [0, w("আবার") - 0.08, w("নরওয়ের") - 0.3, w("একটা") - 0.12, w("স্‌ভালবার্ড", 1) - 0.22, w("দরজা") - 0.25, w("ভেতরে") - 0.25, w("আর") - 0.2, P1_DURATION];
const SHOTS: { id: string; Comp: React.FC<ShotProps> }[] = [
  { id: "A-field", Comp: P1A },
  { id: "B-blizzard", Comp: P1B },
  { id: "C-globe", Comp: P1C },
  { id: "D-cutaway", Comp: P1D },
  { id: "E-title", Comp: P1E },
  { id: "F-tunnel", Comp: P1F },
  { id: "G-vault", Comp: P1G },
  { id: "H-capacity", Comp: P1H },
];

const KEYWORDS = ["ফসল", "স্‌ভালবার্ড", "মেরুর", "সিড", "ভল্ট", "সুড়ঙ্গ", "তিনটা", "মাইনাস", "আঠারো", "চৌদ্দ", "পঁয়তাল্লিশ"];

type Cue = { t: number; src: string; vol?: number };
const NV = (n: string) => `nvidia/sfx/${n}.wav`;
const SV = (n: string) => `svalbard/sfx/${n}.wav`;
const CUES: Cue[] = [
  { t: w("হারিয়ে") - 0.5, src: NV("reverse_swell"), vol: 0.5 },
  { t: CUTS[1] - 0.15, src: NV("whoosh_big"), vol: 0.7 },
  { t: CUTS[1], src: SV("wind"), vol: 0.55 },
  { t: CUTS[2] - 0.1, src: NV("whoosh"), vol: 0.6 },
  { t: w("স্‌ভালবার্ড"), src: NV("ui_pop"), vol: 0.6 },
  { t: w("উত্তর") + 0.1, src: NV("tick"), vol: 0.6 },
  { t: CUTS[3] - 0.1, src: NV("whoosh"), vol: 0.6 },
  { t: w("গভীরে") - 0.1, src: NV("impact_deep"), vol: 0.6 },
  { t: CUTS[4], src: NV("shimmer"), vol: 0.6 },
  { t: w("স্‌ভালবার্ড", 1) - 0.05, src: NV("bass_drop"), vol: 0.55 },
  { t: w("দরজা") - 0.1, src: SV("door"), vol: 0.9 },
  { t: w("পাহাড়ের", 2) - 0.3, src: NV("whoosh_big"), vol: 0.75 },
  { t: w("তিনটা"), src: NV("ui_pop"), vol: 0.5 },
  { t: w("তিনটা") + 0.14, src: NV("ui_pop"), vol: 0.5 },
  { t: w("তিনটা") + 0.28, src: NV("ui_pop"), vol: 0.5 },
  { t: CUTS[6], src: SV("frost"), vol: 0.7 },
  { t: w("চৌদ্দ") - 0.1, src: NV("riser_short"), vol: 0.5 },
  { t: w("চৌদ্দ") + 1.1, src: NV("impact"), vol: 0.55 },
  { t: CUTS[7] - 0.1, src: NV("whoosh"), vol: 0.6 },
  { t: w("পঁয়তাল্লিশ"), src: NV("impact_deep"), vol: 0.6 },
];

/** music level: ducked under speech, lifted in gaps */
const speech = (() => {
  const out: [number, number][] = [];
  for (const x of words) {
    const s = x.startMs / 1000;
    const e = x.endMs / 1000;
    const last = out[out.length - 1];
    if (last && s - last[1] < 0.35) last[1] = e;
    else out.push([s, e]);
  }
  return out;
})();
const musicVol = (sec: number) => {
  let duck = 0;
  for (const [s, e] of speech) {
    if (sec < s - 0.2 || sec > e + 0.5) continue;
    duck = Math.max(duck, sec < s ? (sec - (s - 0.2)) / 0.2 : sec <= e ? 1 : 1 - (sec - e) / 0.5);
  }
  return 0.32 - duck * 0.2;
};

export const SvalbardPart1: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: S.bg }}>
      {SHOTS.map((s, i) => {
        const from = Math.round(CUTS[i] * fps);
        const to = Math.round(CUTS[i + 1] * fps);
        return (
          <Sequence key={s.id} name={s.id} from={from} durationInFrames={to - from} premountFor={fps}>
            <s.Comp a={from / fps} />
          </Sequence>
        );
      })}
      <Grade />
      <Captions words={words} keywords={KEYWORDS} />
      <Audio src={staticFile("svalbard/vo/p1.wav")} volume={1} />
      <Audio src={staticFile("svalbard/music/bed.wav")} volume={(f) => musicVol(f / fps)} />
      {CUES.map((c, i) => (
        <Sequence key={i} name={`sfx ${c.src.split("/").pop()}`} from={Math.max(0, Math.round(c.t * fps))} durationInFrames={Math.round(4 * fps)}>
          <Audio src={staticFile(c.src)} volume={c.vol ?? 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
