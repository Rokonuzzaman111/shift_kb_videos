/** 2D overlay pieces for the Svalbard reel: pin labels, counters, thermometer, title card, capacity bar, flash. */
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { S, clamp, ease, headFont, numFont } from "../theme";

const BN = "০১২৩৪৫৬৭৮৯";
export const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => BN[+d]);
/** Indian grouping: 1400000 → 14,00,000 */
export const lakh = (n: number) => {
  const s = Math.round(n).toString();
  if (s.length <= 3) return s;
  const last = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last}`;
};

const useT = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

const pop = (t: number, at: number, dur = 0.35) => interpolate(t, [at, at + dur], [0, 1], { ...clamp, easing: ease.out });

/** Label pinned to a screen point, with a leader line going up/left/right to a glass tag. */
export const PinLabel: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly at: number;
  readonly text: string;
  readonly sub?: string;
  readonly dx?: number;
  readonly dy?: number;
  readonly color?: string;
  readonly out?: number;
}> = ({ x, y, at, text, sub, dx = 140, dy = -160, color = S.aurora, out = 99 }) => {
  const t = useT();
  const k = pop(t, at, 0.45);
  const o = 1 - interpolate(t, [out, out + 0.25], [0, 1], clamp);
  if (k <= 0 || o <= 0) return null;
  const ex = x + dx * k;
  const ey = y + dy * k;
  const pulse = 1 + 0.35 * Math.sin(t * 6);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: o }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <circle cx={x} cy={y} r={14 * k * pulse} fill="none" stroke={color} strokeWidth={3} opacity={0.6} />
        <circle cx={x} cy={y} r={7 * k} fill={color} />
        <polyline points={`${x},${y} ${ex},${ey} ${ex + (dx >= 0 ? 40 : -40) * k},${ey}`} fill="none" stroke={color} strokeWidth={3} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: dx >= 0 ? ex + 48 : undefined,
          right: dx < 0 ? 1080 - ex + 48 : undefined,
          top: ey - 46,
          padding: "12px 24px 14px",
          background: S.panel,
          border: `2px solid ${color}88`,
          borderRadius: 18,
          backdropFilter: "blur(6px)",
          opacity: k,
          translate: `${(1 - k) * (dx >= 0 ? -20 : 20)}px 0px`,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 50, color: S.ink, lineHeight: 1.25 }}>{text}</div>
        {sub ? <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 32, color, lineHeight: 1.3 }}>{sub}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

/** Big number counting up (Bangla digits, lakh grouping). */
export const Counter: React.FC<{
  readonly at: number;
  readonly dur: number;
  readonly to: number;
  readonly suffix?: string;
  readonly label?: string;
  readonly top?: number;
  readonly color?: string;
}> = ({ at, dur, to, suffix = "", label, top = 300, color = S.aurora }) => {
  const t = useT();
  const k = pop(t, at - 0.1, 0.3);
  if (k <= 0) return null;
  const v = interpolate(t, [at, at + dur], [0, to], { ...clamp, easing: ease.out });
  const done = t > at + dur;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: k, scale: 0.85 + 0.15 * k + (done ? 0.03 * Math.max(0, 1 - (t - at - dur) * 4) : 0) }}>
      <div
        style={{
          fontFamily: headFont,
          fontWeight: 800,
          fontSize: 150,
          color,
          lineHeight: 1.1,
          textShadow: `0 0 40px ${color}88, 0 8px 30px rgba(0,0,0,0.8)`,
          WebkitTextStroke: "3px rgba(0,0,0,0.4)",
        }}
      >
        {bn(lakh(v))}
        {suffix}
      </div>
      {label ? <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 54, color: S.ink, textShadow: "0 4px 18px rgba(0,0,0,0.9)" }}>{label}</div> : null}
    </div>
  );
};

/** Glass thermometer that drains to −18 °C. */
export const Thermo: React.FC<{ readonly at: number; readonly x?: number; readonly y?: number }> = ({ at, x = 760, y = 260 }) => {
  const t = useT();
  const k = pop(t, at - 0.15, 0.35);
  if (k <= 0) return null;
  const temp = interpolate(t, [at, at + 1.2], [20, -18], { ...clamp, easing: ease.inOut });
  const fill = interpolate(temp, [-30, 30], [0.08, 1]);
  const cold = interpolate(temp, [-18, 20], [1, 0], clamp);
  const col = `rgb(${Math.round(255 - 190 * cold)},${Math.round(90 + 122 * cold)},${Math.round(80 + 175 * cold)})`;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: k, translate: `${(1 - k) * 60}px 0px`, display: "flex", alignItems: "center", gap: 18 }}>
      <svg width={70} height={300} viewBox="0 0 70 300">
        <rect x={22} y={6} width={26} height={236} rx={13} fill="rgba(255,255,255,0.12)" stroke="rgba(220,240,255,0.7)" strokeWidth={3} />
        <rect x={28} y={12 + 224 * (1 - fill)} width={14} height={224 * fill} rx={7} fill={col} />
        <circle cx={35} cy={262} r={30} fill={col} stroke="rgba(220,240,255,0.7)" strokeWidth={3} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={i} x1={50} x2={60} y1={20 + i * 42} y2={20 + i * 42} stroke="rgba(220,240,255,0.6)" strokeWidth={2} />
        ))}
      </svg>
      <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 92, color: S.ice, textShadow: `0 0 30px ${S.cyan}99, 0 6px 20px rgba(0,0,0,0.8)` }}>
        {temp < 0 ? "−" : ""}
        {Math.abs(Math.round(temp))}°C
      </div>
    </div>
  );
};

/** Title card: English name big, Bangla line under it, coordinate tag. */
export const TitleCard: React.FC<{ readonly at: number; readonly out?: number }> = ({ at, out = 99 }) => {
  const t = useT();
  const k = pop(t, at, 0.5);
  const o = 1 - interpolate(t, [out, out + 0.25], [0, 1], clamp);
  if (k <= 0) return null;
  const lines = ["SVALBARD", "GLOBAL SEED", "VAULT"];
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 210, textAlign: "center", opacity: o }}>
      {lines.map((l, i) => {
        const kk = pop(t, at + i * 0.09, 0.45);
        return (
          <div
            key={l}
            style={{
              fontFamily: numFont,
              fontWeight: 900,
              fontSize: i === 1 ? 104 : 124,
              letterSpacing: kk * 10 - 4,
              color: i === 2 ? S.aurora : S.ink,
              lineHeight: 1.0,
              opacity: kk,
              translate: `0px ${(1 - kk) * 40}px`,
              textShadow: `0 0 50px ${i === 2 ? S.aurora : S.cyan}66, 0 10px 30px rgba(0,0,0,0.85)`,
            }}
          >
            {l}
          </div>
        );
      })}
      <div
        style={{
          display: "inline-block",
          marginTop: 26,
          padding: "8px 26px",
          border: `2px solid ${S.line}`,
          borderRadius: 40,
          background: S.panel,
          fontFamily: numFont,
          fontWeight: 700,
          fontSize: 34,
          color: S.ice,
          letterSpacing: 3,
          opacity: pop(t, at + 0.35, 0.4),
        }}
      >
        78.24° N · 15.49° E · NORWAY
      </div>
    </div>
  );
};

/** Capacity bar: used vs total. */
export const CapacityBar: React.FC<{ readonly at: number; readonly totalAt: number; readonly used: number; readonly total: number }> = ({
  at,
  totalAt,
  used,
  total,
}) => {
  const t = useT();
  const k = pop(t, at, 0.4);
  if (k <= 0) return null;
  const fillUsed = interpolate(t, [at + 0.1, at + 0.9], [0, used / total], { ...clamp, easing: ease.out });
  const kt = pop(t, totalAt, 0.5);
  const W = 860;
  return (
    <div style={{ position: "absolute", left: (1080 - W) / 2, top: 250, width: W, opacity: k }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 56, color: S.aurora, textShadow: "0 4px 16px rgba(0,0,0,0.8)" }}>
          {bn(14)} লাখ <span style={{ fontSize: 36, color: S.ink }}>এখন</span>
        </div>
        <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 56 + kt * 14, color: S.cyan, opacity: 0.35 + kt * 0.65, textShadow: `0 0 ${kt * 30}px ${S.cyan}` }}>
          {bn(45)} লাখ <span style={{ fontSize: 36, color: S.ink }}>সর্বোচ্চ</span>
        </div>
      </div>
      <div style={{ height: 46, borderRadius: 23, background: "rgba(255,255,255,0.08)", border: `2px solid ${S.line}`, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, width: `${kt * 100}%`, background: `repeating-linear-gradient(135deg, ${S.cyan}33 0 14px, transparent 14px 28px)` }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${fillUsed * 100}%`, background: `linear-gradient(90deg, #2fd88f, ${S.aurora})`, boxShadow: `0 0 30px ${S.aurora}` }} />
      </div>
    </div>
  );
};

