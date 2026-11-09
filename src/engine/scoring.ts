import type { DayanOption, DayanReason, PitchClass, Raga, Song, Swara, Weights } from './types';
import { ALL_PITCHES, SWARA_OFFSET, swaraAt } from './pitch';

const emphasised = (raga: Raga, s: Swara) => raga.vadi === s || raga.samvadi === s;

/**
 * Which of Pa / shuddha Ma the raga naturally wants the dayan on: Pa when the raga has it and
 * emphasises it, else Ma when present, else Pa when present, else neither.
 */
export function preferredFifth(raga: Raga): Swara | undefined {
  const hasPa = raga.swaras.includes('P');
  const hasMa = raga.swaras.includes('m');
  if (hasPa && emphasised(raga, 'P')) return 'P';
  if (hasMa) return 'm';
  if (hasPa) return 'P';
  return undefined;
}

export interface FifthHint {
  swara: 'P' | 'm';
  /** Short reason, e.g. "vadi of Malkauns" or "Kalavati omits Ma". */
  why: string;
}

/**
 * Whether a dayan on Pa or Ma is worth trying instead of Sa for this raga: when Pa or Ma is the
 * raga's vadi/samvadi, or when the raga omits Pa and keeps Ma. Informational only — Sa still
 * scores highest.
 */
export function fifthHint(raga: Raga): FifthHint | undefined {
  const role = (s: Swara) => (raga.vadi === s ? 'vadi' : raga.samvadi === s ? 'samvadi' : undefined);
  const hasPa = raga.swaras.includes('P');
  const hasMa = raga.swaras.includes('m');
  const pa = role('P');
  const ma = role('m');
  if (hasPa && pa) return { swara: 'P', why: `${pa} of ${raga.name}` };
  if (hasMa && ma) return { swara: 'm', why: `${ma} of ${raga.name}` };
  if (!hasPa && hasMa) return { swara: 'm', why: `${raga.name} omits Pa` };
  return undefined;
}

/** Score a single absolute pitch as a dayan tuning for `song` in `raga`. */
export function scorePitch(song: Song, raga: Raga, pitch: PitchClass, w: Weights): DayanOption {
  const swara = swaraAt(song.sa, pitch);
  const offset = SWARA_OFFSET[swara];

  const reason: DayanReason =
    swara === 'S' ? 'Sa'
    : swara === 'P' ? 'Pa'
    : swara === 'm' ? 'Ma'
    : swara === raga.vadi ? 'Vadi'
    : swara === raga.samvadi ? 'Samvadi'
    : 'Other';

  let score: number;
  if (swara === 'S') score = w.sa;
  else if (!raga.swaras.includes(swara)) score = 0; // varjit
  else if (w.forbiddenIntervals.includes(offset)) score = 0; // clashes with the Sa drone even if emphasised
  else if (swara === 'P' || swara === 'm') score = swara === preferredFifth(raga) ? w.preferredFifth : w.otherFifth;
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
