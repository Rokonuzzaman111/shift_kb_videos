/** Shared motion helpers for Nvidia scenes. */
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { N, clamp, ease } from "../theme";

/** Film grain + vignette on top of everything. */
export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)" }} />
      <AbsoluteFill
        style={{
          opacity: 0.07,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundPosition: `${(frame * 37) % 220}px ${(frame * 53) % 220}px`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Deterministic camera shake that decays after `at` (frames). */
export const shake = (frame: number, at: number, amp = 18, len = 14) => {
  const t = frame - at;
  if (t < 0 || t > len) return { x: 0, y: 0 };
  const k = (1 - t / len) ** 2 * amp;
  return { x: (random(`sx${at}-${t}`) - 0.5) * 2 * k, y: (random(`sy${at}-${t}`) - 0.5) * 2 * k };
};

/** 0→1 over [a, a+len] frames with ease-out. */
export const ramp = (frame: number, a: number, len = 12, e = ease.out) => interpolate(frame, [a, a + len], [0, 1], { ...clamp, easing: e });

/** A photo with Ken-Burns push and optional grade. */
export const Photo: React.FC<{
  readonly src: string;
  readonly from?: number;
  readonly dur: number;
  readonly zoom?: [number, number];
  readonly pan?: [number, number, number, number];
  readonly gray?: number;
  readonly style?: React.CSSProperties;
  readonly pos?: string;
}> = ({ src, from = 0, dur, zoom = [1.05, 1.18], pan = [0, 0, 0, 0], gray = 0, style, pos = "center" }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, from + dur], [0, 1], { ...clamp, easing: ease.inOut });
  const s = zoom[0] + (zoom[1] - zoom[0]) * p;
  const x = pan[0] + (pan[2] - pan[0]) * p;
  const y = pan[1] + (pan[3] - pan[1]) * p;
  return (
    <AbsoluteFill style={{ overflow: "hidden", ...style }}>
      <Img
        src={staticFile(src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: pos,
          scale: `${s}`,
          translate: `${x}px ${y}px`,
          filter: `grayscale(${gray}) contrast(1.08) saturate(1.05)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Moving grid floor / tech backdrop. */
export const TechBg: React.FC<{ readonly tint?: string; readonly speed?: number }> = ({ tint = N.green, speed = 1 }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #10170a 0%, ${N.bg} 70%)` }}>
      <AbsoluteFill
        style={{
          opacity: 0.22,
          backgroundImage: `linear-gradient(${tint}33 1px, transparent 1px), linear-gradient(90deg, ${tint}33 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          backgroundPosition: `0px ${(frame * 0.8 * speed) % 80}px`,
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
};