/** White flash + slight zoom on cuts. */
export const Flash: React.FC<{ readonly at: number; readonly dur?: number; readonly color?: string }> = ({ at, dur = 0.22, color = "#e8f7ff" }) => {
  const t = useT();
  const o = interpolate(t, [at - 0.03, at, at + dur], [0, 0.85, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

/** Small top tag (chapter-like) e.g. "উত্তর মেরু থেকে ~১৩০০ কিমি". */
export const Tag: React.FC<{ readonly at: number; readonly text: string; readonly top?: number; readonly color?: string; readonly out?: number }> = ({
  at,
  text,
  top = 200,
  color = S.cyan,
  out = 99,
}) => {
  const t = useT();
  const k = pop(t, at, 0.4);
  const o = 1 - interpolate(t, [out, out + 0.25], [0, 1], clamp);
  if (k <= 0 || o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", opacity: k * o }}>
      <div
        style={{
          padding: "12px 30px 16px",
          borderRadius: 40,
          background: S.panel,
          border: `2px solid ${color}99`,
          fontFamily: headFont,
          fontWeight: 700,
          fontSize: 46,
          color: S.ink,
          scale: 0.9 + 0.1 * k,
          boxShadow: `0 0 30px ${color}33`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Spring pop (overshoot) for text: 0 → 1 with a little bounce. */
export const useSpringPop = (at: number) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: f - Math.round(at * fps), fps, config: { damping: 11, stiffness: 190, mass: 0.7 } });
};

/**
 * Organized top title chip: small kicker line + big headline, springs in, optional exit.
 * Used as the "what this shot is about" anchor so every shot has the same text grammar.
 */
export const Headline: React.FC<{
  readonly at: number;
  readonly kicker?: string;
  readonly text: string;
  readonly color?: string;
  readonly top?: number;
  readonly out?: number;
}> = ({ at, kicker, text, color = S.aurora, top = 190, out = 99 }) => {
  const t = useT();
  const k = useSpringPop(at);
  const kk = useSpringPop(at + 0.12);
  const o = 1 - interpolate(t, [out, out + 0.2], [0, 1], clamp);
  if (t < at - 0.05 || o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: o }}>
      {kicker ? (
        <div
          style={{
            display: "inline-block",
            padding: "6px 22px 10px",
            borderRadius: 30,
            background: color,
            color: "#04130c",
            fontFamily: headFont,
            fontWeight: 800,
            fontSize: 36,
            scale: `${k}`,
            marginBottom: 14,
            boxShadow: `0 0 30px ${color}66`,
          }}
        >
          {kicker}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: headFont,
          fontWeight: 800,
          fontSize: 88,
          lineHeight: 1.2,
          color: S.ink,
          scale: `${0.6 + 0.4 * kk}`,
          opacity: Math.min(1, kk * 1.5),
          translate: `0px ${(1 - kk) * 30}px`,
          textShadow: `0 0 40px ${color}55, 0 8px 26px rgba(0,0,0,0.9)`,
          WebkitTextStroke: "2px rgba(0,0,0,0.35)",
          padding: "0 60px",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Row of status chips that light up one by one (e.g. threats). `active[i]` = time chip i fires. */
export const ChipRow: React.FC<{ readonly items: { text: string; at: number }[]; readonly color?: string; readonly top?: number }> = ({
  items,
  color = S.red,
  top = 210,
}) => {
  const t = useT();
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 18 }}>
      {items.map((it, i) => (
        <ChipItem key={i} text={it.text} at={it.at} color={color} t={t} />
      ))}
    </div>
  );
};

const ChipItem: React.FC<{ readonly text: string; readonly at: number; readonly color: string; readonly t: number }> = ({ text, at, color, t }) => {
  const k = useSpringPop(at);
  const on = t >= at;
  return (
    <div
      style={{
        padding: "10px 28px 14px",
        borderRadius: 18,
        fontFamily: headFont,
        fontWeight: 800,
        fontSize: 52,
        color: on ? "#fff" : "rgba(255,255,255,0.35)",
        background: on ? `${color}` : "rgba(10,16,24,0.6)",
        border: `3px solid ${on ? color : "rgba(255,255,255,0.15)"}`,
        scale: `${on ? 0.85 + 0.15 * k : 0.85}`,
        boxShadow: on ? `0 0 34px ${color}aa` : "none",
        textShadow: "0 3px 10px rgba(0,0,0,0.5)",
      }}
    >
      {text}
    </div>
  );
};
