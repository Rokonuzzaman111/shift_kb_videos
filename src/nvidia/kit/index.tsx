/**
 * NVIDIA video STYLE KIT v2 (OWNER: lead) — "3D + documentary" look. Every scene builds from these pieces so
 * the whole film looks like one premium product:
 *  - never an empty black frame: <Plate> (pre-rendered real 3D B-roll), <Atmos> (light leaks, bokeh, haze)
 *  - <Beats> cuts with real transitions (whip / zoom / flash / glitch / slide) + continuous <Cam> movement
 *  - <Glass> cards, <PhotoCard> documentary photo prints, <KText> kinetic type, <Counter>, <Marker> strokes
 *  - <Grade> on top: grain, vignette, colour grade, light sweep
 */
import { AbsoluteFill, Img, Loop, OffthreadVideo, Sequence, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { N, clamp, ease, headFont, numFont } from "../theme";

/* ============================================================ time helpers */
export const useSec = () => {
  const { fps } = useVideoConfig();
  return (s: number) => Math.round(s * fps);
};
export const p01 = (frame: number, a: number, b: number, e = ease.out) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: e });

/* ============================================================ 3D B-roll plates */
export type PlateId = "dc" | "chipmacro" | "chipexplode" | "tray" | "card";

/**
 * A real 3D clip (public/nvidia/plates/<id>.mp4, 8 s, 1920×1080) as a living background.
 * blur/dim/tint push it back so foreground graphics read; drift adds a slow extra push.
 */
export const Plate: React.FC<{
  readonly id: PlateId;
  readonly from?: number; // seconds into the clip to start
  readonly rate?: number;
  readonly blur?: number;
  readonly dim?: number; // 0..1 darkening
  readonly tint?: string; // css colour multiplied over
  readonly drift?: number; // extra scale over the shot
  readonly style?: React.CSSProperties;
}> = ({ id, from = 0, rate = 1, blur = 0, dim = 0, tint, drift = 0.06, style }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const s = 1.02 + drift * (frame / Math.max(1, durationInFrames));
  const clip = Math.round(8 * fps);
  return (
    <AbsoluteFill style={{ overflow: "hidden", ...style }}>
      <AbsoluteFill style={{ scale: `${s}`, filter: blur ? `blur(${blur}px)` : undefined }}>
        <Loop durationInFrames={Math.round((clip - from * fps) / rate)}>
          <OffthreadVideo
            src={staticFile(`nvidia/plates/${id}.mp4`)}
            muted
            startFrom={Math.round(from * fps)}
            playbackRate={rate}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Loop>
      </AbsoluteFill>
      {tint ? <AbsoluteFill style={{ background: tint, mixBlendMode: "multiply" }} /> : null}
      {dim ? <AbsoluteFill style={{ background: `rgba(3,4,5,${dim})` }} /> : null}
    </AbsoluteFill>
  );
};

