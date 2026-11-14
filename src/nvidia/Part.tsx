/**
 * One PART of the Nvidia video, rendered on its own (low RAM laptop: parts are built and rendered one by one).
 * Same audio/caption logic as Full.tsx, but only the given scenes are imported, and the VO/captions are cut
 * exactly at the part's end (which always sits in a pause between sentences).
 */
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { MIX, Music, SFX_GAIN } from "./audio/Music";
import { Grade } from "./kit";
import { SCENE_SPANS } from "./scenes";
import { N } from "./theme";
import type { Cue } from "./types";
import { Captions } from "./ui/Captions";
import { VO_WORDS, voSpans } from "./vo";

export type PartScene = { readonly id: string; readonly Comp: React.FC; readonly keywords: string[]; readonly cues: Cue[] };

const norm = (s: string) => s.replace(/[,.;:!?।"“”‘’]/g, "");

const cueTime = (sceneId: string, c: Cue) => {
  const [a, b] = SCENE_SPANS[sceneId];
  if (c.word === undefined) return a + (c.at ?? 0);
  const hits = VO_WORDS.filter((w) => w.startMs >= a * 1000 - 50 && w.startMs < b * 1000 && norm(w.text).startsWith(norm(c.word!)));
  const w = hits[Math.min(c.nth ?? 0, hits.length - 1)];
  if (!w) throw new Error(`cue word "${c.word}" not in ${sceneId}`);
  return w.startMs / 1000 + (c.offset ?? 0);
};

/** Global [start, end] seconds of the part; `range` cuts a sub-range out of long scenes (always inside a pause). */
export const partSpan = (scenes: PartScene[], range?: [number, number]): [number, number] =>
  range ?? [SCENE_SPANS[scenes[0].id][0], SCENE_SPANS[scenes[scenes.length - 1].id][1]];

export const NvidiaPart: React.FC<{ readonly scenes: PartScene[]; readonly range?: [number, number] }> = ({ scenes, range }) => {
  const { fps } = useVideoConfig();
  const [p0, p1] = partSpan(scenes, range);
  const off = Math.round(p0 * fps);
  const words = VO_WORDS.filter((w) => w.startMs >= p0 * 1000 && w.startMs < p1 * 1000).map((w) => ({
    ...w,
    startMs: w.startMs - p0 * 1000,
    endMs: w.endMs - p0 * 1000,
  }));
  const spans = voSpans()
    .filter(([a, b]) => b > p0 && a < p1)
    .map(([a, b]) => [a - p0, b - p0] as [number, number]);
  const keywords = scenes.flatMap((s) => s.keywords);
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      {scenes.map((s) => {
        const [a, b] = SCENE_SPANS[s.id];
        const from = Math.round(a * fps) - off;
        return (
          <Sequence key={s.id} name={s.id} from={from} durationInFrames={Math.round(b * fps) - off - from} premountFor={fps}>
            <s.Comp />
          </Sequence>
        );
      })}
      <Grade />
      <Captions words={words} keywords={keywords} />
      <Audio src={staticFile("nvidia/vo/vo.wav")} trimBefore={off} volume={MIX.vo} />
      <Music voSpans={spans} total={p1 - p0} />
      {scenes.flatMap((s) =>
        s.cues.map((c, k) => {
          const g = cueTime(s.id, c);
          if (g < p0 - 0.05 || g >= p1 - 0.1) return null;
          const t = Math.max(0, g - p0);
          return (
            <Sequence key={`${s.id}-${k}`} name={`SFX ${c.sfx}`} from={Math.round(t * fps)} durationInFrames={Math.round(4 * fps)}>
              <Audio src={staticFile(`nvidia/sfx/${c.sfx}.wav`)} volume={(c.volume ?? 1) * SFX_GAIN[c.sfx] * MIX.sfx} />
            </Sequence>
          );
        }),
      )}
    </AbsoluteFill>
  );
};
