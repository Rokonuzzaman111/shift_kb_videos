/**
 * S05–S07: Pellet → fuel rod → TVS-2M assembly → core (VO "reactor"). Units: millimetres.
 *
 * Real data (research report): pellet Ø7.6 mm with Ø1.2 mm hole; rod (zirconium-alloy cladding)
 * Ø~9.1 mm; ~350–380 pellets per rod; TVS-2M hex assembly = 312 fuel rods + 18 guide tubes
 * + 1 centre tube (331 lattice positions, pitch ~12.75 mm); core = 163 assemblies.
 *
 *  P1  0 → "অ্যাসেম্বলিতে"   Macro cutaway: pellets slide into the cladding tube (camera tracks along)
 *                              chip "৩৫০+ পেলেট / রড" on "রডে"
 *  P2  → "চুল্লিতে"           Hexagonal assembly, slow orbit from above. Chip "৩১২টি রড"
 *  P3  → end                  Core top-down under water, Cherenkov blue glow, push-in + slow rotation.
 *                              Chip "১৬৩টি অ্যাসেম্বলি"
 */
import { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HDRI, Lighting, usePBR } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix, mix3, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { softSprite } from "../three/textures";
import { C } from "../theme";
import { Chip, Flash } from "../ui";

export const S05_DURATION = shotDuration("reactor");

const T = {
  rod: wordAt("reactor", "রডে"),
  asm: wordAt("reactor", "অ্যাসেম্বলিতে") - 0.25,
  rods312: wordAt("reactor", "তিনশো", 1), // 0 = "তিনশোরও" (pellets), 1 = "তিনশো বারোটা"
  core: wordAt("reactor", "চুল্লিতে") - 0.25,
  n163: wordAt("reactor", "একশো"),
};

// ---- Real dimensions (mm) ----
const PEL_R = 3.8;
const PEL_H = 10;
const HOLE = 0.6;
const CLAD_RO = 4.55;
const CLAD_RI = 3.9;
const PITCH = 12.75;
const RINGS = 10; // 1 + 3·10·11 = 331 positions
const ASM_FLAT = 235; // across flats
const CORE_PITCH = 236;

const pelletGeometry = () => {
  const p = [
    [HOLE, 0.25],
    [PEL_R - 0.9, 0],
    [PEL_R - 0.35, 0],
    [PEL_R, 0.35],
    [PEL_R, PEL_H - 0.35],
    [PEL_R - 0.35, PEL_H],
    [PEL_R - 0.9, PEL_H],
    [HOLE, PEL_H - 0.25],
    [HOLE, 0.25],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(p, 96);
};

/** Axial coordinates of a hex lattice with `rings` rings → flat-topped xz positions. */
const hexLattice = (rings: number, pitch: number) => {
  const out: { x: number; z: number; ring: number }[] = [];
  for (let q = -rings; q <= rings; q++) {
    for (let r = Math.max(-rings, -q - rings); r <= Math.min(rings, -q + rings); r++) {
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(-q - r));
      out.push({ x: pitch * (q + r / 2), z: pitch * (r * Math.sqrt(3)) / 2, ring });
    }
  }
  return out;
};

