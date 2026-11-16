/**
 * Part 2 · Section 2A–2D (0 → cut before "কোনো").
 * A "দুই হাজার আট সালে চালু হওয়া এই ভল্ট" — macro: brushed-steel plaque on frosted concrete, frost wipes off the engraved
 *   "26 · 02 · 2008"; amber rim light, ice crystals; slow push + rack focus (foreground ice → plaque).
 *   Text: amber date "২৬ ফেব্রুয়ারি ২০০৮", kicker "চালু হয়".
 * B "আসলে পৃথিবীর কৃষির একটা ব্যাকআপ" — a wheat ear on dark slate under a teal scanner line; its glass replica lifts off,
 *   slides into a frosted steel drawer, the drawer shuts. Dolly side → push on the drawer. Headline "কৃষির ব্যাকআপ".
 * C "বিভিন্ন দেশের গবেষণা প্রতিষ্ঠান আর জিন-ব্যাংকে" — genebank cold room, compact mobile shelving opens an aisle; FAST
 *   lateral track. Chip "বিশ্বে প্রায়" + amber count "১,৭৫০টি" + "জিন-ব্যাংক".
 * D "ধান, গম, ভুট্টাসহ হাজারো জাতের বীজ রাখা হয়" — macro pans over three brass scoops (rice / wheat / maize, pinned labels
 *   on their words), then a big pull-back reveals a wall of hundreds of coloured seed jars. Headline "হাজারো জাত".
 */
import { useMemo } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HDRI, Lighting } from "../../../kit/assets";
import { PostFX } from "../../../kit/PostFX";
import { Lens, Stage } from "../../../kit/Stage";
import { ease, handheld, mix, mix3, prog } from "../../../kit/time";
import { NV, SV } from "../../PartPlayer";
import { headFont, numFont } from "../../theme";
import { project, type V3 } from "../../three/util";
import { atAfter } from "../../vo";
import { GenebankRoom, JarWall } from "../models/Genebank";
import { CAB, KeyLight, PlaqueWall, SCOOP, Scoop, SeedDrawer, Slate, WheatEar, trayX } from "../models/SeedMacro";
import { P, bn, pa } from "../palette";
import { PinLabel } from "../ui/PinLabel";

const W = 1080;
const H = 1920;

export const S2A_END_WORD = "কোনো";
/** cut sits in the pause before "কোনো" (part seconds) */
export const s2aEnd = (a = 0) => atAfter("p2", S2A_END_WORD, a) - 0.25;

const times = (a: number) => {
  const w = (word: string) => atAfter("p2", word, a) - a;
  const T = {
    dui: w("দুই"),
    hajar: w("হাজার"),
    at: w("আট"),
    sale: w("সালে"),
    chalu: w("চালু"),
    vault: w("ভল্ট"),
    asole: w("আসলে"),
    prithibir: w("পৃথিবীর"),
    krishir: w("কৃষির"),
    ekta: w("একটা"),
    backup: w("ব্যাকআপ"),
    bibhinno: w("বিভিন্ন"),
    gobeshona: w("গবেষণা"),
    jinbank: w("জিন-ব্যাংকে"),
    dhan: w("ধান"),
    gom: w("গম"),
    bhutta: w("ভুট্টাসহ"),
    hajaro: w("হাজারো"),
    rakha: w("রাখা"),
    end: s2aEnd(a) - a,
  };
  return { ...T, cutB: T.asole - 0.06, cutC: T.bibhinno - 0.15, cutD: T.dhan - 0.08 };
};
type T = ReturnType<typeof times>;

/** internal shot cuts (part seconds) for the beat layer */
export const s2aCuts = (a = 0) => {
  const T = times(a);
  return [a + T.cutB, a + T.cutC, a + T.cutD];
};

type Cam = { position: V3; target: V3; mm: number };

/* ───────────── cameras ───────────── */
const camA = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, -0.2, T.cutB + 0.2));
  const hh = handheld(t, 0.002, 1);
  const p = mix3([0.32, 0.12, 2.0], [0.06, 0.03, 1.4], k);
  return { position: [p[0] + hh[0], p[1] + hh[1], p[2] + hh[2]], target: mix3([0.02, -0.02, 0], [0, 0.0, 0], k), mm: 40 };
};

