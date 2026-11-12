/**
 * S12: Control rods (VO "control").
 *  - Opens on the vessel head with its control-rod drive housings ("চুল্লির মাথায়"),
 *    then tilts and dollies down to the glowing core.
 *  - "কন্ট্রোল": chip; rods partly withdrawn.
 *  - "নামালে": rods drive down → core glow and the power trace drop.
 *  - "তুললে": rods lift → power rises again.
 */
import { AbsoluteFill, useVideoConfig } from "remotion";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix, mix3, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { C } from "../theme";
import { Chip } from "../ui";
import { PowerGraph, VesselRig, fade } from "./partsB";

export const S12_DURATION = shotDuration("control");

const T = {
  head: wordAt("control", "চুল্লির"),
  chip: wordAt("control", "কন্ট্রোল"),
  eat: wordAt("control", "গিলে"),
  down: wordAt("control", "নামালে"),
  up: wordAt("control", "তুললে"),
};

const power = (tt: number) =>
  0.78 - 0.5 * prog(tt, T.down, T.down + 1.3, ease.inOut) + 0.55 * prog(tt, T.up, T.up + 1.3, ease.inOut);
const insert = (tt: number) =>
  0.25 + 0.6 * prog(tt, T.down - 0.1, T.down + 1.1, ease.inOut) - 0.65 * prog(tt, T.up - 0.1, T.up + 1.1, ease.inOut);

const World: React.FC = () => {
  const t = useSeconds();
  const a = prog(t, 0, T.eat, ease.cine);
  const b = prog(t, T.eat, S12_DURATION, ease.cine);
  const pos = mix3(mix3([4.2, 13.6, 7.5], [5.0, 9.5, 9.5], a), [4.2, 5.2, 9.8], b);
  const target = mix3(mix3([0, 11.2, 0], [0, 7.5, 0], a), [0, 4.6, 0], b);
  const hh = handheld(t, 0.03, 3);
  const focus = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);
  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={0.55} rotation={0.8} />
      <fog attach="fog" args={["#06080d", 18, 40]} />
      <spotLight
        position={[6, 18, 8]}
        angle={0.55}
        penumbra={0.8}
        intensity={3}
        decay={0}
        color="#fff1e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-8, 6, -6]} intensity={1.2} color="#7cc8ff" />
      <Lens mm={mix(30, 35, b)} position={[pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]]} target={target} near={0.05} far={200} />

      {/* Reactor cavity floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.3, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial color="#2a2d31" roughness={0.85} />
      </mesh>

      <VesselRig insert={insert(t)} power={power(t)} t={t} />

      <PostFX focus={focus} focusRange={5} bokeh={2.5} bloom={0.8} bloomThreshold={0.8} />
    </>
  );
};

export const S12Control: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = useSeconds();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#06080d">
        <World />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210, gap: 26 }}>
        <Chip at={f(T.chip)} accent={C.cyan} size={46}>
          কন্ট্রোল রড · নিউট্রন শোষক
        </Chip>
        <PowerGraph t={t} from={T.chip} power={power} label="চুল্লির শক্তি" opacity={fade(t, T.chip + 0.4, T.chip + 0.9)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
