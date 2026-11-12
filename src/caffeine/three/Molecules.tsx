/**
 * OWNER: science3d agent.
 * Ball-and-stick molecules, ~0.5 units across at scale 1 (caffeine; adenosine a bit bigger),
 * centred on the purine double-ring core so both molecules line up core-on-core.
 *  - Adenosine (amber): adenine (purine + NH2) + ribose sugar ring on N9.
 *  - Caffeine (cyan): 1,3,7-trimethylxanthine (purine, 2 C=O, 3 CH3).
 * Molecules lie in their local XY plane (ring faces +z). Rendered with InstancedMesh
 * (one draw call for atoms, one for bonds) so swarms of them stay cheap.
 */
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { glowTexture } from "./sci/util";

type V = [number, number, number];
type El = "C" | "N" | "O" | "H";
type Atom = { el: El; p: V; core?: boolean };
type Bond = { a: number; b: number; order?: 1 | 2 };
export type MolKind = "adenosine" | "caffeine";
type MolDef = { atoms: Atom[]; bonds: Bond[]; outline: V[] };

const SCALE = 0.085; // Å → scene units

const add = (a: V, b: V, k = 1): V => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Purine core (Å). Hexagon N1 C2 N3 C4 C5 C6 + pentagon C4 C5 N7 C8 N9. */
const PURINE: Record<string, V> = {
  N1: [-1.212, 0.7, 0],
  C2: [-1.212, -0.7, 0],
  N3: [0, -1.4, 0],
  C4: [1.212, -0.7, 0],
  C5: [1.212, 0.7, 0],
  C6: [0, 1.4, 0],
  N7: [2.543, 1.133, 0],
  C8: [3.366, 0, 0],
  N9: [2.543, -1.133, 0],
};
const HEX_C: V = [0, 0, 0];
const PEN_C: V = [2.175, 0, 0];
const CORE_CENTER: V = [1.0, 0, 0];

class Builder {
  atoms: Atom[] = [];
  bonds: Bond[] = [];
  idx: Record<string, number> = {};
  atom(name: string, el: El, p: V, core = false) {
    this.idx[name] = this.atoms.length;
    this.atoms.push({ el, p, core });
    return this.idx[name];
  }
  bond(a: string, b: string, order: 1 | 2 = 1) {
    this.bonds.push({ a: this.idx[a], b: this.idx[b], order });
  }
  /** substituent on `on`, radially out from ring centre `from`. */
  radial(name: string, el: El, on: string, from: V, len: number, order: 1 | 2 = 1) {
    const p = this.atoms[this.idx[on]].p;
    const d = norm(sub(p, from));
    this.atom(name, el, add(p, d, len));
    this.bond(on, name, order);
  }
  /** three tetrahedral H on a methyl carbon bonded from `parent`. */
  methylH(c: string, parent: string, seed: number) {
    const pc = this.atoms[this.idx[c]].p;
    const b = norm(sub(pc, this.atoms[this.idx[parent]].p));
    let e1 = norm(cross(b, [0, 0, 1]));
    if (Math.hypot(...e1) < 0.1) e1 = [1, 0, 0];
    const e2 = cross(b, e1);
    for (let k = 0; k < 3; k++) {
      const ph = seed + (k * Math.PI * 2) / 3;
      const dir = add(add([0, 0, 0], b, 0.334), add(add([0, 0, 0], e1, Math.cos(ph) * 0.943), e2, Math.sin(ph) * 0.943));
      this.atom(`${c}H${k}`, "H", add(pc, dir, 1.09));
      this.bond(c, `${c}H${k}`);
    }
  }
  core() {
    const el = (n: string): El => (n[0] as El) ?? "C";
    for (const [n, p] of Object.entries(PURINE)) this.atom(n, el(n), p, true);
    ["N1-C2", "C2-N3", "N3-C4", "C4-C5", "C5-C6", "C6-N1", "C5-N7", "N7-C8", "C8-N9", "N9-C4"].forEach((s) => {
      const [a, b] = s.split("-");
      this.bond(a, b, s === "N7-C8" || s === "C2-N3" ? 2 : 1);
    });
  }
  done(): MolDef {
    // centre on the double-ring core
    const atoms = this.atoms.map((a) => ({ ...a, p: sub(a.p, CORE_CENTER).map((v) => v * SCALE) as V }));
    // outline polygon around the fused rings, pushed outward
    const ring = ["N1", "C2", "N3", "C4", "N9", "C8", "N7", "C5", "C6"].map((n) => PURINE[n]);
    const outline = ring.map((p) => {
      const c = p[0] > 1.6 ? PEN_C : HEX_C;
      const d = norm(sub(p, c));
      return sub(add(p, d, 0.85), CORE_CENTER).map((v) => v * SCALE) as V;
    });
    return { atoms, bonds: this.bonds, outline };
  }
}