const EAR_X = -0.15;
const camB = (t: number, T: T): Cam => {
  const k1 = ease.inOut(prog(t, T.cutB - 0.1, T.ekta + 0.2));
  const k2 = ease.out(prog(t, T.ekta, T.cutC + 0.1));
  let pos = mix3([-0.26, 0.17, 0.3], [-0.06, 0.4, 0.62], k1);
  let tgt = mix3([EAR_X + 0.02, 0.01, 0], [0.0, 0.03, 0], k1);
  pos = mix3(pos, [0.0, 0.38, 0.55], k2);
  tgt = mix3(tgt, [0.1, 0.06, 0], k2);
  const hh = handheld(t, 0.0015, 2);
  return { position: [pos[0] + hh[0], pos[1] + hh[1], pos[2]], target: tgt, mm: 45 };
};

const camC = (t: number, T: T): Cam => {
  const k = prog(t, T.cutC - 0.05, T.cutD + 0.05, (x) => 0.12 * x + 0.88 * ease.inOut(x));
  const x = mix(-5.6, 5.6, k);
  const hh = handheld(t, 0.01, 3);
  return { position: [x + hh[0], 1.45 + hh[1], 1.0], target: [x + 0.9, 1.2, -3], mm: 22 };
};

const SCOOPS = [
  { kind: "rice" as const, x: -0.095 },
  { kind: "wheat" as const, x: 0 },
  { kind: "maize" as const, x: 0.095 },
];
const TABLE_Y = 0.8;
const scoopTop = (i: number): V3 => [SCOOPS[i].x, TABLE_Y + SCOOP.r + 0.012, 0.005];

const camD = (t: number, T: T): Cam => {
  const pan = (i: number) => {
    const p = scoopTop(i);
    return { pos: [p[0] + 0.035, p[1] + 0.13, p[2] + 0.2] as V3, tgt: [p[0], p[1] - 0.006, p[2] - 0.004] as V3 };
  };
  const a = pan(0);
  const b = pan(1);
  const c = pan(2);
  const k1 = ease.inOut(prog(t, T.gom - 0.25, T.gom + 0.1));
  const k2 = ease.inOut(prog(t, T.bhutta - 0.25, T.bhutta + 0.1));
  let pos = mix3(mix3(a.pos, b.pos, k1), c.pos, k2);
  let tgt = mix3(mix3(a.tgt, b.tgt, k1), c.tgt, k2);
  const drift = (t - T.cutD) * 0.006;
  pos = [pos[0] + drift, pos[1], pos[2]];
  // big pull-back: exponential so the zoom feels even
  const kp = ease.inOut(prog(t, T.hajaro - 0.2, T.end + 0.15));
  const ratio = 22;
  const ke = (Math.pow(ratio, kp) - 1) / (ratio - 1);
  pos = mix3(pos, [0.35, 1.3, 3.1], ke);
  tgt = mix3(tgt, [0.05, 1.05, -1], ke);
  return { position: pos, target: tgt, mm: mix(45, 28, ke) };
};

const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/* ───────────── scenes ───────────── */
const SceneA: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const wipe = ease.inOut(prog(t, T.hajar, T.chalu));
  const rack = ease.inOut(prog(t, T.hajar - 0.1, T.sale));
  const focus = mix(dist(cam.position, [0, 0, 0.012]) * 0.6, dist(cam.position, [0, 0, 0.012]), rack);
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.02} far={30} />
      <color attach="background" args={[P.night]} />
      <fogExp2 attach="fog" args={["#0b1622", 0.12]} />
      <Lighting hdri={HDRI.studio} intensity={0.32} rotation={1.2} />
      <KeyLight position={[0.9, 1.4, 1.6]} intensity={0.9} half={0.8} color="#dfe8f2" />
      <spotLight position={[-1.0, 0.08, 0.35]} angle={0.5} penumbra={0.8} intensity={9} color={P.amber} distance={4} decay={2} />
      <PlaqueWall wipe={wipe} />
      <PostFX focus={focus} focusRange={0.1} bokeh={4} bloom={0.6} bloomThreshold={0.85} vignette={0.55} aberration={0.0008} />
    </>
  );
};

