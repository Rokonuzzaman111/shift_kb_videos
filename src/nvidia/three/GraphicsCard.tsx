/**
 * OWNER: 3D agent. Triple-fan gaming graphics card, units = cm. Centred on origin, fans face +Z,
 * long axis X (30.4 cm), PCIe fingers at the bottom (y ≈ -6.9), I/O bracket at -X.
 *
 *  - fanSpeed  revolutions / second (rotation comes from the frame; > ~4 adds a motion-blur disc)
 *  - assemble  0..1  parts fly in along Z (0 = exploded front-to-back, 1 = built). Default 1.
 *  - accent    0..1  green light strip intensity
 */
import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { N } from "../theme";
import type { FXProps } from "./FX";
import { Inst, type Xf } from "./Inst";
import { type Cam, orbit, Studio, type V3 } from "./Studio";
import { brushedTextures, pcbTextures, smudgeTexture } from "./tex";

const L = 30.4;
const Hh = 12.2;
const FAN_X = [-9.4, 0, 9.4];
const FAN_R = 4.35;
const HOLE_R = 4.55;
const Z_SHROUD = 3.0;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - Math.pow(1 - clamp01(v), 3);

const chamferRect = (w: number, h: number, c: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + c, -h / 2);
  s.lineTo(w / 2 - c * 2.2, -h / 2);
  s.lineTo(w / 2, -h / 2 + c * 2.2);
  s.lineTo(w / 2, h / 2 - c);
  s.lineTo(w / 2 - c, h / 2);
  s.lineTo(-w / 2 + c * 2.2, h / 2);
  s.lineTo(-w / 2, h / 2 - c * 2.2);
  s.lineTo(-w / 2, -h / 2 + c);
  s.closePath();
  return s;
};

