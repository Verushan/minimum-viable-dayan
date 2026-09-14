import type {
  Assignment, Dayan, DayanOption, KitResult, OptimizeOptions, PitchClass, Raga, Song, Weights,
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

/** Best pitch a drum with nominal `pitch` can reach for this song, given it may retune ±range. */
function bestWithinRange(ctx: SongContext, pitch: PitchClass, range: number): { playedAt: PitchClass; option: DayanOption } {
  let best = { playedAt: pitch, option: ctx.byPitch[pitch]! };
  let bestRetune = 0;
  for (let d = -range; d <= range; d++) {
    const p = mod12(pitch + d);
    const o = ctx.byPitch[p]!;
    // Prefer higher score; on ties prefer the smallest retune.
    if (o.score > best.option.score || (o.score === best.option.score && Math.abs(d) < bestRetune)) {
      best = { playedAt: p, option: o };
      bestRetune = Math.abs(d);
    }
  }
  return best;
}

function* combinations<T>(items: T[], k: number, start = 0, acc: T[] = []): Generator<T[]> {
  if (acc.length === k) { yield acc.slice(); return; }
  for (let i = start; i <= items.length - (k - acc.length); i++) {
    acc.push(items[i]!);
    yield* combinations(items, k, i + 1, acc);
    acc.pop();
  }
}

function evaluate(contexts: SongContext[], pitches: PitchClass[], opts: OptimizeOptions): KitResult {
  const dayans: Dayan[] = pitches.map((pitch) => ({ pitch }));
  let totalScore = 0;
  let covered = 0;
  const assignments: Assignment[] = contexts.map((ctx) => {
    let best: Assignment | undefined;
    for (const dayan of dayans) {
      const r = bestWithinRange(ctx, dayan.pitch, opts.retuneRange);
      if (!best || r.option.score > best.option.score) {
        best = { song: ctx.song, dayan, playedAt: r.playedAt, option: r.option };
      }
    }
    // dayans is non-empty for k >= 1
    const a = best!;
    totalScore += a.option.score;
    if (a.option.score >= opts.threshold) covered++;
    return a;
  });
  return { k: pitches.length, dayans, assignments, totalScore, covered, complete: covered === contexts.length };
}

/**
 * Best kit of exactly `k` drums: maximises coverage first, then total score.
 * Brute force over C(12, k) combinations — trivially cheap for realistic k.
 */
export function bestKitOfSize(contexts: SongContext[], k: number, opts: OptimizeOptions): KitResult {
  let best: KitResult | undefined;
  for (const combo of combinations(ALL_PITCHES, k)) {
    const r = evaluate(contexts, combo, opts);
    if (!best || r.covered > best.covered || (r.covered === best.covered && r.totalScore > best.totalScore)) {
      best = r;
    }
  }
  return best!;
}

/** Best kit for every k from 1..maxK, so the user can see the tradeoff. */
export function kitTradeoff(contexts: SongContext[], opts: OptimizeOptions): KitResult[] {
  const out: KitResult[] = [];
  for (let k = 1; k <= Math.min(opts.maxK, 12); k++) {
    const r = bestKitOfSize(contexts, k, opts);
    out.push(r);
    // Once every song is covered at full score, more drums can't help.
    if (r.complete && r.totalScore >= contexts.length) break;
  }
  return out;
}

/** Smallest kit that covers every song at or above the threshold, or undefined if none within maxK. */
export function minimumKit(contexts: SongContext[], opts: OptimizeOptions): KitResult | undefined {
  return kitTradeoff(contexts, opts).find((r) => r.complete);
}
