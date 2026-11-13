/**
 * OWNER: motion2d agent. SH4 · energy (~5.5 s). "অর্থাৎ চা আপনাকে এনার্জি দেয় না। শুধু ক্লান্তিটা টের পেতে দেয় না।"
 *  A (0 → শুধু): battery. Cyan caffeine dots stream in from a tea cup; a dashed "expected" charge rises,
 *     but the real charge stays low. Title "এনার্জি" pops on its word; on "না" the expectation collapses,
 *     a red ✕ draws over the battery and the title gets struck through.
 *  B (শুধু → end, hard cut): student wide awake with tired eyes (exam hall, dimmed) + tiredness meter at 85%
 *     (amber). On "টের" a cyan frosted cover slides down over the meter with a mute icon. Title
 *     "ক্লান্তি চাপা পড়ে".
 */
import { AbsoluteFill, Easing, interpolate, spring, useVideoConfig } from "remotion";
import { useSeconds } from "../../kit/time";
import { Cam, Motes, WarmBg } from "../two/Kit2D";
import { Student } from "../two/Student";
import { K } from "../theme";
import type { Cue } from "../types";
import { Title } from "../ui/Text";
import { shotDuration, wordAt } from "../vo";

export const SH4_DURATION = shotDuration("energy");
/** Caption words (exact VO tokens) to highlight. */
export const SH4_KEYWORDS: string[] = ["এনার্জি", "না", "ক্লান্তিটা"];

const T = {
  energy: wordAt("energy", "এনার্জি"),
  na: wordAt("energy", "না"),
  cut: wordAt("energy", "শুধু"),
  tired: wordAt("energy", "ক্লান্তিটা"),
  ter: wordAt("energy", "টের"),
};

/** Sound cues for this shot (sparse!). */
export const SH4_CUES: Cue[] = [
  { at: T.na, sfx: "power_down", volume: 0.6 },
];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const p = (t: number, a: number, b: number, e: (x: number) => number = Easing.inOut(Easing.cubic)) =>
  interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });

/* ---------------- Part A: battery ---------------- */

