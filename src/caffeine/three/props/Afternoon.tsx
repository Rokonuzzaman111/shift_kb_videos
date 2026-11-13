/**
 * Afternoon pieces for the night-study Desk (mood="afternoon"), 1 unit = 10 cm:
 *  - SUN_POS: low golden sun from the left/back window side.
 *  - BlindSlats: invisible venetian-blind slats between the sun and the desk. They don't draw
 *    (colorWrite off) but cast shadows, so the sunlight lands on the desk and wall in soft stripes.
 *  - DayWindow: bright late-afternoon sky with warm haze and a few drifting clouds.
 */
import { useMemo } from "react";
import * as THREE from "three";

export const SUN_POS: [number, number, number] = [-14, 7.5, 2.5];

export const BlindSlats: React.FC = () => {
  const { pos, quat } = useMemo(() => {
    const d = new THREE.Vector3(...SUN_POS).normalize(); // toward the sun
    const p = d.clone().multiplyScalar(5.5); // 5.5 units from the desk centre toward the sun
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
    return { pos: p, quat: q };
  }, []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), []);
  return (
    <group position={pos} quaternion={quat}>
      {Array.from({ length: 34 }, (_, i) => (
        <mesh key={i} position={[0, -6 + i * 0.36, 0]} rotation={[0.35, 0, 0]} castShadow material={mat}>
          <boxGeometry args={[18, 0.2, 0.02]} />
        </mesh>
      ))}
    </group>
  );
};

const daySky = (() => {
  let cached: THREE.Texture | null = null;
  return () => {
    if (cached) return cached;
    const W = 128;
    const H = 256;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "#7fb2e6");
    gr.addColorStop(0.55, "#d9c9a8");
    gr.addColorStop(1, "#ffb874");
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    // sun glare in the lower left
    const sg = g.createRadialGradient(W * 0.2, H * 0.72, 2, W * 0.2, H * 0.72, H * 0.5);
    sg.addColorStop(0, "rgba(255,246,220,1)");
    sg.addColorStop(0.15, "rgba(255,214,150,0.8)");
    sg.addColorStop(1, "rgba(255,190,120,0)");
    g.fillStyle = sg;
    g.fillRect(0, 0, W, H);
    cached = new THREE.CanvasTexture(c);
    cached.colorSpace = THREE.SRGBColorSpace;
    return cached;
  };
})();

/** Bright window with blinds half down; same footprint as NightWindow. */
export const DayWindow: React.FC<{ readonly position: readonly [number, number, number]; readonly w?: number; readonly h?: number; readonly t: number }> = ({
  position,
  w = 3.2,
  h = 4,
}) => {
  const sky = daySky();
  const frame = <meshStandardMaterial color="#e9dfcf" roughness={0.6} />;
  const bar = 0.12;
  return (
    <group position={position as [number, number, number]}>
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={sky} color={new THREE.Color(1.6, 1.5, 1.35)} toneMapped={false} />
      </mesh>
      {/* blind slats visible in the window */}
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={`s${i}`} position={[0, h / 2 - 0.12 - i * 0.16, 0.12]} rotation={[0.9, 0, 0]}>
          <boxGeometry args={[w - 0.05, 0.11, 0.01]} />
          <meshStandardMaterial color="#efe6d6" roughness={0.5} emissive="#ffcf95" emissiveIntensity={0.35} />
        </mesh>
      ))}
      {[
        [0, h / 2, w + bar * 2, bar * 1.6],
        [0, -h / 2, w + bar * 2, bar * 1.6],
      ].map(([x, y, ww, hh], i) => (
        <mesh key={`h${i}`} position={[x, y, 0.08]}>
          <boxGeometry args={[ww, hh, 0.16]} />
          {frame}
        </mesh>
      ))}
      {[-w / 2, w / 2].map((x, i) => (
        <mesh key={`v${i}`} position={[x, 0, 0.08]}>
          <boxGeometry args={[bar * 1.6, h, 0.16]} />
          {frame}
        </mesh>
      ))}
    </group>
  );
};