/** Helicoid fan blade: smooth parametric surface (radius × chord grid) with real pitch, swept tip. */
const bladeGeometry = (count: number) => {
  const r0 = 1.45;
  const r1 = FAN_R - 0.08;
  const span = ((Math.PI * 2) / count) * 0.92;
  const NU = 24;
  const NV = 14;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= NU; i++) {
    const k = i / NU;
    const r = r0 + (r1 - r0) * k;
    const lead = 0.35 * Math.pow(k, 1.4);
    // chord narrows into a rounded tip
    const w = span * (0.55 + 0.45 * k) * (k > 0.9 ? Math.sqrt(Math.max(0, 1 - ((k - 0.9) / 0.1) ** 2)) * 0.6 + 0.4 : 1);
    for (let j = 0; j <= NV; j++) {
      const v = j / NV;
      const a = lead - w * v;
      const camber = Math.sin(v * Math.PI) * 0.12;
      const z = (0.5 - v) * w * (1.9 - 0.5 * k) + 0.55 + camber;
      pos.push(Math.cos(a) * r, Math.sin(a) * r, z);
      uv.push(k, v);
    }
  }
  for (let i = 0; i < NU; i++)
    for (let j = 0; j < NV; j++) {
      const a = i * (NV + 1) + j;
      const b = a + NV + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

const useCardMaterials = () =>
  useMemo(() => {
    const b = brushedTextures(3);
    const pcb = pcbTextures();
    const smudge = smudgeTexture(4);
    const rep = (t: THREE.Texture, r: number) => {
      const c = t.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(r, r);
      c.needsUpdate = true;
      return c;
    };
    const shroudRough = rep(b.roughnessMap, 1 / 16);
    const shroudBump = rep(b.bumpMap, 1 / 16);
    const sm = rep(smudge, 1 / 14);
    return {
      shroud: new THREE.MeshPhysicalMaterial({
        color: "#3a3e43",
        metalness: 0.9,
        roughness: 0.9,
        roughnessMap: shroudRough,
        bumpMap: shroudBump,
        bumpScale: 0.6,
        anisotropy: 0.7,
        clearcoat: 0.25,
        clearcoatRoughness: 0.35,
      }),
      shroudDark: new THREE.MeshPhysicalMaterial({ color: "#0c0d0f", metalness: 0.3, roughness: 0.22, roughnessMap: sm, clearcoat: 1, clearcoatRoughness: 0.08 }),
      backplate: new THREE.MeshPhysicalMaterial({ color: "#2b2e32", metalness: 0.95, roughness: 0.8, roughnessMap: rep(b.roughnessMap, 1 / 18), bumpMap: rep(b.bumpMap, 1 / 18), bumpScale: 0.4, anisotropy: 0.6, clearcoat: 0.15 }),
      pcb: new THREE.MeshPhysicalMaterial({ map: rep(pcb.map, 1 / 12), normalMap: rep(pcb.normalMap, 1 / 12), roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 }),
      pcbEdge: new THREE.MeshStandardMaterial({ color: "#2a2f22", roughness: 0.7 }),
      gold: new THREE.MeshStandardMaterial({ color: "#e6b85c", metalness: 1, roughness: 0.2, roughnessMap: sm }),
      fin: new THREE.MeshStandardMaterial({ color: "#c9ccd0", metalness: 1, roughness: 0.32 }),
      copper: new THREE.MeshPhysicalMaterial({ color: "#d07a4a", metalness: 1, roughness: 0.25, clearcoat: 0.4 }),
      blade: new THREE.MeshPhysicalMaterial({ color: "#0d0e10", metalness: 0, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.25, sheen: 0.3, sheenColor: new THREE.Color("#30343a"), side: THREE.DoubleSide }),
      hub: new THREE.MeshPhysicalMaterial({ color: "#16171a", metalness: 0.4, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }),
      hubRing: new THREE.MeshStandardMaterial({ color: "#a9adb3", metalness: 1, roughness: 0.18 }),
      bracket: new THREE.MeshStandardMaterial({ color: "#8d9096", metalness: 1, roughness: 0.4, roughnessMap: rep(b.roughnessMap, 1 / 6) }),
      port: new THREE.MeshStandardMaterial({ color: "#050505", roughness: 0.6 }),
      plastic: new THREE.MeshStandardMaterial({ color: "#0e0f10", roughness: 0.55 }),
      led: new THREE.MeshBasicMaterial({ color: new THREE.Color(N.greenHi).multiplyScalar(2.4), toneMapped: false }),
      blur: new THREE.MeshBasicMaterial({ color: "#0b0c0d", transparent: true, opacity: 0.5, depthWrite: false }),
    };
  }, []);

const Fan: React.FC<{ angle: number; m: ReturnType<typeof useCardMaterials>; blade: THREE.BufferGeometry; blur: number }> = ({ angle, m, blade, blur }) => {
  const blades = 11;
  return (
    <group>
      {/* frame ring + 3 struts behind blades */}
      <mesh material={m.plastic} position={[0, 0, -0.1]}>
        <torusGeometry args={[HOLE_R - 0.05, 0.12, 8, 64]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={m.plastic} rotation-z={(i * Math.PI * 2) / 3 + 0.4} position={[0, 0, -0.35]}>
          <boxGeometry args={[HOLE_R * 2, 0.25, 0.12]} />
        </mesh>
      ))}
      <group rotation-z={angle}>
        {Array.from({ length: blades }, (_, i) => (
          <mesh key={i} geometry={blade} material={m.blade} rotation-z={(i * Math.PI * 2) / blades} castShadow />
        ))}
        {/* outer blade ring (modern fans tie the tips together) */}
        <mesh material={m.blade} position={[0, 0, 0.55]}>
          <torusGeometry args={[FAN_R - 0.04, 0.07, 6, 64]} />
        </mesh>
      </group>
      <mesh material={m.hub} rotation-x={Math.PI / 2} position={[0, 0, 0.5]}>
        <cylinderGeometry args={[1.45, 1.5, 1.0, 48]} />
      </mesh>
      <mesh material={m.hubRing} position={[0, 0, 1.005]}>
        <ringGeometry args={[0.95, 1.08, 48]} />
      </mesh>
      {blur > 0.01 ? (
        <mesh position={[0, 0, 1.0]} material={m.blur}>
          <ringGeometry args={[1.5, FAN_R, 48]} />
        </mesh>
      ) : null}
    </group>
  );
};

