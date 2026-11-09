import type { DayanOption, DayanReason, PitchClass, Raga, Song, Swara, Weights } from './types';
import { ALL_PITCHES, SWARA_OFFSET, swaraAt } from './pitch';

const emphasised = (raga: Raga, s: Swara) => raga.vadi === s || raga.samvadi === s;
const role = (raga: Raga, s: Swara) => (raga.vadi === s ? 'vadi' : raga.samvadi === s ? 'samvadi' : undefined);

/** How many pakad phrases come to rest on Pa and on Ma (the last note of each comma-separated phrase). */
export function pakadRests(raga: Raga): { P: number; m: number } {
  const out = { P: 0, m: 0 };
  for (const phrase of (raga.pakad ?? '').split(',')) {
    const last = phrase.match(/[SrRgGmMPdDnN]/g)?.at(-1);
    if (last === 'P' || last === 'm') out[last]++;
  }
  return out;
}

/** Pa or Ma if the pakad rests on it more often than on the other, else undefined. */
function pakadFavours(raga: Raga, minRests = 1): 'P' | 'm' | undefined {
  const r = pakadRests(raga);
  if (r.P >= minRests && r.P > r.m && raga.swaras.includes('P')) return 'P';
  if (r.m >= minRests && r.m > r.P && raga.swaras.includes('m')) return 'm';
  return undefined;
}

/**
 * Which of Pa / shuddha Ma the raga naturally wants the dayan on, in order: Pa if it is
 * vadi/samvadi; Ma if it is; whichever the pakad rests on more; Ma if present; Pa if present.
 */
export function preferredFifth(raga: Raga): Swara | undefined {
  const hasPa = raga.swaras.includes('P');
  const hasMa = raga.swaras.includes('m');
  if (hasPa && emphasised(raga, 'P')) return 'P';
  if (hasMa && emphasised(raga, 'm')) return 'm';
  const fromPakad = pakadFavours(raga);
  if (fromPakad) return fromPakad;
  if (hasMa) return 'm';
  if (hasPa) return 'P';
  return undefined;
}

export interface FifthHint {
  swara: 'P' | 'm';
  /** Short reason, e.g. "vadi of Malkauns" or "pakad of Tilang rests on Pa". */
  why: string;
  /**
   * 'signature' — Pa/Ma is vadi/samvadi, or the pakad rests on it repeatedly; strong enough
   * that "best note" mode puts it above Sa. 'fallback' — only that the raga omits Pa.
   */
  strength: 'signature' | 'fallback';
}

/** Whether a dayan on Pa or Ma is worth trying instead of Sa for this raga, and why. */
export function fifthHint(raga: Raga): FifthHint | undefined {
  const hasPa = raga.swaras.includes('P');
  const hasMa = raga.swaras.includes('m');
  const pa = role(raga, 'P');
  const ma = role(raga, 'm');
  if (hasPa && pa) return { swara: 'P', why: `${pa} of ${raga.name}`, strength: 'signature' };
  if (hasMa && ma) return { swara: 'm', why: `${ma} of ${raga.name}`, strength: 'signature' };
  const dwell = pakadFavours(raga, 2);
  if (dwell) return { swara: dwell, why: `pakad of ${raga.name} rests on ${dwell === 'P' ? 'Pa' : 'Ma'}`, strength: 'signature' };
  if (!hasPa && hasMa) return { swara: 'm', why: `${raga.name} omits Pa`, strength: 'fallback' };
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

  const signature = w.saWhenSignature !== undefined ? fifthHint(raga) : undefined;
  const best = signature?.strength === 'signature' ? signature.swara : undefined;

  let score: number;
  if (swara === 'S') score = best ? w.saWhenSignature! : w.sa;
  else if (best && swara === best) score = w.sa;
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
