/**
 * Part 5 · Section 5E–5G (the "এই" of "এই অক্টোবরেও" → end of the video).
 * E "এই অক্টোবরেও বীজ জমা দিয়েছে একুশটা জিন-ব্যাংক, তার মধ্যে যুদ্ধ শুরুর পর প্রথমবার, ইউক্রেনও" — polar-night dock:
 *   crates ride a roller conveyor into a frosted, amber-lit door; 21 genebank tags pop in a grid; the Ukraine tag glows
 *   and slides forward. Amber "অক্টোবর ২০২৬" → "২১টি জিন-ব্যাংক", chip "ইউক্রেন".
 * F "ভবিষ্যতের খরা আর রোগের সাথে লড়তে, লাগবে আজকের এই বীজ" — flash: heat-cracked earth; flash: storm + lightning;
 *   then an open palm holding one seed in warm light (slow push). Headline "আজকের এই বীজ".
 * G "বাংলাদেশের ধানের জাতও কি এখানে রাখা উচিত? কমেন্টে জানান" — Bangladesh paddy at golden hour (palms, boat, haze),
 *   long crane up to the sky; question headline, then CTA card "কমেন্টে জানান" with an SVG comment icon.
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { HDRI, Lighting } from "../../../kit/assets";
import { PostFX } from "../../../kit/PostFX";
import { Lens, Stage } from "../../../kit/Stage";
import { ease, handheld, mix, mix3, prog } from "../../../kit/time";
import { NV } from "../../PartPlayer";
import type { V3 } from "../../three/util";
import { headFont } from "../../theme";
import { atAfter, atEnd } from "../../vo";
import { SkyDome } from "../models/Crops";
import { ArrivalDock, BanglaPaddy, CrackedEarth, OpenPalm, SEED_PT, StormSky, TagGrid } from "../models/Harvest";
import { Motes } from "../models/Rescue";
import { KeyLight } from "../models/SeedMacro";
import { P, bn, pa } from "../palette";
import { Block, headline, pop, rise } from "../p2/S2A";
import { Chip, amberNum } from "../p3/S3A";

const times = (a: number) => {
  const w = (word: string, from = 0) => atAfter("p5", word, a + from) - a;
  const okt = w("অক্টোবরেও");
  const ekush = w("একুশটা");
  const ukr = w("ইউক্রেনও");
  const bhobi = w("ভবিষ্যতের");
  const rog = w("রোগের");
  const laagbe = w("লাগবে");
  const aajker = w("আজকের");
  const bangla = w("বাংলাদেশের");
  const comment = w("কমেন্টে");
  const end = Math.ceil((atEnd("p5", "জানান") + 0.75) * 30) / 30 - a;
  return { okt, ekush, ukr, bhobi, rog, laagbe, aajker, bangla, comment, end, cutF: bhobi - 0.15, cutF2: rog - 0.08, cutF3: laagbe - 0.25, cutG: bangla - 0.15 };
};
type T = ReturnType<typeof times>;

export const s5bCuts = (a = 0) => {
  const T = times(a);
  return [T.cutF, T.cutF2, T.cutF3, T.cutG].map((c) => a + c);
};

type Cam = { position: V3; target: V3; mm: number };
const dist = (p: V3, q: V3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

/* ───────────── E · polar-night dock + tags ───────────── */
const HOLD: V3 = [1.25, 1.25, 1.9];
const HOLD_T: V3 = [0, 1.05, -4];
const GRID_POS: V3 = (() => {
  const d = [HOLD_T[0] - HOLD[0], HOLD_T[1] - HOLD[1], HOLD_T[2] - HOLD[2]];
  const n = Math.hypot(d[0], d[1], d[2]);
  return [HOLD[0] + (d[0] / n) * 2.75, HOLD[1] + (d[1] / n) * 2.75 - 0.05, HOLD[2] + (d[2] / n) * 2.75] as const;
})();
const camE = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, 0, T.ekush - 0.1));
  const push = ease.inOut(prog(t, T.ukr, T.cutF));
  const p = mix3([1.9, 0.95, 5.2], HOLD, k);
  return { position: mix3(p, mix3(HOLD, GRID_POS, 0.2), push), target: mix3([0, 0.9, -1.5], HOLD_T, k), mm: 32 };
};
const SceneE: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.03} far={300} />
    <SkyDome top="#03070d" horizon="#1d2c3d" r={200} />
    <fogExp2 attach="fog" args={["#142030", 0.07]} />
    <Lighting hdri={HDRI.dusk} intensity={0.12} rotation={3.0} />
    <KeyLight position={[-4, 6, 3]} intensity={0.5} half={6} color="#8fb0d0" far={20} />
    <ArrivalDock t={t} />
    <TagGrid position={GRID_POS} face={HOLD} t={t} inAt={T.ekush} ukrAt={T.ukr} />
    <Motes count={500} seed={23} box={[-4, 4, 0, 5, -6, 5]} t={t} fall={0.7} drift={0.25} size={0.025} opacity={0.85} />
    <PostFX bloom={0.8} bloomThreshold={0.8} vignette={0.55} />
  </>
);

