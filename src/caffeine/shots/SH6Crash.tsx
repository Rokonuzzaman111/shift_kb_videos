/**
 * SH6 · crash (owner: science3d). Beats (shot seconds, from VO "crash"):
 *  0        receptors on the membrane all blocked by cyan caffeine; amber adenosine crowd gathers above
 *  থামে     crowd keeps growing (counter rising in the title zone); জমতেই: crane up to show the crowd
 *  সরে      caffeine molecules lift off one by one and drift away
 *  একসাথে   the whole amber crowd rushes in at once and docks (low thud), receptors light amber
 *  ~9.6     cut: brain wrapped in amber, its glow dims hard
 *  ঘুম      cut: exam hall, student yawns → nods; title "এজন্যই ঝিমানো" on ঝিমানোর
 */
import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import { Stage } from "../../kit/Stage";
import { ease, mix, mix3, prog, useSeconds } from "../../kit/time";
import { Brain } from "../three/Brain";
import { MolSwarm, type MolItem } from "../three/Molecules";
import { Membrane, Receptor } from "../three/Receptor";
import { dockPath, undockPath } from "../three/sci/dock";
import { SciFX as PostFX } from "../three/sci/SciFX";
import { Cam, SciLights, Specks } from "../three/sci/Scene";
import { dist3, rnd, snap } from "../three/sci/util";
import { K, bodyFont } from "../theme";
import { ExamHall } from "../two/ExamHall";
import { Student } from "../two/Student";
import type { Cue } from "../types";
import { Counter, Title } from "../ui/Text";
import { shotDuration, wordAt } from "../vo";

export const SH6_DURATION = shotDuration("crash");

const w = (s: string, n = 0) => wordAt("crash", s, n);
const T = {
  thame: w("থামে"),
  jomtei: w("জমতেই"),
  sore: w("সরে"),
  eksathe: w("একসাথে"),
  kaj: w("কাজ"),
  ghum: w("ঘুম"),
  porikkha: w("পরীক্ষার"),
  jhim: w("ঝিমানোর"),
};
const BRAIN_CUT = T.kaj + 1.15;

/** Caption words (exact VO tokens) to highlight. */
export const SH6_KEYWORDS: string[] = ["থামে", "একসাথে", "ঘুম", "ঝিমানোর"];
/** Sound cues for this shot (sparse!). */
export const SH6_CUES: Cue[] = [
  { at: T.sore, sfx: "release_pluck", volume: 0.5 },
  { at: T.eksathe, sfx: "thud_low", volume: 0.9 },
  { at: T.ghum, sfx: "whoosh_soft", volume: 0.35 },
];

type V3 = [number, number, number];
const RECS: V3[] = [
  [-1.45, 0, -0.35],
  [-0.72, 0, 0.25],
  [0, 0, -0.25],
  [0.74, 0, 0.3],
  [1.48, 0, -0.3],
  [-2.3, 0, -1.4],
  [2.3, 0, -1.3],
  [-0.4, 0, -1.6],
  [0.9, 0, -1.8],
];
const N_CROWD = 64;

