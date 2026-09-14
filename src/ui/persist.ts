import type { PitchClass, Song } from '../engine/types';
import { RAGA_MAP } from '../data/ragas';

export interface SavedState {
  songs: Song[];
  threshold: number;
  retuneRange: number;
}

const LS_KEY = 'mvd:state';

function isSong(x: unknown): x is Song {
  if (typeof x !== 'object' || x === null) return false;
  const s = x as Record<string, unknown>;
  return typeof s.name === 'string'
    && typeof s.sa === 'number' && Number.isInteger(s.sa) && s.sa >= 0 && s.sa < 12
    && typeof s.ragaId === 'string' && RAGA_MAP.has(s.ragaId);
}

export function parseState(raw: unknown): SavedState | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.songs) || !r.songs.every(isSong)) return undefined;
  return {
    songs: r.songs.map((s) => ({ name: s.name, sa: s.sa as PitchClass, ragaId: s.ragaId })),
    threshold: typeof r.threshold === 'number' ? r.threshold : 0.7,
    retuneRange: typeof r.retuneRange === 'number' ? r.retuneRange : 0,
  };
}

function encode(state: SavedState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

function decode(s: string): SavedState | undefined {
  try {
    return parseState(JSON.parse(decodeURIComponent(escape(atob(s)))));
  } catch {
    return undefined;
  }
}

export function load(): SavedState | undefined {
  const hash = location.hash.replace(/^#/, '');
  if (hash) {
    const fromHash = decode(hash);
    if (fromHash) return fromHash;
  }
  try {
    const ls = localStorage.getItem(LS_KEY);
    if (ls) return parseState(JSON.parse(ls));
  } catch { /* ignore */ }
  return undefined;
}

export function save(state: SavedState): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  history.replaceState(null, '', state.songs.length ? `#${encode(state)}` : location.pathname);
}

export function shareUrl(state: SavedState): string {
  return `${location.origin}${location.pathname}#${encode(state)}`;
}
