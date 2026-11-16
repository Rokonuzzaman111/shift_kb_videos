/**
 * PART 2 shots — "why it exists" (0–26 s). Text grammar for every shot: top Headline/kicker (springs in on its word),
 * 3D hero in the middle, captions at the bottom. Camera always moves; cuts every 1.6–5 s.
 *   A Clock     "দুই হাজার আট সালে চালু হওয়া এই ভল্ট"          split-flap 2026 → 2008, dolly in
 *   B Backup    "আসলে পৃথিবীর কৃষির একটা ব্যাকআপ"              farm diorama scanned → holo copy flies into a safe
 *   C Map       "বিভিন্ন দেশের গবেষণা প্রতিষ্ঠান আর জিন-ব্যাংকে" genebank pillars rise across a tilted world map
 *   D Jars      "ধান, গম, ভুট্টাসহ হাজারো জাতের বীজ রাখা হয়"    camera slides along a shelf of seed jars
 *   E Drought   "কোনো জাত খরা সহ্য করে"                         sprout stays green on cracked soil, hot sun
 *   F Disease   "কোনোটা নির্দিষ্ট রোগ ঠেকায়"                     pathogens swarm, shield repels
 *   G Yield     "আবার কোনোটা কঠিন পরিবেশেও ভালো ফলন দেয়"       rice plant in a storm, heavy grain heads
 *   H Disaster  "কিন্তু যুদ্ধ, বন্যা, আগুন, বা যান্ত্রিক সমস্যায়…" genebank diorama hit by each threat in turn
 *   I DNA       "আর একটা জাত হারালে … চিরতরে হারিয়ে যায়"       helix breaks apart and fades
 */
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { PostFX } from "../../kit/PostFX";
import { Lens, Stage } from "../../kit/Stage";
import { handheld, mix, mix3 } from "../../kit/time";
import { S, clamp, ease } from "../theme";
import { FarmTile, FlatMap, FlipClock, Genebank, Helix, JAR_POS, JarShelf, Pathogens, Pedestal, RicePlant, Safe, Shield, Sprout, mapXY } from "../three/P2Props";
import { SkyDome, Snow, Stars } from "../three/Sky";
import { project, type V3 } from "../three/util";
import { atAfter } from "../vo";
import { ChipRow, Flash, Headline, PinLabel, Tag } from "../ui/Hud";

export type ShotProps = { readonly a: number };

const useShot = (a: number) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = f / fps;
  const L = (w: string, n = 0) => atAfter("p2", w, a, n) - a;
  return { t, L, width, height };
};
const p = (t: number, x0: number, x1: number, e: (x: number) => number = ease.inOut) => interpolate(t, [x0, x1], [0, 1], { ...clamp, easing: e });

/** quick camera "punch" zoom on a beat: returns extra mm */
const punch = (t: number, at: number, amt = 6) => amt * Math.exp(-Math.max(0, t - at) * 6) * (t >= at ? 1 : 0);

