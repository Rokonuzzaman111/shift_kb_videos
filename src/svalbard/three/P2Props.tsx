/**
 * Part 2 props (all new looks — nothing reused from Part 1):
 *   FlipClock   split-flap year display (2026 → 2008)
 *   FarmTile    miniature crop-field diorama + its holographic "backup copy" + safe
 *   FlatMap     tilted world map with genebank pillars rising
 *   JarShelf    genebank shelf of glass seed jars
 *   Pedestal / Sprout / RicePlant / Shield / Pathogens   trait specimens
 *   Genebank    building diorama with war / flood / fire / power-failure damage
 *   Helix       DNA double helix that breaks apart
 */
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { LAND, drawLand } from "./Globe";
import { canvasTex, fbm, grain, rng, sstep } from "./util";

const useTime = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return f / fps;
};

/* ============================================================== FlipClock */
const digitTex = (() => {
  const cache: THREE.Texture[] = [];
  return (d: number) => {
    if (!cache[d]) {
      cache[d] = canvasTex(256, 360, (g) => {
        const grd = g.createLinearGradient(0, 0, 0, 360);
        grd.addColorStop(0, "#22272d");
        grd.addColorStop(0.5, "#15191d");
        grd.addColorStop(1, "#1d2227");
        g.fillStyle = grd;
        g.fillRect(0, 0, 256, 360);
        g.fillStyle = "#f2f6f8";
        g.font = "bold 300px Arial, Helvetica, sans-serif";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.fillText(String(d), 128, 192);
        g.fillStyle = "rgba(0,0,0,0.85)";
        g.fillRect(0, 178, 256, 5);
      });
    }
    return cache[d];
  };
})();

const halfGeo = (top: boolean) => {
  const g = new THREE.PlaneGeometry(1, 0.7);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setY(i, top ? 0.5 + uv.getY(i) * 0.5 : uv.getY(i) * 0.5);
  g.translate(0, top ? 0.35 : -0.35, 0);
  return g;
};
const TOP = halfGeo(true);
const BOT = halfGeo(false);

const FlapDigit: React.FC<{ readonly cur: number; readonly next: number; readonly k: number; readonly x: number }> = ({ cur, next, k, x }) => {
  const mat = (d: number, shade = 1) => (
    <meshStandardMaterial map={digitTex(d)} roughness={0.45} metalness={0.2} color={new THREE.Color(shade, shade, shade)} side={THREE.DoubleSide} />
  );
  const a = Math.min(1, k * 2); // first half: top flap falls to horizontal
  const b = Math.max(0, k * 2 - 1); // second half: bottom flap lands
  return (
    <group position={[x, 0, 0]}>
      <mesh geometry={TOP} position={[0, 0.006, -0.01]}>{mat(next, 0.92)}</mesh>
      <mesh geometry={BOT} position={[0, -0.006, -0.01]}>{mat(cur, 0.8)}</mesh>
      {k > 0 && k < 1 && a < 1 ? (
        <mesh geometry={TOP} rotation={[-a * (Math.PI / 2), 0, 0]} position={[0, 0.006, 0.005]}>
          {mat(cur, 1 - a * 0.5)}
        </mesh>
      ) : null}
      {k > 0.5 && k < 1 ? (
        <mesh geometry={BOT} rotation={[(1 - b) * (Math.PI / 2), 0, 0]} position={[0, -0.006, 0.005]}>
          {mat(next, 0.5 + b * 0.5)}
        </mesh>
      ) : null}
    </group>
  );
};

