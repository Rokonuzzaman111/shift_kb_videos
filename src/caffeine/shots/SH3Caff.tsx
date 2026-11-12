/**
 * SH3 · caff (owner: science3d) ★ hero shot. Beats (shot seconds, from VO "caff"):
 *  0          tea glass from above, cyan caffeine molecules rising out of the tea
 *  ক্যাফেইন   push-in on one caffeine molecule, label "ক্যাফেইন"
 *  দেখতে      cut: side-by-side compare, adenosine (amber, left) vs caffeine (cyan, right);
 *  অ্যাডেনোসিনের  glowing outline on the shared double ring of both
 *  তাই        cut: receptor on the membrane; caffeine flies in first (আগে) and docks on বসে (click)
 *  অ্যাডেনোসিন adenosine arrives, bumps on পায় and bounces off, red ✕
 *  ফলে/সংকেত  pull back wide: every receptor blocked cyan; an amber signal pulse dies at them; "সংকেত ✕"
 */
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { Stage } from "../../kit/Stage";
import { ease, mix, mix3, prog, useSeconds } from "../../kit/time";
import { Adenosine, Caffeine, HANG_ROT_Z, MolSwarm, type MolItem } from "../three/Molecules";
import { Membrane, Receptor } from "../three/Receptor";
import { dockPath, pocketOf } from "../three/sci/dock";
import { XPulse } from "../three/sci/Overlays";
import { SciFX as PostFX } from "../three/sci/SciFX";
import { Cam, SciLights, Specks } from "../three/sci/Scene";
import { dist3, glowTexture, rnd } from "../three/sci/util";
import { TeaCup } from "../three/TeaCup";
import { K } from "../theme";
import type { Cue } from "../types";
import { Label, Title } from "../ui/Text";
import { shotDuration, wordAt } from "../vo";
import * as THREE from "three";

export const SH3_DURATION = shotDuration("caff");

const w = (s: string, n = 0) => wordAt("caff", s, n);
const T = {
  cafe1: w("ক্যাফেইন"),
  see: w("দেখতে"),
  adenoW: w("অ্যাডেনোসিনের"),
  tai: w("তাই"),
  age: w("আগে"),
  bose: w("বসে"),
  adeno: w("অ্যাডেনোসিন"),
  pay: w("পায়"),
  fole: w("ফলে"),
  sanket: w("সংকেত"),
  pouchay: w("পৌঁছায়"),
};

/** Caption words (exact VO tokens) to highlight. */
export const SH3_KEYWORDS: string[] = ["ক্যাফেইন", "আগে", "জায়গা", "সংকেত"];
/** Sound cues for this shot (sparse!). */
export const SH3_CUES: Cue[] = [
  { at: 0.3, sfx: "bubble_rise", volume: 0.5 },
  { at: T.bose, sfx: "click_lock", volume: 0.8 },
  { at: T.pay, sfx: "bounce_deny", volume: 0.6 },
];

type V3 = [number, number, number];

// ---------- A: tea, caffeine rising ----------
const HERO_A: V3 = [0.02, 1.62, 0.22];
const TeaWorld: React.FC<{ t: number }> = ({ t }) => {
  const rising = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        x: rnd(`tx${i}`, -0.24, 0.24),
        z: rnd(`tz${i}`, -0.24, 0.24),
        born: rnd(`tb${i}`, -1.6, 2.4),
        v: rnd(`tv${i}`, 0.35, 0.6),
        r: [rnd(`r1${i}`, 0, 6), rnd(`r2${i}`, 0, 6), rnd(`r3${i}`, 0, 6)] as V3,
        drift: rnd(`td${i}`, -0.12, 0.12),
      })),
    [],
  );
  const items: MolItem[] = rising.map((m) => {
    const a = t - m.born;
    const y = 0.95 + Math.max(0, a) * m.v;
    return {
      p: [m.x + m.drift * Math.max(0, a), y, m.z + Math.sin(a * 0.8) * 0.05],
      r: [m.r[0] + t * 0.5, m.r[1] + t * 0.4, m.r[2]],
      s: a < 0 ? 0 : 0.34 * prog(a, 0, 0.5) * (1 - prog(y, 1.9, 2.3)),
    };
  });
  const kRise = prog(t, 0, T.cafe1 + 0.4, ease.outCubic);
  const hero = mix3([0.05, 0.98, 0.05], HERO_A, kRise);
  const kPush = prog(t, T.cafe1 - 0.1, T.cafe1 + 0.9, ease.cine);
  const pos = mix3(mix3([0.25, 3.3, 1.6], [0.2, 3.0, 1.75], prog(t, 0, 1, ease.cine)), [HERO_A[0] + 0.2, HERO_A[1] + 0.55, HERO_A[2] + 2.0], kPush);
  const subject = mix3([0, 1.0, 0], hero, Math.max(kPush, prog(t, 0.3, 1.2, ease.cine) * 0.6));
  return (
    <>
      <SciLights t={t} env={0.5} rim="#ffb27a" />
      <Cam pos={pos} subject={subject} mm={mix(32, 46, kPush)} t={t} />
      <TeaCup t={t} fill={0.85} steam={0.8} caffeineGlow={1} />
      <MolSwarm kind="caffeine" items={items} glow={0.8} />
      <Caffeine t={t} position={hero} rotation={[0.35, t * 0.35, 0.2 + t * 0.1]} scale={1.05 * prog(t, 0, 0.4)} glow={0.6 + 0.4 * kPush} />
      <Specks t={t} center={[0, 1.6, -1]} spread={[6, 4, 4]} opacity={0.1} seed="tea" />
      <PostFX focus={dist3(pos, hero)} focusRange={kPush > 0.5 ? 0.45 : 1.2} bokeh={kPush > 0.5 ? 7 : 4} bloom={0.75} bloomThreshold={0.8} />
    </>
  );
};

