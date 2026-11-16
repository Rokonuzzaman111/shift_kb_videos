/** Remotion entry for Svalbard v2 (low-RAM: bundles only the v2 parts). */
import { AbsoluteFill, Composition, Sequence, registerRoot } from "remotion";
import { FPS, H, W } from "./svalbard/theme";
import { Captions } from "./svalbard/ui/Captions";
import { Grade } from "./svalbard/ui/Grade";
import { VO } from "./svalbard/vo";
import { CAPTION_V2 } from "./svalbard/v2/palette";
import { S1A } from "./svalbard/v2/p1/S1A";
import { S1B } from "./svalbard/v2/p1/S1B";
import { S1C } from "./svalbard/v2/p1/S1C";
import { SvalbardV2Part1, V2_P1_DURATION, V2_P1_KEYWORDS, V2_S1A_END, V2_S1B_END } from "./svalbard/v2/p1/Part1";
import { S2A } from "./svalbard/v2/p2/S2A";
import { S2B } from "./svalbard/v2/p2/S2B";
import { SvalbardV2Part2, V2_P2_DURATION, V2_P2_KEYWORDS, V2_S2A_END, V2_S2B_FROM } from "./svalbard/v2/p2/Part2";
import { S3A } from "./svalbard/v2/p3/S3A";
import { S3B } from "./svalbard/v2/p3/S3B";
import { SvalbardV2Part3, V2_P3_DURATION, V2_P3_KEYWORDS, V2_S3A_END, V2_S3B_FROM } from "./svalbard/v2/p3/Part3";
import { S4A } from "./svalbard/v2/p4/S4A";
import { S4B } from "./svalbard/v2/p4/S4B";
import { SvalbardV2Part4, V2_P4_DURATION, V2_P4_KEYWORDS, V2_S4A_END, V2_S4B_FROM } from "./svalbard/v2/p4/Part4";
import { S5A } from "./svalbard/v2/p5/S5A";
import { S5B } from "./svalbard/v2/p5/S5B";
import { SvalbardV2Part5, V2_P5_DURATION, V2_P5_KEYWORDS, V2_S5A_END, V2_S5B_FROM } from "./svalbard/v2/p5/Part5";

/** Section 5A–5D alone (Part 5 starts at 0). */
const S5APreview: React.FC = () => (
  <AbsoluteFill>
    <S5A a={0} />
    <Grade />
    <Captions words={VO.p5} keywords={V2_P5_KEYWORDS} colors={CAPTION_V2} />
  </AbsoluteFill>
);

/** Section 5E–5G alone (frames counted from the S5A→S5B cut). */
const S5B_F = Math.round(V2_S5B_FROM * FPS);
const S5BPreview: React.FC = () => (
  <AbsoluteFill>
    <S5B a={S5B_F / FPS} />
    <Grade />
    <Sequence from={-S5B_F} layout="none">
      <Captions words={VO.p5} keywords={V2_P5_KEYWORDS} colors={CAPTION_V2} />
    </Sequence>
  </AbsoluteFill>
);

/** Section 4A–4C alone (Part 4 starts at 0). */
const S4APreview: React.FC = () => (
  <AbsoluteFill>
    <S4A a={0} />
    <Grade />
    <Captions words={VO.p4} keywords={V2_P4_KEYWORDS} colors={CAPTION_V2} />
  </AbsoluteFill>
);

/** Section 4D–4F alone (frames counted from the S4A→S4B cut). */
const S4B_F = Math.round(V2_S4B_FROM * FPS);
const S4BPreview: React.FC = () => (
  <AbsoluteFill>
    <S4B a={S4B_F / FPS} />
    <Grade />
    <Sequence from={-S4B_F} layout="none">
      <Captions words={VO.p4} keywords={V2_P4_KEYWORDS} colors={CAPTION_V2} />
    </Sequence>
  </AbsoluteFill>
);

/** Section 3A–3D alone (Part 3 starts at 0). */
const S3APreview: React.FC = () => (
  <AbsoluteFill>
    <S3A a={0} />
    <Grade />
    <Captions words={VO.p3} keywords={V2_P3_KEYWORDS} colors={CAPTION_V2} />
  </AbsoluteFill>
);

/** Section 3E–3G alone (frames counted from the S3A→S3B cut). */
const S3B_F = Math.round(V2_S3B_FROM * FPS);
const S3BPreview: React.FC = () => (
  <AbsoluteFill>
    <S3B a={S3B_F / FPS} />
    <Grade />
    <Sequence from={-S3B_F} layout="none">
      <Captions words={VO.p3} keywords={V2_P3_KEYWORDS} colors={CAPTION_V2} />
    </Sequence>
  </AbsoluteFill>
);

