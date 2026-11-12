/**
 * Full reel: every shot in script order. Each shot gets its VO (starting at VO_LEAD),
 * word-synced captions, a soft whoosh on the cut and impacts on key beats.
 */
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { VO_LEAD, VO_WORDS, type VoKey, wordAt } from "./kit/vo";
import { S01_DURATION, S01Hook } from "./shots/S01Hook";
import { S03_DURATION, S03Pellet } from "./shots/S03Pellet";
import { S05_DURATION, S05Reactor } from "./shots/S05Reactor";
import { S09_DURATION, S09Fission } from "./shots/S09Fission";
import { S10_DURATION, S10Chain } from "./shots/S10Chain";
import { S11_DURATION, S11Myth } from "./shots/S11Myth";
import { S12_DURATION, S12Control } from "./shots/S12Control";
import { S13_DURATION, S13Scram } from "./shots/S13Scram";
import { S14_DURATION, S14Loop } from "./shots/S14Loop";
import { S15_DURATION, S15Pressure } from "./shots/S15Pressure";
import { S16_DURATION, S16SteamGen } from "./shots/S16SteamGen";
import { S17_DURATION, S17Turbine } from "./shots/S17Turbine";
import { S18_DURATION, S18Generator } from "./shots/S18Generator";
import { S19_DURATION, S19Dynamo } from "./shots/S19Dynamo";
import { S20_DURATION, S20City } from "./shots/S20City";
import { S21_DURATION, S21Cooling } from "./shots/S21Cooling";
import { S22_DURATION, S22Condenser } from "./shots/S22Condenser";
import { S23_DURATION, S23Safety } from "./shots/S23Safety";
import { S24_DURATION, S24Catcher } from "./shots/S24Catcher";
import { S25_DURATION, S25Ending } from "./shots/S25Ending";
import { C } from "./theme";
import { Captions, Finish } from "./ui";

type Shot = {
  readonly id: string;
  readonly Comp: React.FC;
  readonly dur: number;
  readonly vo: VoKey;
  readonly keywords: string[];
  /** Impact hits, in shot seconds */
  readonly hits?: number[];
};