// ---------- B: side-by-side compare ----------
const CompareWorld: React.FC<{ t: number }> = ({ t }) => {
  const kIn = prog(t, T.see, T.see + 0.5, ease.out);
  const outline = prog(t, T.adenoW, T.adenoW + 0.45, ease.out);
  const sway = Math.sin((t - T.see) * 0.9) * 0.22;
  const pos: V3 = [0, 0.05, mix(3.55, 3.2, prog(t, T.see, T.tai, ease.cine))];
  const subject: V3 = [0, -0.08, 0];
  return (
    <>
      <SciLights t={t} env={0.35} rim="#ffd2a8" />
      <Cam pos={pos} subject={subject} mm={40} t={t} y={880} shake={0.002} />
      <Adenosine t={t} position={[mix(-1.6, -0.47, kIn), 0, 0]} rotation={[0, sway, HANG_ROT_Z]} scale={1.15} glow={0.75} outline={outline} />
      <Caffeine t={t} position={[mix(1.6, 0.47, kIn), 0, 0]} rotation={[0, sway, HANG_ROT_Z]} scale={1.15} glow={0.75} outline={outline} />
      <Specks t={t} center={[0, 0, -2]} spread={[7, 8, 2]} opacity={0.12} seed="cmp" />
      <PostFX focus={dist3(pos, subject)} focusRange={1.2} bokeh={3} bloom={0.8} bloomThreshold={0.78} />
    </>
  );
};

// ---------- C/D: receptor docking, then the wide blocked field ----------
const FIELD: V3[] = [
  [0, 0, 0],
  [-1.25, 0, -0.55],
  [1.2, 0, -0.85],
  [-0.45, 0, -1.85],
  [0.95, 0, -2.4],
  [-1.95, 0, -2.2],
  [2.2, 0, -0.05],
  [-2.3, 0, 0.75],
  [2.0, 0, -1.9],
  [-0.9, 0, -3.3],
  [0.5, 0, -3.6],
  [1.9, 0, -3.5],
  [-2.6, 0, -3.4],
  [-2.6, 0, 1.3],
  [2.7, 0, 1.0],
];
// Other receptors get filled one by one after the hero dock
const fillAt = (i: number) => (i === 0 ? T.bose : T.bose + 0.45 + ((i * 7) % 15) * 0.27);

