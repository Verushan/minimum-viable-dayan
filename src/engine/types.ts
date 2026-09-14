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
 * Weight table for ranking dayan pitches against a song. Tiers, highest first:
 *   1. Sa.
 *   2. The raga's natural fifth-relation: Pa if the raga has it and emphasises it (vadi or
 *      samvadi); otherwise shuddha Ma if present; otherwise whichever of the two is present.
 *   3. Other vadi/samvadi notes, then other notes the raga uses, by consonance.
 */
export interface Weights {
  sa: number;
  /** Pa when it is vadi/samvadi, or Ma when Pa is absent or not emphasised. */
  preferredFifth: number;
  /** The other of Pa/Ma when the raga has it but it is not the preferred one. */
  otherFifth: number;
  /** Vadi/samvadi that is neither Sa, Pa nor Ma. */
  vadi: number;
  samvadi: number;
  /** Any other swara the raga uses, keyed by swara. */
  other: Partial<Record<Swara, number>>;
  /**
   * Intervals (semitones above Sa) that clash with the Sa drone badly enough that a dayan
   * tuned there scores 0 even if the raga uses — or even emphasises — that note.
   */
  forbiddenIntervals: number[];
}

export interface Dayan {
  /** Nominal pitch of the drum. */
  pitch: PitchClass;
  /**
   * How many semitones the drum can be set up or down from its nominal pitch before the
   * session. It then stays there for every song — no retuning between songs is assumed.
   */
  range: number;
}

/** A drum set to one specific pitch for the whole session. */
export interface TunedDayan {
  dayan: Dayan;
  tunedTo: PitchClass;
}

export interface Assignment {
  song: Song;
  tuned: TunedDayan;
  option: DayanOption;
}

export interface KitResult {
  k: number;
  /** The drums to bring, each with the pitch to set it to. */
  tuned: TunedDayan[];
  /** Indices into the candidate list the kit was chosen from. */
  picked: number[];
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
  /** Upper bound on drums to consider when searching for the minimum kit. */
  maxK: number;
}

/** A small change of a song's key that would improve the kit. */
export interface KeyShift {
  songIndex: number;
  from: PitchClass;
  to: PitchClass;
  /** Semitones up (+) or down (−). */
  shift: number;
  /** The kit after the shift. */
  kit: KitResult;
  /** How the shift helps. */
  effect: 'covers' | 'fewer-drums';
}

export interface Suggestion {
  /** The (fixed-pitch) drum to add to the kit. */
  dayan: Dayan;
  /** The kit with that drum added. */
  kit: KitResult;
}