const Battery: React.FC<{ t: number }> = ({ t }) => {
  const { fps } = useVideoConfig();
  const W = 330;
  const H = 560;
  const level = 0.18 + Math.sin(t * 9) * 0.004; // stays low
  // expected (ghost) charge rises while caffeine flows, collapses on "না"
  const ghostUp = p(t, 0.5, T.na - 0.05, Easing.out(Easing.cubic));
  const ghostDown = p(t, T.na, T.na + 0.35, Easing.in(Easing.cubic));
  const ghost = 0.18 + 0.64 * ghostUp * (1 - ghostDown);
  // the real fill "tries": tiny flicker while dots arrive
  const tries = t > 0.6 && t < T.na ? Math.max(0, Math.sin(t * 22)) * 0.025 : 0;
  const shake = t > T.na && t < T.na + 0.4 ? Math.sin((t - T.na) * 70) * 10 * (1 - (t - T.na) / 0.4) : 0;
  const xDraw1 = p(t, T.na, T.na + 0.18, Easing.out(Easing.cubic));
  const xDraw2 = p(t, T.na + 0.1, T.na + 0.28, Easing.out(Easing.cubic));
  const xPop = spring({ frame: Math.round((t - T.na) * fps), fps, config: { damping: 9, stiffness: 220 } });
  const zoomOnNoun = spring({ frame: Math.round((t - T.energy) * fps), fps, config: { damping: 14, stiffness: 120 } });
  const bodyScale = 1 + 0.05 * zoomOnNoun;
  const inner = { x: 22, y: 22, w: W - 44, h: H - 44 };
  const fillH = inner.h * (level + tries);
  const ghostH = inner.h * ghost;

  return (
    <div
      style={{
        position: "absolute",
        left: 540 - W / 2,
        top: 875 - H / 2,
        width: W,
        height: H,
        translate: `${shake}px 0px`,
        scale: bodyScale,
      }}
    >
      <svg width={W} height={H + 60} viewBox={`0 -60 ${W} ${H + 60}`} style={{ overflow: "visible", position: "absolute", top: -60 }}>
        <defs>
          <linearGradient id="sh4-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3a2a20" />
            <stop offset="0.35" stopColor="#4d382a" />
            <stop offset="1" stopColor="#2a1d15" />
          </linearGradient>
          <linearGradient id="sh4-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff8a6b" />
            <stop offset="1" stopColor={K.red} />
          </linearGradient>
          <clipPath id="sh4-inner">
            <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx={34} />
          </clipPath>
        </defs>
        {/* glow */}
        <ellipse cx={W / 2} cy={H / 2} rx={W * 0.9} ry={H * 0.62} fill={K.cyan} opacity={0.1 + ghostUp * (1 - ghostDown) * 0.12} style={{ filter: "blur(40px)" }} />
        {/* terminal */}
        <rect x={W / 2 - 62} y={-34} width={124} height={50} rx={14} fill="#5a4334" />
        <rect x={W / 2 - 62} y={-34} width={124} height={12} rx={6} fill="#7a5d48" />
        {/* body */}
        <rect x={0} y={0} width={W} height={H} rx={52} fill="url(#sh4-body)" stroke="#8a6a52" strokeWidth={8} />
        <g clipPath="url(#sh4-inner)">
          <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill="#120c09" />
          {/* ghost (expected) charge */}
          <rect
            x={inner.x + 8}
            y={inner.y + inner.h - ghostH}
            width={inner.w - 16}
            height={ghostH}
            rx={22}
            fill={K.cyan}
            fillOpacity={0.12}
            stroke={K.cyan}
            strokeWidth={5}
            strokeDasharray="18 14"
            strokeDashoffset={-t * 60}
            opacity={ghostUp * (1 - ghostDown * 0.9)}
          />
          {/* real charge */}
          <rect x={inner.x} y={inner.y + inner.h - fillH} width={inner.w} height={fillH} fill="url(#sh4-fill)" />
          <rect x={inner.x} y={inner.y + inner.h - fillH} width={inner.w} height={6} fill="#ffc3b0" opacity={0.7} />
        </g>
        {/* highlight */}
        <rect x={26} y={30} width={22} height={H - 120} rx={11} fill="#fff" opacity={0.06} />
        {/* bolt */}
        <path
          d={`M${W / 2 + 22} ${H / 2 - 120} L${W / 2 - 52} ${H / 2 + 14} L${W / 2 - 4} ${H / 2 + 14} L${W / 2 - 24} ${H / 2 + 120} L${W / 2 + 52} ${H / 2 - 18} L${W / 2 + 4} ${H / 2 - 18} Z`}
          fill="none"
          stroke={K.ink}
          strokeOpacity={0.28}
          strokeWidth={8}
          strokeLinejoin="round"
        />
        {/* red X */}
        <g style={{ transformOrigin: `${W / 2}px ${H / 2}px`, scale: t >= T.na ? 0.8 + 0.2 * xPop : 1 }}>
          <path
            d={`M${-30} ${H / 2 - 210} L${W + 30} ${H / 2 + 210}`}
            stroke={K.red}
            strokeWidth={34}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - xDraw1}
            opacity={xDraw1 > 0 ? 1 : 0}
            style={{ filter: `drop-shadow(0 0 18px ${K.red}aa)` }}
          />
          <path
            d={`M${W + 30} ${H / 2 - 210} L${-30} ${H / 2 + 210}`}
            stroke={K.red}
            strokeWidth={34}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - xDraw2}
            opacity={xDraw2 > 0 ? 1 : 0}
            style={{ filter: `drop-shadow(0 0 18px ${K.red}aa)` }}
          />
        </g>
      </svg>
    </div>
  );
};

