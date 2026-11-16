/**
 * Platåberget slope + the Seed Vault entrance portal.
 * World: portal front door at the origin, facing +z; the mountain rises toward −z.
 * Terrain shading: snow, with dark rock showing on steep faces (like Svalbard's striped mountains).
 */
import { useMemo } from "react";
import * as THREE from "three";
import { canvasTex, fbm, grain, rng, sstep } from "./util";

/** terrain height at (x, z) */
export const terrainH = (x: number, z: number) => {
  const back = Math.max(0, -z - 6);
  let h = Math.min(46, back * 0.45) * (1 - 0.18 * Math.sin(x * 0.012));
  h += fbm(x * 0.012, z * 0.012, 5) * 34 * sstep(0, 40, back) - 6 * sstep(0, 40, back);
  // gullies streaking down the slope
  h -= Math.pow(Math.abs(Math.sin(x * 0.045 + fbm(x * 0.01, z * 0.02) * 3)), 6) * 6 * sstep(5, 60, back);
  // valley floor with soft drifts, far side drops toward the fjord
  h += (fbm(x * 0.03 + 9, z * 0.03, 3) - 0.5) * 2.2;
  h -= sstep(40, 160, z) * 14;
  // flat pad in front of the door
  const pad = sstep(14, 6, Math.hypot(x * 0.7, z - 8));
  return h * (1 - pad) + pad * 0;
};

