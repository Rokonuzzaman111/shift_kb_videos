/**
 * Part 2 · Section 2E–2I ("কোনো" → end).
 * E "কোনো জাত খরা সহ্য করে" — cracked mud field at harsh noon, heat haze; dead brown plants around ONE thriving green
 *   plant. Low push-in. Chip "খরা-সহিষ্ণু".
 * F "কোনোটা নির্দিষ্ট রোগ ঠেকায়" — macro leaf blades: orange rust spreads over the neighbours, the hero leaf stays clean.
 *   Macro slide + rack focus (rusty leaves → hero). Chip "রোগ-প্রতিরোধী".
 * G "আবার কোনোটা কঠিন পরিবেশেও ভালো ফলন দেয়" — flooded rice paddy in rain, heavy golden panicles, ripples. Slow crane.
 *   Chip "বেশি ফলন".
 * H "কিন্তু যুদ্ধ, বন্যা, আগুন, বা যান্ত্রিক সমস্যায়, এই সংগ্রহ ধ্বংস হয়ে যেতে পারে" — genebank building at dusk; a fast
 *   cut / punch-in per word: blast + debris + smoke, flood rises, flames + embers, lights die → red alarm; wide on
 *   "সংগ্রহ". Alert chips যুদ্ধ / বন্যা / আগুন / যান্ত্রিক ত্রুটি, then headline "সংগ্রহ ধ্বংস".
 * I "আর একটা জাত হারালে … চিরতরে হারিয়ে যায়" — macro: the last seed on dark stone cracks, crumbles to dust that blows
 *   away; light fades to black. Long slow push. Headline "চিরতরে হারিয়ে যায়".
 */
import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { HDRI, Lighting } from "../../../kit/assets";
import { PostFX } from "../../../kit/PostFX";
import { Lens, Stage } from "../../../kit/Stage";
import { ease, handheld, mix, mix3, prog } from "../../../kit/time";
import { NV, partDuration } from "../../PartPlayer";
import { headFont } from "../../theme";
import { canvasTex, type V3 } from "../../three/util";
import { VO, atAfter } from "../../vo";
import { DryField, HERO_LEAF_MID, RUST_MID, RicePaddy, RustLeaves, SkyDome } from "../models/Crops";
import { BEACON, BLAST, FIRE_C, GenebankExterior } from "../models/GenebankExterior";
import { LastSeed, SEED_DIM } from "../models/LastSeed";
import { KeyLight, Slate } from "../models/SeedMacro";
import { P, pa } from "../palette";
import { Block, headline, pop, rise } from "./S2A";

const PART_END = partDuration(VO.p2);

const times = (a: number) => {
  const w = (word: string, from = 0) => atAfter("p2", word, a + from) - a;
  const khora = w("খরা");
  const konota = w("কোনোটা");
  const rog = w("রোগ");
  const abar = w("আবার");
  const bhalo = w("ভালো", abar);
  const fol = w("ফলন", abar);
  const kintu = w("কিন্তু");
  const jud = w("যুদ্ধ");
  const bonna = w("বন্যা");
  const agun = w("আগুন");
  const jantrik = w("যান্ত্রিক");
  const shongroho = w("সংগ্রহ");
  const dhongsho = w("ধ্বংস");
  const aar = w("আর", shongroho);
  const harale = w("হারালে", aar);
  const tar = w("তার", aar);
  const bishesh = w("বিশেষ", aar);
  const chirotore = w("চিরতরে", aar);
  const harie = w("হারিয়ে", aar);
  const yay = w("যায়", harie);
  return {
    khora,
    konota,
    rog,
    abar,
    bhalo,
    fol,
    kintu,
    jud,
    bonna,
    agun,
    jantrik,
    shongroho,
    dhongsho,
    aar,
    harale,
    tar,
    bishesh,
    chirotore,
    harie,
    yay,
    cutF: konota - 0.1,
    cutG: abar - 0.1,
    cutH: kintu - 0.15,
    cutWar: jud - 0.06,
    cutFlood: bonna - 0.06,
    cutFire: agun - 0.06,
    cutMach: jantrik - 0.06,
    cutWide: shongroho - 0.12,
    cutI: aar - 0.15,
    end: PART_END - a,
  };
};
type T = ReturnType<typeof times>;

