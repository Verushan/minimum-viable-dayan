import { describe, expect, it } from 'vitest';
import { preferredFifth, rankDayans, scorePitch } from '../src/engine/scoring';
import { parsePitch, pitchOf } from '../src/engine/pitch';
import { RAGA_MAP } from '../src/data/ragas';
import { DEFAULT_WEIGHTS as W } from '../src/data/weights';
import type { Song } from '../src/engine/types';

const raga = (id: string) => RAGA_MAP.get(id)!;
const CS = parsePitch('C#')!;
const song = (ragaId: string): Song => ({ name: 'x', sa: CS, ragaId });
const at = (ragaId: string, swara: Parameters<typeof pitchOf>[1]) => scorePitch(song(ragaId), raga(ragaId), pitchOf(CS, swara), W);

describe('preferredFifth', () => {
  it('Pa when the raga has Pa as vadi/samvadi', () => {
    expect(preferredFifth(raga('kafi'))).toBe('P'); // vadi P
    expect(preferredFifth(raga('des'))).toBe('P'); // samvadi P
  });
  it('Ma when Pa is absent', () => {
    expect(preferredFifth(raga('malkauns'))).toBe('m');
  });
  it('Ma when Pa is present but not emphasised', () => {
    expect(preferredFifth(raga('bhairavi'))).toBe('m');
    expect(preferredFifth(raga('bilawal'))).toBe('m'); // vadi D, samvadi G
  });
  it('Pa when Pa is present, unemphasised, and there is no shuddha Ma', () => {
    expect(preferredFifth(raga('yaman'))).toBe('P');
    expect(preferredFifth(raga('bhupali'))).toBe('P');
  });
  it('undefined when the raga has neither', () => {
    expect(preferredFifth(raga('marwa'))).toBeUndefined();
  });
});

describe('scorePitch', () => {
  it('Sa is always 1.0', () => {
    expect(at('yaman', 'S').score).toBe(1);
  });

  it('Pa is preferred when it is vadi/samvadi (Kafi: vadi P)', () => {
    expect(at('kafi', 'P')).toMatchObject({ reason: 'Pa', score: W.preferredFifth });
    expect(at('kafi', 'm')).toMatchObject({ reason: 'Ma', score: W.otherFifth });
  });

  it('Ma is preferred when Pa is present but not emphasised (Bhairavi: vadi m, Pa plain)', () => {
    expect(at('bhairavi', 'm')).toMatchObject({ reason: 'Ma', score: W.preferredFifth });
    expect(at('bhairavi', 'P')).toMatchObject({ reason: 'Pa', score: W.otherFifth });
  });

  it('Ma is preferred when Pa is absent (Malkauns)', () => {
    expect(at('malkauns', 'm')).toMatchObject({ reason: 'Ma', score: W.preferredFifth });
    expect(at('malkauns', 'P').score).toBe(0); // varjit
  });

  it('Pa is the fallback when Ma is absent and Pa not emphasised (Yaman: only teevra Ma)', () => {
    expect(preferredFifth(raga('yaman'))).toBe('P');
    expect(at('yaman', 'P')).toMatchObject({ reason: 'Pa', score: W.preferredFifth });
    expect(at('yaman', 'M').score).toBe(0); // tritone
  });

  it('other vadi/samvadi notes rank below Pa/Ma', () => {
    // Yaman: vadi G, samvadi N. Ga is emphasised but not a fifth-relation.
    const ga = at('yaman', 'G');
    expect(ga).toMatchObject({ reason: 'Vadi', score: W.vadi });
    expect(ga.score).toBeLessThan(at('yaman', 'P').score);
    expect(at('yaman', 'N')).toMatchObject({ reason: 'Samvadi', score: 0 }); // major 7th → forbidden
  });

  it('varjit notes score 0', () => {
    expect(at('bhupali', 'm').score).toBe(0);
  });

  it('forbidden intervals score 0 even when vadi', () => {
    expect(at('marwa', 'r').score).toBe(0);
    expect(at('marwa', 'D')).toMatchObject({ reason: 'Samvadi', score: W.samvadi });
  });
});

describe('rankDayans', () => {
  it('orders Sa, then Pa/Ma, then the rest, dropping zero scores', () => {
    const ranked = rankDayans(song('bhupali'), raga('bhupali'), W); // S R G P D; vadi G, samvadi D
    expect(ranked.map((o) => o.reason)).toEqual(['Sa', 'Pa', 'Vadi', 'Samvadi', 'Other']);
    expect(ranked.every((o) => o.score > 0)).toBe(true);
  });
});