/* ───────────── F · flashes + palm ───────────── */
const camF1 = (t: number, T: T): Cam => {
  const k = prog(t, T.cutF, T.cutF2);
  return { position: [0.12, mix(1.25, 0.85, k), mix(0.4, 0.3, k)], target: [0, 0, 0], mm: 32 };
};
const camF2 = (t: number, T: T): Cam => {
  const k = prog(t, T.cutF2, T.cutF3);
  const hh = handheld(t * 3, 0.02, 9);
  return { position: [hh[0], 1.6 + hh[1], mix(6, 5, k)], target: [0, 6, -20], mm: 22 };
};
const camF3 = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, T.cutF3, T.cutG + 0.3));
  return { position: mix3([0.2, 0.39, 0.42], [0.14, 0.27, 0.29], k), target: [SEED_PT[0], SEED_PT[1] - 0.004, SEED_PT[2] - 0.012], mm: 62 };
};
const SceneF1: React.FC<{ readonly cam: Cam }> = ({ cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.02} far={20} />
    <color attach="background" args={["#2a2018"]} />
    <Lighting hdri={HDRI.dusk} intensity={0.35} rotation={1.0} />
    <KeyLight position={[2.5, 1.1, 0.6]} intensity={4} half={1.6} color="#ffd9a8" far={8} />
    <CrackedEarth />
    <PostFX bloom={0.4} vignette={0.6} aberration={0.0015} />
  </>
);
const SceneF2: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const at = T.cutF2 + 0.12;
  const flash = t < at ? 0 : Math.exp(-(t - at) * 9) * (0.6 + 0.4 * Math.abs(Math.sin((t - at) * 60)));
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.1} far={400} />
      <color attach="background" args={[flash > 0.2 ? "#5a6878" : "#151c26"]} />
      <fogExp2 attach="fog" args={["#1c2430", 0.035]} />
      <hemisphereLight args={["#6a7c90", "#1a1f18", 0.6 + flash * 6]} />
      <StormSky t={t} flash={flash} />
      <PostFX bloom={1.0} bloomThreshold={0.8} vignette={0.6} />
    </>
  );
};
const SceneF3: React.FC<{ readonly t: number; readonly cam: Cam }> = ({ t, cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.005} far={10} />
    <color attach="background" args={[P.night]} />
    <Lighting hdri={HDRI.studio} intensity={0.25} rotation={2.4} />
    <spotLight position={[0.32, 0.45, 0.1]} angle={0.45} penumbra={0.9} intensity={1.6} decay={2} color="#ffc890" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0002} />
    <pointLight position={[-0.3, 0.25, 0.2]} intensity={0.12} distance={1.5} decay={2} color="#8fb0d0" />
    <OpenPalm />
    <Motes count={40} seed={61} box={[-0.6, 0.6, -0.2, 0.5, -1.2, -0.6]} t={t} fall={0.02} drift={0.03} size={0.05} color={P.amber} opacity={0.6} />
    <PostFX focus={dist(cam.position, SEED_PT)} focusRange={0.09} bokeh={3} bloom={0.4} vignette={0.6} />
  </>
);

/* ───────────── G · Bangladesh paddy ───────────── */
const camG = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, T.cutG, T.end));
  return { position: mix3([-0.5, 1.0, 5.5], [0.5, 17, 15], k), target: mix3([0.5, 1.3, -40], [1, 13, -60], k), mm: mix(30, 26, k) };
};
const SceneG: React.FC<{ readonly t: number; readonly cam: Cam }> = ({ t, cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.05} far={900} />
    <SkyDome top="#3d5a78" horizon="#f0c286" r={700} />
    <fogExp2 attach="fog" args={["#e0b98c", 0.008]} />
    <Lighting hdri={HDRI.dusk} intensity={0.5} rotation={1.6} />
    <directionalLight
      position={[-25, 7, -60]}
      intensity={2.8}
      color="#ffc27a"
      castShadow
      shadow-mapSize={[1024, 1024]}
      shadow-camera-left={-14}
      shadow-camera-right={14}
      shadow-camera-top={14}
      shadow-camera-bottom={-14}
      shadow-camera-far={150}
      shadow-bias={-0.0004}
    />
    <hemisphereLight args={["#9fb2c4", "#5a4a32", 0.45]} />
    <mesh position={[-110, 22, -520]}>
      <circleGeometry args={[14, 40]} />
      <meshBasicMaterial color={[3.2, 2.3, 1.2]} fog={false} />
    </mesh>
    <BanglaPaddy t={t} />
    <PostFX bloom={0.8} bloomThreshold={0.85} vignette={0.45} />
  </>
);