/** internal shot cuts (part seconds) for the beat layer */
export const s2bCuts = (a: number) => {
  const T = times(a);
  return [T.cutF, T.cutG, T.cutH, T.cutWar, T.cutFlood, T.cutFire, T.cutMach, T.cutWide, T.cutI].map((x) => a + x);
};

type Cam = { position: V3; target: V3; mm: number };
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
/** decaying camera shake after `at` (world units) */
const shake = (t: number, at: number, amp: number): [number, number, number] => {
  const d = t - at;
  if (d < 0) return [0, 0, 0];
  const k = amp * Math.exp(-d * 7);
  return [Math.sin(d * 57) * k, Math.sin(d * 43 + 1) * k, Math.sin(d * 31 + 2) * k * 0.5];
};
const add = (a: V3, b: V3): [number, number, number] => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/* ───────────── cameras ───────────── */
const camE = (t: number, T: T): Cam => {
  const k = prog(t, -0.1, T.cutF + 0.1, (x) => 0.25 * x + 0.75 * ease.out(x));
  return { position: mix3([0.28, 0.27, 3.1], [0.07, 0.31, 1.4], k), target: mix3([0, 0.43, 0], [0, 0.42, 0], k), mm: 32 };
};
const camF = (t: number, T: T): Cam => {
  const k = ease.inOut(prog(t, T.cutF, T.cutG));
  const hh = handheld(t, 0.0012, 4);
  return { position: add(mix3([-0.07, -0.01, 0.44], [0.05, -0.02, 0.42], k), hh), target: mix3([-0.02, -0.08, -0.06], [0.02, -0.09, -0.02], k), mm: 50 };
};
const camG = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, T.cutG - 0.1, T.cutH + 0.2));
  return { position: mix3([0.3, 0.34, 1.6], [0.05, 1.95, 2.5], k), target: mix3([0, 0.72, -0.6], [0, 0.35, -3.2], k), mm: mix(30, 26, k) };
};
const camH = (t: number, T: T): Cam => {
  if (t < T.cutWar) {
    const k = prog(t, T.cutH, T.cutWar + 0.3);
    return { position: mix3([16, 1.7, 24], [14.6, 1.7, 21.8], k), target: [0, 4.5, -3], mm: 28 };
  }
  if (t < T.cutFlood) {
    const k = ease.out(prog(t, T.jud, T.jud + 0.3));
    return { position: add(mix3([-1, 2.0, 15], [-2, 2.2, 13.2], prog(t, T.cutWar, T.cutFlood)), shake(t, T.jud, 0.25)), target: BLAST, mm: mix(32, 37, k) };
  }
  if (t < T.cutFire) {
    const k = prog(t, T.cutFlood, T.cutFire);
    return { position: add(mix3([4.2, 1.9, 9.2], [3.6, 2.0, 8.3], k), shake(t, T.bonna, 0.05)), target: [0, 1.1, 0], mm: mix(24, 26, k) };
  }
  if (t < T.cutMach) {
    const k = ease.out(prog(t, T.agun, T.agun + 0.35));
    return { position: add(mix3([13, 3.2, 11], [12.3, 3.4, 9.8], prog(t, T.cutFire, T.cutMach)), shake(t, T.agun, 0.1)), target: FIRE_C, mm: mix(29, 33, k) };
  }
  if (t < T.cutWide) {
    const k = prog(t, T.cutMach, T.cutWide);
    return { position: mix3([-2.4, 2.0, 9.8], [-1.7, 2.15, 8.4], ease.out(k)), target: [BEACON[0], BEACON[1] - 0.3, 0.5], mm: 28 };
  }
  const k = ease.inOut(prog(t, T.cutWide, T.cutI));
  return { position: mix3([-17, 6.5, 29], [-21, 8, 34], k), target: [0, 3.4, -3], mm: 26 };
};
const camI = (t: number, T: T): Cam => {
  const k = prog(t, T.cutI, T.end, (x) => 0.35 * x + 0.65 * ease.inOut(x));
  return { position: mix3([0.017, 0.017, 0.078], [0.004, 0.0085, 0.031], k), target: mix3([0, 0.0032, 0], [0.0015, 0.003, 0], k), mm: mix(55, 66, k) };
};

