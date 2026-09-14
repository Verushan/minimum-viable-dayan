/** 0 = C, 1 = C#/Db, … 11 = B. */
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

/**
 * Sargam in the usual Bhatkhande shorthand.
 * Lowercase = komal (flat), uppercase = shuddha; `M` = teevra Ma.
 */
export type Swara = 'S' | 'r' | 'R' | 'g' | 'G' | 'm' | 'M' | 'P' | 'd' | 'D' | 'n' | 'N';

export interface Raga {
  id: string;
  name: string;
  /** Notes used by the raga. Anything absent is varjit (omitted). Must include 'S'. */
  swaras: Swara[];
  vadi?: Swara;
  samvadi?: Swara;
  /**
   * Other names this raga goes by — Carnatic equivalents, spellings, and the combined
   * "Carnatic/Hindustani" labels used by bhajan books — so imports can resolve them.
   */
  aliases?: string[];
  notes?: string;
}

export interface Song {
  name: string;
  /** Performance root (Sa) as an absolute pitch class. */
  sa: PitchClass;
  ragaId: string;
}

export type DayanReason = 'Sa' | 'Vadi' | 'Samvadi' | 'Pa' | 'Ma' | 'Other';

export interface DayanOption {
  pitch: PitchClass;
  /** 0..1 suitability. */
  score: number;
  /** The swara of the song's raga that this pitch lands on. */
  swara: Swara;
  reason: DayanReason;
}

/**
 * Weight table for ranking dayan pitches against a song.
 * Tiers are evaluated in order: Sa > vadi > samvadi > everything else present in the raga.
 */
export interface Weights {
  sa: number;
  vadi: number;
  samvadi: number;
  /** Weight for a swara that is in the raga but is neither Sa, vadi nor samvadi, keyed by swara. */
  other: Partial<Record<Swara, number>>;
  /**
   * Intervals (semitones above Sa) that clash with the Sa drone badly enough that a dayan
   * tuned there scores 0 even if the raga uses — or even emphasises — that note.
   */
  forbiddenIntervals: number[];
}

export interface Dayan {
  /** Nominal pitch the drum is tuned to. */
  pitch: PitchClass;
}

export interface Assignment {
  song: Song;
  dayan: Dayan;
  /** The pitch actually played (== dayan.pitch unless retune range > 0). */
  playedAt: PitchClass;
  option: DayanOption;
}

export interface KitResult {
  k: number;
  dayans: Dayan[];
  assignments: Assignment[];
  totalScore: number;
  /** Number of songs whose best available score is >= the threshold. */
  covered: number;
  /** True when every song meets the threshold. */
  complete: boolean;
}

export interface OptimizeOptions {
  /** Minimum acceptable per-song score for a song to count as covered. */
  threshold: number;
  /** How many semitones a physical drum can be retuned up or down from its nominal pitch. */
  retuneRange: number;
  /** Upper bound on drums to consider when searching for the minimum kit. */
  maxK: number;
}
