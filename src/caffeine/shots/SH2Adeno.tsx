/**
 * SH2 · adeno (owner: science3d). Beats (shot seconds, from VO "adeno"):
 *  0      translucent brain turning slowly; sun → moon arc in the title zone (time passing)
 *  জমতে   amber adenosine molecules start appearing around the brain, count keeps growing
 *  অ্যাডেনোসিন  push-in to one adenosine (macro), label "অ্যাডেনোসিন"
 *  বাড়ে   pull back, more molecules, tiredness meter fills
 *  বসার→জায়গা  dive into the brain surface → receptor on the cell membrane, label "বসার জায়গা"
 *  বসলে   adenosine docks (snap + amber ripple)
 *  ঘুমানো  region dims, "ঘুম"
 */
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { SciFX as PostFX } from "../three/sci/SciFX";
import { Stage } from "../../kit/Stage";
import { ease, mix, mix3, prog, useSeconds } from "../../kit/time";
import { Brain } from "../three/Brain";
import { Adenosine, DOCK_ROT_Z, MolSwarm, type MolItem } from "../three/Molecules";
import { Membrane, RECEPTOR_POCKET, Receptor } from "../three/Receptor";
import { CutFlash, SunMoonArc, TiredMeter } from "../three/sci/Overlays";
import { Cam, SciLights, Specks } from "../three/sci/Scene";
import { dist3, rnd, snap } from "../three/sci/util";
import { K } from "../theme";
import type { Cue } from "../types";
import { Label, Title } from "../ui/Text";
import { shotDuration, wordAt } from "../vo";

export const SH2_DURATION = shotDuration("adeno");

const w = (s: string, n = 0) => wordAt("adeno", s, n);
const T = {
  pile: w("জমতে"),
  name: w("অ্যাডেনোসিন"),
  grow: w("বাড়ে"),
  seatWord: w("বসার"),
  seat: w("জায়গা"),
  adeno2: w("অ্যাডেনোসিন", 1),
  dock: w("বসলে"),
  sleep: w("ঘুমানো"),
};
const CUT = T.seat - 0.25;

/** Caption words (exact VO tokens) to highlight. */
export const SH2_KEYWORDS: string[] = ["জমতে", "অ্যাডেনোসিন", "জায়গা", "ঘুমানো"];
/** Sound cues for this shot (sparse!). */
export const SH2_CUES: Cue[] = [
  { at: T.name - 0.1, sfx: "zoom_in", volume: 0.5 },
  { at: CUT - 0.35, sfx: "dive", volume: 0.6 },
  { at: T.dock, sfx: "dock_amber", volume: 0.8 },
];

type V3 = [number, number, number];
const HERO: V3 = [0.62, 0.42, 1.38];

/** Adenosine cloud around the brain: spawns over time, slow orbit. */
const useCloud = (t: number) => {
  const seeds = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => {
        const u = rnd(`cu${i}`, -1, 1);
        const th = rnd(`ct${i}`, 0, Math.PI * 2);
        const r = rnd(`cr${i}`, 1.35, 2.0);
        const s = Math.sqrt(1 - u * u);
        return {
          dir: [Math.cos(th) * s, u * 0.75 + 0.1, Math.sin(th) * s] as V3,
          r,
          rot: [rnd(`ra${i}`, 0, 6), rnd(`rb${i}`, 0, 6), rnd(`rc${i}`, 0, 6)] as V3,
          spin: rnd(`sp${i}`, -0.5, 0.5),
        };
      }),
    [],
  );
  // number visible: 0 at pile, 16 by name, 56 by grow+1.6
  const n = t < T.pile ? 0 : t < T.name ? mix(0, 16, prog(t, T.pile, T.name)) : mix(16, 56, prog(t, T.name + 0.6, T.grow + 1.6));
  const orbit = t * 0.08;
  return seeds.map((s, i): MolItem => {
    const born = i < 16 ? T.pile + (i / 16) * (T.name - T.pile) : T.name + 0.6 + ((i - 16) / 40) * (T.grow + 1.6 - T.name - 0.6);
    const k = i < n ? snap(prog(t, born, born + 0.45)) : 0;
    const a = orbit * (0.6 + (i % 5) * 0.12);
    const x = s.dir[0] * Math.cos(a) - s.dir[2] * Math.sin(a);
    const z = s.dir[0] * Math.sin(a) + s.dir[2] * Math.cos(a);
    const rr = s.r + Math.sin(t * 0.5 + i) * 0.05;
    return { p: [x * rr, s.dir[1] * rr, z * rr], r: [s.rot[0] + t * s.spin, s.rot[1] + t * s.spin * 0.7, s.rot[2]], s: 0.5 * k };
  });
};

