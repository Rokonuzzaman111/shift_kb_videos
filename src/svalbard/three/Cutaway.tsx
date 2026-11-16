/**
 * Mountain cut in half to show the vault deep inside.
 * Profile in (x, y), extruded along z. The back half stays; the front half slides away (`open` 0..1),
 * revealing the cut face: rock strata, permafrost tint, the access tunnel and the glowing vault halls.
 * Units ≈ metres. Portal at x = 0 on the slope foot, tunnel runs +x into the mountain.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { canvasTex, fbm, rng } from "./util";

const PROFILE = (() => {
  const pts: [number, number][] = [[-60, -30], [-60, 0], [-20, 0], [-4, 0.5]];
  for (let i = 0; i <= 40; i++) {
    const x = i * 6;
    const y = Math.min(62, x * 0.62) - Math.max(0, x - 175) * 0.75 + fbm(x * 0.05, 3, 3) * 8;
    pts.push([x, Math.max(0, y)]);
  }
  pts.push([270, 0], [300, 0], [300, -30]);
  return pts;
})();

export const CUT = { tunnelY: 4, tunnelX0: 0, tunnelX1: 110, vaultX: 118, vaultW: 26, vaultH: 7 };

const shapeGeo = (depth: number) => {
  const s = new THREE.Shape();
  PROFILE.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, steps: 1 });
};

/** Svalbard sedimentary layers (sandstone, shale, coal seams) as horizontal bands; v = height. */
const LAYERS: [number, string][] = [
  [0.0, "#6f6255"], [0.08, "#8d7b64"], [0.16, "#5a524b"], [0.2, "#2a2623"], [0.23, "#9a8770"], [0.36, "#6b625a"],
  [0.44, "#a08c72"], [0.55, "#4d4741"], [0.6, "#262220"], [0.63, "#8f7e69"], [0.78, "#756a5e"], [0.9, "#a5927a"],
];
const strata = () =>
  canvasTex(512, 1024, (g) => {
    const r = rng(2);
    for (let y = 0; y < 1024; y++) {
      const v = 1 - y / 1024;
      let col = LAYERS[0][1];
      for (const [h, c] of LAYERS) if (v >= h) col = c;
      g.fillStyle = col;
      g.fillRect(0, y, 512, 1);
    }
    for (let i = 0; i < 9000; i++) {
      const a = r() * 0.12;
      g.fillStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
      g.fillRect(r() * 512, r() * 1024, 1 + r() * 6, 1 + r() * 2);
    }
  });

export const Cutaway: React.FC<{ readonly open: number; readonly glow: number; readonly tunnel: number }> = ({ open, glow, tunnel }) => {
  const { back, front, rockTex } = useMemo(() => ({ back: shapeGeo(60), front: shapeGeo(60), rockTex: strata() }), []);
  rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping;
  rockTex.repeat.set(1 / 120, 1 / 70);
  rockTex.offset.set(0, 0);
  // materials: [caps, sides] — caps get strata (cut face), sides get snow
  const capMat = useMemo(() => new THREE.MeshStandardMaterial({ map: rockTex, roughness: 0.95, color: "#ffffff", emissive: "#2a2420", emissiveIntensity: 0.25 }), [rockTex]);
  const snowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#eef6fc", roughness: 0.9 }), []);
  return (
    <group>
      {/* back half: z −60..0, its front cap (z = 0) is the cut face */}
      <mesh geometry={back} material={[capMat, snowMat]} position={[0, 0, -60]} receiveShadow castShadow />
      {/* front half slides toward camera and drops away */}
      <mesh
        geometry={front}
        material={[capMat, snowMat]}
        position={[open * 40, -open * open * 60, open * 120]}
        rotation={[open * 0.25, 0, -open * 0.15]}
        visible={open < 0.98}
        castShadow
      />
      {/* permafrost tint band near the surface, on the cut face */}
      {/* access tunnel (grows in) */}
      <mesh position={[CUT.tunnelX0 + (tunnel * (CUT.tunnelX1 - CUT.tunnelX0)) / 2, CUT.tunnelY, 0.12]}>
        <planeGeometry args={[Math.max(0.01, tunnel * (CUT.tunnelX1 - CUT.tunnelX0)), 3.2]} />
        <meshBasicMaterial color="#bff0ff" transparent opacity={0.95 * open} toneMapped={false} />
      </mesh>
      {/* three vault halls */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[CUT.vaultX + i * 9.5, CUT.tunnelY + 0.5, 0.14]}>
          <planeGeometry args={[8, CUT.vaultH]} />
          <meshBasicMaterial color={i === 0 ? "#5dffb0" : "#47d4ff"} transparent opacity={glow * (i === 0 ? 1 : 0.55)} toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[CUT.vaultX + 9, CUT.tunnelY, 10]} color="#5dffb0" intensity={glow * 600} distance={80} decay={2} />
      {/* portal block at the slope foot */}
      <mesh position={[-2, 4, -2]}>
        <boxGeometry args={[6, 8, 5]} />
        <meshStandardMaterial color="#c4c8cb" roughness={0.8} emissive="#47d4ff" emissiveIntensity={0.25} />
      </mesh>
      {/* valley / sea plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[100, -0.2, 0]}>
        <planeGeometry args={[1200, 1200]} />
        <meshStandardMaterial color="#dbe8f1" roughness={0.95} />
      </mesh>
    </group>
  );
};
