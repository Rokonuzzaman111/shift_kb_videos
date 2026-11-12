/**
 * S10: Chain reaction (VO "chain"). Continues the S09 look (same nucleon colours, cyan neutrons,
 * amber fission flashes, studio HDRI). Units: same as S09 (nucleus radius ~0.62).
 *
 *  0.0     The two fragments from S09 drift apart; 3 neutrons fly to 3 nearby U-235 nuclei
 *  ~1.2    Those 3 split (flash), each sends neutrons on → generations cascade through a field
 *          of ~150 nuclei (split time = parent split + travel time, nearest-parent graph)
 *  long pull-out (dist 6 → 46) so the cascade fills the frame by "কোটি"
 *  "কোটি"       chip "প্রতি সেকেন্ডে কোটি কোটি বার"
 *  "চেইন"       Pop "চেইন রিঅ্যাকশন"
 *  "হৃদপিণ্ড"   one heartbeat: whole field throbs + warm light pulse
 * Mesh budget: 3 near nuclei as 40-ball clusters, the field as textured single spheres (~2 halves each).
 */
import { useMemo } from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix, mix3, prog, useSeconds } from "../kit/time";
import { shotDuration, wordAt } from "../kit/vo";
import { softSprite } from "../three/textures";
import { C } from "../theme";
import { Chip, Flash, Pop } from "../ui";

export const S10_DURATION = shotDuration("chain");

const T = {
  koti: wordAt("chain", "কোটি"),
  chain: wordAt("chain", "চেইন"),
  heart: wordAt("chain", "হৃদপিণ্ড"),
};

const SPEED = 3.2; // neutron travel (units/s)
const FIELD = 150;

type Node = {
  p: THREE.Vector3;
  parent: number; // -1 = central split at t=0
  split: number; // seconds
  axis: THREE.Vector3;
  near: boolean;
};

