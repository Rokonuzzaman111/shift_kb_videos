/**
 * OWNER: props3d. Study-desk props (1 unit = 10 cm, desk surface at y = 0).
 * OpenBook, Pencil, DeskLamp (with its spot light), BookStack, NightWindow.
 */
import { useMemo } from "react";
import * as THREE from "three";
import { pageEdgeTexture, pageTexture } from "./tex";

const PAGE_W = 1.48;
const PAGE_D = 2.08;
const COVER = 0.035;

/** Page surface height (above cover) at s = distance from spine / page width. */
const pageH = (s: number) => 0.035 + 0.15 * (1 - Math.pow(1 - s, 2.6)) * (1 - 0.32 * s * s);

const pageGeometries = (sign: 1 | -1) => {
  const NX = 48;
  const NZ = 4;
  // top surface
  const top: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let iz = 0; iz <= NZ; iz++) {
    for (let ix = 0; ix <= NX; ix++) {
      const s = ix / NX;
      const z = -PAGE_D / 2 + (iz / NZ) * PAGE_D;
      // slight curl at the outer corners
      const curl = 0.02 * Math.pow(s, 4) * Math.abs((z / PAGE_D) * 2);
      top.push(sign * s * PAGE_W, COVER + pageH(s) + curl, z);
      uv.push(sign > 0 ? s : 1 - s, 1 - iz / NZ);
    }
  }
  for (let iz = 0; iz < NZ; iz++) {
    for (let ix = 0; ix < NX; ix++) {
      const a = iz * (NX + 1) + ix;
      const b = a + 1;
      const c = a + NX + 1;
      const d = c + 1;
      if (sign > 0) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  }
  const gTop = new THREE.BufferGeometry();
  gTop.setAttribute("position", new THREE.Float32BufferAttribute(top, 3));
  gTop.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  gTop.setIndex(idx);
  gTop.computeVertexNormals();

  // page-block edges: front, back (follow the curve) and outer edge
  const ep: number[] = [];
  const eu: number[] = [];
  const ei: number[] = [];
  const quad = (p: number[][], u: number[][]) => {
    const base = ep.length / 3;
    p.forEach((v) => ep.push(...v));
    u.forEach((v) => eu.push(...v));
    ei.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  for (const zs of [-1, 1]) {
    const z = (zs * PAGE_D) / 2;
    for (let ix = 0; ix < NX; ix++) {
      const s0 = ix / NX;
      const s1 = (ix + 1) / NX;
      const h0 = COVER + pageH(s0);
      const h1 = COVER + pageH(s1);
      quad(
        [
          [sign * s0 * PAGE_W, COVER, z],
          [sign * s1 * PAGE_W, COVER, z],
          [sign * s1 * PAGE_W, h1, z],
          [sign * s0 * PAGE_W, h0, z],
        ],
        [
          [0, 0],
          [0.2, 0],
          [0.2, h1 * 30],
          [0, h0 * 30],
        ],
      );
    }
  }
  const hE = COVER + pageH(1);
  quad(
    [
      [sign * PAGE_W, COVER, -PAGE_D / 2],
      [sign * PAGE_W, COVER, PAGE_D / 2],
      [sign * PAGE_W, hE, PAGE_D / 2],
      [sign * PAGE_W, hE, -PAGE_D / 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, hE * 30],
      [0, hE * 30],
    ],
  );
  const gEdge = new THREE.BufferGeometry();
  gEdge.setAttribute("position", new THREE.Float32BufferAttribute(ep, 3));
  gEdge.setAttribute("uv", new THREE.Float32BufferAttribute(eu, 2));
  gEdge.setIndex(ei);
  gEdge.computeVertexNormals();
  return { gTop, gEdge };
};

export const OpenBook: React.FC<{
  readonly position: readonly [number, number, number];
  readonly rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  const R = useMemo(() => pageGeometries(1), []);
  const L = useMemo(() => pageGeometries(-1), []);
  const texL = useMemo(() => pageTexture(0), []);
  const texR = useMemo(() => pageTexture(1), []);
  const edge = useMemo(pageEdgeTexture, []);
  return (
    <group position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, COVER / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[PAGE_W * 2 + 0.12, COVER, PAGE_D + 0.1]} />
        <meshStandardMaterial color="#1c3049" roughness={0.85} />
      </mesh>
      {[L, R].map((g, i) => (
        <group key={i}>
          <mesh geometry={g.gTop} castShadow receiveShadow>
            <meshStandardMaterial map={i === 0 ? texL : texR} color="#d9d2c4" roughness={0.92} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={g.gEdge} receiveShadow>
            <meshStandardMaterial map={edge} roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const Pencil: React.FC<{ readonly position: readonly [number, number, number]; readonly rotationY?: number }> = ({ position, rotationY = 0 }) => {
  const L = 1.5;
  const r = 0.042;
  return (
    <group position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
      <group rotation={[0, 0, Math.PI / 2]} position={[0, r, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[r, r, L, 6]} />
          <meshPhysicalMaterial color="#e3a91f" roughness={0.35} clearcoat={0.6} flatShading />
        </mesh>
        <mesh position={[0, -L / 2 - 0.09, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <cylinderGeometry args={[0.012, r * 0.95, 0.18, 6]} />
          <meshStandardMaterial color="#d8b083" roughness={0.8} />
        </mesh>
        <mesh position={[0, -L / 2 - 0.2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.013, 0.05, 8]} />
          <meshStandardMaterial color="#2b2b2b" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, L / 2 + 0.06, 0]} castShadow>
          <cylinderGeometry args={[r * 1.05, r * 1.05, 0.12, 16]} />
          <meshStandardMaterial color="#cfcfc8" metalness={1} roughness={0.3} />
        </mesh>
        <mesh position={[0, L / 2 + 0.17, 0]} castShadow>
          <cylinderGeometry args={[r, r, 0.12, 16]} />
          <meshStandardMaterial color="#e8837a" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};

const Rod: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; r: number; mat: React.ReactNode }> = ({ a, b, r, mat }) => {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return (
    <mesh position={mid} quaternion={q} castShadow>
      <cylinderGeometry args={[r, r, a.distanceTo(b), 14]} />
      {mat}
    </mesh>
  );
};

const shadeGeometry = () => {
  // mouth → top so lathe normals face outward
  const pts = [
    [0.6, -0.78],
    [0.585, -0.76],
    [0.5, -0.6],
    [0.36, -0.36],
    [0.22, -0.14],
    [0.15, -0.02],
    [0.13, 0.08],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.LatheGeometry(pts, 64);
  g.computeVertexNormals();
  return g;
};

/**
 * Architect-style desk lamp: weighted base, two-arm stem, dark metal shade aimed at `aim`.
 * Carries the warm spot light (shadow-casting) and an emissive bulb. `on` 0..1.
 */
export const DeskLamp: React.FC<{
  readonly base: readonly [number, number, number];
  readonly head: readonly [number, number, number];
  readonly aim: readonly [number, number, number];
  readonly on: number;
}> = ({ base, head, aim, on }) => {
  const shade = useMemo(shadeGeometry, []);
  const target = useMemo(() => new THREE.Object3D(), []);
  const B = new THREE.Vector3(...base);
  const H = new THREE.Vector3(...head);
  const A = new THREE.Vector3(...aim);
  const dir = A.clone().sub(H).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  const elbow = new THREE.Vector3(B.x - 0.2, B.y + 2.6, B.z - 0.5);
  const post = new THREE.Vector3(B.x, B.y + 0.35, B.z);
  const tail = H.clone().sub(dir.clone().multiplyScalar(0.12));
  const bulbPos = H.clone().add(dir.clone().multiplyScalar(0.2));
  target.position.copy(A);
  const metal = <meshStandardMaterial color="#202622" metalness={0.75} roughness={0.32} />;
  const warm = new THREE.Color("#ffc781");
  return (
    <group>
      <primitive object={target} />
      <mesh position={[B.x, B.y + 0.06, B.z]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.56, 0.12, 48]} />
        {metal}
      </mesh>
      <Rod a={new THREE.Vector3(B.x, B.y + 0.1, B.z)} b={post} r={0.06} mat={metal} />
      <Rod a={post} b={elbow} r={0.045} mat={metal} />
      <Rod a={elbow} b={tail} r={0.04} mat={metal} />
      <mesh position={elbow}>
        <sphereGeometry args={[0.08, 16, 12]} />
        {metal}
      </mesh>
      <mesh position={post}>
        <sphereGeometry args={[0.08, 16, 12]} />
        {metal}
      </mesh>
      <group position={H} quaternion={q}>
        <mesh geometry={shade} castShadow>
          <meshStandardMaterial color="#1f2b24" metalness={0.6} roughness={0.3} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={shade}>
          <meshStandardMaterial color="#d8cdb8" roughness={0.55} emissive={warm} emissiveIntensity={on * 0.06} side={THREE.BackSide} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.1, 0.13, 0.14, 24]} />
          {metal}
        </mesh>
        <mesh position={[0, -0.24, 0]}>
          <sphereGeometry args={[0.15, 24, 16]} />
          <meshStandardMaterial color="#fff2dc" emissive={warm} emissiveIntensity={0.15 + on * 9} toneMapped={false} />
        </mesh>
        {/* lights the inside of the shade with a natural falloff */}
        <pointLight position={[0, -0.3, 0]} color="#ffcf94" intensity={on * 0.9} distance={1.4} decay={2} />
      </group>
      <spotLight
        position={bulbPos}
        target={target}
        color="#ffcf94"
        intensity={on * 24}
        angle={0.78}
        penumbra={0.85}
        decay={2}
        distance={0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={6}
        shadow-camera-near={0.3}
        shadow-camera-far={20}
      />
      {/* warm bounce from the lit page / desk */}
      <pointLight position={[A.x, A.y + 0.8, A.z + 0.6]} color="#ffb877" intensity={on * 1.6} distance={9} decay={2} />
    </group>
  );
};

/** Three closed books, slightly misaligned. */
export const BookStack: React.FC<{ readonly position: readonly [number, number, number]; readonly rotationY?: number }> = ({ position, rotationY = 0 }) => {
  const edge = useMemo(pageEdgeTexture, []);
  const books = [
    { w: 2.3, d: 1.7, h: 0.28, c: "#5b1e1a", r: 0.04 },
    { w: 2.1, d: 1.55, h: 0.22, c: "#1f4a3a", r: -0.08 },
    { w: 1.9, d: 1.4, h: 0.3, c: "#2a2f4f", r: 0.12 },
  ];
  let y = 0;
  return (
    <group position={position as [number, number, number]} rotation={[0, rotationY, 0]}>
      {books.map((b, i) => {
        const yy = y + b.h / 2;
        y += b.h;
        return (
          <group key={i} position={[0, yy, 0]} rotation={[0, b.r, 0]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[0, (s * (b.h - 0.03)) / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[b.w, 0.03, b.d]} />
                <meshStandardMaterial color={b.c} roughness={0.75} />
              </mesh>
            ))}
            <mesh position={[-b.w / 2 + 0.02, 0, 0]} castShadow>
              <boxGeometry args={[0.05, b.h, b.d]} />
              <meshStandardMaterial color={b.c} roughness={0.75} />
            </mesh>
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[b.w - 0.08, b.h - 0.05, b.d - 0.08]} />
              <meshStandardMaterial map={edge} roughness={0.95} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/** Night window on the back wall: deep-blue sky glow, a moon, and a dark frame with a cross bar. */
export const NightWindow: React.FC<{ readonly position: readonly [number, number, number]; readonly w?: number; readonly h?: number }> = ({ position, w = 3.2, h = 4 }) => {
  const sky = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#0b1530");
    g.addColorStop(0.7, "#1d2f58");
    g.addColorStop(1, "#2c3d63");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const frame = <meshStandardMaterial color="#17110d" roughness={0.7} />;
  const bar = 0.12;
  return (
    <group position={position as [number, number, number]}>
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      <mesh position={[w * 0.22, h * 0.24, 0.01]}>
        <circleGeometry args={[0.32, 40]} />
        <meshBasicMaterial color={new THREE.Color("#e6eeff").multiplyScalar(2.2)} toneMapped={false} />
      </mesh>
      {[
        [0, h / 2, w + bar * 2, bar * 1.6],
        [0, -h / 2, w + bar * 2, bar * 1.6],
        [0, 0, w, bar],
      ].map(([x, y, ww, hh], i) => (
        <mesh key={`h${i}`} position={[x, y, 0.08]}>
          <boxGeometry args={[ww, hh, 0.16]} />
          {frame}
        </mesh>
      ))}
      {[-w / 2, 0, w / 2].map((x, i) => (
        <mesh key={`v${i}`} position={[x, 0, 0.08]}>
          <boxGeometry args={[i === 1 ? bar : bar * 1.6, h, 0.16]} />
          {frame}
        </mesh>
      ))}
    </group>
  );
};
