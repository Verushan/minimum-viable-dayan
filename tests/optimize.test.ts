import { describe, expect, it } from 'vitest';
import { buildContexts, bestKitOfSize, kitTradeoff, minimumKit } from '../src/engine/optimize';
import { parsePitch, pitchName } from '../src/engine/pitch';
import { RAGA_MAP } from '../src/data/ragas';
import { DEFAULT_WEIGHTS as W } from '../src/data/weights';
import type { OptimizeOptions, Song } from '../src/engine/types';

const P = (n: string) => parsePitch(n)!;
const opts: OptimizeOptions = { threshold: 0.7, retuneRange: 0, maxK: 4 };

describe('optimizer', () => {
  it('solves the brief example: one drum at C# suffices, two drums give a perfect score', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('C#'), ragaId: 'yaman' },
      { name: 'B', sa: P('G#'), ragaId: 'malkauns' }, // vadi Ma = C#
      { name: 'C', sa: P('C#'), ragaId: 'marwa' },
    ];
    const ctx = buildContexts(songs, RAGA_MAP, W);
    const min = minimumKit(ctx, opts)!;
    expect(min.k).toBe(1);
    expect(pitchName(min.dayans[0]!.pitch, 'sharp')).toBe('C#');
    expect(min.assignments.map((a) => a.option.reason)).toEqual(['Sa', 'Vadi', 'Sa']);

    const two = bestKitOfSize(ctx, 2, opts);
    expect(two.dayans.map((d) => pitchName(d.pitch, 'sharp')).sort()).toEqual(['C#', 'G#']);
    expect(two.totalScore).toBe(3);
  });

  it('one drum suffices when all songs share a Sa', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('D'), ragaId: 'bhairavi' },
      { name: 'B', sa: P('D'), ragaId: 'kafi' },
    ];
    const kit = minimumKit(buildContexts(songs, RAGA_MAP, W), opts)!;
    expect(kit.k).toBe(1);
    expect(pitchName(kit.dayans[0]!.pitch, 'sharp')).toBe('D');
  });

  it('uses the vadi to share a drum when it clears the threshold', () => {
    // Kafi in D (vadi P = A) and something in A: one drum at A covers both at >= 0.7? Kafi@A = 0.85.
    const songs: Song[] = [
      { name: 'A', sa: P('D'), ragaId: 'kafi' },
      { name: 'B', sa: P('A'), ragaId: 'yaman' },
    ];
    const kit = minimumKit(buildContexts(songs, RAGA_MAP, W), opts)!;
    expect(kit.k).toBe(1);
    expect(pitchName(kit.dayans[0]!.pitch, 'sharp')).toBe('A');
  });

  it('tradeoff table is monotone in score and stops once perfect', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('C'), ragaId: 'yaman' },
      { name: 'B', sa: P('E'), ragaId: 'yaman' },
      { name: 'C', sa: P('G#'), ragaId: 'yaman' },
    ];
    const table = kitTradeoff(buildContexts(songs, RAGA_MAP, W), opts);
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
    expect(minimumKit(ctx, opts)!.k).toBe(2);
    const kit = minimumKit(ctx, { ...opts, retuneRange: 1 })!;
    expect(kit.k).toBe(1);
    expect(kit.assignments.every((a) => a.option.reason === 'Sa')).toBe(true);
  });

  it('bestKitOfSize prefers coverage over raw score', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('C'), ragaId: 'bhupali' },
      { name: 'B', sa: P('F#'), ragaId: 'bhupali' },
    ];
    const kit = bestKitOfSize(buildContexts(songs, RAGA_MAP, W), 1, opts);
    expect(kit.covered).toBe(1);
    expect(kit.complete).toBe(false);
  });
});