const SceneB: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const scan = prog(t, T.cutB + 0.05, T.krishir, ease.inOut);
  const scanOn = scan > 0 && scan < 1 ? 1 : 0;
  const lift = ease.inOut(prog(t, T.prithibir + 0.1, T.krishir + 0.05));
  const move = ease.inOut(prog(t, T.krishir, T.ekta + 0.05));
  const drop = ease.inOut(prog(t, T.ekta + 0.05, T.backup));
  const close = ease.inOut(prog(t, T.backup - 0.02, T.backup + 0.3));
  const open = 0.25 * (1 - close);
  const rx = mix(EAR_X - 0.015, trayX(open) - 0.0, move);
  const ry = 0.006 + 0.09 * lift - mix(0, 0.09 - 0.017, drop);
  const glass = useGlass();
  const wheat = useWheat();
  const sx = EAR_X - 0.13 + scan * 0.26;
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.01} far={20} />
      <color attach="background" args={[P.night]} />
      <fogExp2 attach="fog" args={["#0a1420", 0.15]} />
      <Lighting hdri={HDRI.studio} intensity={0.95} rotation={2.2} />
      <KeyLight position={[-0.6, 1.1, 0.7]} intensity={3.2} half={0.45} color="#fff3e0" />
      {/* soft cool fill from camera side + warm rim behind the ear and drawer */}
      <directionalLight position={[0.4, 0.5, 1.2]} intensity={1.1} color="#dbe7f2" />
      <spotLight position={[-0.1, 0.35, -0.6]} angle={0.7} penumbra={0.8} intensity={6} color={P.amber} distance={2} decay={2} />
      <pointLight position={[0.7, 0.35, -0.4]} intensity={1.2} color={P.amber} distance={3} decay={2} />
      <Slate size={[1.6, 0.03, 1.0]} position={[0.1, -0.015, 0]} repeat={1} />
      <WheatEar mat={wheat} position={[EAR_X, 0.006, 0.01]} rotation={[Math.PI / 2 - 0.05, 0, -Math.PI / 2]} />
      {lift > 0.001 && <WheatEar mat={glass} position={[rx, ry, 0.01 + 0.004 * lift]} rotation={[Math.PI / 2 - 0.05, 0, -Math.PI / 2]} shadows={false} />}
      <group position={[0, 0, 0]}>
        <SeedDrawer open={open} />
      </group>
      {scanOn ? (
        <>
          <mesh position={[sx, 0.03, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.003, 0.1]} />
            <meshBasicMaterial color={P.vaultTeal} toneMapped={false} transparent opacity={0.9} />
          </mesh>
          <mesh position={[sx, 0.0015, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.004, 0.16]} />
            <meshBasicMaterial color={P.vaultTeal} toneMapped={false} transparent opacity={0.8} />
          </mesh>
          <pointLight position={[sx, 0.03, 0.02]} intensity={0.06} color={P.vaultTeal} distance={0.3} decay={2} />
        </>
      ) : null}
      <PostFX focus={dist(cam.position, mix3([EAR_X, 0.01, 0], [CAB.x0, 0.08, 0], prog(t, T.krishir, T.ekta + 0.2)))} focusRange={0.06} bokeh={5} bloom={0.7} bloomThreshold={0.8} vignette={0.52} />
    </>
  );
};

const useGlass = () => useMemoOnce(() => new THREE.MeshPhysicalMaterial({ color: "#f0dcae", roughness: 0.08, metalness: 0, transparent: true, opacity: 0.6, clearcoat: 1, envMapIntensity: 1.4, depthWrite: false }));
const useWheat = () => useMemoOnce(() => new THREE.MeshPhysicalMaterial({ color: "#d8b06a", roughness: 0.55, sheen: 0.6, sheenColor: new THREE.Color("#f3dfae") }));

const useMemoOnce = <X,>(f: () => X) => useMemo(f, []); // eslint-disable-line react-hooks/exhaustive-deps

const SceneC: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const open = ease.inOut(prog(t, T.cutC, T.gobeshona + 0.2));
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.05} far={60} />
      <color attach="background" args={["#8fa0b0"]} />
      <fogExp2 attach="fog" args={["#8fa0b0", 0.07]} />
      <Lighting hdri={HDRI.studio} intensity={0.4} />
      <KeyLight position={[1.5, 6, 3]} intensity={1.2} half={8} />
      <pointLight position={[cam.position[0] + 1, 2.7, -1]} intensity={2.5} color="#e6eef5" distance={6} decay={2} />
      <GenebankRoom open={open} t={t} />
      <PostFX bloom={0.6} bloomThreshold={0.85} vignette={0.5} aberration={0.0016} />
    </>
  );
};

