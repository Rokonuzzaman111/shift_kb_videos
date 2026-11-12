/**
 * Small 2D graphics used over the science3d shots (no text, or a single keyword).
 */
import { AbsoluteFill } from "remotion";
import { useSeconds } from "../../../kit/time";
import { ease, prog } from "../../../kit/time";
import { K, bodyFont } from "../../theme";

const fadeIO = (t: number, a: number, b: number, f = 0.3) => prog(t, a, a + f, ease.out) * (1 - prog(t, b - f, b));

/**
 * Day → night "sky window" (title zone): realistic sky gradient, soft clouds, a glowing sun that sets
 * with a warm horizon, then a cratered moon rising with stars, over a Dhaka-like skyline whose
 * windows light up at night. Same props as before: shown a..b, time runs from..to.
 */
export const SunMoonArc: React.FC<{ readonly a: number; readonly b: number; readonly from: number; readonly to: number }> = ({ a, b, from, to }) => {
  const t = useSeconds();
  const o = fadeIO(t, a, b);
  if (o <= 0) return null;
  const k = prog(t, from, to, ease.inOut); // 0 = morning, 1 = night
  const W = 760;
  const H = 300;
  const HZ = H - 70; // horizon y
  const id = "skyw";

  // sky colours through the day
  const stops: [number, string, string][] = [
    [0, "#5aa2e6", "#cfe8fb"],
    [0.35, "#3f86d6", "#bfe0f7"],
    [0.55, "#3c5f9e", "#f6b27a"],
    [0.68, "#2a2f63", "#e46a3c"],
    [0.82, "#121a40", "#4a2e5c"],
    [1, "#060b22", "#17224a"],
  ];
  const sky = (j: 1 | 2) => {
    let i = 0;
    while (i < stops.length - 2 && k > stops[i + 1][0]) i++;
    const [k0, ...c0] = stops[i];
    const [k1, ...c1] = stops[i + 1];
    const u = Math.min(1, Math.max(0, (k - k0) / (k1 - k0)));
    return mixHex(c0[j - 1], c1[j - 1], u);
  };

  // sun path: rises left-high, sets below horizon around k≈0.7
  const sk = Math.min(1, k / 0.72);
  const sx = 120 + sk * 470;
  const sy = HZ - Math.sin(Math.PI * (0.35 + sk * 0.65)) * 175 + (sk > 0.92 ? (sk - 0.92) * 400 : 0);
  const sunWarm = Math.min(1, Math.max(0, (sk - 0.55) / 0.4));
  const sunCore = mixHex("#fffbe8", "#ffb35c", sunWarm);
  const sunHalo = mixHex("#fff1b8", "#ff6a2b", sunWarm);
  // moon rises from the right after sunset
  const mk = Math.min(1, Math.max(0, (k - 0.62) / 0.38));
  const mx = 610 - mk * 60;
  const my = HZ + 30 - mk * 175;
  const night = Math.min(1, Math.max(0, (k - 0.7) / 0.25));
  const dusk = Math.exp(-(((k - 0.66) / 0.12) ** 2));

  const stars = Array.from({ length: 34 }, (_, i) => ({
    x: (Math.sin(i * 91.7) * 0.5 + 0.5) * W,
    y: (Math.sin(i * 37.3 + 2) * 0.5 + 0.5) * (HZ - 30),
    r: 0.8 + (Math.sin(i * 13.1) * 0.5 + 0.5) * 1.6,
    tw: 0.6 + 0.4 * Math.sin(t * (2 + (i % 5)) + i),
  }));
  // skyline: deterministic building blocks with windows
  const blds = Array.from({ length: 26 }, (_, i) => {
    const w = 18 + ((i * 37) % 34);
    const h = 14 + ((i * 53) % 34) + (i % 7 === 3 ? 30 : 0) + (i % 11 === 5 ? 18 : 0);
    return { w, h };
  });
  const far = Array.from({ length: 30 }, (_, i) => ({ x: i * 27 - 8, w: 24 + ((i * 29) % 14), h: 22 + ((i * 41) % 40) }));
  let bx = -10;
  const placed = blds.map((d) => {
    const x = bx;
    bx += d.w + (d.w % 3 === 0 ? 6 : 0);
    return { ...d, x };
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 150, opacity: o, translate: `0 ${(1 - prog(t, a, a + 0.35, ease.out)) * 16}px` }}>
      <div
        style={{
          width: W,
          height: H,
          borderRadius: 34,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,240,220,0.18)",
        }}
      >
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
          <defs>
            <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={sky(1)} />
              <stop offset="0.92" stopColor={sky(2)} />
            </linearGradient>
            <radialGradient id={`${id}-sun`}>
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.35" stopColor={sunCore} />
              <stop offset="1" stopColor={sunCore} stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${id}-halo`}>
              <stop offset="0" stopColor={sunHalo} stopOpacity={0.75} />
              <stop offset="1" stopColor={sunHalo} stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${id}-glow`} cx="0.5" cy="1" r="0.9">
              <stop offset="0" stopColor="#ff7a3c" stopOpacity={0.85} />
              <stop offset="1" stopColor="#ff7a3c" stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${id}-moon`} cx="0.38" cy="0.35" r="0.75">
              <stop offset="0" stopColor="#fbfaf2" />
              <stop offset="0.7" stopColor="#d9dbe3" />
              <stop offset="1" stopColor="#9da3b6" />
            </radialGradient>
            <radialGradient id={`${id}-mglow`}>
              <stop offset="0" stopColor="#c9d8ff" stopOpacity={0.55} />
              <stop offset="1" stopColor="#c9d8ff" stopOpacity={0} />
            </radialGradient>
            <filter id={`${id}-craters`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={3} seed={7} />
              <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.36  0 0 0 0 0.42  0 0 0 -2.2 1.35" />
            </filter>
            <filter id={`${id}-cloud`} x="-20%" y="-50%" width="140%" height="200%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves={4} seed={3} />
              <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.4 -1.25" />
              <feGaussianBlur stdDeviation="2" />
            </filter>
            <clipPath id={`${id}-moonclip`}>
              <circle cx={mx} cy={my} r={30} />
            </clipPath>
          </defs>

          <rect width={W} height={H} fill={`url(#${id}-sky)`} />
          {/* stars */}
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={night * s.tw * 0.9} />
          ))}
          {/* horizon glow at dusk */}
          <rect x={0} y={HZ - 150} width={W} height={150} fill={`url(#${id}-glow)`} opacity={dusk} />
          {/* sun */}
          <g opacity={1 - night}>
            <circle cx={sx} cy={sy} r={140} fill={`url(#${id}-halo)`} opacity={0.55 + sunWarm * 0.3} />
            <circle cx={sx} cy={sy} r={46} fill={`url(#${id}-sun)`} />
            <circle cx={sx} cy={sy} r={20} fill="#fffef6" />
          </g>
          {/* clouds drifting, tinted by the light */}
          <g style={{ mixBlendMode: "screen" }} opacity={0.75 - night * 0.45}>
            <rect
              x={-200 + t * 6}
              y={30}
              width={W + 400}
              height={150}
              filter={`url(#${id}-cloud)`}
              fill="#fff"
            />
          </g>
          <rect x={0} y={20} width={W} height={170} fill={mixHex("#ffffff", "#ff9a6a", dusk)} opacity={0.07 * (1 - night)} />
          {/* moon */}
          <g opacity={mk}>
            <circle cx={mx} cy={my} r={95} fill={`url(#${id}-mglow)`} />
            <circle cx={mx} cy={my} r={30} fill={`url(#${id}-moon)`} />
            <rect x={mx - 30} y={my - 30} width={60} height={60} filter={`url(#${id}-craters)`} clipPath={`url(#${id}-moonclip)`} opacity={0.55} />
          </g>
          {/* far skyline in haze */}
          {far.map((d, i) => (
            <rect key={`f${i}`} x={d.x} y={HZ + 70 - d.h - 18} width={d.w} height={d.h + 18} fill={mixHex(mixHex(sky(2), "#2a3550", 0.45), "#0a1026", night)} opacity={0.85} />
          ))}
          {/* skyline */}
          {placed.map((d, i) => (
            <g key={i}>
              <rect x={d.x} y={HZ + 70 - d.h - 40} width={d.w} height={d.h + 40} fill={mixHex("#26304a", "#04060c", Math.max(night, k * 0.7))} />
              {d.w > 30 ? <rect x={d.x + 5} y={HZ + 70 - d.h - 48} width={8} height={8} fill={mixHex("#26304a", "#04060c", Math.max(night, k * 0.7))} /> : null}
              {Array.from({ length: Math.floor(d.h / 12) }, (_, r) =>
                Array.from({ length: Math.floor(d.w / 9) }, (_, c) => {
                  const on = Math.sin(i * 7.1 + r * 3.3 + c * 5.7) > 0.15;
                  return on ? (
                    <rect key={`${r}-${c}`} x={d.x + 4 + c * 9} y={HZ + 70 - d.h - 34 + r * 12} width={4} height={5} fill="#ffd27a" opacity={night * 0.9} />
                  ) : null;
                }),
              )}
            </g>
          ))}
          {/* soft haze at the horizon */}
          <rect x={0} y={HZ - 20} width={W} height={90} fill={sky(2)} opacity={0.25} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