const BrainWorld: React.FC<{ t: number }> = ({ t }) => {
  const items = useCloud(t);
  // camera: slow push, macro on the hero molecule, pull back, dive to the surface
  const wide0: V3 = [0.2, 0.5, 5.4];
  const wide1: V3 = [0.1, 0.45, 4.9];
  const macro: V3 = [HERO[0] + 0.35, HERO[1] + 0.2, HERO[2] + 2.1];
  const wide2: V3 = [-0.2, 0.65, 5.6];
  const surf: V3 = [0.25, 0.86, 0.35];
  const kIn = prog(t, T.name - 0.15, T.name + 1.0, ease.cine);
  const kOut = prog(t, T.grow - 0.1, T.grow + 1.3, ease.cine);
  const kDive = prog(t, T.seatWord - 0.4, CUT, ease.inQuad);
  let pos = mix3(wide0, wide1, prog(t, 0, T.name, ease.cine));
  pos = mix3(pos, macro, kIn);
  pos = mix3(pos, wide2, kOut);
  const divePos: V3 = [surf[0] + 0.05, surf[1] + 0.22, surf[2] + 0.32];
  pos = mix3(pos, divePos, kDive);
  let subject: V3 = mix3([0, 0, 0], HERO, kIn * (1 - kOut));
  subject = mix3(subject, surf, kDive);
  const mm = mix(mix(mix(35, 46, kIn), 38, kOut), 46, kDive);
  const focus = dist3(pos, subject);
  const brainGlow = 0.55 + 0.3 * prog(t, T.pile, T.grow + 1.5);
  return (
    <>
      <SciLights t={t} />
      <Cam pos={pos} subject={subject} mm={mm} t={t} />
      <Brain t={t} glow={brainGlow} rotation={[0.1, -1.3 + t * 0.035, 0]} />
      <MolSwarm kind="adenosine" items={items} glow={0.7} />
      <Adenosine
        t={t}
        position={HERO}
        rotation={[0.25, -0.35 + t * 0.12, -0.5 + t * 0.05]}
        scale={1.1 * snap(prog(t, T.pile + 0.6, T.pile + 1.1))}
        glow={0.6 + 0.4 * kIn}
      />
      <Specks t={t} center={[0, 0.5, -1]} spread={[9, 6, 6]} opacity={0.12} />
      <PostFX focus={focus} focusRange={kIn > 0.5 && kOut < 0.5 ? 0.5 : 1.6} bokeh={kIn > 0.5 && kOut < 0.5 ? 8 : 3} bloom={0.75} bloomThreshold={0.8} />
    </>
  );
};

const RECEPTORS: { p: V3; s: number }[] = [
  { p: [0, 0, 0], s: 1 },
  { p: [-1.35, 0, -0.75], s: 1 },
  { p: [1.3, 0, -1.0], s: 0.95 },
  { p: [-0.5, 0, -2.1], s: 1 },
  { p: [0.95, 0, -2.6], s: 1 },
  { p: [-2.3, 0, -2.0], s: 1 },
  { p: [2.4, 0, -0.1], s: 1 },
  { p: [-1.9, 0, 0.9], s: 0.9 },
];

const CellWorld: React.FC<{ t: number }> = ({ t }) => {
  const kLand = prog(t, CUT, T.seat + 1.1, ease.out);
  const sleep = prog(t, T.sleep - 0.15, T.sleep + 1.0, ease.inOut);
  const pos = mix3(mix3([0.2, 3.6, 3.4], [0.1, 2.0, 2.7], kLand), [0.05, 1.65, 2.15], prog(t, T.seat + 1.1, T.dock + 0.6, ease.cine));
  const pocket: V3 = [RECEPTOR_POCKET[0], RECEPTOR_POCKET[1], RECEPTOR_POCKET[2]];
  const subject: V3 = [0, 0.32, 0];
  // adenosine path: drifts in from the left, homes in on the pocket, snaps at "বসলে"
  const start: V3 = [-1.7, 1.25, 0.2];
  const near: V3 = [-0.25, 0.85, 0.1];
  const k1 = prog(t, CUT + 0.3, T.adeno2 + 0.3, ease.inOut);
  const k2 = prog(t, T.dock - 0.35, T.dock);
  let mp = mix3(start, near, k1);
  mp = mix3(mp, pocket, snap(k2));
  const rot: V3 = [mix(0.9 + t * 0.4, 0, k2), mix(0.3 + t * 0.3, 0, k2), mix(t * 0.5, DOCK_ROT_Z, k2)];
  const lit = prog(t, T.dock, T.dock + 0.25) * (1 - sleep * 0.6);
  return (
    <>
      <SciLights t={t} dim={sleep * 0.8} rim="#ffae6b" />
      <Cam y={790} pos={pos} subject={subject} mm={36} t={t} />
      <Membrane t={t} w={9} d={8} holes={RECEPTORS.map((r) => [r.p[0], r.p[2], 0.36 * r.s] as const)} dim={sleep * 0.7} warm={lit * 0.4} />
      {RECEPTORS.map((r, i) => (
        <Receptor key={i} t={t + i} position={r.p} scale={r.s} rotation={[0, i * 0.9, 0]} lit={i === 0 ? lit : 0} dim={sleep} />
      ))}
      <Adenosine t={t} position={mp} rotation={rot} scale={1.0} glow={0.7 + lit * 0.3 - sleep * 0.4} />
      <Specks t={t} center={[0, 1.2, -1]} spread={[8, 3, 6]} opacity={0.14 * (1 - sleep * 0.6)} seed="cell" />
      <PostFX focus={dist3(pos, subject)} focusRange={0.8} bokeh={7} bloom={0.7} bloomThreshold={0.82} vignette={0.5 + sleep * 0.3} />
    </>
  );
};

const World: React.FC = () => {
  const t = useSeconds();
  return t < CUT ? <BrainWorld t={t} /> : <CellWorld t={t} />;
};

export const SH2Adeno: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      <Stage background="#120a08">
        <World />
      </Stage>
      <CutFlash at={CUT} />
      <SunMoonArc a={0.2} b={T.name - 0.05} from={0.4} to={T.name - 0.4} />
      <TiredMeter a={T.grow} b={CUT} fillA={T.grow} fillB={T.grow + 1.8} top={300} />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <Label at={T.name} until={T.grow - 0.2} accent={K.amber} size={56}>
          অ্যাডেনোসিন
        </Label>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 300 }}>
        <Label at={T.seat} until={T.sleep - 0.25} accent={K.amber} size={56}>
          বসার জায়গা
        </Label>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 260 }}>
        <Title at={T.sleep} color={K.ink} size={120}>
          ঘুম
        </Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
