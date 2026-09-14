<script lang="ts">
  import { RAGA_MAP } from '../data/ragas';
  import { DEFAULT_WEIGHTS } from '../data/weights';
  import {
    ALL_PITCHES, SWARA_LABEL, anyDayan, buildContexts, kitTradeoff, pitchName, rankDayans, suggestAddition, suggestKeyShifts,
    type Dayan, type KeyShift, type KitResult, type PitchClass, type Song,
  } from '../engine';
  import RagaPicker from './RagaPicker.svelte';
  import Resolution from './Resolution.svelte';
  import { load, parseState, save, shareUrl } from './persist';

  const initial = load();

  let songs = $state<Song[]>(initial?.songs ?? [
    { name: 'Bhajan A', sa: 1, ragaId: 'yaman' },
    { name: 'Bhajan B', sa: 8, ragaId: 'malkauns' },
    { name: 'Bhajan C', sa: 1, ragaId: 'marwa' },
  ]);
  let drums = $state<Dayan[]>(initial?.drums ?? []);
  let threshold = $state(initial?.threshold ?? 0.7);
  let newDrumPitch = $state<PitchClass>(1);
  let newDrumRange = $state(0);
  let nameStyle = $state<'sharp' | 'flat'>('sharp');
  let selectedK = $state<number | null>(null);
  let showJson = $state(false);
  let showOptions = $state(false);
  let jsonText = $state('');
  let jsonError = $state('');
  let copied = $state(false);

  const weights = DEFAULT_WEIGHTS;
  const maxK = 4;

  const ownedMode = $derived(drums.length > 0);
  const candidates = $derived<Dayan[]>(ownedMode ? drums : anyDayan());
  const opts = $derived({ threshold, maxK: ownedMode ? drums.length : maxK });
  const contexts = $derived(buildContexts(songs, RAGA_MAP, weights));
  const tradeoff = $derived<KitResult[]>(songs.length ? kitTradeoff(contexts, candidates, opts) : []);
  const minimum = $derived(tradeoff.find((r) => r.complete));
  const shown = $derived<KitResult | undefined>(
    (selectedK && tradeoff.find((r) => r.k === selectedK)) || minimum || tradeoff.at(-1),
  );
  const suggestion = $derived(shown && !shown.complete ? suggestAddition(contexts, shown, opts) : undefined);
  const keyShifts = $derived<KeyShift[]>(shown ? suggestKeyShifts(contexts, candidates, shown, weights, opts) : []);

  $effect(() => { save({ songs, drums, threshold }); });

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

  function addDrum() {
    drums.push({ pitch: newDrumPitch, range: newDrumRange });
    drums.sort((a, b) => a.pitch - b.pitch || a.range - b.range);
    selectedK = null;
  }
  function removeDrum(i: number) { drums.splice(i, 1); selectedK = null; }
  function applyShift(k: KeyShift) {
    songs[k.songIndex]!.sa = k.to;
    selectedK = null;
  }
  function adoptSuggestion() {
    if (suggestion) { drums.push({ ...suggestion.dayan }); drums.sort((a, b) => a.pitch - b.pitch || a.range - b.range); selectedK = null; }
  }

  function openJson() {
    jsonText = JSON.stringify({ songs, drums, threshold }, null, 2);
    jsonError = '';
    showJson = true;
  }
  function applyJson() {
    try {
      const parsed = parseState(JSON.parse(jsonText));
      if (!parsed) throw new Error('Expected { songs: [{ name, sa: 0-11, ragaId }] } with known raga ids.');
      songs = parsed.songs;
      drums = parsed.drums;
      threshold = parsed.threshold;
      showJson = false;
    } catch (e) {
      jsonError = (e as Error).message;
    }
  }
  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl({ songs, drums, threshold }));
    copied = true;
    setTimeout(() => (copied = false), 1500);
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
              <RagaPicker bind:value={song.ragaId} />
            </label>
          </div>
          {#if raga.notes}<div class="raga-note">{raga.notes}</div>{/if}
          <div class="options-row">
            <span class="muted">Dayan options:</span>
            {#each ranked as o}
              <span class="pill {reasonClass(o.reason)}" class:chosen={chosen?.tuned.tunedTo === o.pitch}
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

  <section>
    <h2>Your dayans <span class="muted">({drums.length || 'none'})</span></h2>
    {#if drums.length}
      <ul class="drums">
        {#each drums as d, i (i)}
          <li class="drum-chip">
            <span class="drum-chip-pitch">{pn(d.pitch)}</span>
            <select bind:value={d.range} aria-label="Tuning range" onchange={() => (selectedK = null)}>
              <option value={0}>fixed pitch</option>
              <option value={1}>can set ±1</option>
              <option value={2}>can set ±2</option>
              <option value={3}>can set ±3</option>
            </select>
            <button class="ghost no-print" onclick={() => removeDrum(i)} title="Remove" aria-label="Remove drum">✕</button>
          </li>
        {/each}
      </ul>
      <p class="muted small">Only these drums will be suggested. A drum with a range is set to one pitch before the session and stays there — no retuning between songs. Remove all drums to let the tool pick any tuning.</p>
    {:else}
      <p class="muted small">No drums entered — any tuning will be suggested. Add the dayans you own to plan around them.</p>
    {/if}
    <div class="add-drum no-print">
      <select bind:value={newDrumPitch} aria-label="Pitch of drum to add">
        {#each ALL_PITCHES as p}<option value={p}>{pn(p)}</option>{/each}
      </select>
      <select bind:value={newDrumRange} aria-label="Tuning range of drum to add">
        <option value={0}>fixed pitch</option>
        <option value={1}>can set ±1</option>
        <option value={2}>can set ±2</option>
        <option value={3}>can set ±3</option>
      </select>
      <button class="primary" onclick={addDrum}>+ Add dayan</button>
    </div>
  </section>

  {#if !songs.length}
    <p class="muted">Add a song to get started.</p>
  {:else if shown}
    <Resolution kit={shown} {suggestion} {keyShifts} {threshold} {nameStyle} isMinimum={shown === minimum} {ownedMode} onapplyshift={applyShift} />
    {#if suggestion && ownedMode}
      <div class="toolbar no-print" style="margin-top:-6px">
        <button onclick={adoptSuggestion}>Add {pn(suggestion.dayan.pitch)} to my dayans</button>
      </div>
    {/if}

    <section class="no-print">
      <h2>More or fewer drums</h2>
      <div class="scroll">
        <table class="tradeoff">
          <thead><tr><th>Drums</th><th>Tunings</th><th>Covered</th><th>Score</th></tr></thead>
          <tbody>
            {#each tradeoff as r}
              <tr class:active={shown.k === r.k} onclick={() => (selectedK = r.k)}>
                <td>{r.k}</td>
                <td>{r.tuned.map((t) => pn(t.tunedTo)).join(', ')}</td>
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
          <span>{fmt(threshold)} {threshold > weights.preferredFifth ? '(Sa only)' : threshold > weights.otherFifth ? '(Sa, or the raga\'s Pa/Ma)' : threshold > weights.vadi ? '(Sa, Pa or Ma)' : ''}</span>
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
        Each pitch is scored as a dayan tuning per song: <strong>Sa</strong> {fmt(weights.sa)}; then
        <strong>Pa</strong> if the raga has it as vadi or samvadi, otherwise <strong>Ma</strong> if the raga has it
        ({fmt(weights.preferredFifth)} — the other of the pair, when present, {fmt(weights.otherFifth)});
        then any other vadi {fmt(weights.vadi)} / samvadi {fmt(weights.samvadi)}; then remaining notes
        (Ga/Dha {fmt(weights.other.G ?? 0)}, Re/Ni {fmt(weights.other.R ?? 0)}).
        Omitted notes, and notes a minor 2nd, tritone or major 7th above Sa, score 0.
        Every combination of {ownedMode ? 'your drums' : `up to ${maxK} tunings`} is tried; the kit covering the most songs, then the highest total score, wins.
      </p>
    {/if}
  </section>

  {#if shown}
    <a class="sticky-kit no-print" href="#resolution">
      <span class="sticky-label">Carry</span>
      {#each shown.tuned as t}<span class="sticky-pitch">{pn(t.tunedTo)}</span>{/each}
      <span class="sticky-more">{shown.complete ? 'all songs covered' : `${shown.covered}/${songs.length} covered`} ›</span>
    </a>
  {/if}
</main>
