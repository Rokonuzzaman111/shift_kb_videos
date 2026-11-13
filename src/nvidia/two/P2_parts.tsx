/** P2 helpers — 1990s film look and illustrated diner sets (owner: scene agent A). Deterministic. */
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { clamp, numFont } from "../theme";

/** Warm 90s film stock: sepia grade, gate weave, flicker, scratches, dust. Wrap a whole beat. */
export const Film: React.FC<{ readonly children: React.ReactNode; readonly amount?: number; readonly red?: boolean }> = ({ children, amount = 1, red = false }) => {
  const frame = useCurrentFrame();
  const wx = (random(`wx${frame}`) - 0.5) * 3 * amount;
  const wy = (random(`wy${frame}`) - 0.5) * 3 * amount;
  const fl = 1 + (random(`fl${frame}`) - 0.5) * 0.08 * amount;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ translate: `${wx}px ${wy}px`, filter: `sepia(${0.45 * amount}) saturate(${1 - 0.1 * amount}) brightness(${fl}) contrast(1.05)` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: red ? "rgba(140,20,10,0.22)" : "rgba(255,170,80,0.10)", mixBlendMode: "overlay", opacity: amount }} />
      {Array.from({ length: 3 }).map((_, i) => {
        const on = random(`sc${i}${Math.floor(frame / 4)}`) > 0.55;
        return on ? (
          <div
            key={i}
            style={{ position: "absolute", top: 0, bottom: 0, left: random(`sx${i}${Math.floor(frame / 4)}`) * 1920, width: 1.5, background: "rgba(255,240,210,0.35)", opacity: amount }}
          />
        ) : null;
      })}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: random(`dx${i}${frame}`) * 1920,
            top: random(`dy${i}${frame}`) * 1080,
            width: 2 + random(`dw${i}${frame}`) * 5,
            height: 2 + random(`dh${i}${frame}`) * 5,
            borderRadius: "50%",
            background: "rgba(20,10,0,0.6)",
            opacity: random(`do${i}${frame}`) > 0.6 ? amount : 0,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** Night street with a retro diner; neon switches on at `neon` (frame). */