const buildCaffeine = (): MolDef => {
  const m = new Builder();
  m.core();
  m.radial("O6", "O", "C6", HEX_C, 1.23, 2);
  m.radial("O2", "O", "C2", HEX_C, 1.23, 2);
  m.radial("Me1", "C", "N1", HEX_C, 1.47);
  m.radial("Me3", "C", "N3", HEX_C, 1.47);
  m.radial("Me7", "C", "N7", PEN_C, 1.47);
  m.radial("H8", "H", "C8", PEN_C, 1.08);
  m.methylH("Me1", "N1", 0.3);
  m.methylH("Me3", "N3", 1.1);
  m.methylH("Me7", "N7", 0.7);
  // C2=N3 is not a double bond in xanthine; keep the drawing simple (aromatic look)
  return m.done();
};

const buildAdenosine = (): MolDef => {
  const m = new Builder();
  m.core();
  m.radial("N6", "N", "C6", HEX_C, 1.35);
  m.radial("H2", "H", "C2", HEX_C, 1.08);
  m.radial("H8", "H", "C8", PEN_C, 1.08);
  // NH2 hydrogens
  const n6 = m.atoms[m.idx.N6].p;
  m.atom("H6a", "H", add(n6, [0.87, 0.5, 0], 1.01));
  m.bond("N6", "H6a");
  m.atom("H6b", "H", add(n6, [-0.87, 0.5, 0], 1.01));
  m.bond("N6", "H6b");
  // ribose on N9: C1' then a puckered 5-ring tilted out of the base plane
  const n9 = PURINE.N9;
  const dir = norm(sub(n9, PEN_C));
  const c1 = add(n9, dir, 1.47);
  m.atom("C1'", "C", c1);
  m.bond("N9", "C1'");
  const R = 1.2;
  const a = norm(add(add(dir, [0.55, 0, 0]), [0, 0, 0.9]));
  const centre = add(c1, a, R);
  const e1: V = [-a[0], -a[1], -a[2]];
  const e2 = norm(cross(a, cross([0, 0, 1], a)));
  const ringNames = ["C1'", "C2'", "C3'", "C4'", "O4'"];
  const ringPos = ringNames.map((_, k) => {
    const th = (k * Math.PI * 2) / 5;
    const pucker = k === 2 ? 0.35 : 0;
    return add(add(add(centre, e1, R * Math.cos(th)), e2, R * Math.sin(th)), cross(e1, e2), pucker);
  });
  ringNames.slice(1).forEach((n, k) => m.atom(n, n.startsWith("O") ? "O" : "C", ringPos[k + 1]));
  m.bond("C1'", "C2'");
  m.bond("C2'", "C3'");
  m.bond("C3'", "C4'");
  m.bond("C4'", "O4'");
  m.bond("O4'", "C1'");
  const nrm = norm(cross(e1, e2));
  // OH groups on C2', C3' (alternating faces), CH2OH on C4'
  const oh = (c: string, name: string, side: number) => {
    const p = m.atoms[m.idx[c]].p;
    const d = norm(add(sub(p, centre), nrm, side * 0.9));
    const o = add(p, d, 1.43);
    m.atom(name, "O", o);
    m.bond(c, name);
    m.atom(`${name}H`, "H", add(o, norm(add(d, e2, 0.6)), 0.96));
    m.bond(name, `${name}H`);
  };
  oh("C2'", "O2'", -1);
  oh("C3'", "O3'", 1);
  const c4 = m.atoms[m.idx["C4'"]].p;
  const d5 = norm(add(sub(c4, centre), nrm, 0.7));
  const c5 = add(c4, d5, 1.52);
  m.atom("C5'", "C", c5);
  m.bond("C4'", "C5'");
  const o5 = add(c5, norm(add(d5, nrm, -1.2)), 1.43);
  m.atom("O5'", "O", o5);
  m.bond("C5'", "O5'");
  m.atom("O5'H", "H", add(o5, norm(add(d5, e1, 0.5)), 0.96));
  m.bond("O5'", "O5'H");
  // ring H (a few, keeps it readable)
  m.atom("H1'", "H", add(c1, norm(add(nrm, dir, -0.3)), 1.09));
  m.bond("C1'", "H1'");
  return m.done();
};

export const MOLS: Record<MolKind, MolDef> = {
  adenosine: buildAdenosine(),
  caffeine: buildCaffeine(),
};

const RADIUS: Record<El, number> = { C: 0.36, N: 0.35, O: 0.35, H: 0.22 };
const BOND_R = 0.11;

