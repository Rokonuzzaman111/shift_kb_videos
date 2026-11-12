import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/** Current time in seconds (fps-independent, so shots keep timing at 23.976/24/30). */
export const useSeconds = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 progress between two times (seconds), with optional easing. */
export const prog = (t: number, a: number, b: number, easing: (x: number) => number = (x) => x) =>
  interpolate(t, [a, b], [0, 1], { ...clamp, easing });

export const ease = {
  cine: Easing.bezier(0.65, 0, 0.25, 1), // camera moves: slow in, slow out
  out: Easing.bezier(0.16, 1, 0.3, 1), // UI pops
  inQuad: Easing.in(Easing.quad),
  outCubic: Easing.out(Easing.cubic),
  inOut: Easing.inOut(Easing.cubic),
};

export const mix = (a: number, b: number, k: number) => a + (b - a) * k;
export const mix3 = (a: readonly number[], b: readonly number[], k: number): [number, number, number] => [
  mix(a[0], b[0], k),
  mix(a[1], b[1], k),
  mix(a[2], b[2], k),
];

/** Deterministic hand-held camera micro-motion (amplitude in world units). */
export const handheld = (t: number, amp: number, seed = 0): [number, number, number] => [
  (Math.sin(t * 1.3 + seed) + Math.sin(t * 2.9 + seed * 2) * 0.5) * amp,
  (Math.sin(t * 1.7 + seed * 3) + Math.sin(t * 3.3 + seed) * 0.4) * amp,
  Math.sin(t * 1.1 + seed * 5) * amp * 0.5,
];
