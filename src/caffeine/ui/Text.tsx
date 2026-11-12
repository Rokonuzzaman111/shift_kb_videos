/**
 * OWNER: motion2d agent. Text system for every caffeine shot. All times are SHOT SECONDS (use wordAt()).
 *  - Title: big keyword title (spring pop + soft blur-in + accent underline sweep). Position it with `style`
 *    or a parent; it is a centred block.
 *  - Label: glass pill label with an accent dot (smaller), positioned by the caller.
 *  - Counter: animated number in Bangla digits (fixed-width digits so it doesn't jitter).
 *  - Check: checklist row; a green box fills and a tick draws in at `at`.
 *  - bn(n): latin digits → Bangla digits.
 * Everything is driven by the frame (spring/interpolate), no CSS animation.
 */
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { K, bodyFont, headFont } from "../theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

/** Dark halo that keeps light text readable on any background (works with Bangla conjuncts). */
export const LEGIBLE_SHADOW = "0 2px 0 rgba(10,6,4,0.55), 0 6px 18px rgba(0,0,0,0.65), 0 0 42px rgba(0,0,0,0.45)";

const useShotTime = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, t: frame / fps };
};

/** 0→1 entry spring starting at shot-second `at`. */
const useEnter = (at: number, damping = 13, stiffness = 170, mass = 0.7) => {
  const { frame, fps } = useShotTime();
  return spring({ frame: frame - Math.round(at * fps), fps, config: { damping, stiffness, mass } });
};

/** 0→1 exit progress over 0.25 s from `until`. */
const useExit = (until: number | undefined, len = 0.25) => {
  const { t } = useShotTime();
  if (until === undefined) return 0;
  return interpolate(t, [until, until + len], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
};

export const Title: React.FC<{
  readonly at: number;
  readonly until?: number;
  readonly children: React.ReactNode;
  readonly color?: string;
  readonly size?: number;
  readonly style?: React.CSSProperties;
  /** colour of the underline sweep (default amber). */
  readonly accent?: string;
  /** set false to hide the underline sweep */
  readonly underline?: boolean;
  /** soft coloured glow behind the letters */
  readonly glow?: boolean;
}> = ({ at, until, children, color = K.ink, size = 110, style, accent = K.amber, underline = true, glow = false }) => {
  const { t } = useShotTime();
  const s = useEnter(at);
  const out = useExit(until);
  // keep layout before/after (callers may stack elements), just invisible
  const hidden = t < at - 0.01 || out >= 1;
  const sweep = interpolate(t, [at + 0.1, at + 0.5], [0, 1], { ...clamp, easing: outExpo });
  const blur = (1 - Math.min(1, s)) * 10 + out * 6;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        textAlign: "center",
        opacity: hidden ? 0 : Math.min(1, s * 2) * (1 - out),
        scale: (0.72 + 0.28 * s) * (1 - out * 0.05),
        translate: `0px ${(1 - s) * 34 - out * 18}px`,
        filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
        ...style,
      }}
    >
      <span
        style={{
          position: "relative",
          display: "inline-block",
          fontFamily: headFont,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.32,
          letterSpacing: "-0.005em",
          color,
          padding: "0 0.12em 0.05em",
          WebkitTextStroke: `${Math.max(4, size * 0.06)}px rgba(12,7,5,0.72)`,
          paintOrder: "stroke fill",
          textShadow: glow ? `0 0 46px ${color}77, ${LEGIBLE_SHADOW}` : LEGIBLE_SHADOW,
        }}
      >
        {underline ? (
          <span
            style={{
              position: "absolute",
              left: "0.1em",
              right: "0.1em",
              bottom: "0.01em",
              height: Math.max(8, size * 0.1),
              borderRadius: 999,
              background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
              boxShadow: `0 0 24px ${accent}88`,
              transformOrigin: "left center",
              scale: `${sweep} 1`,
              opacity: sweep > 0 ? 1 : 0,
              zIndex: -1,
            }}
          />
        ) : null}
        <span style={{ position: "relative" }}>{children}</span>
      </span>
    </div>
  );
};

