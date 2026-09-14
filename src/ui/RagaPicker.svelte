<script lang="ts">
  import { RAGAS, RAGA_MAP } from '../data/ragas';
  import type { Raga } from '../engine';

  let { value = $bindable(), onchange }: { value: string; onchange?: () => void } = $props();

  let query = $state('');
  let open = $state(false);
  let active = $state(0);
  let input: HTMLInputElement | undefined = $state();
  let listEl: HTMLUListElement | undefined = $state();
  const listId = `raga-list-${Math.random().toString(36).slice(2, 8)}`;

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const current = $derived(RAGA_MAP.get(value));

  /** Ragas whose name or any alias contains the query; name matches rank first. */
  const matches = $derived.by(() => {
    const q = norm(query);
    if (!q) return RAGAS.map((r) => ({ raga: r, via: '' }));
    const out: { raga: Raga; via: string; rank: number }[] = [];
    for (const raga of RAGAS) {
      const n = norm(raga.name);
      if (n.includes(q)) { out.push({ raga, via: '', rank: n.startsWith(q) ? 0 : 1 }); continue; }
      const alias = (raga.aliases ?? []).find((a) => norm(a).includes(q));
      if (alias) out.push({ raga, via: alias, rank: 2 });
    }
    return out.sort((a, b) => a.rank - b.rank);
  });

  function show() {
    query = '';
    open = true;
    active = Math.max(0, matches.findIndex((m) => m.raga.id === value));
    queueMicrotask(scrollActiveIntoView);
  }
  function hide() {
    open = false;
    query = '';
  }
  function choose(id: string) {
    if (id !== value) { value = id; onchange?.(); }
    hide();
    input?.blur();
  }
  function scrollActiveIntoView() {
    listEl?.children[active]?.scrollIntoView({ block: 'nearest' });
  }
  function onkeydown(e: KeyboardEvent) {
    if (!open) { if (e.key === 'ArrowDown' || e.key === 'Enter') { show(); e.preventDefault(); } return; }
    if (e.key === 'ArrowDown') { active = Math.min(active + 1, matches.length - 1); scrollActiveIntoView(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { active = Math.max(active - 1, 0); scrollActiveIntoView(); e.preventDefault(); }
    else if (e.key === 'Enter') { const m = matches[active]; if (m) choose(m.raga.id); e.preventDefault(); }
    else if (e.key === 'Escape') { hide(); input?.blur(); e.preventDefault(); }
  }
  function oninput() {
    open = true;
    active = 0;
  }
</script>

<div class="picker">
  <input
    bind:this={input}
    type="search"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    enterkeyhint="done"
    role="combobox"
    aria-expanded={open}
    aria-controls={listId}
    aria-autocomplete="list"
    aria-label="Raga"
    placeholder={current?.name ?? 'Search ragas…'}
    value={open ? query : (current?.name ?? '')}
    onfocus={show}
    onblur={hide}
    oninput={(e) => { query = (e.currentTarget as HTMLInputElement).value; oninput(); }}
    {onkeydown}
  />
  {#if open}
    <!-- Keyboard handling lives on the input (combobox pattern); options are pointer targets. -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <ul class="menu" id={listId} bind:this={listEl} role="listbox" onmousedown={(e) => e.preventDefault()}>
      {#each matches as m, i (m.raga.id)}
        <li
          role="option"
          aria-selected={m.raga.id === value}
          class:active={i === active}
          class:selected={m.raga.id === value}
          onmouseenter={() => (active = i)}
          onclick={() => choose(m.raga.id)}
        >
          <span class="name">{m.raga.name}</span>
          {#if m.via}<span class="via">{m.via}</span>
          {:else if m.raga.aliases?.length}<span class="via">{m.raga.aliases.slice(0, 2).join(', ')}</span>{/if}
        </li>
      {:else}
        <li class="empty">No raga matches “{query}”</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .picker { position: relative; }
  input {
    width: 100%; color: var(--fg); padding-right: 34px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.2' stroke-linecap='round'%3E%3Ccircle cx='10.5' cy='10.5' r='6.5'/%3E%3Cpath d='M20 20l-4.5-4.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center; background-size: 18px;
  }
  input::-webkit-search-cancel-button { display: none; }
  input::placeholder { color: var(--fg); opacity: 1; }
  input:focus::placeholder { color: var(--muted); opacity: 0.7; }
  .menu {
    position: absolute; z-index: 20; left: 0; right: 0; top: calc(100% + 4px);
    max-height: min(50vh, 320px); overflow-y: auto; overscroll-behavior: contain;
    margin: 0; padding: 4px; list-style: none;
    background: var(--card); border: 1px solid var(--line); border-radius: 10px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
  }
  li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 8px; padding: 9px 10px; border-radius: 6px; cursor: pointer; }
  li.active { background: var(--accent-soft); }
  li.selected .name { font-weight: 600; }
  .name { color: var(--fg); }
  .via { font-size: 0.8rem; color: var(--muted); }
  .empty { color: var(--muted); cursor: default; }
</style>
