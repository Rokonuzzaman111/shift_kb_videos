/**
 * Part 1 · Section 1C (storyboard C1–C5): inside.
 * C1 "দরজা পেরিয়ে" — interior view from the dark vestibule: the steel double door swings toward camera, cold fog
 *    breathes out, corridor light spills in; camera creeps, then pushes through.
 * C2 "পাহাড়ের ভেতর দিয়ে একশো মিটারেরও বেশি লম্বা সুড়ঙ্গ" — speed-ramp down the board-formed concrete corridor, hard cut on
 *    "একশো" into the blue-lit corrugated tube flying fast (lamp strips stretch into streaks). Amber distance counter.
 * C3 "তারপর বরফ-শীতল তিনটা কক্ষ" — the flight decelerates out of the tube into the transverse hall; three rimed vault
 *    doors; teal chips ১ ২ ৩ pop on "তিনটা".
 * C4 "ভেতরে মাইনাস আঠারো … চৌদ্দ লাখেরও বেশি বীজের নমুনা" — LONG slow dolly down a rack aisle, rack-focus onto a crate
 *    label. Thermometer −১৮°C (amber) on "মাইনাস", then counter ১৪,০০,০০০+ on "চৌদ্দ".
 * C5 "আর এর ধারণক্ষমতা? প্রায় পঁয়তাল্লিশ লাখ জাত" — fast pull-out through the rock into an X-ray mountain section,
 *    halls 2/3 fill as teal holograms, capacity bar ১৪ লাখ / ৪৫ লাখ, slow orbit to the end.
 */
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Lighting, HDRI } from "../../../kit/assets";
import { PostFX } from "../../../kit/PostFX";
import { Lens, Stage } from "../../../kit/Stage";
import { ease, handheld, mix, mix3, prog } from "../../../kit/time";
import { SV } from "../../PartPlayer";
import { headFont, numFont } from "../../theme";
import { project, type V3 } from "../../three/util";
import { atAfter } from "../../vo";
import { Corridor, DOOR_X, HALL, Puffs } from "../models/Corridor";
import { HERO_LABEL, VaultRoom, VaultXray, AISLE_X } from "../models/VaultRoom";
import { P, bn, pa } from "../palette";

const W = 1080;
const H = 1920;
const FPS = 30;

const times = (a: number) => {
  const w = (word: string) => atAfter("p1", word, a) - a;
  const T = {
    darja: w("দরজা"),
    pahar: w("পাহাড়ের"),
    eksho: w("একশো"),
    surongo: w("সুড়ঙ্গ"),
    tarpor: w("তারপর"),
    tinta: w("তিনটা"),
    kokkho: w("কক্ষ"),
    bhetore: w("ভেতরে"),
    minus: w("মাইনাস"),
    athar: w("আঠারো"),
    choddo: w("চৌদ্দ"),
    nomuna: w("নমুনা"),
    ar: w("আর"),
    dharon: w("ধারণক্ষমতা"),
    poy: w("পঁয়তাল্লিশ"),
    lakh: atAfter("p1", "লাখ", a, 1) - a,
  };
  return {
    ...T,
    cutTube: T.eksho - 0.05,
    cutVault: T.bhetore - 0.08,
    cutXray: T.ar - 0.06,
    countLand: T.choddo + 0.75,
  };
};
type T = ReturnType<typeof times>;

/** internal shot cuts in part seconds (for the beat layer) */
export const s1cCuts = (a: number) => {
  const T = times(a);
  return [a + T.cutTube, a + T.cutVault, a + T.cutXray];
};

type Cam = { position: V3; target: V3; mm: number; roll?: number };

/* ───────────────────────────── cameras ───────────────────────────── */

const flyEase = Easing.bezier(0.3, 0.62, 0.3, 1);
const corrZ = (t: number, T: T) => {
  if (t < T.cutTube) {
    if (t < 0.95) return mix(-3.4, -2.75, ease.inOut(t / 0.95));
    return -2.75 + 20.75 * ease.inQuad(prog(t, 0.95, T.cutTube));
  }
  return 29 + (120.4 - 29) * flyEase(prog(t, T.cutTube, T.kokkho + 0.15));
};

