/**
 * Part 4 · Section 4D–4F ("মজার" → end).
 * D "মজার ব্যাপার, এখানে বীজ রাখতে কোনো টাকা লাগে না" — top-down deposit invoice on a crate lid; stamp slams
 *   "বিনামূল্যে / FREE". Chip "০ টাকা".
 * E "বাক্সগুলো কেউ খোলেও না, একে বলে ব্ল্যাক বক্স ব্যবস্থা" — sealed black crate, tamper tape; a gloved hand reaches and
 *   stops short; rack focus hand → seal. Headline "ব্ল্যাক বক্স".
 * F "যে প্রতিষ্ঠান বীজ রেখেছে, শুধু তারাই সেটা ফেরত নিতে পারে" — padlock macro orbit: two wrong keys (red ✕), the owner's
 *   key (tag "জমাদাতা") turns, shackle opens with a teal glow. Headline "শুধু মালিক ফেরত নিতে পারে".
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { HDRI, Lighting } from "../../../kit/assets";
import { PostFX } from "../../../kit/PostFX";
import { Lens, Stage } from "../../../kit/Stage";
import { ease, handheld, mix, mix3, prog } from "../../../kit/time";
import { NV } from "../../PartPlayer";
import type { V3 } from "../../three/util";
import { atAfter, atEnd } from "../../vo";
import { CrateLid, Cross, DepositInvoice, GlovedHand, KEYHOLE, Key, Padlock, RubberStamp, SEAL_PT, SealedCrate } from "../models/Custody";
import { KeyLight } from "../models/SeedMacro";
import { P } from "../palette";
import { Block, headline, pop, rise } from "../p2/S2A";
import { Chip } from "../p3/S3A";

const times = (a: number) => {
  const w = (word: string, from = 0) => atAfter("p4", word, a + from) - a;
  const kono = w("কোনো");
  const taka = w("টাকা");
  const baksho = w("বাক্সগুলো");
  const khole = w("খোলেও");
  const na2 = w("না", khole);
  const black = w("ব্ল্যাক");
  const je = w("যে", black);
  const prot = w("প্রতিষ্ঠান");
  const bij2 = w("বীজ", prot);
  const rekheche = w("রেখেছে");
  const shudhu = w("শুধু");
  const tarai = w("তারাই");
  const sheta = w("সেটা");
  const ferot = w("ফেরত");
  const nite = w("নিতে");
  const end = atEnd("p4", "পারে") + 0.75 - a;
  return { kono, taka, baksho, khole, na2, black, je, prot, bij2, rekheche, shudhu, tarai, sheta, ferot, nite, end, cutE: baksho - 0.12, cutF: je - 0.15 };
};
type T = ReturnType<typeof times>;

export const s4bCuts = (a = 0) => {
  const T = times(a);
  return [T.cutE, T.cutF].map((c) => a + c);
};

type Cam = { position: V3; target: V3; mm: number };
const dist = (p: V3, q: V3) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

/* ───────────── D · invoice + stamp ───────────── */
const IMPRINT: V3 = [0.022, 0.0016, 0.034];
const stampState = (t: number, T: T) => {
  const tk = T.taka;
  const swing = ease.inOut(prog(t, tk - 0.5, tk - 0.16));
  const slam = ease.inQuad(prog(t, tk - 0.16, tk));
  const lift = ease.inOut(prog(t, tk + 0.14, tk + 0.6));
  const hover: V3 = [IMPRINT[0], 0.13, IMPRINT[2]];
  let p = mix3([0.36, 0.32, 0.1], hover, swing);
  p = mix3(p, IMPRINT, slam);
  p = mix3(p, [0.32, 0.38, -0.08], lift);
  return { p, tilt: 0.25 * (1 - swing) - 0.2 * lift, stamped: t >= tk ? 1 : 0 };
};
const camD = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, 0, T.cutE));
  const hit = t - T.taka;
  const shake = hit > 0 && hit < 0.3 ? Math.sin(hit * 70) * 0.006 * (1 - hit / 0.3) : 0;
  const punch = ease.out(prog(t, T.taka, T.taka + 0.2));
  return { position: mix3([0.06, 0.74 + shake, 0.3], [0.03, 0.64 + shake, 0.24], k), target: [0.01 + shake * 0.5, 0, 0.06], mm: mix(38, 40, punch) };
};