const MembraneWorld: React.FC<{ t: number }> = ({ t }) => {
  const crowd = useMemo(
    () =>
      Array.from({ length: N_CROWD }, (_, i) => {
        // spawn accelerates over time (the queue keeps growing)
        const born = 0.2 + Math.pow(i / N_CROWD, 0.75) * (T.sore - 0.4);
        const u = rnd(`cy${i}`);
        return {
          born,
          home: [rnd(`cx${i}`, -2.4, 2.4), 1.15 + u * 1.25, rnd(`cz${i}`, -1.9, 0.5)] as V3,
          // where it lands after the rush: around the receptors, near the membrane
          land: [rnd(`lx${i}`, -2.2, 2.2), 0.28 + rnd(`ly${i}`, 0, 0.45), rnd(`lz${i}`, -1.6, 0.7)] as V3,
          r: [rnd(`r1${i}`, 0, 6), rnd(`r2${i}`, 0, 6), rnd(`r3${i}`, 0, 6)] as V3,
          ph: rnd(`ph${i}`, 0, 6.28),
          delay: rnd(`dl${i}`, 0, 0.25),
        };
      }),
    [],
  );
  const rush = (i: number) => prog(t, T.eksathe + crowd[i].delay * 0.6, T.eksathe + 0.55 + crowd[i].delay, ease.inOut);
  // first 5 crowd members dock into the 5 front receptors; others pile up around
  const amber: MolItem[] = crowd.map((m, i) => {
    const bob: V3 = [Math.sin(t * 0.7 + m.ph) * 0.06, Math.sin(t * 0.9 + m.ph * 2) * 0.05, 0];
    const idle = mix3(m.home, [m.home[0] + bob[0], m.home[1] + bob[1], m.home[2]], 1);
    const s = 0.55 * snap(prog(t, m.born, m.born + 0.4));
    if (i < 5) {
      const d = dockPath(t, idle, RECS[i], T.eksathe + 0.5, 0.5, i * 0.2);
      return { p: d.p, r: d.k > 0 ? d.rot : [m.r[0] + t * 0.4, m.r[1] + t * 0.3, m.r[2]], s: mix(s, 0.9, d.k) };
    }
    const k = rush(i);
    return { p: mix3(idle, m.land, k), r: [m.r[0] + t * 0.4 + k * 2, m.r[1] + t * 0.3, m.r[2]], s };
  });
  // caffeine leaves one by one
  const cyan: MolItem[] = RECS.map((p, i) => {
    const order = [2, 0, 4, 1, 3, 5, 6, 7, 8][i];
    const u = undockPath(t, p, T.sore + order * 0.22, [p[0] * 0.4 + (i % 2 ? 0.5 : -0.5), 2.4, 1.0 + (i % 3) * 0.3], i * 0.2);
    return { p: u.p, r: u.rot, s: 0.9 * (1 - prog(u.k, 0.7, 1)) };
  });
  const lit = (i: number) => (i < 5 ? prog(t, T.eksathe + 0.5, T.eksathe + 0.75) : prog(t, T.eksathe + 0.7, T.eksathe + 1.0) * 0.7);
  const blocked = (i: number) => 1 - prog(t, T.sore + [2, 0, 4, 1, 3, 5, 6, 7, 8][i] * 0.22, T.sore + [2, 0, 4, 1, 3, 5, 6, 7, 8][i] * 0.22 + 0.4);
  const dim = prog(t, T.eksathe + 0.8, BRAIN_CUT, ease.inOut) * 0.45;
  // camera
  let pos = mix3([0.0, 1.75, 4.0], [0.1, 1.8, 3.6], prog(t, 0, T.jomtei, ease.cine));
  pos = mix3(pos, [0.35, 2.75, 4.25], prog(t, T.jomtei - 0.2, T.jomtei + 1.4, ease.cine));
  pos = mix3(pos, [0.1, 2.0, 3.3], prog(t, T.eksathe - 0.1, T.eksathe + 0.7, ease.out));
  let subject = mix3([0, 0.6, -0.3], [0, 1.05, -0.5], prog(t, T.jomtei - 0.2, T.jomtei + 1.4, ease.cine));
  subject = mix3(subject, [0, 0.45, -0.2], prog(t, T.eksathe - 0.1, T.eksathe + 0.7, ease.out));
  return (
    <>
      <SciLights t={t} env={0.4} dim={dim} />
      <Cam pos={pos} subject={subject} mm={32} t={t} />
      <Membrane t={t} w={10} d={8} spacing={0.085} holes={RECS.map((p) => [p[0], p[2], 0.36] as const)} dim={dim} warm={prog(t, T.eksathe + 0.5, T.eksathe + 0.9) * 0.6} />
      {RECS.map((p, i) => (
        <Receptor key={i} t={t + i} position={p} rotation={[0, i * 1.1, 0]} blocked={blocked(i)} lit={lit(i) * (1 - dim)} dim={dim} />
      ))}
      <MolSwarm kind="caffeine" items={cyan} glow={0.7} halo={0.8} />
      <MolSwarm kind="adenosine" items={amber} glow={0.7} halo={0.9} />
      <Specks t={t} center={[0, 1.4, -1.5]} spread={[9, 4, 6]} opacity={0.1} seed="c6" />
      <PostFX focus={dist3(pos, subject)} focusRange={1.6} bokeh={4} bloom={0.75} bloomThreshold={0.8} vignette={0.5 + dim * 0.5} />
    </>
  );
};

