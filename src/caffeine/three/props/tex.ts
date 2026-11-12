/**
 * OWNER: props3d. Procedural canvas textures for the caffeine props (no downloads).
 * Everything is seeded (mulberry32 + periodic value noise) and cached per tab, so every frame is identical.
 */
import * as THREE from "three";

const cache = new Map<string, THREE.Texture>();
const cached = <T extends THREE.Texture>(key: string, make: () => T): T => {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const t = make();
  cache.set(key, t);
  return t;
};

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Integer hash → [0,1). */
const hash2 = (x: number, y: number, s: number) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Value noise, periodic with period (px, py) lattice cells. */
export const vnoise = (x: number, y: number, px: number, py: number, seed = 1) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = smooth(x - xi);
  const fy = smooth(y - yi);
  const m = (v: number, p: number) => ((v % p) + p) % p;
  const x0 = m(xi, px);
  const x1 = m(xi + 1, px);
  const y0 = m(yi, py);
  const y1 = m(yi + 1, py);
  const a = hash2(x0, y0, seed);
  const b = hash2(x1, y0, seed);
  const c = hash2(x0, y1, seed);
  const d = hash2(x1, y1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
};

/** Periodic fBm in [0,1]. */
export const fbm = (x: number, y: number, px: number, py: number, oct = 4, seed = 1) => {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < oct; o++) {
    sum += vnoise(x, y, px, py, seed + o * 17) * amp;
    norm += amp;
    x *= 2;
    y *= 2;
    px *= 2;
    py *= 2;
    amp *= 0.5;
  }
  return sum / norm;
};

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
};

const finish = (c: HTMLCanvasElement, srgb: boolean, repeat = false) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/**
 * Varnished dark-walnut planks running along U. Tileable. 1 tile = 4 planks.
 * Returns colour map + roughness map (also used as bump).
 */