const SceneD: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const s = stampState(t, T);
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.01} far={20} />
      <color attach="background" args={["#0c141e"]} />
      <fogExp2 attach="fog" args={["#0c141e", 0.5]} />
      <Lighting hdri={HDRI.studio} intensity={0.55} rotation={1.8} />
      <KeyLight position={[-0.5, 1.4, 0.4]} intensity={2.4} half={0.5} color="#eef3f8" far={4} />
      <pointLight position={[0.4, 0.3, -0.3]} intensity={0.5} distance={1.5} decay={2} color={P.amber} />
      <CrateLid />
      <DepositInvoice stamped={s.stamped} />
      <RubberStamp position={s.p} tilt={s.tilt} />
      <PostFX focus={dist(cam.position, cam.target)} focusRange={0.3} bokeh={2} bloom={0.4} vignette={0.55} />
    </>
  );
};

/* ───────────── E · black crate + glove ───────────── */
const handState = (t: number, T: T) => {
  const reach = ease.outCubic(prog(t, T.cutE + 0.1, T.na2 + 0.05));
  const back = ease.inOut(prog(t, T.black - 0.1, T.cutF));
  const stop: V3 = [SEAL_PT[0] - 0.02, SEAL_PT[1] + 0.075, SEAL_PT[2] + 0.07];
  let p = mix3([-0.45, 0.6, 0.45], stop, reach);
  p = mix3(p, [stop[0] - 0.06, stop[1] + 0.05, stop[2] + 0.05], back);
  const hes = prog(t, T.na2 - 0.1, T.na2 + 0.4);
  const tremble = Math.sin(t * 31) * 0.0012 * hes * (1 - back);
  return { p: [p[0] + tremble, p[1], p[2]] as V3, curl: 0.2 + 0.5 * hes };
};
const camE = (t: number, T: T): Cam => {
  const k = ease.cine(prog(t, T.cutE, T.cutF + 0.2));
  const hh = handheld(t, 0.002, 2);
  return { position: mix3([0.32 + hh[0], 0.46 + hh[1], 1.08], [0.2 + hh[0], 0.42 + hh[1], 0.86], k), target: [SEAL_PT[0] + 0.06, SEAL_PT[1] - 0.02, SEAL_PT[2]], mm: 45 };
};
const SceneE: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const h = handState(t, T);
  const rack = ease.inOut(prog(t, T.na2, T.na2 + 0.5));
  const focus = mix(dist(cam.position, h.p), dist(cam.position, SEAL_PT), rack);
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.01} far={20} />
      <color attach="background" args={[P.night]} />
      <fogExp2 attach="fog" args={[P.night, 0.45]} />
      <Lighting hdri={HDRI.studio} intensity={0.3} rotation={2.4} />
      <KeyLight position={[0.9, 1.4, 0.9]} intensity={2.0} half={0.7} color="#dfe8f2" far={5} />
      <spotLight position={[-0.6, 0.5, -0.3]} angle={0.6} penumbra={0.9} intensity={3} color="#7fa6c8" distance={3} decay={2} />
      <SealedCrate />
      <GlovedHand position={h.p} rotation={[-0.45, -0.75, 0]} curl={h.curl} />
      <PostFX focus={focus} focusRange={0.08} bokeh={5} bloom={0.4} vignette={0.6} />
    </>
  );
};

