<script lang="ts">
  import { RAGAS, RAGA_MAP } from '../data/ragas';
  import { DEFAULT_WEIGHTS } from '../data/weights';
  import {
    ALL_PITCHES, SWARA_LABEL, buildContexts, kitTradeoff, pitchName, rankDayans,
    type KitResult, type PitchClass, type Song,
  } from '../engine';
  import Resolution from './Resolution.svelte';
  import { load, parseState, save, shareUrl } from './persist';

  const initial = load();

  let songs = $state<Song[]>(initial?.songs ?? [
    { name: 'Bhajan A', sa: 1, ragaId: 'yaman' },
    { name: 'Bhajan B', sa: 8, ragaId: 'malkauns' },
    { name: 'Bhajan C', sa: 1, ragaId: 'marwa' },
  ]);
  let threshold = $state(initial?.threshold ?? 0.7);
  let retuneRange = $state(initial?.retuneRange ?? 0);
  let nameStyle = $state<'sharp' | 'flat'>('sharp');
  let selectedK = $state<number | null>(null);
  let showJson = $state(false);
  let showOptions = $state(false);
  let jsonText = $state('');
  let jsonError = $state('');
  let copied = $state(false);

  const weights = DEFAULT_WEIGHTS;
  const maxK = 4;

  const contexts = $derived(buildContexts(songs, RAGA_MAP, weights));
  const tradeoff = $derived<KitResult[]>(songs.length ? kitTradeoff(contexts, { threshold, retuneRange, maxK }) : []);
  const minimum = $derived(tradeoff.find((r) => r.complete));
  const shown = $derived<KitResult | undefined>(
    (selectedK && tradeoff.find((r) => r.k === selectedK)) || minimum || tradeoff.at(-1),
  );

  $effect(() => { save({ songs, threshold, retuneRange }); });

  const pn = (p: PitchClass) => pitchName(p, nameStyle);
  const fmt = (n: number) => n.toFixed(2);

  function addSong() {
    const last = songs.at(-1);
    songs.push({ name: '', sa: last?.sa ?? 1, ragaId: last?.ragaId ?? 'unknown' });
    queueMicrotask(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('.song-name');
      inputs[inputs.length - 1]?.focus();
    });
  }
  function removeSong(i: number) { songs.splice(i, 1); }
  function move(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= songs.length) return;
    [songs[i], songs[j]] = [songs[j]!, songs[i]!];
  }

  function openJson() {
    jsonText = JSON.stringify({ songs, threshold, retuneRange }, null, 2);
    jsonError = '';
    showJson = true;
  }
  function applyJson() {
    try {
      const parsed = parseState(JSON.parse(jsonText));
      if (!parsed) throw new Error('Expected { songs: [{ name, sa: 0-11, ragaId }] } with known raga ids.');
      songs = parsed.songs;
      threshold = parsed.threshold;
      retuneRange = parsed.retuneRange;
      showJson = false;
    } catch (e) {
      jsonError = (e as Error).message;
    }
  }
  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl({ songs, threshold, retuneRange }));
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  /** Dropdown label: Hindustani name plus short aliases. */
  function ragaLabel(r: { name: string; aliases?: string[] }) {
    const short = (r.aliases ?? []).slice(0, 2);
    return short.length ? `${r.name} (${short.join(', ')})` : r.name;
  }
  function reasonClass(reason: string) {
    return reason === 'Sa' ? 'sa' : reason === 'Vadi' ? 'vadi' : reason === 'Samvadi' ? 'samvadi' : '';
  }
</script>

