import { describe, expect, it } from 'vitest';
import { rankDayans, scorePitch } from '../src/engine/scoring';
import { parsePitch, pitchOf } from '../src/engine/pitch';
import { RAGA_MAP } from '../src/data/ragas';
import { DEFAULT_WEIGHTS as W } from '../src/data/weights';
import type { Song } from '../src/engine/types';

const raga = (id: string) => RAGA_MAP.get(id)!;
const CS = parsePitch('C#')!;

describe('scorePitch', () => {
  it('Sa is always 1.0', () => {
    const song: Song = { name: 'x', sa: CS, ragaId: 'yaman' };
    expect(scorePitch(song, raga('yaman'), CS, W).score).toBe(1);
  });

  it('vadi beats samvadi beats Pa', () => {
    // Yaman: vadi G, samvadi N, Pa present but not emphasised.
    const song: Song = { name: 'x', sa: CS, ragaId: 'yaman' };
    const r = raga('yaman');
    const ga = scorePitch(song, r, pitchOf(CS, 'G'), W);
    const ni = scorePitch(song, r, pitchOf(CS, 'N'), W);
    const pa = scorePitch(song, r, pitchOf(CS, 'P'), W);
    expect(ga.reason).toBe('Vadi');
    expect(ga.score).toBeGreaterThan(pa.score);
    expect(ni.reason).toBe('Samvadi');
    expect(ni.score).toBe(0); // N is a major 7th above Sa → forbidden
    expect(pa.reason).toBe('Pa');
    expect(pa.score).toBe(W.other.P);
  });

  it('Pa gets the vadi weight when Pa is vadi', () => {
    const song: Song = { name: 'x', sa: CS, ragaId: 'kafi' };
    const pa = scorePitch(song, raga('kafi'), pitchOf(CS, 'P'), W);
    expect(pa.reason).toBe('Vadi');
    expect(pa.score).toBe(W.vadi);
  });

  it('varjit notes score 0', () => {
    const song: Song = { name: 'x', sa: CS, ragaId: 'malkauns' };
    expect(scorePitch(song, raga('malkauns'), pitchOf(CS, 'P'), W).score).toBe(0);
  });

  it('forbidden intervals score 0 even when vadi', () => {
    const song: Song = { name: 'x', sa: CS, ragaId: 'marwa' };
    expect(scorePitch(song, raga('marwa'), pitchOf(CS, 'r'), W).score).toBe(0);
    expect(scorePitch(song, raga('marwa'), pitchOf(CS, 'D'), W).reason).toBe('Samvadi');
  });
});

describe('rankDayans', () => {
  it('returns Sa first then vadi, drops zero scores', () => {
    const song: Song = { name: 'x', sa: CS, ragaId: 'bhupali' }; // vadi G, samvadi D
    const ranked = rankDayans(song, raga('bhupali'), W);
    expect(ranked.map((o) => o.reason)).toEqual(['Sa', 'Vadi', 'Samvadi', 'Pa', 'Other']);
    expect(ranked.every((o) => o.score > 0)).toBe(true);
  });
});
