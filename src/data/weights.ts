import type { Weights } from '../engine/types';

/**
 * Ranking tiers, highest first:
 *   1. Sa — always the gold standard.
 *   2. Vadi — the raga's primary note, whatever swara it is.
 *   3. Samvadi — the raga's secondary note.
 *   4. Any other note the raga uses, ordered by consonance with the Sa drone.
 *
 * Notes a minor 2nd, tritone or major 7th above Sa clash with the drone regardless of
 * the raga's hierarchy, so they are forbidden outright.
 */
export const DEFAULT_WEIGHTS: Weights = {
  sa: 1.0,
  vadi: 0.85,
  samvadi: 0.7,
  other: {
    P: 0.55,
    m: 0.45,
    G: 0.3, g: 0.3, D: 0.3, d: 0.3,
    R: 0.15, n: 0.15,
  },
  forbiddenIntervals: [1, 6, 11],
};