/* ============================================================ atmosphere */
/** Moving light leaks + floating bokeh + soft haze. Put it over backgrounds, under foreground. */
export const Atmos: React.FC<{ readonly color?: string; readonly color2?: string; readonly bokeh?: number; readonly leak?: number; readonly seed?: string }> = ({
  color = N.green,
  color2 = "#2a6cff",
  bokeh = 26,
  leak = 0.55,
  seed = "a",
}) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const lx = 50 + Math.sin(t * 0.35 + random(seed) * 6) * 35;
  const ly = 40 + Math.cos(t * 0.27 + random(seed + "y") * 6) * 25;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          mixBlendMode: "screen",
          opacity: leak,
          background: `radial-gradient(circle at ${lx}% ${ly}%, ${color}55 0%, transparent 38%), radial-gradient(circle at ${100 - lx}% ${100 - ly * 0.6}%, ${color2}33 0%, transparent 42%)`,
        }}
      />
      {Array.from({ length: bokeh }).map((_, i) => {
        const r = 6 + random(`${seed}r${i}`) * 34;
        const x = (random(`${seed}x${i}`) * 1920 + t * (8 + random(`${seed}v${i}`) * 18)) % 2000 - 40;
        const y = random(`${seed}y${i}`) * 1080 + Math.sin(t * 0.6 + i) * 20;
        const o = 0.08 + random(`${seed}o${i}`) * 0.22;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: i % 3 === 0 ? color : "#ffffff",
              opacity: o * (0.6 + 0.4 * Math.sin(t * 1.3 + i)),
              filter: `blur(${r * 0.35}px)`,
              mixBlendMode: "screen",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** Dark textured documentary backdrop (paper/concrete feel + soft spotlight). */
export const DocBg: React.FC<{ readonly tint?: string; readonly spot?: [number, number] }> = ({ tint = "#1a1f1c", spot = [50, 40] }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at ${spot[0]}% ${spot[1]}%, ${tint} 0%, #070808 70%)`,
    }}
  >
    <AbsoluteFill
      style={{
        opacity: 0.35,
        mixBlendMode: "overlay",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.012 0.03' numOctaves='4' seed='7'/><feColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 1.4 -0.2'/></filter><rect width='100%' height='100%' filter='url(%23p)'/></svg>\")",
      }}
    />
  </AbsoluteFill>
);

/* ============================================================ camera */
/** Continuous 2.5D camera: slow push + drift + optional punch-in at frame `punch`. Wrap a whole beat. */
export const Cam: React.FC<{
  readonly children: React.ReactNode;
  readonly push?: number; // total extra scale over the beat
  readonly drift?: [number, number]; // px over the beat
  readonly rot?: number; // deg over the beat
  readonly punch?: number[]; // frames to punch in (quick 6% zoom that settles)
  readonly shakeAt?: number[];
  readonly origin?: string;
}> = ({ children, push = 0.08, drift = [-30, -10], rot = 0, punch = [], shakeAt = [], origin = "50% 45%" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = interpolate(frame, [0, durationInFrames], [0, 1], { ...clamp, easing: ease.inOut });
  let pz = 0;
  for (const p of punch) pz += frame >= p ? 0.07 * Math.exp(-(frame - p) / 7) + 0.03 * (1 - Math.exp(-(frame - p) / 7)) : 0;
  let sx = 0;
  let sy = 0;
  for (const s of shakeAt) {
    const d = frame - s;
    if (d >= 0 && d < 16) {
      const a = (1 - d / 16) ** 2 * 20;
      sx += (random(`cx${s}${d}`) - 0.5) * 2 * a;
      sy += (random(`cy${s}${d}`) - 0.5) * 2 * a;
    }
  }
  return (
    <AbsoluteFill
      style={{
        transformOrigin: origin,
        scale: `${1 + push * k + pz}`,
        translate: `${drift[0] * k + sx}px ${drift[1] * k + sy}px`,
        rotate: `${rot * k}deg`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/* ============================================================ beats + transitions */
export type Trans = "cut" | "whip" | "whipL" | "zoom" | "flash" | "glitch" | "slideUp" | "blur";

export type Beat = { readonly at: number; readonly node: React.ReactNode; readonly trans?: Trans; readonly name?: string };

const T = 10; // transition frames

/**
 * Lays beats on the scene timeline. Beat i runs [at_i, at_{i+1}); its entrance transition plays over the first
 * T frames while the previous beat exits (overlap), so cuts feel physical. `end` = scene length in frames.
 */
export const Beats: React.FC<{ readonly beats: Beat[]; readonly end: number }> = ({ beats, end }) => (
  <AbsoluteFill>
    {beats.map((b, i) => {
      const next = beats[i + 1];
      const nextTrans = next?.trans ?? "cut";
      const tail = next && nextTrans !== "cut" ? T : 0;
      const from = Math.max(0, b.at);
      const to = next ? next.at + tail : end;
      return (
        <Sequence key={i} from={from} durationInFrames={Math.max(1, to - from)} name={b.name ?? `beat ${i}`}>
          <BeatFx enter={i === 0 ? "cut" : b.trans ?? "cut"} exit={next ? nextTrans : "cut"} exitAt={next ? next.at - from : 1e9}>
            {b.node}
          </BeatFx>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

const BeatFx: React.FC<{ readonly children: React.ReactNode; readonly enter: Trans; readonly exit: Trans; readonly exitAt: number }> = ({
  children,
  enter,
  exit,
  exitAt,
}) => {
  const frame = useCurrentFrame();
  const e = p01(frame, 0, T, ease.out); // 0→1 entering
  const x = p01(frame, exitAt, exitAt + T, ease.in); // 0→1 leaving
  let style: React.CSSProperties = {};
  let flash = 0;
  const pre = (tr: Trans, v: number, dir: 1 | -1): React.CSSProperties => {
    // v: 1 = fully off-screen for this transition
    switch (tr) {
      case "whip":
        return { translate: `${dir * v * 1920}px 0px`, filter: v > 0.01 ? `blur(${v * 38}px)` : undefined, transform: `skewX(${-dir * v * 8}deg)` };
      case "whipL":
        return { translate: `${-dir * v * 1920}px 0px`, filter: v > 0.01 ? `blur(${v * 38}px)` : undefined, transform: `skewX(${dir * v * 8}deg)` };
      case "zoom":
        return { scale: `${dir === 1 ? 1 - 0.55 * v : 1 + 2.2 * v}`, filter: v > 0.01 ? `blur(${v * 26}px) brightness(${1 + v})` : undefined, opacity: dir === 1 ? 1 - v * 0.2 : 1 - v };
      case "slideUp":
        return { translate: `0px ${dir * v * 1080}px`, filter: v > 0.01 ? `blur(${v * 20}px)` : undefined };
      case "blur":
        return { filter: v > 0.01 ? `blur(${v * 30}px)` : undefined, opacity: 1 - v };
      case "glitch":
        return { translate: `${(random(`g${Math.round(v * 20)}`) - 0.5) * 140 * v}px 0px`, filter: v > 0.01 ? `hue-rotate(${v * 90}deg) contrast(${1 + v})` : undefined, opacity: v > 0.7 ? 0 : 1 };
      default:
        return {};
    }
  };
  if (enter !== "cut" && e < 1) {
    style = pre(enter, 1 - e, 1);
    if (enter === "flash" || enter === "zoom") flash = (1 - e) * 0.9;
  }
  if (exit !== "cut" && x > 0) {
    const ex = pre(exit === "whip" ? "whip" : exit, x, -1);
    style = { ...style, ...ex };
  }
  return (
    <AbsoluteFill style={style}>
      {children}
      {flash > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: flash, mixBlendMode: "screen" }} /> : null}
      {enter === "glitch" && e < 1 ? <GlitchBars amount={1 - e} /> : null}
    </AbsoluteFill>
  );
};

export const GlitchBars: React.FC<{ readonly amount: number; readonly color?: string }> = ({ amount, color = N.red }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: random(`gb${frame}${i}`) * 1080,
            height: 6 + random(`gh${frame}${i}`) * 40,
            background: i % 2 ? color : N.cyan,
            opacity: amount * 0.5,
            translate: `${(random(`gx${frame}${i}`) - 0.5) * 300}px 0`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Full-screen white/green flash with a lens streak — drop on a hit frame. */
export const HitFlash: React.FC<{ readonly at: number; readonly color?: string }> = ({ at, color = "#ffffff" }) => {
  const frame = useCurrentFrame();
  const d = frame - at;
  if (d < 0 || d > 14) return null;
  const o = Math.exp(-d / 3.5);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
      <AbsoluteFill style={{ background: color, opacity: o * 0.55 }} />
      <div style={{ position: "absolute", left: -200, right: -200, top: 520, height: 10, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: o, filter: "blur(4px)", scale: `${1 + d * 0.08} 1` }} />
    </AbsoluteFill>
  );
};

/* ============================================================ cards */
/** Frosted glass card with gradient edge and moving sheen. */
export const Glass: React.FC<{
  readonly children?: React.ReactNode;
  readonly style?: React.CSSProperties;
  readonly accent?: string;
  readonly sheenAt?: number;
}> = ({ children, style, accent = N.green, sheenAt = 0 }) => {
  const frame = useCurrentFrame();
  const sx = interpolate(frame, [sheenAt, sheenAt + 40], [-60, 160], clamp);
  return (
    <div
      style={{
        position: "absolute",
        borderRadius: 26,
        background: "linear-gradient(145deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.25))",
        backdropFilter: "blur(18px) saturate(1.3)",
        WebkitBackdropFilter: "blur(18px) saturate(1.3)",
        border: "1.5px solid rgba(255,255,255,0.16)",
        boxShadow: `0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px ${accent}22, 0 0 60px ${accent}18`,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(105deg, transparent ${sx - 20}%, rgba(255,255,255,0.14) ${sx}%, transparent ${sx + 20}%)`,
          pointerEvents: "none",
        }}
      />
      {children}
    </div>
  );
};

/** Documentary photo print: white border, slight tilt, drop shadow, optional tape, enters with a toss. */
export const PhotoCard: React.FC<{
  readonly src: string;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly at?: number; // frame it lands
  readonly rot?: number;
  readonly gray?: number;
  readonly tape?: boolean;
  readonly pos?: string;
  readonly caption?: string;
  readonly zoom?: number;
}> = ({ src, x, y, w, h, at = 0, rot = -3, gray = 0, tape = true, pos = "center", caption, zoom = 0.08 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const k = p01(frame, at, at + 14, ease.out);
  const kb = interpolate(frame, [at, durationInFrames], [1.04, 1.04 + zoom], clamp);
  if (frame < at) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h + (caption ? 56 : 0),
        padding: 12,
        paddingBottom: caption ? 64 : 12,
        background: "#f1efe9",
        boxShadow: "0 30px 60px rgba(0,0,0,0.6), 0 6px 14px rgba(0,0,0,0.5)",
        rotate: `${rot + (1 - k) * 14}deg`,
        translate: `${(1 - k) * 240}px ${(1 - k) * -160}px`,
        scale: `${1.25 - 0.25 * k}`,
        opacity: k,
      }}
    >
      <div style={{ width: "100%", height: h - 24, overflow: "hidden", background: "#111" }}>
        <Img
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, scale: `${kb}`, filter: `grayscale(${gray}) contrast(1.06)` }}
        />
      </div>
      {caption ? (
        <div style={{ position: "absolute", bottom: 12, left: 16, right: 16, fontFamily: headFont, fontWeight: 700, fontSize: 30, color: "#1b1b1b", lineHeight: 1.3 }}>
          {caption}
        </div>
      ) : null}
      {tape ? (
        <div style={{ position: "absolute", top: -16, left: "50%", width: 130, height: 36, translate: "-50% 0", rotate: `${-rot * 2}deg`, background: "rgba(235,225,190,0.75)", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }} />
      ) : null}
    </div>
  );
};

/* ============================================================ type */
/**
 * Kinetic text: words rise out of a mask one after another (stagger frames), with blur-in.
 * `at` = frame the first word starts. Use for headlines / key lines.
 */
export const KText: React.FC<{
  readonly text: string;
  readonly at?: number;
  readonly stagger?: number;
  readonly size?: number;
  readonly color?: string;
  readonly font?: "head" | "num";
  readonly weight?: number;
  readonly style?: React.CSSProperties;
  readonly glow?: string;
  readonly align?: "left" | "center" | "right";
}> = ({ text, at = 0, stagger = 3, size = 96, color = N.ink, font = "head", weight = 800, style, glow, align = "center" }) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : align === "left" ? "flex-start" : "flex-end",
        gap: `0 ${size * 0.25}px`,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const k = p01(frame, at + i * stagger, at + i * stagger + 12, ease.out);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", padding: `${size * 0.3}px 0.06em ${size * 0.26}px`, margin: `${-size * 0.18}px 0` }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: font === "num" ? numFont : headFont,
                fontWeight: weight,
                fontSize: size,
                lineHeight: 1.25,
                color,
                translate: `0 ${(1 - k) * 110}%`,
                filter: k < 1 ? `blur(${(1 - k) * 8}px)` : undefined,
                textShadow: glow ? `0 0 ${size * 0.4}px ${glow}, 0 6px 30px rgba(0,0,0,0.7)` : "0 6px 30px rgba(0,0,0,0.7)",
              }}
            >
              {w}
            </span>
          </span>
        );
      })}
    </div>
  );
};

/** Rolling number with easing; format with fmt. */
export const Counter: React.FC<{
  readonly from?: number;
  readonly to: number;
  readonly a: number;
  readonly b: number;
  readonly fmt?: (v: number) => string;
  readonly style?: React.CSSProperties;
}> = ({ from = 0, to, a, b, fmt = (v) => v.toFixed(0), style }) => {
  const frame = useCurrentFrame();
  const v = from + (to - from) * p01(frame, a, b, ease.out);
  return <span style={{ fontFamily: numFont, fontVariantNumeric: "tabular-nums", ...style }}>{fmt(v)}</span>;
};

/** Hand-drawn marker stroke under / around something (SVG path drawn over [a, a+len]). */
export const Marker: React.FC<{
  readonly d: string;
  readonly at: number;
  readonly len?: number;
  readonly color?: string;
  readonly width?: number;
  readonly style?: React.CSSProperties;
}> = ({ d, at, len = 12, color = N.green, width = 10, style }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, at, at + len, ease.inOut);
  return (
    <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - k} style={{ filter: `drop-shadow(0 0 10px ${color}88)` }} />
    </svg>
  );
};

/** Top-left documentary chapter tag, e.g. "০১ · এনভিডিয়া কী" */
export const ChapterTag: React.FC<{ readonly n: string; readonly title: string; readonly at?: number }> = ({ n, title, at = 0 }) => {
  const frame = useCurrentFrame();
  const k = p01(frame, at, at + 16);
  return (
    <div style={{ position: "absolute", left: 96, top: 64, display: "flex", alignItems: "center", gap: 18, opacity: k, translate: `${(1 - k) * -40}px 0` }}>
      <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 28, color: "#0a0f02", background: N.green, padding: "4px 12px" }}>{n}</div>
      <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 34, color: N.ink, letterSpacing: 1 }}>{title}</div>
      <div style={{ width: 160 * k, height: 2, background: `linear-gradient(90deg, ${N.green}, transparent)` }} />
    </div>
  );
};

/* ============================================================ grade */
/** Final look over everything: grade, vignette, grain, slow light sweep. */
export const Grade: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(10,30,20,0.10), transparent 30%, transparent 70%, rgba(0,0,0,0.35))" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)" }} />
      <AbsoluteFill
        style={{
          opacity: 0.09,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundPosition: `${(frame * 71) % 256}px ${(frame * 37) % 256}px`,
        }}
      />
    </AbsoluteFill>
  );
};