/* ───────────── scenes ───────────── */
const SceneE: React.FC<{ readonly t: number; readonly cam: Cam }> = ({ t, cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.02} far={600} />
    <SkyDome top="#6d8aa6" horizon="#d4d9db" />
    <fogExp2 attach="fog" args={["#d2d6d7", 0.05]} />
    <Lighting hdri={HDRI.dusk} intensity={0.5} />
    <hemisphereLight args={["#cfd9e2", "#8a7458", 0.55]} />
    <KeyLight position={[1.4, 7, 2.2]} intensity={3.4} half={4} color="#f7f5ef" far={20} />
    <DryField t={t} />
    <PostFX focus={dist(cam.position, [0, 0.4, 0])} focusRange={1.4} bokeh={2} bloom={0.35} bloomThreshold={0.9} vignette={0.45} aberration={0.0008} />
  </>
);

const SceneF: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const spread = prog(t, T.cutF - 0.1, T.cutG - 0.1, ease.outCubic) * 0.85;
  const rack = ease.inOut(prog(t, T.rog - 0.15, T.rog + 0.35));
  const focus = mix(dist(cam.position, RUST_MID), dist(cam.position, HERO_LEAF_MID), rack);
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.01} far={20} />
      <color attach="background" args={["#1d2619"]} />
      <Lighting hdri={HDRI.studio} intensity={0.45} rotation={0.8} />
      <KeyLight position={[0.6, 1.4, -0.8]} intensity={2.6} half={0.6} color="#f4f1e8" far={4} />
      <directionalLight position={[-0.5, 0.4, 1]} intensity={0.6} color="#dfe8f2" />
      <RustLeaves spread={spread} t={t} />
      <PostFX focus={focus} focusRange={0.05} bokeh={6} bloom={0.6} bloomThreshold={0.85} vignette={0.55} />
    </>
  );
};

const SceneG: React.FC<{ readonly t: number; readonly cam: Cam }> = ({ t, cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.02} far={600} />
    <SkyDome top="#5d6f80" horizon="#8f9ca6" />
    <fogExp2 attach="fog" args={["#8f9ca6", 0.075]} />
    <Lighting hdri={HDRI.dusk} intensity={0.45} rotation={2} />
    <hemisphereLight args={["#a9b8c5", "#3c4232", 0.7]} />
    <directionalLight position={[-3, 6, 2]} intensity={1.0} color="#e8eef3" />
    <RicePaddy t={t} />
    <PostFX focus={dist(cam.position, cam.target)} focusRange={2.5} bokeh={2} bloom={0.4} bloomThreshold={0.9} vignette={0.5} aberration={0.001} />
  </>
);

const SceneH: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const s = { war: t - T.jud, flood: t - T.bonna, fire: t - T.agun, mach: t - T.jantrik, t };
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.05} far={900} />
      <Lighting hdri={HDRI.dusk} intensity={0.32} background rotation={2.6} />
      <fogExp2 attach="fog" args={["#3c4656", 0.011]} />
      <KeyLight position={[-20, 24, 16]} intensity={0.55} half={22} color="#c9d6e4" far={80} />
      <GenebankExterior s={s} />
      <PostFX bloom={0.8} bloomThreshold={0.8} vignette={0.55} aberration={0.0014} />
    </>
  );
};

