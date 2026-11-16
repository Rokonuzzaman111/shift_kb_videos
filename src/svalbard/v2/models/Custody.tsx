/**
 * Svalbard v2 · Part 4 (D–F) props, metres, y up.
 *  CrateLid + DepositInvoice + RubberStamp — deposit form on a crate lid; stamp slams "বিনামূল্যে / FREE" (teal ink).
 *  SealedCrate + GlovedHand                — black crate with amber tamper-evident tape and numbered seal; insulated glove.
 *  Padlock + Key                           — hardened padlock on a steel hasp; keys (optional tag); red ✕ mark; teal glow.
 */
import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { usePBR } from "../../../kit/assets";
import { headFont, numFont } from "../../theme";
import { canvasTex, grain, rng } from "../../three/util";
import { P } from "../palette";
import { useSteelMat } from "./Corridor";

type V = readonly [number, number, number];
const v3 = (p: V) => p as [number, number, number];

/** Bangla display font for canvas text: hold the render (delayRender) until the face is loaded, then redraw. */
const BN_SAMPLE = "বিনামূল্যে জমাদাতা";
const fontReady = () => {
  try {
    return document.fonts.check(`800 40px "${headFont}"`, BN_SAMPLE);
  } catch {
    return false;
  }
};
const useBnFontReady = () => {
  const [ready, setReady] = useState(fontReady);
  const [handle] = useState(() => (ready ? null : delayRender("Bangla canvas font")));
  useEffect(() => {
    if (handle === null) return;
    let live = true;
    Promise.all([document.fonts.load(`800 40px "${headFont}"`, BN_SAMPLE), document.fonts.ready])
      .catch(() => undefined)
      .then(() => {
        if (live) setReady(true);
        continueRender(handle);
      });
    return () => {
      live = false;
    };
  }, [handle]);
  return ready;
};

const useRibNormal = (ribs: number) =>
  useMemo(() => {
    const t = canvasTex(
      256,
      16,
      (g) => {
        const img = g.createImageData(256, 16);
        for (let x = 0; x < 256; x++) {
          const s = Math.sin((x / 256) * Math.PI * 2 * ribs);
          const nx = Math.sign(s) * Math.pow(Math.abs(s), 5) * 0.8;
          for (let y = 0; y < 16; y++) {
            const i = (y * 256 + x) * 4;
            img.data[i] = 128 + nx * 120;
            img.data[i + 1] = 128;
            img.data[i + 2] = 255;
            img.data[i + 3] = 255;
          }
        }
        g.putImageData(img, 0, 0);
      },
      [1, 1],
    );
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }, [ribs]);

/* ═════════════════════════ D · invoice + stamp ═════════════════════════ */
export const LID = { w: 0.62, d: 0.42, h: 0.03 } as const;
export const PAPER = { w: 0.21, d: 0.297 } as const;

export const CrateLid: React.FC = () => {
  const rib = useRibNormal(14);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3d444c", roughness: 0.55, normalMap: rib, normalScale: new THREE.Vector2(0.35, 0.35) }), [rib]);
  const conc = usePBR("concrete_wall_008", [3, 3]);
  const floor = useMemo(() => new THREE.MeshStandardMaterial({ map: conc.map, normalMap: conc.normalMap, roughnessMap: conc.roughnessMap, color: "#7d8287" }), [conc]);
  return (
    <group>
      <RoundedBox args={[LID.w, 0.32, LID.d]} radius={0.012} smoothness={3} material={mat} position={[0, -0.16, 0]} castShadow receiveShadow />
      <mesh material={floor} position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
      </mesh>
    </group>
  );
};

