/**
 * S18: Generator cutaway (VO "generator"). Rooppur's TZV-1200-2 is a 2-pole turbo-generator:
 * 3000 rpm gives 50 Hz, output 24 kV. Units: metres (stator Ø ~4 m, active length ~4 m).
 *
 * Beats:
 *  start               Wide cutaway of the stator (laminated steel + copper bars), rotor inside
 *  "জেনারেটর"          Title chip "জেনারেটর · ২৪ কিলোভোল্ট"
 *  "চুম্বক" (1st)      Rotor field lines (N→S) glow and sweep with the rotor
 *  "তামার"             Copper stator bars highlighted
 *  "চুম্বক" (2nd)      Chip "চুম্বক + তামা = বিদ্যুৎ"
 *  "জন্ম"              Current glow travels around the copper (rotating wave), Pop "বিদ্যুৎ"
 * Camera orbits 90° from a side 3/4 view to the end-on cross-section.
 * The rotor is shown slowed down (real speed 50 rev/s would strobe at 30 fps).
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
import { Chip, Pop } from "../ui";

export const S18_DURATION = shotDuration("generator");

const T = {
  title: wordAt("generator", "জেনারেটর"),
  magnet: wordAt("generator", "চুম্বক", 0),
  copper: wordAt("generator", "তামার"),
  equation: wordAt("generator", "চুম্বক", 1),
  born: wordAt("generator", "জন্ম"),
};

const LEN = 4.2; // active length (z)
const BORE = 1.12; // stator bore radius
const R_OUT = 2.05; // stator core outer radius
const ROTOR_R = 1.0;
const SLOTS = 48;
const CUT = Math.PI * 0.55; // open wedge facing the camera at the start

const Glow: React.FC<{ tex: THREE.Texture; at: readonly number[]; size: number; color: string; opacity: number }> = ({
  tex,
  at,
  size,
  color,
  opacity,
}) =>
  opacity <= 0.002 ? null : (
    <sprite position={[at[0], at[1], at[2]]} scale={[size, size, 1]}>
      <spriteMaterial map={tex} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );

/** Magnetic flux line of a 2-pole rotor: leaves N pole (+x), loops through the stator yoke, returns at S (−x). */
const fluxCurve = (k: number, z: number) => {
  const spread = 0.35 + k * 0.28; // how far round the loop goes
  const r1 = ROTOR_R * 0.6;
  const r2 = BORE + 0.15 + k * 0.22;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const a = mix(-spread, Math.PI + spread, u);
    // radius bulges out into the yoke in the middle of the path
    const r = mix(r1, r2, Math.sin(u * Math.PI));
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z));
  }
  return new THREE.CatmullRomCurve3(pts);
};