const SceneI: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const crack = prog(t, T.harale - 0.05, T.tar + 0.15, ease.out);
  const crumble = prog(t, T.bishesh - 0.1, T.yay) * 1.35;
  const fade = 1 - prog(t, T.yay - 0.1, T.end - 0.2, ease.inOut);
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.002} far={5} />
      <color attach="background" args={[P.night]} />
      <Lighting hdri={HDRI.studio} intensity={0.22 * fade} rotation={1.6} />
      <KeyLight position={[-0.16, 0.24, 0.18]} intensity={2.4 * fade} half={0.06} color="#e3ebf3" far={1} />
      <pointLight position={[0.05, 0.022, -0.05]} intensity={0.08 * fade} color={P.amber} distance={0.4} decay={2} />
      <Slate size={[0.5, 0.04, 0.4]} position={[0, -0.02, 0]} repeat={12} />
      <LastSeed crack={crack} crumble={crumble} t={t} />
      <PostFX focus={dist(cam.position, [0, SEED_DIM[1], 0])} focusRange={0.007} bokeh={5} bloom={0.4} bloomThreshold={0.9} vignette={0.62} />
    </>
  );
};

/* ───────────── text ───────────── */
const BigChip: React.FC<{ readonly text: string; readonly k: number; readonly tone?: "teal" | "alert" }> = ({ text, k, tone = "teal" }) => (
  <div
    style={{
      display: "inline-block",
      padding: "12px 30px 16px",
      borderRadius: 999,
      background: tone === "teal" ? P.vaultTeal : P.alert,
      color: tone === "teal" ? P.night : P.snow,
      fontFamily: headFont,
      fontWeight: 800,
      fontSize: 56,
      lineHeight: 1,
      transform: `scale(${0.4 + 0.6 * k})`,
      transformOrigin: "left center",
      opacity: Math.min(1, k * 1.6),
      boxShadow: `0 12px 34px ${pa(P.night, 0.5)}`,
    }}
  >
    {text}
  </div>
);
const Bar: React.FC<{ readonly k: number; readonly color: string }> = ({ k, color }) => (
  <div style={{ marginTop: 18, height: 6, width: 240 * Math.min(1, k), borderRadius: 3, background: color, boxShadow: `0 0 18px ${pa(color, 0.6)}` }} />
);

const Overlays: React.FC<{ readonly t: number; readonly T: T }> = ({ t, T }) => {
  const { fps } = useVideoConfig();
  const threats: [string, number][] = [
    ["যুদ্ধ", T.jud],
    ["বন্যা", T.bonna],
    ["আগুন", T.agun],
    ["যান্ত্রিক ত্রুটি", T.jantrik],
  ];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Block t={t} inAt={T.khora - 0.05} outAt={T.cutF - 0.22}>
        {(k) => <BigChip text="খরা-সহিষ্ণু" k={k} />}
      </Block>
      <Block t={t} inAt={T.rog - 0.05} outAt={T.cutG - 0.22}>
        {(k) => <BigChip text="রোগ-প্রতিরোধী" k={k} />}
      </Block>
      <Block t={t} inAt={T.bhalo - 0.05} outAt={T.cutH - 0.22}>
        {(k) => <BigChip text="বেশি ফলন" k={k} />}
      </Block>
      <Block t={t} inAt={T.jud - 0.04} outAt={T.cutWide - 0.22}>
        {() => (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {threats.map(([txt, at]) => (t >= at - 0.04 ? <BigChip key={txt} text={txt} tone="alert" k={pop(t, at - 0.04, fps)} /> : null))}
          </div>
        )}
      </Block>
      <Block t={t} inAt={T.shongroho - 0.04} outAt={T.cutI - 0.22}>
        {(k) => (
          <>
            <div style={headline}>
              <span style={rise(k)}>সংগ্রহ</span>
              <span style={{ ...rise(pop(t, T.dhongsho - 0.04, fps)), color: P.alert }}>ধ্বংস</span>
            </div>
            <Bar k={pop(t, T.dhongsho, fps)} color={P.alert} />
          </>
        )}
      </Block>
      <Block t={t} inAt={T.chirotore - 0.04} outAt={T.end - 0.35}>
        {(k) => (
          <div style={headline}>
            <span style={rise(k)}>চিরতরে</span>
            <span style={rise(pop(t, T.harie - 0.04, fps))}>হারিয়ে যায়</span>
          </div>
        )}
      </Block>
    </AbsoluteFill>
  );
};

