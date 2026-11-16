/**
 * Svalbard v2 · Part 2 — a (generic) national genebank building at dusk, and the four threats.
 * Metres, y up, front facade on z = 0 facing +z, plaza at y = 0. Building x −12…12, z −14…0, 9 m tall.
 * Two recessed curtain-wall bands with steel mullions and lit interiors, entrance canopy, rooftop plant, parapet sign.
 * Threat FX (ages in s since each word, negative = not yet; effects are cumulative):
 *   war   — blast flash on the left facade, fireball, ballistic concrete debris, black smoke
 *   flood — murky water rises over the plaza
 *   fire  — flames + embers out of the upper-right windows, flickering orange light
 *   mach  — interior lights flicker out, red rotating alarm beacon + red emergency glow
 */
import { useMemo } from "react";
import * as THREE from "three";
import { usePBR } from "../../../kit/assets";
import { canvasTex, rng } from "../../three/util";
import { P } from "../palette";
import { Instanced, Puffs, useSteelMat } from "./Corridor";
import { useWaterMat } from "./Crops";
import { m4 } from "./SeedMacro";

type V = readonly [number, number, number];
export const GB_EXT = { W: 24, H: 9, D: 14 } as const;
export const BLAST: V = [-7, 4.2, 0.3];
export const FIRE_C: V = [7.5, 6.1, 0];
export const BEACON: V = [0, 3.75, 2.6];

const BANDS = [
  { y0: 0.7, y1: 3.4 },
  { y0: 5.0, y1: 7.3 },
] as const;

const useConcrete = (repeat: [number, number], tint = "#b4b7ba") => {
  const pbr = usePBR("concrete_wall_008", repeat);
  return useMemo(() => new THREE.MeshStandardMaterial({ map: pbr.map, normalMap: pbr.normalMap, roughnessMap: pbr.roughnessMap, color: tint, roughness: 0.9 }), [pbr, tint]);
};

/** lit office/lab interior seen through glass: ceiling light rows, shelving silhouettes */
const interiorTex = () =>
  canvasTex(1024, 128, (g) => {
    const r = rng(91);
    const gr = g.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, "#9fb4c4");
    gr.addColorStop(1, "#3c4a56");
    g.fillStyle = gr;
    g.fillRect(0, 0, 1024, 128);
    g.fillStyle = "#f4f8fb";
    for (let x = 10; x < 1024; x += 46) g.fillRect(x, 6, 30, 5);
    for (let x = 0; x < 1024; x += 20 + r() * 40) {
      const w = 8 + r() * 26;
      const v = 30 + Math.floor(r() * 40);
      g.fillStyle = `rgb(${v},${v + 6},${v + 12})`;
      g.fillRect(x, 50 + r() * 30, w, 128);
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = "rgba(10,14,20,0.55)";
      g.fillRect(r() * 1024, 0, 40 + r() * 120, 128);
    }
  });

const signTex = () =>
  canvasTex(1024, 128, (g) => {
    g.clearRect(0, 0, 1024, 128);
    g.fillStyle = "#ffffff";
    g.font = "bold 92px Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("NATIONAL  GENEBANK", 512, 68);
  });

