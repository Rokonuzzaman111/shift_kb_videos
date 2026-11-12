/**
 * Night bedroom for SH5's time-lapse beat (1 unit = 1 m, floor y = 0, camera side = +z).
 *  - Back wall with a single modern wall clock (WALL_CLOCK) showing `hours` (22 = 10:00 … 27 = 3:00).
 *  - Left wall window: night sky with a moon that drifts across as `night` (0..1) advances; cool moonlight.
 *  - Bed with pillow and a duvet over a restless sleeper (the bump shifts as they toss and turn).
 *  - Nightstand with the half-full tea glass, caffeine still glowing cyan (TeaCup).
 * Clock face texture comes from the caller (drawn after the Bangla font loads): see makeClockFace().
 */
import { useMemo } from "react";
import * as THREE from "three";
import { HDRI, Lighting } from "../../../kit/assets";
import { TeaCup } from "../TeaCup";
import { plasterTexture, woodTextures } from "./tex";

export const BACK_Z = -2.5;
export const WALL_CLOCK: [number, number, number] = [0.15, 2.05, BACK_Z + 0.021];
export const CLOCK_R = 0.3;
export const STAND_CUP: [number, number, number] = [1.38, 0.56, -1.95];
const CUP_S = 0.11;

/** Clock face: white dial, Bangla numerals, minute ticks. Call once the font is loaded. */
export const makeClockFace = (font: string) => {
  const S = 512;
  const cv = document.createElement("canvas");
  cv.width = S;
  cv.height = S;
  const g = cv.getContext("2d")!;
  const c = S / 2;
  const grd = g.createRadialGradient(c, c * 0.8, 10, c, c, c);
  grd.addColorStop(0, "#fbfaf6");
  grd.addColorStop(1, "#e4e0d6");
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const big = i % 5 === 0;
    const r1 = c * 0.9;
    const r2 = big ? c * 0.78 : c * 0.85;
    g.strokeStyle = "#1d1d1f";
    g.lineWidth = big ? 9 : 3;
    g.beginPath();
    g.moveTo(c + Math.sin(a) * r1, c - Math.cos(a) * r1);
    g.lineTo(c + Math.sin(a) * r2, c - Math.cos(a) * r2);
    g.stroke();
  }
  const nums = ["১২", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯", "১০", "১১"];
  g.fillStyle = "#1d1d1f";
  g.font = `700 64px "${font}"`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  nums.forEach((n, i) => {
    const a = (i / 12) * Math.PI * 2;
    g.fillText(n, c + Math.sin(a) * c * 0.62, c - Math.cos(a) * c * 0.62 + 4);
  });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

const skyTexture = (() => {
  let cached: THREE.Texture | null = null;
  return () => {
    if (cached) return cached;
    const W = 256;
    const H = 384;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const g = cv.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "#050a1e");
    gr.addColorStop(0.75, "#13204a");
    gr.addColorStop(1, "#2a3260");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    let s = 7;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.7})`;
      const r = rnd() * 1.3 + 0.3;
      g.beginPath();
      g.arc(rnd() * W, rnd() * H * 0.8, r, 0, Math.PI * 2);
      g.fill();
    }
    // distant rooftops
    g.fillStyle = "#03050c";
    let x = 0;
    while (x < W) {
      const w = 18 + rnd() * 30;
      const h = 20 + rnd() * 50;
      g.fillRect(x, H - h, w, h);
      for (let k = 0; k < 6; k++) {
        if (rnd() > 0.55) {
          g.fillStyle = "#ffcf7a";
          g.fillRect(x + 4 + rnd() * (w - 8), H - h + 6 + rnd() * (h - 12), 3, 4);
          g.fillStyle = "#03050c";
        }
      }
      x += w + 2;
    }
    cached = new THREE.CanvasTexture(cv);
    cached.colorSpace = THREE.SRGBColorSpace;
    return cached;
  };
})();

const glowTex = (() => {
  let cached: THREE.Texture | null = null;
  return () => {
    if (cached) return cached;
    const cv = document.createElement("canvas");
    cv.width = cv.height = 128;
    const g = cv.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.25, "rgba(255,255,255,0.45)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    cached = new THREE.CanvasTexture(cv);
    return cached;
  };
})();

const WallClock: React.FC<{ readonly hours: number; readonly face: THREE.Texture; readonly t: number }> = ({ hours, face, t }) => {
  const h12 = ((hours % 12) + 12) % 12;
  const hourA = -(h12 / 12) * Math.PI * 2;
  const minA = -((hours % 1) * Math.PI * 2);
  const secA = -((t * 1.0) % 60) / 60 * Math.PI * 2;
  return (
    <group position={WALL_CLOCK}>
      {/* soft contact shadow on the wall (slightly below: light comes from above) */}
      <mesh position={[0.015, -0.03, -0.019]}>
        <planeGeometry args={[CLOCK_R * 3, CLOCK_R * 3]} />
        <meshBasicMaterial map={glowTex()} color="#000000" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      {/* rim */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, 0.025]}>
        <torusGeometry args={[CLOCK_R, 0.028, 20, 72]} />
        <meshPhysicalMaterial color="#1a1a1c" roughness={0.35} metalness={0.4} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[CLOCK_R, CLOCK_R, 0.04, 72]} />
        <meshStandardMaterial color="#222" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.021]}>
        <circleGeometry args={[CLOCK_R * 0.97, 72]} />
        <meshStandardMaterial map={face} roughness={0.55} emissive="#ffffff" emissiveMap={face} emissiveIntensity={0.06} />
      </mesh>
      {/* hands */}
      <group position={[0, 0, 0.03]} rotation={[0, 0, hourA]}>
        <mesh position={[0, CLOCK_R * 0.24, 0]}>
          <boxGeometry args={[0.022, CLOCK_R * 0.58, 0.006]} />
          <meshStandardMaterial color="#111" roughness={0.4} />
        </mesh>
      </group>
      <group position={[0, 0, 0.036]} rotation={[0, 0, minA]}>
        <mesh position={[0, CLOCK_R * 0.36, 0]}>
          <boxGeometry args={[0.014, CLOCK_R * 0.82, 0.005]} />
          <meshStandardMaterial color="#111" roughness={0.4} />
        </mesh>
      </group>
      <group position={[0, 0, 0.042]} rotation={[0, 0, secA]}>
        <mesh position={[0, CLOCK_R * 0.3, 0]}>
          <boxGeometry args={[0.005, CLOCK_R * 0.85, 0.003]} />
          <meshStandardMaterial color="#d23a2a" roughness={0.4} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.046]}>
        <cylinderGeometry args={[0.014, 0.014, 0.01, 20]} />
        <meshStandardMaterial color="#d23a2a" />
      </mesh>
      {/* glass */}
      <mesh position={[0, 0, 0.05]}>
        <circleGeometry args={[CLOCK_R * 0.98, 72]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0.05} clearcoat={1} />
      </mesh>
    </group>
  );
};

/** Duvet height field over the mattress; a body-shaped bump rolls side to side (tossing). */
const Duvet: React.FC<{ readonly t: number }> = ({ t }) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(1.62, 1.55, 48, 48), []);
  const roll = Math.sin(t * 0.9) * 0.6 + Math.sin(t * 2.3) * 0.15; // -1..1 side
  const knees = 0.08 + 0.05 * Math.sin(t * 1.3 + 1);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i); // along bed length (+y = toward the head)
    const bodyX = roll * 0.12;
    const torso = Math.exp(-(((x - bodyX) / 0.22) ** 2)) * Math.exp(-(((y - 0.35) / 0.45) ** 2)) * 0.2;
    const legs = Math.exp(-(((x - bodyX * 0.6) / 0.2) ** 2)) * Math.exp(-(((y + 0.35) / 0.35) ** 2)) * knees;
    const wrinkle = 0.012 * Math.sin(x * 23 + y * 7) * Math.sin(y * 17 - x * 5);
    const edge = Math.min(1, (0.81 - Math.abs(x)) / 0.08);
    const drop = Math.abs(x) > 0.73 ? -(Math.abs(x) - 0.73) * 2.2 : 0;
    pos.setZ(i, (torso + legs + wrinkle) * Math.max(0, edge) + drop + 0.04);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0.6, -1.15]} castShadow receiveShadow>
      <meshPhysicalMaterial color="#2c4a7a" roughness={0.85} sheen={1} sheenColor="#8fb0ff" sheenRoughness={0.6} side={THREE.DoubleSide} />
    </mesh>
  );
};

const Window: React.FC<{ readonly night: number }> = ({ night }) => {
  const sky = skyTexture();
  const W = 0.8;
  const H = 1.1;
  // moon drifts across the window (right to left, rising then setting)
  const mz = 0.25 - night * 0.5;
  const my = 0.12 + Math.sin(Math.PI * (0.2 + night * 0.6)) * 0.22;
  return (
    <group position={[-1.5, 1.95, BACK_Z + 0.03]}>
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      <sprite position={[mz, my, 0.01]} scale={[0.5, 0.5, 1]}>
        <spriteMaterial map={glowTex()} color="#c9d8ff" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      <mesh position={[mz, my, 0.012]}>
        <circleGeometry args={[0.07, 40]} />
        <meshBasicMaterial color="#f1f3ff" toneMapped={false} />
      </mesh>
      {/* frame + mullions */}
      {[
        [0, H / 2 + 0.03, W + 0.12, 0.06],
        [0, -H / 2 - 0.03, W + 0.12, 0.06],
        [W / 2 + 0.03, 0, 0.06, H],
        [-W / 2 - 0.03, 0, 0.06, H],
        [0, 0, 0.035, H],
        [0, 0.1, W, 0.035],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.03]}>
          <boxGeometry args={[w, h, 0.06]} />
          <meshStandardMaterial color="#d8d2c6" roughness={0.6} />
        </mesh>
      ))}
      {/* sill */}
      <mesh position={[0, -H / 2 - 0.08, 0.08]}>
        <boxGeometry args={[W + 0.25, 0.04, 0.18]} />
        <meshStandardMaterial color="#cfc8ba" roughness={0.6} />
      </mesh>
    </group>
  );
};

export const Bedroom: React.FC<{
  readonly t: number;
  readonly hours: number;
  /** 0..1 how far the night has gone (moon position) */
  readonly night: number;
  readonly face: THREE.Texture;
  readonly cupGlow?: number;
}> = ({ t, hours, night, face, cupGlow = 0.6 }) => {
  const wood = useMemo(() => {
    const w = woodTextures();
    const m = w.map.clone();
    m.wrapS = m.wrapT = THREE.RepeatWrapping;
    m.repeat.set(3, 3);
    m.needsUpdate = true;
    return m;
  }, []);
  const plaster = useMemo(() => {
    const p = plasterTexture().clone();
    p.wrapS = p.wrapT = THREE.RepeatWrapping;
    p.repeat.set(3, 2);
    p.needsUpdate = true;
    return p;
  }, []);
  return (
    <group>
      <Lighting hdri={HDRI.studio} intensity={0.05} rotation={2} />
      <hemisphereLight args={["#6f82c4", "#1a120c", 0.5]} />
      <pointLight position={[0.2, 2.7, -0.4]} color="#7d8fd0" intensity={3} distance={6} decay={2} />
      {/* moonlight through the window */}
      <directionalLight
        position={[-3, 3.4, 1.2]}
        intensity={1.7}
        color="#8fa8ff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-bias={-0.0004}
      />
      {/* faint warm streetlight bounce on the right */}
      <pointLight position={[2.4, 1.8, 0.6]} color="#ffb070" intensity={0.6} distance={5} decay={2} />
      {/* caffeine glow from the cup */}
      <pointLight position={[STAND_CUP[0], STAND_CUP[1] + 0.12, STAND_CUP[2] + 0.05]} color="#47d7ff" intensity={0.5 * cupGlow} distance={1.4} decay={2} />

      {/* room */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial map={wood} color="#8a6a52" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2, BACK_Z]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial map={plaster} color="#a7adc2" roughness={0.95} />
      </mesh>
      <mesh position={[-2.2, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial map={plaster} color="#9aa0b4" roughness={0.95} />
      </mesh>
      <Window night={night} />
      <WallClock hours={hours} face={face} t={t} />

      {/* bed */}
      <mesh position={[0.15, 0.2, -1.45]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.36, 2.15]} />
        <meshPhysicalMaterial map={wood} color="#6b4a33" roughness={0.45} clearcoat={0.4} />
      </mesh>
      <mesh position={[0.15, 0.85, BACK_Z + 0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.1, 0.08]} />
        <meshPhysicalMaterial map={wood} color="#5a3c28" roughness={0.45} clearcoat={0.4} />
      </mesh>
      <mesh position={[0.15, 0.48, -1.45]} castShadow receiveShadow>
        <boxGeometry args={[1.58, 0.2, 2.05]} />
        <meshStandardMaterial color="#e9e6df" roughness={0.9} />
      </mesh>
      {/* pillow */}
      <mesh position={[0.15, 0.66, BACK_Z + 0.42]} scale={[0.62, 0.11, 0.25]} castShadow receiveShadow>
        <sphereGeometry args={[1, 40, 24]} />
        <meshPhysicalMaterial color="#f3f1ec" roughness={0.85} sheen={0.6} sheenColor="#ffffff" />
      </mesh>
      <Duvet t={t} />

      {/* nightstand + cup */}
      <mesh position={[1.38, 0.27, -1.95]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.54, 0.42]} />
        <meshPhysicalMaterial map={wood} color="#6b4a33" roughness={0.45} clearcoat={0.4} />
      </mesh>
      <mesh position={[1.38, 0.3, -1.735]}>
        <boxGeometry args={[0.42, 0.18, 0.01]} />
        <meshStandardMaterial color="#4a3222" roughness={0.6} />
      </mesh>
      <TeaCup t={t} position={STAND_CUP} scale={CUP_S} fill={0.5} steam={0} caffeineGlow={cupGlow} />
    </group>
  );
};