/* ───────────── heat haze (SVG displacement over shot E) ───────────── */
const useHazeMap = () =>
  useMemo(() => {
    const W = 540;
    const H = 960;
    const tex = canvasTex(W * 2, H, (g) => {
      const img = g.createImageData(W, H);
      for (let y = 0; y < H; y++) {
        const yn = y / H;
        const band = Math.max(0, 1 - Math.abs(yn - 0.47) / 0.17);
        const m = 0.25 + 0.75 * band * band;
        for (let x = 0; x < W; x++) {
          const u = (x / W) * Math.PI * 2;
          const nx = Math.sin(u * 7 + y * 0.21) * 0.6 + Math.sin(u * 19 - y * 0.47) * 0.4;
          const ny = Math.sin(u * 5 + y * 0.33 + 1.3) * 0.5 + Math.sin(u * 13 + y * 0.6) * 0.5;
          const i = (y * W + x) * 4;
          img.data[i] = 128 + 110 * m * nx;
          img.data[i + 1] = 128 + 110 * m * ny;
          img.data[i + 2] = 128;
          img.data[i + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
      g.putImageData(img, W, 0);
    });
    const url = (tex.image as HTMLCanvasElement).toDataURL("image/png");
    tex.dispose();
    return url;
  }, []);

const HazeFilter: React.FC<{ readonly t: number }> = ({ t }) => {
  const url = useHazeMap();
  const off = (t * 260) % 1080;
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <filter id="s2b-haze" x="0" y="0" width="1" height="1" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feImage href={url} x={-off} y={0} width={2160} height={1920} preserveAspectRatio="none" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={9} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
};

export const S2B: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const T = times(a);
  const shot = t < T.cutF ? 0 : t < T.cutG ? 1 : t < T.cutH ? 2 : t < T.cutI ? 3 : 4;
  const cam = [camE, camF, camG, camH, camI][shot](t, T);
  const black = prog(t, T.yay, T.end - 0.1, ease.inOut);
  return (
    <AbsoluteFill style={{ background: P.night }}>
      {shot === 0 ? <HazeFilter t={t} /> : null}
      <AbsoluteFill style={{ filter: shot === 0 ? "url(#s2b-haze)" : undefined, transform: shot === 0 ? "scale(1.012)" : undefined }}>
        <Stage background={P.night}>
          {shot === 0 ? <SceneE key="e" t={t} cam={cam} /> : null}
          {shot === 1 ? <SceneF key="f" t={t} T={T} cam={cam} /> : null}
          {shot === 2 ? <SceneG key="g" t={t} cam={cam} /> : null}
          {shot === 3 ? <SceneH key="h" t={t} T={T} cam={cam} /> : null}
          {shot === 4 ? <SceneI key="i" t={t} T={T} cam={cam} /> : null}
        </Stage>
      </AbsoluteFill>
      {black > 0 ? <AbsoluteFill style={{ background: P.night, opacity: black }} /> : null}
      <Overlays t={t} T={T} />
    </AbsoluteFill>
  );
};

/** SFX for 2E–2I (5): impact on war, water drop on flood, hit on fire, power-down on machine failure, soft low ending */
export const s2bCues = (a: number) => {
  const T = times(a);
  return [
    { t: a + T.jud - 0.03, src: NV("impact_deep"), vol: 0.6 },
    { t: a + T.bonna - 0.04, src: NV("drop_down"), vol: 0.5 },
    { t: a + T.agun - 0.03, src: NV("impact"), vol: 0.45 },
    { t: a + T.jantrik - 0.02, src: NV("power_down"), vol: 0.55 },
    { t: a + T.chirotore - 0.1, src: NV("bass_drop"), vol: 0.28 },
  ];
};
