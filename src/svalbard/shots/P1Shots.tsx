/**
 * PART 1 shots (0–27 s). Each shot gets `a` = its start on the part timeline; L(word) = shot-local seconds of a VO word.
 * Every beat hangs off a spoken word, never a hard-coded time.
 *   A Field     "পৃথিবীর সব ফসল একদিন হারিয়ে গেলে"     golden wheat withers to ash
 *   B Blizzard  "আবার শুরু হবে এই পাহাড়ের ভেতর থেকে"  push through a snowstorm to the glowing portal
 *   C Globe     "নরওয়ের স্‌ভালবার্ড … উত্তর মেরুর কাছাকাছি" Europe → Norway → Svalbard, pole arc
 *   D Cutaway   "একটা বরফ-ঢাকা পাহাড়ের গভীরে আছে"     mountain splits, vault glows 40–60 m under rock
 *   E Title     "স্‌ভালবার্ড গ্লোবাল সিড ভল্ট"            aurora night, title card
 *   F Inside    "দরজা পেরিয়ে … সুড়ঙ্গ, … তিনটা কক্ষ"   door opens, 110 m tunnel fly-through, three vault doors
 *   G Vault     "ভেতরে মাইনাস আঠারো … চৌদ্দ লাখ"       aisle dolly between racks, −18 °C, counter
 *   H Capacity  "আর এর ধারণক্ষমতা? প্রায় পঁয়তাল্লিশ লাখ" three halls, 1 full, ghost fill, capacity bar
 */
import { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { PostFX } from "../../kit/PostFX";
import { Lens, Stage } from "../../kit/Stage";
import { handheld, mix, mix3 } from "../../kit/time";
import { S, clamp, ease, headFont, numFont } from "../theme";
import { GrainDust, SeedHeap } from "../three/Seeds";
import { AccessRoad, Portal, Terrain } from "../three/Mountain";
import { Aurora, SkyDome, Snow, Stars } from "../three/Sky";
import { Globe } from "../three/Globe";
import { CUT, Cutaway } from "../three/Cutaway";
import { Boxes, RACKS, ROOM, Racks, SteelDoor, TUNNEL_LEN, Tunnel, VAULT_DOOR_X, VaultHall3, VaultRoom, useBoxes } from "../three/Inside";
import { latLon, project, type V3 } from "../three/util";
import { atAfter } from "../vo";
import { CapacityBar, Counter, Flash, PinLabel, Tag, TitleCard, Thermo, bn } from "../ui/Hud";

export type ShotProps = { readonly a: number };

const useShot = (a: number) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = f / fps;
  const L = (w: string, n = 0) => atAfter("p1", w, a, n) - a;
  return { t, L, width, height };
};

const p = (t: number, x0: number, x1: number, e: (x: number) => number = ease.inOut) =>
  interpolate(t, [x0, x1], [0, 1], { ...clamp, easing: e });