export const SHOTS: Shot[] = [
  { id: "S01 Hook", Comp: S01Hook, dur: S01_DURATION, vo: "hook", keywords: ["আগুন", "কয়লাও", "মেগাওয়াট"], hits: [0.3] },
  { id: "S03 Pellet", Comp: S03Pellet, dur: S03_DURATION, vo: "pellet", keywords: ["ইউরেনিয়াম", "এক", "টন", "কয়লার"], hits: [5.6] },
  { id: "S05 Reactor", Comp: S05Reactor, dur: S05_DURATION, vo: "reactor", keywords: ["লক্ষ", "দানবের", "তিনশো", "একশো"] },
  { id: "S09 Fission", Comp: S09Fission, dur: S09_DURATION, vo: "fission", keywords: ["ইউরেনিয়াম", "নিউট্রন", "ফেটে", "প্রচণ্ড", "তাপ"], hits: [wordAt("fission", "ফেটে")] },
  { id: "S10 Chain", Comp: S10Chain, dur: S10_DURATION, vo: "chain", keywords: ["কোটি", "চেইন", "হৃদপিণ্ড"], hits: [wordAt("chain", "হৃদপিণ্ড")] },
  { id: "S11 Myth", Comp: S11Myth, dur: S11_DURATION, vo: "myth", keywords: ["বোমা", "নব্বই", "পাঁচ", "সম্ভব"], hits: [wordAt("myth", "না")] },
  { id: "S12 Control", Comp: S12Control, dur: S12_DURATION, vo: "control", keywords: ["কন্ট্রোল", "নামালে", "তুললে"] },
  { id: "S13 Scram", Comp: S13Scram, dur: S13_DURATION, vo: "scram", keywords: ["সব", "শান্ত"], hits: [wordAt("scram", "পড়ে")] },
  { id: "S14 Loop", Comp: S14Loop, dur: S14_DURATION, vo: "loop", keywords: ["তিনশো", "ত্রিশ", "গরম"] },
  { id: "S15 Pressure", Comp: S15Pressure, dur: S15_DURATION, vo: "pressure", keywords: ["একশো", "ষাট", "ফুটতেই"] },
  { id: "S16 Steam generator", Comp: S16SteamGen, dur: S16_DURATION, vo: "sg", keywords: ["স্টিম", "মেশে", "বাষ্প"] },
  { id: "S17 Turbine", Comp: S17Turbine, dur: S17_DURATION, vo: "turbine", keywords: ["টারবাইনের", "তিন", "হাজার"] },
  { id: "S18 Generator", Comp: S18Generator, dur: S18_DURATION, vo: "generator", keywords: ["চুম্বক", "তামার", "বিদ্যুৎ"] },
  { id: "S19 Dynamo", Comp: S19Dynamo, dur: S19_DURATION, vo: "dynamo", keywords: ["ডায়নামো"] },
  { id: "S20 City", Comp: S20City, dur: S20_DURATION, vo: "city", keywords: ["লক্ষ", "ঘর"] },
  { id: "S21 Cooling", Comp: S21Cooling, dur: S21_DURATION, vo: "cooling", keywords: ["ধোঁয়া", "বাষ্প"] },
  { id: "S22 Condenser", Comp: S22Condenser, dur: S22_DURATION, vo: "condenser", keywords: ["ঠান্ডা", "তাপটা"] },
  { id: "S23 Safety", Comp: S23Safety, dur: S23_DURATION, vo: "safety", keywords: ["দুই", "খোলস", "প্রাকৃতিকভাবে"] },
  { id: "S24 Catcher", Comp: S24Catcher, dur: S24_DURATION, vo: "catcher", keywords: ["কোর", "ক্যাচার"] },
  { id: "S25 Ending", Comp: S25Ending, dur: S25_DURATION, vo: "ending", keywords: ["পরমাণু", "আলো", "ঘর"] },
];

export const FULL_DURATION = SHOTS.reduce((a, s) => a + s.dur, 0);

/** Start time (s) of each shot, plus frame-exact boundaries for a given fps. */
export const shotFrames = (fps: number) => {
  let acc = 0;
  return SHOTS.map((s) => {
    const from = Math.round(acc * fps);
    acc += s.dur;
    return { ...s, from, frames: Math.round(acc * fps) - from };
  });
};

export const FullVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const shots = shotFrames(fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {shots.map((s) => (
        <Sequence key={s.id} name={s.id} from={s.from} durationInFrames={s.frames} premountFor={fps}>
          <s.Comp />
        </Sequence>
      ))}
      <Finish />

      {shots.map((s) => (
        <Sequence key={`vo-${s.id}`} name={`VO ${s.vo}`} from={s.from + Math.round(VO_LEAD * fps)} durationInFrames={s.frames} premountFor={fps}>
          <Audio src={staticFile(`vo/${s.vo}.mp3`)} />
          <Captions words={VO_WORDS[s.vo]} keywords={s.keywords} />
        </Sequence>
      ))}

      <Audio src={staticFile("sfx/drone.wav")} volume={0.28} loop />
      {shots.slice(1).map((s) => (
        <Sequence key={`wh-${s.id}`} name={`Whoosh ${s.id}`} from={Math.max(0, s.from - Math.round(0.35 * fps))} durationInFrames={Math.round(1.2 * fps)}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.3} />
        </Sequence>
      ))}
      {shots.flatMap((s) =>
        (s.hits ?? []).map((h, k) => (
          <Sequence key={`hit-${s.id}-${k}`} name={`Hit ${s.id}`} from={s.from + Math.round(h * fps)} durationInFrames={Math.round(1.8 * fps)}>
            <Audio src={staticFile("sfx/thump.wav")} volume={0.85} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
};
