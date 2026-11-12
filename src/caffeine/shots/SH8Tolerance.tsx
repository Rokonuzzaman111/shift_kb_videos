/**
 * SH8 · tolerance (owner: science3d). Beats (shot seconds, from VO "tolerance"):
 *  রোজ/কয়েক/কাপ  cups ১ ২ ৩ pop in the title zone; membrane close-up with 3 receptors
 *  জায়গা→বেড়ে   camera rises, 4 new receptors sprout out of the membrane
 *  তখন          caffeine fills only the 3 old ones
 *  কাজ          amber adenosine fills the new empty ones → amber glow, scene dims; label "কাজ কমে"
 *  চা বাদ       cut: student with a headache (pulsing red ache); title "চা বাদ = মাথাব্যথা" on মাথা
 */
import { AbsoluteFill } from "remotion";
import { Stage } from "../../kit/Stage";
import { ease, mix, mix3, prog, useSeconds } from "../../kit/time";
import { MolSwarm, type MolItem } from "../three/Molecules";
import { Membrane, Receptor } from "../three/Receptor";
import { dockPath } from "../three/sci/dock";
import { SciFX as PostFX } from "../three/sci/SciFX";
import { Cam, SciLights, Specks } from "../three/sci/Scene";
import { dist3 } from "../three/sci/util";
import { K, bodyFont } from "../theme";
import { Student } from "../two/Student";
import type { Cue } from "../types";
import { Label, Title } from "../ui/Text";
import { shotDuration, wordAt } from "../vo";

export const SH8_DURATION = shotDuration("tolerance");

const w = (s: string, n = 0) => wordAt("tolerance", s, n);
const T = {
  roj: w("রোজ"),
  koyek: w("কয়েক"),
  kap: w("কাপ"),
  jayga: w("জায়গা"),
  bere: w("বেড়ে"),
  tokhon: w("তখন"),
  kaj: w("কাজ"),
  cha2: w("চা", 2),
  matha: w("মাথা"),
};
const CUT = T.cha2;

/** Caption words (exact VO tokens) to highlight. */
export const SH8_KEYWORDS: string[] = ["রোজ", "বেড়ে", "কম", "মাথা"];
/** Sound cues for this shot (sparse!). */
export const SH8_CUES: Cue[] = [
  { at: T.kap, sfx: "pop", volume: 0.4 },
  { at: T.bere, sfx: "riser", volume: 0.3 },
  { at: T.matha, sfx: "heartbeat_ache", volume: 0.35 },
];

type V3 = [number, number, number];
const OLD: V3[] = [
  [-0.95, 0, 0.15],
  [0, 0, 0.2],
  [0.95, 0, 0.15],
];
const NEW: V3[] = [
  [-1.45, 0, -0.75],
  [-0.48, 0, -0.85],
  [0.48, 0, -0.85],
  [1.45, 0, -0.75],
];
const growAt = (i: number) => T.bere + [0.1, 0.35, 0, 0.25][i];

const World: React.FC = () => {
  const t = useSeconds();
  const grow = NEW.map((_, i) => prog(t, growAt(i), growAt(i) + 0.75));
  const holes = [
    ...OLD.map((p) => [p[0], p[2], 0.36] as const),
    // the bilayer opens up as each new receptor sprouts (quantised so the bead layout rarely rebuilds)
    ...NEW.map((p, i) => [p[0], p[2], Math.round(grow[i] * 4) * 0.09] as const),
  ];
  const cyan: MolItem[] = OLD.map((p, i) => {
    const d = dockPath(t, [p[0] + 0.6, 2.2, p[2] + 0.4], p, T.tokhon + 0.35 + i * 0.3, 0.9, i);
    return { p: d.p, r: d.rot, s: t > T.tokhon - 0.6 ? 0.95 : 0 };
  });
  const amber: MolItem[] = NEW.map((p, i) => {
    const d = dockPath(t, [p[0] - 0.5, 2.1, p[2] - 0.3], p, T.kaj + 0.15 + i * 0.14, 0.8, i * 0.4);
    return { p: d.p, r: d.rot, s: t > T.kaj - 0.7 ? 0.95 : 0 };
  });
  const dim = prog(t, T.kaj + 0.9, CUT, ease.inOut) * 0.45;
  let pos = mix3([0.05, 2.0, 3.4], [0.05, 1.75, 2.95], prog(t, 0, T.jayga, ease.cine));
  pos = mix3(pos, [0.0, 2.45, 3.3], prog(t, T.jayga - 0.1, T.bere + 1.0, ease.cine));
  pos = mix3(pos, [0.1, 2.2, 2.9], prog(t, T.tokhon, CUT, ease.cine));
  const subject = mix3([0, 0.45, 0.1], [0, 0.35, -0.35], prog(t, T.jayga - 0.1, T.bere + 1.0, ease.cine));
  return (
    <>
      <SciLights t={t} env={0.4} dim={dim} />
      <Cam y={780} pos={pos} subject={subject} mm={mix(38, 33, prog(t, T.jayga - 0.1, T.bere + 1.0, ease.cine))} t={t} />
      <Membrane t={t} w={8} d={7} holes={holes} dim={dim} warm={prog(t, T.kaj + 0.2, T.kaj + 0.8) * 0.5} />
      {OLD.map((p, i) => (
        <Receptor key={`o${i}`} t={t + i} position={p} rotation={[0, i * 1.7, 0]} blocked={prog(t, T.tokhon + 0.35 + i * 0.3, T.tokhon + 0.6 + i * 0.3)} dim={dim} />
      ))}
      {NEW.map((p, i) => (
        <Receptor
          key={`n${i}`}
          t={t + i * 2}
          position={p}
          rotation={[0, i * 0.9 + 0.4, 0]}
          grow={grow[i]}
          lit={prog(t, T.kaj + 0.15 + i * 0.14, T.kaj + 0.4 + i * 0.14) * (1 - dim * 0.5)}
          dim={dim}
        />
      ))}
      <MolSwarm kind="caffeine" items={cyan} glow={0.75} halo={0.8} />
      <MolSwarm kind="adenosine" items={amber} glow={0.75} halo={0.8} />
      <Specks t={t} center={[0, 1.2, -1.2]} spread={[8, 3, 6]} opacity={0.12} seed="c8" />
      <PostFX focus={dist3(pos, subject)} focusRange={1.2} bokeh={4.5} bloom={0.75} bloomThreshold={0.8} vignette={0.5 + dim * 0.4} />
    </>
  );
};

