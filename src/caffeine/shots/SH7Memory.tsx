/**
 * SH7 · memory (~10 s), 3D.
 * "আরেকটা বিষয়। দিনে যা পড়েন, সেটা মগজে ভালোভাবে জমা হয় ঘুমের সময়। তাই রাত জেগে পড়লে পড়া হয় ঠিকই, কিন্তু মনে থাকে কম।"
 *  0 → দিনে   Realistic 3D brain in the hero zone. Six real 3D textbooks (Bangla subject names on the covers)
 *             pop in one by one and orbit it in a neat ring. Title "দিনের পড়া" on দিনে.
 *  মগজে       Camera pushes in.
 *  ঘুমের      Night falls (blue light, moon). The books fly one by one into the brain, which lights up
 *             cool blue as each lands. Label "ঘুমে পড়া পাকা হয়".
 *  তাই        Quick rewind: books fly back out, night lifts, camera pulls back.
 *  জেগে       Awake: brain dim and restless, books wobble outside and never go in. Title "রাত জাগলে".
 *  মনে        Three books crumble into dust and fall away. Label "মনে থাকে কম ↓" (red).
 */
import { useEffect, useMemo, useState } from "react";
import { AbsoluteFill, useDelayRender } from "remotion";
import * as THREE from "three";
import { Stage } from "../../kit/Stage";
import { ease, mix, mix3, prog, useSeconds } from "../../kit/time";
import { Brain } from "../three/Brain";
import { SciFX as PostFX } from "../three/sci/SciFX";
import { Cam, SciLights, Specks } from "../three/sci/Scene";
import { dist3, glowTexture, rnd } from "../three/sci/util";
import { K, bodyFont, headFont } from "../theme";
import type { Cue } from "../types";
import { Label, Title } from "../ui/Text";
import { shotDuration, wordAt } from "../vo";

export const SH7_DURATION = shotDuration("memory");
/** Caption words (exact VO tokens) to highlight. */
export const SH7_KEYWORDS: string[] = ["জমা", "ঘুমের", "কম"];

const T = {
  dine: wordAt("memory", "দিনে"),
  mogoje: wordAt("memory", "মগজে"),
  ghum: wordAt("memory", "ঘুমের"),
  tai: wordAt("memory", "তাই"),
  jege: wordAt("memory", "জেগে"),
  kintu: wordAt("memory", "কিন্তু"),
  mone: wordAt("memory", "মনে"),
};

/** Sound cues for this shot (sparse!). */
export const SH7_CUES: Cue[] = [
  { at: T.ghum + 0.75, sfx: "chime_store", volume: 0.45 },
  { at: T.tai - 0.05, sfx: "rewind", volume: 0.5 },
  { at: T.mone + 0.1, sfx: "paper", volume: 0.7 },
];

type V3 = [number, number, number];

const BOOKS = [
  { name: "গণিত", color: "#2f7fd6" },
  { name: "পদার্থ", color: "#d9822b" },
  { name: "ইংরেজি", color: "#2f9e62" },
  { name: "রসায়ন", color: "#c8483c" },
  { name: "বাংলা", color: "#7b55c7" },
  { name: "জীববিজ্ঞান", color: "#c9a227" },
] as const;
/** Books that are "forgotten" at মনে (index into BOOKS). */
const FORGET = [1, 3, 4];

const RING = { c: [0, 0.2, 0.35] as V3, rx: 0.98, ry: 0.95 };
const BRAIN_C: V3 = [0, 0.05, 0];
const BOOK_W = 0.42;
const BOOK_H = 0.56;
const BOOK_D = 0.1;

const ringPos = (i: number, t: number, messy: number): V3 => {
  const a = Math.PI / 2 + (i / BOOKS.length) * Math.PI * 2 + 0.52 + t * 0.06;
  const wob = 0.03 + messy * 0.16;
  return [
    RING.c[0] + Math.cos(a) * RING.rx + Math.sin(t * (0.9 + i * 0.17) + i) * wob,
    RING.c[1] + Math.sin(a) * RING.ry + Math.cos(t * (1.1 + i * 0.13) + i * 2) * wob,
    RING.c[2] + Math.sin(a * 2 + i) * 0.12,
  ];
};

/* ---------- book cover textures (Bangla text drawn with the loaded web font) ---------- */

const shade = (hex: string, k: number) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return `#${c.getHexString()}`;
};