const camCorridor = (t: number, T: T): Cam => {
  const z = corrZ(t, T);
  const hh = handheld(t, 0.012, 3);
  if (t < T.cutTube) {
    return { position: [hh[0], 1.62 + hh[1], z], target: [0, 1.52, z + 10], mm: 20 };
  }
  const kOrb = ease.inOut(prog(t, T.tarpor + 0.4, T.cutVault));
  const x = mix(0, -0.35, kOrb);
  const kLook = ease.inOut(prog(t, T.tarpor - 0.2, T.tinta));
  const fwd: V3 = [0, 1.45, z + 12];
  const target = mix3(fwd, [0.15, 1.5, HALL.z1], kLook);
  const mm = mix(18, 14, ease.inOut(prog(t, T.surongo, T.tinta)));
  const roll = Math.sin(t * 2.1) * 0.025 * (1 - kLook);
  return { position: [x + hh[0], mix(1.5, 1.68, kLook) + hh[1], z], target, mm, roll };
};

const vaultEase = Easing.bezier(0.25, 0.1, 0.35, 1);
const camVault = (t: number, T: T): Cam => {
  const k = vaultEase(prog(t, T.cutVault, T.nomuna + 0.2));
  const z = mix(1.0, 10.0, k);
  const kTurn = ease.inOut(prog(t, T.choddo + 0.4, T.nomuna + 0.15));
  const hh = handheld(t, 0.01, 7);
  const position: V3 = [mix(AISLE_X, AISLE_X + 0.35, kTurn) + hh[0], 1.64 + hh[1], z];
  const target = mix3([AISLE_X + 0.15, 1.45, z + 10], HERO_LABEL, kTurn);
  return { position, target, mm: mix(21, 38, ease.inOut(prog(t, T.choddo + 0.3, T.nomuna + 0.3))) };
};

const orbitPos = (t: number, T: T): V3 => {
  const ang = 0.9 + 0.055 * (t - T.cutXray);
  const r = 112;
  return [Math.sin(ang) * r, 54, 95 - Math.cos(ang) * r];
};
const camXray = (t: number, T: T): Cam => {
  const kp = ease.out(prog(t, T.cutXray, T.cutXray + 1.35));
  const position = mix3([-14, 3.1, 109], orbitPos(t, T), kp);
  const target = mix3([-14, 2.2, 126], [-1, 3, 110], ease.inOut(prog(t, T.cutXray, T.cutXray + 1.1)));
  return { position, target, mm: mix(22, 30, ease.inOut(prog(t, T.cutXray + 0.4, T.cutXray + 2.4))) };
};

/* ───────────────────────────── scenes ───────────────────────────── */

const CorridorScene: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const open = ease.inOut(prog(t, T.darja - 0.05, T.darja + 0.85));
  const speed = (corrZ(t + 1 / FPS, T) - corrZ(t, T)) * FPS;
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} roll={cam.roll ?? 0} near={0.03} far={400} />
      <fogExp2 attach="fog" args={["#0a1522", 0.018]} />
      <Lighting hdri={HDRI.studio} intensity={0.12} />
      <Corridor cam={cam.position} open={open} speed={t > T.cutTube ? speed : 0} t={t} />
      {/* the cold breath that rolls out of the opening door */}
      <Puffs
        count={30}
        seed={5}
        box={[-1.1, 1.1, 0.1, 2.5, 0.2, 2.2]}
        size={[1.0, 2.4]}
        t={Math.max(0, t - T.darja)}
        drift={[0, 0.05, -1.6]}
        k={t < T.cutTube ? open * (1 - prog(t, 1.3, T.cutTube)) : 0}
        opacity={0.32}
        color="#d6e1ea"
      />
      <PostFX bloom={0.9} bloomThreshold={0.82} vignette={0.52} aberration={t > T.cutTube && t < T.tarpor ? 0.0022 : 0.0008} />
    </>
  );
};

