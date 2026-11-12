/**
 * S21: Cooling tower from below (worm's eye), VO "cooling".
 * Camera stands near the air inlet of tower 3 looking up the 175 m shell into the plume;
 * slow tilt-up. Stamps "ধোঁয়া ✕" then "পানির বাষ্প ✓" on the words.
 */
import { AbsoluteFill, interpolate } from "remotion";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix3, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { RooppurPlant, TOWERS, TOWER_H } from "../three/Plant";
import { C, headFont } from "../theme";

export const S21_DURATION = shotDuration("cooling");
const T = {
  smoke: wordAt("cooling", "ধোঁয়া"),
  vapour: wordAt("cooling", "পানির"),
};

const World: React.FC = () => {
  const t = useSeconds();
  const [x, z] = TOWERS[2];
  const k = prog(t, 0, S21_DURATION, ease.cine);
  const pos = mix3([x - 150, 4, z + 160], [x - 135, 6, z + 150], k);
  const target = mix3([x, 70, z], [x + 10, TOWER_H + 120, z], k);
  const hh = handheld(t, 0.25, 7);
  return (
    <>
      <Lighting hdri={HDRI.dusk} intensity={0.95} background rotation={2.2} />
      <fog attach="fog" args={["#d6a27c", 900, 6000]} />
      <directionalLight position={[-1100, 420, 500]} intensity={3.0} color="#ffbf80" castShadow shadow-mapSize={[2048, 2048]} />
      <hemisphereLight args={["#9fb8e8", "#4d3e2c", 0.5]} />
      <Lens mm={20} position={[pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]]} target={target} near={0.5} far={14000} />
      <RooppurPlant t={t + 30} />
      <PostFX focus={260} focusRange={600} bokeh={1.2} bloom={0.4} bloomThreshold={0.9} />
    </>
  );
};

const Stamp: React.FC<{ at: number; ok: boolean; children: React.ReactNode }> = ({ at, ok, children }) => {
  const t = useSeconds();
  const p = prog(t, at, at + 0.22, ease.out);
  const col = ok ? "#3ddc84" : "#ff4d3d";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "14px 34px",
        borderRadius: 22,
        border: `6px solid ${col}`,
        background: "rgba(8,12,22,0.62)",
        fontFamily: headFont,
        fontWeight: 800,
        fontSize: 92,
        color: C.ink,
        opacity: p,
        scale: interpolate(p, [0, 1], [1.6, 1]),
        rotate: ok ? "-2deg" : "2deg",
        boxShadow: `0 0 30px ${col}66`,
      }}
    >
      <span style={{ color: col, fontSize: 100 }}>{ok ? "✓" : "✕"}</span>
      {children}
    </div>
  );
};

export const S21Cooling: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg }}>
    <Stage background="#1a2238">
      <World />
    </Stage>
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 260, gap: 34 }}>
      <Stamp at={T.smoke} ok={false}>
        ধোঁয়া
      </Stamp>
      <Stamp at={T.vapour} ok>
        পানির বাষ্প
      </Stamp>
    </AbsoluteFill>
  </AbsoluteFill>
);
