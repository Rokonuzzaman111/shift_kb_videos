/**
 * S16: Horizontal steam generator PGV-1000MKP cutaway (VO "sg").
 * Shell: horizontal cylinder ~14 m long, Ø ~4.1 m, elliptical ends; two vertical primary
 * collectors near the middle (hot in, cold out); a bundle of horizontal tubes in the lower
 * shell carrying hot primary water (orange). Secondary water (blue) fills the shell to ~60%,
 * boils on the tubes and the steam leaves through outlet pipes on top.
 *  - "গরম": tubes heat up; "প্রাইমারি" chip
 *  - "আলাদা": secondary-water chip
 *  - "মেশে": "দুই পানি কখনো মেশে না"
 *  - "দ্বিতীয়" → "বাষ্প": boiling builds, steam rises into the outlets
 * Slow lateral track along the shell.
 */
import { useMemo } from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix3, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { C } from "../theme";
import { Chip, Pop } from "../ui";
import { ClipEnable, Particles, useSteel } from "./partsB";

export const S16_DURATION = shotDuration("sg");

const T = {
  hot: wordAt("sg", "গরম"),
  other: wordAt("sg", "আলাদা"),
  never: wordAt("sg", "মেশে"),
  second: wordAt("sg", "দ্বিতীয়"),
  steam: wordAt("sg", "বাষ্প"),
};

const L = 14;
const R = 2.05;
const LEVEL = 0.75; // secondary water level (m above axis)
const CUT0 = Math.PI * 0.3;
const CUTL = Math.PI * 2 - Math.PI * 0.6;

