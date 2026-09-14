import type {
  Assignment, Dayan, DayanOption, KitResult, OptimizeOptions, PitchClass, Raga, Song, Suggestion, TunedDayan, Weights,
} from './types';
import { ALL_PITCHES, mod12 } from './pitch';
import { scorePitch } from './scoring';

export interface SongContext {
  song: Song;
  raga: Raga;
  /** score per absolute pitch, index = pitch class */
  byPitch: DayanOption[];
}

export function buildContexts(songs: Song[], ragas: Map<string, Raga>, w: Weights): SongContext[] {
  return songs.map((song) => {
    const raga = ragas.get(song.ragaId);
    if (!raga) throw new Error(`Unknown raga "${song.ragaId}" for song "${song.name}"`);
    return { song, raga, byPitch: ALL_PITCHES.map((p) => scorePitch(song, raga, p, w)) };
  });
}

/** One fixed candidate drum per pitch class — used when the player has not said which drums they own. */
export function anyDayan(): Dayan[] {
  return ALL_PITCHES.map((pitch) => ({ pitch, range: 0 }));
}

/** Every pitch a drum can be set to, nearest to nominal first. */
function tunings(dayan: Dayan): PitchClass[] {
  const out: PitchClass[] = [dayan.pitch];
  for (let d = 1; d <= dayan.range; d++) out.push(mod12(dayan.pitch - d), mod12(dayan.pitch + d));
  return out;
}

function* combinations(n: number, k: number, start = 0, acc: number[] = []): Generator<number[]> {
  if (acc.length === k) { yield acc.slice(); return; }
  for (let i = start; i <= n - (k - acc.length); i++) {
    acc.push(i);
    yield* combinations(n, k, i + 1, acc);
    acc.pop();
  }
}

/** Cartesian product of each chosen drum's possible tunings. */
function* tuningSets(dayans: Dayan[], i = 0, acc: TunedDayan[] = []): Generator<TunedDayan[]> {
  if (i === dayans.length) { yield acc.slice(); return; }
  for (const tunedTo of tunings(dayans[i]!)) {
    acc.push({ dayan: dayans[i]!, tunedTo });
    yield* tuningSets(dayans, i + 1, acc);
    acc.pop();
  }
}

function evaluate(contexts: SongContext[], tuned: TunedDayan[], picked: number[], opts: OptimizeOptions): KitResult {
  let totalScore = 0;
  let covered = 0;
  const assignments: Assignment[] = contexts.map((ctx) => {
    let best: Assignment | undefined;
    for (const t of tuned) {
      const option = ctx.byPitch[t.tunedTo]!;
      if (!best || option.score > best.option.score) best = { song: ctx.song, tuned: t, option };
    }
    const a = best!; // tuned is non-empty for k >= 1
    totalScore += a.option.score;
    if (a.option.score >= opts.threshold) covered++;
    return a;
  });
  return { k: tuned.length, tuned, picked, assignments, totalScore, covered, complete: covered === contexts.length };
}

function better(a: KitResult, b: KitResult | undefined): boolean {
  return !b || a.covered > b.covered || (a.covered === b.covered && a.totalScore > b.totalScore);
}

/**
 * Best kit of exactly `k` drums drawn from `candidates`, each set to the best pitch within its
 * range for the whole session: maximises coverage first, then total score. Brute force — the
 * search space is tiny for realistic kits.
 */
export function bestKitOfSize(contexts: SongContext[], candidates: Dayan[], k: number, opts: OptimizeOptions): KitResult {
  let best: KitResult | undefined;
  for (const picked of combinations(candidates.length, k)) {
    for (const tuned of tuningSets(picked.map((i) => candidates[i]!))) {
      const r = evaluate(contexts, tuned, picked, opts);
      if (better(r, best)) best = r;
    }
  }
  return best!;
}

/** Best kit for every k from 1 up to maxK (or the number of candidates), so the user can see the tradeoff. */
export function kitTradeoff(contexts: SongContext[], candidates: Dayan[], opts: OptimizeOptions): KitResult[] {
  const out: KitResult[] = [];
  for (let k = 1; k <= Math.min(opts.maxK, candidates.length); k++) {
    const r = bestKitOfSize(contexts, candidates, k, opts);
    out.push(r);
    // Once every song is covered at full score, more drums can't help.
    if (r.complete && r.totalScore >= contexts.length) break;
  }
  return out;
}

/** Smallest kit that covers every song at or above the threshold, or undefined if none within maxK. */
export function minimumKit(contexts: SongContext[], candidates: Dayan[], opts: OptimizeOptions): KitResult | undefined {
  return kitTradeoff(contexts, candidates, opts).find((r) => r.complete);
}

/**
 * When a kit leaves songs uncovered, find the single extra fixed-pitch drum that improves it
 * most. Returns undefined if no drum helps.
 */
export function suggestAddition(contexts: SongContext[], kit: KitResult, opts: OptimizeOptions): Suggestion | undefined {
  let best: Suggestion | undefined;
  for (const dayan of anyDayan()) {
    const tuned = [...kit.tuned, { dayan, tunedTo: dayan.pitch }];
    const r = evaluate(contexts, tuned, [...kit.picked, -1], opts);
    if (better(r, kit) && (!best || better(r, best.kit))) best = { dayan, kit: r };
  }
  return best;
}
