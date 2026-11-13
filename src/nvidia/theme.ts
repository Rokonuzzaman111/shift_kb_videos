/**
 * Nvidia explainer — shared look (OWNER: lead). Horizontal 1920×1080 @ 30 fps.
 * Every agent imports colours, fonts, safe zones and easings from here. Do not hard-code new colours.
 */
import { loadFont as loadAnek } from "@remotion/google-fonts/AnekBangla";
import { loadFont as loadHind } from "@remotion/google-fonts/HindSiliguri";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { Easing } from "remotion";

export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const headFont = loadAnek("normal", { weights: ["600", "800"], subsets: ["bengali", "latin"] }).fontFamily;
export const bodyFont = loadHind("normal", { weights: ["500", "700"], subsets: ["bengali", "latin"] }).fontFamily;
/** numbers, tickers, English labels */
export const numFont = loadInter("normal", { weights: ["500", "700", "900"], subsets: ["latin"] }).fontFamily;

/**
 * Palette: near-black graphite base, NVIDIA-style green = growth/tech/positive,
 * red = loss/drop/danger, amber = warning/allegation/caution, white ink.
 */
export const N = {
  bg: "#050607",
  bg2: "#0b0e10",
  panel: "rgba(14,18,20,0.78)",
  line: "rgba(255,255,255,0.12)",
  ink: "#f4f6f2",
  muted: "#9aa3a0",
  green: "#76b900",
  greenHi: "#a6f22a",
  red: "#ff3b3b",
  amber: "#ffb020",
  cyan: "#3fd8ff",
  gold: "#d8b25a",
};

/**
 * Safe zones (px). Captions own the bottom band; keep important visuals out of it.
 *  - title-safe margin: 96 px left/right, 64 px top
 *  - caption band: y 880 → 1030
 */
export const ZONE = { side: 96, top: 64, captionTop: 880, captionBottom: 1030 };

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