/** `p` 0..1 runs the year from `from` down to `to` (eased by the caller). */
export const FlipClock: React.FC<{ readonly from: number; readonly to: number; readonly p: number }> = ({ from, to, p }) => {
  const steps = Math.abs(from - to);
  const pos = p * steps;
  const n = Math.min(steps, Math.floor(pos));
  const k = n >= steps ? 0 : pos - n;
  const dir = to < from ? -1 : 1;
  const y0 = from + dir * n;
  const y1 = from + dir * Math.min(steps, n + 1);
  const d0 = String(y0).padStart(4, "0").split("").map(Number);
  const d1 = String(y1).padStart(4, "0").split("").map(Number);
  return (
    <group>
      {/* housing */}
      <mesh position={[0, 0, -0.18]} castShadow receiveShadow>
        <boxGeometry args={[5.1, 1.95, 0.32]} />
        <meshStandardMaterial color="#0c0e10" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, -1.05, 0.05]}>
        <boxGeometry args={[5.1, 0.12, 0.6]} />
        <meshStandardMaterial color="#b8c2c8" metalness={1} roughness={0.25} />
      </mesh>
      {d0.map((d, i) => (
        <FlapDigit key={i} cur={d} next={d1[i]} k={d === d1[i] ? 0 : k} x={-1.83 + i * 1.22} />
      ))}
      {/* hinge line */}
      <mesh position={[0, 0, 0.012]}>
        <boxGeometry args={[4.9, 0.025, 0.02]} />
        <meshStandardMaterial color="#050607" />
      </mesh>
    </group>
  );
};

