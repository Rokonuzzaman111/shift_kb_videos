/**
 * S25 + S26: Ending, VO "ending".
 *  S25: night over the site, lights on. Big pull-out and climb: plant → Padma → the countryside's
 *       lights (on "আলো" a warm wave of light rolls outward across the land).
 *  S26: last 1.2 s: match back to the S01 opening framing (dusk) so the reel loops,
 *       with the next-episode card.
 */
import { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, random } from "remotion";
import * as THREE from "three";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, mix, mix3, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { RooppurPlant } from "../three/Plant";
import { softSprite } from "../three/textures";
import { C, bodyFont, headFont } from "../theme";

export const S25_DURATION = shotDuration("ending", 1.2);
const T = {
  light: wordAt("ending", "আলো"),
  home: wordAt("ending", "ঘর"),
  loop: shotDuration("ending", 1.2) - 1.2,
};

/** Village/town light points scattered over the land; they switch on as a wave from the plant. */
const LandLights: React.FC<{ wave: number }> = ({ wave }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const pts = useMemo(
    () =>
      new Array(1600).fill(0).map((_, i) => {
        // clustered settlements
        const cx = -2000 + random(`cx${i % 60}`) * 9000;
        const cz = -6000 + random(`cz${i % 60}`) * 9000;
        const x = cx + (random(`lx${i}`) - 0.5) * 500;
        const z = cz + (random(`lz${i}`) - 0.5) * 500;
        return { x, z, d: Math.hypot(x, z), s: 4 + random(`ls${i}`) * 5 };
      }).filter((p) => p.x > -800),
    [],
  );
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffc070", toneMapped: false }), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const M = new THREE.Matrix4();
    pts.forEach((p, i) => {
      const on = Math.min(1, Math.max(0, (wave * 9000 - p.d) / 600));
      M.compose(new THREE.Vector3(p.x, 3, p.z), new THREE.Quaternion(), new THREE.Vector3(p.s * on, p.s * on, p.s * on));
      m.setMatrixAt(i, M);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, mat, pts.length]}>
      <sphereGeometry args={[1, 8, 6]} />
    </instancedMesh>
  );
};

const World: React.FC = () => {
  const t = useSeconds();
  const glow = useMemo(() => softSprite("rgba(255,200,130,1)"), []);
  const looping = t >= T.loop;
  const k = prog(t, 0, T.loop, ease.cine);
  const wave = prog(t, T.light - 0.3, T.home + 0.8, ease.inOut);

  // night pull-out: low over the units → high above the river, looking east over the land
  const night = mix3([-420, 160, 360], [-3800, 2600, 2600], Math.pow(k, 1.4));
  const nightTarget = mix3([-60, 40, 0], [600, 0, -800], k);
  // loop frame = S01 opening framing
  const pos = looping ? ([-1450, 360, 780] as const) : night;
  const target = looping ? ([-180, 60, 60] as const) : nightTarget;
  const focus = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);

  return (
    <>
      <Lighting hdri={HDRI.dusk} intensity={looping ? 0.9 : 0.12} background rotation={2.2} />
      <fog attach="fog" args={[looping ? "#d6a27c" : "#0b1224", 1200, looping ? 6500 : 9000]} />
      <directionalLight position={[-1100, 420, 500]} intensity={looping ? 3.2 : 0.15} color={looping ? "#ffbf80" : "#7a90c8"} />
      <hemisphereLight args={["#2a3a66", "#0a0a10", looping ? 0.45 : 0.25]} />
      <pointLight position={[-10, 120, 0]} intensity={looping ? 0 : 2.5} distance={900} decay={1} color="#ffcf90" />
      <Lens mm={looping ? 28 : mix(30, 24, k)} position={pos} target={target} near={1} far={20000} />
      <RooppurPlant t={t + 90} night={looping ? 0 : 1} steamTint={looping ? "#e9ded2" : "#8a8f9e"} />
      {!looping ? <LandLights wave={wave} /> : null}
      {!looping ? (
        <sprite position={[0, 60, 0]} scale={[700, 700, 1]}>
          <spriteMaterial map={glow} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ) : null}
      <PostFX focus={focus} focusRange={4000} bokeh={1} bloom={looping ? 0.45 : 1.1} bloomThreshold={looping ? 0.88 : 0.6} />
    </>
  );
};

export const S25Ending: React.FC = () => {
  const t = useSeconds();
  const card = prog(t, T.loop + 0.1, T.loop + 0.5, ease.out);
  const line = prog(t, T.home, T.home + 0.6, ease.out) * (1 - prog(t, T.loop - 0.3, T.loop));
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#05070d">
        <World />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 260, opacity: line }}>
        <div
          style={{
            fontFamily: headFont,
            fontWeight: 800,
            fontSize: 96,
            color: C.amber,
            textAlign: "center",
            lineHeight: 1.2,
            textShadow: `0 0 40px ${C.amber}88, 0 6px 24px rgba(0,0,0,0.7)`,
          }}
        >
          একটা পরমাণু
          <br />
          <span style={{ color: C.ink, fontSize: 72 }}>→ আপনার ঘরের আলো</span>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 640, opacity: card }}>
        <div
          style={{
            padding: "18px 34px",
            borderRadius: 999,
            background: "rgba(8,12,22,0.78)",
            border: "2px solid rgba(255,255,255,0.18)",
            fontFamily: bodyFont,
            fontWeight: 700,
            fontSize: 42,
            color: C.ink,
          }}
        >
          পরের পর্ব → পদ্মা সেতুর পিলার নদীর নিচে কীভাবে বসল
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
