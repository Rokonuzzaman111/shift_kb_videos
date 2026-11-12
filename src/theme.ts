import { loadFont as loadAnek } from "@remotion/google-fonts/AnekBangla";
import { loadFont as loadHind } from "@remotion/google-fonts/HindSiliguri";

export const headFont = loadAnek("normal", {
  weights: ["600", "800"],
  subsets: ["bengali", "latin"],
}).fontFamily;

export const bodyFont = loadHind("normal", {
  weights: ["500", "700"],
  subsets: ["bengali", "latin"],
}).fontFamily;

// Palette: deep navy base, amber = energy/heat/keywords, cyan = neutrons/tech.
export const C = {
  bg: "#05070d",
  ink: "#f5f3ee",
  muted: "#a9b3c4",
  amber: "#ffb020",
  orange: "#ff6a2b",
  cyan: "#3fe0ff",
  proton: "#ff5a3c",
  neutron: "#a9b8c8",
  panel: "rgba(8, 12, 22, 0.72)",
  panelBorder: "rgba(255, 255, 255, 0.14)",
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
