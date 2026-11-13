/** 3D agent: register standalone test compositions for each 3D asset here (rendered as stills for QA). */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, ease, N } from "../theme";
import { DataCenter } from "./DataCenter";
import { GpuChipShot } from "./GpuChip";
import { GpuTrayShot } from "./GpuTray";
import { GraphicsCardShot } from "./GraphicsCard";

const useT = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return { frame, t: frame / Math.max(1, durationInFrames - 1) };
};

const ChipLab: React.FC = () => {
  const { frame } = useT();
  const t = interpolate(frame, [0, 179], [0, 1], { ...clamp, easing: ease.inOut });
  const explode = interpolate(frame, [70, 130], [0, 1], { ...clamp, easing: ease.inOut });
  const glow = interpolate(frame, [20, 60], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <GpuChipShot t={t} explode={explode} glow={glow} />
    </AbsoluteFill>
  );
};

const ChipLidLab: React.FC = () => {
  const { t } = useT();
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <GpuChipShot t={t} lid={1} spin={-0.05 + t * 0.1} />
    </AbsoluteFill>
  );
};

const CardLab: React.FC = () => {
  const { frame, t } = useT();
  const assemble = interpolate(frame, [0, 60], [0.35, 1], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <GraphicsCardShot t={interpolate(t, [0, 1], [0, 1], { easing: ease.inOut })} assemble={assemble} fanSpeed={interpolate(frame, [40, 150], [0, 1.2], clamp)} />
    </AbsoluteFill>
  );
};

const DataCenterPlainLab: React.FC = () => {
  const { frame, t } = useT();
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <DataCenter t={t} power={interpolate(frame, [0, 90], [0, 1], clamp)} reflect={false} />
    </AbsoluteFill>
  );
};

const DataCenterLab: React.FC = () => {
  const { frame, t } = useT();
  const power = interpolate(frame, [0, 90], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <DataCenter t={interpolate(t, [0, 1], [0, 1], { easing: ease.inOut })} power={power} />
    </AbsoluteFill>
  );
};

const TrayLab: React.FC = () => {
  const { frame, t } = useT();
  const plates = interpolate(frame, [10, 50], [0, 1], { ...clamp, easing: ease.inOut });
  const slide = interpolate(frame, [70, 170], [0, 0.75], { ...clamp, easing: ease.inOut });
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <GpuTrayShot t={t} slide={slide} plates={plates} glow={1} />
    </AbsoluteFill>
  );
};

export const THREE_LAB: { id: string; Comp: React.FC; dur: number }[] = [
  { id: "GpuChip", Comp: ChipLab, dur: 6 },
  { id: "GpuChipLid", Comp: ChipLidLab, dur: 4 },
  { id: "GraphicsCard", Comp: CardLab, dur: 6 },
  { id: "DataCenter", Comp: DataCenterLab, dur: 6 },
  { id: "GpuTray", Comp: TrayLab, dur: 6 },
  { id: "DataCenterPlain", Comp: DataCenterPlainLab, dur: 6 },
];