const CellWorld: React.FC<{ t: number }> = ({ t }) => {
  const tex = glowTexture();
  // camera
  const kWide = prog(t, T.fole - 0.1, T.sanket + 0.5, ease.cine);
  let pos = mix3([0.25, 2.3, 2.6], [0.05, 1.85, 1.85], prog(t, T.tai, T.pay + 0.3, ease.cine));
  pos = mix3(pos, [-0.4, 4.6, 4.3], kWide);
  const subject = mix3([0, 0.45, 0], [-0.2, 0.0, -0.9], kWide);
  const mm = mix(38, 30, kWide);
  // hero caffeine flies in first and docks on "বসে"
  const caf = dockPath(t, [2.0, 1.6, -0.5], FIELD[0], T.bose, T.bose - T.tai - 0.2, 0.3);
  // adenosine arrives late, bumps on "পায়", bounces off
  const near: V3 = [-0.28, 0.82, 0.12];
  const kA = prog(t, T.age, T.pay, ease.inOut);
  const kB = prog(t, T.pay, T.pay + 1.3, ease.outCubic);
  const ap = mix3(mix3([-2.2, 1.5, 0.4], near, kA), [-1.6, 1.7, 0.6], kB);
  const ar: V3 = [0.4 + t * 0.4 + kB * 2.5, 0.2 + t * 0.3, 1.0 + t * 0.2 + kB * 1.5];
  // others: caffeines falling into the other receptors
  const others: MolItem[] = FIELD.slice(1).map((p, k) => {
    const i = k + 1;
    const from: V3 = [p[0] + rnd(`of${i}`, -0.8, 0.8), 1.9 + rnd(`oy${i}`, 0, 0.6), p[2] + rnd(`oz${i}`, -0.4, 0.4)];
    const d = dockPath(t, from, p, fillAt(i), 1.1, i * 0.3);
    return { p: d.p, r: d.rot, s: d.k > 0 ? 0.95 : 0 };
  });
  // signal pulse: amber comet travelling over the membrane, dies at the blocked receptors
  const sigK = prog(t, T.sanket, T.pouchay + 0.1, ease.inOut);
  const sigDie = prog(t, T.pouchay + 0.1, T.pouchay + 0.7);
  const sigPath = (k: number): V3 => [mix(-2.3, -0.38, k), 0.24, mix(2.3, 0.3, k)];
  const sleepTint = 0;
  return (
    <>
      <SciLights t={t} env={0.4} rim="#7fd6ff" dim={sleepTint} />
      <Cam y={mix(800, 900, kWide)} pos={pos} subject={subject} mm={mm} t={t} />
      <Membrane t={t} w={10} d={9} spacing={0.085} holes={FIELD.map((p) => [p[0], p[2], 0.36] as const)} />
      {FIELD.map((p, i) => (
        <Receptor key={i} t={t + i} position={p} rotation={[0, i * 1.3, 0]} blocked={prog(t, fillAt(i), fillAt(i) + 0.3)} />
      ))}
      <Caffeine t={t} position={caf.p} rotation={caf.rot} scale={1} glow={0.75} />
      {t > T.age - 0.1 ? <Adenosine t={t} position={ap} rotation={ar} scale={1} glow={0.7} opacity={1 - prog(t, T.fole, T.fole + 0.5)} /> : null}
      <MolSwarm kind="caffeine" items={others} glow={0.7} halo={0.8} />
      {t > T.sanket - 0.05 && sigDie < 1 ? (
        <group>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
            const q = sigPath(Math.max(0, sigK - k * 0.035));
            return (
              <sprite key={k} position={q} scale={[1.2 - k * 0.11, 1.2 - k * 0.11, 1]}>
                <spriteMaterial map={tex} color="#ffb547" transparent opacity={(1 - k * 0.1) * (1 - sigDie)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
              </sprite>
            );
          })}
          <sprite position={pocketOf(FIELD[0])} scale={[0.4 + sigDie * 2.2, 0.4 + sigDie * 2.2, 1]}>
            <spriteMaterial map={tex} color="#47d7ff" transparent opacity={sigDie > 0 ? (1 - sigDie) * 0.8 : 0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
        </group>
      ) : null}
      <Specks t={t} center={[0, 1.4, -1.5]} spread={[9, 3, 7]} opacity={0.12} seed="c3" />
      <PostFX focus={dist3(pos, subject)} focusRange={mix(0.8, 2.2, kWide)} bokeh={mix(6, 4, kWide)} bloom={0.75} bloomThreshold={0.8} />
    </>
  );
};

const World: React.FC = () => {
  const t = useSeconds();
  if (t < T.see) return <TeaWorld t={t} />;
  if (t < T.tai) return <CompareWorld t={t} />;
  return <CellWorld t={t} />;
};

export const SH3Caff: React.FC = () => {
  const t = useSeconds();
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      <Stage background="#0f0907">
        <World />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 330 }}>
        <Label at={T.cafe1} until={T.see - 0.12} accent={K.cyan} size={60}>
          ক্যাফেইন
        </Label>
      </AbsoluteFill>
      {t >= T.see - 0.05 && t < T.tai + 0.3 ? (
        <AbsoluteFill style={{ flexDirection: "row", justifyContent: "center", gap: 60, paddingTop: 400 }}>
          <div style={{ height: 0 }}>
            <Label at={T.see + 0.15} until={T.tai - 0.12} accent={K.amber} size={46}>
              অ্যাডেনোসিন
            </Label>
          </div>
          <div style={{ height: 0 }}>
            <Label at={T.see + 0.3} until={T.tai - 0.12} accent={K.cyan} size={46}>
              ক্যাফেইন
            </Label>
          </div>
        </AbsoluteFill>
      ) : null}
      <XPulse at={T.pay} x={450} y={680} len={1.0} size={150} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 260 }}>
        <Title at={T.sanket} color={K.ink} size={118}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 26 }}>
            সংকেত
            <svg width={96} height={96} viewBox="-50 -50 100 100" style={{ filter: `drop-shadow(0 0 16px ${K.red})` }}>
              <path d="M -30 -30 L 30 30 M 30 -30 L -30 30" stroke={K.red} strokeWidth={17} strokeLinecap="round" />
            </svg>
          </span>
        </Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
