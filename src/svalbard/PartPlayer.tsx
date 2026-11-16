/**
 * Shared player for one Svalbard part: shot sequences (cut at word gaps), grade, captions, VO,
 * ducked music bed (continues across parts via `musicFrom`) and word-hung SFX cues.
 */
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { S, type Word } from "./theme";
import { type CaptionColors, Captions } from "./ui/Captions";
import { Grade } from "./ui/Grade";

export type Shot = { id: string; Comp: React.FC<{ readonly a: number }> };
export type Cue = { t: number; src: string; vol?: number };
export const NV = (n: string) => `nvidia/sfx/${n}.wav`;
export const SV = (n: string) => `svalbard/sfx/${n}.wav`;

export const partDuration = (words: Word[]) => Math.ceil((words[words.length - 1].endMs / 1000 + 0.75) * 30) / 30;

const speechSpans = (words: Word[]) => {
  const out: [number, number][] = [];
  for (const x of words) {
    const s = x.startMs / 1000;
    const e = x.endMs / 1000;
    const last = out[out.length - 1];
    if (last && s - last[1] < 0.35) last[1] = e;
    else out.push([s, e]);
  }
  return out;
};

export const PartPlayer: React.FC<{
  readonly words: Word[];
  readonly shots: Shot[];
  readonly cuts: number[];
  readonly keywords: string[];
  readonly cues: Cue[];
  readonly vo: string;
  readonly musicFrom: number;
  readonly captionColors?: CaptionColors;
  readonly background?: string;
  /** fade the music bed out over the last N seconds (final part) */
  readonly musicFadeOut?: number;
}> = ({ words, shots, cuts, keywords, cues, vo, musicFrom, captionColors, background = S.bg, musicFadeOut = 0 }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const total = durationInFrames / fps;
  const spans = speechSpans(words);
  const musicVol = (sec: number) => {
    let duck = 0;
    for (const [s, e] of spans) {
      if (sec < s - 0.2 || sec > e + 0.5) continue;
      duck = Math.max(duck, sec < s ? (sec - (s - 0.2)) / 0.2 : sec <= e ? 1 : 1 - (sec - e) / 0.5);
    }
    const fade = musicFadeOut > 0 ? Math.max(0, Math.min(1, (total - sec) / musicFadeOut)) : 1;
    return (0.32 - duck * 0.2) * fade;
  };
  return (
    <AbsoluteFill style={{ background }}>
      {shots.map((s, i) => {
        const from = Math.round(cuts[i] * fps);
        const to = Math.round(cuts[i + 1] * fps);
        return (
          <Sequence key={s.id} name={s.id} from={from} durationInFrames={to - from} premountFor={fps}>
            <s.Comp a={from / fps} />
          </Sequence>
        );
      })}
      <Grade />
      <Captions words={words} keywords={keywords} colors={captionColors} />
      <Audio src={staticFile(vo)} volume={1} />
      <Audio src={staticFile("svalbard/music/bed.wav")} trimBefore={Math.round(musicFrom * fps)} volume={(f) => musicVol(f / fps)} />
      {cues.map((c, i) => (
        <Sequence key={i} name={`sfx ${c.src.split("/").pop()}`} from={Math.max(0, Math.round(c.t * fps))} durationInFrames={Math.round(4 * fps)}>
          <Audio src={staticFile(c.src)} volume={c.vol ?? 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
