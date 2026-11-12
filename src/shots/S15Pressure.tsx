/**
 * S15: Why the primary water does not boil (VO "pressure"). Vertical split:
 *  - Top: glass beaker on a hot plate at normal pressure, boiling at 100 °C (bubbles + steam)
 *  - Bottom: cut-away pressurised primary pipe at ~330 °C, perfectly still, no bubbles
 *  - "কিন্তু": bottom chip; "একশো": gauge "১৬.২ MPa ≈ ~১৬০ গুণ"; "ফুটতেই": Pop "তবুও পানি ফোটে না!"
 * Pressure: 16.2 MPa ≈ 160 atm (VVER-1200 primary circuit).
 */
import { useMemo } from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix3, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { C } from "../theme";
import { Chip, Pop } from "../ui";
import { Gauge, Glow, Particles, bn, useGlowTex, useSteel } from "./partsB";

export const S15_DURATION = shotDuration("pressure");

const T = {
  boil: wordAt("pressure", "ফুটে"),
  but: wordAt("pressure", "কিন্তু"),
  gauge: wordAt("pressure", "একশো"),
  never: wordAt("pressure", "ফুটতেই"),
};

const BEAKER_Y = 1.3;
const PIPE_Y = -0.05;

const Beaker: React.FC<{ t: number }> = ({ t }) => {
  const steel = useSteel("#3a3d42", 0.5);
  const glow = useGlowTex();
  const bubbles = useMemo(
    () =>
      new Array(70).fill(0).map((_, i) => ({
        x: (random(`bx${i}`) - 0.5) * 0.6,
        z: (random(`bz${i}`) - 0.5) * 0.6,
        ph: random(`bp${i}`),
        sp: 0.6 + random(`bs${i}`) * 0.6,
        s: 0.012 + random(`bsz${i}`) * 0.02,
      })),
    [],
  );
  const steamPlace = (i: number, out: THREE.Vector3) => {
    const age = (t * 0.5 + random(`sa${i}`)) % 1;
    out.set((random(`sx${i}`) - 0.5) * 0.5 + age * 0.15, 0.42 + age * 1.1, (random(`sz${i}`) - 0.5) * 0.4);
    return true;
  };
  const level = 0.34;
  return (
    <group position={[0, BEAKER_Y, 0]}>
      {/* Hot plate */}
      <mesh material={steel} position={[0, -0.56, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.12, 1.1]} />
      </mesh>
      <mesh position={[0, -0.495, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.25, 0.42, 64]} />
        <meshStandardMaterial color="#401206" emissive="#ff4a10" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      {/* Glass beaker (open top) + water */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.9, 64, 1, true]} />
        <meshPhysicalMaterial color="#dff3ff" transparent opacity={0.16} roughness={0.04} metalness={0} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.49, 0]}>
        <cylinderGeometry args={[0.46, 0.46, 0.015, 64]} />
        <meshPhysicalMaterial color="#dff3ff" transparent opacity={0.3} roughness={0.05} />
      </mesh>
      <mesh position={[0, -0.48 + (level + 0.48) / 2 - 0.24, 0]}>
        <cylinderGeometry args={[0.445, 0.445, level + 0.0, 64]} />
        <meshPhysicalMaterial color="#7fc3ff" transparent opacity={0.28} roughness={0.08} depthWrite={false} />
      </mesh>
      {/* Bubbles: rise from the hot bottom, grow and wobble */}
      {bubbles.map((b, i) => {
        const age = (t * b.sp + b.ph) % 1;
        const y = -0.46 + age * 0.62;
        const s = b.s * (0.6 + age * 1.2);
        return (
          <mesh key={i} position={[b.x + Math.sin(t * 7 + i) * 0.015, y, b.z]} scale={s}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.55} roughness={0} clearcoat={1} />
          </mesh>
        );
      })}
      <Particles count={60} size={0.32} color="#e9eef4" opacity={0.35} additive={false} place={steamPlace} />
      <Glow tex={glow} at={[0, -0.5, 0.2]} size={1.4} color="#ff5a14" opacity={0.35} />
    </group>
  );
};