const flameTex = () =>
  canvasTex(128, 256, (g) => {
    const gr = g.createRadialGradient(64, 200, 4, 64, 170, 120);
    gr.addColorStop(0, "rgba(255,248,220,1)");
    gr.addColorStop(0.25, "rgba(255,190,80,0.95)");
    gr.addColorStop(0.55, "rgba(255,90,40,0.6)");
    gr.addColorStop(1, "rgba(255,60,30,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(64, 0);
    g.bezierCurveTo(120, 90, 128, 200, 64, 256);
    g.bezierCurveTo(0, 200, 8, 90, 64, 0);
    g.fill();
  });

const glowTex = () =>
  canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,250,235,1)");
    gr.addColorStop(0.3, "rgba(255,182,72,0.9)");
    gr.addColorStop(0.7, "rgba(255,74,61,0.35)");
    gr.addColorStop(1, "rgba(255,74,61,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });

const scorchTex = () =>
  canvasTex(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    gr.addColorStop(0, "rgba(5,5,6,1)");
    gr.addColorStop(0.45, "rgba(15,14,14,0.85)");
    gr.addColorStop(1, "rgba(20,20,20,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
  });

export type ThreatState = { war: number; flood: number; fire: number; mach: number; t: number };

export const GenebankExterior: React.FC<{ readonly s: ThreatState }> = ({ s }) => {
  const wall = useConcrete([6, 2]);
  const plaza = useConcrete([30, 30], "#6a6e72");
  const steel = useSteelMat([2, 2], "#9aa4ad", 0.35, 0.9);
  const dark = useSteelMat([2, 2], "#3b444d", 0.5, 0.8);
  const tex = useMemo(() => ({ interior: interiorTex(), sign: signTex(), flame: flameTex(), glow: glowTex(), scorch: scorchTex() }), []);
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#1b2632", roughness: 0.06, metalness: 0.3, transparent: true, opacity: 0.5, envMapIntensity: 1.6, clearcoat: 1 }), []);

  /* lights: flicker out on "যান্ত্রিক" */
  const m = s.mach;
  const lights = m < 0 ? 1 : m > 0.34 ? 0 : (Math.floor(m * 32) % 3 === 0 ? 0.15 : 1) * (1 - m / 0.34);
  const alarmOn = m > 0.38 ? 1 : 0;
  const pulse = alarmOn * (0.55 + 0.45 * Math.sin((m - 0.38) * Math.PI * 2 * 2.4));
  const fireK = s.fire < 0 ? 0 : Math.min(1, s.fire / 0.35);
  const flick = (i: number) => 1 + 0.28 * Math.sin(s.t * 13 + i * 1.7) + 0.16 * Math.sin(s.t * 27 + i * 3.1);

  const interiorMat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex.interior, emissiveMap: tex.interior, emissive: new THREE.Color("#ffffff"), color: "#000000", roughness: 1 }), [tex]);
  interiorMat.emissive.set(lights > 0.01 ? "#e8eef3" : P.alert);
  interiorMat.emissiveIntensity = lights > 0.01 ? 1.15 * lights : 0.55 * pulse;

  const mullions = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    for (const b of BANDS) for (let x = -11.25; x <= 11.25; x += 1.5) out.push(m4([x, (b.y0 + b.y1) / 2, -0.2], [0.08, b.y1 - b.y0, 0.14]));
    for (const b of BANDS) out.push(m4([0, (b.y0 + b.y1) / 2, -0.2], [GB_EXT.W, 0.07, 0.12]));
    return out;
  }, []);
  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const city = useMemo(() => {
    const r = rng(515);
    const out: THREE.Matrix4[] = [];
    for (let i = 0; i < 26; i++) {
      const h = 6 + r() * 22;
      out.push(m4([-70 + i * 5.6 + r() * 2, h / 2, -48 - r() * 30], [4 + r() * 4, h, 4 + r() * 6]));
    }
    return out;
  }, []);
  const bollards = useMemo(() => Array.from({ length: 12 }, (_, i) => m4([-11 + i * 2, 0.45, 5.5], [0.18, 0.9, 0.18])), []);

  /* war: debris */
  const debris = useMemo(() => {
    const r = rng(333);
    return Array.from({ length: 140 }, () => {
      const th = r() * Math.PI * 2;
      const up = 0.15 + r() * 0.85;
      const sp = 5 + r() * 12;
      return { v: [Math.cos(th) * sp * 0.7, up * sp * 0.8, (0.5 + 0.5 * Math.abs(Math.sin(th))) * sp] as V, s: 0.05 + Math.pow(r(), 3) * 0.35, spin: [r() * 12, r() * 12, r() * 12] as V };
    });
  }, []);
  const w = s.war;
  const debrisMats =
    w > 0
      ? debris.map((d) => {
          const tl = (d.v[1] + Math.sqrt(d.v[1] * d.v[1] + 2 * 9.8 * (BLAST[1] - d.s / 2))) / 9.8;
          const a = Math.min(w, tl);
          const p: V = [BLAST[0] + d.v[0] * a, Math.max(d.s / 2, BLAST[1] + d.v[1] * a - 4.9 * a * a), BLAST[2] + d.v[2] * a];
          return m4(p, [d.s, d.s * 0.7, d.s * 0.9], [d.spin[0] * a, d.spin[1] * a, d.spin[2] * a]);
        })
      : [];
  const fb = w > 0 ? Math.min(1, w / 0.32) : 0;
  const fbFade = w > 0 ? Math.max(0, 1 - (w - 0.12) / 0.55) : 0;
  const flash = w > 0 ? Math.exp(-w * 7) : 0;

  /* flood */
  const water = useWaterMat("#4e4b40", 0.9, 0.35, 0.94);
  water.uni.uTime.value = s.t;
  water.uni.uRip.value = 0.4;
  const f = s.flood;
  const level = f < 0 ? -1 : 1.5 * (1 - Math.pow(1 - Math.min(1, f / 0.55), 3)) + 0.12 * Math.min(1, Math.max(0, f - 0.55) / 2.5);

  /* fire */
  const flames = useMemo(() => {
    const r = rng(444);
    return Array.from({ length: 26 }, (_, i) => ({ p: [FIRE_C[0] - 3.4 + i * 0.27 + (r() - 0.5) * 0.2, BANDS[1].y0 + 0.4 + r() * 1.2, 0.15 + r() * 0.3] as V, w: 0.9 + r() * 0.8, h: 1.8 + r() * 1.6, i }));
  }, []);
  const embers = useMemo(() => {
    const r = rng(555);
    return Array.from({ length: 220 }, () => ({ x: FIRE_C[0] + (r() - 0.5) * 7, ph: r(), sw: r() * 6.28, sp: 1.5 + r() * 2.5 }));
  }, []);
  const emberMats =
    fireK > 0
      ? embers.map((e) => {
          const L = 1.8;
          const age = (s.fire * 0.9 + e.ph * L) % L;
          const y = FIRE_C[1] + age * e.sp;
          const k = (1 - age / L) * fireK;
          return m4([e.x + Math.sin(age * 3 + e.sw) * 0.5 + age * 0.6, y, 0.5 + Math.cos(age * 2 + e.sw) * 0.6 + age * 0.4], [0.03 * k, 0.03 * k, 0.03 * k]);
        })
      : [];
  const emberMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffb648", toneMapped: false }), []);
  const sphereGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const beamTarget = useMemo(() => new THREE.Object3D(), []);

  const lampOn = lights;
  beamTarget.position.set(Math.cos(m * 9) * 10, -2, Math.sin(m * 9) * 10);
  return (
    <group>
      {/* plaza + road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={plaza} receiveShadow>
        <planeGeometry args={[160, 160]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 13]} receiveShadow>
        <planeGeometry args={[160, 9]} />
        <meshStandardMaterial color="#25292d" roughness={0.75} />
      </mesh>
      <Instanced geo={boxGeo} mat={dark} mats={bollards} shadows />
      <Instanced geo={boxGeo} mat={wall} mats={city} />

      {/* building core (set back so the glass bands are recessed) */}
      <mesh position={[0, GB_EXT.H / 2, -GB_EXT.D / 2 - 0.25]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[GB_EXT.W, GB_EXT.H, GB_EXT.D - 0.5]} />
      </mesh>
      {/* front concrete strips: plinth, spandrel, parapet */}
      {[
        [0, 0.7],
        [3.4, 5.0],
        [7.3, 9.4],
      ].map(([y0, y1], i) => (
        <mesh key={i} position={[0, (y0 + y1) / 2, -0.12]} material={wall} castShadow receiveShadow>
          <boxGeometry args={[GB_EXT.W + 0.3, y1 - y0, 0.5]} />
        </mesh>
      ))}
      {/* interiors + glass + mullions */}
      {BANDS.map((b, i) => (
        <group key={i}>
          <mesh position={[0, (b.y0 + b.y1) / 2, -1.2]} material={interiorMat}>
            <planeGeometry args={[GB_EXT.W, b.y1 - b.y0]} />
          </mesh>
          <mesh position={[0, (b.y0 + b.y1) / 2, -0.3]} material={glass}>
            <planeGeometry args={[GB_EXT.W, b.y1 - b.y0]} />
          </mesh>
        </group>
      ))}
      <Instanced geo={boxGeo} mat={steel} mats={mullions} />
      {/* sign on the parapet */}
      <mesh position={[0, 8.35, 0.15]}>
        <planeGeometry args={[9, 1.1]} />
        <meshStandardMaterial map={tex.sign} alphaMap={tex.sign} transparent color="#d9dee3" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* entrance canopy on two columns */}
      <mesh position={[0, 3.55, 1.6]} material={wall} castShadow receiveShadow>
        <boxGeometry args={[7, 0.35, 3.6]} />
      </mesh>
      {[-3.1, 3.1].map((x) => (
        <mesh key={x} position={[x, 1.7, 3.1]} material={steel} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 3.4, 16]} />
        </mesh>
      ))}
      {/* rooftop plant */}
      {[-6, 0.5, 6.5].map((x, i) => (
        <group key={x} position={[x, GB_EXT.H + 0.6, -6 - i]}>
          <mesh material={dark} castShadow>
            <boxGeometry args={[3.4, 1.2, 2.2]} />
          </mesh>
          <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.7, 20]} />
            <meshStandardMaterial color="#20262c" metalness={0.6} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* street lamps (amber practicals) */}
      {[-10, 10].map((x) => (
        <group key={x} position={[x, 0, 8]}>
          <mesh position={[0, 3, 0]} material={dark} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 6, 10]} />
          </mesh>
          <mesh position={[0, 6.05, 0]}>
            <boxGeometry args={[0.7, 0.14, 0.3]} />
            <meshStandardMaterial color="#222" emissive={P.amber} emissiveIntensity={3 * lampOn} />
          </mesh>
          <pointLight position={[0, 5.8, 0]} color={P.amber} intensity={40 * lampOn} distance={16} decay={2} />
        </group>
      ))}
      {/* light spill from the lobby */}
      <pointLight position={[0, 2.2, 1.2]} color="#dfe8f2" intensity={30 * lights} distance={12} decay={2} />

      {/* ── war ── */}
      {w > 0 ? (
        <>
          <pointLight position={[BLAST[0], BLAST[1], BLAST[2] + 2]} color="#ffd9a0" intensity={9000 * flash} distance={80} decay={2} />
          {fbFade > 0 ? (
            <sprite position={[BLAST[0], BLAST[1], BLAST[2] + 1]} scale={[1 + 9 * fb, 1 + 9 * fb, 1]}>
              <spriteMaterial map={tex.glow} transparent opacity={fbFade} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </sprite>
          ) : null}
          <mesh position={[BLAST[0], BLAST[1], 0.14]}>
            <planeGeometry args={[6, 5]} />
            <meshStandardMaterial map={tex.scorch} transparent opacity={Math.min(1, w * 6)} depthWrite={false} roughness={1} color="#ffffff" />
          </mesh>
          <Instanced geo={boxGeo} mat={wall} mats={debrisMats} shadows />
          <Puffs count={22} seed={71} box={[BLAST[0] - 3, BLAST[0] + 3, BLAST[1] - 1, BLAST[1] + 2, 0.5, 3]} size={[3, 6]} t={w + 0.4} drift={[0.5, 1.4, 0.3]} k={Math.min(1, w * 3)} color="#2b2d30" opacity={0.75} />
        </>
      ) : null}

      {/* ── flood ── */}
      {level > -0.5 ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, level, 0]} material={water.m}>
          <planeGeometry args={[160, 160]} />
        </mesh>
      ) : null}

      {/* ── fire ── */}
      {fireK > 0 ? (
        <>
          {flames.map((fl) => (
            <sprite key={fl.i} position={[fl.p[0], fl.p[1] + (fl.h * fireK * flick(fl.i)) / 2 - 0.3, fl.p[2]]} scale={[fl.w * fireK, fl.h * fireK * flick(fl.i), 1]}>
              <spriteMaterial map={tex.flame} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} opacity={0.9} />
            </sprite>
          ))}
          <pointLight position={[FIRE_C[0], FIRE_C[1], 2.5]} color="#ff8a3a" intensity={260 * fireK * flick(0)} distance={30} decay={2} />
          <Instanced geo={sphereGeo} mat={emberMat} mats={emberMats} />
          <Puffs count={14} seed={72} box={[FIRE_C[0] - 3, FIRE_C[0] + 3, 8, 10, -1, 1]} size={[3, 6]} t={s.fire + 0.3} drift={[0.6, 1.8, 0.2]} k={fireK} color="#26282b" opacity={0.7} />
        </>
      ) : null}

      {/* ── machine failure: red beacon ── */}
      <group position={BEACON as [number, number, number]}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.18, 0.32, 16]} />
          <meshStandardMaterial color="#5a1612" emissive={P.alert} emissiveIntensity={alarmOn ? 2 + 6 * pulse : 0} toneMapped={false} />
        </mesh>
        <primitive object={beamTarget} />
        {alarmOn ? (
          <>
            <pointLight color={P.alert} intensity={120 * pulse} distance={22} decay={2} />
            <spotLight
              color={P.alert}
              intensity={900}
              angle={0.35}
              penumbra={0.5}
              distance={40}
              decay={2}
              position={[0, 0.1, 0]}
              target={beamTarget}
            />
          </>
        ) : null}
      </group>
    </group>
  );
};