export const Label: React.FC<{
  readonly at: number;
  readonly until?: number;
  readonly children: React.ReactNode;
  readonly accent?: string;
  readonly size?: number;
  readonly style?: React.CSSProperties;
}> = ({ at, until, children, accent = K.amber, size = 48, style }) => {
  const { t } = useShotTime();
  const s = useEnter(at, 15, 190, 0.6);
  const out = useExit(until);
  // keep layout before/after (callers may stack elements), just invisible
  const hidden = t < at - 0.01 || out >= 1;
  const dot = interpolate(t, [at + 0.08, at + 0.35], [0, 1], { ...clamp, easing: outExpo });
  const ring = interpolate(t, [at + 0.1, at + 0.8], [0, 1], clamp);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.38,
        padding: `${size * 0.26}px ${size * 0.62}px ${size * 0.26}px ${size * 0.46}px`,
        borderRadius: 999,
        background: "linear-gradient(180deg, rgba(44,30,21,0.86), rgba(20,13,9,0.82))",
        border: `2px solid ${K.panelBorder}`,
        boxShadow: `inset 0 1.5px 0 rgba(255,240,220,0.14), 0 14px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.25)`,
        color: K.ink,
        fontFamily: bodyFont,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.4,
        whiteSpace: "nowrap",
        opacity: hidden ? 0 : Math.min(1, s * 2) * (1 - out),
        translate: `0px ${(1 - s) * 26 - out * 14}px`,
        scale: (0.86 + 0.14 * s) * (1 - out * 0.04),
        ...style,
      }}
    >
      <span style={{ position: "relative", width: size * 0.36, height: size * 0.36, flexShrink: 0 }}>
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 99,
            border: `2px solid ${accent}`,
            scale: 1 + ring * 1.4,
            opacity: (1 - ring) * 0.8,
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 99,
            background: accent,
            boxShadow: `0 0 ${size * 0.4}px ${accent}`,
            scale: dot,
          }}
        />
      </span>
      <span style={{ paddingBottom: size * 0.04 }}>{children}</span>
    </div>
  );
};

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const bn = (n: number | string) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

export const Counter: React.FC<{
  readonly from: number;
  readonly to: number;
  readonly a: number;
  readonly b: number;
  readonly suffix?: string;
  readonly color?: string;
  readonly size?: number;
  /** optional text before the number */
  readonly prefix?: string;
  readonly style?: React.CSSProperties;
}> = ({ from, to, a, b, suffix = "", color = K.ink, size = 120, prefix = "", style }) => {
  const { t } = useShotTime();
  const k = interpolate(t, [a, Math.max(a + 0.001, b)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const value = Math.round(from + (to - from) * k);
  // tiny bump each time the value changes, so counting feels alive
  const settle = interpolate(t, [b, b + 0.25], [1.08, 1], clamp);
  const counting = t >= a && t <= b;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily: headFont,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.25,
        color,
        WebkitTextStroke: `${Math.max(3, size * 0.05)}px rgba(12,7,5,0.7)`,
        paintOrder: "stroke fill",
        textShadow: LEGIBLE_SHADOW,
        scale: counting ? 1.04 : t > b ? settle : 1,
        ...style,
      }}
    >
      {prefix ? <span style={{ marginRight: "0.15em" }}>{prefix}</span> : null}
      {bn(value)
        .split("")
        .map((ch, i) => (
          <span key={i} style={{ display: "inline-block", width: "0.6em", textAlign: "center" }}>
            {ch}
          </span>
        ))}
      {suffix ? <span style={{ marginLeft: "0.22em", fontSize: "0.62em" }}>{suffix}</span> : null}
    </div>
  );
};

export const Check: React.FC<{
  readonly at: number;
  readonly children: React.ReactNode;
  readonly size?: number;
  /** when the (still unticked) row slides in; default: visible from the start */
  readonly showAt?: number;
  readonly color?: string;
  readonly style?: React.CSSProperties;
}> = ({ at, children, size = 56, showAt, color = K.green, style }) => {
  const { t, frame, fps } = useShotTime();
  const show = showAt === undefined ? 1 : spring({ frame: frame - Math.round(showAt * fps), fps, config: { damping: 16, mass: 0.6 } });
  const fill = spring({ frame: frame - Math.round(at * fps), fps, config: { damping: 11, stiffness: 200, mass: 0.6 } });
  const draw = interpolate(t, [at + 0.05, at + 0.32], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const done = t >= at;
  const box = size * 1.05;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: size * 0.4,
        fontFamily: bodyFont,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.4,
        color: done ? K.ink : "rgba(247,241,232,0.55)",
        textShadow: LEGIBLE_SHADOW,
        opacity: Math.min(1, show * 1.5),
        translate: `${(1 - show) * -40}px 0px`,
        ...style,
      }}
    >
      <svg width={box} height={box} viewBox="0 0 100 100" style={{ flexShrink: 0, overflow: "visible", scale: done ? 0.85 + 0.15 * fill : 1 }}>
        <circle cx={50} cy={50} r={44} fill="rgba(20,13,9,0.6)" stroke="rgba(247,241,232,0.45)" strokeWidth={6} />
        <circle cx={50} cy={50} r={44 * Math.min(1.05, fill)} fill={color} opacity={done ? 1 : 0} />
        <circle cx={50} cy={50} r={44 + 30 * draw} fill="none" stroke={color} strokeWidth={4} opacity={done ? (1 - draw) * 0.7 : 0} />
        <path
          d="M28 52 L44 67 L73 35"
          fill="none"
          stroke="#0d2a17"
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          opacity={done ? 1 : 0}
        />
      </svg>
      <span style={{ paddingBottom: size * 0.05 }}>{children}</span>
    </div>
  );
};
