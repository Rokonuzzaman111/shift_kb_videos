/** Final cold film grade: top/bottom shade for text legibility, soft vignette, moving film grain. */
import { AbsoluteFill, useCurrentFrame } from "remotion";

export const Grade: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(2,8,16,0.35), transparent 24%, transparent 60%, rgba(2,8,16,0.55) 85%, rgba(2,8,16,0.7))" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 80% 60% at center, transparent 55%, rgba(0,0,0,0.5) 100%)" }} />
      <AbsoluteFill
        style={{
          opacity: 0.08,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundPosition: `${(frame * 71) % 256}px ${(frame * 37) % 256}px`,
        }}
      />
    </AbsoluteFill>
  );
};
