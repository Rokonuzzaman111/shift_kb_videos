/**
 * S17: Steam turbine (VO "turbine"). Rooppur: K-1200-6.8/50, full speed 3000 rpm (50 Hz).
 * Low-pressure rotor section with the upper casing removed: shaft along x, 6 blade rows
 * growing in length downstream. Steam streams along the shaft through the blades.
 *  - 0 → "টারবাইনের": steam arrives, rotor starts to turn
 *  - spin-up with a motion-blur look (ghost copies fade in with speed)
 *  - RPM counter ০ → ৩০০০ lands on "হাজার"
 * Note: on screen the rotation is slowed (a true 3000 rpm aliases at 30 fps); the counter shows the real value.
 */
import { useMemo } from "react";
import { AbsoluteFill, interpolate, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { clamp, ease, handheld, mix3, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { C, bodyFont, headFont } from "../theme";
import { Chip } from "../ui";
import { Particles, bn, useSteel } from "./partsB";

export const S17_DURATION = shotDuration("turbine");

const T = {
  hit: wordAt("turbine", "আছড়ে"),
  spin: wordAt("turbine", "টারবাইনের"),
  three: wordAt("turbine", "তিন"),
  thousand: wordAt("turbine", "হাজার"),
};

const ROWS = [
  { x: -1.8, hub: 0.62, len: 0.45, n: 72 },
  { x: -0.9, hub: 0.66, len: 0.62, n: 68 },
  { x: 0.1, hub: 0.7, len: 0.82, n: 64 },
  { x: 1.2, hub: 0.74, len: 1.05, n: 60 },
  { x: 2.4, hub: 0.78, len: 1.32, n: 56 },
  { x: 3.8, hub: 0.82, len: 1.62, n: 52 },
];

/** Visual angular speed (rad/s) and its integral, from rest to full speed. */
const W_MAX = 7.5;
const omega = (tt: number) => W_MAX * prog(tt, T.spin - 0.6, T.thousand + 0.3, ease.inOut);
const angleAt = (tt: number) => {
  let a = 0;
  const dt = 1 / 120;
  for (let s = 0; s < tt; s += dt) a += omega(s) * dt;
  return a;
};

const bladeRow = (hub: number, len: number, n: number) => {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const g = new THREE.BoxGeometry(0.14, len, 0.022, 1, 4, 1);
    // twist along the span: root at a steeper angle than the tip
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v) / len + 0.5; // 0 root .. 1 tip
      const tw = 0.9 - y * 0.6;
      const x = pos.getX(v);
      const z = pos.getZ(v);
      pos.setX(v, x * Math.cos(tw) - z * Math.sin(tw));
      pos.setZ(v, x * Math.sin(tw) + z * Math.cos(tw));
    }
    g.computeVertexNormals();
    g.translate(0, hub + len / 2, 0);
    // blade plane spans the axial (x) direction; rotate about the shaft (x axis)
    g.rotateY(Math.PI / 2);
    g.rotateX(a);
    parts.push(g);
  }
  return mergeGeometries(parts);
};

