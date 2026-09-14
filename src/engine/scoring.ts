import type { DayanOption, DayanReason, PitchClass, Raga, Song, Weights } from './types';
import { ALL_PITCHES, SWARA_OFFSET, swaraAt } from './pitch';

/** Score a single absolute pitch as a dayan tuning for `song` in `raga`. */
export function scorePitch(song: Song, raga: Raga, pitch: PitchClass, w: Weights): DayanOption {
  const swara = swaraAt(song.sa, pitch);
  const offset = SWARA_OFFSET[swara];

  const reason: DayanReason =
    swara === 'S' ? 'Sa'
    : swara === raga.vadi ? 'Vadi'
    : swara === raga.samvadi ? 'Samvadi'
    : swara === 'P' ? 'Pa'
    : swara === 'm' ? 'Ma'
    : 'Other';

  let score: number;
  if (swara === 'S') score = w.sa;
  else if (!raga.swaras.includes(swara)) score = 0; // varjit
  else if (w.forbiddenIntervals.includes(offset)) score = 0; // clashes with the Sa drone even if emphasised
  else if (reason === 'Vadi') score = w.vadi;
  else if (reason === 'Samvadi') score = w.samvadi;
  else score = w.other[swara] ?? 0;

  return { pitch, score, swara, reason };
}

/** All 12 pitches ranked for a song, best first. Zero-score pitches are dropped. */
export function rankDayans(song: Song, raga: Raga, w: Weights): DayanOption[] {
  return ALL_PITCHES.map((p) => scorePitch(song, raga, p, w))
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score || a.pitch - b.pitch);
}