/* ------------------------------------------------------------------ A — split-flap 2008 */
export const P2A: React.FC<ShotProps> = ({ a }) => {
  const { t, L } = useShot(a);
  const run = p(t, 0.05, L("সালে") + 0.2, ease.out);
  const k = p(t, 0, 2.4, ease.out);
  const hh = handheld(t, 0.01, 3);
  return (
    <AbsoluteFill>
      <Stage background="#07090c">
        <Lens position={[mix(-1.8, -0.6, k) + hh[0], mix(0.9, 0.3, k) + hh[1], mix(8.5, 6.4, k)]} target={[0, 0, 0]} mm={mix(40, 46, k) + punch(t, L("সালে"), 4)} />
        <SkyDome top="#020305" mid="#0e141b" bottom="#050608" r={80} />
        <spotLight position={[-3, 5, 6]} angle={0.5} penumbra={0.8} intensity={90} color="#fff1dc" castShadow />
        <directionalLight position={[5, 1, -3]} intensity={2} color="#7fd6ff" />
        <ambientLight intensity={0.15} />
        <group position={[0, 0, 0]}>
          <FlipClock from={2026} to={2008} p={run} />
        </group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#0d0f12" roughness={0.3} metalness={0.4} />
        </mesh>
        <PostFX focus={7} focusRange={2.5} bokeh={4} bloom={0.6} bloomThreshold={0.85} vignette={0.7} />
      </Stage>
      <Headline at={L("চালু") - 0.05} kicker="চালু হয়" text="২৬ ফেব্রুয়ারি, ২০০৮" color={S.gold} top={300} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ B — farm diorama backed up into a safe */
export const P2B: React.FC<ShotProps> = ({ a }) => {
  const { t, L } = useShot(a);
  const scan = p(t, 0.1, L("কৃষির") + 0.1, ease.inOut);
  const lift = p(t, L("কৃষির"), L("ব্যাকআপ") + 0.25, ease.inOut);
  const safeOpen = p(t, L("একটা") - 0.3, L("একটা"), ease.out) * (1 - p(t, L("ব্যাকআপ") + 0.25, L("ব্যাকআপ") + 0.5));
  const glow = p(t, L("ব্যাকআপ") + 0.2, L("ব্যাকআপ") + 0.5);
  const k = p(t, 0, 2.2, ease.out);
  const ghostPos = mix3([0, 0, 0], [7.5, 4.2, -1], lift);
  const ghostS = mix(1, 0.22, lift);
  return (
    <AbsoluteFill>
      <Stage background="#0b1622">
        <Lens position={[mix(-9, -6, k), mix(9, 7.5, k), mix(13, 12, k)]} target={[mix(1.5, 3.5, k), 1.4, 0]} mm={30 + punch(t, L("ব্যাকআপ") + 0.3, 3)} />
        <SkyDome top="#07111d" mid="#123049" bottom="#0a1520" r={120} />
        <hemisphereLight args={["#bfe3ff", "#2a1d12", 0.7]} />
        <directionalLight position={[-6, 12, 8]} intensity={2.6} color="#fff0d8" castShadow shadow-mapSize={[1024, 1024]} />
        <FarmTile scan={scan < 1 ? scan : -1} />
        <group position={ghostPos} scale={ghostS} visible={lift > 0 && lift < 1}>
          <FarmTile ghost />
        </group>
        <group position={[7.5, 4.2, -1]} rotation={[0, -0.6, 0]}>
          <Safe glow={glow} open={safeOpen} />
        </group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[80, 80]} />
          <meshStandardMaterial color="#0f1d2a" roughness={0.9} />
        </mesh>
        <PostFX bloom={0.9} bloomThreshold={0.7} vignette={0.55} />
      </Stage>
      <Headline at={L("ব্যাকআপ") - 0.05} kicker="আসলে এটা" text="কৃষির ব্যাকআপ" color={S.aurora} top={250} />
      <Flash at={0} dur={0.16} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ C — genebanks across the world */
const BD: [number, number] = [90.4, 23.8];
export const P2C: React.FC<ShotProps> = ({ a }) => {
  const { t, L, width, height } = useShot(a);
  const grow = p(t, 0.1, L("জিন-ব্যাংকে") + 0.3, (x) => x);
  const k = p(t, 0, 2.8, ease.inOut);
  const [bx, bz] = mapXY(...BD);
  const cam = { position: mix3([-2, 9.5, 9], [bx + 1.2, 4.2, bz + 5.6], k) as V3, target: mix3([0, 0, 0], [bx, 0, bz], k) as V3, mm: 30 };
  const bd = project(cam, [bx, 0.05, bz], width, height);
  return (
    <AbsoluteFill>
      <Stage background="#030a12">
        <Lens position={cam.position} target={cam.target} mm={cam.mm} />
        <Stars count={900} r={300} opacity={0.6} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 8, 5]} intensity={1.2} />
        <FlatMap grow={grow} highlight={BD} />
        <PostFX bloom={1.2} bloomThreshold={0.55} vignette={0.55} />
      </Stage>
      <Headline at={L("গবেষণা") - 0.1} kicker="সারা বিশ্বে" text="প্রায় ১,৭৫০টি জিন-ব্যাংক" color={S.aurora} top={230} />
      <PinLabel x={bd.x} y={bd.y} at={L("জিন-ব্যাংকে") + 0.1} text="বাংলাদেশ" sub="BRRI জিন-ব্যাংক" dx={-110} dy={150} color={S.gold} />
      <Flash at={0} dur={0.16} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ D — seed jar shelf */
export const P2D: React.FC<ShotProps> = ({ a }) => {
  const { t, L, width, height } = useShot(a);
  const k = p(t, 0, 3.4, ease.inOut);
  const hh = handheld(t, 0.008, 5);
  const cam = { position: [mix(-4.4, 1.6, k) + hh[0], mix(1.7, 2.2, k) + hh[1], mix(3.0, 5.4, k)] as V3, target: [mix(-3.2, 0.2, k), mix(1.6, 1.9, k), 0] as V3, mm: mix(38, 30, k) };
  const names = ["ধান", "গম", "ভুট্টা"];
  const words = ["ধান", "গম", "ভুট্টাসহ"];
  return (
    <AbsoluteFill>
      <Stage background="#e6ecef">
        <Lens position={cam.position} target={cam.target} mm={cam.mm} />
        <fog attach="fog" args={["#dfe6ea", 9, 22]} />
        <hemisphereLight args={["#ffffff", "#b8a98f", 0.9]} />
        <directionalLight position={[-4, 6, 6]} intensity={2.2} color="#fff4e4" castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[2, 4, 3]} intensity={10} color="#dff1ff" />
        <JarShelf />
        <PostFX focus={Math.hypot(cam.position[0] - cam.target[0], cam.position[2]) } focusRange={1.4} bokeh={4} bloom={0.4} bloomThreshold={0.92} vignette={0.45} />
      </Stage>
      {names.map((n, i) => {
        const pt = project(cam, [JAR_POS(1, i)[0], JAR_POS(1, i)[1] + 1.1, 0.2], width, height);
        return <PinLabel key={n} x={pt.x} y={pt.y} at={L(words[i])} text={n} dx={i === 1 ? 0.001 : i === 0 ? -60 : 60} dy={-150 - i * 40} color={S.gold} />;
      })}
      <Headline at={L("হাজারো") - 0.05} text="হাজারো জাতের বীজ" color={S.gold} top={250} />
      <Flash at={0} dur={0.16} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ E/F/G — trait specimens on a pedestal */
const Specimen: React.FC<{ readonly a: number; readonly kind: "drought" | "disease" | "yield" }> = ({ a, kind }) => {
  const { t, L } = useShot(a);
  const ang = mix(kind === "disease" ? 0.8 : -0.7, kind === "disease" ? 0.2 : -0.1, p(t, 0, 2.6, ease.out));
  const r = mix(6.8, 5.4, p(t, 0, 2.6, ease.out));
  const cam = { position: [Math.sin(ang) * r, 2.2, Math.cos(ang) * r] as V3, target: [0, 1.0, 0] as V3, mm: 40 };
  const env = {
    drought: { bg: "#3b1d0c", top: "#5a2a10", mid: "#d9772c", bot: "#2a1408", rim: S.gold, soil: "dry" as const, head: "খরা সহ্য করে", word: "খরা" },
    disease: { bg: "#120a14", top: "#0c0710", mid: "#3a1830", bot: "#09060a", rim: S.cyan, soil: "rich" as const, head: "রোগ ঠেকায়", word: "রোগ" },
    yield: { bg: "#0b1622", top: "#060d16", mid: "#24425c", bot: "#08111a", rim: S.aurora, soil: "wet" as const, head: "কঠিন পরিবেশেও বেশি ফলন", word: "কঠিন" },
  }[kind];
  const shieldK = kind === "disease" ? p(t, L("ঠেকায়") - 0.2, L("ঠেকায়") + 0.2, ease.out) : 0;
  const swarm = kind === "disease" ? p(t, 0, L("ঠেকায়"), (x) => x) : 0;
  const heads = kind === "yield" ? p(t, L("ভালো") - 0.2, L("দেয়") + 0.2, ease.out) : 0;
  return (
    <AbsoluteFill>
      <Stage background={env.bg}>
        <Lens position={cam.position} target={cam.target} mm={cam.mm + punch(t, L(env.word), 4)} />
        <SkyDome top={env.top} mid={env.mid} bottom={env.bot} r={80} />
        <hemisphereLight args={[kind === "drought" ? "#ffd29a" : "#bcd6ff", "#1a1410", 0.6]} />
        <directionalLight position={kind === "drought" ? [-6, 8, -4] : [4, 9, 5]} intensity={kind === "drought" ? 4 : 2.2} color={kind === "drought" ? "#ffcf8a" : "#e8f2ff"} castShadow shadow-mapSize={[1024, 1024]} />
        <spotLight position={[3, 6, 5]} angle={0.5} penumbra={0.8} intensity={40} color="#ffffff" />
        {kind === "drought" ? (
          <mesh position={[-14, 9, -30]}>
            <sphereGeometry args={[3, 24, 16]} />
            <meshBasicMaterial color="#fff2c8" toneMapped={false} />
          </mesh>
        ) : null}
        <Pedestal rim={env.rim} soil={env.soil} />
        {kind === "yield" ? <RicePlant grow={p(t, 0, 0.6, ease.out)} heads={heads} /> : <Sprout grow={p(t, 0, 0.5, ease.out)} sway={kind === "drought" ? 0.5 : 1} />}
        {kind === "disease" ? (
          <>
            <Pathogens k={swarm} shield={shieldK} />
            <Shield k={shieldK} />
          </>
        ) : null}
        {kind === "yield" ? <Snow count={1400} size={[14, 10, 14]} center={[0, 3, 0]} wind={[3, -16, 1]} px={2.4} opacity={0.55} /> : null}
        {kind === "drought" ? <Snow count={500} size={[10, 5, 10]} center={[0, 1.5, 0]} wind={[1.5, 0.6, 0.3]} px={1.6} opacity={0.35} /> : null}
        <PostFX focus={r} focusRange={2.2} bokeh={4} bloom={0.9} bloomThreshold={0.75} vignette={0.6} />
      </Stage>
      <Headline at={L(env.word) - 0.1} kicker={kind === "drought" ? "জাত ১" : kind === "disease" ? "জাত ২" : "জাত ৩"} text={env.head} color={env.rim} top={260} />
      <Flash at={0} dur={0.14} />
    </AbsoluteFill>
  );
};
export const P2E: React.FC<ShotProps> = ({ a }) => <Specimen a={a} kind="drought" />;
export const P2F: React.FC<ShotProps> = ({ a }) => <Specimen a={a} kind="disease" />;
export const P2G: React.FC<ShotProps> = ({ a }) => <Specimen a={a} kind="yield" />;

/* ------------------------------------------------------------------ H — threats hit a genebank */
export const P2H: React.FC<ShotProps> = ({ a }) => {
  const { t, L } = useShot(a);
  const tw = L("যুদ্ধ");
  const tf = L("বন্যা");
  const tg = L("আগুন");
  const tm = L("যান্ত্রিক");
  const td = L("ধ্বংস");
  const war = p(t, tw, tw + 0.9, (x) => x);
  const flood = p(t, tf, tf + 0.5, ease.out) * (1 - p(t, tg + 0.1, tg + 0.5));
  const fire = p(t, tg - 0.05, tg + 0.3) * (1 - p(t, td + 0.4, td + 0.9) * 0.6);
  const power = p(t, tm, tm + 0.8, (x) => x);
  const ruin = p(t, td - 0.1, td + 0.6, ease.in);
  const ang = mix(-0.9, 0.5, p(t, 0, 5, (x) => x));
  const shake = [tw, tf, tg, tm, td].reduce((s, x) => s + Math.exp(-Math.max(0, t - x) * 9) * (t >= x ? 1 : 0), 0);
  const hh = handheld(t * 6, 0.12 * shake, 9);
  const cam = { position: [Math.sin(ang) * 15 + hh[0], 7.5 + hh[1], Math.cos(ang) * 15] as V3, target: [0, 1.4, 0] as V3, mm: 32 + shake * 4 };
  const grey = ruin;
  return (
    <AbsoluteFill>
      <Stage background="#0a0d12">
        <Lens position={cam.position} target={cam.target} mm={cam.mm} />
        <SkyDome top="#05070a" mid={"#" + new THREE.Color("#2b3e55").lerp(new THREE.Color("#3a1410"), Math.max(fire, war * (1 - war))).getHexString()} bottom="#07090c" r={150} />
        <hemisphereLight args={["#c7dcf2", "#22301c", 0.6 - grey * 0.3]} />
        <directionalLight position={[-8, 12, 6]} intensity={2.2 - grey} color="#fff1dc" castShadow shadow-mapSize={[1024, 1024]} />
        <Genebank war={war} flood={flood} fire={fire} power={power} ruin={ruin} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.31, 0]} receiveShadow>
          <planeGeometry args={[120, 120]} />
          <meshStandardMaterial color="#0c1218" roughness={0.95} />
        </mesh>
        <PostFX bloom={1.1} bloomThreshold={0.7} vignette={0.65} aberration={0.0006 + shake * 0.004} />
      </Stage>
      <AbsoluteFill style={{ background: "#000", opacity: grey * 0.35 }} />
      <ChipRow
        top={210}
        items={[
          { text: "যুদ্ধ", at: tw },
          { text: "বন্যা", at: tf },
          { text: "আগুন", at: tg },
          { text: "যান্ত্রিক ত্রুটি", at: tm },
        ]}
      />
      <Headline at={td - 0.05} text="সংগ্রহ ধ্বংস!" color={S.red} top={420} />
      <Flash at={tw} dur={0.2} color="#ffd2a0" />
      <Flash at={0} dur={0.14} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ I — DNA breaks and fades */
export const P2I: React.FC<ShotProps> = ({ a }) => {
  const { t, L } = useShot(a);
  const brk = p(t, L("হারালে") - 0.1, L("হারালে") + 0.9, ease.out);
  const fade = p(t, L("চিরতরে") - 0.1, L("যায়") + 0.5, ease.inOut);
  const k = p(t, 0, 4.5, ease.out);
  return (
    <AbsoluteFill>
      <Stage background="#02050a">
        <Lens position={[mix(2.5, 0.8, k), mix(-1.5, 0.8, k), mix(10, 7.2, k)]} target={[0, 0.2, 0]} mm={mix(32, 38, k)} />
        <Stars count={700} r={200} opacity={0.5 * (1 - fade)} />
        <ambientLight intensity={0.3} />
        <pointLight position={[3, 3, 4]} intensity={30} color="#bfe9ff" />
        <Helix brk={brk} fade={fade} />
        <PostFX focus={7.5} focusRange={3} bokeh={3} bloom={1.4} bloomThreshold={0.45} vignette={0.7} />
      </Stage>
      <Headline at={L("জিনগত") - 0.05} kicker="হারিয়ে যায়" text="বিশেষ জিনগত গুণ" color={S.red} top={240} out={L("যায়") + 0.6} />
      <Tag at={L("চিরতরে")} text="আর ফেরত আনা যায় না" top={1150} color={S.red} />
      <Flash at={0} dur={0.16} />
    </AbsoluteFill>
  );
};
