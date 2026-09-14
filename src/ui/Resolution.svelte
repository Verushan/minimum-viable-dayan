<script lang="ts">
  import { RAGA_MAP } from '../data/ragas';
  import { SWARA_LABEL, pitchName, type KeyShift, type KitResult, type PitchClass, type Suggestion } from '../engine';

  let { kit, suggestion, keyShifts, threshold, nameStyle, isMinimum, ownedMode, onapplyshift }: {
    kit: KitResult;
    suggestion: Suggestion | undefined;
    keyShifts: KeyShift[];
    onapplyshift: (k: KeyShift) => void;
    threshold: number;
    nameStyle: 'sharp' | 'flat';
    isMinimum: boolean;
    ownedMode: boolean;
  } = $props();

  const pn = (p: PitchClass) => pitchName(p, nameStyle);
  const fmt = (n: number) => n.toFixed(2);
  const dir = (n: number) => (n > 0 ? `up ${n === 1 ? 'a semitone' : `${n} semitones`}` : `down ${n === -1 ? 'a semitone' : `${-n} semitones`}`);
</script>

<section class="resolution" id="resolution">
  <h2>Final setlist</h2>
  <div class="kit-banner" class:incomplete={!kit.complete}>
    <div class="kit-label">{ownedMode ? 'Bring these dayans' : 'Dayans to carry'}</div>
    <div class="kit-pitches">
      {#each kit.tuned as t}
        <span class="kit-pitch">
          {pn(t.tunedTo)}
          {#if t.tunedTo !== t.dayan.pitch}<small>{pn(t.dayan.pitch)} drum, set to {pn(t.tunedTo)}</small>{/if}
        </span>
      {/each}
    </div>
    <div class="kit-note">
      {#if kit.complete}
        {kit.k} drum{kit.k > 1 ? 's' : ''} cover{kit.k > 1 ? '' : 's'} all {kit.assignments.length} songs{isMinimum ? ' — the fewest possible' : ''}
      {:else}
        {kit.covered} of {kit.assignments.length} songs covered at ≥ {fmt(threshold)}; the rest are compromises
      {/if}
    </div>
  </div>

  {#if !kit.complete && suggestion}
    <div class="suggest">
      <strong>Adding a {pn(suggestion.dayan.pitch)} dayan</strong>
      would {suggestion.kit.complete ? 'cover every song' : `cover ${suggestion.kit.covered} of ${kit.assignments.length}`}
      ({suggestion.kit.covered - kit.covered > 0 ? `+${suggestion.kit.covered - kit.covered} song${suggestion.kit.covered - kit.covered > 1 ? 's' : ''}, ` : ''}score {fmt(kit.totalScore)} → {fmt(suggestion.kit.totalScore)}).
    </div>
  {/if}

  {#if keyShifts.length}
    <div class="shifts">
      <div class="shifts-title">If the singer can adjust</div>
      <ul>
        {#each keyShifts as k (k.songIndex)}
          {@const song = kit.assignments[k.songIndex]!.song}
          <li>
            <span class="shift-text">
              <strong>{song.name || 'Untitled'}</strong> in <strong>{pn(k.to)}</strong> instead of {pn(k.from)} ({dir(k.shift)})
              → {k.effect === 'covers'
                ? `fits the ${pn(k.kit.assignments[k.songIndex]!.tuned.tunedTo)} drum on ${k.kit.assignments[k.songIndex]!.option.reason === 'Sa' ? 'Sa' : SWARA_LABEL[k.kit.assignments[k.songIndex]!.option.swara]}`
                : `only ${k.kit.k} drum${k.kit.k > 1 ? 's' : ''} needed (${k.kit.tuned.map((t) => pn(t.tunedTo)).join(', ')})`}
            </span>
            <button class="no-print" onclick={() => onapplyshift(k)}>Use {pn(k.to)}</button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}

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
          <span class="drum-pitch">{pn(a.tuned.tunedTo)}</span>
          <span class="drum-how">
            {#if a.option.score === 0}no fit{:else if a.option.reason === 'Sa' || a.option.reason === 'Pa' || a.option.reason === 'Ma'}on {a.option.reason}{:else}{SWARA_LABEL[a.option.swara]} ({a.option.reason.toLowerCase()}){/if}
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
  .kit-pitch { display: flex; flex-direction: column; align-items: center; }
  .kit-pitch small { font-size: 0.7rem; font-weight: 500; color: var(--muted); white-space: nowrap; }
  .kit-note { flex: 1; min-width: 12em; }
  .suggest {
    padding: 10px 14px; border-radius: 10px; margin: -4px 0 14px;
    background: var(--accent-soft); color: var(--accent);
  }

  .shifts {
    padding: 10px 14px; border-radius: 10px; margin: 0 0 14px;
    background: var(--card); border: 1px dashed var(--line);
  }
  .shifts-title { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin-bottom: 6px; }
  .shifts ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .shifts li { display: flex; align-items: center; gap: 10px; }
  .shift-text { flex: 1; min-width: 0; font-size: 0.95rem; }
  .shifts button { white-space: nowrap; }

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