const Cup: React.FC<{ readonly at: number; readonly n: string }> = ({ at, n }) => {
  const t = useSeconds();
  const k = prog(t, at, at + 0.35, ease.out);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: Math.min(1, k * 1.5), scale: 0.6 + 0.4 * k, translate: `0 ${(1 - k) * 30}px` }}>
      <svg width={160} height={174} viewBox="0 0 120 130">
        <defs>
          <linearGradient id={`tea${n}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e2a868" />
            <stop offset="1" stopColor="#a8682f" />
          </linearGradient>
        </defs>
        <path d="M 40 14 Q 34 2 42 -6" stroke="rgba(255,240,225,0.35)" strokeWidth={5} fill="none" strokeLinecap="round" transform="translate(6 10)" />
        <path d="M 62 14 Q 56 2 64 -6" stroke="rgba(255,240,225,0.3)" strokeWidth={5} fill="none" strokeLinecap="round" transform="translate(6 10)" />
        <path d="M 20 34 L 100 34 L 90 122 L 30 122 Z" fill="rgba(255,255,255,0.12)" stroke="rgba(255,245,235,0.75)" strokeWidth={6} strokeLinejoin="round" />
        <path d="M 25 50 L 95 50 L 88 116 L 32 116 Z" fill={`url(#tea${n})`} />
        <ellipse cx={60} cy={50} rx={35} ry={5} fill="#f0c189" />
      </svg>
      <div style={{ fontFamily: bodyFont, fontWeight: 800, fontSize: 52, color: K.tea, lineHeight: 1 }}>{n}</div>
    </div>
  );
};

const Headache: React.FC<{ t: number }> = ({ t }) => {
  const p = 0.5 + 0.5 * Math.sin((t - T.matha) * 7);
  const on = prog(t, T.matha - 0.1, T.matha + 0.3);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${K.bg2}, ${K.bg} 70%)` }}>
      <div
        style={{
          position: "absolute",
          left: 540 - 260,
          top: 560 - 220,
          width: 520,
          height: 440,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,90,77,${0.55 * on * (0.55 + 0.45 * p)}) 0%, rgba(255,90,77,0) 65%)`,
          scale: 0.9 + 0.12 * p * on,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 470 }}>
        <Student t={t} pose="headache" poseAt={CUT} width={640} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SH8Tolerance: React.FC = () => {
  const t = useSeconds();
  const cupsOut = prog(t, T.kaj - 0.4, T.kaj - 0.1);
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      {t < CUT ? (
        <Stage background="#0f0907">
          <World />
        </Stage>
      ) : (
        <Headache t={t} />
      )}
      {cupsOut < 1 ? (
        <AbsoluteFill style={{ flexDirection: "row", justifyContent: "center", gap: 80, paddingTop: 220, opacity: 1 - cupsOut }}>
          <Cup at={T.roj} n="১" />
          <Cup at={T.koyek} n="২" />
          <Cup at={T.kap} n="৩" />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
        <Label at={T.kaj} until={CUT - 0.1} accent={K.amber} size={60}>
          কাজ কমে
        </Label>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        <Title at={T.matha} color={K.ink} size={96}>
          চা বাদ = মাথাব্যথা
        </Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
