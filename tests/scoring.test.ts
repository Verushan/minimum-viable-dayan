import { describe, expect, it } from 'vitest';
import { fifthHint, pakadRests, preferredFifth, rankDayans, scorePitch } from '../src/engine/scoring';
import { parsePitch, pitchOf } from '../src/engine/pitch';
import { RAGA_MAP } from '../src/data/ragas';
import { BEST_NOTE_WEIGHTS as BEST, DEFAULT_WEIGHTS as W } from '../src/data/weights';
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
  it('Ma when Ma is vadi/samvadi, even if the pakad rests on Pa', () => {
    expect(pakadRests(raga('bhairavi')).P).toBeGreaterThan(0);
    expect(preferredFifth(raga('bhairavi'))).toBe('m'); // vadi m
  });
  it('the pakad decides when neither is vadi/samvadi', () => {
    expect(preferredFifth(raga('bilawal'))).toBe('P'); // pakad "… G P D P, …" rests on Pa
    expect(preferredFifth(raga('basant-mukhari'))).toBe('m'); // pakad rests on Ma five times
  });
  it('Ma when Pa is present but neither is emphasised nor favoured by the pakad', () => {
    expect(preferredFifth(raga('ahir-bhairav'))).toBe('m'); // vadi m anyway
    expect(preferredFifth(raga('khamaj'))).toBe('m'); // no pakad recorded
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

describe('fifthHint', () => {
  it('suggests Pa when Pa is vadi/samvadi', () => {
    expect(fifthHint(raga('kafi'))).toEqual({ swara: 'P', why: 'vadi of Kafi', strength: 'signature' });
    expect(fifthHint(raga('des'))).toEqual({ swara: 'P', why: 'samvadi of Des', strength: 'signature' });
  });
  it('suggests Ma when Ma is vadi/samvadi', () => {
    expect(fifthHint(raga('bhairavi'))).toEqual({ swara: 'm', why: 'vadi of Bhairavi', strength: 'signature' });
  });
  it('suggests Ma when Pa is omitted', () => {
    expect(fifthHint(raga('malkauns'))?.swara).toBe('m'); // also its vadi
    expect(fifthHint(raga('natakurinji'))).toEqual({ swara: 'm', why: 'Natakurinji omits Pa', strength: 'fallback' });
  });
  it('suggests the fifth the pakad keeps resting on', () => {
    expect(fifthHint(raga('tilang'))).toEqual({ swara: 'P', why: 'pakad of Tilang rests on Pa', strength: 'signature' });
    expect(fifthHint(raga('jaunpuri'))?.swara).toBe('P');
    expect(fifthHint(raga('basant-mukhari'))?.swara).toBe('m');
    // A single resting phrase is not enough for a hint (Bilawal rests on Pa once).
    expect(fifthHint(raga('bilawal'))).toBeUndefined();
  });
  it('says nothing when neither is part of the raga signature', () => {
    expect(fifthHint(raga('yaman'))).toBeUndefined();
    expect(fifthHint(raga('bhupali'))).toBeUndefined();
    expect(fifthHint(raga('marwa'))).toBeUndefined();
  });
});

describe('best-note mode', () => {
  it('puts a signature Pa/Ma above Sa', () => {
    const k = (sw: Parameters<typeof pitchOf>[1]) => scorePitch(song('kafi'), raga('kafi'), pitchOf(CS, sw), BEST);
    expect(k('P').score).toBe(1);
    expect(k('S').score).toBe(BEST.saWhenSignature);
    expect(rankDayans(song('kafi'), raga('kafi'), BEST)[0]!.reason).toBe('Pa');
  });
  it('leaves Sa on top when the raga has no signature fifth', () => {
    expect(rankDayans(song('yaman'), raga('yaman'), BEST)[0]!.reason).toBe('Sa');
    expect(scorePitch(song('yaman'), raga('yaman'), CS, BEST).score).toBe(1);
  });
  it('does not promote the weak "omits Pa" fallback', () => {
    expect(rankDayans(song('natakurinji'), raga('natakurinji'), BEST)[0]!.reason).toBe('Sa');
  });
});
