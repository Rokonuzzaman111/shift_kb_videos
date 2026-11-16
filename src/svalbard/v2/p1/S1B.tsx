/**
 * Part 1 · Section 1B (storyboard B1–B2): the portal.
 * B1 "একটা বরফ-ঢাকা পাহাড়ের গভীরে আছে" — the real portal in polar twilight, blowing snow and spindrift, Adventfjorden
 *    and the striped mountains behind. ONE long crane: starts low behind the truss bridge, rises and swings left
 *    until the glowing art panel stands against the twilight sky.
 * B2 "স্‌ভালবার্ড গ্লোবাল সিড ভল্ট" — photo pop-up #1 (entrance_feb2025, "আসল ছবি") over a slow 3D push-in, then the
 *    title lock-up "SVALBARD GLOBAL SEED VAULT" + chip "নরওয়ে · ৭৮° উত্তর".
 * Every beat keys off a VO word (atAfter). Cut out sits in the pause before "দরজা".
 */
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { PostFX } from "../../../kit/PostFX";
import { Lens, Stage } from "../../../kit/Stage";
import { ease, mix, mix3, prog } from "../../../kit/time";
import { SV } from "../../PartPlayer";
import { headFont } from "../../theme";
import { type V3 } from "../../three/util";
import { atAfter } from "../../vo";
import { PortalSite, VAULT_FRAME, siteToWorld } from "../models/Portal";
import { SvalbardLandscape } from "../models/SvalbardLandscape";
import { P, pa } from "../palette";
import { PhotoCard } from "../ui/PhotoCard";

export const S1B_END_WORD = "দরজা";
/** cut sits in the pause before "দরজা" (part seconds) */
export const s1bEnd = (a = 0) => atAfter("p1", S1B_END_WORD, a) - 0.2;

const H = 1920;
const DETAIL = 400;
/** low twilight sun just left of the view axis → portal backlit like entrance_feb2025 */
const SUN_1B = new THREE.Vector3(0.85, 0.07, -0.52).normalize();

const times = (a: number) => {
  const w = (word: string) => atAfter("p1", word, a) - a;
  return {
    ekta: w("একটা"),
    borof: w("বরফ"),
    govire: w("গভীরে"),
    ache: w("আছে"),
    sval: w("স্‌ভালবার্ড"),
    global: w("গ্লোবাল"),
    sid: w("সিড"),
    vault: w("ভল্ট"),
    end: s1bEnd(a) - a,
  };
};
type T = ReturnType<typeof times>;

/** camera in portal-local metres */
const camLocal = (t: number, T: T) => {
  // B1 crane: low behind the bridge → up and out to the left until the art panel stands against the sky
  const kc = ease.cine(prog(t, -0.15, T.ache + 0.55));
  const ky = ease.inOut(prog(t, 0.05, T.ache + 0.45));
  const p0: V3 = [-2.4, 0.95, -15.5];
  const p1: V3 = [-8.6, 5.0, -13.6];
  let pos = mix3(p0, p1, kc);
  pos[1] = mix(p0[1], p1[1], ky);
  const t0: V3 = [0.2, 2.6, -1];
  const t1: V3 = [0.3, 7.2, 1.2];
  let tgt = mix3(t0, t1, ease.cine(prog(t, 0.1, T.ache + 0.55)));
  let mm = mix(22, 25, kc);
  // B2 push-in (continues under the photo and into the title)
  const kp = ease.out(prog(t, T.ache + 0.3, T.end + 0.3));
  pos = mix3(pos, [-6.0, 5.6, -9.6], kp * 0.92);
  tgt = mix3(tgt, [0.2, 7.0, 1.4], kp);
  mm = mix(mm, 28, kp);
  return { pos, tgt, mm };
};

const Scene3D: React.FC<{ readonly t: number; readonly T: T }> = ({ t, T }) => {
  const c = camLocal(t, T);
  const position = siteToWorld(c.pos);
  const target = siteToWorld(c.tgt);
  const px = (c.mm / 35) * H;
  const glow = 0.92 + 0.08 * Math.sin(t * 3.1) + 0.1 * prog(t, T.sval - 0.1, T.sval + 0.5, ease.out);
  return (
    <>
      <Lens position={position} target={target} mm={c.mm} near={0.02} far={9000} />
      <SvalbardLandscape
        detail={DETAIL}
        sunDir={SUN_1B}
        time={t + 20}
        sunIntensity={2.6}
        envIntensity={0.5}
        fog={0.00052}
        speck={false}
        hole
        vault={VAULT_FRAME}
        sunShadow={{ target: siteToWorld([-3, 4, 4]), half: 3.4, normalBias: 0.003, bias: -0.0002 }}
      />
      <PortalSite detail={DETAIL} glow={glow} time={t + 20} snow={1} px={px} />
      <PostFX bloom={0.85} bloomThreshold={0.82} vignette={0.5} aberration={0.0008} />
    </>
  );
};

