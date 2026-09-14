<script lang="ts">
  import { RAGA_MAP } from '../data/ragas';
  import { SWARA_LABEL, pitchName, type KitResult, type PitchClass } from '../engine';

  let { kit, threshold, nameStyle, isMinimum }: {
    kit: KitResult;
    threshold: number;
    nameStyle: 'sharp' | 'flat';
    isMinimum: boolean;
  } = $props();

  const pn = (p: PitchClass) => pitchName(p, nameStyle);
  const fmt = (n: number) => n.toFixed(2);
</script>

<section class="resolution" id="resolution">
  <h2>Final setlist</h2>
  <div class="kit-banner" class:incomplete={!kit.complete}>
    <div class="kit-label">Dayans to carry</div>
    <div class="kit-pitches">
      {#each kit.dayans as d}<span class="kit-pitch">{pn(d.pitch)}</span>{/each}
    </div>
    <div class="kit-note">
      {#if kit.complete}
        {kit.k} drum{kit.k > 1 ? 's' : ''} cover{kit.k > 1 ? '' : 's'} all {kit.assignments.length} songs{isMinimum ? ' — the fewest possible' : ''}
      {:else}
        {kit.covered} of {kit.assignments.length} songs covered at ≥ {fmt(threshold)}; the rest are compromises
      {/if}
    </div>
  </div>

  <ol class="final">
    {#each kit.assignments as a, i}
      {@const compromise = a.option.reason !== 'Sa'}
      {@const weak = a.option.score < threshold}
      <li class:compromise class:weak>
        <span class="num">{i + 1}</span>
        <span class="who">
          <span class="song">{a.song.name || 'Untitled'}</span>
          <span class="meta">Sa {pn(a.song.sa)} · {RAGA_MAP.get(a.song.ragaId)?.name}</span>
        </span>
        <span class="drum">
          <span class="drum-pitch">{pn(a.dayan.pitch)}</span>
          <span class="drum-how">
            {#if a.playedAt !== a.dayan.pitch}retune to {pn(a.playedAt)} · {/if}
            {a.option.reason === 'Sa' ? 'on Sa' : `${SWARA_LABEL[a.option.swara]} (${a.option.reason.toLowerCase()})`}
          </span>
        </span>
      </li>
    {/each}
  </ol>
</section>

<style>
  .resolution { margin-top: 32px; }
  .kit-banner {
    display: flex; flex-wrap: wrap; align-items: center; gap: 8px 20px;
    padding: 14px 16px; border-radius: 12px;
    background: var(--ok-soft); color: var(--ok); margin-bottom: 14px;
  }
  .kit-banner.incomplete { background: var(--warn-soft); color: var(--warn); }
  .kit-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; flex-basis: 100%; }
  .kit-pitches { display: flex; gap: 8px; flex-wrap: wrap; }
  .kit-pitch {
    font-size: 2rem; font-weight: 700; line-height: 1;
    padding: 8px 14px; border-radius: 10px; background: var(--bg); color: var(--fg);
  }
  .kit-note { flex: 1; min-width: 12em; }

  .final { list-style: none; margin: 0; padding: 0; }
  .final li {
    display: grid; grid-template-columns: auto 1fr auto; gap: 4px 12px; align-items: center;
    padding: 12px 10px; border-bottom: 1px solid var(--line);
  }
  .final li.compromise { background: color-mix(in srgb, var(--warn-soft) 40%, transparent); }
  .final li.weak { background: var(--bad-soft); }
  .num { color: var(--muted); font-variant-numeric: tabular-nums; min-width: 1.5em; }
  .who { display: flex; flex-direction: column; min-width: 0; }
  .song { font-size: 1.15rem; font-weight: 600; overflow-wrap: anywhere; }
  .meta { font-size: 0.85rem; color: var(--muted); }
  .drum { display: flex; flex-direction: column; align-items: flex-end; text-align: right; }
  .drum-pitch { font-size: 1.5rem; font-weight: 700; line-height: 1.1; }
  .drum-how { font-size: 0.78rem; color: var(--muted); white-space: nowrap; }
  .compromise .drum-how { color: var(--warn); }
  .weak .drum-how { color: var(--bad); }
  @media (max-width: 480px) {
    .final li { padding: 10px 6px; gap: 2px 8px; }
    .song { font-size: 1.05rem; }
    .drum-pitch { font-size: 1.35rem; }
  }
</style>