const BrainWorld: React.FC<{ t: number }> = ({ t }) => {
  const items = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const u = rnd(`bu${i}`, -0.7, 1);
        const th = rnd(`bt${i}`, 0, 6.28);
        const s = Math.sqrt(1 - u * u);
        const r = rnd(`br${i}`, 1.05, 1.35);
        return { p: [Math.cos(th) * s * r * 0.95, u * r * 0.8 + 0.1, Math.sin(th) * s * r * 1.1] as V3, rot: [rnd(`q${i}`, 0, 6), rnd(`q2${i}`, 0, 6), 0] as V3 };
      }),
    [],
  );
  const dim = prog(t, BRAIN_CUT + 0.15, T.ghum - 0.1, ease.inOut);
  const mol: MolItem[] = items.map((m) => ({ p: m.p, r: [m.rot[0] + t * 0.2, m.rot[1] + t * 0.15, 0], s: 0.42 }));
  const pos = mix3([0.4, 0.5, 5.0], [0.3, 0.45, 4.3], prog(t, BRAIN_CUT, T.ghum, ease.cine));
  return (
    <>
      <SciLights t={t} env={0.45} dim={dim * 0.85} />
      <Cam pos={pos} subject={[0, 0, 0]} mm={35} t={t} />
      <Brain t={t} glow={0.7 * (1 - dim)} dim={dim} rotation={[0.1, -1.2 + t * 0.03, 0]} />
      <MolSwarm kind="adenosine" items={mol} glow={0.75 - dim * 0.35} halo={0.9} />
      <PostFX focus={dist3(pos, [0, 0, 0])} focusRange={1.6} bokeh={3} bloom={0.7} bloomThreshold={0.8} vignette={0.5 + dim * 0.4} />
    </>
  );
};

const World: React.FC = () => {
  const t = useSeconds();
  return t < BRAIN_CUT ? <MembraneWorld t={t} /> : <BrainWorld t={t} />;
};

const CrowdCounter: React.FC = () => {
  const t = useSeconds();
  const o = prog(t, 0.5, 0.8, ease.out) * (1 - prog(t, T.eksathe + 0.6, T.eksathe + 0.9));
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 280, opacity: o }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "10px 36px",
          borderRadius: 999,
          background: K.panel,
          border: `2px solid ${K.panelBorder}`,
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          fontFamily: bodyFont,
          fontWeight: 700,
          fontSize: 46,
          color: K.ink,
        }}
      >
        <span style={{ width: 26, height: 26, borderRadius: 99, background: K.amber, boxShadow: `0 0 18px ${K.amber}` }} />
        <span>অ্যাডেনোসিন</span>
        <div style={{ minWidth: 110, textAlign: "right" }}>
          <Counter from={4} to={N_CROWD} a={0.5} b={T.sore - 0.2} color={K.amber} size={64} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SH6Crash: React.FC = () => {
  const t = useSeconds();
  const hall = t >= T.ghum;
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      {!hall ? (
        <Stage background="#0f0907">
          <World />
        </Stage>
      ) : (
        <AbsoluteFill>
          <ExamHall t={t} />
          <AbsoluteFill style={{ alignItems: "center", paddingTop: 470 }}>
            <Student t={t} pose={t < T.porikkha + 0.2 ? "yawn" : "nodding"} poseAt={t < T.porikkha + 0.2 ? T.ghum : T.porikkha + 0.2} width={640} />
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      {!hall ? <CrowdCounter /> : null}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        <Title at={T.jhim} color={K.amber} size={110}>
          এজন্যই ঝিমানো
        </Title>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
