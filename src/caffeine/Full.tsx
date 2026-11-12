/**
 * Caffeine reel assembler (owner: lead). Every shot in script order, each with:
 *  - a short zoom-blur entry transition (no sound on cuts: each shot's own cues carry the audio)
 *  - its VO (starting at VO_LEAD) and word-synced captions
 *  - its own sparse SFX cues
 * plus one music bed ducked under the voice, and the film finish overlay.
 */
import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Finish } from "../ui";
import { MIX, Music } from "./audio/Music";
import { SH1_CUES, SH1_DURATION, SH1_KEYWORDS, SH1Hook } from "./shots/SH1Hook";
import { SH2_CUES, SH2_DURATION, SH2_KEYWORDS, SH2Adeno } from "./shots/SH2Adeno";
import { SH3_CUES, SH3_DURATION, SH3_KEYWORDS, SH3Caff } from "./shots/SH3Caff";
import { SH4_CUES, SH4_DURATION, SH4_KEYWORDS, SH4Energy } from "./shots/SH4Energy";
import { SH5_CUES, SH5_DURATION, SH5_KEYWORDS, SH5Time } from "./shots/SH5Time";
import { SH6_CUES, SH6_DURATION, SH6_KEYWORDS, SH6Crash } from "./shots/SH6Crash";
import { SH7_CUES, SH7_DURATION, SH7_KEYWORDS, SH7Memory } from "./shots/SH7Memory";
import { SH8_CUES, SH8_DURATION, SH8_KEYWORDS, SH8Tolerance } from "./shots/SH8Tolerance";
import { SH9_CUES, SH9_DURATION, SH9_KEYWORDS, SH9Tips } from "./shots/SH9Tips";
import { K } from "./theme";
import type { Cue } from "./types";
import { Captions } from "./ui/Captions";
import { VO_LEAD, VO_WORDS, type VoKey, voLength } from "./vo";

type Shot = {
  readonly id: string;
  readonly Comp: React.FC;
  readonly dur: number;
  readonly vo: VoKey;
  readonly keywords: string[];
  readonly cues: Cue[];
};

export const CAFFEINE_SHOTS: Shot[] = [
  { id: "SH1 Hook", Comp: SH1Hook, dur: SH1_DURATION, vo: "hook", keywords: SH1_KEYWORDS, cues: SH1_CUES },
  { id: "SH2 Adenosine", Comp: SH2Adeno, dur: SH2_DURATION, vo: "adeno", keywords: SH2_KEYWORDS, cues: SH2_CUES },
  { id: "SH3 Caffeine", Comp: SH3Caff, dur: SH3_DURATION, vo: "caff", keywords: SH3_KEYWORDS, cues: SH3_CUES },
  { id: "SH4 Energy", Comp: SH4Energy, dur: SH4_DURATION, vo: "energy", keywords: SH4_KEYWORDS, cues: SH4_CUES },
  { id: "SH5 Time", Comp: SH5Time, dur: SH5_DURATION, vo: "time", keywords: SH5_KEYWORDS, cues: SH5_CUES },
  { id: "SH6 Crash", Comp: SH6Crash, dur: SH6_DURATION, vo: "crash", keywords: SH6_KEYWORDS, cues: SH6_CUES },
  { id: "SH7 Memory", Comp: SH7Memory, dur: SH7_DURATION, vo: "memory", keywords: SH7_KEYWORDS, cues: SH7_CUES },
  { id: "SH8 Tolerance", Comp: SH8Tolerance, dur: SH8_DURATION, vo: "tolerance", keywords: SH8_KEYWORDS, cues: SH8_CUES },
  { id: "SH9 Tips", Comp: SH9Tips, dur: SH9_DURATION, vo: "tips", keywords: SH9_KEYWORDS, cues: SH9_CUES },
];

export const CAFFEINE_DURATION = CAFFEINE_SHOTS.reduce((a, s) => a + s.dur, 0);

const shotFrames = (fps: number) => {
  let acc = 0;
  return CAFFEINE_SHOTS.map((s) => {
    const start = acc;
    const from = Math.round(acc * fps);
    acc += s.dur;
    return { ...s, start, from, frames: Math.round(acc * fps) - from };
  });
};

/** Zoom-blur entry over the first ~9 frames of every shot except the first. */
const Enter: React.FC<{ readonly children: React.ReactNode; readonly on: boolean }> = ({ children, on }) => {
  const frame = useCurrentFrame();
  if (!on) return <AbsoluteFill>{children}</AbsoluteFill>;
  const p = interpolate(frame, [0, 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <AbsoluteFill
      style={{
        scale: 1.07 - 0.07 * p,
        filter: p < 1 ? `blur(${(1 - p) * 16}px) brightness(${1 + (1 - p) * 0.35})` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const sfx = (name: string) => staticFile(`sfx/caffeine/${name}.wav`);

export const CaffeineFull: React.FC<{ readonly audioOnly?: boolean }> = ({ audioOnly = false }) => {
  const { fps } = useVideoConfig();
  const shots = shotFrames(fps);
  const voSpans = shots.map((s) => [s.start + VO_LEAD, s.start + VO_LEAD + voLength(s.vo)] as const);
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      {audioOnly
        ? null
        : shots.map((s, i) => (
            <Sequence key={s.id} name={s.id} from={s.from} durationInFrames={s.frames} premountFor={fps}>
              <Enter on={i > 0}>
                <s.Comp />
              </Enter>
            </Sequence>
          ))}
      {audioOnly ? null : <Finish />}

      {shots.map((s) => (
        <Sequence key={`vo-${s.id}`} name={`VO ${s.vo}`} from={s.from + Math.round(VO_LEAD * fps)} durationInFrames={s.frames} premountFor={fps}>
          <Audio src={staticFile(`vo/caffeine/${s.vo}.mp3`)} volume={MIX.vo} />
          {audioOnly ? null : <Captions words={VO_WORDS[s.vo]} keywords={s.keywords} />}
        </Sequence>
      ))}

      <Music voSpans={voSpans} total={CAFFEINE_DURATION} />

      {shots.flatMap((s) =>
        s.cues.map((c, k) => (
          <Sequence key={`cue-${s.id}-${k}`} name={`SFX ${c.sfx} (${s.id})`} from={s.from + Math.round(c.at * fps)} durationInFrames={Math.round(3 * fps)}>
            <Audio src={sfx(c.sfx)} volume={(c.volume ?? 1) * MIX.sfx} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
};

/** Sound only (VO, music, SFX), for rendering the audio track without loading any 3D. */
export const CaffeineAudio: React.FC = () => <CaffeineFull audioOnly />;