const VaultScene: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const dLabel = Math.hypot(cam.position[0] - HERO_LABEL[0], cam.position[1] - HERO_LABEL[1], cam.position[2] - HERO_LABEL[2]);
  const kRack = ease.inOut(prog(t, T.nomuna - 0.35, T.nomuna + 0.35));
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.03} far={120} />
      <color attach="background" args={["#aab6c2"]} />
      <fogExp2 attach="fog" args={["#aab6c2", 0.045]} />
      <Lighting hdri={HDRI.studio} intensity={0.35} />
      <VaultRoom t={t} cam={cam.position} />
      <PostFX bloom={0.6} bloomThreshold={0.85} vignette={0.48} focus={mix(6.5, dLabel, kRack)} focusRange={mix(5, 0.35, kRack)} bokeh={mix(2, 5, kRack)} />
    </>
  );
};

const XrayScene: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam }> = ({ t, T, cam }) => {
  const shell = 0.25 + 0.75 * prog(t, T.cutXray + 0.2, T.cutXray + 1.2);
  const fill2 = prog(t, T.poy - 0.1, T.poy + 0.55, ease.inOut);
  const fill3 = prog(t, T.poy + 0.3, T.lakh + 0.6, ease.inOut);
  return (
    <>
      <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.1} far={1200} />
      <fogExp2 attach="fog" args={[P.night, 0.0035]} />
      <Lighting hdri={HDRI.studio} intensity={0.4} />
      <VaultXray cam={cam.position} shell={shell} fill2={fill2} fill3={fill3} t={t} />
      <PostFX bloom={0.8} bloomThreshold={0.8} vignette={0.55} aberration={0.0008} />
    </>
  );
};

/* ───────────────────────────── 2D text (top zone, one block at a time) ───────────────────────────── */

const pop = (t: number, at: number, fps: number, d = 12) => spring({ frame: Math.round((t - at) * fps), fps, config: { damping: d, stiffness: 180, mass: 0.6 } });
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
      fontSize: 36,
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

const Block: React.FC<{ readonly t: number; readonly inAt: number; readonly outAt: number; readonly children: (k: number) => React.ReactNode }> = ({ t, inAt, outAt, children }) => {
  const { fps } = useVideoConfig();
  if (t < inAt - 0.02 || t > outAt + 0.25) return null;
  const k = pop(t, inAt, fps);
  const o = outK(t, outAt);
  return <div style={{ position: "absolute", left: 72, right: 72, top: 200, opacity: o, transform: `translateY(${(1 - o) * -24}px)` }}>{children(k)}</div>;
};

const numStyle = (k: number, size = 150): React.CSSProperties => ({
  fontFamily: `${numFont}, ${headFont}`,
  fontWeight: 900,
  fontSize: size,
  lineHeight: 1,
  color: P.amber,
  letterSpacing: -2,
  textShadow: `0 0 34px ${pa(P.amber, 0.35)}, 0 4px 24px ${pa(P.night, 0.8)}`,
  transform: `translateY(${(1 - k) * 40}px) scale(${0.85 + 0.15 * k})`,
  transformOrigin: "left bottom",
  opacity: Math.min(1, k * 1.5),
});
const unitStyle: React.CSSProperties = { fontFamily: headFont, fontWeight: 800, fontSize: 64, color: P.snow, marginLeft: 18, textShadow: `0 3px 18px ${pa(P.night, 0.85)}` };

