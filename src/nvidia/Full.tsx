/**
 * Nvidia video assembler (OWNER: lead). Scenes sit on one global timeline (scenes.ts); the tightened VO,
 * word captions and the ducked music run globally; each scene's SFX cues resolve to its spoken words.
 */
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { MIX, Music, SFX_GAIN } from "./audio/Music";
import { SCENE_SPANS } from "./scenes";
import { H1_CUES, H1_ID, H1_KEYWORDS, H1Hook } from "./shots/H1Hook";
import { P1_CUES, P1_ID, P1_KEYWORDS, P1Scene } from "./shots/P1";
import { P2_CUES, P2_ID, P2_KEYWORDS, P2Scene } from "./shots/P2";
import { P3_CUES, P3_ID, P3_KEYWORDS, P3Scene } from "./shots/P3";
import { P4_CUES, P4_ID, P4_KEYWORDS, P4Scene } from "./shots/P4";
import { P5_CUES, P5_ID, P5_KEYWORDS, P5Scene } from "./shots/P5";
import { P6_CUES, P6_ID, P6_KEYWORDS, P6Scene } from "./shots/P6";
import { P7_CUES, P7_ID, P7_KEYWORDS, P7Scene } from "./shots/P7";
import { P8_CUES, P8_ID, P8_KEYWORDS, P8Scene } from "./shots/P8";
import { N } from "./theme";
import type { Cue } from "./types";
import { Captions } from "./ui/Captions";
import { Grade } from "./kit";
import { VO_WORDS, voSpans } from "./vo";

type Scene = { readonly id: string; readonly Comp: React.FC; readonly keywords: string[]; readonly cues: Cue[] };

export const SCENES: Scene[] = [
  { id: H1_ID, Comp: H1Hook, keywords: H1_KEYWORDS, cues: H1_CUES },
  { id: P1_ID, Comp: P1Scene, keywords: P1_KEYWORDS, cues: P1_CUES },
  { id: P2_ID, Comp: P2Scene, keywords: P2_KEYWORDS, cues: P2_CUES },
  { id: P3_ID, Comp: P3Scene, keywords: P3_KEYWORDS, cues: P3_CUES },
  { id: P4_ID, Comp: P4Scene, keywords: P4_KEYWORDS, cues: P4_CUES },
  { id: P5_ID, Comp: P5Scene, keywords: P5_KEYWORDS, cues: P5_CUES },
  { id: P6_ID, Comp: P6Scene, keywords: P6_KEYWORDS, cues: P6_CUES },
  { id: P7_ID, Comp: P7Scene, keywords: P7_KEYWORDS, cues: P7_CUES },
  { id: P8_ID, Comp: P8Scene, keywords: P8_KEYWORDS, cues: P8_CUES },
];

export const NV_DURATION = Math.max(...SCENES.map((s) => SCENE_SPANS[s.id][1]));

const cueTime = (sceneId: string, c: Cue) => {
  const [a, b] = SCENE_SPANS[sceneId];
  if (c.word === undefined) return a + (c.at ?? 0);
  const norm = (s: string) => s.replace(/[,.;:!?।"“”‘’]/g, "");
  const hits = VO_WORDS.filter((w) => w.startMs >= a * 1000 - 50 && w.startMs < b * 1000 && norm(w.text).startsWith(norm(c.word!)));
  const w = hits[Math.min(c.nth ?? 0, hits.length - 1)];
  if (!w) throw new Error(`cue word "${c.word}" not in ${sceneId}`);
  return w.startMs / 1000 + (c.offset ?? 0);
};

export const NvidiaFull: React.FC<{ readonly audioOnly?: boolean }> = ({ audioOnly = false }) => {
  const { fps } = useVideoConfig();
  const keywords = SCENES.flatMap((s) => s.keywords);
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      {audioOnly
        ? null
        : SCENES.map((s) => {
            const [a, b] = SCENE_SPANS[s.id];
            const from = Math.round(a * fps);
            return (
              <Sequence key={s.id} name={s.id} from={from} durationInFrames={Math.round(b * fps) - from} premountFor={fps}>
                <s.Comp />
              </Sequence>
            );
          })}
      {audioOnly ? null : <Grade />}
      {audioOnly ? null : <Captions words={VO_WORDS} keywords={keywords} />}

      <Audio src={staticFile("nvidia/vo/vo.wav")} volume={MIX.vo} />
      <Music voSpans={voSpans()} total={NV_DURATION} tenseSpan={[SCENE_SPANS.P5[0] - 1, SCENE_SPANS.P6[1]]} />
      {SCENES.flatMap((s) =>
        s.cues.map((c, k) => {
          const t = Math.max(0, cueTime(s.id, c));
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
