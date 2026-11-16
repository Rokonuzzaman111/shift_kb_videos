/**
 * Svalbard v2 · Part 5 D — tilted 3D relief map of Europe / Mediterranean (flat terrain, NOT a globe).
 * Coarse real coastlines (lon/lat) painted to a canvas land mask → displacement relief + colour; water plane on top.
 * mapPos(lon, lat) → world point on the map. FlightArc grows a teal arc; FieldBloom grows green field tiles.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { canvasTex, fbm, rng } from "../../three/util";
import { P } from "../palette";
import { useWaterMat } from "./Crops";

type V = readonly [number, number, number];
type LL = readonly [number, number][];

export const MAP = { lon0: -12, lon1: 42, lat0: 27, lat1: 82, k: 0.1, cx: 15, cz: 54.5, relief: 0.12 } as const;
const XS = Math.cos((55 * Math.PI) / 180);
export const MAP_W = (MAP.lon1 - MAP.lon0) * XS * MAP.k;
export const MAP_H = (MAP.lat1 - MAP.lat0) * MAP.k;
export const mapPos = (lon: number, lat: number, y = 0): [number, number, number] => [(lon - MAP.cx) * XS * MAP.k, y, (MAP.cz - lat) * MAP.k];

/* water bodies (painted over a land-filled canvas) */
const ATLANTIC: LL = [
  [-13, 26], [-13, 83], [43, 83], [43, 67.5], [33, 69.4], [28, 71], [24, 71], [19, 70], [15, 68.5], [12, 66], [10.5, 64.5], [8, 63], [5, 62], [5, 60],
  [5.5, 58.8], [7, 58], [8.5, 58.2], [10.5, 59.2], [11.2, 58.8], [11.8, 58], [12.6, 56.3], [12.4, 55.6], [10.6, 56.5], [10.6, 57.7], [8.1, 56.8],
  [8.6, 55.4], [8.6, 53.9], [7, 53.5], [5, 53], [4, 51.8], [2.5, 51.1], [1.5, 50.2], [-1.5, 49.7], [-1.9, 48.7], [-4.7, 48.4], [-2.5, 47.3],
  [-1.2, 46.0], [-1.5, 43.4], [-9, 43.2], [-9.5, 39], [-9, 37], [-6.5, 37], [-6, 36.2], [-5.6, 36.0], [-6, 35.8], [-6.8, 34.0], [-9.6, 30.4],
  [-10.2, 29], [-11.5, 27.5], [-13, 26],
];
const MED: LL = [
  [-5.6, 36.0], [-2, 36.7], [0.5, 38.8], [-0.3, 39.5], [3.2, 41.9], [3.1, 43.1], [6, 43.1], [8.5, 44.4], [10.2, 43.9], [11, 42.4], [12.5, 41.4],
  [15.6, 40.1], [15.7, 38.2], [16.6, 38.5], [17.2, 39.4], [16.6, 40.2], [18.5, 40.1], [17.0, 41.0], [15.0, 42.0], [13.6, 43.5], [12.3, 45.0],
  [13.7, 45.6], [15.5, 44.0], [19, 42], [19.5, 41.2], [20, 39.6], [21.2, 37.5], [21.7, 36.8], [23, 36.5], [23, 38], [24, 38.2], [22.9, 40.5],
  [26, 40.8], [26.2, 39.3], [27.3, 37.0], [28.5, 36.6], [30.6, 36.8], [32.5, 36.1], [36.2, 36.6], [35.9, 35.4], [35.5, 33.9], [35.1, 33.0],
  [34.3, 31.3], [32.3, 31.2], [29.9, 31.2], [25, 31.6], [20.1, 32.3], [19, 30.3], [15.2, 32.3], [11, 33.2], [10.2, 35], [11.1, 37.0], [9.8, 37.3],
  [8.6, 36.9], [3, 36.8], [-1, 35.6], [-2.9, 35.3], [-5.4, 35.9],
];
const BLACK: LL = [
  [28, 41.3], [29, 41.2], [31.5, 41.2], [35, 42], [38, 41], [41.5, 41.5], [41.7, 42.6], [39.8, 43.4], [37.5, 44.7], [36.5, 45.3], [35, 45],
  [33.5, 44.5], [32.5, 45.4], [33.5, 46], [31, 46.6], [30, 45.8], [29.6, 45.2], [28.6, 44], [27.8, 42.5],
];
const BALTIC: LL = [
  [12.6, 56.3], [12.9, 55.4], [14.2, 55.4], [16.5, 56.2], [16.6, 57.8], [18.6, 59.5], [17.5, 61], [17.4, 62.4], [21, 64], [22.4, 65.8], [25.4, 65],
  [21.3, 62.8], [21.5, 61], [22.9, 59.9], [30, 59.9], [28, 59.4], [24, 59.4], [23.5, 58.9], [24.3, 57.8], [21, 57.2], [21, 56], [19.9, 54.6],
  [18.5, 54.8], [14.2, 53.9], [11, 54.2], [10.6, 55], [12.4, 55.6],
];
const ISLANDS: LL[] = [
  // Great Britain, Ireland, Spitsbergen, Sicily, Sardinia, Corsica, Crete, Cyprus, Nordaustlandet
  [[-5.7, 50.1], [1.4, 51.2], [1.7, 52.7], [0.2, 53.5], [-1.6, 55.6], [-2.0, 57.6], [-3.3, 58.6], [-5, 58.6], [-6.2, 57.5], [-5.5, 56], [-4.9, 54.8], [-3.2, 54], [-4.8, 53.3], [-4.2, 52.3], [-5.3, 51.7], [-3, 51.4]],
  [[-6, 52.2], [-6.2, 53.9], [-5.5, 54.6], [-7.3, 55.3], [-8.5, 54.3], [-10, 54], [-9.4, 53], [-10.3, 51.8], [-8.5, 51.6]],
  [[10.9, 79.6], [15, 79.8], [18, 80.2], [21, 79.9], [22.5, 79.1], [20, 78.6], [18.5, 77.4], [16.5, 76.6], [14, 77.3], [13.5, 78.0], [11.5, 78.6]],
  [[12.4, 38.1], [15.6, 38.3], [15.1, 36.7], [12.4, 37.6]],
  [[8.4, 41.2], [9.8, 41], [9.6, 39.1], [8.4, 39], [8.2, 40.6]],
  [[8.6, 42.9], [9.5, 43], [9.5, 41.4], [8.8, 41.5]],
  [[23.5, 35.5], [26.3, 35.2], [24.5, 34.9]],
  [[32.3, 35.1], [34.6, 35.7], [33.8, 34.6]],
  [[18.5, 80.3], [24, 80.4], [27, 79.8], [21.5, 79.4]],
];

