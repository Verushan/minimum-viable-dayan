// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushSync, mount, tick, unmount } from 'svelte';
import App from '../src/ui/App.svelte';

describe('App song list', () => {
  it('inserts a blank song between two songs, copying Sa and raga from the one above', async () => {
    location.hash = '';
    const target = document.createElement('div');
    document.body.appendChild(target);
    const app = mount(App, { target });
    flushSync();

    const names = () => [...target.querySelectorAll<HTMLInputElement>('.song-name')].map((n) => n.value);
    expect(names()).toEqual(['Bhajan A', 'Bhajan B', 'Bhajan C']);

    const gaps = target.querySelectorAll<HTMLButtonElement>('.insert-gap button');
    expect(gaps).toHaveLength(2);
    gaps[1]!.click(); // between B and C
    flushSync();
    await tick();

    expect(names()).toEqual(['Bhajan A', 'Bhajan B', '', 'Bhajan C']);
    const inserted = target.querySelector<HTMLInputElement>('.song-name[data-index="2"]')!;
    expect(document.activeElement).toBe(inserted);
    const sas = [...target.querySelectorAll<HTMLSelectElement>('.card-fields select')].map((s) => s.value);
    expect(sas[2]).toBe(sas[1]); // copied from Bhajan B

    unmount(app);
    target.remove();
  });

  it("ranks Malkauns' Ma above Sa in best-note mode", () => {
    location.hash = '';
    const target = document.createElement('div');
    document.body.appendChild(target);
    const app = mount(App, { target });
    flushSync();

    const malkaunsCard = () => target.querySelectorAll('.card')[1]!;
    const firstPill = () => malkaunsCard().querySelector('.options-row .pill small')!.textContent;
    expect(firstPill()).toBe('Sa');
    expect(malkaunsCard().querySelector('.fifth-hint')!.textContent).toContain('may sound better than Sa');

    const best = [...target.querySelectorAll<HTMLButtonElement>('.segmented button')].find((b) => b.textContent!.includes('best note'))!;
    best.click();
    flushSync();
    expect(firstPill()).toBe('Ma');
    expect(malkaunsCard().querySelector('.fifth-hint')!.textContent).toContain('is ranked above Sa');
    // Yaman has no signature fifth, so it still prefers Sa.
    expect(target.querySelectorAll('.card')[0]!.querySelector('.options-row .pill small')!.textContent).toBe('Sa');

    unmount(app);
    target.remove();
  });
});
