import * as THREE from "three";
import { random } from "remotion";

const canvas = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
};

/** Grey speckle noise, used as roughness/bump map for ceramic & concrete. */
export const noiseTexture = (seed: string, size = 512, contrast = 60) => {
  const [c, ctx] = canvas(size, size);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (random(`${seed}-${i}`) - 0.5) * contrast;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
};

/** Patchwork of agricultural fields seen from the air. */
export const fieldTexture = () => {
  const size = 1024;
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = "#4d5c2e";
  ctx.fillRect(0, 0, size, size);
  const greens = ["#56692f", "#62743a", "#465a28", "#6f7a3c", "#7d8243", "#3f5226", "#8a8a4a"];
  for (let i = 0; i < 260; i++) {
    const x = random(`fx${i}`) * size;
    const y = random(`fy${i}`) * size;
    const w = 40 + random(`fw${i}`) * 140;
    const h = 30 + random(`fh${i}`) * 110;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((random(`fr${i}`) - 0.5) * 0.3);
    ctx.fillStyle = greens[Math.floor(random(`fc${i}`) * greens.length)];
    ctx.globalAlpha = 0.85;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = random(`fn${i}`) > 0.5 ? "#2c3a18" : "#9a9a62";
    ctx.fillRect(random(`nx${i}`) * size, random(`ny${i}`) * size, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
};

/** Soft radial blob for steam, glows and flashes. */
export const softSprite = (inner = "rgba(255,255,255,1)", outer = "rgba(255,255,255,0)") => {
  const size = 256;
  const [c, ctx] = canvas(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.45, inner.replace(/[\d.]+\)$/, "0.45)"));
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Vertical gradient, top of canvas = first stop. */
export const gradientTexture = (stops: [number, string][]) => {
  const [c, ctx] = canvas(4, 512);
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
