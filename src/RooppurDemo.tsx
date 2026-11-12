import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import s1 from "../public/vo/s1.json";
import s2 from "../public/vo/s2.json";
import s3 from "../public/vo/s3.json";
import { FissionScene, SPLIT } from "./scenes/FissionScene";
import { PelletScene } from "./scenes/PelletScene";
import { PlantScene } from "./scenes/PlantScene";
import { C } from "./theme";
import { Captions, Finish } from "./ui";

// Scene lengths (frames @30fps). Each fade overlaps 8 frames.
const XF = 8;
const S1 = 200;
const S2 = 200;
const S3 = 216;
const S2_START = S1 - XF;
const S3_START = S1 + S2 - 2 * XF;

export const DEMO_DURATION = S1 + S2 + S3 - 2 * XF;

export const RooppurDemo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Pellet vs coal" durationInFrames={S1} premountFor={fps}>
          <PelletScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: XF })} />
        <TransitionSeries.Sequence name="Rooppur plant" durationInFrames={S2} premountFor={fps}>
          <PlantScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: XF })} />
        <TransitionSeries.Sequence name="Fission" durationInFrames={S3} premountFor={fps}>
          <FissionScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Finish />

      {/* Voiceover + synced captions */}
      <Sequence name="VO 1" from={8} premountFor={fps}>
        <Audio src={staticFile("vo/s1.mp3")} />
        <Captions words={s1} keywords={["এক", "টন", "কয়লার"]} />
      </Sequence>
      <Sequence name="VO 2" from={S2_START + 10} premountFor={fps}>
        <Audio src={staticFile("vo/s2.mp3")} />
        <Captions words={s2} keywords={["লক্ষ", "দানবকে"]} />
      </Sequence>
      <Sequence name="VO 3" from={S3_START + 12} premountFor={fps}>
        <Audio src={staticFile("vo/s3.mp3")} />
        <Captions words={s3} keywords={["আগুন", "পরমাণুর"]} />
      </Sequence>

      {/* Sound design */}
      <Audio src={staticFile("sfx/drone.wav")} volume={0.35} />
      <Sequence name="Coal impact" from={92} premountFor={fps}>
        <Audio src={staticFile("sfx/thump.wav")} volume={0.8} />
      </Sequence>
      <Sequence name="Whoosh 1" from={S2_START - 14} premountFor={fps}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} />
      </Sequence>
      <Sequence name="Whoosh 2" from={S3_START - 14} premountFor={fps}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} />
      </Sequence>
      <Sequence name="Fission hit" from={S3_START + SPLIT} premountFor={fps}>
        <Audio src={staticFile("sfx/thump.wav")} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
