/**
 * Inside the mountain: steel door, ~110 m access tunnel, end hall with the three vault doors,
 * and a vault room with racks of seed boxes. One continuous world along −z:
 *   z = 0        steel double door (tunnel mouth)
 *   z = 0..−110  corrugated tunnel, ceiling light strips
 *   z = −110..−122 transverse hall, vault doors 1-2-3 on the back wall (x = −7, 0, 7)
 * The vault room is a separate component (VaultRoom) used in its own shot.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { canvasTex, grain, rng } from "./util";

export const TUNNEL_LEN = 110;
const R = 2.7;
const FLOOR = -1.7;

const useRibTex = () =>
  useMemo(
    () =>
      canvasTex(256, 64, (g) => {
        for (let x = 0; x < 256; x++) {
          const v = 120 + Math.sin((x / 256) * Math.PI * 2) * 55;
          g.fillStyle = `rgb(${v},${v + 4},${v + 8})`;
          g.fillRect(x, 0, 1, 64);
        }
      }, [TUNNEL_LEN / 0.6, 1]),
    [],
  );

export const SteelDoor: React.FC<{ readonly open: number; readonly z?: number }> = ({ open, z = 0 }) => (
  <group position={[0, 0, z]}>
    {/* frame */}
    <mesh position={[0, 0.6, 0.2]}>
      <boxGeometry args={[7, 7, 0.4]} />
      <meshStandardMaterial color="#2a3036" metalness={0.5} roughness={0.6} />
    </mesh>
    {[-1, 1].map((s) => (
      <group key={s} position={[s * (1.1 + open * 2.3), 0.1, 0.45]}>
        <mesh>
          <boxGeometry args={[2.2, 3.6, 0.18]} />
          <meshStandardMaterial color="#6d7780" metalness={0.85} roughness={0.32} />
        </mesh>
        {[-1.2, 0, 1.2].map((y) => (
          <mesh key={y} position={[0, y, 0.11]}>
            <boxGeometry args={[2.0, 0.08, 0.04]} />
            <meshStandardMaterial color="#3b434a" metalness={0.9} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[-s * 0.85, 0, 0.14]}>
          <boxGeometry args={[0.08, 0.6, 0.08]} />
          <meshStandardMaterial color="#c9d2d8" metalness={1} roughness={0.2} />
        </mesh>
      </group>
    ))}
    {/* light spilling from the tunnel behind the leaves */}
    <mesh position={[0, 0.1, 0.25]}>
      <planeGeometry args={[4.4, 3.6]} />
      <meshBasicMaterial color="#cdeeff" transparent opacity={0.2 + open * 0.8} />
    </mesh>
    <mesh position={[0, 2.35, 0.5]}>
      <boxGeometry args={[1.2, 0.18, 0.1]} />
      <meshStandardMaterial color="#000" emissive={open > 0.05 ? "#5dffb0" : "#ff4b4b"} emissiveIntensity={3} />
    </mesh>
  </group>
);

export const Tunnel: React.FC<{ readonly frost?: number }> = ({ frost = 0.3 }) => {
  const rib = useRibTex();
  const lights = useMemo(() => Array.from({ length: Math.floor(TUNNEL_LEN / 6) }, (_, i) => -3 - i * 6), []);
  const floorTex = useMemo(() => canvasTex(256, 256, (g) => grain(g, 256, 256, [92, 96, 100], 30, 8), [2, 30]), []);
  return (
    <group>
      {/* corrugated steel tube (open), seen from inside */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -TUNNEL_LEN / 2]}>
        <cylinderGeometry args={[R, R, TUNNEL_LEN, 40, 1, true]} />
        <meshStandardMaterial
          map={rib}
          bumpMap={rib}
          bumpScale={3}
          color={new THREE.Color("#9aa3aa").lerp(new THREE.Color("#e6f4ff"), frost)}
          metalness={0.55}
          roughness={0.45}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR, -TUNNEL_LEN / 2]}>
        <planeGeometry args={[4.6, TUNNEL_LEN]} />
        <meshStandardMaterial map={floorTex} roughness={0.55} metalness={0.1} />
      </mesh>
      {/* ceiling light strips */}
      {lights.map((z) => (
        <mesh key={z} position={[0, R - 0.25, z]}>
          <boxGeometry args={[0.35, 0.08, 2.2]} />
          <meshStandardMaterial color="#fff" emissive="#dff4ff" emissiveIntensity={4} />
        </mesh>
      ))}
      {/* cable trays + pipes along the right wall */}
      <mesh position={[2.0, 0.9, -TUNNEL_LEN / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, TUNNEL_LEN, 8]} />
        <meshStandardMaterial color="#c7a24a" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-2.1, 0.5, -TUNNEL_LEN / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, TUNNEL_LEN, 8]} />
        <meshStandardMaterial color="#8b98a2" metalness={0.8} roughness={0.35} />
      </mesh>
      {/* evenly spaced lights so the walls read */}
      {[-10, -35, -60, -85, -105].map((z) => (
        <pointLight key={z} position={[0, 1.8, z]} color="#e8f6ff" intensity={14} distance={22} decay={1.6} />
      ))}
    </group>
  );
};

