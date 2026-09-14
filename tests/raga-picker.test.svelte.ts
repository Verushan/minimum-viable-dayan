// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import RagaPicker from '../src/ui/RagaPicker.svelte';

function setup(value = 'yaman') {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const props = $state({ value });
  const app = mount(RagaPicker, { target, props });
  const input = target.querySelector('input')!;
  const items = () => [...target.querySelectorAll('li[role="option"] .name')].map((n) => n.textContent);
  const type = (text: string) => {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    flushSync();
  };
  const key = (k: string) => { input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); flushSync(); };
  return { target, props, app, input, items, type, key, cleanup: () => { unmount(app); target.remove(); } };
}

describe('RagaPicker', () => {
  it('shows the current raga and opens the full list on focus', () => {
    const t = setup();
    expect(t.input.value).toBe('Yaman');
    expect(t.target.querySelector('ul')).toBeNull();
    t.input.dispatchEvent(new Event('focus')); flushSync();
    expect(t.items().length).toBeGreaterThan(50);
    t.cleanup();
  });

  it('filters by name and by alias as the user types', () => {
    const t = setup();
    t.input.dispatchEvent(new Event('focus')); flushSync();
    t.type('bhai');
    expect(t.items()).toEqual(['Bhairav', 'Bhairavi', 'Ahir Bhairav', 'Bairagi Bhairav', 'Jaunpuri']); // Jaunpuri via alias Natabhairavi
    t.type('kalyani');
    expect(t.items()).toEqual(['Kedar', 'Yaman']); // Hameer Kalyani, Kalyani
    expect([...t.target.querySelectorAll('.via')].map((n) => n.textContent)).toEqual(['Hameer Kalyani', 'Kalyani']);
    t.type('yaman k');
    expect(t.items()).toEqual(['Yaman']);
    t.type('zzz');
    expect(t.items()).toEqual([]);
    expect(t.target.querySelector('.empty')?.textContent).toContain('zzz');
    t.cleanup();
  });

  it('selects with Enter and with a click, then closes', () => {
    const t = setup();
    t.input.dispatchEvent(new Event('focus')); flushSync();
    t.type('malk');
    t.key('Enter');
    expect(t.props.value).toBe('malkauns');
    expect(t.target.querySelector('ul')).toBeNull();
    expect(t.input.value).toBe('Malkauns');

    t.input.dispatchEvent(new Event('focus')); flushSync();
    t.type('des');
    (t.target.querySelector('li[role="option"]') as HTMLElement).click(); flushSync();
    expect(t.props.value).toBe('des');
    t.cleanup();
  });

  it('arrow keys move the highlight', () => {
    const t = setup();
    t.input.dispatchEvent(new Event('focus')); flushSync();
    t.type('sarang');
    t.key('ArrowDown');
    t.key('Enter');
    expect(t.props.value).toBe('madhmad-sarang');
    t.cleanup();
  });
});
