/**
 * 3D-pinned label (bible §4): teal anchor ring at the projected point, thin teal leader line,
 * glass panel with the name (AnekBangla) and an optional amber number line. Springs in on its word, fades out.
 * Max 2 on screen at once — the section decides.
 */
import { interpolate, spring, useVideoConfig } from "remotion";
import { headFont } from "../../theme";
import { P, pa } from "../palette";

export const PinLabel: React.FC<{
  readonly x: number;
  readonly y: number;
  /** current section time (s) and the times the label enters / leaves */
  readonly t: number;
  readonly inAt: number;
  readonly outAt?: number;
  readonly text: string;
  /** amber number line under the name */
  readonly sub?: string;
  readonly side?: "left" | "right";
  /** leader rise (px) */
  readonly rise?: number;
  readonly reach?: number;
}> = ({ x, y, t, inAt, outAt = 1e9, text, sub, side = "right", rise = 120, reach = 70 }) => {
  const { fps } = useVideoConfig();
  if (t < inAt - 0.05) return null;
  const pop = spring({ frame: Math.round((t - inAt) * fps), fps, config: { damping: 13, stiffness: 170, mass: 0.7 } });
  const line = interpolate(t, [inAt, inAt + 0.28], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = interpolate(t, [outAt, outAt + 0.2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (out <= 0) return null;
  const dir = side === "right" ? 1 : -1;
  const ex = x + dir * reach;
  const ey = y - rise;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out, pointerEvents: "none" }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={x} cy={y} r={7 * pop} fill={P.vaultTeal} />
        <circle cx={x} cy={y} r={7 + 16 * pop} fill="none" stroke={pa(P.vaultTeal, 0.55 * (1.2 - pop * 0.4))} strokeWidth={2.5} />
        <polyline
          points={`${x},${y} ${x + (ex - x) * Math.min(1, line * 2)},${y + (ey - y) * Math.min(1, line * 2)} ${ex + dir * 40 * Math.max(0, line * 2 - 1)},${ey}`}
          fill="none"
          stroke={P.vaultTeal}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: side === "right" ? ex + 40 : undefined,
          right: side === "left" ? 1080 - (ex - 40) : undefined,
          top: ey,
          translate: `0 -50%`,
          transformOrigin: side === "right" ? "left center" : "right center",
          scale: `${0.6 + 0.4 * pop}`,
          opacity: Math.min(1, pop * 1.4),
          padding: sub ? "14px 26px 16px" : "12px 26px",
          borderRadius: 16,
          background: pa(P.night, 0.62),
          border: `2px solid ${pa(P.vaultTeal, 0.75)}`,
          boxShadow: `0 10px 30px ${pa(P.night, 0.6)}`,
          backdropFilter: "blur(10px)",
          whiteSpace: "nowrap",
          textAlign: side === "right" ? "left" : "right",
        }}
      >
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 52, lineHeight: 1.25, color: P.snow }}>{text}</div>
        {sub ? <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 46, lineHeight: 1.2, color: P.amber }}>{sub}</div> : null}
      </div>
    </div>
  );
};

/** Dashed teal arc through projected screen points, drawn on with progress k (0..1). */
export const DashedArc: React.FC<{ readonly pts: { x: number; y: number }[]; readonly k: number }> = ({ pts, k }) => {
  if (k <= 0 || pts.length < 2) return null;
  const n = Math.max(2, Math.round(pts.length * k));
  const d = pts
    .slice(0, n)
    .map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  return (
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <path d={d} fill="none" stroke={pa(P.night, 0.5)} strokeWidth={9} strokeLinecap="round" strokeDasharray="16 14" />
      <path d={d} fill="none" stroke={P.vaultTeal} strokeWidth={4.5} strokeLinecap="round" strokeDasharray="16 14" />
    </svg>
  );
};