const doorX = [-4.3, 0, 4.3];

/** End hall at the tunnel's end with the three vault doors. `glow[i]` 0..1 lights door i. */
export const VaultHall3: React.FC<{ readonly glow: [number, number, number]; readonly frost?: number }> = ({ glow, frost = 0.6 }) => {
  const iceTex = useMemo(() => canvasTex(512, 512, (g) => grain(g, 512, 512, [200, 214, 224], 40, 12), [3, 1]), []);
  const z0 = -TUNNEL_LEN;
  return (
    <group position={[0, 0, z0]}>
      {/* room box (inside faces) */}
      <mesh position={[0, 1.6, -6]}>
        <boxGeometry args={[22, 6.6, 12]} />
        <meshStandardMaterial map={iceTex} color={new THREE.Color("#b8c6cf").lerp(new THREE.Color("#f2fbff"), frost)} roughness={0.85} side={THREE.BackSide} />
      </mesh>
      {doorX.map((x, i) => (
        <group key={x} position={[x, 0, -11.9]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[3.0, 4.2, 0.25]} />
            <meshStandardMaterial color="#59646d" metalness={0.8} roughness={0.35} emissive="#47d4ff" emissiveIntensity={glow[i] * 0.12} />
          </mesh>
          {/* frost-rimmed frame */}
          {([[0, 2.72, 3.4, 0.12], [0, -1.72, 3.4, 0.12], [-1.64, 0.5, 0.12, 4.56], [1.64, 0.5, 0.12, 4.56]] as const).map(([fx, fy, fw, fh], k) => (
            <mesh key={k} position={[fx, fy, 0.16]}>
              <boxGeometry args={[fw, fh, 0.08]} />
              <meshStandardMaterial color="#e9f7ff" emissive="#9fe9ff" emissiveIntensity={0.4 + glow[i] * 3} />
            </mesh>
          ))}
          <pointLight position={[0, 2.5, 2]} color="#7fdfff" intensity={6 + glow[i] * 30} distance={9} decay={2} />
        </group>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR, -6]}>
        <planeGeometry args={[22, 12]} />
        <meshStandardMaterial color="#9fb0bb" roughness={0.4} metalness={0.2} />
      </mesh>
      {[-6, 0, 6].map((x) => (
        <mesh key={x} position={[x, 4.7, -6]}>
          <boxGeometry args={[0.4, 0.08, 8]} />
          <meshStandardMaterial color="#fff" emissive="#e6f6ff" emissiveIntensity={3.5} />
        </mesh>
      ))}
    </group>
  );
};
export const VAULT_DOOR_X = doorX;

/* ---------------------------------------------------------------- vault room: racks of seed boxes */

export const ROOM = { w: 9.5, l: 27, h: 4.6 };
const BOX_COLORS = ["#16181b", "#16181b", "#1e2226", "#2a2f35", "#5b6670", "#244a7a", "#2f6d4a", "#8a2d2d", "#c9c3b2", "#7a5a2e"];

export type Rack = { x: number; z0: number; z1: number; face: 1 | -1 };
export const RACKS: Rack[] = [
  { x: -4.05, z0: -1, z1: -26, face: 1 },
  { x: -1.35, z0: -1, z1: -26, face: -1 },
  { x: 1.35, z0: -1, z1: -26, face: 1 },
  { x: 4.05, z0: -1, z1: -26, face: -1 },
];

/** Box instances for a rack set; `fill` 0..1 = fraction of shelf slots in use (for the capacity shot). */
export const useBoxes = (racks: Rack[], fill = 1, seed = 3) =>
  useMemo(() => {
    const r = rng(seed);
    const out: { p: [number, number, number]; s: [number, number, number]; c: string }[] = [];
    const levels = [0.0, 0.85, 1.7, 2.55, 3.4];
    racks.forEach((rk) => {
      for (let z = rk.z0; z > rk.z1; z -= 0.62) {
        levels.forEach((ly) => {
          if (r() > fill) return;
          const w = 0.48 + r() * 0.08;
          const h = 0.32 + r() * 0.14;
          const d = 0.42 + r() * 0.12;
          out.push({ p: [rk.x, FLOOR + 0.22 + ly + h / 2, z - 0.3], s: [d, h, w], c: BOX_COLORS[Math.floor(r() * BOX_COLORS.length)] });
          if (r() > 0.55) out.push({ p: [rk.x, FLOOR + 0.22 + ly + h + 0.15, z - 0.3], s: [d * 0.95, 0.28, w * 0.95], c: BOX_COLORS[Math.floor(r() * BOX_COLORS.length)] });
        });
      }
    });
    return out;
  }, [racks, fill, seed]);

export const Boxes: React.FC<{ readonly items: ReturnType<typeof useBoxes>; readonly reveal?: number; readonly ghost?: boolean }> = ({
  items,
  reveal = 1,
  ghost = false,
}) => {
  const mesh = useMemo(() => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = ghost
      ? new THREE.MeshBasicMaterial({ color: "#47d4ff", transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
      : new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 });
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length));
    const mt = new THREE.Matrix4();
    const c = new THREE.Color();
    items.forEach((b, i) => {
      mt.makeScale(...b.s).setPosition(...b.p);
      m.setMatrixAt(i, mt);
      if (!ghost) m.setColorAt(i, c.set(b.c));
    });
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, [items, ghost]);
  mesh.count = Math.round(items.length * reveal);
  return <primitive object={mesh} />;
};

