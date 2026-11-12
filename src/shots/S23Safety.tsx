/**
 * S23: Reactor building X-ray (VO "safety"). Units: metres.
 * Real dimensions: outer containment Ø ~50 m, 65.4 m to the dome top; inner (prestressed)
 * containment dome base Ø 42.8 m; reactor pressure vessel Ø 4.57 m × ~11 m. PHRS on top:
 * 8 air heat-exchanger ducts + outlet header (74.85 m).
 *
 * Beats:
 *  start                 Building orbit; walls closed
 *  "দুই"                 Outer shell opens (wedge peels away) → chip "বাইরের খোলস"
 *  "মোটা"                Inner shell opens → chip "ভেতরের খোলস"
 *  "খোলস"                Vessel lights up → chip "চুল্লি"
 *  "প্রাকৃতিকভাবে"        Passive heat removal: cool air enters the 8 ducts, rises, leaves warm
 *                        through the top header. Chip "প্যাসিভ কুলিং · বিদ্যুৎ ছাড়াই"
 */
import { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HDRI, Lighting, usePBR } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { softSprite } from "../three/textures";
import { C } from "../theme";
import { Chip } from "../ui";

export const S23_DURATION = shotDuration("safety");

const T = {
  outer: wordAt("safety", "দুই"),
  inner: wordAt("safety", "মোটা"),
  vessel: wordAt("safety", "খোলস"),
  passive: wordAt("safety", "প্রাকৃতিকভাবে"),
};

/** Closed wall+dome profile (thickness th) for a lathe: outer up, dome over, inner back down. */
const shellProfile = (R: number, wallH: number, domeK: number, th: number) => {
  const pts: THREE.Vector2[] = [];
  const N = 24;
  pts.push(new THREE.Vector2(R - th, 0));
  pts.push(new THREE.Vector2(R, 0));
  pts.push(new THREE.Vector2(R, wallH));
  for (let i = 1; i <= N; i++) {
    const a = (i / N) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0.001, Math.cos(a) * R), wallH + Math.sin(a) * R * domeK));
  }
  for (let i = N; i >= 0; i--) {
    const a = (i / N) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0.001, Math.cos(a) * (R - th)), wallH + Math.sin(a) * (R - th) * domeK));
  }
  return pts;
};

/** Cutaway shell: lathe with an open wedge + concrete cap faces on both cut planes. */
const Shell: React.FC<{
  profile: THREE.Vector2[];
  open: number; // radians removed, centred on +z (camera side)
  mat: THREE.Material;
  capMat: THREE.Material;
}> = ({ profile, open, mat, capMat }) => {
  const shape = useMemo(() => new THREE.Shape(profile), [profile]);
  const o = Math.max(0.0001, open);
  const phiStart = o / 2; // lathe phi 0 = +z
  const phiLen = Math.PI * 2 - o;
  return (
    <group>
      <mesh material={mat} castShadow receiveShadow>
        <latheGeometry args={[profile, 160, phiStart, phiLen]} />
      </mesh>
      {open > 0.01
        ? [phiStart, phiStart + phiLen].map((phi, i) => (
            <mesh key={i} material={capMat} rotation={[0, phi - Math.PI / 2, 0]}>
              <shapeGeometry args={[shape]} />
            </mesh>
          ))
        : null}
    </group>
  );
};