/* ============================================================== FarmTile + Safe */
export const FarmTile: React.FC<{ readonly ghost?: boolean; readonly scan?: number }> = ({ ghost = false, scan = -1 }) => {
  const t = useTime();
  const crops = useMemo(() => {
    const r = rng(ghost ? 5 : 4);
    const out: { p: [number, number, number]; s: number; c: THREE.Color }[] = [];
    for (let row = 0; row < 9; row++) {
      for (let i = 0; i < 18; i++) {
        const x = -2.6 + row * 0.65;
        const z = -2.7 + i * 0.32 + (r() - 0.5) * 0.05;
        const field = row < 3 ? 0 : row < 6 ? 1 : 2; // green rice / golden wheat / maize
        const c = new THREE.Color(field === 0 ? "#4caf3a" : field === 1 ? "#d9a63b" : "#7fae2a").offsetHSL(0, 0, (r() - 0.5) * 0.08);
        out.push({ p: [x, 0.5, z], s: 0.8 + r() * 0.4, c });
      }
    }
    return out;
  }, [ghost]);
  const mesh = useMemo(() => {
    const g = new THREE.ConeGeometry(0.11, 0.42, 6);
    g.translate(0, 0.21, 0);
    const m = ghost
      ? new THREE.MeshBasicMaterial({ color: "#47d4ff", transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })
      : new THREE.MeshStandardMaterial({ roughness: 0.7 });
    const im = new THREE.InstancedMesh(g, m, crops.length);
    const mt = new THREE.Matrix4();
    crops.forEach((c, i) => {
      mt.makeScale(c.s, c.s, c.s).setPosition(...c.p);
      im.setMatrixAt(i, mt);
      if (!ghost) im.setColorAt(i, c.c);
    });
    im.castShadow = !ghost;
    return im;
  }, [crops, ghost]);
  // sway
  const mt = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  crops.forEach((c, i) => {
    e.set(Math.sin(t * 2 + c.p[0] * 2 + c.p[2]) * 0.08, 0, 0);
    q.setFromEuler(e);
    mt.compose(new THREE.Vector3(...c.p), q, new THREE.Vector3(c.s, c.s, c.s));
    mesh.setMatrixAt(i, mt);
  });
  mesh.instanceMatrix.needsUpdate = true;
  const soil = useMemo(() => canvasTex(256, 256, (g) => grain(g, 256, 256, [96, 70, 46], 40, 3), [3, 3]), []);
  return (
    <group>
      <mesh position={[0, 0.25, 0]} castShadow={!ghost} receiveShadow>
        <boxGeometry args={[6, 0.5, 6]} />
        {ghost ? (
          <meshBasicMaterial color="#47d4ff" wireframe transparent opacity={0.5} />
        ) : (
          [0, 1, 2, 3, 4, 5].map((i) => (
            <meshStandardMaterial key={i} attach={`material-${i}`} map={i === 2 ? soil : undefined} color={i === 2 ? "#a07a50" : "#5a3f28"} roughness={0.95} />
          ))
        )}
      </mesh>
      <primitive object={mesh} />
      {scan >= 0 && scan <= 1 ? (
        <mesh position={[-3 + scan * 6, 0.9, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[6.2, 1.4]} />
          <meshBasicMaterial color="#5fe3ff" transparent opacity={0.5} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
};

export const Safe: React.FC<{ readonly glow: number; readonly open: number }> = ({ glow, open }) => (
  <group>
    <mesh castShadow>
      <boxGeometry args={[2.2, 2.2, 2.2]} />
      <meshStandardMaterial color="#59636b" metalness={0.9} roughness={0.3} />
    </mesh>
    <group position={[-0.95, 0, 1.12]} rotation={[0, -open * 1.7, 0]}>
      <mesh position={[0.95, 0, 0]}>
        <boxGeometry args={[1.9, 1.9, 0.12]} />
        <meshStandardMaterial color="#77838c" metalness={0.95} roughness={0.25} />
      </mesh>
      <mesh position={[0.95, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.1, 32]} />
        <meshStandardMaterial color="#c9d2d8" metalness={1} roughness={0.15} />
      </mesh>
    </group>
    <mesh position={[0, 0, 1.0]}>
      <planeGeometry args={[1.8, 1.8]} />
      <meshBasicMaterial color="#5dffb0" transparent opacity={glow} toneMapped={false} />
    </mesh>
    <pointLight position={[0, 0, 2.2]} color="#5dffb0" intensity={glow * 25} distance={8} />
  </group>
);

/* ============================================================== FlatMap with genebank pillars */
const MAP_W = 16;
const MAP_H = 8;
export const mapXY = (lon: number, lat: number): [number, number] => [(lon / 180) * (MAP_W / 2), -(lat / 90) * (MAP_H / 2)];

const useLandPoints = (n: number) =>
  useMemo(() => {
    const W = 720;
    const H = 360;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const g = cv.getContext("2d")!;
    drawLand(g, W, H, LAND, "#fff", "#fff", 1);
    const img = g.getImageData(0, 0, W, H).data;
    const r = rng(19);
    const pts: { lon: number; lat: number; d: number; h: number }[] = [];
    let guard = 0;
    while (pts.length < n && guard++ < 50000) {
      const lon = -170 + r() * 340;
      const lat = -50 + r() * 120;
      const x = Math.floor(((lon + 180) / 360) * W);
      const y = Math.floor(((90 - lat) / 180) * H);
      if (img[(y * W + x) * 4] > 128 && (lat < 66 || r() < 0.15)) pts.push({ lon, lat, d: r(), h: 0.25 + r() * 0.6 });
    }
    return pts;
  }, [n]);

export const FlatMap: React.FC<{ readonly grow: number; readonly highlight: [number, number] }> = ({ grow, highlight }) => {
  const t = useTime();
  const tex = useMemo(
    () =>
      canvasTex(2048, 1024, (g) => {
        g.fillStyle = "#061423";
        g.fillRect(0, 0, 2048, 1024);
        g.strokeStyle = "rgba(120,200,255,0.12)";
        g.lineWidth = 1.5;
        for (let x = 0; x <= 2048; x += 2048 / 24) {
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, 1024);
          g.stroke();
        }
        for (let y = 0; y <= 1024; y += 1024 / 12) {
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(2048, y);
          g.stroke();
        }
        drawLand(g, 2048, 1024, LAND, "#173246", "rgba(110,210,255,0.8)", 2.5);
      }),
    [],
  );
  const pts = useLandPoints(260);
  const mesh = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.035, 0.035, 1, 6);
    g.translate(0, 0.5, 0);
    const m = new THREE.MeshBasicMaterial({ color: "#5dffb0", toneMapped: false });
    return new THREE.InstancedMesh(g, m, pts.length);
  }, [pts]);
  const mt = new THREE.Matrix4();
  pts.forEach((p, i) => {
    const k = sstep(p.d * 0.8, p.d * 0.8 + 0.2, grow);
    const [x, y] = mapXY(p.lon, p.lat);
    mt.makeScale(1, Math.max(0.0001, k * p.h * (1 + 0.08 * Math.sin(t * 3 + i))), 1).setPosition(x, 0, y);
    mesh.setMatrixAt(i, mt);
  });
  mesh.instanceMatrix.needsUpdate = true;
  const [hx, hy] = mapXY(highlight[0], highlight[1]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[MAP_W, MAP_H]} />
        <meshStandardMaterial map={tex} roughness={0.8} emissiveMap={tex} emissive="#ffffff" emissiveIntensity={0.35} />
      </mesh>
      <primitive object={mesh} />
      <mesh position={[hx, 0.02, hy]} rotation={[-Math.PI / 2, 0, 0]} scale={1 + 0.3 * Math.sin(t * 5)}>
        <ringGeometry args={[0.12, 0.17, 32]} />
        <meshBasicMaterial color="#f0b64a" toneMapped={false} transparent opacity={grow} />
      </mesh>
    </group>
  );
};