export const GraphicsCard: React.FC<{
  readonly fanSpeed?: number;
  readonly assemble?: number;
  readonly accent?: number;
  readonly position?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: number;
}> = ({ fanSpeed = 0.4, assemble = 1, accent = 1, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = useCardMaterials();
  const geo = useMemo(() => {
    const shape = chamferRect(L, Hh, 0.9);
    for (const x of FAN_X) {
      const h = new THREE.Path();
      h.absarc(x, 0, HOLE_R, 0, Math.PI * 2, true);
      shape.holes.push(h);
    }
    const shroud = new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 3, curveSegments: 64 });
    // skirt: chamfered ring around the edge
    const outer = chamferRect(L, Hh, 0.9);
    const inner = chamferRect(L - 0.5, Hh - 0.5, 0.8);
    outer.holes.push(new THREE.Path(inner.getPoints()));
    const skirt = new THREE.ExtrudeGeometry(outer, { depth: 1.1, bevelEnabled: false });
    // raised angular accent panels on the shroud face
    const panel = new THREE.Shape();
    panel.moveTo(-L / 2 + 0.6, Hh / 2 - 0.6);
    panel.lineTo(-4.2, Hh / 2 - 0.6);
    panel.lineTo(-5.4, Hh / 2 - 1.6);
    panel.lineTo(-L / 2 + 1.4, Hh / 2 - 1.6);
    panel.closePath();
    const panelGeo = new THREE.ExtrudeGeometry(panel, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
    const back = chamferRect(L, Hh, 0.9);
    const backGeo = new THREE.ExtrudeGeometry(back, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
    return { shroud, skirt, panelGeo, backGeo, blade: bladeGeometry(11), box: new THREE.BoxGeometry(1, 1, 1) };
  }, []);
  const fins = useMemo(() => {
    const items: Xf[] = [];
    for (let x = -L / 2 + 0.8; x < L / 2 - 0.6; x += 0.19) items.push({ p: [x, 0.1, 1.55], s: [0.035, Hh - 1.6, 2.5] });
    return items;
  }, []);
  const fingers = useMemo(() => {
    const items: Xf[] = [];
    let k = 0;
    for (let x = -12.6; x < -4.4; x += 0.1, k++) {
      if (k === 11) continue; // key notch
      items.push({ p: [x, -Hh / 2 - 0.55, 0.08], s: [0.06, 0.62, 0.17] });
    }
    return items;
  }, []);
  const pipes = useMemo(
    () =>
      [-5.5, -1.5, 2.5, 6.5].map((x, i) => {
        const c = new THREE.CatmullRomCurve3([
          new THREE.Vector3(x - 3, Hh / 2 - 0.7, 1.0),
          new THREE.Vector3(x - 1.5 + i * 0.2, Hh / 2 + 0.25, 1.2 + (i % 2) * 0.5),
          new THREE.Vector3(x + 2, Hh / 2 + 0.25, 1.2 + (i % 2) * 0.5),
          new THREE.Vector3(x + 5, Hh / 2 - 0.7, 1.0),
        ]);
        return new THREE.TubeGeometry(c, 48, 0.3, 14, false);
      }),
    [],
  );
  const angle = -(frame / fps) * fanSpeed * Math.PI * 2;
  const blur = clamp01((Math.abs(fanSpeed) - 4) / 8);
  const a = assemble;
  const part = (i: number) => easeOut((a - i * 0.13) / 0.48);
  const off = (i: number, dist: number) => (1 - part(i)) * dist;
  return (
    <group position={position as [number, number, number]} rotation={rotation as [number, number, number]} scale={scale}>
      {/* backplate */}
      <group position={[0, 0, -0.55 + off(0, -9)]}>
        <mesh geometry={geo.backGeo} material={m.backplate} castShadow receiveShadow />
        {[-8, -4, 0, 4, 8].map((x) => (
          <mesh key={x} position={[x + 3, -2.5, -0.06]} material={m.port}>
            <boxGeometry args={[2.4, 0.35, 0.12]} />
          </mesh>
        ))}
      </group>
      {/* PCB + PCIe fingers + power connector */}
      <group position={[0, 0, off(1, -5)]}>
        <mesh material={[m.pcbEdge, m.pcbEdge, m.pcbEdge, m.pcbEdge, m.pcb, m.pcb]} position={[0.2, -0.1, 0.08]} castShadow receiveShadow>
          <boxGeometry args={[L - 1, Hh - 0.6, 0.16]} />
        </mesh>
        <mesh material={[m.pcbEdge, m.pcbEdge, m.pcbEdge, m.pcbEdge, m.pcb, m.pcb]} position={[-8.5, -Hh / 2 - 0.45, 0.08]}>
          <boxGeometry args={[8.6, 0.9, 0.16]} />
        </mesh>
        <Inst geometry={geo.box} material={m.gold} items={fingers} />
        <mesh material={m.plastic} position={[4, Hh / 2 - 0.1, 0.9]} castShadow>
          <boxGeometry args={[2.0, 0.9, 0.9]} />
        </mesh>
      </group>
      {/* heatsink: fin stack + heat-pipes */}
      <group position={[0, 0, off(2, 2)]}>
        <Inst geometry={geo.box} material={m.fin} items={fins} castShadow />
        {pipes.map((p, i) => (
          <mesh key={i} geometry={p} material={m.copper} castShadow />
        ))}
      </group>
      {/* shroud */}
      <group position={[0, 0, off(3, 8)]}>
        <mesh geometry={geo.skirt} material={m.shroud} position={[0, 0, Z_SHROUD - 1.1]} castShadow receiveShadow />
        <mesh geometry={geo.shroud} material={m.shroud} position={[0, 0, Z_SHROUD]} castShadow receiveShadow />
        <mesh geometry={geo.panelGeo} material={m.shroudDark} position={[0, 0, Z_SHROUD + 0.47]} />
        <mesh geometry={geo.panelGeo} material={m.shroudDark} position={[0, 0, Z_SHROUD + 0.47]} rotation-z={Math.PI} />
        {/* green accent strip along the top edge + under-glow */}
        <mesh position={[3.5, Hh / 2 + 0.13, Z_SHROUD - 0.2]} material={m.led}>
          <boxGeometry args={[16, 0.06, 0.6]} />
        </mesh>
        <rectAreaLight position={[3.5, Hh / 2 + 0.3, Z_SHROUD - 0.2]} rotation-x={Math.PI / 2} width={16} height={0.6} intensity={6 * accent} color={N.green} />
        {/* I/O bracket */}
        <group position={[-L / 2 - 0.15, -0.6, 0.8]}>
          <mesh material={m.bracket} castShadow>
            <boxGeometry args={[0.1, Hh + 0.6, 4.2]} />
          </mesh>
          {[-3.5, -1.2, 1.1, 3.4].map((y, i) => (
            <mesh key={i} material={m.port} position={[-0.06, y, i % 2 ? -0.9 : 0.9]}>
              <boxGeometry args={[0.04, 1.3, 0.55]} />
            </mesh>
          ))}
        </group>
      </group>
      {/* fans */}
      <group position={[0, 0, Z_SHROUD - 0.2 + off(4, 13)]}>
        {FAN_X.map((x, i) => (
          <group key={x} position={[x, 0, 0]}>
            <Fan angle={angle + i * 0.7 * (i === 1 ? -1 : 1)} m={m} blade={geo.blade} blur={blur} />
          </group>
        ))}
      </group>
    </group>
  );
};

/** Studio shot of the card; `t` 0..1 drives a slow orbit + push-in. `camera` overrides. */
export const GraphicsCardShot: React.FC<
  React.ComponentProps<typeof GraphicsCard> & { readonly t?: number; readonly camera?: Cam; readonly fx?: Partial<FXProps> }
> = ({ t = 0, camera, fx, ...card }) => {
  const target: V3 = [0, Hh / 2 + 0.6, 0];
  const r = 64 - t * 12;
  const cam: Cam = camera ?? { pos: orbit(target, r, 14 - t * 4, -0.6 + t * 0.55), target, mm: 50, focus: r, range: 30 };
  return (
    <Studio camera={cam} size={30} fx={fx}>
      {/* standing on its bracket edge, fans to camera */}
      <GraphicsCard {...card} position={[0, 7.1, 0]} />
    </Studio>
  );
};