const SceneD: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const kp = prog(t, T.hajaro - 0.2, T.end, ease.inOut);
  const tgt = cam.target;
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.01} far={40} />
      <color attach="background" args={["#121c28"]} />
      <fogExp2 attach="fog" args={["#121c28", 0.06]} />
      <Lighting hdri={HDRI.studio} intensity={0.5} rotation={0.6} />
      <KeyLight position={[-1.2, 3.2, 2.2]} intensity={1.6} half={1.6 + 2 * kp} />
      <pointLight position={[0.5, 1.3, 0.6]} intensity={0.8} color={P.amber} distance={3} decay={2} />
      {/* table: slate top on steel legs */}
      <Slate size={[1.3, 0.04, 0.7]} position={[0, TABLE_Y - 0.02, 0.05]} repeat={1} />
      {[-0.6, 0.6].map((x) =>
        [-0.25, 0.35].map((z) => (
          <mesh key={`${x}${z}`} position={[x, (TABLE_Y - 0.04) / 2, z]} castShadow>
            <boxGeometry args={[0.04, TABLE_Y - 0.04, 0.04]} />
            <meshStandardMaterial color="#8d969f" metalness={0.9} roughness={0.35} />
          </mesh>
        )),
      )}
      {SCOOPS.map((s, i) => (
        <Scoop key={s.kind} kind={s.kind} position={[s.x, TABLE_Y, 0]} yaw={(i - 1) * 0.06} />
      ))}
      <JarWall z={-1.0} width={5.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#3a434d" roughness={0.6} />
      </mesh>
      <PostFX focus={dist(cam.position, tgt)} focusRange={mix(0.035, 1.2, kp)} bokeh={mix(6, 2.5, kp)} bloom={0.55} bloomThreshold={0.85} vignette={0.5} />
    </>
  );
};