/* ============================================================== JarShelf */
const seedTex = (cols: string[], seed: number, shape: "long" | "oval" | "round") =>
  canvasTex(256, 256, (g) => {
    g.fillStyle = cols[0];
    g.fillRect(0, 0, 256, 256);
    const r = rng(seed);
    for (let i = 0; i < 900; i++) {
      g.save();
      g.translate(r() * 256, r() * 256);
      g.rotate(r() * Math.PI);
      g.fillStyle = cols[Math.floor(r() * cols.length)];
      const w = shape === "long" ? 3 : shape === "oval" ? 5 : 7;
      const h = shape === "long" ? 10 : shape === "oval" ? 8 : 7;
      g.beginPath();
      g.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.25)";
      g.beginPath();
      g.ellipse(-w * 0.3, -h * 0.3, w * 0.3, h * 0.3, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }, [2, 1]);

const JAR_KINDS: { cols: string[]; shape: "long" | "oval" | "round" }[] = [
  { cols: ["#e9dfc8", "#f4ecd9", "#d8ccb0"], shape: "long" }, // rice
  { cols: ["#b8752d", "#cf8f3c", "#9c6123"], shape: "oval" }, // wheat
  { cols: ["#f2b31f", "#e89d12", "#f7c94a"], shape: "round" }, // maize
  { cols: ["#7a3b2a", "#8f4a33", "#5f2b1e"], shape: "long" }, // red rice
  { cols: ["#3a3029", "#4a3e35", "#28211c"], shape: "long" }, // black rice
  { cols: ["#c9b26a", "#b59a52", "#dccb84"], shape: "oval" }, // barley
  { cols: ["#9e3b2f", "#c7564a", "#7a2a22"], shape: "round" }, // sorghum/beans
  { cols: ["#d9d2a6", "#c6be8d", "#ece6c3"], shape: "round" }, // chickpea
  { cols: ["#5b7a2e", "#6f8f3a", "#4a6524"], shape: "round" }, // lentil/peas
];

export const JAR_POS = (row: number, col: number): [number, number, number] => [-4.2 + col * 1.05, row * 1.25, 0];

export const JarShelf: React.FC = () => {
  const texs = useMemo(() => JAR_KINDS.map((k, i) => seedTex(k.cols, i + 3, k.shape)), []);
  const jars = useMemo(() => {
    const r = rng(8);
    const out: { p: [number, number, number]; k: number; h: number }[] = [];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 9; col++) out.push({ p: JAR_POS(row, col), k: row === 1 && col < 3 ? col : Math.floor(r() * JAR_KINDS.length), h: 0.6 + r() * 0.25 });
    return out;
  }, []);
  const wood = useMemo(() => canvasTex(512, 64, (g) => grain(g, 512, 64, [120, 86, 58], 30, 6), [4, 1]), []);
  return (
    <group>
      {[0, 1, 2, 3].map((row) => (
        <mesh key={row} position={[0, row * 1.25 - 0.06, 0]} receiveShadow castShadow>
          <boxGeometry args={[10.2, 0.08, 1.0]} />
          <meshStandardMaterial map={wood} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 2, -0.55]} receiveShadow>
        <boxGeometry args={[10.6, 5.6, 0.1]} />
        <meshStandardMaterial color="#d7dde0" roughness={0.9} />
      </mesh>
      {jars.map((j, i) => (
        <group key={i} position={j.p}>
          {/* seed fill */}
          <mesh position={[0, (j.h * 0.85) / 2, 0]} castShadow>
            <cylinderGeometry args={[0.36, 0.36, j.h * 0.85, 24]} />
            <meshStandardMaterial map={texs[j.k]} roughness={0.75} />
          </mesh>
          {/* glass */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 1.0, 28, 1, true]} />
            <meshPhysicalMaterial color="#e8f6ff" transparent opacity={0.22} roughness={0.05} metalness={0} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {/* lid */}
          <mesh position={[0, 1.04, 0]}>
            <cylinderGeometry args={[0.41, 0.41, 0.1, 28]} />
            <meshStandardMaterial color="#9aa6ae" metalness={0.9} roughness={0.3} />
          </mesh>
          {/* label */}
          <mesh position={[0, 0.35, 0.405]}>
            <planeGeometry args={[0.42, 0.24]} />
            <meshStandardMaterial color="#f7f4ea" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.39, 0.407]}>
            <planeGeometry args={[0.3, 0.025]} />
            <meshBasicMaterial color="#334" />
          </mesh>
          <mesh position={[0, 0.33, 0.407]}>
            <planeGeometry args={[0.22, 0.02]} />
            <meshBasicMaterial color="#667" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/* ============================================================== Specimen pedestal + plants */
export const Pedestal: React.FC<{ readonly rim: string; readonly soil: "dry" | "wet" | "rich" }> = ({ rim, soil }) => {
  const tex = useMemo(
    () =>
      canvasTex(512, 512, (g) => {
        if (soil === "dry") {
          grain(g, 512, 512, [176, 136, 92], 34, 2);
          const r = rng(3);
          g.strokeStyle = "rgba(60,36,18,0.9)";
          for (let k = 0; k < 70; k++) {
            let x = r() * 512;
            let y = r() * 512;
            g.lineWidth = 1 + r() * 3;
            g.beginPath();
            g.moveTo(x, y);
            for (let s = 0; s < 6; s++) {
              x += (r() - 0.5) * 80;
              y += (r() - 0.5) * 80;
              g.lineTo(x, y);
            }
            g.stroke();
          }
        } else grain(g, 512, 512, soil === "wet" ? [58, 46, 36] : [74, 52, 34], 40, 5);
      }),
    [soil],
  );
  return (
    <group>
      <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.6, 1.75, 1.2, 64]} />
        <meshStandardMaterial color="#1a1f24" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.6, 0.025, 8, 96]} />
        <meshBasicMaterial color={rim} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.55, 64]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
    </group>
  );
};

