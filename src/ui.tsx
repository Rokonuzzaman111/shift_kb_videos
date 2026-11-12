import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, bodyFont, headFont } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

export type Word = { text: string; startMs: number; endMs: number };

/** Glassy pill used for labels and stat chips. Pops in at `at`, out at `until`. */
export const Chip: React.FC<{
  readonly at: number;
  readonly until?: number;
  readonly children: React.ReactNode;
  readonly accent?: string;
  readonly size?: number;
  readonly style?: React.CSSProperties;
}> = ({ at, until = 1e9, children, accent = C.amber, size = 44, style }) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [at, at + 12], [0, 1], { ...clamp, easing: outExpo });
  const outP = interpolate(frame, [until, until + 8], [0, 1], clamp);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 18,
        padding: "16px 30px",
        borderRadius: 999,
        background: C.panel,
        border: `2px solid ${C.panelBorder}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        backdropFilter: "blur(10px)",
        color: C.ink,
        fontFamily: bodyFont,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.25,
        opacity: inP * (1 - outP),
        translate: `0px ${interpolate(inP, [0, 1], [30, 0]) + outP * -20}px`,
        scale: interpolate(inP, [0, 1], [0.9, 1]),
        ...style,
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 99,
          background: accent,
          boxShadow: `0 0 18px ${accent}`,
          flexShrink: 0,
        }}
      />
      {children}
    </div>
  );
};

/** Big punchy headline line with a spring-y scale pop. */
export const Pop: React.FC<{
  readonly at: number;
  readonly until?: number;
  readonly children: React.ReactNode;
  readonly color?: string;
  readonly size?: number;
  readonly glow?: boolean;
  readonly style?: React.CSSProperties;
}> = ({ at, until = 1e9, children, color = C.ink, size = 120, glow, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 14], [0, 1], {
    ...clamp,
    easing: Easing.spring({ damping: 11, mass: 0.6 }),
  });
  const outP = interpolate(frame, [until, until + 8], [0, 1], clamp);
  return (
    <div
      style={{
        fontFamily: headFont,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.15,
        color,
        textAlign: "center",
        opacity: Math.min(1, p * 1.6) * (1 - outP),
        scale: interpolate(p, [0, 1], [0.6, 1]),
        WebkitTextStroke: "8px rgba(0,0,0,0.55)",
        paintOrder: "stroke fill",
        textShadow: glow ? `0 0 40px ${color}88, 0 6px 24px rgba(0,0,0,0.6)` : "0 6px 24px rgba(0,0,0,0.6)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Word-synced karaoke captions. Words come from TTS word boundaries. */
export const Captions: React.FC<{
  readonly words: Word[];
  readonly keywords?: string[];
  readonly maxWords?: number;
}> = ({ words, keywords = [], maxWords = 3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  const pages: Word[][] = [];
  words.forEach((w, i) => {
    const cur = pages[pages.length - 1];
    const gap = i > 0 ? w.startMs - words[i - 1].endMs : 0;
    if (!cur || cur.length >= maxWords || gap > 350) pages.push([w]);
    else cur.push(w);
  });

  const idx = pages.findIndex((p, i) => {
    const end = pages[i + 1] ? pages[i + 1][0].startMs : p[p.length - 1].endMs + 500;
    return ms >= p[0].startMs - 60 && ms < end;
  });
  if (idx === -1) return null;
  const page = pages[idx];
  const pageStartF = ((page[0].startMs - 60) / 1000) * fps;
  const enter = interpolate(frame, [pageStartF, pageStartF + 6], [0, 1], { ...clamp, easing: outExpo });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 380 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "6px 22px",
          maxWidth: 920,
          opacity: enter,
          translate: `0px ${(1 - enter) * 24}px`,
        }}
      >
        {page.map((w, i) => {
          const active = ms >= w.startMs - 30 && ms < w.endMs + 120;
          const spoken = ms >= w.startMs - 30;
          const key = keywords.includes(w.text);
          const pop = interpolate(ms, [w.startMs - 30, w.startMs + 90], [0, 1], clamp);
          return (
            <span
              key={i}
              style={{
                fontFamily: headFont,
                fontWeight: 800,
                fontSize: 92,
                lineHeight: 1.3,
                padding: key ? "0 18px" : 0,
                borderRadius: 18,
                background: key && spoken ? `rgba(255, 106, 43, ${0.9 * pop})` : "transparent",
                color: key && spoken ? "#fff" : active ? C.amber : spoken ? C.ink : "rgba(245,243,238,0.55)",
                scale: active ? interpolate(pop, [0, 1], [0.92, 1.06]) : 1,
                WebkitTextStroke: key && spoken ? "0px transparent" : "10px rgba(0,0,0,0.8)",
                paintOrder: "stroke fill",
                textShadow: "0 8px 30px rgba(0,0,0,0.55)",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** Cinematic finishing: vignette + animated film grain + soft top/bottom shade. */
export const Finish: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 97} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

/** Full-screen additive flash (screen blend), peaks at `at`. */
export const Flash: React.FC<{ readonly at: number; readonly color?: string; readonly len?: number }> = ({
  at,
  color = "#ffd9a0",
  len = 16,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 2, at, at + len], [0, 0.9, 0], clamp);
  if (o <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 48%, ${color} 0%, ${color}00 70%)`,
        opacity: o,
        mixBlendMode: "screen",
      }}
    />
  );
};