const World: React.FC = () => {
  const t = useSeconds();
  const concrete = usePBR("concrete_wall_008", [6, 3]);
  const steelTex = usePBR("metal_plate", [2, 2]);
  const glow = useMemo(() => softSprite("rgba(255,255,255,1)"), []);

  const outerMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d9d4c9",
        map: concrete.map,
        normalMap: concrete.normalMap,
        roughnessMap: concrete.roughnessMap,
        side: THREE.DoubleSide,
      }),
    [concrete],
  );
  const innerMat = useMemo(() => {
    const m = outerMat.clone();
    m.color.set("#b9c2c9");
    return m;
  }, [outerMat]);
  const capMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#a7a196", roughness: 0.95, normalMap: concrete.normalMap, side: THREE.DoubleSide }),
    [concrete],
  );
  const steel = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#9aa2aa", metalness: 1, roughness: 0.3, normalMap: steelTex.normalMap, normalScale: new THREE.Vector2(0.2, 0.2) }),
    [steelTex],
  );
  const vesselMat = useMemo(() => {
    const m = steel.clone();
    m.emissive = new THREE.Color("#ff7a2a");
    return m;
  }, [steel]);

  const outerProfile = useMemo(() => shellProfile(25, 45, 0.82, 1.2), []);
  const innerProfile = useMemo(() => shellProfile(21.4, 41, 0.82, 1.0), []);

  const outerOpen = prog(t, T.outer, T.outer + 1.2, ease.inOut) * Math.PI * 0.85;
  const innerOpen = prog(t, T.inner, T.inner + 1.2, ease.inOut) * Math.PI * 0.75;
  const vesselOn = prog(t, T.vessel, T.vessel + 0.6, ease.out);
  const passive = prog(t, T.passive, T.passive + 0.6, ease.out);
  vesselMat.emissiveIntensity = vesselOn * 0.35;

  // Camera: slow orbit + rise toward the dome when the passive system is shown
  const k = prog(t, 0, S23_DURATION, ease.inOut);
  const orbit = mix(-0.35, 0.3, k);
  const dist = mix(150, 125, k);
  const hh = handheld(t, 0.15, 9);
  const camY = mix(55, 80, prog(t, T.passive - 0.5, T.passive + 1.5, ease.cine));
  const pos: [number, number, number] = [Math.sin(orbit) * dist + hh[0], camY + hh[1], Math.cos(orbit) * dist + hh[2]];
  const target: [number, number, number] = [0, mix(30, 48, prog(t, T.passive - 0.5, T.passive + 1.5, ease.cine)), 0];
  const focus = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);

  // PHRS air streams: 8 ducts around the dome crown, 5 parcels each, cool (blue) in → warm (orange) out
  const ducts = new Array(8).fill(0).map((_, i) => (i / 8) * Math.PI * 2);
  const parcels: { p: [number, number, number]; c: string; o: number }[] = [];
  if (passive > 0) {
    ducts.forEach((a, i) => {
      for (let j = 0; j < 5; j++) {
        const u = (t * 0.45 + j / 5 + i * 0.13) % 1;
        const r = mix(21, 10, u);
        const y = mix(56, 76, u);
        const col = u < 0.5 ? "#6fc3ff" : "#ff9a4a";
        parcels.push({ p: [Math.cos(a) * r, y, Math.sin(a) * r], c: col, o: passive * Math.sin(u * Math.PI) * 0.8 });
      }
    });
  }

  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={0.65} rotation={0.8} />
      <directionalLight position={[120, 180, 140]} intensity={2.4} color="#fff2e2" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-80} shadow-camera-right={80} shadow-camera-top={100} shadow-camera-bottom={-20} />
      <directionalLight position={[-140, 60, -100]} intensity={1.1} color="#7fc8ff" />
      <pointLight position={[0, 16, 0]} intensity={vesselOn * 400} distance={40} decay={2} color="#ff9a4a" />

      <Lens mm={35} position={pos} target={target} near={0.5} far={2000} />

      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#2b2e33" roughness={0.9} />
      </mesh>

      {/* Outer containment (reinforced concrete) */}
      <Shell profile={outerProfile} open={outerOpen} mat={outerMat} capMat={capMat} />
      {/* Inner containment (prestressed concrete with steel liner) */}
      <Shell profile={innerProfile} open={innerOpen} mat={innerMat} capMat={capMat} />

      {/* Reactor pit + pressure vessel (Ø 4.57 m × ~11 m) with CRDM nozzles on the head */}
      <mesh position={[0, 6, 0]} material={capMat}>
        <cylinderGeometry args={[6.5, 7, 12, 64]} />
      </mesh>
      <group position={[0, 14, 0]}>
        <mesh material={vesselMat}>
          <cylinderGeometry args={[2.3, 2.3, 9, 64]} />
        </mesh>
        <mesh material={vesselMat} position={[0, -4.5, 0]} rotation={[Math.PI, 0, 0]}>
          <sphereGeometry args={[2.3, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh material={steel} position={[0, 4.5, 0]}>
          <sphereGeometry args={[2.3, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {new Array(19).fill(0).map((_, i) => {
          const a = (i / 19) * Math.PI * 2 * 3;
          const r = (i / 19) * 1.7;
          return (
            <mesh key={i} material={steel} position={[Math.cos(a) * r, 7.6, Math.sin(a) * r]}>
              <cylinderGeometry args={[0.12, 0.12, 3.2, 12]} />
            </mesh>
          );
        })}
      </group>
      <sprite position={[0, 14, 0]} scale={[16, 16, 1]}>
        <spriteMaterial map={glow} color="#ff8a3a" transparent opacity={vesselOn * 0.45} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>

      {/* PHRS heat-exchanger ducts + outlet header on the dome */}
      {ducts.map((a, i) => (
        <mesh key={i} material={steel} position={[Math.cos(a) * 16, 62, Math.sin(a) * 16]} rotation={[0, -a, 0]} castShadow>
          <boxGeometry args={[4.5, 12, 7]} />
        </mesh>
      ))}
      <mesh material={steel} position={[0, 69.5, 0]}>
        <cylinderGeometry args={[11, 13, 6, 64]} />
      </mesh>
      <mesh material={steel} position={[0, 74.5, 0]}>
        <cylinderGeometry args={[16, 12, 0.7, 64]} />
      </mesh>
      {parcels.map((q, i) => (
        <sprite key={i} position={q.p} scale={[5, 5, 1]}>
          <spriteMaterial map={glow} color={q.c} transparent opacity={q.o} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}

      <PostFX focus={focus} focusRange={60} bokeh={2} bloom={0.6} bloomThreshold={0.82} />
    </>
  );
};

export const S23Safety: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#0a0c11">
        <World />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210, gap: 16 }}>
        <Chip at={f(T.outer + 0.3)} until={f(T.passive - 0.3)} accent="#d9d4c9" size={42}>
          বাইরের খোলস
        </Chip>
        <Chip at={f(T.inner + 0.3)} until={f(T.passive - 0.3)} accent="#b9c2c9" size={42}>
          ভেতরের খোলস
        </Chip>
        <Chip at={f(T.vessel + 0.2)} until={f(T.passive - 0.3)} accent={C.orange} size={42}>
          চুল্লি
        </Chip>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210 }}>
        <Chip at={f(T.passive + 0.2)} accent={C.cyan} size={46}>
          প্যাসিভ কুলিং · বিদ্যুৎ ছাড়াই
        </Chip>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