export const PALETTE: Record<MolKind, { hue: string; atom: Record<El, string>; bond: string }> = {
  adenosine: {
    hue: "#ffb547",
    atom: { C: "#ffb547", N: "#ff8d3a", O: "#ff6a3d", H: "#ffe2bd" },
    bond: "#f4dcc0",
  },
  caffeine: {
    hue: "#47d7ff",
    atom: { C: "#47d7ff", N: "#3d8bff", O: "#8fe9ff", H: "#c4f1ff" },
    bond: "#cdeefa",
  },
};

const atomGeo = new THREE.SphereGeometry(1, 24, 16);
const bondGeo = new THREE.CylinderGeometry(1, 1, 1, 12, 1);

/** Local-space instance matrices for one molecule. */
const localMatrices = (kind: MolKind) => {
  const def = MOLS[kind];
  const atoms = def.atoms.map((a) => {
    const r = RADIUS[a.el] * SCALE;
    return { m: new THREE.Matrix4().compose(new THREE.Vector3(...a.p), new THREE.Quaternion(), new THREE.Vector3(r, r, r)), el: a.el };
  });
  const bonds: THREE.Matrix4[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (const b of def.bonds) {
    const pa = new THREE.Vector3(...def.atoms[b.a].p);
    const pb = new THREE.Vector3(...def.atoms[b.b].p);
    const d = pb.clone().sub(pa);
    const len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(up, d.clone().normalize());
    const r = BOND_R * SCALE * (b.order === 2 ? 0.7 : 1);
    const offs = b.order === 2 ? [-1, 1] : [0];
    const perp = d.clone().cross(new THREE.Vector3(0, 0, 1)).normalize().multiplyScalar(0.17 * SCALE);
    for (const o of offs) {
      const mid = pa.clone().add(pb).multiplyScalar(0.5).addScaledVector(perp, o);
      bonds.push(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(r, len, r)));
    }
  }
  return { atoms, bonds };
};
const LOCAL = { adenosine: localMatrices("adenosine"), caffeine: localMatrices("caffeine") };

const useMaterials = (kind: MolKind) =>
  useMemo(() => {
    const atom = new THREE.MeshPhysicalMaterial({
      roughness: 0.2,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      sheen: 0.3,
      sheenColor: new THREE.Color(PALETTE[kind].hue),
      emissive: new THREE.Color(PALETTE[kind].hue),
      transparent: true,
    });
    const bond = new THREE.MeshPhysicalMaterial({
      color: PALETTE[kind].bond,
      roughness: 0.3,
      clearcoat: 0.6,
      emissive: new THREE.Color(PALETTE[kind].hue),
      transparent: true,
    });
    return { atom, bond };
  }, [kind]);

export type MolItem = {
  readonly p: readonly [number, number, number];
  readonly r?: readonly [number, number, number];
  readonly s?: number;
};

/**
 * Many molecules of one kind in 2 draw calls (+ glow halos as points).
 * `items` may change every frame (positions/rotations/scales); scale 0 hides one.
 */
