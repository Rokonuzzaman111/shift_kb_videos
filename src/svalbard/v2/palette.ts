/**
 * Svalbard v2 — locked palette (art bible §1). No other hues anywhere.
 * Grade every shot cool; warm only from amber practical lights.
 */
export const P = {
  night: "#070d16",
  steel: "#2a3f55",
  snow: "#e8eef3",
  concrete: "#8d9093",
  vaultTeal: "#39e0c8",
  amber: "#ffb648",
  alert: "#ff4a3d",
} as const;

/** rgba() of a palette hex with alpha */
export const pa = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/** Caption colours for src/svalbard/ui/Captions.tsx */
export const CAPTION_V2 = {
  active: P.vaultTeal,
  ink: P.snow,
  pending: pa(P.snow, 0.55),
  marker: P.vaultTeal,
  markerInk: P.night,
} as const;

/** Bangla digits (numbers on Bangla lines) */
export const bn = (s: string | number) => String(s).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