const World: React.FC = () => {
  const t = useSeconds();
  const steel = useSteel("#c2c7cc", 0.26, [2, 2]);
  const casing = useSteel("#59606a", 0.5, [4, 2]);
  const rows = useMemo(() => ROWS.map((r) => bladeRow(r.hub, r.len, r.n)), []);
  const ghostMats = useMemo(
    () =>
      [0, 1, 2].map(
        () => new THREE.MeshStandardMaterial({ color: "#c2c7cc", metalness: 0.9, roughness: 0.3, transparent: true, depthWrite: false }),
      ),
    [],
  );
  const a = angleAt(t);
  const w = omega(t);
  const blur = Math.min(1, w / W_MAX);
  ghostMats.forEach((m, i) => (m.opacity = blur * (0.32 - i * 0.08)));

  const steamOn = prog(t, T.hit - 0.6, T.hit + 0.4);
  const seeds = useMemo(
    () => new Array(600).fill(0).map((_, i) => ({ u: random(`u${i}`), r: random(`r${i}`), a: random(`a${i}`) * Math.PI * 2, sp: 0.8 + random(`s${i}`) * 0.4 })),
    [],
  );
  const placeSteam = (i: number, out: THREE.Vector3) => {
    const s = seeds[i];
    if (s.u > steamOn + 0.05) return false;
    const u = (s.u + t * 0.35 * s.sp) % 1;
    const x = -3.2 + u * 8.2;
    const k = Math.min(1, Math.max(0, (x + 1.8) / 5.6));
    const rad = 0.7 + s.r * (0.5 + k * 1.3);
    const ang = s.a + u * 2.4 + a * 0.4;
    out.set(x, Math.cos(ang) * rad, Math.sin(ang) * rad);
    return out.z < 0.4 || out.y < 0; // keep the open top mostly clear
  };

  const k = prog(t, 0, S17_DURATION, ease.inOut);
  const pos = mix3([-4.2, -0.9, 3.4], [-3.4, -0.5, 2.6], k);
  const target = mix3([1.2, 0.4, -0.2], [1.8, 0.6, -0.2], k);
  const hh = handheld(t, 0.012 + blur * 0.01, 11);
  const focus = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);

  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={0.7} rotation={1.1} />
      <fog attach="fog" args={["#07090d", 8, 22]} />
      <spotLight position={[0, 7, 4]} angle={0.7} penumbra={0.8} intensity={3} decay={0} color="#fff3e6" castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[6, 1, -4]} intensity={1.2} color="#7cc8ff" />
      <Lens mm={24} position={[pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]]} target={target} near={0.05} far={60} />

      {/* Shaft */}
      <mesh material={steel} rotation-z={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 12, 64]} />
      </mesh>
      {/* Rotor: discs + blade rows (+ ghost copies trailing the rotation for motion blur) */}
      <group rotation-x={a}>
        {ROWS.map((r, i) => (
          <group key={i} position={[r.x, 0, 0]}>
            <mesh material={steel} rotation-z={Math.PI / 2} castShadow>
              <cylinderGeometry args={[r.hub, r.hub, 0.3, 64]} />
            </mesh>
            <mesh geometry={rows[i]} material={steel} castShadow />
          </group>
        ))}
      </group>
      {ghostMats.map((m, gi) =>
        m.opacity > 0.01 ? (
          <group key={gi} rotation-x={a - (gi + 1) * 0.035 * (w / W_MAX) * 3}>
            {ROWS.map((r, i) => (
              <mesh key={i} geometry={rows[i]} material={m} position={[r.x, 0, 0]} />
            ))}
          </group>
        ) : null,
      )}
      {/* Lower casing half (upper half removed for the view) */}
      <mesh material={casing} rotation-z={Math.PI / 2} position={[1, 0, 0]} receiveShadow>
        <cylinderGeometry args={[2.75, 2.75, 7.6, 96, 1, true, Math.PI / 2, Math.PI]} />
      </mesh>
      <Particles count={600} size={0.09} color="#eef4fa" opacity={0.5 * steamOn} additive={false} place={placeSteam} />

      <PostFX focus={focus} focusRange={2.5} bokeh={2.5} bloom={0.5} bloomThreshold={0.88} />
    </>
  );
};

export const S17Turbine: React.FC = () => {
  const t = useSeconds();
  const { fps } = useVideoConfig();
  const rpm = Math.round(interpolate(t, [T.spin, T.thousand + 0.3], [0, 3000], { ...clamp, easing: ease.inOut }) / 10) * 10;
  const show = prog(t, T.spin - 0.3, T.spin + 0.1);
  const land = prog(t, T.three, T.thousand + 0.3);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#07090d">
        <World />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200, gap: 20 }}>
        <Chip at={Math.round(0.3 * fps)} accent={C.ink} size={40}>
          স্টিম টারবাইন · K-1200
        </Chip>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18, opacity: show }}>
          <div
            style={{
              fontFamily: headFont,
              fontWeight: 800,
              fontSize: 170,
              lineHeight: 1,
              color: land > 0.5 ? C.amber : C.ink,
              WebkitTextStroke: "8px rgba(0,0,0,0.5)",
              paintOrder: "stroke fill",
              textShadow: `0 0 ${20 + land * 30}px ${C.amber}66, 0 8px 30px rgba(0,0,0,0.6)`,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {bn(rpm)}
          </div>
          <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 56, color: C.ink }}>RPM</div>
        </div>
        <div style={{ fontFamily: bodyFont, fontWeight: 700, fontSize: 38, color: C.muted, opacity: land }}>
          প্রতি মিনিটে · {bn(50)} Hz বিদ্যুৎ
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