/* ───────────── F · padlock + keys ───────────── */
const KH = KEYHOLE;
/** key position for an approach → insert depth → withdraw path */
const keyPath = (t: number, tIn: number, tSeat: number, tOut: number, depth: number, side: number): V3 => {
  const a = ease.outCubic(prog(t, tIn, tSeat));
  const o = ease.inOut(prog(t, tOut, tOut + 0.3));
  const seat: V3 = [KH[0], KH[1], KH[2] + 0.036 - depth];
  const from: V3 = [KH[0] + 0.05 * side, KH[1] - 0.03, KH[2] + 0.14];
  return mix3(mix3(from, seat, a), [KH[0] - 0.07 * side, KH[1] - 0.02, KH[2] + 0.12], o);
};
const camF = (t: number, T: T): Cam => {
  const k = ease.inOut(prog(t, T.cutF, T.end));
  const ang = mix(0.6, -0.4, k);
  const r = mix(0.38, 0.31, k);
  const c: V3 = [0.004, 0.012, 0.01];
  return { position: [c[0] + Math.sin(ang) * r, c[1] + mix(0.08, 0.045, k), c[2] + Math.cos(ang) * r], target: c, mm: 60 };
};
const SceneF: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const { fps } = useVideoConfig();
  // wrong key 1
  const k1Out = T.bij2 + 0.25;
  const k1 = keyPath(t, T.cutF, T.prot + 0.15, k1Out, 0.012, 1);
  const j1 = Math.sin(t * 34) * 0.12 * prog(t, T.prot + 0.15, T.prot + 0.25) * (1 - prog(t, T.bij2, T.bij2 + 0.1));
  // wrong key 2
  const k2In = k1Out + 0.05;
  const k2Out = T.shudhu - 0.25;
  const k2 = keyPath(t, k2In, T.rekheche + 0.15, k2Out, 0.01, -1);
  const x2At = T.rekheche + 0.3;
  const j2 = Math.sin(t * 38) * 0.12 * prog(t, T.rekheche + 0.12, T.rekheche + 0.2) * (1 - prog(t, x2At, x2At + 0.1));
  // owner key: seats fully, turns, shackle opens
  const kOIn = T.shudhu - 0.2;
  const kO = keyPath(t, kOIn, T.tarai + 0.15, 99, 0.036, 1);
  const turn = ease.inOut(prog(t, T.sheta, T.ferot)) * (Math.PI / 2);
  const open = ease.outCubic(prog(t, T.ferot + 0.02, T.nite + 0.1));
  const glow = prog(t, T.ferot, T.ferot + 0.3) * (1 - 0.3 * prog(t, T.nite + 0.3, T.end));
  const xPos: V3 = [KH[0] + 0.03, KH[1] + 0.028, KH[2] + 0.02];
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.005} far={10} />
      <color attach="background" args={[P.night]} />
      <fogExp2 attach="fog" args={[P.night, 1.4]} />
      <Lighting hdri={HDRI.studio} intensity={0.75} rotation={0.9} />
      <KeyLight position={[0.35, 0.5, 0.45]} intensity={2.2} half={0.25} color="#e8eef3" far={3} />
      <spotLight position={[-0.3, 0.1, -0.1]} angle={0.7} penumbra={0.9} intensity={1.5} color="#7fa6c8" distance={1} decay={2} />
      <Padlock open={open} glow={glow} />
      {t < k1Out + 0.3 ? <Key position={k1} turn={j1} cut={3} /> : null}
      {t >= k2In && t < k2Out + 0.3 ? <Key position={k2} turn={j2} cut={8} tint="#b9c0c6" /> : null}
      {t >= kOIn ? <Key position={kO} turn={turn} cut={21} tag="জমাদাতা" tint="#d6dce1" /> : null}
      <Cross position={xPos} k={t >= T.bij2 && t < k1Out + 0.15 ? pop(t, T.bij2, fps) : 0} />
      <Cross position={xPos} k={t >= x2At && t < k2Out + 0.15 ? pop(t, x2At, fps) : 0} />
      <PostFX focus={dist(cam.position, cam.target)} focusRange={0.05} bokeh={4} bloom={1.0} bloomThreshold={0.75} vignette={0.55} />
    </>
  );
};

/* ───────────── text ───────────── */
const Overlays: React.FC<{ readonly t: number; readonly T: T }> = ({ t, T }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Block t={t} inAt={T.taka - 0.05} outAt={T.cutE - 0.22}>
        {(k) => (
          <div style={{ transform: "scale(1.7)", transformOrigin: "left top" }}>
            <Chip text="০ টাকা" k={k} />
          </div>
        )}
      </Block>
      <Block t={t} inAt={T.khole - 0.05} outAt={T.cutF - 0.22}>
        {(k) => (
          <>
            <Chip text="কেউ খোলে না" k={k} />
            {t >= T.black - 0.05 ? <div style={{ ...headline, marginTop: 16, ...rise(pop(t, T.black - 0.05, fps)) }}>ব্ল্যাক বক্স</div> : null}
          </>
        )}
      </Block>
      <Block t={t} inAt={T.shudhu - 0.05} outAt={T.end - 0.25}>
        {(k) => (
          <div style={{ ...headline, fontSize: 98, ...rise(k) }}>
            <span style={{ color: P.vaultTeal }}>শুধু মালিক</span>
            <br />
            ফেরত নিতে পারে
          </div>
        )}
      </Block>
    </AbsoluteFill>
  );
};

export const S4B: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const T = times(a);
  const shot = t < T.cutE ? 0 : t < T.cutF ? 1 : 2;
  const cam = shot === 0 ? camD(t, T) : shot === 1 ? camE(t, T) : camF(t, T);
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <Stage background={P.night}>
        {shot === 0 ? <SceneD key="d" t={t} T={T} cam={cam} /> : null}
        {shot === 1 ? <SceneE key="e" t={t} T={T} cam={cam} /> : null}
        {shot === 2 ? <SceneF key="f" t={t} T={T} cam={cam} /> : null}
      </Stage>
      <Overlays t={t} T={T} />
    </AbsoluteFill>
  );
};

/** SFX (3): stamp impact, owner key click, teal shimmer on open */
export const s4bCues = (a: number) => {
  const T = times(a);
  return [
    { t: a + T.taka - 0.02, src: NV("impact"), vol: 0.5 },
    { t: a + T.ferot - 0.05, src: NV("ui_click"), vol: 0.55 },
    { t: a + T.ferot + 0.05, src: NV("shimmer"), vol: 0.3 },
  ];
};
