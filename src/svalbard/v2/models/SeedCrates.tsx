/**
 * Sealed seed crates arriving at the vault (Part 3 A close-ups): ribbed grey/black plastic crates with white
 * barcode labels (genebank code + simplified palette-only flag decal) stacking onto a wooden pallet.
 * Units: metres. Pallet 1.2 × 0.8 at the origin; crates 0.6 × 0.4 × 0.32, 2 × 2 per layer.
 */
import { RoundedBox } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { usePBR } from "../../../kit/assets";
import { canvasTex, rng } from "../../three/util";
import { P } from "../palette";

type V = [number, number, number];
export const CRATE = { w: 0.6, d: 0.4, h: 0.32 } as const;
export const PALLET_H = 0.144;

type Flag = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => void;
const stripesH = (cols: string[]): Flag => (g, x, y, w, h) => cols.forEach((c, i) => ((g.fillStyle = c), g.fillRect(x, y + (i * h) / cols.length, w, h / cols.length + 1)));
const stripesV = (cols: string[]): Flag => (g, x, y, w, h) => cols.forEach((c, i) => ((g.fillStyle = c), g.fillRect(x + (i * w) / cols.length, y, w / cols.length + 1, h)));
const disc = (field: string, dot: string, dx = 0.5): Flag => (g, x, y, w, h) => {
  g.fillStyle = field;
  g.fillRect(x, y, w, h);
  g.fillStyle = dot;
  g.beginPath();
  g.arc(x + w * dx, y + h / 2, h * 0.3, 0, Math.PI * 2);
  g.fill();
};
const cross = (field: string, a: string, b: string): Flag => (g, x, y, w, h) => {
  g.fillStyle = field;
  g.fillRect(x, y, w, h);
  g.fillStyle = a;
  g.fillRect(x + w * 0.28, y, h * 0.28, h);
  g.fillRect(x, y + h * 0.36, w, h * 0.28);
  g.fillStyle = b;
  g.fillRect(x + w * 0.31, y, h * 0.14, h);
  g.fillRect(x, y + h * 0.43, w, h * 0.14);
};

export type CrateInfo = { code: string; inst: string; flag: Flag; dark: boolean };
export const CRATES: CrateInfo[] = [
  { code: "NOR-NGB 0078", inst: "NordGen", flag: cross(P.alert, P.snow, P.steel), dark: true },
  { code: "IND-NBPGR 1187", inst: "NBPGR", flag: stripesH([P.amber, P.snow, P.vaultTeal]), dark: false },
  { code: "JPN-NIAS 2290", inst: "NARO Genebank", flag: disc(P.snow, P.alert), dark: true },
  { code: "USA-NPGS 3320", inst: "USDA NPGS", flag: stripesH([P.alert, P.snow, P.alert, P.snow, P.alert]), dark: false },
  { code: "DEU-IPK 3341", inst: "IPK Gatersleben", flag: stripesH([P.night, P.alert, P.amber]), dark: false },
  { code: "PER-CIP 0915", inst: "CIP", flag: stripesV([P.alert, P.snow, P.alert]), dark: true },
  // heroes (land on camera): Mexico (CIMMYT), Philippines (IRRI), Syria/Lebanon (ICARDA)
  { code: "MEX-CIMMYT 0412", inst: "CIMMYT", flag: stripesV([P.vaultTeal, P.snow, P.alert]), dark: false },
  { code: "PHL-IRRI 2093", inst: "IRRI", flag: stripesH([P.steel, P.alert]), dark: true },
  { code: "LBN-ICARDA 0561", inst: "ICARDA", flag: stripesH([P.alert, P.snow, P.night]), dark: false },
];

/** slot centre (bottom of crate) for slot index: layer-major, 2 × 2 per layer */
export const slotPos = (layer: number, ix: number, iz: number): V => [(ix - 0.5) * CRATE.w, PALLET_H + layer * (CRATE.h + 0.004), (iz - 0.5) * CRATE.d];
export const SLOTS: V[] = [
  slotPos(0, 0, 0),
  slotPos(0, 1, 0),
  slotPos(0, 0, 1),
  slotPos(0, 1, 1),
  slotPos(1, 0, 0),
  slotPos(1, 1, 0),
  slotPos(1, 0, 1), // hero 1 (front-left, layer 1)
  slotPos(1, 1, 1), // hero 2 (front-right, layer 1)
  slotPos(2, 0, 1), // hero 3 (front-left, layer 2)
];
/** label centre on the +z face of a crate in slot i */
export const labelPos = (i: number): V => [SLOTS[i][0] + 0.06, SLOTS[i][1] + CRATE.h * 0.5, SLOTS[i][2] + CRATE.d / 2 + 0.003];

const labelTex = (c: CrateInfo, seed: number) =>
  canvasTex(512, 256, (g) => {
    g.fillStyle = "#f4f6f7";
    g.fillRect(0, 0, 512, 256);
    c.flag(g, 22, 22, 120, 80);
    g.strokeStyle = "rgba(7,13,22,0.35)";
    g.lineWidth = 2;
    g.strokeRect(22, 22, 120, 80);
    g.fillStyle = P.night;
    g.font = "bold 40px Arial, sans-serif";
    g.fillText(c.code, 162, 62);
    g.font = "26px Arial, sans-serif";
    g.fillStyle = "#3a4552";
    g.fillText(c.inst + " · SGSV", 162, 98);
    // barcode
    const r = rng(seed);
    let x = 24;
    while (x < 488) {
      const w = 2 + Math.floor(r() * 5);
      if (r() > 0.4) {
        g.fillStyle = P.night;
        g.fillRect(x, 130, w, 82);
      }
      x += w + 1;
    }
    g.font = "20px Arial, sans-serif";
    g.fillStyle = P.night;
    g.fillText(`SV-${(seed * 7919 + 104729).toString().slice(0, 8)}`, 24, 240);
  });