const mixHex = (a: string, b: string, u: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * u).toString(16).padStart(2, "0")).join("")}`;
};

/** Tiredness meter (amber bar, moon icon). Fills between fillA..fillB. */
export const TiredMeter: React.FC<{
  readonly a: number;
  readonly b: number;
  readonly fillA: number;
  readonly fillB: number;
  readonly from?: number;
  readonly to?: number;
  readonly top?: number;
  readonly label?: string;
}> = ({ a, b, fillA, fillB, from = 0.15, to = 0.85, top = 440, label = "ক্লান্তি" }) => {
  const t = useSeconds();
  const o = fadeIO(t, a, b);
  if (o <= 0) return null;
  const v = from + (to - from) * prog(t, fillA, fillB, ease.inOut);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: top, opacity: o, translate: `0 ${(1 - prog(t, a, a + 0.3, ease.out)) * 20}px` }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "16px 28px",
          borderRadius: 999,
          background: K.panel,
          border: `2px solid ${K.panelBorder}`,
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          fontFamily: bodyFont,
          fontWeight: 700,
          fontSize: 44,
          color: K.ink,
        }}
      >
        <span>{label}</span>
        <div style={{ width: 380, height: 30, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
          <div
            style={{
              width: `${v * 100}%`,
              height: "100%",
              borderRadius: 99,
              background: `linear-gradient(90deg, #ffcf7a, ${K.amber})`,
              boxShadow: `0 0 24px ${K.amber}`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Red ✕ pulse at a screen point. */
export const XPulse: React.FC<{ readonly at: number; readonly x: number; readonly y: number; readonly len?: number; readonly size?: number }> = ({
  at,
  x,
  y,
  len = 1.1,
  size = 130,
}) => {
  const t = useSeconds();
  if (t < at || t > at + len) return null;
  const k = prog(t, at, at + 0.25, ease.out);
  const out = prog(t, at + len - 0.3, at + len);
  const ring = prog(t, at, at + 0.6, ease.outCubic);
  return (
    <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: 1 - out }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          border: `6px solid ${K.red}`,
          scale: 0.6 + ring * 0.9,
          opacity: 1 - ring,
        }}
      />
      <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ scale: 0.5 + k * 0.5, filter: `drop-shadow(0 0 14px ${K.red})` }}>
        <circle r={44} fill="rgba(40,8,6,0.75)" stroke={K.red} strokeWidth={6} />
        <path d="M -18 -18 L 18 18 M 18 -18 L -18 18" stroke={K.red} strokeWidth={11} strokeLinecap="round" />
      </svg>
    </div>
  );
};

/** Full-frame flash used on internal cuts. */
export const CutFlash: React.FC<{ readonly at: number; readonly color?: string; readonly len?: number }> = ({ at, color = "#ffe6c8", len = 0.35 }) => {
  const t = useSeconds();
  const k = prog(t, at - 0.06, at) * (1 - prog(t, at, at + len, ease.outCubic));
  if (k <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: k * 0.6, mixBlendMode: "screen" }} />;
};

/** Darken overlay. */
export const Dim: React.FC<{ readonly k: number }> = ({ k }) =>
  k <= 0 ? null : <AbsoluteFill style={{ background: "#050302", opacity: k, pointerEvents: "none" }} />;
