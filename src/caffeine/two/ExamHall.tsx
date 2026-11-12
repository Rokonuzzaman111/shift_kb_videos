/**
 * OWNER: motion2d agent.
 * Full-frame (1080x1920) 2D exam hall: back wall with blackboard, wall clock, window light shafts,
 * rotating ceiling fan, invigilator silhouette, rows of desks in perspective with other students as
 * soft silhouettes (depth-blurred). The centre column is left clear from y≈1000 down so a <Student/>
 * can sit in the hero zone (y 520–1250). `t` (shot seconds) drives subtle life: fan, clock, light
 * flicker, invigilator sway and slow parallax.
 */
import { useId } from "react";

const VP = { x: 540, y: 640 }; // vanishing point
const FLOOR_Y = 770;

type Row = { y: number; s: number; cols: number[]; blur: number; dim: number };

// depth rows (far → near). Near rows keep the centre free for the hero student.
const ROWS: Row[] = [
  { y: 830, s: 0.34, cols: [-3, -2, -1, 0, 1, 2, 3], blur: 2.2, dim: 0.55 },
  { y: 905, s: 0.45, cols: [-3, -2, -1, 0, 1, 2, 3], blur: 1.8, dim: 0.62 },
  { y: 1010, s: 0.6, cols: [-3, -2, -1, 1, 2, 3], blur: 1.6, dim: 0.7 },
  { y: 1170, s: 0.82, cols: [-2, -1.35, 1.35, 2], blur: 2.4, dim: 0.78 },
  { y: 1430, s: 1.12, cols: [-1.45, 1.45], blur: 5, dim: 0.62 },
  { y: 1800, s: 1.5, cols: [-1.2, 1.2], blur: 8, dim: 0.45 },
];

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const DeskWithStudent: React.FC<{ x: number; y: number; s: number; seed: number; t: number; showStudent: boolean }> = ({ x, y, s, seed, t, showStudent }) => {
  const w = 240 * s;
  const h = 26 * s;
  const lean = (hash(seed) - 0.5) * 10;
  const bob = Math.sin(t * (0.6 + hash(seed + 3) * 0.6) + seed) * 2.5 * s;
  const headR = 30 * s * (0.92 + hash(seed + 7) * 0.16);
  const hair = hash(seed + 11) > 0.5;
  return (
    <g>
      {showStudent ? (
        <g transform={`translate(${x} ${y}) rotate(${lean}) translate(0 ${bob})`}>
          {/* shoulders */}
          <path
            d={`M${-62 * s} 0 C${-60 * s} ${-60 * s} ${-36 * s} ${-74 * s} 0 ${-76 * s} C${36 * s} ${-74 * s} ${60 * s} ${-60 * s} ${62 * s} 0 Z`}
            fill="#c9cdd2"
          />
          <rect x={-10 * s} y={-92 * s} width={20 * s} height={20 * s} fill="#6e4a33" />
          {/* head */}
          <circle cx={0} cy={-112 * s} r={headR} fill="#7a4f34" />
          <path d={`M${-headR} ${-112 * s} A${headR} ${headR} 0 0 1 ${headR} ${-112 * s} Q0 ${-128 * s} ${-headR} ${-112 * s} Z`} fill="#16110e" />
          {hair ? <ellipse cx={0} cy={-120 * s} rx={headR * 1.08} ry={headR * 0.8} fill="#16110e" opacity={0.95} /> : null}
        </g>
      ) : null}
      {/* desk top + front */}
      <path d={`M${x - w / 2} ${y} L${x + w / 2} ${y} L${x + w / 2 + 10 * s} ${y + h} L${x - w / 2 - 10 * s} ${y + h} Z`} fill="#a06b42" />
      <rect x={x - w / 2 - 10 * s} y={y + h} width={w + 20 * s} height={70 * s} fill="#5e3a23" />
      <rect x={x - w / 2 - 4 * s} y={y + h + 70 * s} width={8 * s} height={60 * s} fill="#3c2516" />
      <rect x={x + w / 2 - 4 * s} y={y + h + 70 * s} width={8 * s} height={60 * s} fill="#3c2516" />
      {/* paper */}
      <path d={`M${x - 40 * s} ${y + 3 * s} L${x + 36 * s} ${y + 2 * s} L${x + 40 * s} ${y + h - 4 * s} L${x - 44 * s} ${y + h - 3 * s} Z`} fill="#e9e6de" />
    </g>
  );
};

