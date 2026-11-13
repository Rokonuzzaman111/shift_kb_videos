/**
 * OWNER: 3D agent. Floating dust motes (seeded, frame-driven drift). Additive soft points.
 * Optional `beams`: motes glow only inside vertical light beams (x, z, radius) — the classic
 * "dust in a light shaft" look. Without beams every mote is lit uniformly.
 */
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { mulberry32, dotTexture } from "./tex";
import type { V3 } from "./Studio";

export const Dust: React.FC<{
  readonly count?: number;
  readonly center?: V3;
  /** box size the motes live in */
  readonly box?: V3;
  /** point size in world units */
  readonly size?: number;
  readonly opacity?: number;
  readonly color?: string;
  readonly seed?: number;
  /** drift speed multiplier */
  readonly speed?: number;
  readonly beams?: readonly { x: number; z: number; r: number }[];
}> = ({ count = 400, center = [0, 0, 0], box = [10, 6, 10], size = 0.05, opacity = 0.6, color = "#fff2dc", seed = 1, speed = 1, beams }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * speed;
  const tex = useMemo(() => dotTexture(), []);
  const base = useMemo(() => {
    const r = mulberry32(seed * 977 + 3);
    return Array.from({ length: count }, () => ({
      p: [r() - 0.5, r() - 0.5, r() - 0.5],
      v: [(r() - 0.5) * 0.03, (r() - 0.5) * 0.02 + 0.004, (r() - 0.5) * 0.03],
      ph: r() * 6.283,
      b: 0.35 + r() * 0.65,
    }));
  }, [count, seed]);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const col = useMemo(() => new THREE.Color(color), [color]);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const cl = geo.getAttribute("color") as THREE.BufferAttribute;
  const wrap = (v: number) => ((((v + 0.5) % 1) + 1) % 1) - 0.5;
  for (let i = 0; i < count; i++) {
    const m = base[i];
    const x = center[0] + wrap(m.p[0] + m.v[0] * t + Math.sin(t * 0.4 + m.ph) * 0.01) * box[0];
    const y = center[1] + wrap(m.p[1] + m.v[1] * t + Math.sin(t * 0.3 + m.ph * 2) * 0.008) * box[1];
    const z = center[2] + wrap(m.p[2] + m.v[2] * t + Math.cos(t * 0.35 + m.ph) * 0.01) * box[2];
    pos.setXYZ(i, x, y, z);
    let k = m.b * (0.75 + 0.25 * Math.sin(t * 2 + m.ph * 3));
    if (beams && beams.length) {
      let lit = 0;
      for (const b of beams) {
        const d = Math.hypot(x - b.x, z - b.z) / b.r;
        lit = Math.max(lit, Math.max(0, 1 - d * d));
      }
      k *= lit;
    }
    cl.setXYZ(i, col.r * k, col.g * k, col.b * k);
  }
  pos.needsUpdate = true;
  cl.needsUpdate = true;
  return (
    <points geometry={geo} frustumCulled={false} renderOrder={10}>
      <pointsMaterial
        map={tex}
        size={size}
        sizeAttenuation
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
};
