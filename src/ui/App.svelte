<script lang="ts">
  import { RAGAS, RAGA_MAP } from '../data/ragas';
  import { DEFAULT_WEIGHTS } from '../data/weights';
  import {
    ALL_PITCHES, SWARA_LABEL, buildContexts, kitTradeoff, pitchName, rankDayans,
    type KitResult, type PitchClass, type Song,
  } from '../engine';
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
    songs.push({ name: `Song ${songs.length + 1}`, sa: last?.sa ?? 1, ragaId: last?.ragaId ?? 'unknown' });
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

  function songsOn(kit: KitResult, pitch: PitchClass) {
    return kit.assignments.filter((a) => a.dayan.pitch === pitch);
  }
  /** Dropdown label: Hindustani name plus short aliases (skips the combined book labels). */
  function ragaLabel(r: { name: string; aliases?: string[] }) {
    const short = (r.aliases ?? []).slice(0, 2);
    return short.length ? `${r.name} (${short.join(', ')})` : r.name;
  }
  function reasonClass(reason: string) {
    return reason === 'Sa' ? 'sa' : reason === 'Vadi' ? 'vadi' : reason === 'Samvadi' ? 'samvadi' : '';
  }
</script>

<main>
  <h1>Minimum Viable Dayan</h1>
  <p class="sub">Enter the session's songs with their Sa and raga; get the fewest tabla dayan tunings that cover the set.</p>

  <h2>Setlist</h2>
  <div class="scroll">
    <table>
      <thead>
        <tr><th>#</th><th>Song</th><th>Sa</th><th>Raga</th><th>Suitable dayans (best first)</th><th class="no-print"></th></tr>
      </thead>
      <tbody>
        {#each songs as song, i (i)}
          {@const ranked = rankDayans(song, RAGA_MAP.get(song.ragaId)!, weights)}
          {@const chosen = shown?.assignments[i]}
          <tr>
            <td class="muted">{i + 1}</td>
            <td><input bind:value={song.name} size="18" /></td>
            <td>
              <select bind:value={song.sa}>
                {#each ALL_PITCHES as p}<option value={p}>{pn(p)}</option>{/each}
              </select>
            </td>
            <td>
              <select bind:value={song.ragaId}>
                {#each RAGAS as r}<option value={r.id}>{ragaLabel(r)}</option>{/each}
              </select>
              {#if RAGA_MAP.get(song.ragaId)?.notes}
                <div class="muted" style="font-size:0.8rem;max-width:22em">{RAGA_MAP.get(song.ragaId)?.notes}</div>
              {/if}
            </td>
            <td>
              {#each ranked as o}
                <span class="pill {reasonClass(o.reason)}" class:chosen={chosen?.playedAt === o.pitch}
                  title="{SWARA_LABEL[o.swara]} of {pn(song.sa)}">
                  {pn(o.pitch)} <small>{o.reason} {fmt(o.score)}</small>
                </span>
              {/each}
            </td>
            <td class="no-print">
              <div class="row-actions">
                <button class="ghost" onclick={() => move(i, -1)} disabled={i === 0} title="Move up">↑</button>
                <button class="ghost" onclick={() => move(i, 1)} disabled={i === songs.length - 1} title="Move down">↓</button>
                <button class="ghost" onclick={() => removeSong(i)} title="Remove">✕</button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="toolbar no-print">
    <button class="primary" onclick={addSong}>+ Add song</button>
    <button onclick={openJson}>Import / export JSON</button>
    <button onclick={copyLink}>{copied ? 'Copied!' : 'Copy share link'}</button>
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

  <h2>Options</h2>
  <div class="controls no-print">
    <label>
      <span>Minimum acceptable score per song</span>
      <input type="range" min="0.3" max="1" step="0.05" bind:value={threshold} />
      <span>{fmt(threshold)} {threshold >= 1 ? '(Sa only)' : threshold > weights.vadi ? '(Sa only)' : threshold > weights.samvadi ? '(Sa or vadi)' : threshold > (weights.other.P ?? 0) ? '(Sa, vadi or samvadi)' : ''}</span>
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

  <h2>Kit</h2>
  {#if !songs.length}
    <p class="muted">Add a song to get started.</p>
  {:else if shown}
    {#if minimum}
      <div class="status ok">
        <strong>{minimum.k} dayan{minimum.k > 1 ? 's' : ''}</strong> cover all {songs.length} song{songs.length > 1 ? 's' : ''} at ≥ {fmt(threshold)}:
        {minimum.dayans.map((d) => pn(d.pitch)).join(', ')}
      </div>
    {:else}
      <div class="status bad">No kit of up to {maxK} drums covers every song at ≥ {fmt(threshold)}. Lower the threshold, allow retuning, or see the best partial kits below.</div>
    {/if}

    <div class="kit">
      {#each shown.dayans as d}
        <div class="drum">
          <h3>{pn(d.pitch)}</h3>
          <ul>
            {#each songsOn(shown, d.pitch) as a}
              <li class:compromise={a.option.reason !== 'Sa'}>
                {a.song.name}
                <span class="muted">— {a.option.reason === 'Sa' ? 'Sa' : `${SWARA_LABEL[a.option.swara]} (${a.option.reason.toLowerCase()})`}
                  {#if a.playedAt !== d.pitch} · retune to {pn(a.playedAt)}{/if}
                  · {fmt(a.option.score)}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>

    <h2>Tradeoff by number of drums</h2>
    <div class="scroll">
      <table class="tradeoff">
        <thead><tr><th>Drums</th><th>Tunings</th><th>Songs covered</th><th>Total score</th><th></th></tr></thead>
        <tbody>
          {#each tradeoff as r}
            <tr class:active={shown.k === r.k} onclick={() => (selectedK = r.k)}>
              <td>{r.k}</td>
              <td>{r.dayans.map((d) => pn(d.pitch)).join(', ')}</td>
              <td>{r.covered} / {songs.length}</td>
              <td>{fmt(r.totalScore)} / {songs.length}</td>
              <td class="muted">{r.complete ? 'complete' : ''}{r === minimum ? ' · minimum' : ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="muted no-print">Click a row to view that kit above.</p>
  {/if}

  <h2>How scoring works</h2>
  <p class="muted">
    For each song, every pitch is scored as a dayan tuning: <strong>Sa</strong> = {fmt(weights.sa)},
    the raga's <strong>vadi</strong> = {fmt(weights.vadi)}, <strong>samvadi</strong> = {fmt(weights.samvadi)},
    then any other note the raga uses (Pa {fmt(weights.other.P ?? 0)}, Ma {fmt(weights.other.m ?? 0)}, Ga/Dha {fmt(weights.other.G ?? 0)}, Re/Ni {fmt(weights.other.R ?? 0)}).
    Notes the raga omits, and notes a minor 2nd, tritone or major 7th above Sa, score 0.
    The kit search tries every combination of up to {maxK} tunings and picks the one covering the most songs, then the highest total score.
  </p>
</main>