const World: React.FC = () => {
  const t = useSeconds();
  const steelTex = usePBR("metal_plate", [3, 1]);
  const glow = useMemo(() => softSprite("rgba(255,255,255,1)"), []);

  // Laminated core: stack of thin rings reads as electrical-steel laminations
  const laminate = useMemo(() => {
    const n = steelTex.normalMap.clone();
    n.repeat.set(1, 90);
    n.needsUpdate = true;
    return n;
  }, [steelTex]);
  const coreMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#5a6068",
        metalness: 0.85,
        roughness: 0.38,
        normalMap: laminate,
        normalScale: new THREE.Vector2(0.2, 1.2),
        side: THREE.DoubleSide,
      }),
    [laminate],
  );
  const copper = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#b86a3c", metalness: 1, roughness: 0.28, clearcoat: 0.3, emissive: "#ff9a3a" }),
    [],
  );
  const rotorMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#8e959d",
        metalness: 1,
        roughness: 0.22,
        normalMap: steelTex.normalMap,
        normalScale: new THREE.Vector2(0.15, 0.15),
      }),
    [steelTex],
  );
  const fluxMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: C.cyan, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    [],
  );

  // Stator core = annulus extruded along z with an open wedge (cutaway)
  const statorGeo = useMemo(() => {
    const s = new THREE.Shape();
    const a0 = CUT / 2;
    const a1 = Math.PI * 2 - CUT / 2;
    s.absarc(0, 0, R_OUT, a0, a1, false);
    s.absarc(0, 0, BORE + 0.12, a1, a0, true);
    const g = new THREE.ExtrudeGeometry(s, { depth: LEN, bevelEnabled: false, curveSegments: 96 });
    g.translate(0, 0, -LEN / 2);
    return g;
  }, []);

  // Stator copper bars in slots (only where the core exists), plus end-turn arcs
  const bars = useMemo(
    () =>
      new Array(SLOTS)
        .fill(0)
        .map((_, i) => (i / SLOTS) * Math.PI * 2)
        .filter((a) => {
          const n = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          return n > CUT / 2 + 0.03 && n < Math.PI * 2 - CUT / 2 - 0.03;
        }),
    [],
  );
  const endTurn = useMemo(() => new THREE.TorusGeometry(BORE + 0.25, 0.07, 10, 120, Math.PI * 2 - CUT - 0.1), []);
  const fluxGeos = useMemo(() => {
    const out: THREE.TubeGeometry[] = [];
    [-1.3, 0, 1.3].forEach((z) => [0, 1, 2].forEach((k) => out.push(new THREE.TubeGeometry(fluxCurve(k, z), 64, 0.022, 8, false))));
    return out;
  }, []);

  // Slowed rotor: ~0.45 rev/s on screen
  const rotorAngle = t * Math.PI * 0.9;
  const magnetOn = prog(t, T.magnet - 0.1, T.magnet + 0.6, ease.out);
  const copperOn = prog(t, T.copper - 0.1, T.copper + 0.5, ease.out);
  const born = prog(t, T.born - 0.1, T.born + 0.5, ease.out);
  fluxMat.opacity = 0.75 * magnetOn;

  // Current wave around the stator (follows the rotating field)
  const wave = (a: number) => Math.max(0, Math.cos(a - rotorAngle)) ** 2;
  copper.emissiveIntensity = 0; // per-bar emissive handled with cloned materials below
  const barMats = useMemo(() => bars.map(() => copper.clone()), [bars, copper]);
  bars.forEach((a, i) => {
    barMats[i].emissiveIntensity = copperOn * 0.18 + born * wave(a) * 2.4;
  });

  // Camera: 90° orbit, side 3/4 → end-on
  const k = prog(t, 0, S18_DURATION, ease.cine);
  // The cutaway wedge opens toward +x; the camera starts beside the machine (+x, looking across
  // the axis) and swings ~85° round to the end-on cross-section (+z).
  const orbit = mix(1.45, 0.06, k);
  const dist = mix(10.5, 9.0, k);
  const hh = handheld(t, 0.02, 7);
  const pos: [number, number, number] = [Math.sin(orbit) * dist + hh[0], mix(2.6, 1.4, k) + hh[1], Math.cos(orbit) * dist + hh[2]];
  const target: [number, number, number] = [0, 0.1, 0];
  const focus = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);

  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={0.7} rotation={0.6} />
      <directionalLight position={[6, 9, 8]} intensity={2.4} color="#fff3e6" />
      <directionalLight position={[-7, 2, -6]} intensity={1.3} color="#62c8ff" />
      <pointLight position={[0, 0, 0]} intensity={born * 14} distance={6} decay={2} color="#ffb24a" />

      <Lens mm={32} position={pos} target={target} near={0.05} far={200} />

      {/* Floor of the turbine hall (generator sits on a plinth) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -R_OUT - 0.6, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#2a2d31" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position={[0, -R_OUT - 0.35, 0]}>
        <boxGeometry args={[5.2, 0.5, LEN + 2.4]} />
        <meshStandardMaterial color="#3b4048" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Stator core (cutaway) */}
      <mesh geometry={statorGeo} material={coreMat} />

      {/* Stator copper bars + end windings */}
      {bars.map((a, i) => (
        <mesh key={i} material={barMats[i]} position={[Math.cos(a) * (BORE + 0.2), Math.sin(a) * (BORE + 0.2), 0]} rotation={[0, 0, a]}>
          <boxGeometry args={[0.22, 0.09, LEN + 0.5]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={endTurn} material={barMats[0] ?? copper} position={[0, 0, s * (LEN / 2 + 0.3)]} rotation={[0, 0, CUT / 2 + 0.05]} />
      ))}

      {/* Rotor: forged steel body with copper field-winding slots, shaft both ends */}
      <group rotation={[0, 0, rotorAngle]}>
        <mesh material={rotorMat} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[ROTOR_R, ROTOR_R, LEN, 96]} />
        </mesh>
        {/* field winding slots on two flanks; the unslotted faces at ±x are the N and S poles */}
        {new Array(14).fill(0).map((_, i) => {
          const a = Math.PI / 2 + ((i % 7) - 3) * 0.17 + (i < 7 ? 0 : Math.PI);
          return (
            <mesh key={i} material={copper} position={[Math.cos(a) * (ROTOR_R - 0.02), Math.sin(a) * (ROTOR_R - 0.02), 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.06, 0.08, LEN - 0.1]} />
            </mesh>
          );
        })}
        <mesh material={rotorMat} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.36, 0.36, LEN + 5, 48]} />
        </mesh>
        {/* magnetic field lines (rotate with the poles) */}
        {fluxGeos.map((g, i) => (
          <mesh key={i} geometry={g} material={fluxMat} />
        ))}
        <Glow tex={glow} at={[ROTOR_R + 0.05, 0, LEN / 2 + 0.2]} size={1.2} color="#ff5a3c" opacity={magnetOn * 0.6} />
        <Glow tex={glow} at={[-ROTOR_R - 0.05, 0, LEN / 2 + 0.2]} size={1.2} color="#3fa8ff" opacity={magnetOn * 0.6} />
      </group>

      {/* Output glow at the terminals once current is induced */}
      <Glow tex={glow} at={[0, R_OUT + 0.3, LEN / 2 + 0.4]} size={2.2} color="#ffc060" opacity={born * 0.5} />

      <PostFX focus={focus} focusRange={4} bokeh={2.5} bloom={0.8} bloomThreshold={0.8} />
    </>
  );
};

export const S18Generator: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#07090d">
        <World />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 220, gap: 18 }}>
        <Chip at={f(T.title)} until={f(T.equation - 0.3)} accent={C.cyan} size={44}>
          জেনারেটর · ২৪ কিলোভোল্ট
        </Chip>
        <div style={{ display: "flex", gap: 16 }}>
          <Chip at={f(T.magnet)} until={f(T.equation - 0.3)} accent="#ff5a3c" size={36}>
            ঘুরন্ত চুম্বক
          </Chip>
          <Chip at={f(T.copper)} until={f(T.equation - 0.3)} accent="#d9874f" size={36}>
            তামার তার
          </Chip>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 220, gap: 10 }}>
        <Chip at={f(T.equation)} accent={C.amber} size={50}>
          চুম্বক + তামা = বিদ্যুৎ
        </Chip>
        <Pop at={f(T.born + 0.15)} size={140} color={C.amber} glow>
          বিদ্যুৎ
        </Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
