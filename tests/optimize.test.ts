import { describe, expect, it } from 'vitest';
import { anyDayan, buildContexts, bestKitOfSize, kitTradeoff, minimumKit, suggestAddition, suggestKeyShifts } from '../src/engine/optimize';
import { parsePitch, pitchName } from '../src/engine/pitch';
import { RAGA_MAP } from '../src/data/ragas';
import { DEFAULT_WEIGHTS as W } from '../src/data/weights';
import type { Dayan, OptimizeOptions, PitchClass, Song } from '../src/engine/types';

const P = (n: string) => parsePitch(n)!;
const D = (n: string, range = 0): Dayan => ({ pitch: P(n), range });
const opts: OptimizeOptions = { threshold: 0.7, maxK: 4 };
const ANY = anyDayan();
const names = (kit: { tuned: { tunedTo: PitchClass }[] }) => kit.tuned.map((t) => pitchName(t.tunedTo, 'sharp')).sort();

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
    expect(names(min)).toEqual(['C#']);
    expect(min.assignments.map((a) => a.option.reason)).toEqual(['Sa', 'Ma', 'Sa']);

    const two = bestKitOfSize(ctx, ANY, 2, opts);
    expect(names(two)).toEqual(['C#', 'G#']);
    expect(two.totalScore).toBe(3);
  });

  it('one drum suffices when all songs share a Sa', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('D'), ragaId: 'bhairavi' },
      { name: 'B', sa: P('D'), ragaId: 'kafi' },
    ];
    const kit = minimumKit(buildContexts(songs, RAGA_MAP, W), ANY, opts)!;
    expect(kit.k).toBe(1);
    expect(names(kit)).toEqual(['D']);
  });

  it('uses the vadi to share a drum when it clears the threshold', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('D'), ragaId: 'kafi' }, // vadi P = A
      { name: 'B', sa: P('A'), ragaId: 'yaman' },
    ];
    const kit = minimumKit(buildContexts(songs, RAGA_MAP, W), ANY, opts)!;
    expect(kit.k).toBe(1);
    expect(names(kit)).toEqual(['A']);
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
    expect(best.tuned.every((t) => owned.includes(t.dayan))).toBe(true);
    expect(best.assignments[1]!.option.score).toBeLessThan(opts.threshold);
  });

  it('a drum with range is set to one pitch for the whole session, not retuned per song', () => {
    // C# ±1 can be set to C# (covers A) or D (covers B) — but not both, since the drum does
    // not move between songs. Either way one song is left without a fit.
    const owned = [D('C#', 1), D('G')];
    const kit = bestKitOfSize(ctx, owned, 2, opts);
    expect(kit.complete).toBe(false);
    expect(kit.covered).toBe(2);
    const cs = kit.tuned.find((t) => t.dayan === owned[0])!;
    expect([P('C#'), P('D')]).toContain(cs.tunedTo);
    expect(kit.assignments.filter((a) => a.option.score === 0)).toHaveLength(1);
    // Each drum serves every song at its one session pitch.
    for (const a of kit.assignments) expect(a.tuned.tunedTo).toBe(a.tuned.dayan === owned[0] ? cs.tunedTo : P('G'));
  });

  it('range lets a drum be set to a neighbouring Sa when that covers more', () => {
    const songs2: Song[] = [
      { name: 'A', sa: P('D'), ragaId: 'yaman' },
      { name: 'B', sa: P('D'), ragaId: 'bhairavi' },
    ];
    const ctx2 = buildContexts(songs2, RAGA_MAP, W);
    expect(minimumKit(ctx2, [D('C#')], opts)).toBeUndefined();
    const kit = minimumKit(ctx2, [D('C#', 1)], opts)!;
    expect(kit.k).toBe(1);
    expect(kit.tuned[0]!.tunedTo).toBe(P('D'));
    expect(kit.assignments.every((a) => a.option.reason === 'Sa')).toBe(true);
  });

  it('suggests the one extra drum that closes the gap', () => {
    const owned = [D('C#'), D('G')];
    const kit = kitTradeoff(ctx, owned, opts).at(-1)!;
    expect(kit.complete).toBe(false);
    const s = suggestAddition(ctx, kit, opts)!;
    expect(pitchName(s.dayan.pitch, 'sharp')).toBe('D');
    expect(s.kit.complete).toBe(true);
  });

  it('suggests nothing when no drum can improve the kit', () => {
    const owned = [D('C#'), D('D'), D('G')];
    const table = kitTradeoff(ctx, owned, opts);
    expect(table[1]!.complete).toBe(true); // {C#, D}: C rides on its vadi
    const perfect = table.at(-1)!;
    expect(perfect.totalScore).toBe(3);
    expect(suggestAddition(ctx, perfect, opts)).toBeUndefined();
  });

  it('allows two drums of the same pitch with different ranges', () => {
    const owned = [D('C#'), D('C#', 2)];
    const kit = bestKitOfSize(ctx, owned, 2, opts);
    expect(kit.k).toBe(2);
    expect(kit.picked).toEqual([0, 1]);
  });
});

describe('singer key-shift suggestions', () => {
  it('suggests a semitone shift that lets the owned drums cover an uncovered song', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('C#'), ragaId: 'yaman' },
      { name: 'B', sa: P('D'), ragaId: 'bhupali' }, // no drum fits D
    ];
    const ctx = buildContexts(songs, RAGA_MAP, W);
    const owned = [D('C#')];
    const kit = kitTradeoff(ctx, owned, opts).at(-1)!;
    expect(kit.complete).toBe(false);
    const shifts = suggestKeyShifts(ctx, owned, kit, W, opts);
    expect(shifts).toHaveLength(1);
    expect(shifts[0]).toMatchObject({ songIndex: 1, from: P('D'), to: P('C#'), shift: -1, effect: 'covers' });
    expect(shifts[0]!.kit.complete).toBe(true);
  });

  it('suggests a shift that reduces the number of drums when any pitch is available', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('C#'), ragaId: 'yaman' },
      { name: 'B', sa: P('D'), ragaId: 'yaman' },
      { name: 'C', sa: P('C#'), ragaId: 'bhupali' },
    ];
    const ctx = buildContexts(songs, RAGA_MAP, W);
    const kit = minimumKit(ctx, ANY, opts)!;
    expect(kit.k).toBe(2);
    const shifts = suggestKeyShifts(ctx, ANY, kit, W, opts);
    const b = shifts.find((s) => s.songIndex === 1)!;
    expect(b).toMatchObject({ to: P('C#'), shift: -1, effect: 'fewer-drums' });
    expect(b.kit.k).toBe(1);
    // Shifting A or C alone cannot reduce the kit (B still needs D).
    expect(shifts.map((s) => s.songIndex)).toEqual([1]);
  });

  it('suggests nothing when one drum already covers everything', () => {
    const songs: Song[] = [
      { name: 'A', sa: P('C#'), ragaId: 'yaman' },
      { name: 'B', sa: P('C#'), ragaId: 'kafi' },
    ];
    const ctx = buildContexts(songs, RAGA_MAP, W);
    const kit = minimumKit(ctx, ANY, opts)!;
    expect(suggestKeyShifts(ctx, ANY, kit, W, opts)).toEqual([]);
  });
});
