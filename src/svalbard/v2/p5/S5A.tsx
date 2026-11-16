/**
 * Part 5 · Section 5A–5D (0 → cut before the "এই" of "এই অক্টোবরেও").
 * A "আর এই ব্যাকআপ, সত্যিই কাজে লেগেছে" — one grey ICARDA crate alone under a cold spotlight, frost drifting. Slow push.
 * B "দুই হাজার পনেরো সালে, সিরিয়ার যুদ্ধে, আলেপ্পোর একটা বীজ ব্যাংক বিপদে পড়ে" — war-damaged Aleppo diorama at dusk,
 *   smoke + fires, research station with greenhouses. Crane down, punch-in on "বিপদে". Amber "২০১৫", pin "আলেপ্পো, সিরিয়া".
 * C "তখন ইতিহাসে প্রথমবার, স্‌ভালবার্ড থেকে বীজ ফেরত তোলা হয়" — interior looking out: a pallet truck rolls crates into the
 *   daylight doorway, camera dollies back. Photo pop-up #2 (inside_vault.jpg). Chip "ইতিহাসে প্রথম".
 * D "আর লেবানন ও মরক্কোয় নতুন করে গড়ে ওঠে পুরো সংগ্রহ" — tilted relief map; teal arcs Svalbard → Lebanon / Morocco;
 *   green fields bloom at each landing. Pins "লেবানন", "মরক্কো".
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { HDRI, Lighting } from "../../../kit/assets";
import { PostFX } from "../../../kit/PostFX";
import { Lens, Stage } from "../../../kit/Stage";
import { ease, handheld, mix, mix3, prog } from "../../../kit/time";
import { NV } from "../../PartPlayer";
import { project, type V3 } from "../../three/util";
import { atAfter } from "../../vo";
import { SkyDome } from "../models/Crops";
import { FieldBloom, FlightArc, MedMap, mapPos } from "../models/MedMap";
import { ALEPPO_STATION, AleppoCity, LightCone, Motes, PalletTruck, SpotFloor, VaultExit } from "../models/Rescue";
import { CRATES, Crate } from "../models/SeedCrates";
import { KeyLight } from "../models/SeedMacro";
import { P, bn } from "../palette";
import { Block, headline, rise } from "../p2/S2A";
import { Chip, amberNum } from "../p3/S3A";
import { PhotoCard } from "../ui/PhotoCard";
import { PinLabel } from "../ui/PinLabel";

export const s5aEnd = (a = 0) => atAfter("p5", "এই", atAfter("p5", "সংগ্রহ", a)) - 0.15;

const times = (a: number) => {
  const w = (word: string, from = 0) => atAfter("p5", word, a + from) - a;
  const sotti = w("সত্যিই");
  const du = w("দুই");
  const alep = w("আলেপ্পোর");
  const bipode = w("বিপদে");
  const tokhon = w("তখন");
  const itihash = w("ইতিহাসে");
  const prothom = w("প্রথমবার");
  const ferot = w("ফেরত");
  const hoy = w("হয়");
  const ar2 = w("আর", hoy);
  const leb = w("লেবানন");
  const mor = w("মরক্কোয়");
  const notun = w("নতুন");
  const end = s5aEnd(a) - a;
  return { sotti, du, alep, bipode, tokhon, itihash, prothom, ferot, ar2, leb, mor, notun, end, cutB: du - 0.15, cutC: tokhon - 0.15, cutD: ar2 - 0.1 };
};
type T = ReturnType<typeof times>;

export const s5aCuts = (a = 0) => {
  const T = times(a);
  return [T.cutB, T.cutC, T.cutD].map((c) => a + c);
};

type Cam = { position: V3; target: V3; mm: number };
const dist = (p: V3, q: V3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

/* ───────────── A · lone crate ───────────── */
const ICARDA = CRATES[8];
const camA = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, 0, T.cutB + 0.3));
  const hh = handheld(t, 0.004, 3);
  return { position: mix3([1.15 + hh[0], 0.95 + hh[1], 1.75], [0.72 + hh[0], 0.62 + hh[1], 1.1], k), target: [0, 0.2, 0], mm: 42 };
};
const SceneA: React.FC<{ readonly t: number; readonly cam: Cam }> = ({ t, cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.02} far={40} />
    <color attach="background" args={[P.night]} />
    <fogExp2 attach="fog" args={[P.night, 0.28]} />
    <Lighting hdri={HDRI.studio} intensity={0.06} rotation={1.2} />
    <spotLight position={[0.1, 3.2, 0.25]} angle={0.36} penumbra={0.55} intensity={70} decay={2} color="#dbe7f2" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
    <LightCone position={[0.1, 3.2, 0.25]} height={3.2} radius={1.2} color="#9fc0dc" k={0.6} />
    <SpotFloor />
    <Crate info={ICARDA} seed={808} position={[0, 0, 0]} yaw={-0.35} />
    <Motes count={260} seed={5} box={[-1, 1, 0, 2.8, -0.8, 1.0]} t={t} fall={0.14} drift={0.06} size={0.012} opacity={0.75} />
    <PostFX focus={dist(cam.position, cam.target)} focusRange={0.5} bokeh={3} bloom={0.5} vignette={0.6} />
  </>
);

