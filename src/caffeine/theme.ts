/**
 * Caffeine reel look. Fonts come from the shared src/theme.ts.
 * Amber = adenosine (tiredness) · Cyan = caffeine · Tea brown = tea/cup.
 */
export { bodyFont, headFont, WIDTH, HEIGHT } from "../theme";

export const K = {
  bg: "#0d0806",
  bg2: "#1b120c",
  ink: "#f7f1e8",
  muted: "#b9a998",
  amber: "#ffb547",
  cyan: "#47d7ff",
  tea: "#c8874a",
  red: "#ff5a4d",
  green: "#4ade80",
  panel: "rgba(20, 13, 9, 0.72)",
  panelBorder: "rgba(255, 236, 214, 0.16)",
};

/** Frame grammar (px, 1080x1920). See scripts/caffeine_storyboard.md section 1. */
export const ZONE = {
  titleTop: 160,
  titleBottom: 520,
  heroTop: 520,
  heroBottom: 1250,
  heroCenterY: 850,
  captionTop: 1280,
  captionBottom: 1560,
  side: 80,
};