export const woodTextures = () => {
  const size = 1024;
  const make = () => {
    const [c, ctx] = canvas(size, size);
    const [cr, ctxr] = canvas(size, size);
    const img = ctx.createImageData(size, size);
    const rimg = ctxr.createImageData(size, size);
    const planks = 4;
    const dark = [44, 25, 14];
    const mid = [92, 56, 32];
    const light = [128, 82, 48];
    for (let y = 0; y < size; y++) {
      const v = y / size;
      const plank = Math.floor(v * planks);
      const pv = v * planks - plank;
      const tint = 0.85 + hash2(plank, 7, 3) * 0.3;
      const shift = hash2(plank, 3, 9) * 50;
      for (let x = 0; x < size; x++) {
        const u = x / size;
        // long wavy growth rings
        const warp = fbm(u * 3 + shift, v * 6, 3, 6, 3, 11 + plank) * 2.2;
        const ring = (pv * 4 + warp * 1.6 + Math.sin(u * Math.PI * 2 + plank) * 0.25) % 1;
        const r = Math.pow(Math.abs(Math.sin(ring * Math.PI)), 6);
        // fine fibres
        const fib = vnoise(u * 12 + shift, v * 520, 12, 520, 5) * 0.6 + vnoise(u * 40, v * 1400, 40, 1400, 8) * 0.4;
        const big = fbm(u * 2, v * 3, 2, 3, 3, 21);
        let k = 0.3 + big * 0.6 - r * 0.22 + (fib - 0.5) * 0.18;
        k = Math.max(0, Math.min(1, k));
        const base = k < 0.5 ? [lerp(dark[0], mid[0], k * 2), lerp(dark[1], mid[1], k * 2), lerp(dark[2], mid[2], k * 2)] : [lerp(mid[0], light[0], k * 2 - 1), lerp(mid[1], light[1], k * 2 - 1), lerp(mid[2], light[2], k * 2 - 1)];
        // plank seams
        const seam = Math.min(pv, 1 - pv) * size / planks;
        const sk = seam < 1.5 ? 0.35 : seam < 3 ? 0.75 : 1;
        const i = (y * size + x) * 4;
        img.data[i] = Math.min(255, base[0] * tint * sk);
        img.data[i + 1] = Math.min(255, base[1] * tint * sk);
        img.data[i + 2] = Math.min(255, base[2] * tint * sk);
        img.data[i + 3] = 255;
        const rough = 70 + r * 50 + (1 - fib) * 30 + (seam < 3 ? 80 : 0);
        rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = rough;
        rimg.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    ctxr.putImageData(rimg, 0, 0);
    return { map: finish(c, true, true), rough: finish(cr, false, true) };
  };
  const key = "wood";
  if (!cache.has(key)) {
    const { map, rough } = make();
    cache.set(key, map);
    cache.set(key + "-r", rough);
  }
  return { map: cache.get(key)!, rough: cache.get(key + "-r")! };
};

/** Dark plaster wall, tileable, colour map. */
export const plasterTexture = () =>
  cached("plaster", () => {
    const size = 512;
    const [c, ctx] = canvas(size, size);
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const n = fbm(x / 64, y / 64, 8, 8, 5, 31);
        const s = vnoise(x / 2, y / 2, 256, 256, 77);
        const v = 70 + n * 50 + s * 10;
        const i = (y * size + x) * 4;
        img.data[i] = v * 0.98;
        img.data[i + 1] = v * 0.9;
        img.data[i + 2] = v * 0.82;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return finish(c, true, true);
  });

const BN_WORDS = (
  "কোষ শক্তি তাপ বল গতি ত্বরণ পদার্থ রাসায়নিক বিক্রিয়া অণু পরমাণু ইলেকট্রন প্রোটন নিউক্লিয়াস " +
  "ভর ওজন ঘনত্ব আয়তন চাপ তাপমাত্রা তরল গ্যাস কঠিন সূত্র সমীকরণ মান একক সংজ্ঞা উদাহরণ " +
  "অধ্যায় প্রশ্ন উত্তর কারণ ফলে তাই এবং বা যখন তখন হয় করে থাকে দেখা যায় বলা হয় নির্ণয় কর"
).split(" ");

/**
 * One textbook page: warm paper, a chapter heading, justified Bangla body text and a small diagram.
 * `side` 0 = left page, 1 = right page.
 */
export const pageTexture = (side: 0 | 1) =>
  cached(`page${side}`, () => {
    const W = 768;
    const H = 1088;
    const [c, ctx] = canvas(W, H);
    const rnd = mulberry32(101 + side * 7);
    ctx.fillStyle = "#efe5d0";
    ctx.fillRect(0, 0, W, H);
    // paper fibre noise + slight yellowing toward the outer edge
    const img = ctx.getImageData(0, 0, W, H);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const n = (hash2(x, y, 4 + side) - 0.5) * 10 + (vnoise(x / 40, y / 40, 64, 64, 9) - 0.5) * 10;
        const edge = side === 0 ? 1 - x / W : x / W;
        img.data[i] += n - edge * edge * 10;
        img.data[i + 1] += n - edge * edge * 14;
        img.data[i + 2] += n - edge * edge * 24;
      }
    }
    ctx.putImageData(img, 0, 0);
    const mx = 70;
    const gutter = side === 0 ? 0 : 20;
    let y = 110;
    ctx.fillStyle = "#2a211b";
    if (side === 0) {
      ctx.font = "bold 44px 'Nirmala UI', 'Hind Siliguri', sans-serif";
      ctx.fillText("অধ্যায় ৫: কোষ ও শক্তি", mx + gutter, y);
      y += 30;
      ctx.fillRect(mx + gutter, y, W - mx * 2 - 20, 3);
      y += 56;
    } else {
      ctx.font = "bold 34px 'Nirmala UI', 'Hind Siliguri', sans-serif";
      ctx.fillText("৫.২ বিক্রিয়ার হার", mx + gutter, y);
      y += 60;
    }
    ctx.font = "27px 'Nirmala UI', 'Hind Siliguri', sans-serif";
    const lineH = 42;
    const diagramAt = side === 1 ? 520 : -1;
    while (y < H - 90) {
      if (diagramAt > 0 && y > diagramAt && y < diagramAt + 260) {
        // simple figure: beaker + molecule sketch
        ctx.strokeStyle = "#3a2e26";
        ctx.lineWidth = 3;
        ctx.strokeRect(mx + gutter, diagramAt + 10, 300, 210);
        ctx.beginPath();
        ctx.arc(mx + gutter + 90, diagramAt + 115, 42, 0, Math.PI * 2);
        ctx.arc(mx + gutter + 200, diagramAt + 95, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx + gutter + 130, diagramAt + 108);
        ctx.lineTo(mx + gutter + 172, diagramAt + 100);
        ctx.stroke();
        ctx.font = "22px 'Nirmala UI', sans-serif";
        ctx.fillText("চিত্র ৫.৩", mx + gutter + 330, diagramAt + 120);
        ctx.font = "27px 'Nirmala UI', 'Hind Siliguri', sans-serif";
        y = diagramAt + 270;
        continue;
      }
      const para = rnd() < 0.12;
      let x = mx + gutter + (para ? 40 : 0);
      const maxX = W - mx + (side === 0 ? -20 : 0);
      while (x < maxX - 40) {
        const w = BN_WORDS[Math.floor(rnd() * BN_WORDS.length)];
        const ww = ctx.measureText(w).width;
        if (x + ww > maxX) break;
        ctx.globalAlpha = 0.82 + rnd() * 0.15;
        ctx.fillText(w, x, y);
        x += ww + 11;
      }
      ctx.globalAlpha = 1;
      y += para ? lineH + 14 : lineH;
    }
    // highlighter stroke on one line (a student's book)
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#ffe14d";
    ctx.fillRect(mx + gutter - 4, side === 0 ? 300 : 260, 420, 34);
    ctx.globalAlpha = 1;
    // page number
    ctx.fillStyle = "#5b4b3e";
    ctx.font = "24px 'Nirmala UI', sans-serif";
    ctx.fillText(side === 0 ? "৮৪" : "৮৫", side === 0 ? mx : W - mx - 30, H - 40);
    return finish(c, true);
  });

