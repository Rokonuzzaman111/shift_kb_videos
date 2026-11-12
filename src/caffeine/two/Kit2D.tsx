/**
 * OWNER: motion2d agent. Small helpers for 2D shots: 2.5D camera, warm backdrop, dust motes.
 */
import { AbsoluteFill } from "remotion";
import { K } from "../theme";

/** 2.5D camera: scale + translate around a focus point, with tiny handheld drift (≤0.4% frame). */
export const Cam: React.FC<{
  readonly t: number;
  readonly scale: number;
  readonly x?: number;
  readonly y?: number;
  /** focus point (px) the zoom is centred on */
  readonly fx?: number;
  readonly fy?: number;
  readonly drift?: number;
  readonly children: React.ReactNode;
}> = ({ t, scale, x = 0, y = 0, fx = 540, fy = 860, drift = 1, children }) => {
  const dx = (Math.sin(t * 0.9) + Math.sin(t * 2.1) * 0.4) * 3 * drift;
  const dy = (Math.sin(t * 1.3 + 1) + Math.sin(t * 1.7) * 0.4) * 3 * drift;
  return (
    <AbsoluteFill style={{ transformOrigin: `${fx}px ${fy}px`, transform: `translate(${x + dx}px, ${y + dy}px) scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
};

/** Warm dark study-room backdrop with a soft light pool behind the hero. */
export const WarmBg: React.FC<{ readonly glow?: string; readonly cy?: number; readonly base?: string; readonly base2?: string }> = ({
  glow = "rgba(255,181,71,0.16)",
  cy = 860,
  base = K.bg,
  base2 = K.bg2,
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 70% 42% at 50% ${(cy / 1920) * 100}%, ${glow} 0%, rgba(0,0,0,0) 70%), linear-gradient(180deg, ${base2} 0%, ${base} 100%)`,
    }}
  />
);

/** Slow floating dust/bokeh particles for depth (parallax layer). */
export const Motes: React.FC<{ readonly t: number; readonly color?: string; readonly n?: number; readonly seed?: number }> = ({
  t,
  color = "255,214,160",
  n = 22,
  seed = 1,
}) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {Array.from({ length: n }).map((_, i) => {
      const h = (k: number) => {
        const x = Math.sin((i + 1) * 91.7 * k + seed * 13.3) * 43758.5;
        return x - Math.floor(x);
      };
      const size = 4 + h(1) * 14;
      const x = h(2) * 1080 + Math.sin(t * 0.3 + i) * 20;
      const y = ((h(3) * 1500 + 200 - t * (8 + h(4) * 14)) % 1500 + 1500) % 1500 + 150;
      const o = 0.08 + h(5) * 0.22;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: 99,
            background: `rgba(${color},${o})`,
            filter: size > 12 ? "blur(3px)" : "blur(1px)",
          }}
        />
      );
    })}
  </AbsoluteFill>
);
