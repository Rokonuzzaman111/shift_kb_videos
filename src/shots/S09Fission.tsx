/**
 * S09: Hero fission long take (~17s), timed to public/vo/fission.json.
 *
 * Beats (shot seconds; VO starts at VO_START):
 *  0.0 to 4.6   Dolly from the uranium atom's electron haze into the nucleus (scale: nucleus ~1/100,000 of atom)
 *  2.0          "ইউরেনিয়াম-২৩৫" label + legend (92 p, 143 n)
 *  5.8 to 7.4   "ভারী আর অস্থির": nucleus jitter grows
 *  6.6 to 8.0   Neutron approaches with a speed ramp, impact on "ছুঁয়ে"
 *  8.0 to 9.05  Nucleus stretches into a peanut shape
 *  9.05         Split on "ফেটে": flash, Ba-141 + Kr-92 fly apart, 3 neutrons released
 *  12.4         "প্রচণ্ড তাপ": fragments glow hot
 *  13.4         "ছিটকে": camera favours the released neutrons
 */
import { useMemo } from "react";
import { AbsoluteFill, random, useVideoConfig } from "remotion";
import * as THREE from "three";
import { HDRI, Lighting } from "../kit/assets";
import { PostFX } from "../kit/PostFX";
import { Lens, Stage } from "../kit/Stage";
import { ease, handheld, mix, mix3, prog, useSeconds } from "../kit/time";
import { softSprite } from "../three/textures";
import { C, bodyFont } from "../theme";
import { Chip, Flash, Pop } from "../ui";

export const S09_DURATION = 17;
export const VO_START = 0.4;
const T = {
  label: 2.0,
  unstable: 5.8 + VO_START,
  neutronIn: 6.4 + VO_START,
  impact: 7.6 + VO_START,
  split: 8.65 + VO_START,
  heat: 11.97 + VO_START,
  fly: 13.0 + VO_START,
  newN: 14.1 + VO_START,
};

const R = 0.1; // nucleon radius
const PACK = 0.62;
const N = 235;
const PROTONS = 92;
const BA = 141; // fragment A: barium-141, the rest (92) is krypton-92 (+3 free neutrons)

type Nucleon = { p: THREE.Vector3; proton: boolean; frag: 0 | 1; phase: number; packed: THREE.Vector3 };

/** Dense ball of `count` nucleons (golden-spiral shells), radius scales with cbrt(A). */
const packBall = (count: number, seed: string) => {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const r0 = PACK * Math.cbrt(count / N);
  return new Array(count).fill(0).map((_, i) => {
    const r = r0 * Math.cbrt((i + 0.5) / count);
    const y = 1 - (2 * (i + 0.5)) / count;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i * 7.31;
    const j = (k: string) => (random(`${seed}${k}${i}`) - 0.5) * 0.04;
    return new THREE.Vector3(Math.cos(th) * rad * r + j("x"), y * r + j("y"), Math.sin(th) * rad * r + j("z"));
  });
};

const buildNucleus = (): Nucleon[] => {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts = new Array(N).fill(0).map((_, i) => {
    const r = PACK * Math.cbrt((i + 0.5) / N);
    const y = 1 - (2 * (i + 0.5)) / N;
    const rad = Math.sqrt(1 - y * y);
    const th = golden * i * 7.31;
    const j = (k: string) => (random(`${k}${i}`) - 0.5) * 0.045;
    return new THREE.Vector3(Math.cos(th) * rad * r + j("x"), y * r + j("y"), Math.sin(th) * rad * r + j("z"));
  });
  // Fission axis = x. Lowest-x 141 nucleons become Ba, the rest Kr.
  const byX = pts.map((p, i) => ({ p, i })).sort((a, b) => a.p.x - b.p.x);
  const frag = new Array<0 | 1>(N);
  byX.forEach((o, rank) => (frag[o.i] = rank < BA ? 0 : 1));
  const order = pts.map((_, i) => i).sort((a, b) => random(`ord${a}`) - random(`ord${b}`));
  const isP = new Array(N).fill(false);
  order.slice(0, PROTONS).forEach((i) => (isP[i] = true));
  // After the split each fragment settles into its own compact nucleus around its centroid:
  // inner nucleons go to inner packed slots so nobody crosses through the middle.
  const packed = new Array<THREE.Vector3>(N);
  ([0, 1] as const).forEach((f) => {
    const members = pts.map((p, i) => ({ p, i })).filter((o) => frag[o.i] === f);
    const c = members.reduce((a, o) => a.add(o.p), new THREE.Vector3()).divideScalar(members.length);
    const slots = packBall(members.length, `f${f}`);
    members.sort((a, b) => a.p.distanceTo(c) - b.p.distanceTo(c));
    members.forEach((o, k) => (packed[o.i] = slots[k].clone().add(c)));
  });
  return pts.map((p, i) => ({ p, proton: isP[i], frag: frag[i], phase: random(`ph${i}`) * Math.PI * 2, packed: packed[i] }));
};

