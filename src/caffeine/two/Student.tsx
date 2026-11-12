/**
 * OWNER: motion2d agent.
 * 2D illustrated Bangladeshi student (teen, white school shirt, black hair, brown skin), flat illustration
 * with soft shading, sitting at a desk. Rendered inside a box of `width` px (height = width * 1.25),
 * bottom-centred (the desk front sits on the bottom edge).
 * Poses animate on their own from `t` (shot seconds) and blend in over ~0.35 s from `prevPose`
 * (default "study") when `pose` starts at `poseAt`.
 *  - study: head slightly down, writing, normal blinks
 *  - nodding: heavy lids, head slowly drops then jerks back up (cycle ~2.6 s), small "z"s
 *  - yawn: big yawn (eyes shut, head back, mouth wide) every ~4.5 s, drowsy in between
 *  - awake-tired: eyes forced wide open, small pupils, dark circles, slightly bloodshot, tiny tremor
 *  - headache: hand on forehead, squint + frown, red pulse rings at the temple
 */
import { useId } from "react";
import { Easing, interpolate } from "remotion";

export type StudentPose = "study" | "nodding" | "yawn" | "awake-tired" | "headache";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

const SKIN = "#b0754b";
const SKIN_LIGHT = "#c78a5c";
const SKIN_SHADE = "#8f5a36";
const HAIR = "#141010";
const SHIRT = "#f6f6f3";
const SHIRT_SHADE = "#d6dbe0";
const NAVY = "#1f3a68";

type P = {
  tilt: number; // head roll, deg
  drop: number; // head moves down (px, viewBox)
  look: number; // facial features shift down (looking down)
  lid: number; // 0 open .. 1 closed (upper lid)
  eye: number; // eye scale
  pupil: number; // pupil scale
  dark: number; // dark circles + bloodshot 0..1
  mouth: number; // 0 closed .. 1 wide open
  smile: number; // -1 frown .. 1 smile
  brow: number; // -1 furrowed .. 1 raised
  raise: number; // right hand: 0 on desk .. 1 on forehead
  ache: number; // red pulse 0..1
  write: number; // writing hand motion 0..1
  zz: number; // sleepy z's 0..1
};

const KEYS: (keyof P)[] = ["tilt", "drop", "look", "lid", "eye", "pupil", "dark", "mouth", "smile", "brow", "raise", "ache", "write", "zz"];

/** Deterministic blink: 0..1 closure, ~every 3.2 s with slight irregularity. */
const blink = (t: number, period = 3.2, offset = 0.7) => {
  const x = t + offset + Math.sin(t * 0.37) * 0.4;
  const ph = ((x % period) + period) % period;
  return interpolate(ph, [0, 0.07, 0.16], [0, 1, 0], clamp);
};

const poseParams = (pose: StudentPose, t: number, lt: number): P => {
  const base: P = { tilt: 0, drop: 0, look: 0, lid: 0.2, eye: 1, pupil: 1, dark: 0.15, mouth: 0, smile: 0.1, brow: 0, raise: 0, ache: 0, write: 0, zz: 0 };
  switch (pose) {
    case "study":
      return {
        ...base,
        tilt: Math.sin(t * 0.6) * 1.5 - 2,
        drop: 5,
        look: 7,
        lid: Math.max(0.3, blink(t)),
        write: 1,
      };
    case "nodding": {
      const period = 2.6;
      const ph = (((lt + 0.4) % period) + period) % period;
      // slow sink 0..1.9 s, quick jerk up 1.9..2.15, settle
      const sink = ph < 1.9 ? Easing.in(Easing.quad)(ph / 1.9) : interpolate(ph, [1.9, 2.1, 2.6], [1, -0.12, 0], clamp);
      const jerk = interpolate(ph, [1.9, 2.0, 2.4], [0, 1, 0], clamp);
      return {
        ...base,
        tilt: sink * 9,
        drop: sink * 30,
        look: sink * 14,
        lid: Math.max(mix(0.55, 0.97, Math.max(0, sink)) - jerk * 0.6, ph > 2.1 ? blink(t, 1.3) : 0),
        dark: 0.45,
        mouth: Math.max(0, sink) * 0.12,
        smile: -0.1,
        brow: -0.1 + jerk * 0.8,
        zz: smooth((sink - 0.4) / 0.4),
      };
    }
    case "yawn": {
      const period = 4.5;
      const ph = ((lt % period) + period) % period;
      const y = interpolate(ph, [0, 0.5, 1.0, 1.6, 2.1], [0, 0.55, 1, 0.9, 0], { ...clamp, easing: Easing.inOut(Easing.sin) });
      return {
        ...base,
        tilt: -y * 6,
        drop: -y * 8 + (1 - y) * 6,
        look: -y * 4 + (1 - y) * 5,
        lid: Math.max(mix(0.55, 1, y), blink(t, 2.4)),
        dark: 0.4,
        mouth: y,
        smile: -0.2,
        brow: y * 0.9,
        zz: 0,
      };
    }
    case "awake-tired": {
      const b = blink(t, 4.6, 2.2);
      return {
        ...base,
        tilt: Math.sin(t * 13) * 0.5 + Math.sin(t * 0.8) * 1.2,
        drop: -2 + Math.sin(t * 1.1) * 1.5,
        look: 0,
        lid: Math.max(0.02, b),
        eye: 1.2,
        pupil: 0.62,
        dark: 1,
        mouth: 0.05,
        smile: -0.25,
        brow: 0.7,
      };
    }
    case "headache": {
      const pulse = 0.5 + 0.5 * Math.sin(lt * Math.PI * 2 * 1.25);
      return {
        ...base,
        tilt: 7 + pulse * 1.2,
        drop: 8,
        look: 3,
        lid: Math.max(0.62 + pulse * 0.12, blink(t, 3.6)),
        dark: 0.5,
        mouth: 0.08,
        smile: -0.85,
        brow: -1,
        raise: 1,
        ache: 1,
        write: 0,
      };
    }
  }
};