/** Texture that reads as a packed cluster of red/grey nucleons on a single sphere. */
const nucleusTexture = () => {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s / 2;
  const g = c.getContext("2d")!;
  g.fillStyle = "#7e8894";
  g.fillRect(0, 0, s, s / 2);
  for (let i = 0; i < 520; i++) {
    const x = random(`nx${i}`) * s;
    const y = random(`ny${i}`) * (s / 2);
    const r = 9 + random(`nr${i}`) * 4;
    const proton = random(`np${i}`) < 0.39;
    const grad = g.createRadialGradient(x - r * 0.35, y - r * 0.35, 1, x, y, r);
    grad.addColorStop(0, proton ? "#ffb3a0" : "#e6edf3");
    grad.addColorStop(0.55, proton ? "#e2553b" : "#9eadbd");
    grad.addColorStop(1, proton ? "#6e1f12" : "#3c4550");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const buildGraph = (): Node[] => {
  const nodes: Node[] = [];
  // 3 nearby nuclei hit by the S09 neutrons
  const near = [new THREE.Vector3(1.6, 3.1, 0.6), new THREE.Vector3(2.2, -2.8, 0.9), new THREE.Vector3(-0.4, 0.5, 3.4)];
  near.forEach((p) => nodes.push({ p, parent: -1, split: p.length() / SPEED, axis: new THREE.Vector3(1, 0.3, 0).normalize(), near: true }));
  // Field nuclei in a tall slab that fits the 9:16 frame
  for (let i = 0; i < FIELD; i++) {
    const p = new THREE.Vector3((random(`fx${i}`) - 0.5) * 26, (random(`fy${i}`) - 0.5) * 46, (random(`fz${i}`) - 0.5) * 14 - 3);
    if (p.length() < 3.5) p.setLength(3.5 + random(`fl${i}`) * 2);
    nodes.push({
      p,
      parent: -1,
      split: Infinity,
      axis: new THREE.Vector3(random(`ax${i}`) - 0.5, random(`ay${i}`) - 0.5, random(`az${i}`) - 0.5).normalize(),
      near: false,
    });
  }
  // Dijkstra-like: each field nucleus is triggered by the earliest-arriving neutron from an already split one
  const done = new Set<number>([0, 1, 2]);
  while (done.size < nodes.length) {
    let best = -1;
    let bestT = Infinity;
    let bestParent = -1;
    for (let j = 0; j < nodes.length; j++) {
      if (done.has(j)) continue;
      done.forEach((i) => {
        const tt = nodes[i].split + 0.18 + nodes[i].p.distanceTo(nodes[j].p) / SPEED;
        if (tt < bestT) {
          bestT = tt;
          best = j;
          bestParent = i;
        }
      });
    }
    nodes[best].split = bestT;
    nodes[best].parent = bestParent;
    done.add(best);
  }
  return nodes;
};

const Glow: React.FC<{ tex: THREE.Texture; at: readonly number[]; size: number; color: string; opacity: number }> = ({ tex, at, size, color, opacity }) =>
  opacity <= 0.003 ? null : (
    <sprite position={[at[0], at[1], at[2]]} scale={[size, size, 1]}>
      <spriteMaterial map={tex} color={color} transparent opacity={Math.min(1, opacity)} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  );

const World: React.FC = () => {
  const t = useSeconds();
  const glow = useMemo(() => softSprite("rgba(255,255,255,1)"), []);
  const nodes = useMemo(buildGraph, []);
  const tex = useMemo(nucleusTexture, []);
  const sphereMat = useMemo(() => new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3, emissive: new THREE.Color("#b8460f"), emissiveIntensity: 0 }), [tex]);
  const hotMat = useMemo(() => {
    const m = sphereMat.clone();
    m.emissiveIntensity = 0.55;
    return m;
  }, [sphereMat]);
  const protonMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#e2553b", roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.18 }), []);
  const neutronMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#9eadbd", roughness: 0.28, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.18 }), []);
  const sphere = useMemo(() => new THREE.SphereGeometry(0.62, 28, 18), []);
  const half = useMemo(() => new THREE.SphereGeometry(0.5, 22, 14), []);
  const ball = useMemo(() => new THREE.SphereGeometry(0.16, 16, 10), []);
  const cluster = useMemo(() => {
    const golden = Math.PI * (3 - Math.sqrt(5));
    return new Array(40).fill(0).map((_, i) => {
      const r = 0.5 * Math.cbrt((i + 0.5) / 40);
      const y = 1 - (2 * (i + 0.5)) / 40;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i * 7.31;
      return { p: [Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r] as const, proton: random(`cp${i}`) < 0.39 };
    });
  }, []);

  // Heartbeat: one strong throb + a small echo
  const beat = prog(t, T.heart, T.heart + 0.12) * (1 - prog(t, T.heart + 0.12, T.heart + 0.45, ease.outCubic)) +
    0.5 * prog(t, T.heart + 0.5, T.heart + 0.6) * (1 - prog(t, T.heart + 0.6, T.heart + 0.9, ease.outCubic));
  const scale = 1 + beat * 0.05;

  // Camera: long pull-out
  const k = prog(t, 0, S10_DURATION, ease.inOut);
  const dist = mix(6.5, 46, Math.pow(k, 0.85));
  const orbit = mix(0.35, -0.25, k);
  const hh = handheld(t, 0.03 + dist * 0.004, 5);
  const camPos: [number, number, number] = [Math.sin(orbit) * dist + hh[0], 0.9 + dist * 0.08 + hh[1], Math.cos(orbit) * dist + hh[2]];
  const focus = Math.hypot(...camPos);

  // S09 fragments continuing to drift apart (single hot spheres)
  const fragSep = 0.62 + t * 0.12;

  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={0.7} rotation={t * 0.03} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} color="#fff4e8" />
      <directionalLight position={[-5, -2, -4]} intensity={1.4} color="#58c9ff" />
      <pointLight position={[0, 0, 2]} intensity={40 * beat} distance={60} decay={1} color="#ff8a3a" />

      <Lens mm={45} position={camPos} target={[0, 0, 0]} near={0.05} far={600} />

      <group scale={scale}>
        {/* S09 fragments */}
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={half} material={hotMat} position={[s * fragSep * 0.6, s * fragSep * 0.8, 0]} />
        ))}

        {nodes.map((n, i) => {
          const parentPos = n.parent < 0 ? new THREE.Vector3() : nodes[n.parent].p;
          const parentSplit = n.parent < 0 ? 0 : nodes[n.parent].split;
          const travel = prog(t, parentSplit + 0.18, n.split);
          const flash = prog(t, n.split - 0.02, n.split + 0.05) * (1 - prog(t, n.split + 0.05, n.split + 0.7, ease.outCubic));
          const heat = prog(t, n.split, n.split + 0.1) * (1 - 0.6 * prog(t, n.split + 0.4, n.split + 3));
          const after = Math.max(0, t - n.split);
          const sep = after > 0 ? 0.5 * ease.outCubic(Math.min(1, after / 1.2)) + after * 0.08 : 0;
          const neutronPos = mix3(parentPos.toArray(), n.p.toArray(), travel);
          return (
            <group key={i}>
              {/* incoming neutron with a short trail */}
              {t > parentSplit + 0.18 && t < n.split ? (
                <>
                  <Glow tex={glow} at={neutronPos} size={0.55} color={C.cyan} opacity={0.9} />
                  <Glow tex={glow} at={mix3(parentPos.toArray(), n.p.toArray(), Math.max(0, travel - 0.06))} size={0.4} color={C.cyan} opacity={0.4} />
                </>
              ) : null}
              {/* nucleus: intact, or two hot fragments flying apart */}
              {after <= 0 ? (
                n.near ? (
                  <group position={n.p.toArray()} rotation={[t * 0.2, t * 0.3, 0]}>
                    {cluster.map((c, j) => (
                      <mesh key={j} geometry={ball} material={c.proton ? protonMat : neutronMat} position={[c.p[0] + Math.sin(t * 10 + j) * 0.008, c.p[1], c.p[2]]} />
                    ))}
                  </group>
                ) : (
                  <mesh geometry={sphere} material={sphereMat} position={n.p.toArray()} rotation={[i, t * 0.2 + i, 0]} />
                )
              ) : (
                [-1, 1].map((s) => (
                  <mesh
                    key={s}
                    geometry={half}
                    material={hotMat}
                    scale={s < 0 ? 0.92 : 0.78}
                    position={[n.p.x + n.axis.x * sep * s, n.p.y + n.axis.y * sep * s, n.p.z + n.axis.z * sep * s]}
                  />
                ))
              )}
              <Glow tex={glow} at={n.p.toArray()} size={1.2 + flash * 4} color="#ffd08a" opacity={flash} />
              <Glow tex={glow} at={n.p.toArray()} size={2.4} color="#ff6a1f" opacity={heat * 0.28 * (1 + beat)} />
            </group>
          );
        })}
      </group>

      <PostFX focus={focus} focusRange={mix(2.5, 30, k)} bokeh={mix(3, 1.5, k)} bloom={0.9} bloomThreshold={0.75} />
    </>
  );
};

export const S10Chain: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (s: number) => Math.round(s * fps);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#03050a">
        <World />
      </Stage>
      <Flash at={f(T.heart)} color="#ff9a4a" len={f(0.5)} />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 250 }}>
        <Chip at={f(T.koti)} until={f(T.chain - 0.2)} accent={C.amber} size={46}>
          প্রতি সেকেন্ডে কোটি কোটি বার
        </Chip>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 220 }}>
        <Pop at={f(T.chain)} size={140} color={C.amber} glow>
          চেইন রিঅ্যাকশন
        </Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
