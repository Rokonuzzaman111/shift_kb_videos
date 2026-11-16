/** Deterministic helpers for the Svalbard 3D scenes (no Math.random: every frame must render the same). */
import * as THREE from "three";

export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const smooth = (t: number) => t * t * (3 - 2 * t);

/** value noise, roughly 0..1 */
export const noise2 = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
};

export const fbm = (x: number, y: number, oct = 5) => {
  let v = 0;
  let amp = 0.5;
  let f = 1;
  for (let i = 0; i < oct; i++) {
    v += amp * noise2(x * f, y * f);
    f *= 2.03;
    amp *= 0.5;
  }
  return v;
};

export const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export type V3 = readonly [number, number, number];

/**
 * Screen position (px) of a world point for a camera defined like <Lens/> (focal length on three's 35 mm film gauge).
 * Used to pin 2D labels onto 3D objects.
 */
export const project = (
  cam: { position: V3; target: V3; mm: number },
  p: V3,
  width: number,
  height: number,
): { x: number; y: number; visible: boolean } => {
  const c = new THREE.PerspectiveCamera(40, width / height, 0.01, 5000);
  c.setFocalLength(cam.mm);
  c.position.set(...cam.position);
  c.lookAt(...cam.target);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(c);
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height, visible: v.z < 1 && v.z > -1 };
};

/** lat/lon (deg) → point on a sphere of radius r (y up, lon 0 facing +z) */
export const latLon = (lat: number, lon: number, r = 1): [number, number, number] => {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo)];
};

/** canvas → texture helper (textures are built once per mount, deterministic) */
export const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
};

/** grey noise canvas (concrete / ice / rock grain) */
export const grain = (g: CanvasRenderingContext2D, w: number, h: number, base: [number, number, number], amp: number, seed = 1) => {
  const r = rng(seed);
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = (fbm(x / 40 + seed, y / 40, 4) - 0.5) * amp + (r() - 0.5) * amp * 0.5;
      const i = (y * w + x) * 4;
      img.data[i] = Math.max(0, Math.min(255, base[0] + n));
      img.data[i + 1] = Math.max(0, Math.min(255, base[1] + n));
      img.data[i + 2] = Math.max(0, Math.min(255, base[2] + n));
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
};
