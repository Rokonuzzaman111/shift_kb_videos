/** P1 helpers — professor / student figures and small SVG icons (owner: scene agent A). */
import { N } from "../theme";

/** Professor standing, feet at (0,0), ~420 units tall. `arm` 0..1 = writing jitter phase. */
export const Professor: React.FC<{ readonly x: number; readonly y: number; readonly s?: number; readonly arm?: number; readonly dim?: number }> = ({
  x,
  y,
  s = 1,
  arm = 0,
  dim = 0,
}) => {
  const hx = 175 + Math.sin(arm * Math.PI * 2) * 14;
  const hy = -330 + Math.cos(arm * Math.PI * 4) * 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={1 - dim * 0.6}>
      {/* legs */}
      <rect x={-42} y={-125} width={34} height={125} rx={8} fill="#1d2329" />
      <rect x={8} y={-125} width={34} height={125} rx={8} fill="#1d2329" />
      <rect x={-50} y={-10} width={46} height={14} rx={7} fill="#0d1013" />
      <rect x={4} y={-10} width={46} height={14} rx={7} fill="#0d1013" />
      {/* coat */}
      <path d="M-70 -300 Q0 -320 70 -300 L82 -120 Q0 -100 -82 -120 Z" fill="#33424f" />
      <path d="M-20 -305 L0 -230 L20 -305 Z" fill="#e9ecef" />
      <path d="M-6 -290 L6 -290 L10 -215 L0 -200 L-10 -215 Z" fill={N.green} />
      {/* back arm */}
      <path d="M-62 -290 Q-95 -210 -70 -140" stroke="#33424f" strokeWidth={30} strokeLinecap="round" fill="none" />
      {/* head */}
      <rect x={-14} y={-330} width={28} height={30} fill="#c99470" />
      <circle cx={0} cy={-365} r={46} fill="#d9a77c" />
      <path d="M-46 -372 Q-44 -405 -20 -410 L-28 -380 Z M46 -372 Q44 -405 20 -410 L28 -380 Z" fill="#c9c9c9" />
      <circle cx={-17} cy={-366} r={13} fill="none" stroke="#111" strokeWidth={4} />
      <circle cx={17} cy={-366} r={13} fill="none" stroke="#111" strokeWidth={4} />
      <line x1={-4} y1={-366} x2={4} y2={-366} stroke="#111" strokeWidth={4} />
      <path d="M-14 -338 Q0 -330 14 -338" stroke="#7a4b33" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M-30 -345 Q0 -310 30 -345 Q20 -322 0 -320 Q-20 -322 -30 -345 Z" fill="#cfcfcf" />
      {/* mortarboard */}
      <path d="M-70 -410 L0 -440 L70 -410 L0 -382 Z" fill="#14181c" />
      <rect x={-34} y={-410} width={68} height={22} fill="#14181c" />
      <path d="M40 -410 L58 -370" stroke={N.amber} strokeWidth={4} />
      <circle cx={58} cy={-366} r={6} fill={N.amber} />
      {/* writing arm */}
      <path d={`M55 -290 Q120 -300 ${hx} ${hy}`} stroke="#33424f" strokeWidth={30} strokeLinecap="round" fill="none" />
      <circle cx={hx} cy={hy} r={15} fill="#d9a77c" />
      <rect x={hx + 6} y={hy - 18} width={7} height={22} fill="#fff" transform={`rotate(30 ${hx} ${hy})`} />
    </g>
  );
};

/** Tiny student bust centred at (0,0) with optional sum card above head. */
export const Student: React.FC<{
  readonly x: number;
  readonly y: number;
  readonly color: string;
  readonly op?: string;
  readonly card?: number;
  readonly ok?: number;
}> = ({ x, y, color, op, card = 0, ok = 0 }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx={0} cy={-6} r={4.4} fill={color} />
    <path d="M-6.5 8 Q-6.5 -1 0 -1 Q6.5 -1 6.5 8 Z" fill={color} />
    {card > 0 && op ? (
      <g opacity={card}>
        <rect x={-12} y={-21} width={24} height={9} rx={1.5} fill={ok > 0.5 ? N.green : "#f4f6f2"} />
        <text x={0} y={-14.3} textAnchor="middle" fontSize={6.6} fontWeight={700} fill="#0a0d0f" fontFamily="Inter, sans-serif">
          {op}
        </text>
      </g>
    ) : null}
  </g>
);

/** Game controller icon, ~120 wide, centred. */
export const Pad: React.FC<{ readonly color?: string }> = ({ color = N.ink }) => (
  <svg viewBox="-60 -40 120 80" width={120} height={80}>
    <path d="M-40 -22 Q-56 -22 -58 0 Q-60 26 -44 30 Q-34 32 -24 14 L24 14 Q34 32 44 30 Q60 26 58 0 Q56 -22 40 -22 Z" fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" />
    <path d="M-36 -4 h16 M-28 -12 v16" stroke={color} strokeWidth={5} strokeLinecap="round" />
    <circle cx={28} cy={-8} r={4.5} fill={N.greenHi} />
    <circle cx={38} cy={2} r={4.5} fill={color} />
  </svg>
);
