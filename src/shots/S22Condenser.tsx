/**
 * S22: Where the leftover heat goes, VO "condenser".
 * Out-of-focus plant at dusk behind an animated flow diagram:
 * turbine → condenser (steam becomes water again, on "ঠান্ডা") → warm cooling water up the tower →
 * heat leaves as vapour (on "উড়ে"). Hot = orange, cold = blue; dashes flow along the pipes.
 */
import { AbsoluteFill } from "remotion";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { RooppurPlant, TOWERS } from "../three/Plant";
import { C, bodyFont } from "../theme";

export const S22_DURATION = shotDuration("condenser");
const T = {
  turbine: wordAt("condenser", "টারবাইন"),
  cool: wordAt("condenser", "ঠান্ডা"),
  water: wordAt("condenser", "পানি"),
  heat: wordAt("condenser", "বাড়তি"),
  fly: wordAt("condenser", "উড়ে"),
};

const World: React.FC = () => {
  const t = useSeconds();
  const [x, z] = TOWERS[1];
  return (
    <>
      <Lighting hdri={HDRI.dusk} intensity={0.85} background rotation={2.2} />
      <fog attach="fog" args={["#d6a27c", 900, 6000]} />
      <directionalLight position={[-1100, 420, 500]} intensity={3.0} color="#ffbf80" />
      <hemisphereLight args={["#9fb8e8", "#4d3e2c", 0.5]} />
      <Lens mm={35} position={[x - 760 + t * 6, 140, z + 620]} target={[x + 80, 110, z - 40]} near={1} far={14000} />
      <RooppurPlant t={t + 60} />
      <PostFX focus={120} focusRange={40} bokeh={6} bloom={0.35} bloomThreshold={0.9} vignette={0.6} />
    </>
  );
};

const Node: React.FC<{ x: number; y: number; at: number; label: string; color: string; w?: number }> = ({ x, y, at, label, color, w = 300 }) => {
  const t = useSeconds();
  const p = prog(t, at, at + 0.35, ease.out);
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - 56,
        width: w,
        height: 112,
        borderRadius: 26,
        background: "rgba(8,12,22,0.78)",
        border: `4px solid ${color}`,
        boxShadow: `0 0 26px ${color}55`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: bodyFont,
        fontWeight: 700,
        fontSize: 44,
        color: C.ink,
        opacity: p,
        scale: 0.85 + 0.15 * p,
      }}
    >
      {label}
    </div>
  );
};

export const S22Condenser: React.FC = () => {
  const t = useSeconds();
  const flow = (at: number) => prog(t, at, at + 0.6, ease.out);
  const dash = -t * 160;
  const pipe = (d: string, color: string, at: number) => (
    <g opacity={flow(at)}>
      <path d={d} stroke={color} strokeOpacity={0.25} strokeWidth={26} fill="none" strokeLinecap="round" />
      <path d={d} stroke={color} strokeWidth={10} fill="none" strokeLinecap="round" strokeDasharray="34 26" strokeDashoffset={dash} />
    </g>
  );
  const up = prog(t, T.fly, T.fly + 1.4, ease.out);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#1a2238">
        <World />
      </Stage>
      <AbsoluteFill>
        <svg width={1080} height={1920} style={{ position: "absolute" }}>
          {pipe("M 300 520 L 300 760", C.orange, T.turbine + 0.3)}
          {pipe("M 380 880 C 560 880 640 880 760 760 L 760 560", C.orange, T.water)}
          {pipe("M 760 620 L 760 970", C.cyan, T.heat)}
          {pipe("M 580 1030 C 460 1030 400 1000 380 940", C.cyan, T.heat + 0.2)}
          {[0, 1, 2, 3, 4].map((k) => (
            <circle
              key={k}
              cx={760 + Math.sin(t * 2 + k) * 30}
              cy={440 - up * (120 + k * 40) - ((t * 60 + k * 50) % 120) * up}
              r={26 + k * 6}
              fill="#ffffff"
              opacity={0.28 * up}
            />
          ))}
        </svg>
        <Node x={300} y={460} at={T.turbine} label="টারবাইন" color={C.amber} />
        <Node x={300} y={880} at={T.cool} label="কনডেনসার" color={C.cyan} />
        <Node x={760} y={500} at={T.heat} label="কুলিং টাওয়ার" color={C.orange} w={340} />
        <Node x={760} y={1030} at={T.heat} label="ঠান্ডা পানি ফেরত" color={C.cyan} w={360} />
        <div
          style={{
            position: "absolute",
            top: 250,
            width: "100%",
            textAlign: "center",
            fontFamily: bodyFont,
            fontWeight: 700,
            fontSize: 52,
            color: C.ink,
            opacity: up,
            textShadow: "0 4px 20px rgba(0,0,0,0.7)",
          }}
        >
          বাড়তি তাপ → আকাশে
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