/** Stacked page edges (fine horizontal lines), for book block sides. */
export const pageEdgeTexture = () =>
  cached("pageEdge", () => {
    const [c, ctx] = canvas(64, 256);
    ctx.fillStyle = "#e9dfc9";
    ctx.fillRect(0, 0, 64, 256);
    for (let y = 0; y < 256; y += 2) {
      ctx.fillStyle = `rgba(110,90,70,${0.12 + hash2(y, 1, 2) * 0.25})`;
      ctx.fillRect(0, y, 64, 1);
    }
    const t = finish(c, true, true);
    return t;
  });

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bnNum = (n: number) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

/** Alarm-clock dial: cream face, minute ticks, bold Bangla numerals. */
export const dialTexture = () =>
  cached("dial", () => {
    const S = 1024;
    const [c, ctx] = canvas(S, S);
    const cx = S / 2;
    const g = ctx.createRadialGradient(cx, cx * 0.9, 50, cx, cx, cx);
    g.addColorStop(0, "#fbf6ea");
    g.addColorStop(0.85, "#f1e8d4");
    g.addColorStop(1, "#cfc2a6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = "#1d1714";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const big = i % 5 === 0;
      ctx.save();
      ctx.translate(cx, cx);
      ctx.rotate(a);
      ctx.fillRect(big ? -7 : -2.5, -cx * 0.93, big ? 14 : 5, big ? 46 : 22);
      ctx.restore();
    }
    ctx.font = "bold 118px 'Nirmala UI', 'Hind Siliguri', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let h = 1; h <= 12; h++) {
      const a = (h / 12) * Math.PI * 2;
      const r = cx * 0.68;
      ctx.fillText(bnNum(h), cx + Math.sin(a) * r, cx - Math.cos(a) * r + 6);
    }
    return finish(c, true);
  });

/** Wispy steam puff (white, alpha from noise × radial falloff). */
export const steamTexture = (variant: number) =>
  cached(`steam${variant}`, () => {
    const S = 256;
    const [c, ctx] = canvas(S, S);
    const img = ctx.createImageData(S, S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = (x - S / 2) / (S / 2);
        const dy = (y - S / 2) / (S / 2);
        const d = Math.sqrt(dx * dx * 1.4 + dy * dy * 0.8);
        const fall = Math.max(0, 1 - d);
        const n = fbm(x / 40 + variant * 3, y / 26, 64, 64, 5, 50 + variant);
        const wisp = Math.max(0, n - 0.38) * 2.2;
        const a = Math.pow(fall, 1.6) * wisp;
        const i = (y * S + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.min(255, a * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
    return finish(c, true);
  });

/** Soft round blob (alpha), for contact shadows and glows. */
export const blobTexture = () =>
  cached("blob", () => {
    const S = 128;
    const [c, ctx] = canvas(S, S);
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.5, "rgba(0,0,0,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return finish(c, true);
  });

/** Milk-tea surface: creamy centre with faint swirl, foam ring and tiny bubbles near the rim. */
export const teaTopTexture = () =>
  cached("teaTop", () => {
    const S = 512;
    const [c, ctx] = canvas(S, S);
    const img = ctx.createImageData(S, S);
    const base = [196, 142, 92];
    const foam = [232, 206, 166];
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = (x - S / 2) / (S / 2);
        const dy = (y - S / 2) / (S / 2);
        const r = Math.sqrt(dx * dx + dy * dy);
        const ang = Math.atan2(dy, dx);
        const swirl = fbm(r * 6 + ang * 0.8, ang * 3, 64, 64, 4, 61);
        const ring = Math.max(0, Math.min(1, (r - 0.72) / 0.2));
        const foamK = Math.min(1, ring * (0.6 + fbm(x / 10, y / 10, 64, 64, 3, 63) * 0.8));
        let k = foamK;
        k += (swirl - 0.5) * 0.25;
        k = Math.max(0, Math.min(1, k));
        const i = (y * S + x) * 4;
        img.data[i] = lerp(base[0], foam[0], k);
        img.data[i + 1] = lerp(base[1], foam[1], k);
        img.data[i + 2] = lerp(base[2], foam[2], k);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    // bubbles in the foam ring
    const rnd = mulberry32(9);
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2;
      const r = (0.74 + rnd() * 0.25) * (S / 2);
      const br = 1.5 + rnd() * rnd() * 7;
      const x = S / 2 + Math.cos(a) * r;
      const y = S / 2 + Math.sin(a) * r;
      ctx.beginPath();
      ctx.arc(x, y, br, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(240,220,185,0.9)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - br * 0.3, y - br * 0.3, br * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();
    }
    return finish(c, true);
  });

/** Soft white dot with a hot core (alpha), for glowing particles. */
export const dotTexture = () =>
  cached("dot", () => {
    const S = 64;
    const [c, ctx] = canvas(S, S);
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.75)");
    g.addColorStop(0.6, "rgba(255,255,255,0.15)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return finish(c, true);
  });