/** Top view of an assembly head: rod ends on a hex lattice (used on core tops). */
const assemblyTopTexture = () => {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  g.fillStyle = "#8d949b";
  g.fillRect(0, 0, s, s);
  const pts = hexLattice(RINGS, 11.2);
  pts.forEach(({ x, z, ring }) => {
    const cx = s / 2 + x;
    const cy = s / 2 + z;
    const grad = g.createRadialGradient(cx - 1, cy - 1, 0.5, cx, cy, 5);
    grad.addColorStop(0, ring === 0 ? "#cfd5db" : "#b9c0c7");
    grad.addColorStop(1, "#4a5056");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(cx, cy, 4.4, 0, Math.PI * 2);
    g.fill();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

// ---------------- P1: pellets into the rod ----------------
const RodMacro: React.FC<{ t: number; steel: THREE.Material; pelletMat: THREE.Material }> = ({ t, steel, pelletMat }) => {
  const pellet = useMemo(pelletGeometry, []);
  // Cutaway cladding: a tube with a 110° window so the pellet stack is visible
  const clad = useMemo(() => {
    const prof = [
      new THREE.Vector2(CLAD_RI, 0),
      new THREE.Vector2(CLAD_RO, 0),
      new THREE.Vector2(CLAD_RO, 140),
      new THREE.Vector2(CLAD_RI, 140),
      new THREE.Vector2(CLAD_RI, 0),
    ];
    return new THREE.LatheGeometry(prof, 96, Math.PI * 0.62, Math.PI * 1.38);
  }, []);
  const N = 12;
  return (
    // rod axis along +x; offset so the pellet stack sits in front of the macro camera (target x ≈ −20…30)
    <group rotation={[0, 0, -Math.PI / 2]} position={[-100, 0, 0]}>
      <mesh geometry={clad} material={steel} castShadow receiveShadow />
      {new Array(N).fill(0).map((_, i) => {
        // pellets already inside stack from the far end; incoming pellets slide in one by one
        const enter = prog(t, 0.2 + i * 0.32, 0.2 + i * 0.32 + 0.9, ease.inOut);
        const restY = 140 - (i + 1) * (PEL_H + 0.05);
        const y = mix(restY + 170, restY, enter);
        return <mesh key={i} geometry={pellet} material={pelletMat} castShadow receiveShadow position={[0, y, 0]} />;
      })}
    </group>
  );
};

// ---------------- P2: TVS-2M assembly ----------------
const Assembly: React.FC<{ t: number; zirc: THREE.Material; guide: THREE.Material; grid: THREE.Material }> = ({ t, zirc, guide, grid }) => {
  const pts = useMemo(() => hexLattice(RINGS, PITCH), []);
  // 18 guide tubes: three symmetric rings of six (ring 3, ring 5 offset, ring 7) + centre tube
  const guideIdx = useMemo(() => {
    const set = new Set<number>();
    const pick = (ring: number, offset: number) => {
      const cand = pts.map((p, i) => ({ p, i })).filter((o) => o.p.ring === ring);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 + offset;
        let best = cand[0];
        let bd = Infinity;
        cand.forEach((o) => {
          const d = Math.abs(Math.atan2(o.p.z, o.p.x) - a + Math.PI * 4) % (Math.PI * 2);
          const dd = Math.min(d, Math.PI * 2 - d);
          if (dd < bd) {
            bd = dd;
            best = o;
          }
        });
        set.add(best.i);
      }
    };
    pick(3, 0);
    pick(5, Math.PI / 6);
    pick(7, 0);
    return set;
  }, [pts]);
  const rodGeo = useMemo(() => new THREE.CylinderGeometry(CLAD_RO, CLAD_RO, 420, 14), []);
  const guideGeo = useMemo(() => new THREE.CylinderGeometry(6.3, 6.3, 430, 16), []);
  const rise = prog(t, T.asm, T.asm + 1.6, ease.out);
  return (
    <group position={[0, -210 + (1 - rise) * -60, 0]}>
      {pts.map((p, i) => {
        const isCentre = p.ring === 0;
        const isGuide = guideIdx.has(i) || isCentre;
        const stagger = prog(t, T.asm + p.ring * 0.06, T.asm + p.ring * 0.06 + 0.7, ease.out);
        return (
          <mesh
            key={i}
            geometry={isGuide ? guideGeo : rodGeo}
            material={isGuide ? guide : zirc}
            position={[p.x, (1 - stagger) * -120, p.z]}
            castShadow
          />
        );
      })}
      {/* Spacer grids (hexagonal bands) */}
      {[60, 220, 380].map((y) => (
        <mesh key={y} position={[0, y - 210, 0]} rotation={[0, Math.PI / 6, 0]} material={grid}>
          <cylinderGeometry args={[ASM_FLAT / Math.sqrt(3), ASM_FLAT / Math.sqrt(3), 14, 6, 1, true]} />
        </mesh>
      ))}
    </group>
  );
};

// ---------------- P3: core of 163 assemblies under water ----------------
const Core: React.FC<{ t: number; glowTex: THREE.Texture }> = ({ t, glowTex }) => {
  const top = useMemo(assemblyTopTexture, []);
  const positions = useMemo(() => {
    // hex rings 0..7 = 169 positions; drop the 6 corner positions of ring 7 → 163 (VVER-1200 core)
    const all = hexLattice(7, CORE_PITCH);
    const corners = all.filter((p) => p.ring === 7).map((p) => ({ p, d: Math.hypot(p.x, p.z) }));
    const maxD = Math.max(...corners.map((o) => o.d));
    return all.filter((p) => !(p.ring === 7 && Math.abs(Math.hypot(p.x, p.z) - maxD) < 1));
  }, []);
  const hexGeo = useMemo(() => new THREE.CylinderGeometry(ASM_FLAT / Math.sqrt(3) - 2, ASM_FLAT / Math.sqrt(3) - 2, 400, 6), []);
  const topMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: top,
        metalness: 0.7,
        roughness: 0.35,
        emissive: new THREE.Color("#2b6dff"),
        emissiveIntensity: 0.6,
      }),
    [top],
  );
  const sideMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5c6670", metalness: 0.6, roughness: 0.5 }), []);
  const glowIn = prog(t, T.core, T.core + 1.4, ease.out);
  topMat.emissiveIntensity = 0.35 + glowIn * 0.9;
  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} geometry={hexGeo} material={[sideMat, topMat, sideMat]} position={[p.x, -200, p.z]} rotation={[0, Math.PI / 6, 0]} />
      ))}
      {/* Cherenkov glow pooled above the core */}
      <sprite position={[0, 120, 0]} scale={[4200, 4200, 1]}>
        <spriteMaterial map={glowTex} color="#3a8cff" transparent opacity={0.55 * glowIn} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      {/* Vessel wall ring */}
      <mesh position={[0, -150, 0]}>
        <cylinderGeometry args={[2060, 2060, 700, 96, 1, true]} />
        <meshStandardMaterial color="#3d464f" metalness={0.8} roughness={0.35} side={THREE.BackSide} />
      </mesh>
      {/* Water surface: subtle reflective sheet */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 1400, 0]}>
        <circleGeometry args={[2060, 96]} />
        <meshPhysicalMaterial color="#0d3b66" transparent opacity={0.18} roughness={0.05} transmission={0} />
      </mesh>
    </group>
  );
};

