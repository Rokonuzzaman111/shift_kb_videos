/**
 * POV drowsy eyelids: dark upper and lower lids with soft curved edges that close over the frame.
 * k = 0 fully open … 1 fully closed. Pair with a blur/desaturate filter on the scene underneath.
 */
import { AbsoluteFill } from "remotion";

export const Eyelids: React.FC<{ readonly k: number }> = ({ k }) => {
  if (k <= 0.001) return null;
  const W = 1080;
  const H = 1920;
  const reach = (H / 2 + 120) * Math.min(1, k); // how far each lid travels
  const top = reach - 120;
  const bot = H - reach + 120;
  const sag = 260 * (1 - k * 0.6); // curve depth of the lid edge
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <filter id="lidSoft" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={38} />
          </filter>
        </defs>
        <g filter="url(#lidSoft)">
          <path d={`M -100 -200 L ${W + 100} -200 L ${W + 100} ${top - sag} Q ${W / 2} ${top + sag} -100 ${top - sag} Z`} fill="#050302" />
          <path d={`M -100 ${H + 200} L ${W + 100} ${H + 200} L ${W + 100} ${bot + sag * 0.6} Q ${W / 2} ${bot - sag * 0.6} -100 ${bot + sag * 0.6} Z`} fill="#050302" />
        </g>
      </svg>
      {/* overall heaviness */}
      <AbsoluteFill style={{ background: "#000", opacity: k * 0.25 }} />
    </AbsoluteFill>
  );
};
