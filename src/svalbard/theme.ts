/**
 * Svalbard Seed Vault reel — shared look. Vertical 1080×1920 @ 30 fps.
 * Palette: polar-night navy base, ice cyan = cold/vault/tech, aurora green = life/seeds,
 * wheat gold = crops/food, red = loss/danger. Every shot imports colours, zones and easings from here.
 */
import { loadFont as loadAnek } from "@remotion/google-fonts/AnekBangla";
import { loadFont as loadHind } from "@remotion/google-fonts/HindSiliguri";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Easing } from "remotion";

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const headFont = loadAnek("normal", { weights: ["600", "800"], subsets: ["bengali", "latin"] }).fontFamily;
export const bodyFont = loadHind("normal", { weights: ["500", "700"], subsets: ["bengali", "latin"] }).fontFamily;
export const numFont = loadInter("normal", { weights: ["500", "700", "900"], subsets: ["latin"] }).fontFamily;

export const S = {
  bg: "#03070c",
  night: "#071423",
  ink: "#f2f8fc",
  muted: "#9db3c4",
  ice: "#bfeaff",
  cyan: "#47d4ff",
  aurora: "#5dffb0",
  gold: "#f0b64a",
  red: "#ff4b4b",
  panel: "rgba(6,16,28,0.72)",
  line: "rgba(191,234,255,0.22)",
};

/** Frame grammar (px). Captions own y 1300–1560; titles/HUD live in the top band or the sides. */
export const ZONE = { side: 72, titleTop: 170, titleBottom: 520, captionTop: 1300, captionBottom: 1560 };

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  cine: Easing.bezier(0.65, 0, 0.25, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export type Word = { text: string; startMs: number; endMs: number; line?: number };
