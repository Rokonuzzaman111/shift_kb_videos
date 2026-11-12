/**
 * S13: SCRAM (VO "scram"). Three hard cuts:
 *  1. 0 → "সব"         Vessel head under a sweeping red alarm beacon ("বিপদের সংকেত")
 *  2. "সব" → +2.4 s    Close on the core: every rod falls under gravity, glow collapses
 *  3. rest             Slow pull-out as the core goes dark; chip on "শান্ত"
 */
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { clamp, ease, handheld, mix3, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { C } from "../theme";
import { Chip, Pop } from "../ui";
import { VesselRig } from "./partsB";

export const S13_DURATION = shotDuration("scram");

const T = {
  alarm: wordAt("scram", "বিপদের"),
  drop: wordAt("scram", "সব"),
  calm: wordAt("scram", "শান্ত"),
};
const CUT2 = T.drop - 0.1;
const CUT3 = T.drop + 2.4;

// Gravity drop: rods start 75 % withdrawn and fall into the core in ~1.3 s
const insertAt = (t: number) => {
  if (t < T.drop) return 0.25;
  const d = t - T.drop;
  return Math.min(1, 0.25 + 0.75 * Math.min(1, (d * d) / 1.3 ** 2));
};
const powerAt = (t: number) => {
  if (t < T.drop + 0.2) return 0.85;
  return Math.max(0.03, 0.85 * Math.exp(-(t - T.drop - 0.2) / 0.7));
};

const World: React.FC = () => {
  const t = useSeconds();
  const shot = t < CUT2 ? 1 : t < CUT3 ? 2 : 3;
  const alarm = interpolate(t, [T.alarm - 0.3, T.alarm, CUT3 + 1.5, CUT3 + 2.5], [0, 1, 1, 0.3], clamp);
  let pos: [number, number, number];
  let target: [number, number, number];
  let mm: number;
  if (shot === 1) {
    const k = prog(t, 0, CUT2, ease.cine);
    pos = mix3([3.2, 12.6, 5.2], [2.6, 12.1, 4.4], k);
    target = [0, 10.8, 0];
    mm = 40;
  } else if (shot === 2) {
    const k = prog(t, CUT2, CUT3, ease.cine);
    pos = mix3([2.6, 5.4, 5.6], [2.4, 4.9, 5.2], k);
    target = [0, 4.6, 0];
    mm = 32;
  } else {
    const k = prog(t, CUT3, S13_DURATION, ease.cine);
    pos = mix3([3.8, 6.5, 8.5], [5.5, 8.2, 12.5], k);
    target = [0, 5.6, 0];
    mm = 32;
  }
  const shake = shot === 2 ? Math.max(0, 1 - (t - T.drop - 1.2) / 0.5) * (t > T.drop + 1.1 ? 0.05 : 0) : 0;
  const hh = handheld(t, 0.025 + shake, 6);
  const focus = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);
  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={0.45} rotation={0.8} />
      <fog attach="fog" args={["#06080d", 18, 40]} />
      <spotLight position={[6, 18, 8]} angle={0.55} penumbra={0.8} intensity={2.4} decay={0} color="#fff1e2" castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-8, 6, -6]} intensity={1} color="#7cc8ff" />
      <Lens mm={mm} position={[pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]]} target={target} near={0.05} far={200} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.3, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#2a2d31" roughness={0.85} />
      </mesh>
      <VesselRig insert={insertAt(t)} power={powerAt(t)} alarm={alarm} t={t} />
      <PostFX focus={focus} focusRange={4} bokeh={2.5} bloom={0.9} bloomThreshold={0.78} />
    </>
  );
};

export const S13Scram: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = useSeconds();
  const f = (s: number) => Math.round(s * fps);
  const red = interpolate(t, [T.alarm - 0.2, T.alarm, CUT3], [0, 1, 0.4], clamp) * (0.6 + 0.4 * Math.sin(t * 9));
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#06080d">
        <World />
      </Stage>
      {/* red alarm edge pulse */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 75% 60% at 50% 50%, rgba(0,0,0,0) 55%, rgba(255,30,20,0.55) 100%)",
          opacity: red,
        }}
      />
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 220 }}>
        <Chip at={f(T.alarm)} until={f(CUT2)} accent="#ff3b2a" size={46}>
          জরুরি সংকেত: SCRAM
        </Chip>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210 }}>
        <Pop at={f(T.drop + 0.2)} until={f(CUT3 - 0.2)} size={120} color="#ff6a4a" glow>
          সব রড নিচে!
        </Pop>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 230 }}>
        <Chip at={f(T.calm)} accent={C.cyan} size={46}>
          কয়েক সেকেন্ডে শান্ত
        </Chip>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
