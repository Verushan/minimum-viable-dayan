import { describe, expect, it } from 'vitest';
import { RAGAS, findRagaByLabel } from '../src/data/ragas';
import { SWARA_OFFSET } from '../src/engine/pitch';
import bookLabels from './fixtures/bhajan-book-raga-labels.json';

describe('raga dataset', () => {
  it('has unique ids', () => {
    const ids = RAGAS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is alphabetical after the Unknown fallback', () => {
    const names = RAGAS.slice(1).map((r) => r.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(RAGAS[0]!.id).toBe('unknown');
  });

  it('has no alias that collides with another raga', () => {
    const owner = new Map<string, string>();
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9/]/g, '');
    for (const r of RAGAS) {
      for (const a of [r.name, ...(r.aliases ?? [])]) {
        const k = norm(a);
        expect(owner.get(k) ?? r.id, `"${a}" claimed by both ${owner.get(k)} and ${r.id}`).toBe(r.id);
        owner.set(k, r.id);
      }
    }
  });

  for (const raga of RAGAS) {
    it(`${raga.name} is well-formed`, () => {
      expect(raga.swaras).toContain('S');
      expect(new Set(raga.swaras).size).toBe(raga.swaras.length);
      for (const s of raga.swaras) expect(SWARA_OFFSET[s]).toBeDefined();
      if (raga.vadi) expect(raga.swaras).toContain(raga.vadi);
      if (raga.samvadi) expect(raga.swaras).toContain(raga.samvadi);
      if (raga.vadi && raga.samvadi) expect(raga.vadi).not.toBe(raga.samvadi);
    });
  }
});

describe('findRagaByLabel', () => {
  it('resolves names, aliases and Carnatic/Hindustani pairs', () => {
    expect(findRagaByLabel('Yaman')?.id).toBe('yaman');
    expect(findRagaByLabel('kalyani')?.id).toBe('yaman');
    expect(findRagaByLabel('Mohanam/Bhoopali')?.id).toBe('bhupali');
    expect(findRagaByLabel('Hindolam/Malkauns')?.id).toBe('malkauns');
    expect(findRagaByLabel('Darbari, Sindhu Bhairavi/Darbari Kanada')?.id).toBe('darbari');
    expect(findRagaByLabel('Nonexistent')).toBeUndefined();
  });

  it('resolves every raga label used in the bhajan books', () => {
    const missing = bookLabels.filter((l) => !findRagaByLabel(l));
    expect(missing).toEqual([]);
  });
});