const useRibNormal = () =>
  useMemo(() => {
    const t = canvasTex(
      256,
      64,
      (g) => {
        const img = g.createImageData(256, 64);
        for (let x = 0; x < 256; x++) {
          const s = Math.sin((x / 256) * Math.PI * 2 * 12);
          const nx = Math.sign(s) * Math.pow(Math.abs(s), 6) * 0.8;
          for (let y = 0; y < 64; y++) {
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
  }, []);

export const Crate: React.FC<{ readonly info: CrateInfo; readonly seed: number; readonly position: V; readonly yaw?: number }> = ({ info, seed, position, yaw = 0 }) => {
  const rib = useRibNormal();
  const body = useMemo(
    () => new THREE.MeshStandardMaterial({ color: info.dark ? "#25292e" : "#59616a", roughness: 0.55, normalMap: rib, normalScale: new THREE.Vector2(0.6, 0.6) }),
    [info.dark, rib],
  );
  const lid = useMemo(() => new THREE.MeshStandardMaterial({ color: info.dark ? "#2d3237" : "#646c75", roughness: 0.5 }), [info.dark]);
  const lab = useMemo(() => new THREE.MeshStandardMaterial({ map: labelTex(info, seed), roughness: 0.6 }), [info, seed]);
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} rotation={[0, yaw, 0]}>
      <RoundedBox args={[CRATE.w - 0.01, CRATE.h - 0.03, CRATE.d - 0.01]} radius={0.015} smoothness={3} position={[0, (CRATE.h - 0.03) / 2, 0]} material={body} castShadow receiveShadow />
      <RoundedBox args={[CRATE.w, 0.03, CRATE.d]} radius={0.01} smoothness={2} position={[0, CRATE.h - 0.015, 0]} material={lid} castShadow receiveShadow />
      {/* hand holes on the short ends */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (CRATE.w / 2 - 0.002), CRATE.h * 0.72, 0]} rotation={[0, (s * Math.PI) / 2, 0]}>
          <planeGeometry args={[0.12, 0.035]} />
          <meshStandardMaterial color="#0c0f12" roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0.06, CRATE.h * 0.5, CRATE.d / 2 + 0.003]} material={lab}>
        <planeGeometry args={[0.3, 0.15]} />
      </mesh>
    </group>
  );
};

export const Pallet: React.FC = () => {
  const wood = useMemo(() => {
    const tex = canvasTex(
      256,
      256,
      (g) => {
        const r = rng(9);
        g.fillStyle = "#9b8160";
        g.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 90; i++) {
          g.strokeStyle = `rgba(${r() < 0.5 ? "70,52,34" : "190,170,140"},${0.15 + r() * 0.25})`;
          g.lineWidth = 1 + r() * 2;
          const y = r() * 256;
          g.beginPath();
          g.moveTo(0, y);
          g.bezierCurveTo(80, y + (r() - 0.5) * 10, 170, y + (r() - 0.5) * 10, 256, y + (r() - 0.5) * 6);
          g.stroke();
        }
      },
      [1, 1],
    );
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
  }, []);
  const parts: { p: V; s: V }[] = [];
  for (let i = 0; i < 5; i++) parts.push({ p: [-0.5 + i * 0.25, PALLET_H - 0.011, 0], s: [0.14, 0.022, 0.8] });
  for (const x of [-0.55, 0, 0.55]) for (const z of [-0.34, 0, 0.34]) parts.push({ p: [x, 0.05, z], s: [0.1, 0.078, 0.12] });
  for (const x of [-0.55, 0, 0.55]) parts.push({ p: [x, 0.011, 0], s: [0.1, 0.022, 0.8] });
  for (const z of [-0.34, 0, 0.34]) parts.push({ p: [0, PALLET_H - 0.033, z], s: [1.2, 0.022, 0.1] });
  return (
    <group>
      {parts.map((q, i) => (
        <mesh key={i} position={q.p} material={wood} castShadow receiveShadow>
          <boxGeometry args={q.s} />
        </mesh>
      ))}
    </group>
  );
};

/** loading-bay floor + back wall (concrete PBR) */
export const LoadingBay: React.FC = () => {
  const floor = usePBR("concrete_wall_008", [3, 3]);
  const wall = usePBR("concrete_wall_008", [4, 2]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial {...floor} color="#6f7882" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2, -1.6]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial {...wall} color="#56616c" />
      </mesh>
    </group>
  );
};

/** pallet + crates; `drop[i]` (0..1) = landing progress for the three hero crates (slots 6, 7, 8) */
export const CrateStack: React.FC<{ readonly drop: readonly [number, number, number] }> = ({ drop }) => (
  <group>
    <Pallet />
    {SLOTS.map((s, i) => {
      const h = i >= 6 ? drop[i - 6] : 1;
      if (h <= 0) return null;
      // fall from 0.45 m with a tiny settle bounce
      const fall = h < 0.8 ? 0.45 * (1 - Math.pow(h / 0.8, 2)) : 0.008 * Math.sin(((h - 0.8) / 0.2) * Math.PI);
      return <Crate key={i} info={CRATES[i]} seed={i + 3} position={[s[0], s[1] + fall, s[2]]} yaw={i >= 6 ? (1 - Math.min(1, h / 0.8)) * 0.08 : 0} />;
    })}
  </group>
);