const PressurePipe: React.FC<{ calm: number }> = ({ calm }) => {
  const steel = useSteel("#a7aeb6", 0.36, [3, 1]);
  const glow = useGlowTex();
  const CUT0 = Math.PI * 0.32;
  const CUTL = Math.PI * 2 - Math.PI * 0.64;
  return (
    <group position={[0, PIPE_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh material={steel} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.42, 2.6, 96, 1, true, CUT0, CUTL]} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 2.6, 96, 1, true, CUT0, CUTL]} />
        <meshStandardMaterial color="#4c4038" metalness={0.6} roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      {[CUT0, CUT0 + CUTL].map((a, i) => (
        <mesh key={i} material={steel} position={[Math.sin(a) * 0.385, 0, Math.cos(a) * 0.385]} rotation={[0, a, 0]}>
          <boxGeometry args={[0.01, 2.6, 0.07]} />
        </mesh>
      ))}
      {/* still, very hot water */}
      <mesh>
        <cylinderGeometry args={[0.345, 0.345, 2.58, 64]} />
        <meshStandardMaterial color="#ff8a3a" emissive="#ff5a12" emissiveIntensity={0.55 + 0.25 * calm} transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {/* flanges */}
      {[-1.3, 1.3].map((y) => (
        <mesh key={y} material={steel} position={[0, y, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.12, 96, 1, false, CUT0, CUTL]} />
        </mesh>
      ))}
      <Glow tex={glow} at={[0, 0, 0.5]} size={2.6} color="#ff6a1a" opacity={0.28} />
    </group>
  );
};

const World: React.FC = () => {
  const t = useSeconds();
  const k = prog(t, 0, S15_DURATION, ease.inOut);
  const pos = mix3([0.9, 0.55, 6.6], [-0.7, 0.35, 6.0], k);
  const target: [number, number, number] = [0, 0.42, 0];
  const hh = handheld(t, 0.01, 9);
  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={0.75} rotation={1.6} />
      <directionalLight position={[3, 5, 5]} intensity={1.8} color="#fff3e6" castShadow />
      <directionalLight position={[-4, 2, -4]} intensity={1} color="#7cc8ff" />
      <Lens mm={35} position={[pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]]} target={target} near={0.05} far={60} />
      {/* dark lab backdrop */}
      <mesh position={[0, 0, -3]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0d1015" roughness={0.9} />
      </mesh>
      <Beaker t={t} />
      <PressurePipe calm={prog(t, T.but, T.but + 1)} />
      <PostFX focus={6.2} focusRange={3} bokeh={1.5} bloom={0.7} bloomThreshold={0.8} />
    </>
  );
};

export const S15Pressure: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#0d1015">
        <World />
      </Stage>

      {/* Top label (beaker) */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210 }}>
        <Chip at={f(0.3)} until={f(T.never - 0.2)} accent={C.cyan} size={40}>
          সাধারণ চাপ · {bn(100)}°C এ ফুটছে
        </Chip>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 200 }}>
        <Pop at={f(T.never)} size={104} color={C.amber} glow>
          তবুও পানি ফোটে না!
        </Pop>
      </AbsoluteFill>

      {/* Pipe label, then the pressure gauge in the same slot under the pipe */}
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1170 }}>
        <Chip at={f(T.but)} until={f(T.gauge - 0.3)} accent={C.orange} size={40}>
          রিঅ্যাক্টরের পাইপ · ~{bn(330)}°C
        </Chip>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 1135 }}>
        <Gauge at={T.gauge} value={`${bn("16.2")} MPa`} label={`≈ বায়ুমণ্ডলের ~${bn(160)} গুণ চাপ`} accent={C.amber} size={84} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