export const Terrain: React.FC<{ readonly size?: number; readonly seg?: number; readonly snowTint?: string }> = ({
  size = 900,
  seg = 220,
  snowTint = "#e9f3fb",
}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, terrainH(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    const n = g.attributes.normal as THREE.BufferAttribute;
    const col = new Float32Array(p.count * 3);
    const snow = new THREE.Color(snowTint);
    const rock = new THREE.Color("#2b2a2c");
    const rock2 = new THREE.Color("#4a4440");
    const tmp = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const steep = 1 - n.getY(i);
      const x = p.getX(i);
      const z = p.getZ(i);
      const strata = 0.5 + 0.5 * Math.sin(p.getY(i) * 0.9 + fbm(x * 0.05, z * 0.05) * 4);
      const r = sstep(0.16, 0.34, steep + (fbm(x * 0.08, z * 0.08, 3) - 0.5) * 0.25) * (0.55 + 0.45 * strata);
      tmp.copy(snow).lerp(strata > 0.5 ? rock : rock2, r);
      col.set([tmp.r, tmp.g, tmp.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, [size, seg, snowTint]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0} />
    </mesh>
  );
};

/** Portal side profile (z, y): front face at z=0, runs 24 m back into the slope. */
const PROFILE: [number, number][] = [
  [0, 0],
  [0, 6.6],
  [0.9, 7.7],
  [24, 9.6],
  [24, -1],
  [0, -1],
];
export const PORTAL_W = 4.8;

/**
 * Entrance portal. `art` 0..1 = how strongly the turquoise art installation glows; `door` 0..1 opens the steel door.
 */
export const Portal: React.FC<{ readonly art?: number; readonly door?: number; readonly lamp?: number }> = ({
  art = 1,
  door = 0,
  lamp = 1,
}) => {
  const { body, concrete, tris } = useMemo(() => {
    const shape = new THREE.Shape();
    PROFILE.forEach(([z, y], i) => (i === 0 ? shape.moveTo(z, y) : shape.lineTo(z, y)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: PORTAL_W, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 1 });
    // shape is in (x=z_back, y); rotate so profile x → −z and extrusion → x
    g.rotateY(Math.PI / 2);
    g.translate(-PORTAL_W / 2, 0, 0);
    const tex = canvasTex(512, 512, (c) => {
      grain(c, 512, 512, [176, 178, 176], 26, 3);
      c.strokeStyle = "rgba(60,60,60,0.25)";
      c.lineWidth = 2;
      for (let y = 0; y < 512; y += 128) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(512, y);
        c.stroke();
      }
    }, [2, 2]);
    // art: triangles on the upper front face + first part of the roof
    const r = rng(11);
    const list: { p: [number, number, number]; rot: number; s: number; b: number; roof: boolean }[] = [];
    const cols = 9;
    for (let row = 0; row < 7; row++) {
      for (let c = 0; c < cols; c++) {
        const x = -PORTAL_W / 2 + 0.3 + (c + (row % 2) * 0.5) * ((PORTAL_W - 0.6) / cols);
        if (x > PORTAL_W / 2 - 0.25) continue;
        list.push({ p: [x, 4.0 + row * 0.38, 0.09], rot: (row + c) % 2 ? 0 : Math.PI, s: 0.27, b: 0.35 + r() * 0.65, roof: false });
      }
    }
    for (let row = 0; row < 9; row++) {
      for (let c = 0; c < cols; c++) {
        const x = -PORTAL_W / 2 + 0.3 + (c + (row % 2) * 0.5) * ((PORTAL_W - 0.6) / cols);
        if (x > PORTAL_W / 2 - 0.25) continue;
        const zz = 1.1 + row * 0.5;
        const yy = 7.7 + (zz - 0.9) * (1.9 / 23.1) + 0.08;
        list.push({ p: [x, yy, -zz], rot: (row + c) % 2 ? 0 : Math.PI, s: 0.3, b: 0.3 + r() * 0.7, roof: true });
      }
    }
    return { body: g, concrete: tex, tris: list };
  }, []);

  const triGeo = useMemo(() => new THREE.CircleGeometry(1, 3), []);
  const doorW = 2.4;
  const doorH = 3.1;
  return (
    <group>
      <mesh geometry={body} castShadow receiveShadow>
        <meshStandardMaterial map={concrete} color="#c9cdd0" roughness={0.88} />
      </mesh>
      {/* art installation */}
      {tris.map((t, i) => (
        <mesh
          key={i}
          geometry={triGeo}
          position={t.p}
          rotation={t.roof ? [-Math.PI / 2 + 0.082, 0, t.rot] : [0, 0, t.rot]}
          scale={t.s}
        >
          <meshStandardMaterial
            color="#9fe9ff"
            emissive={new THREE.Color(t.b > 0.7 ? "#7dffe0" : "#3fd2ff")}
            emissiveIntensity={(0.4 + 2.6 * t.b) * art}
            metalness={0.6}
            roughness={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {/* door recess + two sliding steel leaves */}
      <mesh position={[0, doorH / 2 + 0.05, -0.15]}>
        <boxGeometry args={[doorW + 0.3, doorH + 0.3, 0.3]} />
        <meshStandardMaterial color="#0b1015" emissive="#9fdcff" emissiveIntensity={door * 1.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (doorW / 4 + (door * doorW) / 2), doorH / 2 + 0.05, 0.06]} castShadow>
          <boxGeometry args={[doorW / 2 - 0.02, doorH, 0.12]} />
          <meshStandardMaterial color="#59626a" metalness={0.75} roughness={0.38} />
        </mesh>
      ))}
      {/* lamp above door */}
      <mesh position={[0, doorH + 0.45, 0.2]}>
        <boxGeometry args={[0.9, 0.12, 0.25]} />
        <meshStandardMaterial color="#fff" emissive="#ffe2b0" emissiveIntensity={3 * lamp} />
      </mesh>
      <pointLight position={[0, doorH + 0.3, 1.6]} color="#ffd9a0" intensity={30 * lamp} distance={18} decay={2} />
      <pointLight position={[0, 6, 3]} color="#5fe3ff" intensity={18 * art} distance={16} decay={2} />
    </group>
  );
};

/** Trodden access road from the valley up to the portal (darker, compacted snow). */
export const AccessRoad: React.FC = () => {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const z = 1 + i * 3;
      const x = Math.sin(i * 0.12) * 6 * (i / 40);
      pts.push(new THREE.Vector3(x, terrainH(x, z) + 0.06, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.BufferGeometry();
    const n = 120;
    const pos: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const p = curve.getPoint(i / n);
      const tg = curve.getTangent(i / n);
      const side = new THREE.Vector3(tg.z, 0, -tg.x).normalize().multiplyScalar(2.2);
      pos.push(p.x + side.x, terrainH(p.x + side.x, p.z + side.z) + 0.07, p.z + side.z);
      pos.push(p.x - side.x, terrainH(p.x - side.x, p.z - side.z) + 0.07, p.z - side.z);
      if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#b9c4cc" roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
};