/** Small 2D tea glass at the left, caffeine dots arc from it into the battery. */
const TeaStream: React.FC<{ t: number }> = ({ t }) => {
  const appear = p(t, 0.05, 0.45, Easing.out(Easing.back(1.6)));
  const flow = 1 - p(t, T.na - 0.1, T.na + 0.2);
  const cupX = 190;
  const cupY = 1080;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {/* stream dots along a curve cup → battery top */}
        {Array.from({ length: 14 }).map((_, i) => {
          const u = ((t * 0.9 + i / 14) % 1 + 1) % 1;
          const x0 = cupX;
          const y0 = cupY - 90;
          const x1 = 540;
          const y1 = 600;
          const cx = 240;
          const cy = 560;
          const x = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1;
          const y = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1;
          const o = Math.sin(u * Math.PI) * flow * (t > 0.45 ? 1 : 0);
          return <circle key={i} cx={x} cy={y} r={9 + Math.sin(i * 1.7) * 3} fill={K.cyan} opacity={o * 0.9} style={{ filter: `drop-shadow(0 0 10px ${K.cyan})` }} />;
        })}
      </svg>
      <svg
        width={180}
        height={220}
        viewBox="0 0 180 220"
        style={{ position: "absolute", left: cupX - 90, top: cupY - 120, scale: appear, transformOrigin: "50% 100%" }}
      >
        {/* steam */}
        {[0, 1].map((i) => (
          <path
            key={i}
            d={`M${70 + i * 34} 40 q-14 -16 0 -30 q14 -14 0 -30`}
            stroke="#f7f1e8"
            strokeOpacity={0.25 + Math.sin(t * 3 + i) * 0.1}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
            transform={`translate(${Math.sin(t * 2 + i) * 4} ${-((t * 18 + i * 10) % 14)})`}
          />
        ))}
        {/* glass */}
        <path d="M30 60 L150 60 L136 200 Q90 212 44 200 Z" fill="rgba(255,240,220,0.14)" stroke="rgba(255,240,220,0.55)" strokeWidth={5} />
        <path d="M38 92 L142 92 L134 196 Q90 206 46 196 Z" fill={K.tea} />
        <ellipse cx={90} cy={92} rx={52} ry={9} fill="#e0a56b" />
        <rect x={44} y={100} width={10} height={80} rx={5} fill="#fff" opacity={0.18} />
      </svg>
    </>
  );
};

const StrikeThrough: React.FC<{ t: number }> = ({ t }) => {
  const k = p(t, T.na + 0.05, T.na + 0.3, Easing.out(Easing.cubic));
  if (k <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - 220,
        top: 334,
        width: 440,
        height: 16,
        borderRadius: 99,
        background: K.red,
        boxShadow: `0 0 20px ${K.red}aa, 0 4px 10px rgba(0,0,0,0.5)`,
        transformOrigin: "left center",
        scale: `${k} 1`,
        rotate: "-4deg",
      }}
    />
  );
};

/* ---------------- Part B: masked tiredness ---------------- */