const World: React.FC = () => {
  const t = useSeconds();
  const glowTex = useMemo(() => softSprite("rgba(255,255,255,1)"), []);
  const steelTex = usePBR("metal_plate", [0.5, 2]);
  const steel = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#b9bec4",
        metalness: 0.95,
        roughness: 0.3,
        normalMap: steelTex.normalMap,
        normalScale: new THREE.Vector2(0.12, 0.12),
        roughnessMap: steelTex.roughnessMap,
        side: THREE.DoubleSide,
      }),
    [steelTex],
  );
  const zirc = useMemo(() => new THREE.MeshStandardMaterial({ color: "#a9afb5", metalness: 0.85, roughness: 0.38, normalMap: steelTex.normalMap, normalScale: new THREE.Vector2(0.08, 0.08) }), [steelTex]);
  const guide = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8f969d", metalness: 0.9, roughness: 0.28 }), []);
  const grid = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9ced3", metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }), []);
  const pelletMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#3b3c3f", metalness: 0.42, roughness: 0.5, clearcoat: 0.1 }), []);

  const phase = t < T.asm ? 1 : t < T.core ? 2 : 3;

  // ---- Cameras per phase ----
  let pos: [number, number, number];
  let target: [number, number, number];
  let mm: number;
  let focusRange: number;
  if (phase === 1) {
    const k = prog(t, 0, T.asm, ease.cine);
    pos = mix3([-30, 34, 120], [20, 26, 100], k);
    target = mix3([-20, 0, 0], [20, 0, 0], k);
    mm = 100;
    focusRange = 40;
  } else if (phase === 2) {
    const k = prog(t, T.asm, T.core, ease.inOut);
    const a = mix(-0.6, 0.5, k);
    const d = mix(520, 420, k);
    pos = [Math.sin(a) * d, mix(380, 300, k), Math.cos(a) * d];
    target = [0, -40, 0];
    mm = 50;
    focusRange = 220;
  } else {
    const k = prog(t, T.core, S05_DURATION, ease.cine);
    const a = mix(0, 0.35, k);
    const h = mix(7600, 4300, k);
    pos = [Math.sin(a) * 260, h, Math.cos(a) * 260];
    target = [0, -200, 0];
    mm = 35;
    focusRange = 4000;
  }
  const hh = handheld(t, phase === 1 ? 0.15 : phase === 2 ? 1.5 : 6, 7);
  const camPos: [number, number, number] = [pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]];
  const focus = Math.hypot(camPos[0] - target[0], camPos[1] - target[1], camPos[2] - target[2]);

  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={phase === 3 ? 0.25 : 0.7} rotation={0.8} />
      {phase === 3 ? <fog attach="fog" args={["#051a33", 3500, 9000]} /> : null}
      <directionalLight position={[300, 900, 500]} intensity={phase === 3 ? 0.6 : 2.4} color="#fff3e6" castShadow={phase !== 3} />
      <directionalLight position={[-500, 200, -600]} intensity={1.1} color="#7fcfff" />
      {phase === 3 ? <pointLight position={[0, 300, 0]} intensity={3.5} distance={6000} decay={0} color="#3d8bff" /> : null}

      <Lens mm={mm} position={camPos} target={target} near={1} far={30000} roll={phase === 1 ? 0.9 : 0} />

      {phase === 1 ? <RodMacro t={t} steel={steel} pelletMat={pelletMat} /> : null}
      {phase === 2 ? <Assembly t={t} zirc={zirc} guide={guide} grid={grid} /> : null}
      {phase === 3 ? <Core t={t} glowTex={glowTex} /> : null}

      <PostFX focus={focus} focusRange={focusRange} bokeh={phase === 1 ? 5 : 3} bloom={phase === 3 ? 1.1 : 0.4} bloomThreshold={phase === 3 ? 0.6 : 0.9} />
    </>
  );
};

export const S05Reactor: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background={"#05070b"}>
        <World />
      </Stage>
      <Flash at={f(T.asm)} color="#ffffff" len={f(0.25)} />
      <Flash at={f(T.core)} color="#6fb2ff" len={f(0.35)} />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        <Chip at={f(T.rod)} until={f(T.asm - 0.15)} accent={C.cyan} size={44}>
          ৩৫০+ পেলেট / রড
        </Chip>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        <Chip at={f(T.rods312)} until={f(T.core - 0.15)} accent={C.amber} size={44}>
          ১টি অ্যাসেম্বলি = ৩১২টি রড
        </Chip>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        <Chip at={f(T.n163)} accent="#6fb2ff" size={44}>
          রিঅ্যাক্টর কোর · ১৬৩টি অ্যাসেম্বলি
        </Chip>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
