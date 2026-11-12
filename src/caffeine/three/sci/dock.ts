/** Docking helpers shared by the receptor shots (deterministic, time-driven). */
import { mix, mix3, prog } from "../../../kit/time";
import { DOCK_ROT_Z } from "../Molecules";
import { RECEPTOR_POCKET } from "../Receptor";
import { snap } from "./util";

type V3 = readonly [number, number, number];

export const pocketOf = (p: V3, s = 1): [number, number, number] => [p[0] + RECEPTOR_POCKET[0] * s, p[1] + RECEPTOR_POCKET[1] * s, p[2] + RECEPTOR_POCKET[2] * s];

/**
 * Molecule falling into a receptor pocket: drifts from `from` and snaps in at `at`.
 * Returns position, rotation and an arrival 0..1.
 */
export const dockPath = (t: number, from: V3, receptor: V3, at: number, travel = 1.2, seed = 0) => {
  const pk = pocketOf(receptor);
  const k = prog(t, at - travel, at);
  const eased = snap(k);
  // arc: come in from above
  const p = mix3(from, pk, eased);
  p[1] += Math.sin(Math.min(1, k) * Math.PI) * 0.25 * (1 - k);
  const spin = 1 - Math.min(1, k);
  const rot: [number, number, number] = [
    mix(0, 0.9 + seed + t * 0.6, spin),
    mix(0, 0.4 + seed * 2 + t * 0.4, spin),
    mix(DOCK_ROT_Z, DOCK_ROT_Z + 1.4 + t * 0.5, spin),
  ];
  return { p, rot, k };
};

/** Leaving the pocket: lifts off at `at` and drifts away along `dir`. */
export const undockPath = (t: number, receptor: V3, at: number, dir: V3, seed = 0) => {
  const pk = pocketOf(receptor);
  const k = prog(t, at, at + 1.6);
  const e = k * k * (3 - 2 * k);
  const p: [number, number, number] = [pk[0] + dir[0] * e, pk[1] + dir[1] * e + Math.sin(e * 3) * 0.05, pk[2] + dir[2] * e];
  const rot: [number, number, number] = [e * (1.2 + seed), e * (0.8 + seed), DOCK_ROT_Z + e * 1.5];
  return { p, rot, k };
};