const invoiceTex = () =>
  canvasTex(768, 1086, (g) => {
    grain(g, 768, 1086, [240, 242, 243], 6, 3);
    g.fillStyle = P.night;
    g.font = `700 30px ${numFont}, Arial`;
    g.fillText("SVALBARD GLOBAL SEED VAULT", 56, 90);
    g.font = `900 52px ${numFont}, Arial`;
    g.fillText("SEED DEPOSIT · INVOICE", 56, 160);
    g.fillStyle = "#3a4552";
    g.fillRect(56, 186, 656, 3);
    g.font = `500 28px ${numFont}, Arial`;
    const rows: [string, string][] = [
      ["Depositor", "CIMMYT"],
      ["Accessions", "412"],
      ["Boxes", "1"],
      ["Storage, per year", "0.00"],
      ["Handling", "0.00"],
      ["Transport to vault", "0.00"],
    ];
    rows.forEach(([a, b], i) => {
      const y = 250 + i * 62;
      g.fillStyle = "#3a4552";
      g.fillText(a, 56, y);
      g.fillStyle = P.night;
      g.textAlign = "right";
      g.fillText(b, 712, y);
      g.textAlign = "left";
      g.fillStyle = "rgba(7,13,22,0.18)";
      g.fillRect(56, y + 18, 656, 2);
    });
    g.fillStyle = P.night;
    g.font = `900 40px ${numFont}, Arial`;
    g.fillText("TOTAL", 56, 680);
    g.textAlign = "right";
    g.fillText("0.00 NOK", 712, 680);
    g.textAlign = "left";
    g.fillStyle = "#3a4552";
    g.fillRect(56, 960, 280, 2);
    g.font = `500 22px ${numFont}, Arial`;
    g.fillText("signature", 56, 990);
    const r = rng(8);
    let x = 440;
    while (x < 712) {
      const w = 2 + Math.floor(r() * 4);
      if (r() > 0.4) {
        g.fillStyle = P.night;
        g.fillRect(x, 920, w, 70);
      }
      x += w + 1;
    }
  });

