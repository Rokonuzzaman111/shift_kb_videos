/**
 * S20: Power reaches the city (VO "city"). Units: metres.
 * 400 kV double-circuit lattice towers (~55 m) march toward a city at dusk. A glowing pulse
 * runs along the conductors; when it arrives the city's windows switch on in a wave
 * spreading outward. Pop "লক্ষ লক্ষ ঘর" on "লক্ষ".
 */
import { useMemo } from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HDRI, Lighting, usePBR } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix, mix3, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { softSprite } from "../three/textures";
import { C } from "../theme";
import { Pop } from "../ui";

export const S20_DURATION = shotDuration("city", 0.6);

const T = {
  pulse: 0.3,
  arrive: wordAt("city", "জ্বালাবে"),
  pop: wordAt("city", "লক্ষ"),
};

const TOWER_H = 55;
const SPAN = 380;
const TOWERS = 6;
const CITY_Z = -TOWERS * SPAN - 300;

/** Steel lattice tower: four tapering legs, horizontal panels, X-bracing and 3 cross-arms per side. */
const latticeTower = () => {
  const parts: THREE.BufferGeometry[] = [];
  const member = (a: THREE.Vector3, b: THREE.Vector3, r = 0.18) => {
    const len = a.distanceTo(b);
    const g = new THREE.BoxGeometry(r, len, r);
    g.translate(0, len / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    g.applyQuaternion(q);
    g.translate(a.x, a.y, a.z);
    parts.push(g);
  };
  const half = (y: number) => mix(6, 1.6, Math.min(1, y / (TOWER_H * 0.75)));
  const levels = [0, 10, 20, 30, 38, 46, TOWER_H];
  const corners = (y: number) => {
    const h = half(y);
    return [new THREE.Vector3(-h, y, -h), new THREE.Vector3(h, y, -h), new THREE.Vector3(h, y, h), new THREE.Vector3(-h, y, h)];
  };
  for (let l = 0; l < levels.length - 1; l++) {
    const A = corners(levels[l]);
    const B = corners(levels[l + 1]);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      member(A[i], B[i], 0.35); // leg
      member(B[i], B[j], 0.15); // horizontal
      member(A[i], B[j], 0.1); // X-bracing
      member(A[j], B[i], 0.1);
    }
  }
  // three cross-arms (one per phase) carrying conductors on both sides
  [30, 38, 46].forEach((y, k) => {
    const reach = [13, 15, 11][k];
    member(new THREE.Vector3(-reach, y, 0), new THREE.Vector3(reach, y, 0), 0.4);
    member(new THREE.Vector3(-reach, y, 0), new THREE.Vector3(-half(y), y + 3, 0), 0.15);
    member(new THREE.Vector3(reach, y, 0), new THREE.Vector3(half(y), y + 3, 0), 0.15);
  });
  return mergeGeometries(parts);
};