const Glow: React.FC<{ tex: THREE.Texture; at: readonly number[]; size: number; color: string; opacity: number }> = ({
  tex,
  at,
  size,
  color,
  opacity,
}) =>
  opacity <= 0.001 ? null : (
    <sprite position={[at[0], at[1], at[2]]} scale={[size, size, 1]}>
      <spriteMaterial
        map={tex}
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );

const NeutronBall: React.FC<{ tex: THREE.Texture; path: (t: number) => readonly number[]; t: number }> = ({
  tex,
  path,
  t,
}) => (
  <group>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
      <Glow key={k} tex={tex} at={path(t - k * 0.022)} size={0.42 - k * 0.03} color={C.cyan} opacity={0.42 - k * 0.042} />
    ))}
    <mesh position={path(t) as [number, number, number]}>
      <sphereGeometry args={[R, 48, 24]} />
      <meshStandardMaterial color="#d9fbff" emissive="#3fe0ff" emissiveIntensity={3.2} roughness={0.25} toneMapped={false} />
    </mesh>
    <Glow tex={tex} at={path(t)} size={0.7} color={C.cyan} opacity={0.55} />
  </group>
);

const World: React.FC = () => {
  const t = useSeconds();
  const glow = useMemo(() => softSprite("rgba(255,255,255,1)"), []);
  const nucleus = useMemo(buildNucleus, []);
  const ball = useMemo(() => new THREE.SphereGeometry(R, 40, 20), []);
  const protonMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#e2553b",
        roughness: 0.32,
        clearcoat: 0.8,
        clearcoatRoughness: 0.18,
        sheen: 0.4,
        sheenColor: new THREE.Color("#ffb59c"),
      }),
    [],
  );
  const neutronMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#9eadbd",
        roughness: 0.28,
        metalness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.18,
      }),
    [],
  );
  // Fragment heat: lerp nucleon emissive towards orange
  protonMat.emissive.set("#c2380c");
  neutronMat.emissive.set("#b8460f");
  const heatK = prog(t, T.split, T.split + 0.25) * (1 - prog(t, T.split + 0.25, T.heat - 0.6) * 0.65) + prog(t, T.heat - 0.4, T.heat + 0.3, ease.out) * 0.5 * (1 - prog(t, T.heat + 1.5, S09_DURATION));
  protonMat.emissiveIntensity = heatK * 0.45;
  neutronMat.emissiveIntensity = heatK * 0.35;

  // Electron probability haze of the whole atom (radius 18 here; real atom is ~100,000x the nucleus)
  const haze = useMemo(
    () =>
      new Array(70).fill(0).map((_, i) => {
        const v = new THREE.Vector3(random(`hx${i}`) - 0.5, random(`hy${i}`) - 0.5, random(`hz${i}`) - 0.5).normalize();
        const d = 3 + Math.pow(random(`hd${i}`), 0.6) * 16;
        return { p: v.multiplyScalar(d), s: 6 + random(`hs${i}`) * 10 };
      }),
    [],
  );

  // ----- Nucleus dynamics -----
  const jitterAmp = 0.006 + prog(t, T.unstable, T.impact, ease.inOut) * 0.018 + (t > T.impact && t < T.split ? 0.02 : 0);
  const stretch = prog(t, T.impact, T.split, ease.inQuad);
  const relax = prog(t, T.split, T.split + 1.2, ease.outCubic);
  const elong = stretch * (1 - relax);
  const sepK = prog(t, T.split, T.split + 4.5, ease.outCubic);
  const sep = sepK * 0.62 + Math.max(0, t - T.split - 4.5) * 0.025;
  const impactKick = prog(t, T.impact, T.impact + 0.25) * (1 - prog(t, T.impact + 0.25, T.split));

  // Fission axis tilted so fragments travel along the tall 9:16 frame
  const AXIS_ROT = 0.95;

  // ----- Neutrons -----
  const inStart = new THREE.Vector3(-4.6, -3.4, 2.4);
  const inEnd = new THREE.Vector3(-0.66, 0, 0.06);
  const inPath = (tt: number) => {
    // speed ramp: fast travel, then a slow-motion last stretch before contact
    const k = prog(tt, T.neutronIn, T.impact, (x) => (x < 0.75 ? (x / 0.75) * 0.9 : 0.9 + ((x - 0.75) / 0.25) * 0.1));
    return mix3(inStart.toArray(), inEnd.toArray(), k);
  };
  const outDirs = useMemo(
    () => [new THREE.Vector3(0.25, 1, 0.35), new THREE.Vector3(0.35, -0.95, 0.4), new THREE.Vector3(-0.1, 0.15, 1)].map((v) => v.normalize()),
    [],
  );
  const outPath = (dir: THREE.Vector3) => (tt: number) => {
    const s = Math.max(0, tt - T.split) * 1.15;
    return [dir.x * s, dir.y * s, dir.z * s];
  };

  // ----- Camera -----
  const dolly = prog(t, 0, 4.6, ease.cine);
  const dist = mix(46, 4.6, Math.pow(dolly, 0.55)) + prog(t, T.split + 0.2, S09_DURATION, ease.inOut) * 3.6;
  const orbit = mix(-0.55, 0.35, prog(t, 0, S09_DURATION, ease.inOut));
  const shake = t > T.split && t < T.split + 0.6 ? (1 - (t - T.split) / 0.6) * 0.06 : 0;
  const hh = handheld(t, 0.012 + shake, 2);
  const favour = prog(t, T.fly, T.fly + 1.6, ease.cine) * 0.45;
  const camPos: [number, number, number] = [
    Math.sin(orbit) * dist + hh[0],
    0.55 + dist * 0.12 + hh[1] + favour * 0.4,
    Math.cos(orbit) * dist + hh[2],
  ];
  const target: [number, number, number] = [0, favour * 0.3, 0];
  const focusDist = Math.hypot(camPos[0] - target[0], camPos[1] - target[1], camPos[2] - target[2]);

  const flash = prog(t, T.split - 0.03, T.split + 0.05) * (1 - prog(t, T.split + 0.05, T.split + 0.9, ease.outCubic));
  const hazeOpacity = 0.06 * (1 - prog(t, 2.6, 4.4));

  return (
    <>
      <Lighting hdri={HDRI.studio} intensity={0.75} rotation={t * 0.03} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} color="#fff4e8" />
      <directionalLight position={[-5, -2, -4]} intensity={1.6} color="#58c9ff" />
      <pointLight position={[0, 0, 0.8]} intensity={heatK * 18} distance={6} decay={2} color="#ff8a3a" />

      <Lens mm={55} position={camPos} target={target} near={0.02} far={400} />

      {/* Atom's electron haze */}
      {haze.map((h, i) => (
        <Glow key={i} tex={glow} at={h.p.toArray()} size={h.s} color="#4f86ff" opacity={hazeOpacity} />
      ))}

      <group rotation={[0, 0, AXIS_ROT]} position={[0, -0.55 * prog(t, T.split, T.split + 2, ease.inOut), 0]}>
        {[0, 1].map((f) => {
          const side = f === 0 ? -1 : 1;
          const offset = side * sep * (f === 0 ? 0.85 : 1.15); // lighter Kr moves faster (momentum)
          return (
            <group key={f} position={[offset + side * impactKick * 0.03, 0, 0]} rotation={[0, side * sepK * 0.9, side * sepK * 0.6]}>
              {nucleus.map((n, i) => {
                if (n.frag !== f) return null;
                const jx = Math.sin(t * 9 + n.phase) * jitterAmp;
                const jy = Math.sin(t * 11 + n.phase * 1.7) * jitterAmp;
                const jz = Math.sin(t * 7 + n.phase * 2.3) * jitterAmp;
                const x = n.p.x;
                const neck = Math.exp(-((x / 0.26) ** 2));
                const yz = (1 - 0.1 * elong) * (1 - 0.5 * elong * neck);
                const stretched = [x * (1 + 0.6 * elong) + side * 0.06 * elong, n.p.y * yz, n.p.z * yz];
                const pos = mix3(stretched, n.packed.toArray(), relax);
                return (
                  <mesh
                    key={i}
                    geometry={ball}
                    material={n.proton ? protonMat : neutronMat}
                    position={[pos[0] + jx, pos[1] + jy, pos[2] + jz]}
                  />
                );
              })}
              <Glow tex={glow} at={[f === 0 ? -0.2 : 0.3, 0, 0]} size={2.2} color="#ff5a14" opacity={heatK * 0.22} />
            </group>
          );
        })}

        {t >= T.neutronIn && t < T.impact + 0.03 ? <NeutronBall tex={glow} path={inPath} t={t} /> : null}
        {t >= T.split ? outDirs.map((d, k) => <NeutronBall key={k} tex={glow} path={outPath(d)} t={t} />) : null}

        <Glow tex={glow} at={[0, 0, 0.3]} size={1 + flash * 12} color="#fff0d8" opacity={flash} />
      </group>

      <PostFX focus={focusDist} focusRange={1.8} bokeh={3.2} bloom={0.7} bloomThreshold={0.85} />
    </>
  );
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span
    style={{
      display: "inline-block",
      width: 24,
      height: 24,
      borderRadius: 99,
      background: color,
      boxShadow: `0 0 12px ${color}`,
      marginRight: 10,
      verticalAlign: "-3px",
    }}
  />
);