const indian = (n: number) => {
  const s = String(Math.round(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
};

const Thermo: React.FC<{ readonly k: number; readonly fill: number }> = ({ k, fill }) => (
  <svg width={70} height={170} viewBox="0 0 70 170" style={{ opacity: Math.min(1, k * 1.5), transform: `scale(${0.7 + 0.3 * k})`, transformOrigin: "center bottom", marginRight: 22 }}>
    <rect x={22} y={6} width={26} height={120} rx={13} fill={pa(P.night, 0.55)} stroke={P.amber} strokeWidth={4} />
    <rect x={30} y={14 + 104 * (1 - fill)} width={10} height={104 * fill + 14} rx={5} fill={P.amber} />
    <circle cx={35} cy={140} r={24} fill={P.amber} />
    {[30, 55, 80, 105].map((y) => (
      <line key={y} x1={52} x2={62} y1={y} y2={y} stroke={pa(P.snow, 0.7)} strokeWidth={3} />
    ))}
  </svg>
);

const Overlays: React.FC<{ readonly t: number; readonly T: T; readonly cam: Cam; readonly camZ: number }> = ({ t, T, cam, camZ }) => {
  const { fps } = useVideoConfig();
  const meters = Math.max(0, Math.min(100, Math.floor(camZ)));
  const deg = Math.round(-18 * prog(t, T.minus + 0.05, T.athar + 0.3, ease.outCubic));
  const seeds = 1400000 * prog(t, T.choddo, T.countLand, ease.outCubic);
  const capK = prog(t, T.dharon, T.dharon + 0.6, ease.out);
  const capK2 = prog(t, T.poy - 0.05, T.poy + 0.6, ease.out);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* C2 distance counter */}
      <Block t={t} inAt={T.pahar} outAt={T.surongo + 0.45}>
        {(k) => (
          <>
            <Chip text="সুড়ঙ্গ" k={k} />
            <div style={{ marginTop: 16, display: "flex", alignItems: "baseline" }}>
              <span style={numStyle(k)}>{bn(camZ >= 100 ? "100+" : meters)}</span>
              <span style={unitStyle}>মিটার</span>
            </div>
          </>
        )}
      </Block>
      {/* C3 door chips ১ ২ ৩ pinned above the three doors */}
      {t > T.tinta - 0.1 && t < T.cutVault
        ? DOOR_X.map((x, i) => {
            const p = project(cam, [x, 3.0, HALL.z1 - 0.2], W, H);
            const k = pop(t, T.tinta - 0.04 + i * 0.13, fps, 10);
            if (!p.visible || k <= 0.001) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y - 92,
                  width: 92,
                  height: 92,
                  marginLeft: -46,
                  borderRadius: 999,
                  background: P.vaultTeal,
                  color: P.night,
                  fontFamily: headFont,
                  fontWeight: 800,
                  fontSize: 58,
                  lineHeight: "92px",
                  textAlign: "center",
                  transform: `scale(${k})`,
                  boxShadow: `0 0 34px ${pa(P.vaultTeal, 0.55)}, 0 8px 22px ${pa(P.night, 0.6)}`,
                }}
              >
                {bn(i + 1)}
              </div>
            );
          })
        : null}
      {/* C4 thermometer */}
      <Block t={t} inAt={T.minus - 0.04} outAt={T.choddo - 0.22}>
        {(k) => (
          <>
            <Chip text="ভেতরের তাপমাত্রা" k={k} />
            <div style={{ marginTop: 18, display: "flex", alignItems: "flex-end" }}>
              <Thermo k={k} fill={0.75 - 0.6 * (deg / -18)} />
              <span style={numStyle(k)}>{deg < 0 ? "−" : ""}{bn(Math.abs(deg))}°C</span>
            </div>
          </>
        )}
      </Block>
      {/* C4 seed sample counter */}
      <Block t={t} inAt={T.choddo - 0.04} outAt={T.cutXray - 0.25}>
        {(k) => (
          <>
            <Chip text="বীজের নমুনা" k={k} />
            <div style={{ marginTop: 16 }}>
              <span style={numStyle(k, 132)}>
                {bn(indian(seeds))}
                {t >= T.countLand ? "+" : ""}
              </span>
            </div>
          </>
        )}
      </Block>
      {/* C5 capacity bar */}
      <Block t={t} inAt={T.dharon - 0.04} outAt={99}>
        {(k) => (
          <>
            <Chip text="ধারণক্ষমতা" k={k} />
            <div style={{ marginTop: 22, display: "flex", alignItems: "baseline", gap: 18, opacity: Math.min(1, k * 1.5) }}>
              <span style={numStyle(k, 96)}>{bn(14)} লাখ</span>
              <span style={{ ...unitStyle, marginLeft: 0, fontSize: 52, color: pa(P.snow, 0.7) }}>/</span>
              <span style={{ ...numStyle(capK2, 96), color: P.vaultTeal, textShadow: `0 0 30px ${pa(P.vaultTeal, 0.45)}`, opacity: 0.25 + 0.75 * capK2 }}>{bn(45)} লাখ</span>
            </div>
            <div style={{ position: "relative", marginTop: 22, height: 30, borderRadius: 15, background: pa(P.night, 0.55), border: `2px solid ${pa(P.snow, 0.35)}`, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(14 / 45) * 100 * capK}%`, background: P.amber, boxShadow: `0 0 18px ${pa(P.amber, 0.6)}` }} />
              <div
                style={{
                  position: "absolute",
                  left: `${(14 / 45) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: `${(31 / 45) * 100 * capK2}%`,
                  background: `repeating-linear-gradient(90deg, ${pa(P.vaultTeal, 0.85)} 0 14px, ${pa(P.vaultTeal, 0.45)} 14px 20px)`,
                  boxShadow: `0 0 20px ${pa(P.vaultTeal, 0.6)}`,
                }}
              />
            </div>
          </>
        )}
      </Block>
    </AbsoluteFill>
  );
};