/* ───────────── text (top zone, one block at a time) ───────────── */
export const pop = (t: number, at: number, fps: number) => spring({ frame: Math.round((t - at) * fps), fps, config: { damping: 12, stiffness: 180, mass: 0.6 } });
const outK = (t: number, at: number) => interpolate(t, [at, at + 0.2], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const Chip: React.FC<{ readonly text: string; readonly k: number }> = ({ text, k }) => (
  <div
    style={{
      display: "inline-block",
      padding: "9px 22px 12px",
      borderRadius: 999,
      background: P.vaultTeal,
      color: P.night,
      fontFamily: headFont,
      fontWeight: 800,
      fontSize: 38,
      lineHeight: 1,
      transform: `scale(${0.4 + 0.6 * k})`,
      transformOrigin: "left center",
      opacity: Math.min(1, k * 1.6),
      boxShadow: `0 10px 30px ${pa(P.night, 0.45)}`,
    }}
  >
    {text}
  </div>
);

export const Block: React.FC<{ readonly t: number; readonly inAt: number; readonly outAt: number; readonly children: (k: number) => React.ReactNode }> = ({ t, inAt, outAt, children }) => {
  const { fps } = useVideoConfig();
  if (t < inAt - 0.02 || t > outAt + 0.25) return null;
  const k = pop(t, inAt, fps);
  const o = outK(t, outAt);
  return <div style={{ position: "absolute", left: 72, right: 72, top: 200, opacity: o, transform: `translateY(${(1 - o) * -24}px)` }}>{children(k)}</div>;
};

export const rise = (k: number): React.CSSProperties => ({
  display: "block",
  transform: `translateY(${(1 - k) * 40}px) scale(${0.86 + 0.14 * k})`,
  transformOrigin: "left bottom",
  opacity: Math.min(1, k * 1.5),
});
export const headline: React.CSSProperties = {
  fontFamily: headFont,
  fontWeight: 800,
  fontSize: 112,
  lineHeight: 1.02,
  color: P.snow,
  textShadow: `0 4px 30px ${pa(P.night, 0.75)}, 0 1px 3px ${pa(P.night, 0.6)}`,
};
const amberNum: React.CSSProperties = {
  fontFamily: `${numFont}, ${headFont}`,
  fontWeight: 900,
  color: P.amber,
  lineHeight: 1.05,
  textShadow: `0 0 34px ${pa(P.amber, 0.35)}, 0 4px 24px ${pa(P.night, 0.8)}`,
};
const Bar: React.FC<{ readonly k: number }> = ({ k }) => (
  <div style={{ marginTop: 18, height: 6, width: 240 * Math.min(1, k), borderRadius: 3, background: P.vaultTeal, boxShadow: `0 0 18px ${pa(P.vaultTeal, 0.6)}` }} />
);

const Overlays: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const { fps } = useVideoConfig();
  const count = Math.round(1750 * prog(t, T.gobeshona, T.gobeshona + 0.9, ease.outCubic));
  const inD = t >= T.cutD && t < T.end;
  const pins = inD ? SCOOPS.map((_, i) => project(cam, scoopTop(i), W, H)) : [];
  const names = ["ধান", "গম", "ভুট্টা"];
  const pinIn = [T.dhan, T.gom, T.bhutta];
  const pinOut = [T.gom - 0.12, T.bhutta - 0.12, T.hajaro - 0.25];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* A: date + kicker */}
      <Block t={t} inAt={T.at - 0.05} outAt={T.cutB - 0.22}>
        {(k) => (
          <>
            {t >= T.chalu - 0.05 ? <Chip text="চালু হয়" k={pop(t, T.chalu - 0.05, fps)} /> : <div style={{ height: 50 }} />}
            <div style={{ ...amberNum, fontSize: 104, marginTop: 14, ...rise(k) }}>২৬ ফেব্রুয়ারি</div>
            <div style={{ ...amberNum, fontSize: 150, ...rise(pop(t, T.at + 0.05, fps)) }}>{bn(2008)}</div>
          </>
        )}
      </Block>
      {/* B: headline */}
      <Block t={t} inAt={T.krishir - 0.04} outAt={T.cutC - 0.22}>
        {(k) => (
          <>
            <div style={headline}>
              <span style={rise(k)}>কৃষির</span>
              <span style={{ ...rise(pop(t, T.backup - 0.04, fps)), color: P.vaultTeal }}>ব্যাকআপ</span>
            </div>
            <Bar k={pop(t, T.backup, fps)} />
          </>
        )}
      </Block>
      {/* C: chip + count */}
      <Block t={t} inAt={T.gobeshona - 0.1} outAt={T.cutD - 0.22}>
        {(k) => (
          <>
            <Chip text="বিশ্বে প্রায়" k={k} />
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 14, ...rise(k) }}>
              <span style={{ ...amberNum, fontSize: 150 }}>{bn(count.toLocaleString("en-US"))}টি</span>
            </div>
            <div style={{ ...headline, fontSize: 84, ...rise(pop(t, T.jinbank - 0.05, fps)) }}>জিন-ব্যাংক</div>
          </>
        )}
      </Block>
      {/* D: pinned grain labels (one at a time) */}
      {pins.map((p, i) => (
        <PinLabel key={i} x={p.x} y={p.y} t={t} inAt={pinIn[i]} outAt={pinOut[i]} text={names[i]} side={i === 2 ? "left" : "right"} rise={260} reach={90} />
      ))}
      {/* D: headline */}
      <Block t={t} inAt={T.hajaro - 0.04} outAt={T.end - 0.2}>
        {(k) => (
          <>
            <div style={headline}>
              <span style={rise(k)}>হাজারো</span>
              <span style={{ ...rise(pop(t, T.hajaro + 0.35, fps)), color: P.vaultTeal }}>জাত</span>
            </div>
            <Bar k={pop(t, T.hajaro + 0.4, fps)} />
          </>
        )}
      </Block>
    </AbsoluteFill>
  );
};

export const S2A: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const T = times(a);
  const shot = t < T.cutB ? 0 : t < T.cutC ? 1 : t < T.cutD ? 2 : 3;
  const cam = [camA, camB, camC, camD][shot](t, T);
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <Stage background={P.night}>
        {shot === 0 ? <SceneA key="a" t={t} T={T} cam={cam} /> : null}
        {shot === 1 ? <SceneB key="b" t={t} T={T} cam={cam} /> : null}
        {shot === 2 ? <SceneC key="c" t={t} T={T} cam={cam} /> : null}
        {shot === 3 ? <SceneD key="d" t={t} T={T} cam={cam} /> : null}
      </Stage>
      <Overlays t={t} T={T} cam={cam} />
    </AbsoluteFill>
  );
};

/** SFX for 2A–2D (4, bible §5), part seconds: frost crackle on the wipe, drawer latch, whoosh on the fast track, shimmer on the reveal */
export const s2aCues = (a: number) => {
  const T = times(a);
  return [
    { t: a + T.hajar - 0.05, src: SV("frost"), vol: 0.4 },
    { t: a + T.backup + 0.22, src: NV("ui_click"), vol: 0.45 },
    { t: a + T.cutC - 0.1, src: NV("whoosh"), vol: 0.35 },
    { t: a + T.hajaro - 0.1, src: NV("shimmer"), vol: 0.3 },
  ];
};