export const DinerStreet: React.FC<{ readonly neon: number }> = ({ neon }) => {
  const frame = useCurrentFrame();
  const flick = frame < neon ? 0.08 : frame < neon + 8 ? (random(`nf${frame}`) > 0.4 ? 1 : 0.2) : 0.92 + 0.08 * Math.sin(frame / 3);
  const t = frame / 30;
  return (
    <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="p2sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0f24" />
          <stop offset="0.7" stopColor="#3a2340" />
          <stop offset="1" stopColor="#6a3a2a" />
        </linearGradient>
        <linearGradient id="p2win" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd48a" />
          <stop offset="1" stopColor="#ff9a4a" />
        </linearGradient>
        <filter id="p2neon">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="p2soft">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>
      <rect width={1920} height={1080} fill="url(#p2sky)" />
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={random(`st${i}`) * 1920} cy={random(`sy${i}`) * 380} r={1 + random(`sr${i}`) * 1.6} fill="#fff" opacity={0.3 + 0.4 * Math.abs(Math.sin(t + i))} />
      ))}
      {/* far skyline */}
      {Array.from({ length: 16 }).map((_, i) => {
        const h = 120 + random(`bh${i}`) * 260;
        return <rect key={i} x={i * 125 - 20} y={720 - h} width={110} height={h} fill="#141428" />;
      })}
      {/* palm */}
      <path d="M1660 720 Q1670 520 1640 380" stroke="#120d18" strokeWidth={16} fill="none" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M1640 380 q${-90 + i * 45} ${-40 + Math.abs(i - 2) * 30} ${-150 + i * 75} ${30 + Math.abs(i - 2) * 30}`} stroke="#120d18" strokeWidth={14} fill="none" strokeLinecap="round" />
      ))}
      {/* diner */}
      <rect x={300} y={470} width={1180} height={300} rx={20} fill="#c9c2b5" />
      <rect x={300} y={470} width={1180} height={300} rx={20} fill="#2a1a10" opacity={0.55} />
      <rect x={280} y={440} width={1220} height={44} rx={10} fill="#8a1d1d" />
      <rect x={300} y={700} width={1180} height={22} fill="#b5b5b5" opacity={0.6} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x={350 + i * 180} y={520} width={150} height={150} rx={8} fill="url(#p2win)" opacity={0.9} />
          <rect x={350 + i * 180} y={520} width={150} height={150} rx={8} fill="none" stroke="#3a2a1a" strokeWidth={6} />
          {i % 2 === 0 ? <circle cx={425 + i * 180} cy={640} r={26} fill="#3a1d10" opacity={0.75} /> : null}
          {i % 2 === 0 ? <rect x={399 + i * 180} y={660} width={52} height={20} fill="#3a1d10" opacity={0.75} /> : null}
        </g>
      ))}
      <ellipse cx={890} cy={620} rx={700} ry={200} fill="#ffb060" opacity={0.18} filter="url(#p2soft)" />
      {/* neon sign */}
      <g opacity={flick}>
        <text x={890} y={410} textAnchor="middle" fontFamily={numFont} fontWeight={900} fontSize={120} fill="none" stroke="#ff3a6a" strokeWidth={10} filter="url(#p2neon)">
          DINER
        </text>
        <text x={890} y={410} textAnchor="middle" fontFamily={numFont} fontWeight={900} fontSize={120} fill="none" stroke="#ffd0dc" strokeWidth={3}>
          DINER
        </text>
        <text x={1360} y={420} textAnchor="middle" fontFamily={numFont} fontWeight={900} fontSize={46} fill="#7affd0" filter="url(#p2neon)">
          OPEN 24H
        </text>
        <text x={1360} y={420} textAnchor="middle" fontFamily={numFont} fontWeight={900} fontSize={46} fill="#e8fff6">
          OPEN 24H
        </text>
      </g>
      <rect x={720} y={300} width={340} height={10} fill="#333" opacity={1 - flick * 0.5} />
      {/* street */}
      <rect x={0} y={770} width={1920} height={310} fill="#151216" />
      <rect x={0} y={770} width={1920} height={310} fill="#ff6a3a" opacity={0.06 + 0.06 * flick} />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={((i * 300 - t * 40) % 2400) - 200} y={940} width={150} height={10} fill="#d8c27a" opacity={0.5} />
      ))}
      {/* vintage car */}
      <g transform={`translate(${interpolate(frame, [0, 120], [-500, 2100], clamp)} 0)`}>
        <path d="M0 860 L40 815 L120 800 L170 765 L320 765 L380 805 L470 815 L490 860 Z" fill="#2c3a4a" />
        <rect x={180} y={775} width={60} height={30} fill="#ffd48a" opacity={0.5} />
        <circle cx={100} cy={862} r={28} fill="#0a0a0a" />
        <circle cx={400} cy={862} r={28} fill="#0a0a0a" />
        <ellipse cx={520} cy={840} rx={90} ry={16} fill="#fff4c0" opacity={0.25} filter="url(#p2neon)" />
      </g>
    </svg>
  );
};

/** Diner booth interior with three engineers; `pop` = frames they appear, `sketch` 0..1 napkin drawing, `focus` dims the two side figures. */
export const Booth: React.FC<{ readonly pop: number[]; readonly sketch: number; readonly focus: number }> = ({ pop, sketch, focus }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const people = [
    { x: 560, hair: "#2a1d14", shirt: "#4a6a8a", glasses: true },
    { x: 960, hair: "#0d0d0d", shirt: "#2a2a2a", glasses: true },
    { x: 1360, hair: "#6a4a2a", shirt: "#7a3a3a", glasses: false },
  ];
  return (
    <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="p2wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a2e1c" />
          <stop offset="1" stopColor="#24160e" />
        </linearGradient>
        <radialGradient id="p2lamp" cx="0.5" cy="0" r="0.8">
          <stop offset="0" stopColor="#ffd090" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd090" stopOpacity="0" />
        </radialGradient>
        <filter id="p2b">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <rect width={1920} height={1080} fill="url(#p2wall)" />
      {/* window to night street */}
      <rect x={260} y={90} width={1400} height={360} rx={14} fill="#0e1428" />
      {Array.from({ length: 14 }).map((_, i) => (
        <circle key={i} cx={300 + i * 100 + Math.sin(t + i) * 4} cy={300 + (i % 3) * 30} r={10 + (i % 4) * 6} fill={i % 3 ? "#ffb060" : "#ff4a7a"} opacity={0.3} filter="url(#p2b)" />
      ))}
      <rect x={260} y={90} width={1400} height={360} rx={14} fill="none" stroke="#1a100a" strokeWidth={16} />
      <line x1={960} y1={90} x2={960} y2={450} stroke="#1a100a" strokeWidth={12} />
      {/* booth back */}
      <rect x={180} y={430} width={1560} height={260} rx={50} fill="#8a1d1d" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={230 + i * 125} y={450} width={8} height={220} fill="#6a1414" />
      ))}
      <rect width={1920} height={1080} fill="url(#p2lamp)" />
      {/* people */}
      {people.map((p, i) => {
        const k = interpolate(frame, [pop[i], pop[i] + 10], [0, 1], clamp);
        const dim = i === 1 ? 0 : focus;
        const bob = Math.sin(t * 1.4 + i * 2) * 4;
        return (
          <g key={i} opacity={k * (1 - dim * 0.65)} transform={`translate(${p.x} ${560 + (1 - k) * 60 + bob})`}>
            <path d="M-150 260 Q-150 80 0 70 Q150 80 150 260 Z" fill={p.shirt} />
            <rect x={-22} y={20} width={44} height={60} fill="#c9946c" />
            <ellipse cx={0} cy={-30} rx={72} ry={84} fill="#d9a77c" />
            <path d="M-74 -40 Q-70 -125 0 -122 Q70 -125 74 -40 Q60 -90 0 -92 Q-60 -90 -74 -40 Z" fill={p.hair} />
            {p.glasses ? (
              <g stroke="#111" strokeWidth={5} fill="rgba(255,255,255,0.15)">
                <rect x={-58} y={-46} width={44} height={32} rx={8} />
                <rect x={14} y={-46} width={44} height={32} rx={8} />
                <line x1={-14} y1={-32} x2={14} y2={-32} />
              </g>
            ) : (
              <g fill="#111">
                <circle cx={-26} cy={-30} r={6} />
                <circle cx={26} cy={-30} r={6} />
              </g>
            )}
            <path d="M-20 18 Q0 28 20 18" stroke="#7a4b33" strokeWidth={5} fill="none" strokeLinecap="round" />
          </g>
        );
      })}
      {i1Spot(focus)}
      {/* table */}
      <path d="M120 760 L1800 760 L1920 1080 L0 1080 Z" fill="#d8d0c0" />
      <path d="M120 760 L1800 760 L1810 790 L110 790 Z" fill="#a89c88" />
      {[520, 1400].map((x, i) => (
        <g key={i}>
          <path d={`M${x - 50} 760 L${x + 50} 760 L${x + 40} 860 L${x - 40} 860 Z`} fill="#f2efe8" />
          <ellipse cx={x} cy={760} rx={50} ry={12} fill="#3a1d10" />
          <path d={`M${x + 50} 780 q40 10 0 50`} stroke="#f2efe8" strokeWidth={10} fill="none" />
          {[0, 1].map((s) => (
            <path key={s} d={`M${x - 14 + s * 26} 740 q${12 * Math.sin(t * 2 + s)} -30 0 -60 q${-12 * Math.sin(t * 2 + s)} -30 0 -60`} stroke="#fff" strokeWidth={6} fill="none" opacity={0.25} filter="url(#p2b)" />
          ))}
        </g>
      ))}
      {/* napkin + sketch */}
      <g transform="translate(960 900) rotate(-4)">
        <rect x={-190} y={-110} width={380} height={230} fill="#fbfaf6" />
        <rect x={-190} y={-110} width={380} height={230} fill="none" stroke="#e2ddd0" strokeWidth={4} />
        <g stroke="#1d3fbf" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-120 -60 L-20 -60 L-20 40 L-120 40 Z M-100 -40 L-40 -40 L-40 20 L-100 20 Z" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.min(1, sketch * 2)} />
          <path d="M-20 -10 L40 -10 M30 -20 L40 -10 L30 0" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, Math.min(1, sketch * 3 - 1))} />
          <path d="M60 30 L60 -50 L140 -70 L140 10 Z M60 -50 L140 -70 M80 -10 L120 -20" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - Math.max(0, Math.min(1, sketch * 2 - 1))} />
        </g>
        <text x={0} y={95} textAnchor="middle" fontFamily="'Segoe Print', 'Comic Sans MS', cursive" fontSize={34} fill="#1d3fbf" opacity={Math.max(0, sketch * 2 - 1)}>
          3D graphics chip?
        </text>
      </g>
    </svg>
  );
};

const i1Spot = (focus: number) =>
  focus > 0 ? <ellipse cx={960} cy={520} rx={260} ry={340} fill="#ffe0a0" opacity={0.12 * focus} style={{ mixBlendMode: "screen" }} /> : null;

/** Small person icon (for staff grid), centred bottom at (0,0), ~60 tall. */
export const Staff: React.FC<{ readonly x: number; readonly y: number; readonly color: string; readonly o?: number }> = ({ x, y, color, o = 1 }) => (
  <g transform={`translate(${x} ${y})`} opacity={o}>
    <circle cx={0} cy={-46} r={12} fill={color} />
    <path d="M-20 0 Q-20 -30 0 -30 Q20 -30 20 0 Z" fill={color} />
  </g>
);