const coverTexture = (name: string, color: string) => {
  const W = 320;
  const H = 427;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const g = cv.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, shade(color, 1.15));
  gr.addColorStop(1, shade(color, 0.72));
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  // spine shadow band + hinge line
  g.fillStyle = "rgba(0,0,0,0.28)";
  g.fillRect(0, 0, 26, H);
  g.fillStyle = "rgba(255,255,255,0.18)";
  g.fillRect(26, 0, 3, H);
  // frame
  g.strokeStyle = "rgba(255,244,220,0.55)";
  g.lineWidth = 4;
  g.strokeRect(48, 34, W - 76, H - 68);
  // title (shrink to fit)
  let size = 76;
  g.font = `800 ${size}px "${headFont}"`;
  while (g.measureText(name).width > W - 110 && size > 30) {
    size -= 2;
    g.font = `800 ${size}px "${headFont}"`;
  }
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillStyle = "rgba(0,0,0,0.35)";
  g.fillText(name, W / 2 + 13 + 3, H * 0.42 + 4);
  g.fillStyle = "#fff8ec";
  g.fillText(name, W / 2 + 13, H * 0.42);
  // small rule + class line
  g.fillStyle = "rgba(255,244,220,0.7)";
  g.fillRect(W / 2 + 13 - 50, H * 0.42 + size * 0.75, 100, 4);
  g.font = `600 30px "${bodyFont}"`;
  g.fillStyle = "rgba(255,244,220,0.85)";
  g.fillText("নবম-দশম শ্রেণি", W / 2 + 13, H * 0.8);
  // light grain
  for (let k = 0; k < 900; k++) {
    g.fillStyle = `rgba(255,255,255,${rnd(`cg${name}${k}`, 0, 0.05)})`;
    g.fillRect(rnd(`cx${name}${k}`, 0, W), rnd(`cy${name}${k}`, 0, H), 2, 2);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
};

const pagesTexture = (() => {
  let cached: THREE.Texture | null = null;
  return () => {
    if (cached) return cached;
    const cv = document.createElement("canvas");
    cv.width = 64;
    cv.height = 256;
    const g = cv.getContext("2d")!;
    g.fillStyle = "#efe6d2";
    g.fillRect(0, 0, 64, 256);
    for (let x = 0; x < 64; x += 2) {
      g.fillStyle = `rgba(120,100,70,${rnd(`pg${x}`, 0.05, 0.22)})`;
      g.fillRect(x, 0, 1, 256);
    }
    cached = new THREE.CanvasTexture(cv);
    cached.colorSpace = THREE.SRGBColorSpace;
    return cached;
  };
})();

/** Waits for the Bangla fonts, then draws the six covers (holds the render meanwhile). */
const useCovers = () => {
  const { delayRender, continueRender } = useDelayRender();
  const [covers, setCovers] = useState<THREE.Texture[] | null>(null);
  useEffect(() => {
    const handle = delayRender("SH7 book covers");
    let done = false;
    Promise.all([
      document.fonts.load(`800 60px "${headFont}"`, "গণিত"),
      document.fonts.load(`600 30px "${bodyFont}"`, "শ্রেণি"),
    ])
      .catch(() => undefined)
      .then(() => {
        if (done) return;
        setCovers(BOOKS.map((b) => coverTexture(b.name, b.color)));
        done = true;
        continueRender(handle);
      });
    return () => {
      if (!done) {
        done = true;
        continueRender(handle);
      }
    };
  }, [delayRender, continueRender]);
  return covers;
};

/* ---------- 3D pieces ---------- */

const Book: React.FC<{
  readonly cover: THREE.Texture;
  readonly color: string;
  readonly position: V3;
  readonly rotation: V3;
  readonly scale: number;
  readonly opacity: number;
  readonly glow: number;
  readonly glowColor: string;
}> = ({ cover, color, position, rotation, scale, opacity, glow, glowColor }) => {
  const mats = useMemo(() => {
    const pages = new THREE.MeshStandardMaterial({ map: pagesTexture(), roughness: 0.85 });
    const spine = new THREE.MeshPhysicalMaterial({ color: shade(color, 0.6), roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.35 });
    const front = new THREE.MeshPhysicalMaterial({ map: cover, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25 });
    const back = new THREE.MeshPhysicalMaterial({ color: shade(color, 0.8), roughness: 0.5, clearcoat: 0.5 });
    // box face order: +x, -x, +y, -y, +z, -z  (fore-edge right, spine left, pages top/bottom)
    return [pages, spine, pages, pages, front, back];
  }, [cover, color]);
  for (const m of mats) {
    m.transparent = opacity < 0.999;
    m.opacity = opacity;
    m.depthWrite = opacity > 0.5;
  }
  const front = mats[4] as THREE.MeshPhysicalMaterial;
  front.emissive.set(glowColor);
  front.emissiveIntensity = glow * 0.45;
  if (scale <= 0.01 || opacity <= 0.01) return null;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh material={mats} castShadow>
        <boxGeometry args={[BOOK_W, BOOK_H, BOOK_D]} />
      </mesh>
      {glow > 0.01 ? (
        <sprite position={[0, 0, -0.08]} scale={[1.3, 1.5, 1]}>
          <spriteMaterial map={glowTexture()} color={glowColor} transparent opacity={glow * 0.7 * opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ) : null}
    </group>
  );
};