const imprintTex = () =>
  canvasTex(640, 400, (g) => {
    g.clearRect(0, 0, 640, 400);
    g.strokeStyle = P.vaultTeal;
    g.fillStyle = P.vaultTeal;
    g.lineWidth = 14;
    g.strokeRect(20, 20, 600, 360);
    g.lineWidth = 4;
    g.strokeRect(42, 42, 556, 316);
    g.textAlign = "center";
    g.font = `800 112px "${headFont}", sans-serif`;
    g.fillText("বিনামূল্যে", 320, 190);
    g.font = `900 104px ${numFont}, Arial`;
    g.fillText("FREE", 320, 318);
    // ink wear: punch tiny holes
    const r = rng(12);
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.7})`;
      g.fillRect(r() * 640, r() * 400, 1 + r() * 4, 1 + r() * 3);
    }
    g.globalCompositeOperation = "source-over";
  });

export const DepositInvoice: React.FC<{ readonly stamped: number }> = ({ stamped }) => {
  const ready = useBnFontReady();
  const paper = useMemo(() => new THREE.MeshStandardMaterial({ map: invoiceTex(), color: "#c8c5be", roughness: 0.85 }), []);
  const ink = useMemo(
    () => new THREE.MeshStandardMaterial({ map: imprintTex(), transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
    [ready], // eslint-disable-line react-hooks/exhaustive-deps
  );
  ink.opacity = stamped;
  return (
    <group position={[0, 0.001, 0]} rotation={[0, 0.06, 0]}>
      <mesh material={paper} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[PAPER.w, PAPER.d]} />
      </mesh>
      <mesh material={ink} position={[0.02, 0.0006, 0.035]} rotation={[-Math.PI / 2, 0, 0.14]}>
        <planeGeometry args={[0.15, 0.094]} />
      </mesh>
    </group>
  );
};

export const RubberStamp: React.FC<{ readonly position: V; readonly tilt: number }> = ({ position, tilt }) => {
  const steel = useSteelMat([0.5, 0.5], "#58616b", 0.4, 0.8);
  const mats = useMemo(() => {
    const rubber = new THREE.MeshStandardMaterial({ color: "#121518", roughness: 0.9 });
    const inkPad = new THREE.MeshStandardMaterial({ color: "#1f6f66", roughness: 0.7 });
    const grip = new THREE.MeshStandardMaterial({ color: "#20262c", roughness: 0.5 });
    return { rubber, inkPad, grip };
  }, []);
  return (
    <group position={v3(position)} rotation={[tilt, 0, 0.14]}>
      <mesh material={mats.inkPad} position={[0, 0.003, 0]}>
        <boxGeometry args={[0.155, 0.006, 0.098]} />
      </mesh>
      <RoundedBox args={[0.165, 0.022, 0.108]} radius={0.004} smoothness={2} material={mats.rubber} position={[0, 0.017, 0]} castShadow />
      <RoundedBox args={[0.18, 0.018, 0.12]} radius={0.004} smoothness={2} material={steel} position={[0, 0.036, 0]} castShadow />
      <mesh material={mats.grip} position={[0, 0.085, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.02, 0.08, 20]} />
      </mesh>
      <mesh material={mats.grip} position={[0, 0.14, 0]} castShadow>
        <sphereGeometry args={[0.032, 24, 16]} />
      </mesh>
    </group>
  );
};

/* ═════════════════════════ E · sealed black crate + glove ═════════════════════════ */
export const BOXE = { w: 0.6, h: 0.34, d: 0.4 } as const;
/** world point of the numbered seal on the front lid seam */
export const SEAL_PT: V = [0.0, BOXE.h - 0.03, BOXE.d / 2 + 0.012];

const tapeTex = () =>
  canvasTex(
    1024,
    96,
    (g) => {
      g.fillStyle = P.amber;
      g.fillRect(0, 0, 1024, 96);
      g.fillStyle = P.night;
      g.font = `900 40px ${numFont}, Arial`;
      g.fillText("SEALED • TAMPER EVIDENT • DO NOT OPEN •", 14, 62);
      const r = rng(4);
      g.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 600; i++) g.fillRect(r() * 1024, r() * 96, 2, 1);
      g.globalCompositeOperation = "source-over";
    },
    [1, 1],
  );
const sealTagTex = () =>
  canvasTex(256, 128, (g) => {
    g.fillStyle = P.amber;
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = P.night;
    g.font = `900 46px ${numFont}, Arial`;
    g.fillText("Nº 004127", 16, 80);
  });

export const SealedCrate: React.FC = () => {
  const rib = useRibNormal(16);
  const steel = useSteelMat([2, 1], "#7d8893", 0.5, 0.85);
  const conc = usePBR("concrete_wall_008", [2, 2]);
  const mats = useMemo(() => {
    const body = new THREE.MeshStandardMaterial({ color: "#121417", roughness: 0.5, normalMap: rib, normalScale: new THREE.Vector2(0.55, 0.55) });
    const lid = new THREE.MeshStandardMaterial({ color: "#16191d", roughness: 0.42 });
    const tape = new THREE.MeshStandardMaterial({ map: tapeTex(), roughness: 0.3, transparent: true, polygonOffset: true, polygonOffsetFactor: -2 });
    const tag = new THREE.MeshStandardMaterial({ map: sealTagTex(), roughness: 0.4 });
    const tie = new THREE.MeshStandardMaterial({ color: P.amber, roughness: 0.4 });
    const wall = new THREE.MeshStandardMaterial({ map: conc.map, normalMap: conc.normalMap, roughnessMap: conc.roughnessMap, color: "#80868c" });
    return { body, lid, tape, tag, tie, wall };
  }, [rib, conc]);
  const tw = 0.05; // tape width
  return (
    <group>
      {/* steel shelf + wall */}
      <mesh material={steel} position={[0, -0.015, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.03, 0.7]} />
      </mesh>
      <mesh material={mats.wall} position={[0, 0.6, -0.5]} receiveShadow>
        <planeGeometry args={[4, 2.5]} />
      </mesh>
      <RoundedBox args={[BOXE.w, BOXE.h - 0.04, BOXE.d]} radius={0.01} smoothness={3} material={mats.body} position={[0, (BOXE.h - 0.04) / 2, 0]} castShadow receiveShadow />
      <RoundedBox args={[BOXE.w + 0.012, 0.045, BOXE.d + 0.012]} radius={0.008} smoothness={3} material={mats.lid} position={[0, BOXE.h - 0.02, 0]} castShadow receiveShadow />
      {/* tamper tape: over the lid and down the front seam */}
      <mesh material={mats.tape} position={[0, BOXE.h + 0.0035, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[BOXE.d + 0.012, tw]} />
      </mesh>
      <mesh material={mats.tape} position={[0, BOXE.h - 0.07, BOXE.d / 2 + 0.0075]} rotation={[0, 0, Math.PI / 2]}>
        <planeGeometry args={[0.15, tw]} />
      </mesh>
      {/* numbered cable-tie seal through the lid hasp */}
      <group position={[0.11, BOXE.h - 0.04, BOXE.d / 2 + 0.012]}>
        <mesh material={mats.tie} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.012, 0.002, 8, 24]} />
        </mesh>
        <mesh material={mats.tag} position={[0, -0.034, 0.002]}>
          <boxGeometry args={[0.044, 0.022, 0.003]} />
        </mesh>
      </group>
    </group>
  );
};

/** woven nylon shell + quilted channels (tangent-space normal map), deterministic */
const useGloveNormal = () =>
  useMemo(() => {
    const N = 256;
    const t = canvasTex(
      N,
      N,
      (g) => {
        const img = g.createImageData(N, N);
        for (let y = 0; y < N; y++)
          for (let x = 0; x < N; x++) {
            // plain weave: alternating over/under bumps
            const wx = Math.sin((x / N) * Math.PI * 2 * 48);
            const wy = Math.sin((y / N) * Math.PI * 2 * 48);
            const over = (Math.floor((x / N) * 48) + Math.floor((y / N) * 48)) % 2 === 0 ? 1 : -1;
            const nx = wx * 0.35 * over;
            let ny = wy * 0.35 * -over;
            // quilt: padding puffs between stitched channels (6 per tile)
            const q = ((y / N) * 6) % 1;
            ny += Math.cos(q * Math.PI) * 0.6 * Math.sqrt(Math.sin(q * Math.PI));
            if (q < 0.03 || q > 0.97) ny *= 0.2;
            const i = (y * N + x) * 4;
            img.data[i] = 128 + nx * 110;
            img.data[i + 1] = 128 + ny * 110;
            img.data[i + 2] = 230;
            img.data[i + 3] = 255;
          }
        g.putImageData(img, 0, 0);
      },
      [3, 3],
    );
    t.colorSpace = THREE.NoColorSpace;
    return t;
  }, []);

/** one finger: knuckle + proximal segment, then a bent middle/distal segment; length along −z */
const Finger: React.FC<{
  readonly x: number;
  readonly len: number;
  readonly r: number;
  readonly curl: number;
  readonly splay: number;
  readonly mat: THREE.Material;
  readonly knuckle: THREE.Material;
}> = ({ x, len, r, curl, splay, mat, knuckle }) => {
  const l1 = len * 0.55;
  const l2 = len * 0.45;
  return (
    <group position={[x, 0.002, -0.048]} rotation={[-0.15 - curl * 0.75, splay, 0]}>
      <mesh material={knuckle} scale={[1, 0.85, 1]} castShadow>
        <sphereGeometry args={[r * 1.12, 14, 10]} />
      </mesh>
      <mesh material={mat} position={[0, 0, -l1 / 2]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[r, l1, 6, 14]} />
      </mesh>
      <group position={[0, 0, -l1]} rotation={[-0.2 - curl * 0.95, 0, 0]}>
        <mesh material={mat} scale={[1.02, 0.9, 1]}>
          <sphereGeometry args={[r * 1.04, 12, 8]} />
        </mesh>
        <mesh material={mat} position={[0, 0, -l2 / 2]} rotation={[Math.PI / 2, 0, 0]} scale={[0.96, 1, 0.92]} castShadow>
          <capsuleGeometry args={[r * 0.97, l2, 6, 14]} />
        </mesh>
      </group>
    </group>
  );
};

/** insulated work glove; palm faces −y, fingers along −z. curl 0…1 */
export const GlovedHand: React.FC<{ readonly position: V; readonly rotation: V; readonly curl: number }> = ({ position, rotation, curl }) => {
  const nrm = useGloveNormal();
  const knit = useRibNormal(40);
  const mats = useMemo(() => {
    const shell = new THREE.MeshPhysicalMaterial({ color: "#2b3a4b", roughness: 0.78, sheen: 0.6, sheenColor: new THREE.Color("#6f879e"), sheenRoughness: 0.6, normalMap: nrm, normalScale: new THREE.Vector2(0.9, 0.9) });
    const padded = new THREE.MeshPhysicalMaterial({ color: "#22303e", roughness: 0.7, sheen: 0.5, sheenColor: new THREE.Color("#5d7489"), normalMap: nrm, normalScale: new THREE.Vector2(1.2, 1.2) });
    const knuckle = new THREE.MeshStandardMaterial({ color: "#1b2229", roughness: 0.6, normalMap: nrm, normalScale: new THREE.Vector2(0.4, 0.4) });
    const palm = new THREE.MeshStandardMaterial({ color: "#4a4038", roughness: 0.85, normalMap: nrm, normalScale: new THREE.Vector2(0.5, 0.5) });
    const cuff = new THREE.MeshStandardMaterial({ color: "#1a222b", roughness: 0.9, normalMap: knit, normalScale: new THREE.Vector2(0.8, 0.8) });
    const strap = new THREE.MeshStandardMaterial({ color: "#14191e", roughness: 0.55 });
    return { shell, padded, knuckle, palm, cuff, strap };
  }, [nrm, knit]);
  // index → little: x, length, radius, splay
  const fingers: [number, number, number, number][] = [
    [-0.032, 0.062, 0.0118, 0.06],
    [-0.0105, 0.07, 0.0122, 0.0],
    [0.011, 0.066, 0.0118, -0.04],
    [0.031, 0.052, 0.0108, -0.1],
  ];
  return (
    <group position={v3(position)} rotation={v3(rotation)}>
      {/* hand body: shell + raised padded back + leather palm */}
      <RoundedBox args={[0.094, 0.034, 0.1]} radius={0.015} smoothness={4} material={mats.shell} castShadow />
      <RoundedBox args={[0.08, 0.012, 0.075]} radius={0.006} smoothness={3} material={mats.padded} position={[0, 0.017, 0.004]} castShadow />
      <RoundedBox args={[0.088, 0.008, 0.094]} radius={0.004} smoothness={2} material={mats.palm} position={[0, -0.015, -0.002]} />
      {fingers.map(([x, len, r, sp], i) => (
        <Finger key={x} x={x} len={len} r={r} splay={sp} curl={curl * (1 + i * 0.06)} mat={mats.shell} knuckle={mats.knuckle} />
      ))}
      {/* thumb: two segments, angled across the palm */}
      <group position={[-0.046, -0.006, -0.012]} rotation={[-0.2 - curl * 0.3, 0.75, 0.35 + curl * 0.25]}>
        <mesh material={mats.shell} position={[0, 0, -0.016]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.0135, 0.028, 6, 14]} />
        </mesh>
        <group position={[0, 0, -0.032]} rotation={[-0.15 - curl * 0.5, 0, 0]}>
          <mesh material={mats.shell} position={[0, 0, -0.012]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.0125, 0.02, 6, 14]} />
          </mesh>
        </group>
      </group>
      {/* gauntlet cuff + wrist strap */}
      <mesh material={mats.cuff} position={[0, 0.003, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.054, 0.05, 0.1, 28]} />
      </mesh>
      <mesh material={mats.strap} position={[0, 0.003, 0.058]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.0525, 0.0525, 0.016, 28]} />
      </mesh>
    </group>
  );
};

/* ═════════════════════════ F · padlock + keys ═════════════════════════ */
export const LOCK = { w: 0.056, h: 0.05, d: 0.022 } as const;
/** keyhole centre, world (padlock at origin, face toward +z) */
export const KEYHOLE: V = [0, -0.008, LOCK.d / 2];

export const Padlock: React.FC<{ readonly open: number; readonly glow: number }> = ({ open, glow }) => {
  const steel = useSteelMat([0.3, 0.3], "#d5dbe1", 0.36, 0.6);
  const door = useSteelMat([1.5, 1.5], "#6c7782", 0.5, 0.85);
  const mats = useMemo(() => {
    const shackle = new THREE.MeshStandardMaterial({ color: "#d9dfe5", roughness: 0.18, metalness: 1 });
    const hole = new THREE.MeshStandardMaterial({ color: "#05080c", roughness: 0.9 });
    const ring = new THREE.MeshStandardMaterial({ color: P.vaultTeal, emissive: P.vaultTeal, emissiveIntensity: 0 });
    return { shackle, hole, ring };
  }, []);
  mats.ring.emissiveIntensity = glow * 2.5;
  const R = 0.017;
  const lift = open * 0.014;
  const holeShape = useMemo(() => {
    const s = new THREE.Shape();
    s.absarc(0, 0.003, 0.0032, 0, Math.PI * 2, false);
    const g1 = new THREE.ShapeGeometry(s, 16);
    return g1;
  }, []);
  return (
    <group>
      {/* steel door + hasp staple */}
      <mesh material={door} position={[0, 0.02, -0.05]} receiveShadow>
        <boxGeometry args={[0.6, 0.5, 0.02]} />
      </mesh>
      <mesh material={door} position={[0, 0.045, -0.035]} castShadow>
        <boxGeometry args={[0.05, 0.08, 0.008]} />
      </mesh>
      {/* body */}
      <RoundedBox args={[LOCK.w, LOCK.h, LOCK.d]} radius={0.006} smoothness={4} material={steel} castShadow />
      {/* shackle: right leg stays, whole shackle lifts and swings when open */}
      <group position={[0, LOCK.h / 2 + lift, 0]} rotation={[0, open * 0.6, 0]}>
        <mesh material={mats.shackle} position={[0, 0.018, 0]} castShadow>
          <torusGeometry args={[R, 0.0042, 14, 32, Math.PI]} />
        </mesh>
        <mesh material={mats.shackle} position={[-R, 0.004, 0]} castShadow>
          <cylinderGeometry args={[0.0042, 0.0042, 0.028, 14]} />
        </mesh>
        <mesh material={mats.shackle} position={[R, 0.004 - 0.008, 0]} castShadow>
          <cylinderGeometry args={[0.0042, 0.0042, 0.044, 14]} />
        </mesh>
      </group>
      {/* keyhole: dark pin + slot + teal ring */}
      <group position={v3(KEYHOLE)}>
        <mesh geometry={holeShape} material={mats.hole} position={[0, 0, 0.0006]} />
        <mesh material={mats.hole} position={[0, -0.003, 0.0006]}>
          <planeGeometry args={[0.0022, 0.009]} />
        </mesh>
        <mesh material={mats.ring} position={[0, 0.0005, 0.0004]}>
          <ringGeometry args={[0.0062, 0.0078, 32]} />
        </mesh>
      </group>
      {glow > 0.01 ? <pointLight position={[0, 0, 0.05]} color={P.vaultTeal} intensity={0.05 * glow} distance={0.25} decay={2} /> : null}
    </group>
  );
};

const tagTex = (text: string) =>
  canvasTex(384, 192, (g) => {
    g.fillStyle = P.vaultTeal;
    g.beginPath();
    g.roundRect(4, 4, 376, 184, 28);
    g.fill();
    g.fillStyle = P.night;
    g.beginPath();
    g.arc(44, 96, 16, 0, Math.PI * 2);
    g.fill();
    g.textAlign = "center";
    g.font = `800 78px "${headFont}", sans-serif`;
    g.fillText(text, 210, 122);
  });

/** key, blade along −z (tip at z = −0.035 from the shoulder at the origin); `turn` rotates about z */
export const Key: React.FC<{ readonly position: V; readonly turn: number; readonly cut: number; readonly tag?: string; readonly tint?: string }> = ({ position, turn, cut, tag, tint = "#c9d0d6" }) => {
  const ready = useBnFontReady();
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: tint, roughness: 0.25, metalness: 1 }), [tint]);
  const tagMat = useMemo(() => (tag ? new THREE.MeshStandardMaterial({ map: tagTex(tag), roughness: 0.5, side: THREE.DoubleSide }) : null), [tag, ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const teeth = useMemo(() => {
    const r = rng(cut);
    return [0, 1, 2, 3, 4].map((i) => ({ z: -0.008 - i * 0.0055, h: 0.002 + r() * 0.003 }));
  }, [cut]);
  return (
    <group position={v3(position)} rotation={[0, 0, turn]}>
      <mesh material={mat} position={[0, 0, -0.018]} castShadow>
        <boxGeometry args={[0.0016, 0.0045, 0.036]} />
      </mesh>
      {teeth.map((tt) => (
        <mesh key={tt.z} material={mat} position={[0, -0.00225 - tt.h / 2, tt.z]}>
          <boxGeometry args={[0.0016, tt.h, 0.004]} />
        </mesh>
      ))}
      <mesh material={mat} position={[0, 0, 0.002]}>
        <boxGeometry args={[0.003, 0.009, 0.004]} />
      </mesh>
      <mesh material={mat} position={[0, 0, 0.016]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <torusGeometry args={[0.011, 0.0035, 12, 28]} />
      </mesh>
      {tagMat ? (
        <group position={[0, -0.006, 0.03]}>
          <mesh material={mat} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.005, 0.001, 8, 16]} />
          </mesh>
          <mesh material={tagMat} position={[0, -0.016, 0.012]} rotation={[0, -Math.PI / 2 + 0.25, 0.1]}>
            <planeGeometry args={[0.05, 0.025]} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
};

/** red ✕ (danger mark) */
export const Cross: React.FC<{ readonly position: V; readonly k: number }> = ({ position, k }) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: P.alert, toneMapped: false, transparent: true }), []);
  mat.opacity = Math.min(1, k * 1.5);
  if (k <= 0.001) return null;
  return (
    <group position={v3(position)} scale={0.5 + 0.5 * k}>
      <mesh material={mat} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.03, 0.0045, 0.001]} />
      </mesh>
      <mesh material={mat} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.03, 0.0045, 0.001]} />
      </mesh>
    </group>
  );
};