const CW = 540;
const CH = Math.round((CW * MAP_H) / MAP_W);
const toPx = (lon: number, lat: number): [number, number] => [((lon - MAP.lon0) / (MAP.lon1 - MAP.lon0)) * CW, ((MAP.lat1 - lat) / (MAP.lat1 - MAP.lat0)) * CH];
const poly = (g: CanvasRenderingContext2D, pts: LL) => {
  g.beginPath();
  pts.forEach(([lo, la], i) => (i ? g.lineTo(...toPx(lo, la)) : g.moveTo(...toPx(lo, la))));
  g.closePath();
  g.fill();
};

const buildMaps = () => {
  const mask = document.createElement("canvas");
  mask.width = CW;
  mask.height = CH;
  const g = mask.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, CW, CH);
  g.fillStyle = "#000";
  [ATLANTIC, MED, BLACK, BALTIC].forEach((w) => poly(g, w));
  g.fillStyle = "#fff";
  ISLANDS.forEach((i) => poly(g, i));
  const blur = document.createElement("canvas");
  blur.width = CW;
  blur.height = CH;
  const b = blur.getContext("2d")!;
  b.filter = "blur(6px)";
  b.drawImage(mask, 0, 0);
  const m = g.getImageData(0, 0, CW, CH).data;
  const bl = b.getImageData(0, 0, CW, CH).data;
  const r = rng(91);
  const height = canvasTex(CW, CH, (hg) => {
    const img = hg.createImageData(CW, CH);
    for (let y = 0; y < CH; y++)
      for (let x = 0; x < CW; x++) {
        const i = (y * CW + x) * 4;
        const land = bl[i] / 255;
        const mtn = Math.pow(fbm(x / 38, y / 38, 5), 2.2) * 1.6;
        const v = Math.max(0, Math.min(1, land * (0.08 + mtn) + (r() - 0.5) * 0.01));
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v * 255;
        img.data[i + 3] = 255;
      }
    hg.putImageData(img, 0, 0);
  });
  height.colorSpace = THREE.NoColorSpace;
  const color = canvasTex(CW, CH, (cg) => {
    const img = cg.createImageData(CW, CH);
    for (let y = 0; y < CH; y++)
      for (let x = 0; x < CW; x++) {
        const i = (y * CW + x) * 4;
        const land = m[i] / 255;
        const coast = bl[i] / 255;
        const mtn = Math.pow(fbm(x / 38, y / 38, 5), 2.2) * 1.6;
        const n = fbm(x / 9 + 50, y / 9, 3);
        const lat = MAP.lat1 - (y / CH) * (MAP.lat1 - MAP.lat0);
        // land: dry tan in the south, grey-olive mid, snowy far north + peaks
        const south = Math.max(0, Math.min(1, (42 - lat) / 10));
        const snow = Math.max(Math.max(0, Math.min(1, (lat - 70) / 6)), Math.max(0, Math.min(1, (mtn - 0.9) * 3)));
        let lr = 104 + 50 * south + n * 30;
        let lg = 108 + 30 * south + n * 26;
        let lb = 92 + 10 * south + n * 20;
        lr += (225 - lr) * snow;
        lg += (232 - lg) * snow;
        lb += (238 - lb) * snow;
        // water: deep night-steel, lighter shelf along the coast
        const shelf = coast * 0.6;
        const wr = 14 + 40 * shelf;
        const wg = 26 + 52 * shelf;
        const wb = 40 + 60 * shelf;
        img.data[i] = wr + (lr - wr) * land;
        img.data[i + 1] = wg + (lg - wg) * land;
        img.data[i + 2] = wb + (lb - wb) * land;
        img.data[i + 3] = 255;
      }
    cg.putImageData(img, 0, 0);
  });
  return { height, color };
};