/** Paper dust that breaks off a forgotten book. */
const Dust: React.FC<{ readonly i: number; readonly origin: V3; readonly k: number; readonly color: string }> = ({ i, origin, k, color }) => {
  if (k <= 0.01 || k >= 0.999) return null;
  const tex = glowTexture();
  return (
    <group>
      {Array.from({ length: 14 }, (_, j) => {
        const dx = rnd(`dx${i}-${j}`, -0.6, 0.6);
        const dy = rnd(`dy${i}-${j}`, -0.2, 0.5);
        const dz = rnd(`dz${i}-${j}`, -0.3, 0.3);
        const e = Math.sqrt(k);
        const p: V3 = [origin[0] + dx * e, origin[1] + dy * e - k * k * 0.9, origin[2] + dz * e];
        const s = rnd(`ds${i}-${j}`, 0.04, 0.1) * (1 - k * 0.5);
        return (
          <sprite key={j} position={p} scale={[s, s, 1]}>
            <spriteMaterial map={tex} color={j % 3 === 0 ? color : "#f3e6cc"} transparent opacity={(1 - k) * 0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </sprite>
        );
      })}
    </group>
  );
};

const Moon: React.FC<{ readonly k: number }> = ({ k }) => {
  if (k <= 0.01) return null;
  return (
    <group position={[0.95, 1.75, -2.6]}>
      <mesh>
        <sphereGeometry args={[0.16, 48, 32]} />
        <meshBasicMaterial color="#e9efff" transparent opacity={k} toneMapped={false} />
      </mesh>
      <sprite scale={[1.1, 1.1, 1]}>
        <spriteMaterial map={glowTexture()} color="#9db8ff" transparent opacity={0.35 * k} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
};

/** Big inverted sphere: warm dark by day, deep blue at night. */
const Backdrop: React.FC<{ readonly night: number; readonly awake: number }> = ({ night, awake }) => {
  const c = new THREE.Color("#140b08").lerp(new THREE.Color("#0b1030"), night).lerp(new THREE.Color("#1a0d0d"), awake * 0.6);
  return (
    <mesh>
      <sphereGeometry args={[30, 32, 16]} />
      <meshBasicMaterial color={c} side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
};

/* ---------- camera ---------- */

const camAt = (t: number) => {
  let z = mix(5.9, 5.5, prog(t, 0, T.mogoje, ease.cine));
  z = mix(z, 5.0, prog(t, T.mogoje - 0.1, T.mogoje + 0.8, ease.cine));
  let x = 0;
  x = mix(x, 0.35, prog(t, T.ghum, T.tai, ease.cine));
  z = mix(z, 4.4, prog(t, T.ghum, T.tai, ease.cine));
  // rewind snap back
  const r = prog(t, T.tai, T.tai + 0.45, ease.out);
  x = mix(x, 0, r);
  z = mix(z, 5.6, r);
  // awake: slow push, slight drift left toward the forgotten books
  z = mix(z, 5.1, prog(t, T.jege, SH7_DURATION, ease.cine));
  x = mix(x, -0.12, prog(t, T.mone - 0.3, SH7_DURATION, ease.cine));
  return { pos: [x, 0.35, z] as V3, subject: [x * 0.25, 0.08, 0] as V3 };
};

const World: React.FC<{ readonly covers: THREE.Texture[] }> = ({ covers }) => {
  const t = useSeconds();
  const night = prog(t, T.ghum - 0.1, T.ghum + 0.5) * (1 - prog(t, T.tai, T.tai + 0.4));
  const unstore = prog(t, T.tai, T.tai + 0.45, ease.inOut);
  const awake = prog(t, T.jege - 0.1, T.jege + 0.35);
  const { pos, subject } = camAt(t);

  let stored = 0;
  const books = BOOKS.map((b, i) => {
    const popK = prog(t, 0.3 + i * 0.22, 0.75 + i * 0.22, ease.out);
    const pop = popK < 1 ? popK * (1 + Math.sin(popK * Math.PI) * 0.25) : 1;
    const enterA = T.ghum + 0.1 + i * 0.12;
    const k = prog(t, enterA, enterA + 0.75, ease.cine) * (1 - unstore);
    stored += k;
    const ring = ringPos(i, t, awake);
    const p = mix3(ring, BRAIN_C, k);
    p[2] += Math.sin(k * Math.PI) * 0.7;
    p[1] += Math.sin(k * Math.PI) * 0.25;
    const fi = FORGET.indexOf(i);
    const f = fi >= 0 ? prog(t, T.mone - 0.15 + fi * 0.18, T.mone + 0.85 + fi * 0.18, ease.inQuad) : 0;
    p[1] -= f * f * 0.9;
    const face = Math.atan2(-(ring[0] - RING.c[0]), 6) * 0.6;
    const wobble = awake * Math.sin(t * 2.3 + i * 1.7) * 0.25;
    const rot: V3 = [0.08 + wobble * 0.4 + f * 0.8, face + k * Math.PI * 2 + wobble, Math.sin(t * 0.7 + i) * 0.06 + wobble * 0.5 - f * 1.2];
    return {
      i,
      b,
      p,
      rot,
      scale: pop * (1 - k * 0.9) * (1 - f * 0.4),
      opacity: Math.min(1, pop * 2) * (1 - f) * (k > 0.92 ? 1 - (k - 0.92) / 0.08 : 1),
      glow: Math.sin(Math.min(1, k * 1.2) * Math.PI) * 0.9 + night * 0.15,
      f,
      ring,
    };
  });
  const storedFrac = stored / BOOKS.length;

  const brainGlow = mix(0.45, 1.05, storedFrac * night) * (1 - awake * 0.45);
  const brainDim = awake * 0.35;
  const restless = awake * (0.5 + 0.5 * Math.sin(t * 7.3) * Math.sin(t * 3.1));
  const activity = night > 0.5 ? "#bcd0ff" : awake > 0.5 ? "#ff9a7a" : "#ffd08a";

  return (
    <>
      <Backdrop night={night} awake={awake} />
      <SciLights t={t} dim={night * 0.35 + awake * 0.25} rim={night > 0.5 ? "#8fb0ff" : "#ff9d6b"} />
      <directionalLight position={[2.5, 4, 2]} intensity={1.8 * night} color="#9db8ff" />
      <Cam pos={pos} subject={subject} mm={35} t={t} y={880} />

      <Brain
        t={t}
        glow={brainGlow + restless * 0.25}
        dim={brainDim}
        activity={activity}
        inner={1 + storedFrac * night * 0.8}
        position={BRAIN_C}
        rotation={[0.1, -1.47 + t * 0.012, 0]}
        scale={0.66}
      />
      {/* memory being stored: cool light through the brain */}
      <sprite position={[BRAIN_C[0], BRAIN_C[1] + 0.05, BRAIN_C[2] - 0.3]} scale={[2.6, 2.2, 1]}>
        <spriteMaterial map={glowTexture()} color="#7fa6ff" transparent opacity={0.55 * storedFrac * night} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
      {books.map((x) => (
        <Book
          key={x.b.name}
          cover={covers[x.i]}
          color={x.b.color}
          position={x.p}
          rotation={x.rot}
          scale={x.scale}
          opacity={x.opacity}
          glow={x.glow}
          glowColor={night > 0.3 ? "#9db8ff" : x.b.color}
        />
      ))}
      {books
        .filter((x) => x.f > 0)
        .map((x) => (
          <Dust key={`d${x.i}`} i={x.i} origin={x.ring} k={x.f} color={x.b.color} />
        ))}
      <Moon k={night} />
      <Specks t={t} center={[0, 0.5, -1.5]} spread={[8, 6, 4]} opacity={0.12} seed="mem" />

      <PostFX focus={dist3(pos, subject)} focusRange={1.6} bokeh={3} bloom={0.75} bloomThreshold={0.8} vignette={0.5} />
    </>
  );
};

export const SH7Memory: React.FC = () => {
  const covers = useCovers();
  return (
    <AbsoluteFill style={{ background: K.bg }}>
      {covers ? (
        <Stage background="#120a08">
          <World covers={covers} />
        </Stage>
      ) : null}

      {/* ---- text (max two at once) ---- */}
      <AbsoluteFill>
        <div style={{ position: "absolute", left: 80, right: 80, top: 250 }}>
          <Title at={T.dine} until={T.ghum - 0.15} size={112}>
            দিনের পড়া
          </Title>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 290, display: "flex", justifyContent: "center" }}>
          <Label at={T.ghum + 0.05} until={T.tai - 0.1} accent="#9db8ff" size={58}>
            ঘুমে পড়া পাকা হয়
          </Label>
        </div>
        <div style={{ position: "absolute", left: 80, right: 80, top: 200 }}>
          <Title at={T.jege} size={104} accent={K.amber}>
            রাত জাগলে
          </Title>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 385, display: "flex", justifyContent: "center" }}>
          <Label at={T.mone} accent={K.red} size={56}>
            মনে থাকে কম <span style={{ color: K.red, marginLeft: 6 }}>↓</span>
          </Label>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