/** Building window texture (lit pattern in emissive, frame grid in albedo). */
const windowTexture = (seed: number) => {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 64, 128);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 8; x++) {
      if (random(`win${seed}-${x}-${y}`) < 0.72) {
        ctx.fillStyle = random(`wc${seed}-${x}-${y}`) > 0.3 ? "#ffcf8a" : "#e8f1ff";
        ctx.fillRect(x * 8 + 2, y * 8 + 2, 4, 5);
      }
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

const World: React.FC = () => {
  const t = useSeconds();
  const concrete = usePBR("concrete_wall_008", [2, 4]);
  const tower = useMemo(latticeTower, []);
  const glow = useMemo(() => softSprite("rgba(255,255,255,1)"), []);
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7c858d", metalness: 0.9, roughness: 0.45 }), []);
  const wireMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3a3f45", metalness: 0.8, roughness: 0.4, emissive: "#ffc46a" }), []);
  const winTex = useMemo(() => [0, 1, 2, 3].map(windowTexture), []);

  // Conductors: catenary sag between consecutive towers, 3 phases × 2 sides
  const attach = useMemo(
    () => [
      [-13, 30],
      [13, 30],
      [-15, 38],
      [15, 38],
      [-11, 46],
      [11, 46],
    ],
    [],
  );
  const wires = useMemo(() => {
    const out: THREE.BufferGeometry[] = [];
    attach.forEach(([x, y]) => {
      for (let i = 0; i < TOWERS - 1; i++) {
        const z0 = -i * SPAN;
        const z1 = -(i + 1) * SPAN;
        const pts: THREE.Vector3[] = [];
        for (let k = 0; k <= 20; k++) {
          const u = k / 20;
          pts.push(new THREE.Vector3(x, y - 2 - Math.sin(u * Math.PI) * 14, mix(z0, z1, u)));
        }
        out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.12, 6, false));
      }
    });
    return mergeGeometries(out);
  }, [attach]);

  // City blocks with per-building switch-on time (wave from the substation side)
  const buildings = useMemo(
    () =>
      new Array(150).fill(0).map((_, i) => {
        const x = (random(`cx${i}`) - 0.5) * 1400;
        const z = CITY_Z - random(`cz${i}`) * 900;
        const h = 15 + Math.pow(random(`ch${i}`), 2) * 110;
        const w = 20 + random(`cw${i}`) * 30;
        const d = Math.hypot(x, z - CITY_Z);
        return { x, z, h, w, d: 20 + random(`cd${i}`) * 25, delay: d / 900, tex: i % 4 };
      }),
    [],
  );
  const bMats = useMemo(
    () =>
      buildings.map((b) => {
        const em = winTex[b.tex].clone();
        em.repeat.set(Math.max(1, Math.round(b.w / 14)), Math.max(1, Math.round(b.h / 18)));
        em.needsUpdate = true;
        return new THREE.MeshStandardMaterial({
          color: "#3d4048",
          roughness: 0.8,
          normalMap: concrete.normalMap,
          emissiveMap: em,
          emissive: "#ffffff",
          emissiveIntensity: 0,
        });
      }),
    [buildings, winTex, concrete],
  );

  // Pulse along the line (towers 0 → last), arriving at T.arrive
  const pulseK = prog(t, T.pulse, T.arrive, ease.inQuad);
  const pulseZ = mix(60, -(TOWERS - 1) * SPAN, pulseK);
  wireMat.emissiveIntensity = 0.15 + (pulseK > 0 && pulseK < 1 ? 0.25 : 0) + prog(t, T.arrive, T.arrive + 1, ease.out) * 0.35;
  buildings.forEach((b, i) => {
    const on = prog(t, T.arrive + b.delay * 1.4, T.arrive + b.delay * 1.4 + 0.25, ease.out);
    bMats[i].emissiveIntensity = on * 2.2;
  });
  const cityGlow = prog(t, T.arrive, T.arrive + 1.6, ease.out);

  // Camera: from beside the first tower, dolly + rise along the line toward the city
  const k = prog(t, 0, S20_DURATION, ease.cine);
  const hh = handheld(t, 0.6, 5);
  const pos = mix3([70, 38, 160], [120, 160, -900], k);
  const target = mix3([-10, 40, -400], [0, 40, CITY_Z - 300], k);
  const focus = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]);

  return (
    <>
      <Lighting hdri={HDRI.dusk} intensity={0.25} background rotation={0.4} />
      <fog attach="fog" args={["#2a2440", 900, 4200]} />
      <directionalLight position={[-400, 120, -900]} intensity={0.6} color="#ff9a6a" />
      <hemisphereLight args={["#40507a", "#120f0c", 0.35]} />

      <Lens mm={30} position={[pos[0] + hh[0], pos[1] + hh[1], pos[2] + hh[2]]} target={target} near={1} far={9000} />

      {/* Ground: fields, then the city */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -2000]}>
        <planeGeometry args={[9000, 9000]} />
        <meshStandardMaterial color="#1a1f17" roughness={1} />
      </mesh>

      {new Array(TOWERS).fill(0).map((_, i) => (
        <mesh key={i} geometry={tower} material={steel} position={[0, 0, -i * SPAN]} />
      ))}
      <mesh geometry={wires} material={wireMat} />

      {/* Travelling energy pulse on each conductor */}
      {pulseK > 0 && pulseK < 1
        ? attach.map(([x, y], i) => (
            <group key={i}>
              {[0, 1, 2, 3, 4].map((j) => (
                <sprite key={j} position={[x, y - 9, pulseZ + j * 22]} scale={[34 - j * 5, 34 - j * 5, 1]}>
                  <spriteMaterial map={glow} color={C.amber} transparent opacity={0.85 - j * 0.16} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
                </sprite>
              ))}
            </group>
          ))
        : null}

      {buildings.map((b, i) => (
        <mesh key={i} material={bMats[i]} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
        </mesh>
      ))}
      {/* sky-glow over the city once it is lit */}
      <sprite position={[0, 120, CITY_Z - 400]} scale={[2600, 900, 1]}>
        <spriteMaterial map={glow} color="#ffb060" transparent opacity={cityGlow * 0.35} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>

      <PostFX focus={focus} focusRange={2500} bokeh={1.5} bloom={1.0} bloomThreshold={0.7} />
    </>
  );
};

export const S20City: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#0b0d18">
        <World />
      </Stage>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 230 }}>
        <Pop at={f(T.pop)} size={132} color={C.amber} glow>
          লক্ষ লক্ষ ঘর
        </Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