export const S09Fission: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = useSeconds();
  const f = (s: number) => Math.round(s * fps);
  const legend = prog(t, T.label + 0.5, T.label + 0.9) * (1 - prog(t, T.impact - 0.4, T.impact));
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Stage background="#03050a">
        <World />
      </Stage>
      <Flash at={f(T.split)} color="#ffd8a0" len={f(0.7)} />

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, gap: 20 }}>
        <Chip at={f(0.5)} until={f(T.label - 0.2)} accent="#4f86ff" size={40}>
          ইউরেনিয়াম পরমাণু
        </Chip>
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", paddingTop: 230, gap: 22 }}>
        <Chip at={f(T.label)} until={f(T.impact - 0.4)} accent={C.amber} size={46}>
          ইউরেনিয়াম-২৩৫ নিউক্লিয়াস
        </Chip>
        <div style={{ display: "flex", gap: 30, fontFamily: bodyFont, fontWeight: 700, fontSize: 36, color: C.ink, opacity: legend }}>
          <span>
            <Dot color="#e2553b" />৯২ প্রোটন
          </span>
          <span>
            <Dot color="#9eadbd" />১৪৩ নিউট্রন
          </span>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", paddingTop: 210 }}>
        <Pop at={f(T.split + 0.1)} size={170} color={C.amber} glow>
          ফিশন!
        </Pop>
        <div style={{ display: "flex", gap: 18, marginTop: 14 }}>
          <Chip at={f(T.split + 0.7)} accent={C.ink} size={36}>
            বেরিয়াম-১৪১
          </Chip>
          <Chip at={f(T.split + 0.9)} accent={C.ink} size={36}>
            ক্রিপ্টন-৯২
          </Chip>
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 16 }}>
          <Chip at={f(T.heat)} accent={C.orange} size={42}>
            প্রচণ্ড তাপ
          </Chip>
          <Chip at={f(T.newN)} accent={C.cyan} size={42}>
            + ৩টি নতুন নিউট্রন
          </Chip>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
