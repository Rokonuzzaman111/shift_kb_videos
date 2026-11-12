/**
 * Hero preview: S01/S02 hook → S03/S04 pellet & coal → S09 fission, with final-script VO,
 * word-synced captions and sound design. Hard cuts on VO beats with a short light dip.
 */
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import hookWords from "../public/vo/hook.json";
import pelletWords from "../public/vo/pellet.json";
import fissionWords from "../public/vo/fission.json";
import { S01_DURATION, S01Hook } from "./shots/S01Hook";
import { S03_DURATION, S03Pellet } from "./shots/S03Pellet";
import { S09_DURATION, S09Fission } from "./shots/S09Fission";
import { C } from "./theme";
import { Captions, Finish } from "./ui";

export const HERO_DURATION = S01_DURATION + S03_DURATION + S09_DURATION;

const Dip: React.FC<{ at: number; color: string }> = ({ at, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = interpolate(frame, [at - 0.12 * fps, at, at + 0.3 * fps], [0, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return o > 0 ? <AbsoluteFill style={{ background: color, opacity: o }} /> : null;
};

export const HeroPreview: React.FC = () => {
  const { fps } = useVideoConfig();
  const s = (sec: number) => Math.round(sec * fps);
  const A = 0;
  const B = S01_DURATION;
  const Cc = S01_DURATION + S03_DURATION;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence name="S01-S02 Hook" from={s(A)} durationInFrames={s(S01_DURATION)} premountFor={fps}>
        <S01Hook />
      </Sequence>
      <Sequence name="S03-S04 Pellet" from={s(B)} durationInFrames={s(S03_DURATION)} premountFor={fps}>
        <S03Pellet />
      </Sequence>
      <Sequence name="S09 Fission" from={s(Cc)} durationInFrames={s(S09_DURATION)} premountFor={fps}>
        <S09Fission />
      </Sequence>

      <Dip at={s(B)} color="#f4ece2" />
      <Dip at={s(Cc)} color="#000000" />
      <Finish />

      {/* Voiceover + captions */}
      <Sequence name="VO hook" from={s(A + 0.25)} premountFor={fps}>
        <Audio src={staticFile("vo/hook.mp3")} />
        <Captions words={hookWords} keywords={["আগুন", "কয়লাও", "মেগাওয়াট"]} />
      </Sequence>
      <Sequence name="VO pellet" from={s(B + 0.3)} premountFor={fps}>
        <Audio src={staticFile("vo/pellet.mp3")} />
        <Captions words={pelletWords} keywords={["ইউরেনিয়াম", "এক", "টন", "কয়লার"]} />
      </Sequence>
      <Sequence name="VO fission" from={s(Cc + 0.4)} premountFor={fps}>
        <Audio src={staticFile("vo/fission.mp3")} />
        <Captions words={fissionWords} keywords={["ইউরেনিয়াম", "নিউট্রন", "ফেটে", "প্রচণ্ড", "তাপ"]} />
      </Sequence>

      {/* Sound design */}
      <Audio src={staticFile("sfx/drone.wav")} volume={0.3} loop />
      <Sequence name="Title hit" from={s(A + 0.3)} premountFor={fps}>
        <Audio src={staticFile("sfx/thump.wav")} volume={0.6} />
      </Sequence>
      <Sequence name="Whoosh to pellet" from={s(B - 0.4)} premountFor={fps}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.45} />
      </Sequence>
      <Sequence name="Coal lands" from={s(B + 5.3)} premountFor={fps}>
        <Audio src={staticFile("sfx/thump.wav")} volume={0.75} />
      </Sequence>
      <Sequence name="Whoosh to atom" from={s(Cc - 0.4)} premountFor={fps}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.45} />
      </Sequence>
      <Sequence name="Fission boom" from={s(Cc + 9.05)} premountFor={fps}>
        <Audio src={staticFile("sfx/thump.wav")} volume={1} />
      </Sequence>
    </AbsoluteFill>
  );
};