/* ───────────── text ───────────── */
const CommentIcon: React.FC<{ readonly size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64">
    <path d="M10 12h44a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H28l-12 10v-10h-6a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z" fill={P.vaultTeal} />
    <rect x="16" y="23" width="32" height="4.5" rx="2.2" fill={P.night} />
    <rect x="16" y="33" width="22" height="4.5" rx="2.2" fill={P.night} />
  </svg>
);

const Overlays: React.FC<{ readonly t: number; readonly T: T }> = ({ t, T }) => {
  const { fps } = useVideoConfig();
  const n = Math.round(interpolate(t, [T.ekush, T.ekush + 0.6], [0, 21], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.outCubic }));
  const cta = t >= T.comment - 0.05 ? pop(t, T.comment - 0.05, fps) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Block t={t} inAt={T.okt - 0.05} outAt={T.ekush - 0.22}>
        {(k) => <div style={{ ...amberNum, fontSize: 120, ...rise(k) }}>অক্টোবর {bn(2026)}</div>}
      </Block>
      <Block t={t} inAt={T.ekush - 0.05} outAt={T.ukr - 0.22}>
        {(k) => (
          <div style={{ ...rise(k) }}>
            <span style={{ ...amberNum, fontSize: 150 }}>{bn(n)}টি</span>
            <div style={{ ...headline, fontSize: 84 }}>জিন-ব্যাংক</div>
          </div>
        )}
      </Block>
      <Block t={t} inAt={T.ukr - 0.05} outAt={T.cutF - 0.22}>
        {(k) => (
          <div style={{ transform: "scale(1.7)", transformOrigin: "left top" }}>
            <Chip text="ইউক্রেন" k={k} />
          </div>
        )}
      </Block>
      <Block t={t} inAt={T.aajker - 0.05} outAt={T.cutG - 0.22}>
        {(k) => (
          <div style={{ ...headline, ...rise(k) }}>
            আজকের <span style={{ color: P.amber }}>এই বীজ</span>
          </div>
        )}
      </Block>
      <Block t={t} inAt={T.bangla - 0.05} outAt={T.comment - 0.3}>
        {(k) => (
          <div style={{ ...headline, fontSize: 86, ...rise(k) }}>
            বাংলাদেশের <span style={{ color: P.vaultTeal }}>ধানের জাতও</span> কি এখানে রাখা উচিত?
          </div>
        )}
      </Block>
      {cta > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 540,
            top: 720,
            transform: `translate(-50%, -50%) translateY(${(1 - cta) * 60}px) scale(${0.7 + 0.3 * cta})`,
            opacity: Math.min(1, cta * 1.5),
            display: "flex",
            alignItems: "center",
            gap: 30,
            padding: "34px 54px 38px 40px",
            borderRadius: 40,
            background: pa(P.night, 0.62),
            border: `3px solid ${pa(P.vaultTeal, 0.75)}`,
            boxShadow: `0 20px 60px ${pa(P.night, 0.5)}, 0 0 40px ${pa(P.vaultTeal, 0.25)}`,
            whiteSpace: "nowrap",
          }}
        >
          <CommentIcon size={104} />
          <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 92, color: P.snow, lineHeight: 1.05 }}>কমেন্টে জানান</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const S5B: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const T = times(a);
  const shot = t < T.cutF ? 0 : t < T.cutF2 ? 1 : t < T.cutF3 ? 2 : t < T.cutG ? 3 : 4;
  const cam = [camE, camF1, camF2, camF3, camG][shot](t, T);
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <Stage background={P.night}>
        {shot === 0 ? <SceneE key="e" t={t} T={T} cam={cam} /> : null}
        {shot === 1 ? <SceneF1 key="f1" cam={cam} /> : null}
        {shot === 2 ? <SceneF2 key="f2" t={t} T={T} cam={cam} /> : null}
        {shot === 3 ? <SceneF3 key="f3" t={t} cam={cam} /> : null}
        {shot === 4 ? <SceneG key="g" t={t} cam={cam} /> : null}
      </Stage>
      <Overlays t={t} T={T} />
    </AbsoluteFill>
  );
};

/** SFX (3): shimmer as the Ukraine tag glows, thunder hit on the storm flash, pop on the CTA */
export const s5bCues = (a: number) => {
  const T = times(a);
  return [
    { t: a + T.ukr, src: NV("shimmer"), vol: 0.35 },
    { t: a + T.cutF2 + 0.1, src: NV("impact"), vol: 0.45 },
    { t: a + T.comment - 0.05, src: NV("ui_pop"), vol: 0.5 },
  ];
};