export const Student: React.FC<{
  readonly t: number;
  readonly pose: StudentPose;
  /** shot-time when this pose started (for the pose's own animation timing) */
  readonly poseAt?: number;
  /** pose to blend from at poseAt (default "study") */
  readonly prevPose?: StudentPose;
  readonly width?: number;
  readonly style?: React.CSSProperties;
}> = ({ t, pose, poseAt = 0, prevPose = "study", width = 600, style }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (s: string) => `${s}-${uid}`;
  const lt = t - poseAt;
  const k = poseAt > 0 && prevPose !== pose ? interpolate(lt, [0, 0.35], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) }) : 1;
  const A = poseParams(prevPose, t, lt + poseAt);
  const B = poseParams(pose, t, lt);
  const p = {} as P;
  for (const key of KEYS) p[key] = mix(A[key], B[key], k);

  // breathing
  const breath = Math.sin(t * 1.7) * 1.4;

  // ----- head geometry -----
  const headCx = 200;
  const headCy = 176 + p.drop + breath * 0.5;
  const pivot = `rotate(${p.tilt} 200 ${262 + p.drop})`;

  // ----- arms -----
  const writeX = p.write * (Math.sin(t * 8.5) * 5 + Math.sin(t * 2.3) * 7);
  const writeY = p.write * Math.abs(Math.sin(t * 8.5)) * -2;
  const lShoulder = [128, 304 + breath];
  const lElbow = [92, 384];
  const lHand = [176 + writeX, 410 + writeY];

  const rShoulder = [272, 304 + breath];
  const r = p.raise;
  // forehead point follows the head roughly (rotation around pivot ignored except small x shift)
  const fx = 222 - p.tilt * 1.2;
  const fy = 140 + p.drop;
  const rElbow = [mix(306, 318, r), mix(386, 250, r)];
  const rHand = [mix(246, fx + 6, r), mix(412, fy + 6, r)];

  const eyeY = 182 + p.look;
  const eyeRx = 14 * p.eye;
  const eyeRy = 10 * p.eye;
  const lidK = Math.min(1, p.lid);

  const ache = p.ache;
  const acheP = ((lt * 1.25) % 1 + 1) % 1;

  const eye = (ex: number, side: 1 | -1) => {
    const top = eyeY - eyeRy;
    const ly = top + 2 * eyeRy * lidK; // lid edge
    const curve = mix(-eyeRy * 1.05, eyeRy * 0.5, lidK); // arc of lash line
    const look = p.look * 0.12;
    return (
      <g key={ex}>
        <clipPath id={id(`eye${side}`)}>
          <ellipse cx={ex} cy={eyeY} rx={eyeRx} ry={eyeRy} />
        </clipPath>
        <g clipPath={`url(#${id(`eye${side}`)})`}>
          <rect x={ex - 20} y={eyeY - 16} width={40} height={32} fill={p.dark > 0.6 ? "#f4e3dd" : "#fbf7f2"} />
          {/* bloodshot veins */}
          <path
            d={`M${ex - eyeRx} ${eyeY + 2} q5 -2 8 1 M${ex + eyeRx} ${eyeY - 1} q-6 2 -9 -1`}
            stroke="#d0574d"
            strokeWidth={1.1}
            fill="none"
            opacity={Math.max(0, p.dark - 0.5) * 1.4}
          />
          <circle cx={ex - side * 0.5} cy={eyeY + 1 + look} r={7.2 * Math.max(0.75, p.eye * 0.9)} fill="#3a2214" />
          <circle cx={ex - side * 0.5} cy={eyeY + 1 + look} r={3.6 * p.pupil} fill="#0c0705" />
          <circle cx={ex + 2.5 - side * 0.5} cy={eyeY - 2.5 + look} r={1.9} fill="#fff" opacity={0.9} />
          {/* upper lid */}
          <path d={`M${ex - 20} ${top - 6} L${ex + 20} ${top - 6} L${ex + 20} ${ly} Q${ex} ${ly + curve * 0.6} ${ex - 20} ${ly} Z`} fill={SKIN} />
          <path d={`M${ex - 20} ${ly} Q${ex} ${ly + curve * 0.6} ${ex + 20} ${ly} L${ex + 20} ${ly + 3} Q${ex} ${ly + curve * 0.6 + 3} ${ex - 20} ${ly + 3} Z`} fill={SKIN_SHADE} opacity={0.5} />
        </g>
        {/* lash line */}
        <path
          d={`M${ex - eyeRx - 1.5} ${ly + (lidK > 0.85 ? 0 : 1)} Q${ex} ${ly + curve} ${ex + eyeRx + 1.5} ${ly + (lidK > 0.85 ? 0 : 1)}`}
          stroke="#1a0f0a"
          strokeWidth={3.4}
          strokeLinecap="round"
          fill="none"
        />
        {/* outer lash flick */}
        <path d={`M${ex + side * -eyeRx - side * -1} ${ly + 0.5} l${-side * 4} -2.5`} stroke="#1a0f0a" strokeWidth={2.4} strokeLinecap="round" opacity={1 - lidK * 0.6} />
        {/* lower lid + dark circle */}
        <path d={`M${ex - eyeRx + 2} ${eyeY + eyeRy + 2} Q${ex} ${eyeY + eyeRy + 6} ${ex + eyeRx - 2} ${eyeY + eyeRy + 2}`} stroke={SKIN_SHADE} strokeWidth={1.6} fill="none" opacity={0.7} />
        <path
          d={`M${ex - eyeRx} ${eyeY + eyeRy + 1} Q${ex} ${eyeY + eyeRy + 13} ${ex + eyeRx} ${eyeY + eyeRy + 1} Q${ex} ${eyeY + eyeRy + 6} ${ex - eyeRx} ${eyeY + eyeRy + 1} Z`}
          fill="#4a2a3a"
          opacity={p.dark * 0.55}
        />
      </g>
    );
  };

  const browY = 158 + p.look * 0.9 - p.brow * 5;
  const brow = (ex: number, side: 1 | -1) => {
    const inner = ex + side * -15; // towards nose
    const outer = ex + side * 15;
    const innerY = browY - p.brow * 3 + (p.brow < 0 ? -p.brow * 5 : 0);
    const outerY = browY + 1 - (p.brow < 0 ? -p.brow * 3 : 0);
    return (
      <path
        key={`b${ex}`}
        d={`M${inner} ${innerY + 2} Q${ex} ${Math.min(innerY, outerY) - 5} ${outer} ${outerY + 1}`}
        stroke={HAIR}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
    );
  };

  const mouthY = 230 + p.look * 0.8;
  const mw = mix(12, 13, p.mouth);
  const mouth = (
    <g>
      {p.mouth > 0.03 ? (
        <>
          <ellipse cx={200} cy={mouthY + p.mouth * 8} rx={mw + p.mouth * 3} ry={2 + p.mouth * 17} fill="#4a1a17" />
          <ellipse cx={200} cy={mouthY + p.mouth * 8 + p.mouth * 10} rx={(mw + p.mouth * 3) * 0.6} ry={p.mouth * 6} fill="#c25a55" opacity={Math.min(1, p.mouth * 2)} />
          <rect x={200 - mw * 0.7} y={mouthY + p.mouth * 8 - (2 + p.mouth * 17)} width={mw * 1.4} height={p.mouth * 4} rx={2} fill="#f3eee6" opacity={Math.min(1, p.mouth * 3)} />
        </>
      ) : null}
      <path
        d={`M${200 - mw} ${mouthY} Q200 ${mouthY + p.smile * 7} ${200 + mw} ${mouthY}`}
        stroke="#5a2a20"
        strokeWidth={3.4}
        strokeLinecap="round"
        fill="none"
        opacity={1 - Math.min(1, p.mouth * 3)}
      />
    </g>
  );

  const arm = (sh: number[], el: number[], hd: number[], key: string, handOnHead = 0) => {
    // short sleeve: tapered polygon from the shoulder to ~60% of the upper arm
    const sx = mix(sh[0], el[0], 0.6);
    const sy = mix(sh[1], el[1], 0.6);
    const dx = sx - sh[0];
    const dy = sy - sh[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const sleeve = `M${sh[0] + nx * 20 - (dx / len) * 6} ${sh[1] + ny * 20 - (dy / len) * 6} L${sx + nx * 21} ${sy + ny * 21} L${sx - nx * 21} ${sy - ny * 21} L${sh[0] - nx * 20 - (dx / len) * 6} ${sh[1] - ny * 20 - (dy / len) * 6} Z`;
    return (
      <g key={key}>
        <path d={`M${sx} ${sy} L${el[0]} ${el[1]} L${hd[0]} ${hd[1]}`} stroke={SKIN} strokeWidth={23} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={`M${el[0]} ${el[1]} L${hd[0]} ${hd[1]}`} stroke={SKIN_SHADE} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.3} transform="translate(0 5)" />
        <path d={sleeve} fill={SHIRT} stroke={SHIRT_SHADE} strokeWidth={2.5} strokeLinejoin="round" />
        <path d={`M${sx + nx * 20} ${sy + ny * 20} L${sx - nx * 20} ${sy - ny * 20}`} stroke={SHIRT_SHADE} strokeWidth={5} strokeLinecap="round" />
        {/* hand */}
        <ellipse
          cx={hd[0]}
          cy={hd[1]}
          rx={16}
          ry={handOnHead > 0.5 ? 13 : 12}
          fill={SKIN_LIGHT}
          stroke={SKIN_SHADE}
          strokeWidth={2}
          transform={`rotate(${handOnHead * -30} ${hd[0]} ${hd[1]})`}
        />
        {handOnHead > 0.6 ? (
          <path d={`M${hd[0] - 14} ${hd[1] - 6} q10 -6 26 -3 M${hd[0] - 14} ${hd[1]} q10 -5 27 -1`} stroke={SKIN_SHADE} strokeWidth={1.8} fill="none" opacity={0.8} />
        ) : null}
      </g>
    );
  };

  return (
    <svg width={width} height={width * 1.25} viewBox="0 0 400 500" style={{ overflow: "visible", ...style }}>
      <defs>
        <linearGradient id={id("shirt")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor={SHIRT} />
          <stop offset="1" stopColor={SHIRT_SHADE} />
        </linearGradient>
        <radialGradient id={id("face")} cx="0.38" cy="0.35" r="0.75">
          <stop offset="0" stopColor={SKIN_LIGHT} />
          <stop offset="0.65" stopColor={SKIN} />
          <stop offset="1" stopColor={SKIN_SHADE} />
        </radialGradient>
        <linearGradient id={id("desk")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b57a49" />
          <stop offset="1" stopColor="#93603a" />
        </linearGradient>
        <linearGradient id={id("deskFront")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e4428" />
          <stop offset="1" stopColor="#4a2d1b" />
        </linearGradient>
        <radialGradient id={id("shadow")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity={0.45} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* ---- torso ---- */}
      <g transform={`translate(0 ${breath * 0.6})`}>
        <path d="M104 440 C100 352 112 312 150 296 C168 290 184 288 200 288 C216 288 232 290 250 296 C288 312 300 352 296 440 Z" fill={`url(#${id("shirt")})`} />
        {/* side shading */}
        <path d="M262 300 C288 316 298 352 296 440 L270 440 C274 380 272 330 262 300 Z" fill={SHIRT_SHADE} opacity={0.75} />
        <path d="M138 302 C120 320 110 360 108 440 L122 440 C122 380 128 336 138 302 Z" fill={SHIRT_SHADE} opacity={0.4} />
        {/* placket + buttons */}
        <path d="M200 296 L200 440" stroke={SHIRT_SHADE} strokeWidth={2.5} />
        {[322, 356, 390, 424].map((y) => (
          <circle key={y} cx={205} cy={y} r={3} fill="#c9cfd6" />
        ))}
        {/* pocket with school badge */}
        <path d="M222 338 L262 338 L262 376 Q242 384 222 376 Z" fill="none" stroke={SHIRT_SHADE} strokeWidth={2.5} />
        <path d="M232 346 L252 346 L252 360 Q242 368 232 360 Z" fill={NAVY} />
        <circle cx={242} cy={354} r={3.5} fill="#e9c46a" />
      </g>

      {/* ---- neck ---- */}
      <path d={`M184 ${236 + p.drop * 0.6} L216 ${236 + p.drop * 0.6} L218 296 L182 296 Z`} fill={SKIN_SHADE} />
      <path d={`M184 ${250 + p.drop * 0.6} Q200 ${262 + p.drop * 0.6} 216 ${250 + p.drop * 0.6} L216 ${240 + p.drop * 0.6} L184 ${240 + p.drop * 0.6} Z`} fill="#7a4a2c" opacity={0.6} />
      {/* collar */}
      <g transform={`translate(0 ${breath * 0.6})`}>
        <path d="M200 300 L172 278 L160 300 L184 316 Z" fill="#ffffff" stroke={SHIRT_SHADE} strokeWidth={2.5} strokeLinejoin="round" />
        <path d="M200 300 L228 278 L240 300 L216 316 Z" fill="#ffffff" stroke={SHIRT_SHADE} strokeWidth={2.5} strokeLinejoin="round" />
      </g>

      {/* ---- head ---- */}
      <g transform={pivot}>
        {/* back hair */}
        <ellipse cx={headCx} cy={headCy - 16} rx={70} ry={74} fill={HAIR} />
        {/* ears */}
        <ellipse cx={headCx - 63} cy={headCy + 8 + p.look * 0.4} rx={11} ry={17} fill={SKIN} />
        <ellipse cx={headCx + 63} cy={headCy + 8 + p.look * 0.4} rx={11} ry={17} fill={SKIN_SHADE} />
        {/* face */}
        <path
          d={`M${headCx - 62} ${headCy - 14} C${headCx - 64} ${headCy + 40} ${headCx - 34} ${headCy + 76} ${headCx} ${headCy + 78} C${headCx + 34} ${headCy + 76} ${headCx + 64} ${headCy + 40} ${headCx + 62} ${headCy - 14} C${headCx + 60} ${headCy - 70} ${headCx - 60} ${headCy - 70} ${headCx - 62} ${headCy - 14} Z`}
          fill={`url(#${id("face")})`}
        />
        {/* cheek blush */}
        <ellipse cx={headCx - 36} cy={headCy + 30 + p.look * 0.6} rx={12} ry={7} fill="#c9604a" opacity={0.18} />
        <ellipse cx={headCx + 36} cy={headCy + 30 + p.look * 0.6} rx={12} ry={7} fill="#c9604a" opacity={0.18} />
        {/* features (shift down when looking down) */}
        <g transform={`translate(0 ${headCy - 176})`}>
          {eye(176, -1)}
          {eye(224, 1)}
          {brow(176, -1)}
          {brow(224, 1)}
          {/* frown lines for headache */}
          <path d={`M195 ${browY - 2} l2 8 M205 ${browY - 2} l-2 8`} stroke={SKIN_SHADE} strokeWidth={2} strokeLinecap="round" opacity={Math.max(0, -p.brow) * 0.9} />
          {/* nose */}
          <path d={`M199 ${192 + p.look} Q196 ${206 + p.look} 192 ${210 + p.look} Q200 ${215 + p.look} 207 ${210 + p.look}`} stroke={SKIN_SHADE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {mouth}
        </g>
        {/* front hair: side-swept fringe */}
        <path
          d={`M${headCx - 66} ${headCy - 2} C${headCx - 78} ${headCy - 66} ${headCx - 34} ${headCy - 98} ${headCx + 8} ${headCy - 94}
             C${headCx + 54} ${headCy - 92} ${headCx + 76} ${headCy - 60} ${headCx + 66} ${headCy - 4}
             C${headCx + 60} ${headCy - 30} ${headCx + 52} ${headCy - 44} ${headCx + 36} ${headCy - 50}
             C${headCx + 20} ${headCy - 34} ${headCx - 14} ${headCy - 30} ${headCx - 34} ${headCy - 40}
             C${headCx - 46} ${headCy - 32} ${headCx - 56} ${headCy - 18} ${headCx - 66} ${headCy - 2} Z`}
          fill={HAIR}
        />
        {/* fringe tufts */}
        <path
          d={`M${headCx - 40} ${headCy - 40} l-6 14 l14 -9 Z M${headCx - 6} ${headCy - 34} l2 14 l10 -14 Z M${headCx + 26} ${headCy - 46} l8 13 l6 -15 Z`}
          fill={HAIR}
        />
        {/* hair highlight */}
        <path d={`M${headCx - 30} ${headCy - 80} C${headCx - 4} ${headCy - 88} ${headCx + 26} ${headCy - 84} ${headCx + 44} ${headCy - 70}`} stroke="#3a3130" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.8} />
        {/* sideburns */}
        <path d={`M${headCx - 62} ${headCy - 6} L${headCx - 60} ${headCy + 14} L${headCx - 54} ${headCy - 10} Z`} fill={HAIR} />
        <path d={`M${headCx + 62} ${headCy - 6} L${headCx + 60} ${headCy + 14} L${headCx + 54} ${headCy - 10} Z`} fill={HAIR} />
      </g>

      {/* sleepy z's */}
      {p.zz > 0.02
        ? [0, 1, 2].map((i) => {
            const ph = ((t * 0.7 + i / 3) % 1 + 1) % 1;
            return (
              <text
                key={i}
                x={268 + ph * 40 + i * 4}
                y={120 - ph * 70 + p.drop * 0.5}
                fontSize={18 + ph * 16}
                fontWeight={800}
                fontFamily="sans-serif"
                fill="#cfe2ff"
                opacity={p.zz * Math.sin(ph * Math.PI) * 0.9}
              >
                z
              </text>
            );
          })
        : null}

      {/* ---- desk ---- */}
      <ellipse cx={200} cy={402} rx={150} ry={10} fill={`url(#${id("shadow")})`} />
      <path d="M36 396 L364 396 L384 430 L16 430 Z" fill={`url(#${id("desk")})`} />
      <path d="M36 396 L364 396" stroke="#d29a68" strokeWidth={3} strokeLinecap="round" />
      <rect x={16} y={430} width={368} height={70} fill={`url(#${id("deskFront")})`} />
      <rect x={16} y={430} width={368} height={6} fill="#3a2214" opacity={0.6} />
      {/* answer sheet */}
      <path d="M138 400 L262 398 L272 426 L130 428 Z" fill="#fbfaf6" />
      <path d="M146 406 L250 405 M144 412 L232 411 M142 418 L256 417" stroke="#9fb3c8" strokeWidth={1.6} strokeLinecap="round" />

      {/* ---- arms ---- */}
      {arm(lShoulder, lElbow, lHand, "l")}
      {/* pen in writing hand */}
      <path d={`M${lHand[0] + 6} ${lHand[1] + 6} L${lHand[0] + 20} ${lHand[1] - 20}`} stroke="#2a4f8f" strokeWidth={4.5} strokeLinecap="round" />
      {arm(rShoulder, rElbow, rHand, "r", r)}

      {/* ---- headache pulse ---- */}
      {ache > 0.02 ? (
        <g opacity={ache}>
          {[0, 0.5].map((o) => {
            const q = (acheP + o) % 1;
            return (
              <circle
                key={o}
                cx={fx + 46}
                cy={fy - 6}
                r={14 + q * 46}
                fill="none"
                stroke="#ff5a4d"
                strokeWidth={5 - q * 3}
                opacity={(1 - q) * 0.85}
              />
            );
          })}
          <circle cx={fx + 46} cy={fy - 6} r={10 + Math.sin(acheP * Math.PI) * 4} fill="#ff5a4d" opacity={0.35} />
          {/* little ache strokes */}
          {[-50, -10, 30].map((a, i) => {
            const rad = (a * Math.PI) / 180;
            const r0 = 64 + Math.sin(acheP * Math.PI * 2 + i) * 4;
            const cx = fx + 46;
            const cy = fy - 6;
            return (
              <path
                key={a}
                d={`M${cx + Math.cos(rad) * r0} ${cy + Math.sin(rad) * r0} l${Math.cos(rad) * 14} ${Math.sin(rad) * 14}`}
                stroke="#ff5a4d"
                strokeWidth={5}
                strokeLinecap="round"
                opacity={0.9}
              />
            );
          })}
        </g>
      ) : null}
    </svg>
  );
};
