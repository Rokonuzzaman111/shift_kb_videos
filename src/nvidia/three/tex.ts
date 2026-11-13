/**
 * OWNER: 3D agent. Procedural, seeded canvas textures for the Nvidia hardware (no downloads).
 * Every generator is deterministic (mulberry32) and cached per tab, so all frames are identical.
 */
import * as THREE from "three";

const cache = new Map<string, unknown>();
const cached = <T>(key: string, make: () => T): T => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
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

const canvas = (w: number, h = w) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  return [c, ctx] as const;
};

const tex = (c: HTMLCanvasElement, srgb: boolean, repeat = false) => {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
};

/** Multi-octave value noise painted by upscaling small random canvases (fast, smooth). */
const paintNoise = (ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, octaves: number[], alpha = 0.5) => {
  const rnd = mulberry32(seed);
  for (const cells of octaves) {
    const [sc, sctx] = canvas(cells, Math.max(2, Math.round((cells * h) / w)));
    const img = sctx.createImageData(sc.width, sc.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = rnd() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    sctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.globalAlpha = alpha;
    ctx.drawImage(sc, 0, 0, w, h);
  }
  ctx.globalAlpha = 1;
};

/** Per-pixel grain (tiny) — hides banding, gives micro-texture. */
const grain = (ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, amp: number) => {
  const rnd = mulberry32(seed);
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * amp;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
};

/** Height canvas (grey, red channel) → tangent-space OpenGL normal map. */
const heightToNormal = (src: HTMLCanvasElement, strength: number, repeat = false) => {
  const w = src.width;
  const h = src.height;
  const s = src.getContext("2d")!.getImageData(0, 0, w, h).data;
  const [c, ctx] = canvas(w, h);
  const out = ctx.createImageData(w, h);
  const H = (x: number, y: number) => {
    if (repeat) {
      x = (x + w) % w;
      y = (y + h) % h;
    } else {
      x = Math.max(0, Math.min(w - 1, x));
      y = Math.max(0, Math.min(h - 1, y));
    }
    return s[(y * w + x) * 4] / 255;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (H(x + 1, y) - H(x - 1, y)) * strength;
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength;
      const nz = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * w + x) * 4;
      out.data[i] = (-dx * nz * 0.5 + 0.5) * 255;
      out.data[i + 1] = (dy * nz * 0.5 + 0.5) * 255;
      out.data[i + 2] = nz * 255;
      out.data[i + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  return tex(c, false, repeat);
};

/** Fingerprint-like smudges: concentric elliptical ridges, drawn as roughness increase. */
const smudges = (ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, count: number, strength: number) => {
  const rnd = mulberry32(seed);
  ctx.save();
  for (let k = 0; k < count; k++) {
    const cx = rnd() * w;
    const cy = rnd() * h;
    const rx = (0.04 + rnd() * 0.05) * w;
    const ry = rx * (1.2 + rnd() * 0.4);
    const rot = rnd() * Math.PI;
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * 1.3);
    g.addColorStop(0, `rgba(255,255,255,${strength * 0.35})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 1.3, ry * 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1, w / 700);
    for (let r = 0.1; r < 1; r += 0.07) {
      ctx.strokeStyle = `rgba(255,255,255,${strength * (1 - r) * 0.8})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * r, ry * r, 0, rnd() * 0.5, Math.PI * 2 - rnd() * 0.8);
      ctx.stroke();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  ctx.restore();
};

/* ------------------------------------------------------------------ chip ---- */

/** Organic package substrate: dark green-black solder mask, routing, vias, silkscreen. */
export const substrateTextures = () =>
  cached("substrate", () => {
    const S = 1024;
    const [c, ctx] = canvas(S);
    const [hc, hctx] = canvas(S);
    const [rc, rctx] = canvas(S);
    const rnd = mulberry32(7);
    ctx.fillStyle = "#0f2016";
    ctx.fillRect(0, 0, S, S);
    paintNoise(ctx, S, S, 3, [8, 32, 128], 0.05);
    hctx.fillStyle = "#808080";
    hctx.fillRect(0, 0, S, S);
    paintNoise(hctx, S, S, 5, [64, 256], 0.08);
    rctx.fillStyle = "#5a5a5a";
    rctx.fillRect(0, 0, S, S);
    paintNoise(rctx, S, S, 9, [6, 24, 96], 0.18);
    // buried routing seen through solder mask
    for (let i = 0; i < 420; i++) {
      let x = rnd() * S;
      let y = rnd() * S;
      const segs = 2 + Math.floor(rnd() * 4);
      const lw = 1 + rnd() * 2.5;
      ctx.strokeStyle = `rgba(40,70,45,${0.35 + rnd() * 0.3})`;
      hctx.strokeStyle = "rgba(200,200,200,0.35)";
      ctx.lineWidth = hctx.lineWidth = lw;
      ctx.beginPath();
      hctx.beginPath();
      ctx.moveTo(x, y);
      hctx.moveTo(x, y);
      for (let k = 0; k < segs; k++) {
        const dir = Math.floor(rnd() * 8) * (Math.PI / 4);
        const len = 20 + rnd() * 120;
        x += Math.cos(dir) * len;
        y += Math.sin(dir) * len;
        ctx.lineTo(x, y);
        hctx.lineTo(x, y);
      }
      ctx.stroke();
      hctx.stroke();
    }
    // vias
    for (let i = 0; i < 1500; i++) {
      const x = rnd() * S;
      const y = rnd() * S;
      const r = 1.2 + rnd() * 1.6;
      ctx.fillStyle = "rgba(60,80,58,0.9)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      hctx.fillStyle = "rgba(40,40,40,0.8)";
      hctx.beginPath();
      hctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
      hctx.fill();
    }
    // silkscreen: logo text, serial, pin-1 triangle, fiducials
    ctx.fillStyle = "rgba(225,232,220,0.85)";
    ctx.font = "bold 34px Arial, sans-serif";
    ctx.fillText("NVIDIA", 40, S - 52);
    ctx.font = "20px Consolas, monospace";
    ctx.fillText("GH100-885K-A1  2347A1  TAIWAN", 40, S - 24);
    ctx.fillText("PB-1A2B3-4C  ©2023", S - 260, 40);
    ctx.beginPath();
    ctx.moveTo(18, 18);
    ctx.lineTo(48, 18);
    ctx.lineTo(18, 48);
    ctx.fill();
    for (const [fx, fy] of [
      [S - 40, S - 40],
      [40, 90],
    ]) {
      ctx.strokeStyle = "rgba(200,170,90,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx, fy, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    grain(ctx, S, S, 11, 6);
    smudges(rctx, S, S, 13, 3, 0.4);
    grain(rctx, S, S, 17, 14);
    return { map: tex(c, true), normalMap: heightToNormal(hc, 3), roughnessMap: tex(rc, false) };
  });

/** Polished silicon die: almost-uniform mirror with a faint SM / memory-controller grid and smudges. */
export const dieTextures = () =>
  cached("die", () => {
    const S = 1024;
    const [hc, hctx] = canvas(S);
    const [rc, rctx] = canvas(S);
    const [mc, mctx] = canvas(S);
    hctx.fillStyle = "#808080";
    hctx.fillRect(0, 0, S, S);
    mctx.fillStyle = "#30343a";
    mctx.fillRect(0, 0, S, S);
    const rnd = mulberry32(21);
    // GPC blocks → SM tiles → fine cells
    const gx = 4;
    const gy = 2;
    const pad = 60;
    const bw = (S - pad * 2) / gx;
    const bh = (S - pad * 2) / gy;
    for (let i = 0; i < gx; i++) {
      for (let j = 0; j < gy; j++) {
        const x0 = pad + i * bw + 8;
        const y0 = pad + j * bh + 8;
        const w = bw - 16;
        const h = bh - 16;
        hctx.fillStyle = "#8a8a8a";
        hctx.fillRect(x0, y0, w, h);
        mctx.fillStyle = `rgba(${40 + rnd() * 10},${44 + rnd() * 10},${58 + rnd() * 14},1)`;
        mctx.fillRect(x0, y0, w, h);
        const cols = 3;
        const rows = 6;
        for (let a = 0; a < cols; a++) {
          for (let b = 0; b < rows; b++) {
            const cx = x0 + 6 + (a * (w - 12)) / cols;
            const cy = y0 + 6 + (b * (h - 12)) / rows;
            const cw = (w - 12) / cols - 6;
            const ch = (h - 12) / rows - 6;
            hctx.fillStyle = rnd() < 0.5 ? "#929292" : "#868686";
            hctx.fillRect(cx, cy, cw, ch);
            // fine standard-cell rows
            hctx.fillStyle = "rgba(0,0,0,0.06)";
            for (let yy = cy + 2; yy < cy + ch; yy += 3) hctx.fillRect(cx, yy, cw, 1);
            mctx.fillStyle = `rgba(90,110,140,${rnd() * 0.12})`;
            mctx.fillRect(cx, cy, cw, ch);
          }
        }
      }
    }
    // L2 cache stripe through the middle + IO ring
    hctx.fillStyle = "#7a7a7a";
    hctx.fillRect(pad, S / 2 - 10, S - pad * 2, 20);
    hctx.strokeStyle = "#757575";
    hctx.lineWidth = 14;
    hctx.strokeRect(22, 22, S - 44, S - 44);
    rctx.fillStyle = "#101010";
    rctx.fillRect(0, 0, S, S);
    paintNoise(rctx, S, S, 23, [4, 16], 0.06);
    smudges(rctx, S, S, 29, 4, 0.45);
    grain(rctx, S, S, 31, 6);
    grain(mctx, S, S, 37, 4);
    return { map: tex(mc, true), normalMap: heightToNormal(hc, 1.2), roughnessMap: tex(rc, false) };
  });

/**
 * Energy-trace mask for the die overlay shader.
 * R = trace coverage, G = position along its path (0..1), B = per-path phase offset.
 */
export const traceTexture = () =>
  cached("traces", () => {
    const S = 512;
    const [c, ctx] = canvas(S);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, S, S);
    const rnd = mulberry32(41);
    const step = 8;
    for (let p = 0; p < 90; p++) {
      // start near the centre, wander outward in manhattan steps
      let x = Math.round((S / 2 + (rnd() - 0.5) * 120) / step) * step;
      let y = Math.round((S / 2 + (rnd() - 0.5) * 120) / step) * step;
      const pts: [number, number][] = [[x, y]];
      const ang = rnd() * Math.PI * 2;
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);
      for (let k = 0; k < 40; k++) {
        const horiz = rnd() < Math.abs(dx) / (Math.abs(dx) + Math.abs(dy));
        const len = step * (1 + Math.floor(rnd() * 4));
        if (horiz) x += Math.sign(dx) * len;
        else y += Math.sign(dy) * len;
        if (x < 6 || y < 6 || x > S - 6 || y > S - 6) break;
        pts.push([x, y]);
      }
      let total = 0;
      for (let k = 1; k < pts.length; k++) total += Math.abs(pts[k][0] - pts[k - 1][0]) + Math.abs(pts[k][1] - pts[k - 1][1]);
      if (total < 40) continue;
      const phase = Math.floor(rnd() * 255);
      let run = 0;
      for (let k = 1; k < pts.length; k++) {
        const [ax, ay] = pts[k - 1];
        const [bx, by] = pts[k];
        const len = Math.abs(bx - ax) + Math.abs(by - ay);
        for (let s = 0; s <= len; s += 1) {
          const f = s / len;
          const px = ax + (bx - ax) * f;
          const py = ay + (by - ay) * f;
          ctx.fillStyle = `rgb(255,${Math.floor(((run + s) / total) * 255)},${phase})`;
          ctx.fillRect(px - 1, py - 1, 2, 2);
        }
        run += len;
      }
      // terminal pad
      ctx.fillStyle = `rgb(255,255,${phase})`;
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
    const t = tex(c, false);
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.NearestFilter;
    return t;
  });

/* ----------------------------------------------------------------- metal ---- */

/** Brushed-metal roughness (+ bump) with streaks along U, plus a few fingerprints. Tileable in U. */
export const brushedTextures = (seed = 1) =>
  cached(`brushed${seed}`, () => {
    const W = 1024;
    const Hh = 1024;
    const [rc, rctx] = canvas(W, Hh);
    const rnd = mulberry32(51 + seed);
    rctx.fillStyle = "#6a6a6a";
    rctx.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 5000; i++) {
      const y = rnd() * Hh;
      const v = 70 + (rnd() - 0.5) * 90;
      rctx.fillStyle = `rgba(${v},${v},${v},${0.15 + rnd() * 0.35})`;
      const x = rnd() * W;
      const len = 80 + rnd() * W;
      rctx.fillRect(x, y, len, 0.6 + rnd() * 1.2);
      if (x + len > W) rctx.fillRect(x - W, y, len, 1);
    }
    paintNoise(rctx, W, Hh, 53 + seed, [3, 12], 0.12);
    const bump = tex(rc, false, true);
    const [fc, fctx] = canvas(W, Hh);
    fctx.drawImage(rc, 0, 0);
    smudges(fctx, W, Hh, 57 + seed, 3, 0.35);
    return { roughnessMap: tex(fc, false, true), bumpMap: bump };
  });

/** Low-roughness smudge map for glossy parts (lids, die, clear-coats): mostly dark with fingerprints. */
export const smudgeTexture = (seed = 1) =>
  cached(`smudge${seed}`, () => {
    const S = 1024;
    const [c, ctx] = canvas(S);
    ctx.fillStyle = "#1c1c1c";
    ctx.fillRect(0, 0, S, S);
    paintNoise(ctx, S, S, 61 + seed, [4, 16, 64], 0.08);
    smudges(ctx, S, S, 67 + seed, 5, 0.5);
    // dust specks
    const rnd = mulberry32(71 + seed);
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.2 + rnd() * 0.5})`;
      ctx.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    grain(ctx, S, S, 73 + seed, 8);
    return tex(c, false, true);
  });

/** Green-black PCB with copper pours/traces under solder mask, silkscreen. */
export const pcbTextures = () =>
  cached("pcb", () => {
    const S = 1024;
    const [c, ctx] = canvas(S);
    const [hc, hctx] = canvas(S);
    const rnd = mulberry32(81);
    ctx.fillStyle = "#0a130e";
    ctx.fillRect(0, 0, S, S);
    hctx.fillStyle = "#808080";
    hctx.fillRect(0, 0, S, S);
    paintNoise(ctx, S, S, 83, [16, 64], 0.04);
    for (let i = 0; i < 700; i++) {
      let x = rnd() * S;
      let y = rnd() * S;
      const lw = 1 + rnd() * 3;
      ctx.strokeStyle = `rgba(30,62,40,${0.5 + rnd() * 0.4})`;
      hctx.strokeStyle = "rgba(190,190,190,0.5)";
      ctx.lineWidth = hctx.lineWidth = lw;
      ctx.beginPath();
      hctx.beginPath();
      ctx.moveTo(x, y);
      hctx.moveTo(x, y);
      for (let k = 0; k < 3; k++) {
        const d = Math.floor(rnd() * 8) * (Math.PI / 4);
        const l = 10 + rnd() * 90;
        x += Math.cos(d) * l;
        y += Math.sin(d) * l;
        ctx.lineTo(x, y);
        hctx.lineTo(x, y);
      }
      ctx.stroke();
      hctx.stroke();
    }
    ctx.fillStyle = "rgba(220,225,215,0.75)";
    ctx.font = "16px Consolas, monospace";
    for (let i = 0; i < 40; i++) ctx.fillText(`${["C", "R", "L", "U", "Q"][Math.floor(rnd() * 5)]}${Math.floor(rnd() * 900 + 100)}`, rnd() * S, rnd() * S);
    grain(ctx, S, S, 87, 5);
    return { map: tex(c, true, true), normalMap: heightToNormal(hc, 2, true) };
  });

/* ----------------------------------------------------------- data centre ---- */

/** Raised-floor tile (one tile per texture), seams + perforation option. Returns map + roughness. */
export const floorTextures = () =>
  cached("floor", () => {
    const S = 512;
    const [c, ctx] = canvas(S);
    const [rc, rctx] = canvas(S);
    ctx.fillStyle = "#1a1d20";
    ctx.fillRect(0, 0, S, S);
    paintNoise(ctx, S, S, 91, [4, 16, 64], 0.06);
    rctx.fillStyle = "#3a3a3a";
    rctx.fillRect(0, 0, S, S);
    paintNoise(rctx, S, S, 93, [3, 12, 48], 0.25);
    smudges(rctx, S, S, 95, 2, 0.3);
    // seams
    ctx.fillStyle = "#050607";
    ctx.fillRect(0, 0, S, 4);
    ctx.fillRect(0, 0, 4, S);
    rctx.fillStyle = "#c0c0c0";
    rctx.fillRect(0, 0, S, 4);
    rctx.fillRect(0, 0, 4, S);
    grain(ctx, S, S, 97, 6);
    grain(rctx, S, S, 99, 20);
    return { map: tex(c, true, true), roughnessMap: tex(rc, false, true) };
  });

/** Perforated cold-aisle tile (map). */
export const perfTileTexture = () =>
  cached("perf", () => {
    const S = 512;
    const [c, ctx] = canvas(S);
    ctx.fillStyle = "#24282b";
    ctx.fillRect(0, 0, S, S);
    paintNoise(ctx, S, S, 101, [4, 16], 0.05);
    ctx.fillStyle = "#050607";
    for (let y = 30; y < S - 20; y += 16) for (let x = 30 + ((y / 16) % 2) * 8; x < S - 20; x += 16) {
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillRect(0, 0, S, 4);
    ctx.fillRect(0, 0, 4, S);
    return tex(c, true, true);
  });

/**
 * Front of a rack full of GPU servers (4U compute nodes + 1U switches), 512×2048, top = top of rack.
 * Returns colour map and roughness.
 */
export const rackFaceTextures = (variant = 0) =>
  cached(`rack${variant}`, () => {
    const W = 512;
    const Hh = 2048;
    const [c, ctx] = canvas(W, Hh);
    const [rc, rctx] = canvas(W, Hh);
    const rnd = mulberry32(111 + variant * 13);
    ctx.fillStyle = "#07090a";
    ctx.fillRect(0, 0, W, Hh);
    rctx.fillStyle = "#909090";
    rctx.fillRect(0, 0, W, Hh);
    const U = Hh / 46;
    let y = U * 1.5;
    while (y < Hh - U * 2) {
      const r = rnd();
      const units = r < 0.18 ? 1 : r < 0.3 ? 2 : 4;
      const h = units * U - 3;
      // bezel
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      const base = units === 1 ? 30 : 22;
      g.addColorStop(0, `rgb(${base + 14},${base + 16},${base + 18})`);
      g.addColorStop(1, `rgb(${base},${base + 1},${base + 3})`);
      ctx.fillStyle = g;
      ctx.fillRect(24, y, W - 48, h);
      rctx.fillStyle = "#5a5a5a";
      rctx.fillRect(24, y, W - 48, h);
      if (units === 1) {
        // switch: rows of ports
        ctx.fillStyle = "#020303";
        for (let x = 60; x < W - 70; x += 13) ctx.fillRect(x, y + 6, 10, h - 12);
      } else {
        // honeycomb vent area
        ctx.fillStyle = "#020303";
        const vx0 = 40;
        const vx1 = units === 4 ? W * 0.62 : W * 0.7;
        for (let yy = y + 8; yy < y + h - 8; yy += 7) {
          for (let xx = vx0 + ((yy / 7) % 2) * 3.5; xx < vx1; xx += 7) {
            ctx.beginPath();
            ctx.arc(xx, yy, 2.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // drive bays / nameplate on the right
        ctx.fillStyle = "#14181a";
        ctx.fillRect(vx1 + 10, y + 6, W - vx1 - 50, h - 12);
        if (units === 4) {
          ctx.fillStyle = "rgba(118,185,0,0.9)";
          ctx.fillRect(vx1 + 18, y + 12, 34, 3);
          ctx.fillStyle = "#2a2f31";
          for (let k = 0; k < 4; k++) ctx.fillRect(vx1 + 18, y + 24 + k * 16, W - vx1 - 70, 12);
        }
      }
      // handles
      ctx.fillStyle = "#3b4044";
      ctx.fillRect(26, y + h * 0.2, 8, h * 0.6);
      ctx.fillRect(W - 34, y + h * 0.2, 8, h * 0.6);
      y += units * U;
    }
    // rails with square holes
    ctx.fillStyle = "#121517";
    ctx.fillRect(0, 0, 22, Hh);
    ctx.fillRect(W - 22, 0, 22, Hh);
    ctx.fillStyle = "#000";
    for (let yy = 4; yy < Hh; yy += U / 3) {
      ctx.fillRect(8, yy, 6, 6);
      ctx.fillRect(W - 14, yy, 6, 6);
    }
    grain(ctx, W, Hh, 113 + variant, 5);
    grain(rctx, W, Hh, 117 + variant, 30);
    return { map: tex(c, true), roughnessMap: tex(rc, false) };
  });

/** Soft vertical light-shaft gradient (alpha in all channels, additive use). */
export const shaftTexture = () =>
  cached("shaft", () => {
    const W = 128;
    const Hh = 256;
    const [c, ctx] = canvas(W, Hh);
    const img = ctx.createImageData(W, Hh);
    const rnd = mulberry32(131);
    const streak = Array.from({ length: W }, () => 0.7 + rnd() * 0.3);
    for (let y = 0; y < Hh; y++) {
      for (let x = 0; x < W; x++) {
        const u = (x / (W - 1)) * 2 - 1;
        const v = y / (Hh - 1);
        const a = Math.pow(1 - Math.min(1, Math.abs(u)), 1.8) * Math.pow(1 - v, 1.4) * streak[x];
        const i = (y * W + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = a * 255;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return tex(c, false);
  });

/** Soft round dot (white in RGB, additive), for dust and LED halos. */
export const dotTexture = () =>
  cached("dot", () => {
    const S = 64;
    const [c, ctx] = canvas(S);
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.3, "rgba(255,255,255,0.6)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return tex(c, true);
  });

/** Radial floor fade (alpha map): opaque centre → transparent edge. */
export const radialFade = () =>
  cached("radial", () => {
    const S = 256;
    const [c, ctx] = canvas(S);
    const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.45, "#fff");
    g.addColorStop(1, "#000");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    return tex(c, false);
  });

/** Laser-etched marking for the nickel heat-spreader lid: colour + roughness. */
export const lidTextures = () =>
  cached("lid", () => {
    const S = 1024;
    const [c, ctx] = canvas(S);
    const [rc, rctx] = canvas(S);
    ctx.fillStyle = "#9a9da2";
    ctx.fillRect(0, 0, S, S);
    paintNoise(ctx, S, S, 141, [4, 16, 64], 0.05);
    rctx.fillStyle = "#2a2a2a";
    rctx.fillRect(0, 0, S, S);
    paintNoise(rctx, S, S, 143, [3, 12], 0.04);
    // fine circular lapping marks
    rctx.strokeStyle = "rgba(255,255,255,0.05)";
    for (let r = 10; r < S; r += 3) {
      rctx.beginPath();
      rctx.arc(S * 0.3, S * 1.6, r + S, 0, Math.PI * 2);
      rctx.stroke();
    }
    const draw = (g: CanvasRenderingContext2D, fill: string) => {
      g.fillStyle = fill;
      g.textAlign = "left";
      g.font = "bold 92px Arial, sans-serif";
      g.fillText("NVIDIA", 110, 300);
      g.font = "52px Consolas, monospace";
      g.fillText("GH100-885K-A1", 110, 400);
      g.fillText("TAIWAN  2347A1", 110, 470);
      g.fillText("1QD7H2.0002", 110, 540);
      // data-matrix code
      const rnd = mulberry32(147);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (x === 0 || y === 15 || rnd() < 0.5) g.fillRect(720 + x * 11, 640 + y * 11, 11, 11);
    };
    draw(ctx, "rgba(60,62,66,0.95)");
    draw(rctx, "rgba(150,150,150,1)");
    smudges(rctx, S, S, 149, 3, 0.16);
    grain(rctx, S, S, 151, 10);
    grain(ctx, S, S, 153, 5);
    return { map: tex(c, true), roughnessMap: tex(rc, false) };
  });

/** HBM stack side: thin horizontal die layers (colour). */
export const hbmTextures = () =>
  cached("hbm", () => {
    const S = 512;
    const [c, ctx] = canvas(S);
    const [rc, rctx] = canvas(S);
    ctx.fillStyle = "#1d2024";
    ctx.fillRect(0, 0, S, S);
    paintNoise(ctx, S, S, 161, [4, 32], 0.05);
    rctx.fillStyle = "#262626";
    rctx.fillRect(0, 0, S, S);
    smudges(rctx, S, S, 163, 2, 0.4);
    grain(rctx, S, S, 165, 10);
    ctx.fillStyle = "rgba(200,205,210,0.5)";
    ctx.font = "26px Consolas, monospace";
    ctx.fillText("SK hynix", 30, 440);
    ctx.fillText("H5UG7HMH", 30, 475);
    return { map: tex(c, true), roughnessMap: tex(rc, false) };
  });

/** Smooth large-scale variation (0..1) for thin-film thickness maps. */
export const filmTexture = () =>
  cached("film", () => {
    const S = 256;
    const [c, ctx] = canvas(S);
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, S, S);
    paintNoise(ctx, S, S, 171, [2, 4, 8], 0.45);
    return tex(c, false);
  });
