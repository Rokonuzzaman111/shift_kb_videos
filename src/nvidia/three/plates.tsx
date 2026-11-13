/**
 * Pre-rendered 3D B-roll plates (OWNER: lead). Rendered once to public/nvidia/plates/<id>.mp4 and used as
 * living backgrounds / cutaways everywhere (cheap to play back, keeps every frame full and moving).
 * Render: sh work/nvidia/render_plates.sh
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { N, clamp, ease } from "../theme";
import { DataCenter } from "./DataCenter";
import { GpuChipShot } from "./GpuChip";
import { GpuTrayShot } from "./GpuTray";
import { GraphicsCardShot } from "./GraphicsCard";
import { orbit } from "./Studio";

const useP = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return { frame, p: interpolate(frame, [0, durationInFrames - 1], [0, 1], clamp) };
};

const PlateDC: React.FC = () => {
  const { p } = useP();
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <DataCenter t={0.05 + p * 0.75} power={1} />
    </AbsoluteFill>
  );
};

const PlateChipMacro: React.FC = () => {
  const { p } = useP();
  const target = [0, 0.4, 0] as const;
  const a = -1.1 + p * 0.9;
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <GpuChipShot
        glow={1}
        camera={{ pos: orbit(target, 9.5 - p * 2, 2.6 - p * 0.6, a), target, mm: 85, focus: 9 - p * 2, range: 1.6 }}
      />
    </AbsoluteFill>
  );
};

const PlateChipExplode: React.FC = () => {
  const { frame, p } = useP();
  const explode = interpolate(frame, [30, 150], [0, 1], { ...clamp, easing: ease.inOut });
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <GpuChipShot t={0.2 + p * 0.6} explode={explode} glow={interpolate(frame, [0, 40], [0.3, 1], clamp)} />
    </AbsoluteFill>
  );
};

const PlateTray: React.FC = () => {
  const { frame, p } = useP();
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <GpuTrayShot t={p} slide={interpolate(frame, [0, 120], [0.2, 1], { ...clamp, easing: ease.out })} glow={1} />
    </AbsoluteFill>
  );
};

const PlateCard: React.FC = () => {
  const { p } = useP();
  return (
    <AbsoluteFill style={{ background: N.bg }}>
      <GraphicsCardShot t={p} fanSpeed={2.2} />
    </AbsoluteFill>
  );
};

export const PLATES: { id: string; Comp: React.FC; dur: number }[] = [
  { id: "Plate-dc", Comp: PlateDC, dur: 8 },
  { id: "Plate-chipmacro", Comp: PlateChipMacro, dur: 8 },
  { id: "Plate-chipexplode", Comp: PlateChipExplode, dur: 8 },
  { id: "Plate-tray", Comp: PlateTray, dur: 8 },
  { id: "Plate-card", Comp: PlateCard, dur: 8 },
];