export const Racks: React.FC<{ readonly racks?: Rack[] }> = ({ racks = RACKS }) => {
  const parts = useMemo(() => {
    const out: { p: [number, number, number]; s: [number, number, number] }[] = [];
    racks.forEach((rk) => {
      for (let z = rk.z0; z >= rk.z1; z -= 2.5) out.push({ p: [rk.x - 0.31, FLOOR + 2.0, z], s: [0.06, 4.0, 0.06] }, { p: [rk.x + 0.31, FLOOR + 2.0, z], s: [0.06, 4.0, 0.06] });
      [0.2, 1.05, 1.9, 2.75, 3.6].forEach((ly) => out.push({ p: [rk.x, FLOOR + ly, (rk.z0 + rk.z1) / 2], s: [0.66, 0.04, Math.abs(rk.z1 - rk.z0)] }));
    });
    return out;
  }, [racks]);
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: "#aab4bc", metalness: 0.8, roughness: 0.35 }), parts.length);
    const mt = new THREE.Matrix4();
    parts.forEach((p, i) => {
      mt.makeScale(...p.s).setPosition(...p.p);
      m.setMatrixAt(i, mt);
    });
    return m;
  }, [parts]);
  return <primitive object={mesh} />;
};

/** The operating vault hall (9.5 × 27 m), frosted walls, racks, boxes and cold mist lights. */
export const VaultRoom: React.FC<{ readonly frost?: number }> = ({ frost = 0.85 }) => {
  const boxes = useBoxes(RACKS, 0.93);
  const iceTex = useMemo(
    () =>
      canvasTex(512, 512, (g) => {
        grain(g, 512, 512, [214, 226, 234], 46, 21);
        const r = rng(4);
        g.fillStyle = "rgba(255,255,255,0.55)";
        for (let i = 0; i < 1400; i++) g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
      }, [4, 1.5]),
    [],
  );
  return (
    <group>
      <mesh position={[0, FLOOR + ROOM.h / 2, -ROOM.l / 2]}>
        <boxGeometry args={[ROOM.w, ROOM.h, ROOM.l + 2]} />
        <meshStandardMaterial map={iceTex} color={new THREE.Color("#c9d6de").lerp(new THREE.Color("#ffffff"), frost)} roughness={0.9} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR + 0.005, -ROOM.l / 2]}>
        <planeGeometry args={[ROOM.w, ROOM.l]} />
        <meshStandardMaterial color="#a9b7c1" roughness={0.35} metalness={0.2} />
      </mesh>
      <Racks />
      <Boxes items={boxes} />
      {[-2.5, 0, 2.5].map((x) =>
        [-3, -9, -15, -21].map((z) => (
          <mesh key={`${x}${z}`} position={[x * 0.6, FLOOR + ROOM.h - 0.08, z]}>
            <boxGeometry args={[0.18, 0.06, 2.4]} />
            <meshStandardMaterial color="#fff" emissive="#eaf7ff" emissiveIntensity={3.2} />
          </mesh>
        )),
      )}
      {[-3, -10, -17, -24].map((z) => (
        <pointLight key={z} position={[0, FLOOR + ROOM.h - 0.5, z]} color="#e4f4ff" intensity={9} distance={12} decay={1.7} />
      ))}
    </group>
  );
};