/* ───────────── B · Aleppo at dusk ───────────── */
const STATION = ALEPPO_STATION;
/** crane down from over the rooftops into the street canyon, looking toward the research station and the low sun */
const camB = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, T.cutB, T.cutC + 0.2));
  const punch = ease.out(prog(t, T.bipode, T.bipode + 0.25));
  const hh = handheld(t, 0.03, 7);
  return { position: mix3([15 + hh[0], 44 + hh[1], 58], [3.4 + hh[0], 6.5 + hh[1], 21], k), target: mix3([0, 2, -48], [0, 6.5, -62], k), mm: mix(30, 36, punch) };
};
const SceneB: React.FC<{ readonly t: number; readonly cam: Cam }> = ({ t, cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.3} far={900} />
    <SkyDome top="#323a48" horizon="#c48a5e" r={600} />
    <fogExp2 attach="fog" args={["#8e7462", 0.0105]} />
    <Lighting hdri={HDRI.dusk} intensity={0.45} rotation={2.2} />
    <directionalLight
      position={[-60, 42, -160]}
      intensity={2.6}
      color="#ffb27a"
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-80}
      shadow-camera-right={80}
      shadow-camera-top={80}
      shadow-camera-bottom={-80}
      shadow-camera-far={420}
      shadow-bias={-0.0006}
    />
    <hemisphereLight args={["#8a8c96", "#5a4636", 0.9]} />
    <AleppoCity t={t} />
    <Motes count={320} seed={17} box={[-12, 12, 0, 16, -40, 22]} t={t} fall={0.3} drift={0.6} size={0.12} color="#c9ae90" opacity={0.4} />
    <PostFX bloom={0.7} bloomThreshold={0.82} vignette={0.5} />
  </>
);

/* ───────────── C · vault exit ───────────── */
const truckZ = (t: number, T: T) => mix(-1.6, -7.6, ease.inOut(prog(t, T.cutC - 0.2, T.cutD + 0.4)));
const camC = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, T.cutC, T.cutD));
  const hh = handheld(t, 0.008, 5);
  return { position: mix3([0.55 + hh[0], 1.25 + hh[1], 0.2], [0.35 + hh[0], 1.45 + hh[1], 3.2], k), target: [0, 1.0, -12], mm: 30 };
};
const SceneC: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => (
  <>
    <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.05} far={60} />
    <color attach="background" args={[P.night]} />
    <fogExp2 attach="fog" args={["#22313f", 0.03]} />
    <Lighting hdri={HDRI.studio} intensity={0.22} rotation={0.4} />
    <spotLight position={[0, 2.4, -19]} angle={0.5} penumbra={0.8} intensity={900} decay={2} color="#eef4fa" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
    <pointLight position={[0, 3.3, -2]} intensity={2.5} distance={7} decay={2} color="#cfe0ee" />
    <VaultExit t={t} />
    <PalletTruck position={[0, 0, truckZ(t, T)]} />
    <PostFX bloom={0.9} bloomThreshold={0.8} vignette={0.55} />
  </>
);

/* ───────────── D · relief map ───────────── */
const SVAL = mapPos(15.6, 78.2, 0.03);
const LEB = mapPos(35.8, 33.9, 0.03);
const MOR = mapPos(-6.8, 34.0, 0.03);
const camD = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, T.cutD, T.notun + 0.3));
  const drift = prog(t, T.notun, T.end);
  const pos = mix3([0.2, 1.25, -0.95], [0.02, 2.75, 4.5], k);
  return { position: [pos[0] + drift * 0.08, pos[1] - drift * 0.1, pos[2] - drift * 0.12], target: mix3([0.06, 0, -2.45], [0, 0, 1.55], k), mm: mix(30, 24, k) };
};
const SceneD: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const kL = ease.inOut(prog(t, T.leb - 0.05, T.leb + 1.2));
  const kM = ease.inOut(prog(t, T.mor - 0.1, T.mor + 1.1));
  const pulse = (t * 1.4) % 1;
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.02} far={60} />
      <color attach="background" args={[P.night]} />
      <fogExp2 attach="fog" args={[P.night, 0.06]} />
      <Lighting hdri={HDRI.studio} intensity={0.55} rotation={2.0} />
      <KeyLight position={[-3, 4, 1.5]} intensity={2.2} half={3.6} color="#eef3f8" far={14} />
      <MedMap t={t} />
      <mesh position={SVAL}>
        <sphereGeometry args={[0.03, 12, 8]} />
        <meshBasicMaterial color={P.vaultTeal} toneMapped={false} />
      </mesh>
      <mesh position={SVAL} rotation={[-Math.PI / 2, 0, 0]} scale={0.04 + pulse * 0.18}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial color={P.vaultTeal} transparent opacity={1 - pulse} toneMapped={false} />
      </mesh>
      <FlightArc from={SVAL} to={LEB} h={1.0} k={kL} />
      <FlightArc from={SVAL} to={MOR} h={1.0} k={kM} />
      <FieldBloom at={LEB} k={prog(t, T.leb + 1.15, T.end + 0.3)} seed={41} y={0.03} />
      <FieldBloom at={MOR} k={prog(t, T.mor + 1.05, T.end + 0.3)} seed={42} y={0.03} />
      <PostFX bloom={0.9} bloomThreshold={0.8} vignette={0.5} />
    </>
  );
};

