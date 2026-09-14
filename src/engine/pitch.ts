import type { PitchClass, Swara } from './types';

export const SWARA_OFFSET: Record<Swara, number> = {
  S: 0, r: 1, R: 2, g: 3, G: 4, m: 5, M: 6, P: 7, d: 8, D: 9, n: 10, N: 11,
};

export const OFFSET_SWARA: Swara[] = ['S', 'r', 'R', 'g', 'G', 'm', 'M', 'P', 'd', 'D', 'n', 'N'];

export const SWARA_LABEL: Record<Swara, string> = {
  S: 'Sa', r: 'komal Re', R: 'Re', g: 'komal Ga', G: 'Ga', m: 'Ma', M: 'teevra Ma',
  P: 'Pa', d: 'komal Dha', D: 'Dha', n: 'komal Ni', N: 'Ni',
};

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const ALL_PITCHES: PitchClass[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function mod12(n: number): PitchClass {
  return (((n % 12) + 12) % 12) as PitchClass;
}

export function pitchName(p: PitchClass, style: 'sharp' | 'flat' | 'both' = 'both'): string {
  const s = SHARP_NAMES[p]!;
  const f = FLAT_NAMES[p]!;
  if (style === 'sharp') return s;
  if (style === 'flat') return f;
  return s === f ? s : `${s}/${f}`;
}

const NAME_TO_PITCH: Record<string, PitchClass> = {};
SHARP_NAMES.forEach((n, i) => (NAME_TO_PITCH[n.toUpperCase()] = i as PitchClass));
FLAT_NAMES.forEach((n, i) => (NAME_TO_PITCH[n.toUpperCase()] = i as PitchClass));

/** Accepts "C#", "Db", "c♯", "D♭", "Ab" etc. Returns undefined if unparseable. */
export function parsePitch(name: string): PitchClass | undefined {
  const norm = name.trim().replace('♯', '#').replace('♭', 'b').toUpperCase();
  // "DB" → "Db" lookup: uppercase both sides; FLAT_NAMES uppercased gives "DB".
  return NAME_TO_PITCH[norm];
}

/** Semitone interval from `sa` up to `pitch`, in 0..11. */
export function intervalFromSa(sa: PitchClass, pitch: PitchClass): number {
  return mod12(pitch - sa);
}

/** The swara a given absolute pitch corresponds to for a song rooted at `sa`. */
export function swaraAt(sa: PitchClass, pitch: PitchClass): Swara {
  return OFFSET_SWARA[intervalFromSa(sa, pitch)]!;
}

/** Absolute pitch of a swara for a song rooted at `sa`. */
export function pitchOf(sa: PitchClass, swara: Swara): PitchClass {
  return mod12(sa + SWARA_OFFSET[swara]);
}