const Meter: React.FC<{ t: number }> = ({ t }) => {
  const W = 170;
  const H = 560;
  const fill = interpolate(t, [T.cut + 0.1, T.tired + 0.4], [0.3, 0.85], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cover = p(t, T.ter, T.ter + 0.38, Easing.out(Easing.cubic));
  const settle = spring({ frame: Math.round((t - T.ter - 0.3) * 30), fps: 30, config: { damping: 10, stiffness: 200 } });
  const pulse = 0.5 + 0.5 * Math.sin(t * 7);
  const inner = { x: 18, y: 18, w: W - 36, h: H - 36 };
  return (
    <svg width={W + 120} height={H + 140} viewBox={`-60 -100 ${W + 120} ${H + 140}`} style={{ position: "absolute", left: 790 - W / 2 - 60, top: 640 - 100, overflow: "visible" }}>
      <defs>
        <linearGradient id="sh4-amber" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd08a" />
          <stop offset="1" stopColor="#e8902a" />
        </linearGradient>
        <clipPath id="sh4-meter">
          <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx={30} />
        </clipPath>
        <linearGradient id="sh4-cover" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8ee9ff" stopOpacity={0.92} />
          <stop offset="1" stopColor="#2aa6cf" stopOpacity={0.88} />
        </linearGradient>
      </defs>
      {/* sleepy icon: moon + z */}
      <g transform="translate(85 -52)" opacity={0.95}>
        <circle r={34} fill="#2a1d15" stroke={K.amber} strokeWidth={4} />
        <path d="M8 -20 A20 20 0 1 0 14 16 A15 15 0 1 1 8 -20 Z" fill={K.amber} />
      </g>
      <rect x={0} y={0} width={W} height={H} rx={46} fill="#24180f" stroke="#6a4d38" strokeWidth={7} />
      <g clipPath="url(#sh4-meter)">
        <rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} fill="#120c09" />
        <rect x={inner.x} y={inner.y + inner.h * (1 - fill)} width={inner.w} height={inner.h * fill} fill="url(#sh4-amber)" />
        <rect x={inner.x} y={inner.y + inner.h * (1 - fill)} width={inner.w} height={8} fill="#fff1c9" opacity={0.6 + pulse * 0.3} />
        {[0.25, 0.5, 0.75].map((k) => (
          <rect key={k} x={inner.x} y={inner.y + inner.h * k} width={inner.w} height={3} fill="#000" opacity={0.25} />
        ))}
      </g>
      {/* amber glow (alive under the cover) */}
      <rect x={-10} y={inner.y + inner.h * (1 - fill)} width={W + 20} height={inner.h * fill} rx={40} fill={K.amber} opacity={0.12 + pulse * 0.06} style={{ filter: "blur(14px)" }} />
      {/* cyan cover slides down from above */}
      <g transform={`translate(0 ${(1 - cover) * -(H + 120) + (cover >= 1 ? (1 - settle) * 10 : 0)})`} opacity={cover > 0 ? 1 : 0}>
        <rect x={-20} y={-14} width={W + 40} height={H + 28} rx={56} fill="url(#sh4-cover)" opacity={0.72} style={{ filter: `drop-shadow(0 0 26px ${K.cyan}88)` }} />
        <rect x={-20} y={-14} width={W + 40} height={H + 28} rx={56} fill="none" stroke="#dff8ff" strokeWidth={4} opacity={0.7} />
        {/* frosted stripes */}
        {[0.2, 0.42, 0.64].map((k) => (
          <rect key={k} x={8} y={H * k} width={W - 16} height={10} rx={5} fill="#ffffff" opacity={0.18} />
        ))}
        {/* mute icon */}
        <g transform={`translate(${W / 2} ${H * 0.82}) scale(1.15)`}>
          <circle r={50} fill="#0c3a4a" opacity={0.85} />
          <path d="M-26 -12 L-12 -12 L6 -28 L6 28 L-12 12 L-26 12 Z" fill="#dff8ff" />
          <path d="M16 -16 L36 16 M36 -16 L16 16" stroke="#dff8ff" strokeWidth={7} strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};

export const SH4Energy: React.FC = () => {
  const t = useSeconds();
  const partB = t >= T.cut;

  if (!partB) {
    const push = interpolate(t, [0, T.cut], [1.0, 1.07], { ...clamp, easing: Easing.bezier(0.33, 0, 0.4, 1) });
    return (
      <AbsoluteFill style={{ background: K.bg }}>
        <Cam t={t} scale={push * 1.02} fy={880}>
          <WarmBg glow="rgba(71,215,255,0.10)" cy={880} />
        </Cam>
        <Cam t={t} scale={push * 1.04} y={-6} fy={880} drift={0.6}>
          <Motes t={t} n={16} />
        </Cam>
        <Cam t={t} scale={push} fy={880}>
          <TeaStream t={t} />
          <Battery t={t} />
        </Cam>
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 80, right: 80, top: 230 }}>
            <Title at={T.energy} size={130} color={K.ink} accent={K.cyan}>
              এনার্জি
            </Title>
          </div>
          <StrikeThrough t={t} />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const lt = t - T.cut;
  const push = interpolate(lt, [0, SH4_DURATION - T.cut], [1.0, 1.06], { ...clamp, easing: Easing.bezier(0.33, 0, 0.4, 1) });
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      <Cam t={t} scale={push * 1.03} x={-lt * 6} fy={900} drift={0.5}>
        <div style={{ position: "absolute", inset: 0, filter: "blur(3px) brightness(0.55) saturate(0.8)" }}>
          {/* sunny 4 pm room: warm wall with venetian-blind light stripes (same light as the hook) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse 80% 60% at 30% 35%, #c9935e 0%, #7a5236 45%, #2a1a10 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "-20%",
              rotate: "-14deg",
              background: "repeating-linear-gradient(180deg, rgba(255,214,150,0.28) 0px, rgba(255,214,150,0.28) 46px, rgba(0,0,0,0) 46px, rgba(0,0,0,0) 92px)",
              maskImage: "radial-gradient(ellipse 60% 45% at 35% 35%, #000 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse 60% 45% at 35% 35%, #000 30%, transparent 75%)",
            }}
          />
        </div>
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(13,8,6,0.55) 0%, rgba(13,8,6,0.1) 35%, rgba(13,8,6,0.2) 65%, rgba(13,8,6,0.85) 100%)" }} />
      </Cam>
      <Cam t={t} scale={push} fy={900}>
        {/* soft key light behind student */}
        <div style={{ position: "absolute", left: 40, top: 560, width: 620, height: 700, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(255,214,160,0.22), rgba(0,0,0,0))" }} />
        <Student t={t} pose="awake-tired" width={580} style={{ position: "absolute", left: 50, top: 1250 - 580 * 1.25 }} />
        <Meter t={t} />
      </Cam>
      <AbsoluteFill>
        <div style={{ position: "absolute", left: 60, right: 60, top: 250 }}>
          <Title at={T.tired} size={104} accent={K.cyan}>
            ক্লান্তি চাপা পড়ে
          </Title>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