const leafGeo = (len: number, wid: number, bend: number) => {
  const g = new THREE.PlaneGeometry(wid, len, 2, 12);
  g.translate(0, len / 2, 0);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / len;
    const x = p.getX(i);
    p.setX(i, x * Math.sin(Math.PI * Math.min(1, y * 1.1 + 0.05)) * (1 - y * 0.6));
    p.setZ(i, bend * y * y * len + Math.abs(x) * 0.6);
  }
  g.computeVertexNormals();
  return g;
};

/** Young plant: stem + leaves. `grow` 0..1, `wilt` 0..1, `color` leaf colour. */
export const Sprout: React.FC<{ readonly grow: number; readonly wilt?: number; readonly color?: string; readonly sway?: number }> = ({
  grow,
  wilt = 0,
  color = "#4fb83c",
  sway = 1,
}) => {
  const t = useTime();
  const leaves = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({ geo: leafGeo(1.1 + (i % 3) * 0.35, 0.16, 0.35 + (i % 2) * 0.2), yaw: i * 2.4, tilt: 0.25 + (i % 3) * 0.15, h: 0.1 + i * 0.12 })),
    [],
  );
  const c = new THREE.Color(color).lerp(new THREE.Color("#8a7a3e"), wilt);
  return (
    <group scale={Math.max(0.001, grow)} rotation={[Math.sin(t * 1.6) * 0.04 * sway, 0, Math.sin(t * 1.2) * 0.05 * sway]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.04, 1.0, 8]} />
        <meshStandardMaterial color={c} roughness={0.6} />
      </mesh>
      {leaves.map((l, i) => (
        <mesh key={i} geometry={l.geo} position={[0, l.h, 0]} rotation={[l.tilt + wilt * 0.9 + Math.sin(t * 2 + i) * 0.03 * sway, l.yaw, 0]} castShadow>
          <meshStandardMaterial color={c.clone().offsetHSL(0, 0, (i % 3) * 0.03)} roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

/** Rice plant with drooping panicles; `heads` 0..1 grows the grain heads (yield). */
export const RicePlant: React.FC<{ readonly grow: number; readonly heads: number }> = ({ grow, heads }) => {
  const t = useTime();
  const blades = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ geo: leafGeo(1.6 + (i % 4) * 0.3, 0.09, 0.5 + (i % 3) * 0.25), yaw: i * 1.7, tilt: 0.15 + (i % 4) * 0.1 })), []);
  const panicles = useMemo(() => {
    const r = rng(12);
    return Array.from({ length: 6 }, (_, i) => {
      const yaw = (i / 6) * Math.PI * 2 + r() * 0.5;
      const grains = Array.from({ length: 26 }, (_, k) => ({ s: k / 26, off: (r() - 0.5) * 0.08 }));
      return { yaw, grains, len: 0.9 + r() * 0.3 };
    });
  }, []);
  const grainGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 8, 6);
    g.scale(0.022, 0.055, 0.022);
    return g;
  }, []);
  return (
    <group scale={Math.max(0.001, grow)}>
      {blades.map((b, i) => (
        <mesh key={i} geometry={b.geo} rotation={[b.tilt + Math.sin(t * 1.8 + i) * 0.03, b.yaw, 0]} castShadow>
          <meshStandardMaterial color={new THREE.Color("#5aa63a").offsetHSL(0, 0, (i % 3) * 0.03)} roughness={0.55} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {panicles.map((p, i) => (
        <group key={i} rotation={[0, p.yaw, 0]}>
          {p.grains.map((g, k) => {
            const s = g.s * p.len;
            const droop = s * s * 1.1 * heads;
            const show = sstep(g.s * 0.7, g.s * 0.7 + 0.3, heads);
            return (
              <mesh key={k} geometry={grainGeo} position={[g.off, 1.7 + s * 0.6 - droop, s * 0.45 + droop * 0.4]} scale={show} castShadow>
                <meshStandardMaterial color="#d9b24a" roughness={0.5} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
};

/** Fresnel energy shield bubble. */
export const Shield: React.FC<{ readonly k: number; readonly r?: number }> = ({ k, r = 1.5 }) => {
  const t = useTime();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uK: { value: 0 }, uT: { value: 0 } },
        vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix*mv; }`,
        fragmentShader: `uniform float uK; uniform float uT; varying vec3 vN; varying vec3 vV; varying vec3 vP;
          void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2);
            float hex = step(0.92, fract(vP.y*6.0 + uT*0.5)) * 0.5;
            float a = (f*1.2 + hex*0.25) * uK; gl_FragColor = vec4(vec3(0.3,0.85,1.0)*a, a); }`,
      }),
    [],
  );
  mat.uniforms.uK.value = k;
  mat.uniforms.uT.value = t;
  return (
    <mesh material={mat} position={[0, 0.9, 0]} scale={r * (0.7 + 0.3 * k)}>
      <sphereGeometry args={[1, 48, 32]} />
    </mesh>
  );
};

/** Red pathogen particles swarming in; once `shield` > 0 they bounce off at radius ~1.5. */
export const Pathogens: React.FC<{ readonly k: number; readonly shield: number }> = ({ k, shield }) => {
  const t = useTime();
  const items = useMemo(() => {
    const r = rng(23);
    return Array.from({ length: 60 }, () => ({ a: r() * Math.PI * 2, y: 0.3 + r() * 1.6, sp: 0.6 + r() * 0.8, ph: r() }));
  }, []);
  return (
    <group>
      {items.map((p, i) => {
        const approach = 4.2 - k * 3.4 * p.sp;
        const rad = shield > 0 ? Math.max(approach, 1.55 + shield * (1.0 + p.ph * 1.5)) : Math.max(0.35, approach);
        const a = p.a + t * 0.4;
        return (
          <mesh key={i} position={[Math.cos(a) * rad, p.y + Math.sin(t * 3 + i) * 0.08, Math.sin(a) * rad]} scale={0.06 + 0.03 * Math.sin(t * 6 + i)}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#ff3b3b" emissive="#ff2020" emissiveIntensity={2} roughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ============================================================== Genebank building diorama */
export const Genebank: React.FC<{ readonly war: number; readonly flood: number; readonly fire: number; readonly power: number; readonly ruin: number }> = ({
  war,
  flood,
  fire,
  power,
  ruin,
}) => {
  const t = useTime();
  const conc = useMemo(() => canvasTex(256, 256, (g) => grain(g, 256, 256, [196, 198, 196], 22, 7), [2, 2]), []);
  const windows = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let fl = 0; fl < 3; fl++) for (let i = 0; i < 7; i++) out.push([-2.4 + i * 0.8, 0.55 + fl * 0.85, 1.51]);
    return out;
  }, []);
  const flicker = power > 0 ? (Math.sin(t * 47) > 0.2 ? 1 : 0.1) * (1 - power) : 1;
  const lit = Math.max(0, flicker * (1 - ruin));
  const debris = useMemo(() => {
    const r = rng(31);
    return Array.from({ length: 80 }, () => ({ d: new THREE.Vector3(r() - 0.5, r() * 0.9 + 0.2, r() - 0.3).normalize(), s: 0.05 + r() * 0.12, sp: 2 + r() * 4, rot: r() * 6 }));
  }, []);
  const fireP = useMemo(() => {
    const r = rng(37);
    return Array.from({ length: 70 }, () => ({ x: (r() - 0.5) * 5, z: (r() - 0.5) * 2.4, ph: r(), s: 0.15 + r() * 0.25 }));
  }, []);
  const tilt = ruin * 0.12;
  return (
    <group>
      {/* base plot */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[9, 0.3, 6]} />
        <meshStandardMaterial color="#3e5a33" roughness={0.95} />
      </mesh>
      <group rotation={[tilt * 0.6, 0, -tilt]} position={[0, -ruin * 0.6, 0]}>
        <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 2.8, 3]} />
          <meshStandardMaterial map={conc} color={new THREE.Color("#d9dcdc").lerp(new THREE.Color("#2a2622"), Math.max(ruin, fire * 0.6))} roughness={0.85} />
        </mesh>
        <mesh position={[0, 2.95, 0]} castShadow>
          <boxGeometry args={[6.3, 0.2, 3.3]} />
          <meshStandardMaterial color="#4a5157" roughness={0.6} />
        </mesh>
        {/* sign */}
        <mesh position={[0, 3.3, 1.2]}>
          <boxGeometry args={[2.6, 0.45, 0.08]} />
          <meshStandardMaterial color="#0f1a22" emissive="#5dffb0" emissiveIntensity={1.4 * lit} />
        </mesh>
        {windows.map((w, i) => (
          <mesh key={i} position={w}>
            <planeGeometry args={[0.55, 0.5]} />
            <meshStandardMaterial color="#10161b" emissive="#ffe1a8" emissiveIntensity={(1.6 + (i % 3) * 0.3) * lit} />
          </mesh>
        ))}
      </group>
      {/* war: blast flash sphere + debris */}
      {war > 0 && war < 1 ? (
        <mesh position={[1.8, 1.6, 1.8]} scale={0.3 + war * 3.2}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial color="#ffb347" transparent opacity={(1 - war) * 0.85} toneMapped={false} />
        </mesh>
      ) : null}
      {war > 0
        ? debris.map((d, i) => {
            const tt = war * 1.2;
            const pos = d.d.clone().multiplyScalar(d.sp * tt).add(new THREE.Vector3(1.8, 1.6, 1.8));
            pos.y -= 4.9 * tt * tt * 0.5;
            if (pos.y < 0) pos.y = 0.05;
            return (
              <mesh key={i} position={pos} rotation={[d.rot + tt * 5, d.rot, 0]} scale={d.s} castShadow>
                <boxGeometry args={[1, 0.6, 0.8]} />
                <meshStandardMaterial color="#5b5550" roughness={0.9} />
              </mesh>
            );
          })
        : null}
      <pointLight position={[1.8, 2, 3]} color="#ff9a3c" intensity={war > 0 && war < 1 ? (1 - war) * 120 : 0} distance={20} />
      {/* flood water */}
      {flood > 0 ? (
        <mesh position={[0, flood * 1.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[9.4, 6.4, 40, 30]} />
          <meshPhysicalMaterial color="#3a6f8f" transparent opacity={0.72} roughness={0.15} metalness={0.1} clearcoat={1} />
        </mesh>
      ) : null}
      {/* fire */}
      {fire > 0
        ? fireP.map((f, i) => {
            const life = (t * 1.4 + f.ph) % 1;
            return (
              <mesh key={i} position={[f.x, 2.9 + life * 2.2, f.z]} scale={f.s * (1 - life) * fire * 2}>
                <sphereGeometry args={[1, 8, 6]} />
                <meshBasicMaterial color={life < 0.3 ? "#ffe08a" : life < 0.6 ? "#ff7a1a" : "#5a4a44"} transparent opacity={(1 - life) * 0.9} toneMapped={false} depthWrite={false} />
              </mesh>
            );
          })
        : null}
      <pointLight position={[0, 4, 2]} color="#ff7a1a" intensity={fire * (40 + 15 * Math.sin(t * 20))} distance={16} />
      {/* power failure sparks */}
      {power > 0 && power < 1
        ? Array.from({ length: 14 }, (_, i) => {
            const life = (t * 3 + i * 0.13) % 1;
            return (
              <mesh key={i} position={[-2.9 + (i % 3) * 0.1, 2.2 - life * 1.4, 1.6 + life * 0.6 * Math.sin(i)]} scale={0.04}>
                <sphereGeometry args={[1, 6, 4]} />
                <meshBasicMaterial color="#bfe9ff" toneMapped={false} />
              </mesh>
            );
          })
        : null}
    </group>
  );
};

/* ============================================================== DNA helix */
export const Helix: React.FC<{ readonly brk: number; readonly fade: number }> = ({ brk, fade }) => {
  const t = useTime();
  const parts = useMemo(() => {
    const r = rng(51);
    const out: { y: number; a: number; dir: THREE.Vector3; c: string }[] = [];
    const cols = ["#47d4ff", "#5dffb0", "#f0b64a", "#ff6b9a"];
    for (let i = 0; i < 46; i++) out.push({ y: -4.5 + i * 0.2, a: i * 0.42, dir: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), c: cols[Math.floor(r() * 4)] });
    return out;
  }, []);
  const spin = t * 0.6;
  return (
    <group rotation={[0, spin, 0.18]}>
      {parts.map((p, i) => {
        const inBreak = Math.abs(p.y - 0.3) < 1.6;
        const k = inBreak ? brk : 0;
        const off = p.dir.clone().multiplyScalar(k * (2 + (i % 5)));
        const o = (1 - k * 0.9) * (1 - fade * 0.85);
        const ca = Math.cos(p.a);
        const sa = Math.sin(p.a);
        const col = new THREE.Color(p.c).lerp(new THREE.Color("#2a3036"), fade);
        return (
          <group key={i} position={[off.x, p.y + off.y, off.z]} rotation={[k * i, 0, k * 2]}>
            <mesh position={[ca * 0.9, 0, sa * 0.9]}>
              <sphereGeometry args={[0.14, 16, 12]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.9 * o} transparent opacity={o} roughness={0.3} />
            </mesh>
            <mesh position={[-ca * 0.9, 0, -sa * 0.9]}>
              <sphereGeometry args={[0.14, 16, 12]} />
              <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.9 * o} transparent opacity={o} roughness={0.3} />
            </mesh>
            <mesh rotation={[0, -p.a, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 1.8, 8]} />
              <meshStandardMaterial color="#cfe8f5" emissive="#9fdcff" emissiveIntensity={0.5 * o} transparent opacity={o * 0.85} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const _unused = fbm;