/* ───────────────────────────── section ───────────────────────────── */

export const S1C: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const T = times(a);
  const scene = t < T.cutVault ? "corr" : t < T.cutXray ? "vault" : "xray";
  const cam = scene === "corr" ? camCorridor(t, T) : scene === "vault" ? camVault(t, T) : camXray(t, T);
  const camZ = corrZ(t, T);
  const humFrom = Math.round((T.darja + 0.3) * fps);
  const humTo = Math.round((T.cutXray + 0.6) * fps);
  // whip flash on the corridor → tube cut
  const flash = Math.max(0, 1 - Math.abs(t - T.cutTube) / 0.12) * 0.55;
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <Stage background={P.night}>
        {scene === "corr" ? <CorridorScene t={t} T={T} cam={cam} /> : scene === "vault" ? <VaultScene t={t} T={T} cam={cam} /> : <XrayScene t={t} T={T} cam={cam} />}
      </Stage>
      {flash > 0 ? <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, ${pa("#dbe9f7", flash)}, ${pa("#4f8fd6", flash * 0.4)} 70%)` }} /> : null}
      <Overlays t={t} T={T} cam={cam} camZ={camZ} />
      {/* vault ambience: low hum + cooling fans, from the door until the X-ray pull-out */}
      <Sequence from={humFrom} durationInFrames={Math.max(1, Math.min(durationInFrames, humTo) - humFrom)} layout="none">
        <Audio
          src={staticFile(SV("hum"))}
          loop
          volume={(f) => {
            const s = f / fps;
            const len = (humTo - humFrom) / fps;
            return 0.22 * Math.min(1, s / 0.8) * Math.min(1, (len - s) / 0.5);
          }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

/** SFX for 1C (4, bible §5), in part seconds */
export const s1cCues = (a: number) => {
  const T = times(a);
  return [
    { t: a + T.darja - 0.12, src: SV("door"), vol: 0.5 },
    { t: a + T.cutTube - 0.3, src: "nvidia/sfx/whoosh_big.wav", vol: 0.55 },
    { t: a + T.countLand - 0.04, src: "nvidia/sfx/impact.wav", vol: 0.28 },
    { t: a + T.poy - 0.05, src: "nvidia/sfx/impact_deep.wav", vol: 0.55 },
  ];
};
