/**
 * S01 + S02: Hook (~9.2s), VO "hook". Site model: src/three/Plant.tsx (layout from satellite imagery).
 *
 *  S01 0.0 → CUT  Dusk drone over the Padma (west of the site) pushing in toward the towers and units.
 *                 "রূপপুর" title; "আগুন ✕" on আগুন, "কয়লা ✕" on কয়লাও
 *  S02 CUT → end  Hard cut to an 85 mm telephoto on a tower mouth with rising steam; counter
 *                 ০ → ২৪০০ মেগাওয়াট lands on "মেগাওয়াট"
 */
import { AbsoluteFill, interpolate, useVideoConfig } from "remotion";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { clamp, ease, handheld, mix3, prog, useSeconds } from "../kit/time";
import { VO_LEAD, shotDuration, wordAt } from "../kit/vo";
import { RooppurPlant, TOWERS, TOWER_H } from "../three/Plant";
import { C, bodyFont, headFont } from "../theme";
import { Pop } from "../ui";

export const S01_DURATION = shotDuration("hook", 0.5);
const CUT = wordAt("hook", "তবুও") - 0.15;
const T = {
  title: 0.3,
  fire: wordAt("hook", "আগুন"),
  coal: wordAt("hook", "কয়লাও"),
  countFrom: wordAt("hook", "দুই"),
  countTo: wordAt("hook", "মেগাওয়াট"),
};
void VO_LEAD;

const World: React.FC = () => {
  const t = useSeconds();
  const [tx, tz] = TOWERS[1];

  const a = prog(t, 0, CUT, ease.cine);
  const wide = mix3([-1450, 360, 780], [-1180, 270, 600], a);
  const wideTarget = mix3([-180, 60, 60], [-150, 75, 40], a);
  const b = prog(t, CUT, S01_DURATION, ease.cine);
  const tele = mix3([-1150, 150, 520], [-1120, 160, 505], b);
  const teleTarget = mix3([tx, TOWER_H + 20, tz], [tx + 4, TOWER_H + 36, tz], b);
  const isWide = t < CUT;
  const hh = handheld(t, isWide ? 1.2 : 0.5, 4);
  const pos = isWide ? wide : tele;
  const target = isWide ? wideTarget : teleTarget;
  const focus = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);

  return (
    <>
      <Lighting hdri={HDRI.dusk} intensity={0.9} background rotation={2.2} />
      <fog attach="fog" args={["#d6a27c", 1100, 6500]} />
      <directionalLight
        position={[-1100, 420, 500]}
        intensity={3.2}
        color="#ffbf80"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0003}
        shadow-camera-left={-1000}
        shadow-camera-right={1000}
        shadow-camera-top={1000}
        shadow-camera-bottom={-1000}
        shadow-camera-far={4000}
      />
      <hemisphereLight args={["#9fb8e8", "#4d3e2c", 0.45]} />

      <Lens mm={isWide ? 28 : 85} position={[pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]]} target={target} near={1} far={14000} />

      <RooppurPlant t={t} />

      <PostFX focus={focus} focusRange={isWide ? 2200 : 260} bokeh={isWide ? 1.2 : 2.5} bloom={0.45} bloomThreshold={0.88} />
    </>
  );
};

const Strike: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const t = useSeconds();
  const p = prog(t, at, at + 0.25, ease.out);
  const line = prog(t, at + 0.2, at + 0.45, ease.out);
  const out = prog(t, CUT - 0.3, CUT);
  return (
    <div
      style={{
        position: "relative",
        fontFamily: headFont,
        fontWeight: 800,
        fontSize: 92,
        color: C.ink,
        opacity: p * (1 - out),
        scale: interpolate(p, [0, 1], [0.8, 1]),
        WebkitTextStroke: "8px rgba(0,0,0,0.55)",
        paintOrder: "stroke fill",
        textShadow: "0 6px 24px rgba(0,0,0,0.6)",
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          left: -10,
          right: -10,
          top: "52%",
          height: 12,
          borderRadius: 6,
          background: C.orange,
          boxShadow: `0 0 18px ${C.orange}`,
          scale: `${line} 1`,
          transformOrigin: "left center",
        }}
      />
    </div>
  );
};

export const S01Hook: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = useSeconds();
  const f = (s: number) => Math.round(s * fps);
  const count = Math.round(interpolate(t, [T.countFrom, T.countTo], [0, 2400], { ...clamp, easing: ease.out }));
  const countIn = prog(t, T.countFrom - 0.3, T.countFrom);
  const bn = (n: number) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#1a2238">
        <World />
      </Stage>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200 }}>
        <Pop at={f(T.title)} until={f(CUT - 0.3)} size={170} color={C.amber} glow>
          রূপপুর
        </Pop>
        <div style={{ display: "flex", gap: 44, marginTop: 24 }}>
          <Strike at={T.fire}>আগুন</Strike>
          <Strike at={T.coal}>কয়লা</Strike>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, opacity: countIn }}>
        <div
          style={{
            fontFamily: headFont,
            fontWeight: 800,
            fontSize: 190,
            lineHeight: 1,
            color: C.amber,
            WebkitTextStroke: "8px rgba(0,0,0,0.5)",
            paintOrder: "stroke fill",
            textShadow: `0 0 40px ${C.amber}77, 0 8px 30px rgba(0,0,0,0.6)`,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {bn(count)}
        </div>
        <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 64, color: C.ink, textShadow: "0 4px 20px rgba(0,0,0,0.7)" }}>
          মেগাওয়াট বিদ্যুৎ
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
