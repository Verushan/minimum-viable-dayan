import type {
  Assignment, Dayan, DayanOption, KitResult, OptimizeOptions, PitchClass, Raga, Song, Suggestion, Weights,
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

/** One candidate drum per pitch class — used when the player has not said which drums they own. */
export function anyDayan(range: number): Dayan[] {
  return ALL_PITCHES.map((pitch) => ({ pitch, range }));
}

/** Best pitch a drum can reach for this song, given it may retune ±range. */
function bestWithinRange(ctx: SongContext, dayan: Dayan): { playedAt: PitchClass; option: DayanOption } {
  let best = { playedAt: dayan.pitch, option: ctx.byPitch[dayan.pitch]! };
  let bestRetune = 0;
  for (let d = -dayan.range; d <= dayan.range; d++) {
    const p = mod12(dayan.pitch + d);
    const o = ctx.byPitch[p]!;
    // Prefer higher score; on ties prefer the smallest retune.
    if (o.score > best.option.score || (o.score === best.option.score && Math.abs(d) < bestRetune)) {
      best = { playedAt: p, option: o };
      bestRetune = Math.abs(d);
    }
  }
  return best;
}

function* combinations(n: number, k: number, start = 0, acc: number[] = []): Generator<number[]> {
  if (acc.length === k) { yield acc.slice(); return; }
  for (let i = start; i <= n - (k - acc.length); i++) {
    acc.push(i);
    yield* combinations(n, k, i + 1, acc);
    acc.pop();
  }
}

function evaluate(contexts: SongContext[], candidates: Dayan[], picked: number[], opts: OptimizeOptions): KitResult {
  const dayans = picked.map((i) => candidates[i]!);
  let totalScore = 0;
  let covered = 0;
  const assignments: Assignment[] = contexts.map((ctx) => {
    let best: Assignment | undefined;
    for (const dayan of dayans) {
      const r = bestWithinRange(ctx, dayan);
      if (!best || r.option.score > best.option.score) {
        best = { song: ctx.song, dayan, playedAt: r.playedAt, option: r.option };
      }
    }
    const a = best!; // dayans is non-empty for k >= 1
    totalScore += a.option.score;
    if (a.option.score >= opts.threshold) covered++;
    return a;
  });
  return { k: dayans.length, dayans, picked, assignments, totalScore, covered, complete: covered === contexts.length };
}

function better(a: KitResult, b: KitResult | undefined): boolean {
  return !b || a.covered > b.covered || (a.covered === b.covered && a.totalScore > b.totalScore);
}

/**
 * Best kit of exactly `k` drums drawn from `candidates`: maximises coverage first, then total
 * score. Brute force over C(n, k) combinations — trivially cheap for realistic n and k.
 */
export function bestKitOfSize(contexts: SongContext[], candidates: Dayan[], k: number, opts: OptimizeOptions): KitResult {
  let best: KitResult | undefined;
  for (const picked of combinations(candidates.length, k)) {
    const r = evaluate(contexts, candidates, picked, opts);
    if (better(r, best)) best = r;
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
 * When a kit leaves songs uncovered, find the single extra drum (any pitch, `range` retune) that
 * improves it most. Returns undefined if no drum helps.
 */
export function suggestAddition(contexts: SongContext[], kit: KitResult, range: number, opts: OptimizeOptions): Suggestion | undefined {
  let best: Suggestion | undefined;
  for (const dayan of anyDayan(range)) {
    const candidates = [...kit.dayans, dayan];
    const r = evaluate(contexts, candidates, candidates.map((_, i) => i), opts);
    if (better(r, kit) && (!best || better(r, best.kit))) best = { dayan, kit: r };
  }
  return best;
}