export const MolSwarm: React.FC<{
  readonly kind: MolKind;
  readonly items: readonly MolItem[];
  readonly glow?: number;
  readonly opacity?: number;
  /** halo size multiplier (0 = no halo) */
  readonly halo?: number;
  readonly max?: number;
}> = ({ kind, items, glow = 0.5, opacity = 1, halo = 1, max = 160 }) => {
  const local = LOCAL[kind];
  const atomRef = useRef<THREE.InstancedMesh>(null);
  const bondRef = useRef<THREE.InstancedMesh>(null);
  const mats = useMaterials(kind);
  const nA = local.atoms.length;
  const nB = local.bonds.length;
  const haloGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(max * 3), 3));
    return g;
  }, [max]);
  const haloMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: glowTexture(),
        color: PALETTE[kind].hue,
        size: 1,
        sizeAttenuation: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [kind],
  );

  mats.atom.emissiveIntensity = 0.12 + glow * 0.7;
  mats.bond.emissiveIntensity = 0.05 + glow * 0.25;
  mats.atom.opacity = opacity;
  mats.bond.opacity = opacity;
  mats.atom.depthWrite = opacity > 0.98;
  mats.bond.depthWrite = opacity > 0.98;
  haloMat.opacity = 0.16 * glow * opacity;
  haloMat.size = 0.95 * halo;

  const count = Math.min(items.length, max);
  useLayoutEffect(() => {
    const am = atomRef.current;
    const bm = bondRef.current;
    if (!am || !bm) return;
    const M = new THREE.Matrix4();
    const T = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const sv = new THREE.Vector3();
    const pv = new THREE.Vector3();
    const pos = haloGeo.getAttribute("position") as THREE.BufferAttribute;
    const col = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const it = items[i];
      const s = it.s ?? 1;
      e.set(it.r?.[0] ?? 0, it.r?.[1] ?? 0, it.r?.[2] ?? 0);
      q.setFromEuler(e);
      T.compose(pv.set(it.p[0], it.p[1], it.p[2]), q, sv.set(s, s, s));
      for (let k = 0; k < nA; k++) {
        M.multiplyMatrices(T, local.atoms[k].m);
        am.setMatrixAt(i * nA + k, M);
        am.setColorAt(i * nA + k, col.set(PALETTE[kind].atom[local.atoms[k].el]));
      }
      for (let k = 0; k < nB; k++) {
        M.multiplyMatrices(T, local.bonds[k]);
        bm.setMatrixAt(i * nB + k, M);
      }
      pos.setXYZ(i, it.p[0], it.p[1], it.p[2]);
      // hide halos of hidden molecules by pushing them far away
      if (s < 0.05) pos.setXYZ(i, 0, -999, 0);
    }
    am.count = count * nA;
    bm.count = count * nB;
    am.instanceMatrix.needsUpdate = true;
    if (am.instanceColor) am.instanceColor.needsUpdate = true;
    bm.instanceMatrix.needsUpdate = true;
    pos.needsUpdate = true;
    haloGeo.setDrawRange(0, count);
    am.computeBoundingSphere();
    bm.computeBoundingSphere();
  });

  return (
    <group>
      <instancedMesh ref={atomRef} args={[atomGeo, mats.atom, max * nA]} frustumCulled={false} castShadow />
      <instancedMesh ref={bondRef} args={[bondGeo, mats.bond, max * nB]} frustumCulled={false} castShadow />
      {halo > 0 ? <points geometry={haloGeo} material={haloMat} frustumCulled={false} /> : null}
    </group>
  );
};

type MolProps = {
  readonly t: number;
  readonly position?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: number;
  /** 0..1 emissive glow */
  readonly glow?: number;
  /** 0..1 fade */
  readonly opacity?: number;
  /** 0..1 glowing outline around the shared purine double ring */
  readonly outline?: number;
  /** gentle idle tumble (radians amplitude), default 0 */
  readonly wobble?: number;
};

/** Thin glowing loop around the fused double ring (the part both molecules share). */
const CoreOutline: React.FC<{ kind: MolKind; k: number; color: string }> = ({ kind, k, color }) => {
  const geo = useMemo(() => {
    const pts = MOLS[kind].outline.map((p) => new THREE.Vector3(p[0], p[1], 0.012));
    const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal", 0.2);
    return new THREE.TubeGeometry(curve, 120, 0.0065, 8, true);
  }, [kind]);
  if (k <= 0.001) return null;
  return (
    <mesh geometry={geo} scale={[0.92 + 0.08 * k, 0.92 + 0.08 * k, 1]}>
      <meshBasicMaterial color={color} transparent opacity={k} toneMapped={false} depthWrite={false} />
    </mesh>
  );
};

const Single: React.FC<MolProps & { kind: MolKind }> = ({
  kind,
  t,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  glow = 0.5,
  opacity = 1,
  outline = 0,
  wobble = 0,
}) => {
  const w: [number, number, number] = [Math.sin(t * 0.7) * wobble, Math.sin(t * 0.5 + 1) * wobble, Math.sin(t * 0.4 + 2) * wobble * 0.5];
  if (opacity <= 0.001 || scale <= 0.001) return null;
  return (
    <group position={position as [number, number, number]} rotation={rotation as [number, number, number]} scale={scale}>
      <group rotation={w}>
        <MolSwarm kind={kind} items={[{ p: [0, 0, 0] }]} glow={glow} opacity={opacity} halo={0} max={1} />
        <CoreOutline kind={kind} k={outline * opacity} color="#fff6e8" />
      </group>
      <sprite scale={[0.9, 0.9, 1]}>
        <spriteMaterial
          map={glowTexture()}
          color={PALETTE[kind].hue}
          transparent
          opacity={0.28 * glow * opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
};

export const Adenosine: React.FC<MolProps> = (p) => <Single kind="adenosine" {...p} />;
export const Caffeine: React.FC<MolProps> = (p) => <Single kind="caffeine" {...p} />;

/** Rotation (about z) that points adenosine's sugar straight up, used for docking poses. */
export const DOCK_ROT_Z = 2.46;
/** Rotation (about z) that hangs adenosine's sugar straight down (side-by-side compare). */
export const HANG_ROT_Z = -0.68;
