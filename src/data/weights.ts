import type { Weights } from '../engine/types';

/**
 * Ranking tiers, highest first:
 *   1. Sa — always the gold standard.
 *   2. Pa, if the raga has Pa and it is vadi or samvadi; otherwise shuddha Ma if the raga has
 *      it. The other of the pair, when present, is a weaker fallback.
 *   3. Any other vadi/samvadi note, then remaining notes of the raga by consonance.
 *
 * Notes a minor 2nd, tritone or major 7th above Sa clash with the drone regardless of the
 * raga's hierarchy, so they are forbidden outright.
 */
export const DEFAULT_WEIGHTS: Weights = {
  sa: 1.0,
  preferredFifth: 0.85,
  otherFifth: 0.6,
  vadi: 0.5,
  samvadi: 0.45,
  other: {
    G: 0.3, g: 0.3, D: 0.3, d: 0.3,
    R: 0.15, n: 0.15,
  },
  forbiddenIntervals: [1, 6, 11],
};