<main>
  <header class="top">
    <h1>Minimum Viable Dayan</h1>
    <p class="sub">Enter the session's songs with their Sa and raga. Get the fewest tabla dayan tunings that cover the set.</p>
  </header>

  <section>
    <h2>Songs <span class="muted">({songs.length})</span></h2>
    <ol class="songs">
      {#each songs as song, i (i)}
        {@const raga = RAGA_MAP.get(song.ragaId)!}
        {@const ranked = rankDayans(song, raga, weights)}
        {@const chosen = shown?.assignments[i]}
        <li class="card">
          <div class="card-head">
            <span class="num">{i + 1}</span>
            <input class="song-name" bind:value={song.name} placeholder="Song name" aria-label="Song name" />
            <div class="row-actions no-print">
              <button class="ghost" onclick={() => move(i, -1)} disabled={i === 0} title="Move up" aria-label="Move up">↑</button>
              <button class="ghost" onclick={() => move(i, 1)} disabled={i === songs.length - 1} title="Move down" aria-label="Move down">↓</button>
              <button class="ghost" onclick={() => removeSong(i)} title="Remove" aria-label="Remove">✕</button>
            </div>
          </div>
          <div class="card-fields">
            <label>
              <span>Sa</span>
              <select bind:value={song.sa}>
                {#each ALL_PITCHES as p}<option value={p}>{pn(p)}</option>{/each}
              </select>
            </label>
            <label class="grow">
              <span>Raga</span>
              <select bind:value={song.ragaId}>
                {#each RAGAS as r}<option value={r.id}>{ragaLabel(r)}</option>{/each}
              </select>
            </label>
          </div>
          {#if raga.notes}<div class="raga-note">{raga.notes}</div>{/if}
          <div class="options-row">
            <span class="muted">Dayan options:</span>
            {#each ranked as o}
              <span class="pill {reasonClass(o.reason)}" class:chosen={chosen?.playedAt === o.pitch}
                title="{SWARA_LABEL[o.swara]} of {pn(song.sa)} · {fmt(o.score)}">
                {pn(o.pitch)}<small>{o.reason}</small>
              </span>
            {/each}
          </div>
        </li>
      {/each}
    </ol>
    <div class="toolbar no-print">
      <button class="primary big" onclick={addSong}>+ Add song</button>
      <button onclick={openJson}>Import / export</button>
      <button onclick={copyLink}>{copied ? 'Copied!' : 'Share link'}</button>
      <button onclick={() => print()}>Print</button>
    </div>
    {#if showJson}
      <div class="no-print" style="margin-top:12px">
        <textarea bind:value={jsonText}></textarea>
        {#if jsonError}<div class="status bad">{jsonError}</div>{/if}
        <div class="toolbar">
          <button class="primary" onclick={applyJson}>Apply</button>
          <button onclick={() => (showJson = false)}>Close</button>
        </div>
      </div>
    {/if}
  </section>

  {#if !songs.length}
    <p class="muted">Add a song to get started.</p>
  {:else if shown}
    <Resolution kit={shown} {threshold} {nameStyle} isMinimum={shown === minimum} />

    <section class="no-print">
      <h2>More or fewer drums</h2>
      <div class="scroll">
        <table class="tradeoff">
          <thead><tr><th>Drums</th><th>Tunings</th><th>Covered</th><th>Score</th></tr></thead>
          <tbody>
            {#each tradeoff as r}
              <tr class:active={shown.k === r.k} onclick={() => (selectedK = r.k)}>
                <td>{r.k}</td>
                <td>{r.dayans.map((d) => pn(d.pitch)).join(', ')}</td>
                <td>{r.covered}/{songs.length}{r === minimum ? ' ✓' : ''}</td>
                <td>{fmt(r.totalScore)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="muted small">Tap a row to view that kit in the final setlist. ✓ marks the fewest drums that cover every song.</p>
    </section>
  {/if}

  <section class="no-print">
    <h2>
      <button class="ghost h2-toggle" onclick={() => (showOptions = !showOptions)} aria-expanded={showOptions}>
        {showOptions ? '▾' : '▸'} Options
      </button>
    </h2>
    {#if showOptions}
      <div class="controls">
        <label>
          <span>Minimum acceptable score per song</span>
          <input type="range" min="0.3" max="1" step="0.05" bind:value={threshold} />
          <span>{fmt(threshold)} {threshold > weights.vadi ? '(Sa only)' : threshold > weights.samvadi ? '(Sa or vadi)' : threshold > (weights.other.P ?? 0) ? '(Sa, vadi or samvadi)' : ''}</span>
        </label>
        <label>
          <span>Drum retune range</span>
          <select bind:value={retuneRange}>
            <option value={0}>Exact pitch only</option>
            <option value={1}>± 1 semitone</option>
            <option value={2}>± 2 semitones</option>
          </select>
        </label>
        <label>
          <span>Note names</span>
          <select bind:value={nameStyle}>
            <option value="sharp">Sharps (C#)</option>
            <option value="flat">Flats (Db)</option>
          </select>
        </label>
      </div>
      <p class="muted small">
        Each pitch is scored as a dayan tuning per song: <strong>Sa</strong> {fmt(weights.sa)},
        the raga's <strong>vadi</strong> {fmt(weights.vadi)}, <strong>samvadi</strong> {fmt(weights.samvadi)},
        then other notes the raga uses (Pa {fmt(weights.other.P ?? 0)}, Ma {fmt(weights.other.m ?? 0)}, Ga/Dha {fmt(weights.other.G ?? 0)}, Re/Ni {fmt(weights.other.R ?? 0)}).
        Omitted notes, and notes a minor 2nd, tritone or major 7th above Sa, score 0.
        Every combination of up to {maxK} tunings is tried; the kit covering the most songs, then the highest total score, wins.
      </p>
    {/if}
  </section>

  {#if shown}
    <a class="sticky-kit no-print" href="#resolution">
      <span class="sticky-label">Carry</span>
      {#each shown.dayans as d}<span class="sticky-pitch">{pn(d.pitch)}</span>{/each}
      <span class="sticky-more">{shown.complete ? 'all songs covered' : `${shown.covered}/${songs.length} covered`} ›</span>
    </a>
  {/if}
</main>