/** title lock-up (bible §4): teal kicker chip + white headline, top zone, spring pop */
const Title: React.FC<{ readonly t: number; readonly inAt: number; readonly outAt: number }> = ({ t, inAt, outAt }) => {
  const { fps } = useVideoConfig();
  if (t < inAt - 0.02) return null;
  const f = Math.round((t - inAt) * fps);
  const chip = spring({ frame: f, fps, config: { damping: 11, stiffness: 190, mass: 0.6 } });
  const l1 = spring({ frame: f - 3, fps, config: { damping: 12, stiffness: 160, mass: 0.7 } });
  const l2 = spring({ frame: f - 6, fps, config: { damping: 12, stiffness: 160, mass: 0.7 } });
  const bar = interpolate(t, [inAt + 0.1, inAt + 0.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.out });
  const out = interpolate(t, [outAt, outAt + 0.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line = (k: number): React.CSSProperties => ({
    display: "block",
    transform: `translateY(${(1 - k) * 46}px) scale(${0.86 + 0.14 * k})`,
    transformOrigin: "left bottom",
    opacity: Math.min(1, k * 1.5),
  });
  return (
    <div style={{ position: "absolute", left: 72, right: 72, top: 205, opacity: 1 - out, transform: `translateY(${-out * 24}px)` }}>
      <div
        style={{
          display: "inline-block",
          padding: "10px 24px 13px",
          borderRadius: 999,
          background: P.vaultTeal,
          color: P.night,
          fontFamily: headFont,
          fontWeight: 800,
          fontSize: 38,
          lineHeight: 1,
          transform: `scale(${0.4 + 0.6 * chip})`,
          transformOrigin: "left center",
          opacity: Math.min(1, chip * 1.6),
          boxShadow: `0 10px 30px ${pa(P.night, 0.45)}`,
        }}
      >
        নরওয়ে · ৭৮° উত্তর
      </div>
      <div
        style={{
          marginTop: 20,
          fontFamily: headFont,
          fontWeight: 800,
          fontSize: 104,
          lineHeight: 0.98,
          letterSpacing: 1,
          color: P.snow,
          textShadow: `0 4px 30px ${pa(P.night, 0.75)}, 0 1px 3px ${pa(P.night, 0.6)}`,
        }}
      >
        <span style={line(l1)}>SVALBARD GLOBAL</span>
        <span style={line(l2)}>SEED VAULT</span>
      </div>
      <div style={{ marginTop: 18, height: 6, width: 260 * bar, borderRadius: 3, background: P.vaultTeal, boxShadow: `0 0 18px ${pa(P.vaultTeal, 0.6)}` }} />
    </div>
  );
};

export const S1B: React.FC<{ readonly a: number }> = ({ a }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const T = times(a);
  const photoIn = T.ache + 0.24;
  const photoOut = T.global + 0.2;
  return (
    <AbsoluteFill style={{ background: P.night }}>
      <Stage background={P.night}>
        <Scene3D t={t} T={T} />
      </Stage>
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <PhotoCard
          src="svalbard/img/entrance_feb2025.jpg"
          t={t}
          inAt={photoIn}
          outAt={photoOut}
          credit="ছবি: Michael Major / Crop Trust · CC BY-SA 2.0"
          width={920}
          cy={820}
          aspect={1.5}
        />
        <Title t={t} inAt={T.sid - 0.06} outAt={T.end - 0.16} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** SFX for 1B (≤2, bible §5), in part seconds: wind ambience + gust under the crane, soft shimmer as the title lands */
export const s1bCues = (a: number) => {
  const T = times(a);
  return [
    { t: a - 0.05, src: SV("wind"), vol: 0.45 },
    { t: a + T.sid - 0.12, src: "nvidia/sfx/shimmer.wav", vol: 0.32 },
  ];
};
