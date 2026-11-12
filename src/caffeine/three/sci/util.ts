/**
 * Shared helpers for the science3d components (owner: science3d).
 * Everything is deterministic: seeded noise, no clock time.
 */
import { random } from "remotion";
import * as THREE from "three";

/** Seeded 3D gradient (Perlin) noise, range about -1..1. */
export const makeNoise3 = (seed: string) => {
  const p = new Uint8Array(512);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random(`${seed}-perm-${i}`) * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const grad = (h: number, x: number, y: number, z: number) => {
    const hh = h & 15;
    const u = hh < 8 ? x : y;
    const v = hh < 4 ? y : hh === 12 || hh === 14 ? x : z;
    return ((hh & 1) === 0 ? u : -u) + ((hh & 2) === 0 ? v : -v);
  };
  return (x: number, y: number, z: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = fade(x);
    const v = fade(y);
    const w = fade(z);
    const A = p[X] + Y;
    const AA = p[A] + Z;
    const AB = p[A + 1] + Z;
    const B = p[X + 1] + Y;
    const BA = p[B] + Z;
    const BB = p[B + 1] + Z;
    return lerp(
      lerp(lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u), lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u), v),
      lerp(
        lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u),
        lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u),
        v,
      ),
      w,
    );
  };
};

export const smoothstep = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

let glowTex: THREE.CanvasTexture | null = null;
/** Soft radial glow sprite texture (cached, white, use with color + additive blending). */
export const glowTexture = () => {
  if (glowTex) return glowTex;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.22, "rgba(255,255,255,0.55)");
  g.addColorStop(0.55, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
};

type V3 = readonly [number, number, number];

/**
 * Camera target that puts `subject` at screen height `yPx` (of 1920) instead of the centre,
 * so heroes sit at the frame-grammar centre (y ≈ 850). Small-angle approximation.
 */
export const aimAt = (cam: V3, subject: V3, mm: number, yPx = 850): [number, number, number] => {
  const d = Math.hypot(cam[0] - subject[0], cam[1] - subject[1], cam[2] - subject[2]);
  const halfH = (d * 17.5) / mm;
  const off = ((960 - yPx) / 960) * halfH;
  // shift target along camera-space "down" (approx world down projected)
  const fwd = new THREE.Vector3(subject[0] - cam[0], subject[1] - cam[1], subject[2] - cam[2]).normalize();
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
  return [subject[0] - up.x * off, subject[1] - up.y * off, subject[2] - up.z * off];
};

export const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Deterministic random in [a,b). */
export const rnd = (seed: string, a = 0, b = 1) => a + random(seed) * (b - a);

/** Smooth overshoot settle (0→1) for "snap" docking. */
export const snap = (k: number) => {
  if (k <= 0) return 0;
  if (k >= 1) return 1;
  const c = 1.70158 * 1.2;
  const x = k - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
