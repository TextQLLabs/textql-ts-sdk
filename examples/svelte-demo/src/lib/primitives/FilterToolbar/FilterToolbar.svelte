<script lang="ts">
  import Search from "@lucide/svelte/icons/search";
  import X from "@lucide/svelte/icons/x";
  import UnicodeSpinner from "$lib/components/UnicodeSpinner.svelte";
  import { SINCE_PREFIX, type ColumnFilter } from "$lib/tableFilter";
  import type { SortEntry } from "$lib/tableSort";

  import FilterPopover from "./FilterPopover.svelte";
  import { loadToolbarState, saveToolbarState } from "./persist";
  import { toOption, type FilterField, type FilterTab } from "./types";

  let {
    fields,
    items = [],
    search = $bindable(""),
    filters = $bindable([]),
    sortEntries = $bindable([]),
    tabs,
    activeTab = $bindable(""),
    persistKey,
    placeholder = "Search…",
    searching = false,
    showSearch = true,
    datePresets = [],
  }: {
    fields: FilterField[];
    /**
     * Rows facet options are derived from when a field declares none. Leave
     * empty on server-filtered surfaces and declare `filterOptions` instead.
     */
    items?: unknown[];
    search?: string;
    filters?: ColumnFilter[];
    sortEntries?: SortEntry[];
    tabs?: FilterTab[];
    activeTab?: string;
    /**
     * localStorage key for filters/sort/tab. Skip it on surfaces whose store
     * already persists its own sort — two sources of truth drift.
     */
    persistKey?: string;
    placeholder?: string;
    /** Server-side search in flight — shows a spinner inside the input. */
    searching?: boolean;
    /** Drop the text search — for surfaces with nothing to search over. */
    showSearch?: boolean;
    datePresets?: { value: string; label: string }[];
  } = $props();

  let restored = $state(false);

  $effect.pre(() => {
    if (restored || !persistKey) return;
    restored = true;
    const saved = loadToolbarState(persistKey);
    if (saved.tab && (!tabs || tabs.some((tab) => tab.id === saved.tab))) activeTab = saved.tab;
    if (saved.filters) filters = saved.filters;
    if (saved.sort) sortEntries = saved.sort;
  });

  $effect(() => {
    if (!persistKey || !restored) return;
    saveToolbarState(persistKey, { tab: activeTab, filters, sort: sortEntries });
  });

  const fieldsById = $derived(new Map(fields.map((field) => [field.id, field])));

  /** One chip per selected value, flattened across facets. */
  const chips = $derived.by(() => {
    const result: { fieldId: string; value: string; label: string }[] = [];
    for (const filter of filters) {
      const field = fieldsById.get(filter.columnId);
      if (!field) continue;
      const options = (field.filterOptions ?? []).map(toOption);
      for (const value of filter.values) {
        const match = options.find((option) => option.value === value);
        const label = match
          ? match.label
          : value.startsWith(SINCE_PREFIX)
            ? `Since ${value.slice(SINCE_PREFIX.length)}`
            : value;
        result.push({ fieldId: filter.columnId, value, label: `${field.header}: ${label}` });
      }
    }
    return result;
  });

  function removeChip(fieldId: string, value: string) {
    filters = filters
      .map((filter) =>
        filter.columnId === fieldId
          ? { ...filter, values: filter.values.filter((v) => v !== value) }
          : filter,
      )
      .filter((filter) => filter.values.length > 0);
  }
</script>

<div class="toolbar">
  <div class="bar">
    {#if tabs?.length}
      <div class="tabs">
        {#each tabs as tab (tab.id)}
          <button
            type="button"
            class="tab"
            class:on={activeTab === tab.id}
            aria-pressed={activeTab === tab.id}
            onclick={() => (activeTab = tab.id)}
          >
            {tab.label}
            {#if tab.count !== undefined}<span class="tab-count">{tab.count}</span>{/if}
          </button>
        {/each}
      </div>
    {/if}

    {#if showSearch}
      <div class="search">
        <Search size={14} strokeWidth={2} />
        <input
          class="search-input"
          type="search"
          {placeholder}
          aria-label={placeholder}
          bind:value={search}
        />
        {#if searching}
          <UnicodeSpinner class="search-spinner" label="Searching" />
        {/if}
      </div>
    {:else}
      <div class="spacer"></div>
    {/if}

    <FilterPopover {fields} {items} {datePresets} bind:filters bind:sortEntries />
  </div>

  {#if chips.length}
    <div class="chips">
      {#each chips as chip (`${chip.fieldId}:${chip.value}`)}
        <button
          type="button"
          class="chip"
          title="Remove {chip.label}"
          onclick={() => removeChip(chip.fieldId, chip.value)}
        >
          <span class="chip-label">{chip.label}</span>
          <X size={11} strokeWidth={2.5} />
        </button>
      {/each}
      <button type="button" class="chip-clear" onclick={() => (filters = [])}>Clear all</button>
    </div>
  {/if}
</div>

<style>
  .toolbar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    /* The page body has no row gap, so the toolbar owns its separation from
       whatever list sits under it. */
    margin-bottom: 8px;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tabs {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
  }

  .tab,
  .chip,
  .chip-clear {
    border: 0;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }

  .tab {
    flex-shrink: 0;
    padding: 4px 8px;
    border-radius: 5px;
    color: var(--color-muted);
    font-size: 12px;
    transition: color 120ms ease;
  }

  .tab:hover,
  .tab.on {
    color: var(--color-ink);
  }

  .tab.on {
    font-weight: 500;
  }

  .tab-count {
    margin-left: 5px;
    color: var(--color-muted);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 10.5px;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
    height: 30px;
    padding: 0 9px;
    border-radius: var(--radius-sm);
    color: var(--color-muted);
    background: color-mix(in srgb, var(--color-elevate) 55%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-line) 70%, transparent);
  }

  .search-input {
    min-width: 0;
    flex: 1;
    border: 0;
    background: transparent;
    color: var(--color-ink);
    font: inherit;
    font-size: 12px;
    outline: none;
  }

  .search-input::-webkit-search-cancel-button {
    appearance: none;
  }

  .search :global(.search-spinner) {
    flex-shrink: 0;
    opacity: 0.85;
  }

  .spacer {
    flex: 1;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    max-width: 240px;
    padding: 3px 6px 3px 8px;
    border-radius: 999px;
    color: var(--color-text-2);
    background: color-mix(in srgb, var(--color-elevate) 80%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-line) 70%, transparent);
    font-size: 11px;
  }

  .chip:hover {
    color: var(--color-ink);
  }

  .chip-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chip-clear {
    padding: 3px 6px;
    border-radius: 5px;
    color: var(--color-accent);
    font-size: 11px;
  }

  .chip-clear:hover {
    background: color-mix(in srgb, var(--color-elevate) 60%, transparent);
  }
</style>