/** Section 2A–2D alone (Part 2 starts at 0): shot + grade + captions, no audio. */
const S2APreview: React.FC = () => (
  <AbsoluteFill>
    <S2A a={0} />
    <Grade />
    <Captions words={VO.p2} keywords={V2_P2_KEYWORDS} colors={CAPTION_V2} />
  </AbsoluteFill>
);

/** Section 2E–2I alone (frames counted from the S2A→S2B cut); captions offset to part time. */
const S2B_F = Math.round(V2_S2B_FROM * FPS);
const S2BPreview: React.FC = () => (
  <AbsoluteFill>
    <S2B a={S2B_F / FPS} />
    <Grade />
    <Sequence from={-S2B_F} layout="none">
      <Captions words={VO.p2} keywords={V2_P2_KEYWORDS} colors={CAPTION_V2} />
    </Sequence>
  </AbsoluteFill>
);

/** Section 1A alone (for quick QA stills): shot + grade + captions, no audio. */
const S1APreview: React.FC = () => (
  <AbsoluteFill>
    <S1A a={0} />
    <Grade />
    <Captions words={VO.p1} keywords={V2_P1_KEYWORDS} colors={CAPTION_V2} />
  </AbsoluteFill>
);

/** Section 1B alone (frames counted from the 1A→1B cut); captions offset to part time. */
const S1B_FROM = Math.round(V2_S1A_END * FPS);
const S1BPreview: React.FC = () => (
  <AbsoluteFill>
    <S1B a={S1B_FROM / FPS} />
    <Grade />
    <Sequence from={-S1B_FROM} layout="none">
      <Captions words={VO.p1} keywords={V2_P1_KEYWORDS} colors={CAPTION_V2} />
    </Sequence>
  </AbsoluteFill>
);

/** Section 1C alone (frames counted from the 1B→1C cut); captions offset to part time. */
const S1C_FROM = Math.round(V2_S1B_END * FPS);
const S1CPreview: React.FC = () => (
  <AbsoluteFill>
    <S1C a={S1C_FROM / FPS} />
    <Grade />
    <Sequence from={-S1C_FROM} layout="none">
      <Captions words={VO.p1} keywords={V2_P1_KEYWORDS} colors={CAPTION_V2} />
    </Sequence>
  </AbsoluteFill>
);

registerRoot(() => (
  <>
    <Composition id="SvalbardV2Part1" component={SvalbardV2Part1} durationInFrames={Math.round(V2_P1_DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V2-S1A" component={S1APreview} durationInFrames={Math.round(V2_S1A_END * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V2-S1B" component={S1BPreview} durationInFrames={Math.round(V2_S1B_END * FPS) - S1B_FROM} fps={FPS} width={W} height={H} />
    <Composition id="V2-S1C" component={S1CPreview} durationInFrames={Math.round(V2_P1_DURATION * FPS) - S1C_FROM} fps={FPS} width={W} height={H} />
    <Composition id="SvalbardV2Part2" component={SvalbardV2Part2} durationInFrames={Math.round(V2_P2_DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V2-S2A" component={S2APreview} durationInFrames={Math.round(V2_S2A_END * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V2-S2B" component={S2BPreview} durationInFrames={Math.round(V2_P2_DURATION * FPS) - S2B_F} fps={FPS} width={W} height={H} />
    <Composition id="SvalbardV2Part3" component={SvalbardV2Part3} durationInFrames={Math.round(V2_P3_DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V2-S3A" component={S3APreview} durationInFrames={Math.round(V2_S3A_END * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V2-S3B" component={S3BPreview} durationInFrames={Math.round(V2_P3_DURATION * FPS) - S3B_F} fps={FPS} width={W} height={H} />
    <Composition id="SvalbardV2Part4" component={SvalbardV2Part4} durationInFrames={Math.round(V2_P4_DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V2-S4A" component={S4APreview} durationInFrames={Math.round(V2_S4A_END * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V2-S4B" component={S4BPreview} durationInFrames={Math.round(V2_P4_DURATION * FPS) - S4B_F} fps={FPS} width={W} height={H} />
    <Composition id="SvalbardV2Part5" component={SvalbardV2Part5} durationInFrames={Math.round(V2_P5_DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V2-S5A" component={S5APreview} durationInFrames={Math.round(V2_S5A_END * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="V2-S5B" component={S5BPreview} durationInFrames={Math.round(V2_P5_DURATION * FPS) - S5B_F} fps={FPS} width={W} height={H} />
  </>
));
