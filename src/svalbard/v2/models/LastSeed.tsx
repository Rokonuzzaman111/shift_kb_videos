/**
 * Svalbard v2 · Part 2 ending — one last seed on dark stone (metres; seed ≈ 12 mm long, resting on y = 0).
 * `crack` 0…1 opens the shell into 8 pieces (dark interior shows through the gaps);
 * `crumble` 0…1 erodes the pieces windward-first into dust that blows away (+x) or settles on the stone.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { canvasTex, fbm, rng } from "../../three/util";
import { Instanced } from "./Corridor";
import { m4 } from "./SeedMacro";

type V = readonly [number, number, number];
export const SEED_DIM: V = [0.006, 0.0032, 0.0037];

const seedTex = () =>
  canvasTex(256, 128, (g) => {
    const img = g.createImageData(256, 128);
    const r = rng(19);
    for (let y = 0; y < 128; y++)
      for (let x = 0; x < 256; x++) {
        const n = fbm(x / 22, y / 22, 4);
        const sp = fbm(x / 6 + 9, y / 6, 2) > 0.66 ? 0.55 : 1;
        const i = (y * 256 + x) * 4;
        const v = (0.7 + 0.5 * n) * sp * (0.95 + r() * 0.08);
        img.data[i] = 128 * v;
        img.data[i + 1] = 80 * v;
        img.data[i + 2] = 44 * v;
        img.data[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
  });

const PIECES = (() => {
  const out: { phi: number; th: number; dir: THREE.Vector3; order: number }[] = [];
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 2; j++) {
      const phi = i * (Math.PI / 2);
      const th = j * (Math.PI / 2);
      const pc = phi + Math.PI / 4;
      const tc = th + Math.PI / 4;
      // three's sphere: x = -cos(phi) sin(th), y = cos(th), z = sin(phi) sin(th)
      const dir = new THREE.Vector3(-Math.cos(pc) * Math.sin(tc), Math.cos(tc), Math.sin(pc) * Math.sin(tc));
      out.push({ phi, th, dir, order: 0 });
    }
  // erode windward (−x) pieces first
  const sorted = [...out].sort((a, b) => a.dir.x - b.dir.x);
  sorted.forEach((p, k) => (p.order = k / (sorted.length - 1)));
  return out;
})();

export const LastSeed: React.FC<{ readonly crack: number; readonly crumble: number; readonly t: number }> = ({ crack, crumble, t }) => {
  const mats = useMemo(() => {
    const map = seedTex();
    const shell = new THREE.MeshPhysicalMaterial({ map, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.2, sheenColor: new THREE.Color("#e8d2b0"), side: THREE.DoubleSide, bumpMap: map, bumpScale: 0.6 });
    const core = new THREE.MeshStandardMaterial({ color: "#3a2416", roughness: 0.95 });
    const dust = new THREE.MeshStandardMaterial({ color: "#7c5434", roughness: 1 });
    const grit = new THREE.MeshStandardMaterial({ color: "#4a4f55", roughness: 0.9 });
    return { shell, core, dust, grit };
  }, []);
  const geos = useMemo(() => PIECES.map((p) => new THREE.SphereGeometry(1, 14, 10, p.phi, Math.PI / 2, p.th, Math.PI / 2)), []);
  const ico = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);

  const dust = useMemo(() => {
    const r = rng(1234);
    return Array.from({ length: 1500 }, () => {
      const u = r() * 2 - 1;
      const a = r() * Math.PI * 2;
      const rr = Math.cbrt(r());
      const q = Math.sqrt(1 - u * u);
      const p: V = [q * Math.cos(a) * rr * SEED_DIM[0], SEED_DIM[1] + u * rr * SEED_DIM[1], q * Math.sin(a) * rr * SEED_DIM[2]];
      const xn = (p[0] / SEED_DIM[0] + 1) / 2;
      return { p, rel: xn * 0.55 + r() * 0.45, s: 0.00009 + Math.pow(r(), 2) * 0.00028, settle: r() < 0.3, w: 0.6 + r() * 0.8, ph: r() * 6.28 };
    });
  }, []);
  const grit = useMemo(() => {
    const r = rng(4321);
    return Array.from({ length: 70 }, () => {
      const s = 0.0002 + Math.pow(r(), 3) * 0.0012;
      return m4([(r() - 0.5) * 0.08, s * 0.4, (r() - 0.5) * 0.06 - 0.005], [s, s * 0.6, s * 0.9], [r() * 3, r() * 3, r() * 3]);
    });
  }, []);

  // dust: released over crumble 0…0.85 (windward first), then flies for ~2 s of `t`-equivalent progress
  const dustMats: THREE.Matrix4[] = [];
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const d of dust) {
    const a = (crumble - d.rel * 0.75) * 2.6; // pseudo-seconds since release
    if (a <= 0) {
      dustMats.push(zero);
      continue;
    }
    let x = d.p[0];
    let y = d.p[1];
    let z = d.p[2];
    if (d.settle) {
      x += 0.004 * a;
      y = Math.max(d.s * 0.5, y - 0.02 * a * a);
      z += Math.sin(d.ph) * 0.002 * Math.min(a, 1);
    } else {
      x += d.w * (0.012 * a + 0.018 * a * a);
      y += 0.006 * a * d.w + Math.sin(a * 3 + d.ph) * 0.0015;
      z += Math.sin(a * 2 + d.ph) * 0.004 * a;
    }
    const k = d.settle ? 1 : Math.max(0, 1 - a / 2.6);
    if (k <= 0) {
      dustMats.push(zero);
      continue;
    }
    dustMats.push(m4([x, y, z], [d.s * k, d.s * k, d.s * k], [d.ph + t, d.ph, 0]));
  }

  const gap = 0.07 * Math.min(1, crack * 1.2);
  const coreK = Math.max(0, 1 - crumble * 1.25);
  return (
    <group>
      <group position={[0, SEED_DIM[1], 0]} scale={SEED_DIM as [number, number, number]} rotation={[0, 0.35, 0]}>
        {PIECES.map((p, i) => {
          const er = Math.min(1, Math.max(0, (crumble - p.order * 0.6) / 0.35));
          const k = 1 - er;
          if (k <= 0.01) return null;
          const off = p.dir.clone().multiplyScalar(gap + 0.15 * er);
          return (
            <mesh key={i} geometry={geos[i]} material={mats.shell} position={[off.x, off.y - 0.4 * er, off.z]} scale={[k, k, k]} rotation={[gap * p.dir.z * 2, 0, -gap * p.dir.x * 2]} castShadow receiveShadow />
          );
        })}
        {coreK > 0.01 ? (
          <mesh material={mats.core} scale={[0.9 * coreK, 0.88 * coreK, 0.9 * coreK]} position={[0, -0.1 * (1 - coreK), 0]} castShadow>
            <sphereGeometry args={[1, 20, 14]} />
          </mesh>
        ) : null}
      </group>
      <Instanced geo={ico} mat={mats.dust} mats={dustMats} shadows />
      <Instanced geo={ico} mat={mats.grit} mats={grit} shadows />
    </group>
  );
};
