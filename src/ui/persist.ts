import type { Dayan, PitchClass, Song } from '../engine/types';
import { RAGA_MAP } from '../data/ragas';

export interface SavedState {
  songs: Song[];
  /** Drums the player owns; empty means "any tuning may be suggested". */
  drums: Dayan[];
  threshold: number;
}

const LS_KEY = 'mvd:state';

const isPitch = (x: unknown): x is PitchClass => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x < 12;

function isSong(x: unknown): x is Song {
  if (typeof x !== 'object' || x === null) return false;
  const s = x as Record<string, unknown>;
  return typeof s.name === 'string' && isPitch(s.sa) && typeof s.ragaId === 'string' && RAGA_MAP.has(s.ragaId);
}

function isDayan(x: unknown): x is Dayan {
  if (typeof x !== 'object' || x === null) return false;
  const d = x as Record<string, unknown>;
  return isPitch(d.pitch) && typeof d.range === 'number' && d.range >= 0 && d.range <= 6;
}

export function parseState(raw: unknown): SavedState | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.songs) || !r.songs.every(isSong)) return undefined;
  const drums = Array.isArray(r.drums) && r.drums.every(isDayan) ? r.drums : [];
  return {
    songs: r.songs.map((s) => ({ name: s.name, sa: s.sa, ragaId: s.ragaId })),
    drums: drums.map((d) => ({ pitch: d.pitch, range: d.range })),
    threshold: typeof r.threshold === 'number' ? r.threshold : 0.7,
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
