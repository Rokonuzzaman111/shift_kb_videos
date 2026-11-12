/**
 * S11: Myth buster, bomb vs Rooppur fuel (VO "myth").
 * Facts: weapons-grade uranium ~90% U-235; Rooppur fuel "just under 5%" U-235.
 *
 *  "বোমা"     Pop "বোমা?" over a dark 3D field of slowly drifting, out-of-focus nuclei
 *  "না"       "না!" stamp
 *  "বোমায়"   Two tall glass cylinders appear: পারমাণবিক বোমা | রূপপুরের জ্বালানি
 *  "নব্বই"    Bomb cylinder fills to 90% (red glow), counter ০ → ৯০%
 *  "পাঁচ"     Rooppur cylinder fills to <5% (green glow), counter → <৫%
 *  "সম্ভব"    Stamps: bomb column "বোমা ✕" (not what Rooppur is), Rooppur column "✓ বিস্ফোরণ অসম্ভব"
 */
import { useMemo } from "react";
import { AbsoluteFill, interpolate, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { clamp, ease, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { C, bodyFont, headFont } from "../theme";
import { Pop } from "../ui";

export const S11_DURATION = shotDuration("myth");

const T = {
  bomb: wordAt("myth", "বোমা"),
  no: wordAt("myth", "না"),
  bars: wordAt("myth", "বোমায়"),
  ninety: wordAt("myth", "নব্বই"),
  five: wordAt("myth", "পাঁচ"),
  impossible: wordAt("myth", "সম্ভব"),
};

const RED = "#ff4a3a";
const GREEN = "#3ddc84";
const bn = (s: string) => s.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

const Background: React.FC = () => {
  const t = useSeconds();
  const items = useMemo(
    () =>
      new Array(14).fill(0).map((_, i) => ({
        p: new THREE.Vector3((random(`bx${i}`) - 0.5) * 9, (random(`by${i}`) - 0.5) * 16, -4 - random(`bz${i}`) * 10),
        v: new THREE.Vector3((random(`vx${i}`) - 0.5) * 0.12, (random(`vy${i}`) - 0.5) * 0.12, 0),
        r: 0.4 + random(`br${i}`) * 0.4,
        proton: random(`bp${i}`) < 0.4,
      })),
    [],
  );
  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={0.5} rotation={t * 0.02} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} color="#fff1e2" />
      <directionalLight position={[-4, -2, -3]} intensity={1} color="#58c9ff" />
      <Lens mm={50} position={[Math.sin(t * 0.05) * 0.4, 0, 8]} target={[0, 0, 0]} near={0.05} far={200} />
      {items.map((it, i) => (
        <mesh key={i} position={[it.p.x + it.v.x * t, it.p.y + it.v.y * t, it.p.z]}>
          <sphereGeometry args={[it.r, 32, 20]} />
          <meshPhysicalMaterial color={it.proton ? "#a8422e" : "#6b7784"} roughness={0.35} clearcoat={0.6} />
        </mesh>
      ))}
      {/* Focus far in front: everything behind becomes soft bokeh */}
      <PostFX focus={3} focusRange={0.5} bokeh={6} bloom={0.4} bloomThreshold={0.9} vignette={0.6} />
    </>
  );
};

const Column: React.FC<{
  label: string;
  level: number; // 0..1
  color: string;
  value: string;
  appear: number;
  stamp: string;
  stampColor: string;
  stampAt: number;
}> = ({ label, level, color, value, appear, stamp, stampColor, stampAt }) => {
  const t = useSeconds();
  const inP = prog(t, appear, appear + 0.5, ease.out);
  const st = prog(t, stampAt, stampAt + 0.25, ease.out);
  const H = 640;
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 22, opacity: inP, translate: `0px ${(1 - inP) * 60}px` }}>
      <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 42, color: C.ink, textShadow: "0 4px 18px rgba(0,0,0,0.7)" }}>{label}</div>
      <div
        style={{
          position: "relative",
          width: 230,
          height: H,
          borderRadius: 40,
          border: "3px solid rgba(220,235,255,0.35)",
          background: "linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.08))",
          boxShadow: "inset 0 0 40px rgba(160,200,255,0.12), 0 20px 60px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        {/* liquid */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: `${level * 100}%`,
            background: `linear-gradient(180deg, ${color}ee, ${color}88)`,
            boxShadow: `0 0 60px ${color}, inset 0 6px 0 rgba(255,255,255,0.35)`,
          }}
        />
        {/* glass highlight */}
        <div style={{ position: "absolute", left: 26, top: 24, bottom: 24, width: 18, borderRadius: 9, background: "rgba(255,255,255,0.18)" }} />
        {/* 90% tick */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: `${90}%`, borderTop: "2px dashed rgba(255,255,255,0.25)" }} />
      </div>
      <div style={{ fontFamily: headFont, fontWeight: 800, fontSize: 96, color, textShadow: `0 0 30px ${color}88, 0 6px 24px rgba(0,0,0,0.6)` }}>{value}</div>
      <div
        style={{
          position: "absolute",
          top: 330,
          padding: "10px 24px",
          border: `6px solid ${stampColor}`,
          borderRadius: 16,
          color: stampColor,
          fontFamily: headFont,
          fontWeight: 800,
          fontSize: 50,
          rotate: "-12deg",
          opacity: st,
          scale: interpolate(st, [0, 1], [1.8, 1]),
          background: "rgba(5,7,13,0.75)",
          whiteSpace: "nowrap",
        }}
      >
        {stamp}
      </div>
    </div>
  );
};

export const S11Myth: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = useSeconds();
  const f = (s: number) => Math.round(s * fps);
  const bombLevel = interpolate(t, [T.ninety, T.ninety + 1.2], [0, 0.9], { ...clamp, easing: ease.out });
  const rooppurLevel = interpolate(t, [T.five, T.five + 1], [0, 0.048], { ...clamp, easing: ease.out });
  const bombPct = Math.round(bombLevel * 100);
  const qOut = prog(t, T.bars - 0.3, T.bars);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#05070d">
        <Background />
      </Stage>

      {/* Opening question */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - qOut, paddingBottom: 300 }}>
        <Pop at={f(T.bomb)} size={170} color={RED} glow>
          বোমা?
        </Pop>
        <Pop at={f(T.no)} size={210} color={C.ink}>
          না!
        </Pop>
      </AbsoluteFill>

      {/* Infographic */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200 }}>
        <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 40, color: C.muted, opacity: prog(t, T.bars, T.bars + 0.5), marginBottom: 26 }}>
          ইউরেনিয়াম-২৩৫ এর পরিমাণ
        </div>
        <div style={{ display: "flex", gap: 90, position: "relative" }}>
          <Column
            label="পারমাণবিক বোমা"
            level={bombLevel}
            color={RED}
            value={`${bn(String(bombPct))}%`}
            appear={T.bars}
            stamp="বোমা ✕ রূপপুর নয়"
            stampColor={RED}
            stampAt={T.impossible}
          />
          <Column
            label="রূপপুরের জ্বালানি"
            level={rooppurLevel}
            color={GREEN}
            value={t >= T.five ? "<৫%" : "০%"}
            appear={T.bars + 0.15}
            stamp="✓ বিস্ফোরণ অসম্ভব"
            stampColor={GREEN}
            stampAt={T.impossible + 0.2}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