const World: React.FC = () => {
  const t = useSeconds();
  const steel = useSteel("#b1b7be", 0.34, [6, 2]);
  const innerSteel = useSteel("#5d636b", 0.5, [6, 2]);

  // Tube bundle: rows of horizontal tubes from each collector to the shell ends
  const tubeGeo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (const side of [-1, 1]) {
      for (let row = 0; row < 11; row++) {
        for (let col = 0; col < 9; col++) {
          const y = -1.45 + row * 0.17;
          const z = -1.3 + col * 0.16 + (row % 2) * 0.08;
          if (Math.hypot(y, z) > R - 0.35) continue;
          if (z > 0.15) continue; // keep the cut (front) half empty so the bundle reads
          const g = new THREE.CylinderGeometry(0.035, 0.035, L / 2 - 1.9, 8);
          g.rotateZ(Math.PI / 2);
          g.translate(side * (L / 4 + 0.35), y, z);
          parts.push(g);
        }
      }
    }
    return mergeGeometries(parts);
  }, []);
  const heat = prog(t, T.hot - 0.3, T.hot + 1.2, ease.out);
  const tubeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c9a07a", metalness: 0.7, roughness: 0.35, emissive: "#ff5a12" }),
    [],
  );
  tubeMat.emissiveIntensity = 0.15 + heat * 0.9;

  const clipWater = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, -1, 0), LEVEL)], []);
  const waterMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#2f86ff",
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        depthWrite: false,
        side: THREE.DoubleSide,
        clippingPlanes: clipWater,
      }),
    [clipWater],
  );

  const boil = prog(t, T.second - 0.4, T.steam, ease.inOut);
  const bubbleSeeds = useMemo(
    () =>
      new Array(500).fill(0).map((_, i) => ({
        x: (random(`x${i}`) - 0.5) * (L - 3.2),
        z: -1.3 + random(`z${i}`) * 1.4,
        y0: -1.45 + random(`y${i}`) * 1.7,
        ph: random(`p${i}`),
        sp: 0.5 + random(`s${i}`) * 0.6,
      })),
    [],
  );
  const placeBubble = (i: number, out: THREE.Vector3) => {
    const s = bubbleSeeds[i];
    if (Math.abs(s.x) < 1.6) return false; // collectors
    if (random(`on${i}`) > boil) return false;
    const age = (t * s.sp + s.ph) % 1;
    out.set(s.x + Math.sin(t * 5 + i) * 0.03, s.y0 + age * (LEVEL - s.y0), s.z);
    return true;
  };
  const placeSteam = (i: number, out: THREE.Vector3) => {
    if (random(`st${i}`) > boil) return false;
    const age = (t * 0.45 + random(`sa${i}`)) % 1;
    const outlet = i % 2 === 0 ? -3.2 : 3.2;
    const x0 = (random(`sx${i}`) - 0.5) * (L - 4);
    const k = Math.min(1, age * 1.6);
    out.set(x0 + (outlet - x0) * k * k, LEVEL + 0.1 + age * 2.6, -0.6 + (random(`sz${i}`) - 0.5) * 1.2 * (1 - k));
    return true;
  };

  const k = prog(t, 0, S16_DURATION, ease.inOut);
  const pos = mix3([-4.8, 2.4, 9.6], [3.6, 1.6, 9.0], k);
  const target = mix3([-3.4, 0.1, 0], [2.6, 0.3, 0], k);
  const hh = handheld(t, 0.02, 10);
  const focus = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);

  return (
    <>
      <ClipEnable />
      <Lighting hdri={HDRI.studio} intensity={0.6} rotation={0.4} />
      <fog attach="fog" args={["#07090d", 14, 34]} />
      <spotLight position={[2, 12, 9]} angle={0.7} penumbra={0.8} intensity={2.6} decay={0} color="#fff2e2" castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-8, 3, -6]} intensity={1} color="#7cc8ff" />
      <pointLight position={[0, -0.6, -0.4]} intensity={heat * 30} distance={10} decay={2} color="#ff7a2a" />
      <Lens mm={30} position={[pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]]} target={target} near={0.05} far={120} />

      {/* Floor + supports */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -3.1, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#25282c" roughness={0.9} />
      </mesh>
      {[-4.5, 4.5].map((x) => (
        <mesh key={x} material={innerSteel} position={[x, -2.55, 0]} castShadow>
          <boxGeometry args={[0.6, 1.1, 3.2]} />
        </mesh>
      ))}

      <group>
        {/* Shell (outer + inner skin), front cut away */}
        <mesh material={steel} rotation-z={Math.PI / 2} castShadow receiveShadow>
          <cylinderGeometry args={[R, R, L - 2, 128, 1, true, CUT0, CUTL]} />
        </mesh>
        <mesh material={innerSteel} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[R - 0.12, R - 0.12, L - 2, 128, 1, true, CUT0, CUTL]} />
        </mesh>
        {/* Elliptical ends */}
        {[-1, 1].map((s) => (
          <mesh key={s} material={steel} position={[s * (L / 2 - 1), 0, 0]} scale={[0.5, 1, 1]}>
            <sphereGeometry args={[R, 96, 48, Math.PI / 2 + CUT0, CUTL, 0, Math.PI]} />
          </mesh>
        ))}
        {/* Secondary water inside the shell up to LEVEL */}
        <mesh material={waterMat} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[R - 0.14, R - 0.14, L - 2.1, 96, 1, false, CUT0, CUTL]} />
        </mesh>
        <mesh position={[0, LEVEL, -0.3]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[L - 2.2, 2.8]} />
          <meshPhysicalMaterial color="#5aa6ff" transparent opacity={0.35} roughness={0.05} clearcoat={1} depthWrite={false} />
        </mesh>

        {/* Tube bundle (hot primary water) */}
        <mesh geometry={tubeGeo} material={tubeMat} />

        {/* Primary collectors: hot (left) and cold (right), rising through the shell */}
        {[
          { x: -0.9, c: "#ff5a12", k: 1 },
          { x: 0.9, c: "#ff8a3a", k: 0.45 },
        ].map((col) => (
          <mesh key={col.x} position={[col.x, -0.1, -0.35]}>
            <cylinderGeometry args={[0.42, 0.42, 5.6, 48]} />
            <meshStandardMaterial color="#9a8f86" metalness={0.75} roughness={0.35} emissive={col.c} emissiveIntensity={heat * 0.5 * col.k} />
          </mesh>
        ))}

        {/* Steam outlet pipes on top */}
        {[-3.2, 3.2].map((x) => (
          <mesh key={x} material={steel} position={[x, R + 1.1, -0.6]}>
            <cylinderGeometry args={[0.32, 0.32, 2.4, 48]} />
          </mesh>
        ))}
      </group>

      <Particles count={500} size={0.07} color="#e6f4ff" opacity={0.9} additive={false} place={placeBubble} />
      <Particles count={260} size={0.6} color="#f4f7fa" opacity={0.18} additive={false} place={placeSteam} />

      <PostFX focus={focus} focusRange={6} bokeh={2} bloom={0.7} bloomThreshold={0.8} />
    </>
  );
};

export const S16SteamGen: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#07090d">
        <World />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200, gap: 16 }}>
        <Chip at={f(0.3)} until={f(T.never - 0.2)} accent={C.ink} size={40}>
          স্টিম জেনারেটর · PGV-1000MKP
        </Chip>
        <div style={{ display: "flex", gap: 16 }}>
          <Chip at={f(T.hot)} until={f(T.never - 0.2)} accent={C.orange} size={36}>
            প্রাইমারি পানি
          </Chip>
          <Chip at={f(T.other)} until={f(T.never - 0.2)} accent={C.cyan} size={36}>
            সেকেন্ডারি পানি
          </Chip>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210, gap: 18 }}>
        <Chip at={f(T.never)} accent={C.cyan} size={46}>
          দুই পানি কখনো মেশে না
        </Chip>
        <Pop at={f(T.steam)} size={120} color="#eaf4ff" glow>
          বাষ্প
        </Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