export const ExamHall: React.FC<{ readonly t: number }> = ({ t }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (s: string) => `${s}-${uid}`;
  const par = Math.sin(t * 0.22) * 1; // slow parallax driver
  const flicker = 0.92 + Math.sin(t * 2.1) * 0.03 + Math.sin(t * 5.3) * 0.02;
  const fan = t * 300; // deg
  const minute = (10 * 60 + 10 + t / 6) % 60; // ~10:10, minute hand creeping
  const hour = 10 + minute / 60;
  const invX = 300 + Math.sin(t * 0.35) * 24;

  return (
    <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id={id("wall")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3c4440" />
          <stop offset="0.55" stopColor="#59625a" />
          <stop offset="1" stopColor="#4c534c" />
        </linearGradient>
        <linearGradient id={id("floor")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3f35" />
          <stop offset="0.5" stopColor="#30271f" />
          <stop offset="1" stopColor="#1a1410" />
        </linearGradient>
        <linearGradient id={id("shaft")} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe2a8" stopOpacity={0.32} />
          <stop offset="1" stopColor="#ffe2a8" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={id("window")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2cf" />
          <stop offset="1" stopColor="#f3c98a" />
        </linearGradient>
        <radialGradient id={id("vig")} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.5" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.6} />
        </radialGradient>
        <radialGradient id={id("pool")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity={0.22} />
          <stop offset="1" stopColor="#ffd9a0" stopOpacity={0} />
        </radialGradient>
        {[1.6, 2.2, 2.4, 5, 8, 1.8].map((b) => (
          <filter key={b} id={id(`b${String(b).replace(".", "_")}`)} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={b} />
          </filter>
        ))}
        <filter id={id("soft")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={3} />
        </filter>
      </defs>

      {/* ---------- back wall (furthest layer) ---------- */}
      <g transform={`translate(${par * 6} 0)`} filter={`url(#${id("soft")})`}>
        <rect x={-40} y={0} width={1160} height={FLOOR_Y} fill={`url(#${id("wall")})`} />
        {/* ceiling band */}
        <rect x={-40} y={0} width={1160} height={140} fill="#2a2f2c" />
        <rect x={-40} y={136} width={1160} height={8} fill="#1f2321" />
        {/* skirting */}
        <rect x={-40} y={FLOOR_Y - 26} width={1160} height={26} fill="#2f3430" />

        {/* blackboard */}
        <rect x={250} y={330} width={580} height={250} rx={8} fill="#5a3d27" />
        <rect x={264} y={344} width={552} height={222} rx={4} fill="#1e3a2d" />
        <g stroke="#e8efe4" strokeOpacity={0.35} strokeWidth={5} strokeLinecap="round" fill="none">
          <path d="M310 392 L470 392" />
          <path d="M310 432 L560 432" />
          <path d="M310 472 L420 472" />
          <path d="M610 400 q40 -30 80 0 t80 0" />
        </g>
        <rect x={264} y={566} width={552} height={10} fill="#3a2718" />

        {/* wall clock */}
        <g transform="translate(150 330)">
          <circle r={74} fill="#1c1f1d" />
          <circle r={64} fill="#efe9dc" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <line key={i} x1={Math.sin(a) * 52} y1={-Math.cos(a) * 52} x2={Math.sin(a) * 58} y2={-Math.cos(a) * 58} stroke="#2a2a2a" strokeWidth={i % 3 === 0 ? 5 : 2.5} />;
          })}
          <line x1={0} y1={0} x2={Math.sin((hour / 12) * Math.PI * 2) * 32} y2={-Math.cos((hour / 12) * Math.PI * 2) * 32} stroke="#1a1a1a" strokeWidth={7} strokeLinecap="round" />
          <line x1={0} y1={0} x2={Math.sin((minute / 60) * Math.PI * 2) * 48} y2={-Math.cos((minute / 60) * Math.PI * 2) * 48} stroke="#1a1a1a" strokeWidth={4.5} strokeLinecap="round" />
          <line x1={0} y1={8} x2={Math.sin(((t % 60) / 60) * Math.PI * 2) * 52} y2={-Math.cos(((t % 60) / 60) * Math.PI * 2) * 52} stroke="#d23c30" strokeWidth={2} />
          <circle r={5} fill="#d23c30" />
        </g>

        {/* window */}
        <g opacity={flicker}>
          <rect x={890} y={210} width={190} height={430} fill="#2a2f2c" />
          <rect x={902} y={222} width={178} height={406} fill={`url(#${id("window")})`} />
          {[960, 1020].map((x) => (
            <rect key={x} x={x} y={222} width={8} height={406} fill="#3a3f3b" />
          ))}
          {[320, 420, 520].map((y) => (
            <rect key={y} x={902} y={y} width={178} height={6} fill="#3a3f3b" />
          ))}
        </g>
      </g>

      {/* ---------- floor ---------- */}
      <rect x={0} y={FLOOR_Y} width={1080} height={1920 - FLOOR_Y} fill={`url(#${id("floor")})`} />
      <g stroke="#000" strokeOpacity={0.18} strokeWidth={2}>
        {Array.from({ length: 13 }).map((_, i) => {
          const x = -1400 + i * 320;
          return <line key={i} x1={VP.x + (x - VP.x) * 0.1} y1={FLOOR_Y} x2={x} y2={1920} />;
        })}
        {[800, 850, 920, 1020, 1170, 1400, 1760].map((y) => (
          <line key={y} x1={0} y1={y} x2={1080} y2={y} />
        ))}
      </g>

      {/* ---------- light shafts from window ---------- */}
      <g opacity={flicker} style={{ mixBlendMode: "screen" }}>
        <polygon points="902,222 1080,222 1080,640 420,1500 120,1500" fill={`url(#${id("shaft")})`} opacity={0.55} />
        <polygon points="960,222 1020,222 700,1200 560,1200" fill={`url(#${id("shaft")})`} opacity={0.35} />
      </g>

      {/* ---------- ceiling fan ---------- */}
      <g transform={`translate(540 150)`} filter={`url(#${id("b1_6")})`}>
        <rect x={-4} y={-150} width={8} height={130} fill="#1b1e1c" />
        <g transform="translate(0 -14) scale(1 0.22)">
          {[0, 120, 240].map((a) => (
            <g key={a} transform={`rotate(${a + fan})`}>
              <path d="M0 -14 L250 -24 Q268 0 250 24 L0 14 Z" fill="#2c302d" opacity={0.85} />
            </g>
          ))}
          {/* motion blur disc */}
          <circle r={262} fill="#2c302d" opacity={0.18} />
        </g>
        <ellipse cx={0} cy={-14} rx={34} ry={16} fill="#232624" />
      </g>

      {/* ---------- invigilator (in front of the board) ---------- */}
      <g transform={`translate(${invX} ${FLOOR_Y + 8})`} filter={`url(#${id("b2_2")})`} opacity={0.9}>
        <path d="M-46 0 L-36 -150 C-56 -160 -66 -200 -60 -250 C-54 -290 -30 -300 0 -302 C30 -300 54 -290 60 -250 C66 -200 56 -160 36 -150 L46 0 Z" fill="#20252a" />
        <rect x={-30} y={-150} width={22} height={150} fill="#181c20" />
        <rect x={8} y={-150} width={22} height={150} fill="#181c20" />
        <circle cx={0} cy={-338} r={36} fill="#22272b" />
        {/* papers in hand */}
        <rect x={42} y={-210} width={34} height={44} rx={3} fill="#cfcabd" opacity={0.7} transform="rotate(-12 60 -190)" />
      </g>

      {/* ---------- rows of desks + students ---------- */}
      {ROWS.map((row, ri) => {
        const spacing = 300 * row.s;
        const px = par * (4 + ri * 6);
        return (
          <g key={ri} transform={`translate(${px} 0)`} filter={`url(#${id(`b${String(row.blur).replace(".", "_")}`)})`} opacity={1}>
            <g style={{ filter: `brightness(${row.dim})` }}>
              {row.cols.map((c) => (
                <DeskWithStudent key={c} x={VP.x + c * spacing} y={row.y} s={row.s} seed={ri * 10 + c * 3.1} t={t} showStudent />
              ))}
            </g>
          </g>
        );
      })}

      {/* warm pool of window light around the hero area */}
      <ellipse cx={560} cy={980} rx={520} ry={420} fill={`url(#${id("pool")})`} />
      {/* atmosphere / haze + vignette */}
      <rect x={0} y={0} width={1080} height={1920} fill="#1b120c" opacity={0.18} />
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id("vig")})`} />
    </svg>
  );
};
