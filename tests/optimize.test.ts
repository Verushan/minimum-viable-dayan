import { describe, expect, it } from 'vitest';
import { anyDayan, buildContexts, bestKitOfSize, kitTradeoff, minimumKit, suggestAddition } from '../src/engine/optimize';
import { parsePitch, pitchName } from '../src/engine/pitch';
import { RAGA_MAP } from '../src/data/ragas';
import { DEFAULT_WEIGHTS as W } from '../src/data/weights';
import type { Dayan, OptimizeOptions, Song } from '../src/engine/types';

const P = (n: string) => parsePitch(n)!;
const D = (n: string, range = 0): Dayan => ({ pitch: P(n), range });
const opts: OptimizeOptions = { threshold: 0.7, maxK: 4 };
const ANY = anyDayan(0);
const names = (ds: Dayan[]) => ds.map((d) => pitchName(d.pitch, 'sharp')).sort();

describe('optimizer with any pitch available', () => {
  it('solves the brief example: one drum at C# suffices, two drums give a perfect score', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('C#'), ragaId: 'yaman' },
      { name: 'B', sa: P('G#'), ragaId: 'malkauns' }, // vadi Ma = C#
      { name: 'C', sa: P('C#'), ragaId: 'marwa' },
    ];
    const ctx = buildContexts(songs, RAGA_MAP, W);
    const min = minimumKit(ctx, ANY, opts)!;
    expect(min.k).toBe(1);
    expect(names(min.dayans)).toEqual(['C#']);
    expect(min.assignments.map((a) => a.option.reason)).toEqual(['Sa', 'Vadi', 'Sa']);

    const two = bestKitOfSize(ctx, ANY, 2, opts);
    expect(names(two.dayans)).toEqual(['C#', 'G#']);
    expect(two.totalScore).toBe(3);
  });

  it('one drum suffices when all songs share a Sa', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('D'), ragaId: 'bhairavi' },
      { name: 'B', sa: P('D'), ragaId: 'kafi' },
    ];
    const kit = minimumKit(buildContexts(songs, RAGA_MAP, W), ANY, opts)!;
    expect(kit.k).toBe(1);
    expect(names(kit.dayans)).toEqual(['D']);
  });

  it('uses the vadi to share a drum when it clears the threshold', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('D'), ragaId: 'kafi' }, // vadi P = A
      { name: 'B', sa: P('A'), ragaId: 'yaman' },
    ];
    const kit = minimumKit(buildContexts(songs, RAGA_MAP, W), ANY, opts)!;
    expect(kit.k).toBe(1);
    expect(names(kit.dayans)).toEqual(['A']);
  });

  it('tradeoff table is monotone in score and stops once perfect', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('C'), ragaId: 'yaman' },
      { name: 'B', sa: P('E'), ragaId: 'yaman' },
      { name: 'C', sa: P('G#'), ragaId: 'yaman' },
    ];
    const table = kitTradeoff(buildContexts(songs, RAGA_MAP, W), ANY, opts);
    for (let i = 1; i < table.length; i++) expect(table[i]!.totalScore).toBeGreaterThanOrEqual(table[i - 1]!.totalScore);
    expect(table.at(-1)!.totalScore).toBe(3);
    expect(table.length).toBe(3);
  });

  it('retune range lets one drum reach neighbouring Sa', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('C#'), ragaId: 'yaman' },
      { name: 'B', sa: P('D'), ragaId: 'yaman' },
    ];
    const ctx = buildContexts(songs, RAGA_MAP, W);
    expect(minimumKit(ctx, anyDayan(0), opts)!.k).toBe(2);
    const kit = minimumKit(ctx, anyDayan(1), opts)!;
    expect(kit.k).toBe(1);
    expect(kit.assignments.every((a) => a.option.reason === 'Sa')).toBe(true);
  });

  it('bestKitOfSize prefers coverage over raw score', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('C'), ragaId: 'bhupali' },
      { name: 'B', sa: P('F#'), ragaId: 'bhupali' },
    ];
    const kit = bestKitOfSize(buildContexts(songs, RAGA_MAP, W), ANY, 1, opts);
    expect(kit.covered).toBe(1);
    expect(kit.complete).toBe(false);
  });
});

describe('optimizer with the drums the player owns', () => {
  const songs: Song[] = [
    { name: 'A', sa: P('C#'), ragaId: 'yaman' },
    { name: 'B', sa: P('D'), ragaId: 'bhupali' },
    { name: 'C', sa: P('G'), ragaId: 'kafi' },
  ];
  const ctx = buildContexts(songs, RAGA_MAP, W);

  it('only picks from owned drums and reports what is left uncovered', () => {
    const owned = [D('C#'), D('G'), D('A#')];
    const table = kitTradeoff(ctx, owned, opts);
    expect(table.length).toBeLessThanOrEqual(owned.length);
    const best = table.at(-1)!;
    expect(best.complete).toBe(false);
    expect(best.covered).toBe(2);
    expect(best.dayans.every((d) => owned.includes(d))).toBe(true);
    expect(best.assignments[1]!.option.score).toBeLessThan(opts.threshold);
  });

  it('per-drum retune range is honoured', () => {
    // C# ±1 reaches D, which is Sa for B and vadi (Pa) for C — one drum covers all three.
    const owned = [D('C#', 1), D('G')];
    const kit = minimumKit(ctx, owned, opts)!;
    expect(kit.k).toBe(1);
    expect(kit.dayans[0]).toBe(owned[0]);
    const b = kit.assignments[1]!;
    expect(b.playedAt).toBe(P('D'));
    expect(b.option.reason).toBe('Sa');
    expect(kit.assignments[2]!.playedAt).toBe(P('D'));
    // Without the range, the same two drums leave B uncovered.
    expect(minimumKit(ctx, [D('C#'), D('G')], opts)).toBeUndefined();
  });

  it('suggests the one extra drum that closes the gap', () => {
    const owned = [D('C#'), D('G')];
    const kit = kitTradeoff(ctx, owned, opts).at(-1)!;
    expect(kit.complete).toBe(false);
    const s = suggestAddition(ctx, kit, 0, opts)!;
    expect(pitchName(s.dayan.pitch, 'sharp')).toBe('D');
    expect(s.kit.complete).toBe(true);
  });

  it('suggests nothing when no drum can improve the kit', () => {
    const owned = [D('C#'), D('D'), D('G')];
    const table = kitTradeoff(ctx, owned, opts);
    expect(table[1]!.complete).toBe(true); // {C#, D}: C rides on its vadi
    const perfect = table.at(-1)!;
    expect(perfect.totalScore).toBe(3);
    expect(suggestAddition(ctx, perfect, 0, opts)).toBeUndefined();
  });

  it('allows two drums of the same pitch with different ranges', () => {
    const owned = [D('C#'), D('C#', 2)];
    const kit = bestKitOfSize(ctx, owned, 2, opts);
    expect(kit.k).toBe(2);
    expect(kit.picked).toEqual([0, 1]);
  });
});