/* ───────────── text ───────────── */
const Overlays: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam; readonly shot: number }> = ({ t, T, cam, shot }) => {
  const { width, height } = useVideoConfig();
  const st = shot === 1 ? project(cam, STATION, width, height) : null;
  const pL = shot === 3 ? project(cam, LEB, width, height) : null;
  const pM = shot === 3 ? project(cam, MOR, width, height) : null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Block t={t} inAt={T.sotti - 0.05} outAt={T.cutB - 0.22}>
        {(k) => (
          <div style={{ ...headline, ...rise(k) }}>
            <span style={{ color: P.vaultTeal }}>সত্যিই</span>
            <br />
            কাজে লেগেছে
          </div>
        )}
      </Block>
      <Block t={t} inAt={T.du - 0.05} outAt={T.cutC - 0.22}>
        {(k) => <div style={{ ...amberNum, fontSize: 170, ...rise(k) }}>{bn(2015)}</div>}
      </Block>
      {st && st.visible ? <PinLabel x={st.x} y={st.y} t={t} inAt={T.alep} outAt={T.cutC - 0.25} text="আলেপ্পো, সিরিয়া" side="left" rise={150} reach={60} /> : null}
      <Block t={t} inAt={T.itihash - 0.05} outAt={T.cutD - 0.22}>
        {(k) => (
          <div style={{ transform: "scale(1.5)", transformOrigin: "left top" }}>
            <Chip text="ইতিহাসে প্রথম" k={k} />
          </div>
        )}
      </Block>
      <PhotoCard
        src="svalbard/img/inside_vault.jpg"
        t={t}
        inAt={T.prothom + 0.02}
        outAt={Math.min(T.prothom + 1.45, T.ferot - 0.15)}
        credit="ছবি: Dag Endresen · CC BY 3.0"
        width={900}
        cy={880}
        aspect={4 / 3}
        side={-1}
      />
      {pL && pL.visible ? <PinLabel x={pL.x} y={pL.y} t={t} inAt={T.leb + 1.15} outAt={T.end - 0.2} text="লেবানন" side="left" rise={130} reach={50} /> : null}
      {pM && pM.visible ? <PinLabel x={pM.x} y={pM.y} t={t} inAt={T.mor + 1.05} outAt={T.end - 0.2} text="মরক্কো" side="right" rise={130} reach={50} /> : null}
    </AbsoluteFill>
  );
};

export const S5A: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps + a;
  const T = times(0);
  const shot = t < T.cutB ? 0 : t < T.cutC ? 1 : t < T.cutD ? 2 : 3;
  const cam = shot === 0 ? camA(t, T) : shot === 1 ? camB(t, T) : shot === 2 ? camC(t, T) : camD(t, T);
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <Stage background={P.night}>
        {shot === 0 ? <SceneA key="a" t={t} cam={cam} /> : null}
        {shot === 1 ? <SceneB key="b" t={t} cam={cam} /> : null}
        {shot === 2 ? <SceneC key="c" t={t} T={T} cam={cam} /> : null}
        {shot === 3 ? <SceneD key="d" t={t} T={T} cam={cam} /> : null}
      </Stage>
      <Overlays t={t} T={T} cam={cam} shot={shot} />
    </AbsoluteFill>
  );
};

/** SFX (3): war hit on "দুই", shutter on the photo, whoosh as the arcs launch */
export const s5aCues = (a: number) => {
  const T = times(a);
  return [
    { t: a + T.du - 0.03, src: NV("impact_deep"), vol: 0.45 },
    { t: a + T.prothom - 0.02, src: NV("camera_shutter"), vol: 0.5 },
    { t: a + T.leb - 0.05, src: NV("whoosh"), vol: 0.4 },
  ];
};