const lerpColor = (a: string, b: string, k: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();

/* ------------------------------------------------------------------ A — macro grain heap turns to ash */
export const P1A: React.FC<ShotProps> = ({ a }) => {
  const { t, L } = useShot(a);
  const decay = p(t, L("হারিয়ে") - 0.25, L("গেলে") + 0.5, (x) => x);
  const k = p(t, 0, 2.4, ease.out);
  const hh = handheld(t, 0.006, 1);
  const cam = {
    position: [mix(-2.0, -1.2, k) + hh[0], mix(1.5, 1.2, k) + hh[1], mix(7.6, 6.0, k)] as V3,
    target: [0.2, 0.55, 0] as V3,
    mm: 50,
  };
  const dim = p(t, L("হারিয়ে"), L("গেলে") + 0.4);
  return (
    <AbsoluteFill>
      <Stage background="#07090c">
        <Lens position={cam.position} target={cam.target} mm={cam.mm} />
        <SkyDome top="#040507" mid={lerpColor("#2a1a0e", "#14161a", dim)} bottom="#050607" r={60} />
        {/* studio: warm key softbox, cool rim, low fill */}
        <spotLight position={[-3.5, 5, 4]} angle={0.55} penumbra={0.9} intensity={55 - dim * 30} color="#ffd9a6" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
        <directionalLight position={[4, 2.5, -4]} intensity={3.2} color="#9fd8ff" />
        <ambientLight intensity={0.12} />
        {/* dark tabletop */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#14110e" roughness={0.55} metalness={0.1} />
        </mesh>
        <SeedHeap decay={decay} />
        <GrainDust decay={decay} />
        <PostFX focus={Math.hypot(cam.position[0], cam.position[1] - 0.6, cam.position[2]) - 0.6} focusRange={1.1} bokeh={7} bloom={0.5} bloomThreshold={0.9} vignette={0.75} />
      </Stage>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ B — blizzard push to the portal */
export const P1B: React.FC<ShotProps> = ({ a }) => {
  const { t, L } = useShot(a);
  const k = p(t, 0, L("থেকে") + 0.4, ease.cine);
  const hh = handheld(t, 0.25, 4);
  const pos = mix3([30, 14, 95], [5, 3.6, 21], k);
  return (
    <AbsoluteFill>
      <Stage background="#7d97b0">
        <Lens position={[pos[0] + hh[0], pos[1] + hh[1], pos[2]]} target={mix3([0, 8, 0], [0, 4.2, 0], k) as V3} mm={mix(30, 38, k)} />
        <fog attach="fog" args={["#8aa3bb", 60, 700]} />
        <SkyDome top="#0d1f3d" mid="#6b88a8" bottom="#c8d6e3" />
        <hemisphereLight args={["#a9c6e6", "#b9c9d6", 0.45]} />
        <directionalLight position={[-260, 70, -40]} color="#dfe9ff" intensity={2.2} />
        <Terrain snowTint="#c3d2df" />
        <AccessRoad />
        <Portal art={0.6 + 0.4 * p(t, L("পাহাড়ের") - 0.3, L("পাহাড়ের") + 0.4)} lamp={1} />
        <Snow count={3500} size={[70, 30, 70]} center={[pos[0], pos[1], pos[2] - 25]} wind={[16, -4, 6]} px={4} />
        <PostFX bloom={1.2} bloomThreshold={0.7} vignette={0.6} />
      </Stage>
      <Flash at={0} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ C — globe: Europe → Svalbard */
const SVAL: V3 = latLon(78.2, 15.6, 1.003);
const POLE: V3 = latLon(90, 0, 1.003);
const NORWAY: V3 = latLon(62.5, 9, 1.003);

const globeCam = (k: number) => {
  const focusLat = mix(48, 78.2, k);
  const lon = mix(8, 15.6, k);
  const dist = mix(3.3, 1.55, k);
  const position = latLon(focusLat - mix(6, 14, k), lon, dist);
  const tgt = latLon(focusLat, lon, 1);
  const target = mix3([0, 0, 0], tgt, Math.min(1, k * 1.4)) as V3;
  return { position: position as V3, target, mm: 35 };
};

const PoleArc: React.FC<{ readonly draw: number }> = ({ draw }) => {
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const a = new THREE.Vector3(...SVAL).normalize();
    const b = new THREE.Vector3(...POLE).normalize();
    for (let i = 0; i <= 64; i++) {
      const v = a.clone().lerp(b, i / 64).normalize();
      v.multiplyScalar(1.004 + Math.sin((i / 64) * Math.PI) * 0.035);
      pts.push(v);
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineDashedMaterial({ color: "#5dffb0", dashSize: 0.008, gapSize: 0.006, toneMapped: false });
    const l = new THREE.Line(g, m);
    l.computeLineDistances();
    return l;
  }, []);
  line.geometry.setDrawRange(0, Math.round(65 * draw));
  return <primitive object={line} />;
};

export const P1C: React.FC<ShotProps> = ({ a }) => {
  const { t, L, width, height } = useShot(a);
  const k = p(t, 0, L("কাছাকাছি") + 0.3, ease.cine);
  const cam = globeCam(k);
  const sv = project(cam, SVAL, width, height);
  const po = project(cam, POLE, width, height);
  const no = project(cam, NORWAY, width, height);
  const hl = p(t, L("স্‌ভালবার্ড") - 0.1, L("স্‌ভালবার্ড") + 0.4);
  return (
    <AbsoluteFill>
      <Stage background="#010308">
        <Lens position={cam.position} target={cam.target} mm={cam.mm} near={0.01} far={4000} />
        <Stars count={1800} r={900} />
        <ambientLight intensity={0.25} />
        <directionalLight position={[-3, 2, 4]} intensity={2.2} color="#eaf4ff" />
        <Globe highlight={hl} />
        <PoleArc draw={p(t, L("উত্তর"), L("কাছাকাছি") + 0.2)} />
        <mesh position={POLE}>
          <coneGeometry args={[0.008, 0.05, 8]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <PostFX bloom={1.0} bloomThreshold={0.6} vignette={0.5} />
      </Stage>
      <PinLabel x={no.x} y={no.y} at={L("নরওয়ের") - 0.05} text="নরওয়ে" dx={-120} dy={120} color={S.cyan} out={L("স্‌ভালবার্ড") + 0.6} />
      <PinLabel x={sv.x} y={sv.y} at={L("স্‌ভালবার্ড")} text="স্‌ভালবার্ড" sub="দ্বীপপুঞ্জ" dx={150} dy={110} />
      {po.visible ? <PinLabel x={po.x} y={po.y} at={L("উত্তর") + 0.1} text="উত্তর মেরু" sub={`প্রায় ${bn("1,300")} কিমি দূরে`} dx={-130} dy={-90} color="#ffffff" /> : null}
      <Flash at={0} dur={0.18} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ D — mountain cutaway */
export const P1D: React.FC<ShotProps> = ({ a }) => {
  const { t, L, width, height } = useShot(a);
  const open = p(t, L("পাহাড়ের") - 0.25, L("গভীরে") + 0.35, ease.inOut);
  const tunnel = p(t, L("গভীরে"), L("আছে") + 0.1, ease.out);
  const glow = p(t, L("আছে") - 0.1, L("আছে") + 0.3, ease.out);
  const k = p(t, 0, L("আছে") + 0.4, ease.cine);
  const cam = {
    position: mix3([260, 170, 210], [10, 48, 245], k) as V3,
    target: mix3([110, 25, -20], [92, 22, 0], k) as V3,
    mm: mix(30, 42, k),
  };
  const vault = project(cam, [CUT.vaultX + 9.5, CUT.tunnelY + 1, 0], width, height);
  const rock = project(cam, [CUT.vaultX + 9.5, 36, 0], width, height);
  return (
    <AbsoluteFill>
      <Stage background="#7f9ab5">
        <Lens position={cam.position} target={cam.target} mm={cam.mm} />
        <fog attach="fog" args={["#8aa3bb", 200, 900]} />
        <SkyDome top="#0f2142" mid="#7591b0" bottom="#dbe7f1" />
        <hemisphereLight args={["#bcd5f0", "#f1f6fb", 0.8]} />
        <directionalLight position={[-120, 120, 160]} intensity={1.6} color="#e9f1ff" />
        <Cutaway open={open} glow={glow} tunnel={tunnel} />
        <Snow count={1500} size={[300, 140, 200]} center={[60, 60, 80]} wind={[14, -6, 3]} px={6} opacity={0.6} />
        <PostFX bloom={1.0} bloomThreshold={0.75} vignette={0.5} />
      </Stage>
      <PinLabel x={rock.x} y={rock.y} at={L("গভীরে") + 0.15} text="৪০–৬০ মিটার পাথর" dx={-60} dy={-170} color={S.ice} />
      <PinLabel x={vault.x} y={vault.y} at={L("আছে")} text="বীজ ভল্ট" dx={-90} dy={170} />
      <Flash at={0} dur={0.18} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ E — aurora night title */
export const P1E: React.FC<ShotProps> = ({ a }) => {
  const { t, L } = useShot(a);
  const k = p(t, 0, 2.2, ease.out);
  const pos = mix3([-10, 1.0, 17], [-5.5, 2.6, 13.5], k);
  return (
    <AbsoluteFill>
      <Stage background="#030a14">
        <Lens position={pos as V3} target={mix3([0, 7, -4], [0, 6, -6], k) as V3} mm={22} />
        <fog attach="fog" args={["#06121f", 60, 700]} />
        <SkyDome top="#01040a" mid="#08203a" bottom="#0e2238" />
        <Stars count={2200} />
        <Aurora position={[40, 60, -520]} radius={700} height={300} strength={0.9} />
        <hemisphereLight args={["#3b6ea8", "#0c1622", 0.55]} />
        <directionalLight position={[60, 80, -100]} intensity={0.6} color="#7fffd0" />
        <Terrain snowTint="#d6e6f2" />
        <AccessRoad />
        <Portal art={0.85 + 0.15 * Math.sin(t * 3)} lamp={1} />
        <Snow count={900} size={[40, 20, 40]} center={[pos[0], pos[1] + 4, pos[2] - 12]} wind={[2, -1.5, 0.5]} px={3} opacity={0.6} />
        <PostFX bloom={1.4} bloomThreshold={0.55} vignette={0.6} />
      </Stage>
      <TitleCard at={L("স্‌ভালবার্ড") - 0.05} />
      <Flash at={0} dur={0.25} color="#bfffe4" />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ F — door, tunnel, three vault doors */
export const P1F: React.FC<ShotProps> = ({ a }) => {
  const { t, L, width, height } = useShot(a);
  const open = p(t, L("দরজা") - 0.05, L("পেরিয়ে") + 0.35, ease.inOut);
  const tFly0 = L("পাহাড়ের") - 0.25;
  const tFly1 = L("তারপর") + 0.1;
  const tEnd = L("কক্ষ") + 0.2;
  void tEnd;
  // camera z: hold at the door, fly the tunnel (ease), settle in the end hall
  const z =
    t < tFly0
      ? mix(7.5, 3.5, p(t, 0, tFly0, ease.out))
      : t < tFly1
        ? mix(3.5, -TUNNEL_LEN + 6, p(t, tFly0, tFly1, ease.inOut))
        : mix(-TUNNEL_LEN + 6, -TUNNEL_LEN - 1.5, p(t, tFly1, tEnd, ease.out));
  const speed = t > tFly0 && t < tFly1 ? Math.sin(p(t, tFly0, tFly1) * Math.PI) : 0;
  const hh = handheld(t, 0.03 + speed * 0.04, 7);
  const camY = t > tFly1 ? mix(0.1, 0.9, p(t, tFly1, tEnd)) : 0.1;
  const settle = p(t, tFly1, tEnd, ease.out);
  const cam = { position: [hh[0], camY + hh[1], z] as V3, target: [0, camY * 0.8, z - 10] as V3, mm: mix(mix(26, 18, speed), 17, settle) };
  const glowAt = L("তিনটা");
  const glow: [number, number, number] = [0, 1, 2].map((i) => p(t, glowAt + i * 0.14, glowAt + i * 0.14 + 0.25, ease.out)) as [number, number, number];
  const dist = Math.max(0, Math.min(TUNNEL_LEN, 3.5 - z));
  const showDist = t > tFly0 - 0.1 && t < tFly1 + 0.4;
  return (
    <AbsoluteFill>
      <Stage background="#0a1118">
        <Lens position={cam.position} target={cam.target} mm={cam.mm} far={600} />
        <fog attach="fog" args={["#cfe6f5", 18, 110]} />
        <ambientLight intensity={0.35} color="#cfe8ff" />
        <pointLight position={[cam.position[0], cam.position[1] + 0.8, cam.position[2] - 1]} intensity={8} distance={14} decay={1.6} color="#ffffff" />
        <SteelDoor open={open} z={0} />
        <Tunnel frost={0.35} />
        <VaultHall3 glow={glow} />
        <Snow count={700} size={[6, 4, 30]} center={[0, 0.3, z - 12]} wind={[0.2, -0.3, 1.2]} px={1.6} opacity={0.5} />
        <PostFX bloom={1.1} bloomThreshold={0.7} vignette={0.55} aberration={0.0006 + speed * 0.003} />
      </Stage>
      {showDist ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 220, textAlign: "center", opacity: p(t, tFly0 - 0.1, tFly0 + 0.2) * (1 - p(t, tFly1 + 0.1, tFly1 + 0.4)) }}>
          <div style={{ fontFamily: headFont, fontWeight: 700, fontSize: 42, color: S.ice, textShadow: "0 4px 16px rgba(0,0,0,0.9)" }}>সুড়ঙ্গ</div>
          <div style={{ fontFamily: numFont, fontWeight: 900, fontSize: 140, color: S.ink, lineHeight: 1, textShadow: `0 0 30px ${S.cyan}88, 0 8px 24px rgba(0,0,0,0.9)` }}>
            {Math.round(dist)}
            <span style={{ fontSize: 70, color: S.cyan }}> m</span>
          </div>
        </div>
      ) : null}
      {[0, 1, 2].map((i) => {
        const pt = project(cam, [VAULT_DOOR_X[i], 3.6, -TUNNEL_LEN - 11.8], width, height);
        const kk = glow[i];
        if (kk <= 0) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pt.x - 60,
              top: pt.y - 150,
              width: 120,
              height: 120,
              borderRadius: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: S.panel,
              border: `4px solid ${i === 0 ? S.aurora : S.cyan}`,
              fontFamily: headFont,
              fontWeight: 800,
              fontSize: 70,
              color: S.ink,
              opacity: kk,
              scale: 0.6 + 0.4 * kk,
              boxShadow: `0 0 40px ${S.cyan}88`,
            }}
          >
            {bn(i + 1)}
          </div>
        );
      })}
      <Flash at={0} dur={0.18} />
      <Flash at={tFly1} dur={0.2} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ G — vault room aisle */
export const P1G: React.FC<ShotProps> = ({ a }) => {
  const { t, L } = useShot(a);
  const k = p(t, 0, 5.2, (x) => ease.out(x));
  const z = mix(1.5, -15, k);
  const hh = handheld(t, 0.02, 2);
  const cam = { position: [mix(0.4, -0.2, k) + hh[0], mix(-0.2, 0.7, k) + hh[1], z] as V3, target: [mix(-0.6, 0.4, k), 0.2, z - 9] as V3, mm: 20 };
  return (
    <AbsoluteFill>
      <Stage background="#0d1720">
        <Lens position={cam.position} target={cam.target} mm={cam.mm} far={200} />
        <fog attach="fog" args={["#d9ecf8", 6, 40]} />
        <ambientLight intensity={0.4} color="#d6ecff" />
        <hemisphereLight args={["#eaf6ff", "#7f96a8", 0.6]} />
        <VaultRoom />
        <Snow count={900} size={[ROOM.w, ROOM.h, 20]} center={[0, 0.6, z - 8]} wind={[0.15, -0.25, 0.1]} px={1.6} opacity={0.6} />
        <PostFX bloom={0.9} bloomThreshold={0.78} vignette={0.5} />
      </Stage>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(3,10,18,0.7), transparent 38%, transparent 62%, rgba(3,10,18,0.55))" }} />
      <Thermo at={L("মাইনাস")} x={340} y={170} />
      <Counter at={L("চৌদ্দ")} dur={1.1} to={1400000} suffix="+" label="বীজের নমুনা" top={560} />
      <Flash at={0} dur={0.2} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ H — capacity: three halls */
const HALL_GAP = 12;
const HallOutline: React.FC<{ readonly x: number; readonly glow: number; readonly color: string }> = ({ x, glow, color }) => {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(ROOM.w, ROOM.h, ROOM.l)), []);
  return (
    <group position={[x, -1.7 + ROOM.h / 2, -ROOM.l / 2 - 0.5]}>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={color} transparent opacity={0.35 + glow * 0.65} toneMapped={false} />
      </lineSegments>
      <mesh position={[0, -ROOM.h / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM.w, ROOM.l]} />
        <meshStandardMaterial color="#1a2a38" emissive={color} emissiveIntensity={0.08 + glow * 0.25} roughness={0.6} />
      </mesh>
    </group>
  );
};

export const P1H: React.FC<ShotProps> = ({ a }) => {
  const { t, L } = useShot(a);
  const full = useBoxes(RACKS, 0.93);
  const ghost = useBoxes(RACKS, 0.93, 9);
  const reveal = p(t, 0, 1.0, ease.out);
  const ghostK = p(t, L("পঁয়তাল্লিশ") - 0.05, L("জাত") + 0.3, ease.out);
  const hallsGlow = p(t, L("ধারণক্ষমতা"), L("ধারণক্ষমতা") + 0.5);
  const k = p(t, 0, 4.2, ease.out);
  const ang = mix(0.95, 0.62, k);
  const r = mix(52, 66, k);
  const cx = HALL_GAP;
  const cam = { position: [cx + Math.sin(ang) * r, mix(34, 44, k), -13 + Math.cos(ang) * r] as V3, target: [cx, -2, -13] as V3, mm: 32 };
  return (
    <AbsoluteFill>
      <Stage background="#030912">
        <Lens position={cam.position} target={cam.target} mm={cam.mm} far={800} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[30, 60, 40]} intensity={1.6} color="#e8f4ff" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -1.75, -13]}>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#06111c" roughness={0.9} />
        </mesh>
        <gridHelper args={[200, 100, "#123049", "#0b2033"]} position={[cx, -1.74, -13]} />
        {[0, 1, 2].map((i) => (
          <group key={i}>
            <HallOutline x={i * HALL_GAP} glow={i === 0 ? 1 : hallsGlow} color={i === 0 ? S.aurora : S.cyan} />
            <group position={[i * HALL_GAP, 0, 0]}>
              <Racks />
            </group>
          </group>
        ))}
        <Boxes items={full} reveal={reveal} />
        {[1, 2].map((i) => (
          <group key={i} position={[i * HALL_GAP, 0, 0]}>
            <Boxes items={ghost} reveal={ghostK} ghost />
          </group>
        ))}
        <PostFX bloom={1.1} bloomThreshold={0.6} vignette={0.5} />
      </Stage>
      <CapacityBar at={L("ধারণক্ষমতা") - 0.1} totalAt={L("পঁয়তাল্লিশ")} used={14} total={45} />
      <Tag at={0.15} text="৩টা কক্ষ · প্রতিটা ৯.৫ × ২৭ মিটার" top={1140} color={S.cyan} />
      <Flash at={0} dur={0.2} />
    </AbsoluteFill>
  );
};