export const MedMap: React.FC<{ readonly t: number }> = ({ t }) => {
  const maps = useMemo(() => buildMaps(), []);
  const water = useWaterMat("#0e1a28", 0.4, 0.02, 0.55);
  water.uni.uTime.value = t * 0.3;
  water.uni.uRip.value = 0.2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
        <planeGeometry args={[MAP_W, MAP_H, 270, Math.round((270 * MAP_H) / MAP_W)]} />
        <meshStandardMaterial map={maps.color} displacementMap={maps.height} displacementScale={MAP.relief} displacementBias={-0.004} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} material={water.m}>
        <planeGeometry args={[MAP_W, MAP_H]} />
      </mesh>
      {/* table edge so the map reads as a physical relief slab */}
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[MAP_W + 0.02, 0.08, MAP_H + 0.02]} />
        <meshStandardMaterial color="#1a2633" roughness={0.6} metalness={0.3} />
      </mesh>
    </group>
  );
};

/* ───────────── arcs ───────────── */
export const arcCurve = (a: V, b: V, h: number) => {
  const mid = new THREE.Vector3((a[0] + b[0]) / 2, h, (a[2] + b[2]) / 2);
  return new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), mid, new THREE.Vector3(...b));
};

export const FlightArc: React.FC<{ readonly from: V; readonly to: V; readonly h: number; readonly k: number }> = ({ from, to, h, k }) => {
  const curve = useMemo(() => arcCurve(from, to, h), [from, to, h]);
  const q = Math.round(Math.min(1, k) * 80) / 80;
  const geo = useMemo(() => {
    if (q <= 0.01) return null;
    const pts = Array.from({ length: 41 }, (_, i) => curve.getPoint((i / 40) * q));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.009, 6, false);
  }, [curve, q]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(P.vaultTeal).multiplyScalar(2.2) }), []);
  if (!geo) return null;
  const head = curve.getPoint(q);
  return (
    <group>
      <mesh geometry={geo} material={mat} />
      {k < 1 ? (
        <mesh position={head} material={mat}>
          <sphereGeometry args={[0.03, 12, 8]} />
        </mesh>
      ) : null}
    </group>
  );
};

/* ───────────── field bloom ───────────── */
export const FieldBloom: React.FC<{ readonly at: V; readonly k: number; readonly seed: number; readonly y?: number }> = ({ at, k, seed, y = 0.02 }) => {
  const N = 140;
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: N }, () => {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 0.32;
      return { x: Math.cos(a) * d, z: Math.sin(a) * d, d, s: 0.035 + r() * 0.03, ry: r() * 0.6, c: r() };
    });
  }, [seed]);
  const mesh = useMemo(() => {
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.7, emissive: "#2c5a24", emissiveIntensity: 0.6 }), N);
    const col = new THREE.Color();
    items.forEach((it, i) => im.setColorAt(i, col.set(it.c < 0.5 ? "#5f9a3c" : it.c < 0.8 ? "#7fae46" : "#a5b84e")));
    im.frustumCulled = false;
    return im;
  }, [items]);
  const m = new THREE.Matrix4();
  items.forEach((it, i) => {
    const g = Math.max(0, Math.min(1, (k * 0.4 - it.d) / 0.06));
    const s = it.s * g + 1e-5;
    m.compose(new THREE.Vector3(at[0] + it.x, y + 0.004 * g, at[2] + it.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, it.ry, 0)), new THREE.Vector3(s, 0.006 * g + 1e-5, s));
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};
