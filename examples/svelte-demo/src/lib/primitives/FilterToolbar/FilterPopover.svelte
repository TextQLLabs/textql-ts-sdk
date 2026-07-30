<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import Check from "@lucide/svelte/icons/check";
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import ListFilter from "@lucide/svelte/icons/list-filter";
  import Search from "@lucide/svelte/icons/search";
  import { SINCE_PREFIX, distinctValues, type ColumnFilter } from "$lib/tableFilter";
  import { sortDirectionLabel, toggleSortEntry, type SortEntry } from "$lib/tableSort";

  import DateRangeFilter from "./DateRangeFilter.svelte";
  import { toOption, type FilterField, type FilterOption } from "./types";

  let {
    fields,
    items,
    filters = $bindable([]),
    sortEntries = $bindable([]),
    datePresets = [],
  }: {
    fields: FilterField[];
    /**
     * Rows the facet options are derived from when a field declares none.
     * Server-filtered surfaces pass `[]` and declare `filterOptions` instead —
     * options taken from one loaded page would be wrong.
     */
    items: unknown[];
    filters?: ColumnFilter[];
    sortEntries?: SortEntry[];
    datePresets?: { value: string; label: string }[];
  } = $props();

  const PANEL_W = 264;
  const MARGIN = 8;
  // Hard cap independent of viewport height — a facet with 60+ options would
  // otherwise run the panel floor to ceiling.
  const PANEL_MAX_H = 340;

  let open = $state(false);
  let activeFieldId = $state<string | null>(null);
  let query = $state("");
  let triggerEl = $state<HTMLButtonElement>();
  let pos = $state({ top: 0, right: 0, maxHeight: 320 });

  const today = new Date().toISOString().slice(0, 10);

  function optionsFor(field: FilterField): FilterOption[] {
    if (field.filterOptions) return field.filterOptions.map(toOption);
    return distinctValues(items, field).map((value) => ({ value, label: value }));
  }

  // A facet with nothing to pick is a dead end, so it doesn't get a row. Date
  // facets carry their own presets and disabled ones are deliberately visible,
  // so neither needs options to earn its place.
  const facetFields = $derived(
    fields.filter((field) => {
      if (!field.filterable) return false;
      if (field.filterDisabled || field.filterKind === "date") return true;
      return optionsFor(field).length > 0;
    }),
  );
  const sortFields = $derived(fields.filter((field) => field.sortable));
  const activeField = $derived(facetFields.find((field) => field.id === activeFieldId));

  const activeCount = $derived(
    filters.reduce((total, filter) => total + filter.values.length, 0),
  );

  const allOptions = $derived(activeField ? optionsFor(activeField) : []);

  const visibleOptions = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((option) => option.label.toLowerCase().includes(q));
  });

  function valuesFor(fieldId: string): string[] {
    return filters.find((filter) => filter.columnId === fieldId)?.values ?? [];
  }

  function setValues(fieldId: string, values: string[]) {
    const rest = filters.filter((filter) => filter.columnId !== fieldId);
    filters = values.length ? [...rest, { columnId: fieldId, values }] : rest;
  }

  function toggleValue(fieldId: string, value: string) {
    const current = valuesFor(fieldId);
    setValues(
      fieldId,
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    );
  }

  function countFor(fieldId: string): number {
    return valuesFor(fieldId).length;
  }

  function summaryFor(field: FilterField): string {
    const values = valuesFor(field.id);
    if (values.length === 0) return field.filterAllLabel ?? "All";
    if (values.length === 1) {
      const match = optionsFor(field).find((option) => option.value === values[0]);
      // A date facet's custom value has no option row to borrow a label from.
      if (!match && values[0].startsWith(SINCE_PREFIX)) {
        return `Since ${values[0].slice(SINCE_PREFIX.length)}`;
      }
      return match?.label ?? values[0];
    }
    return `${values.length} selected`;
  }

  function monogram(label: string) {
    return label.trim().charAt(0).toUpperCase() || "?";
  }

  function place() {
    const rect = triggerEl?.getBoundingClientRect();
    if (!rect) return;
    const gap = 4;
    pos = {
      top: rect.bottom + gap,
      // Anchored by the RIGHT edge so a facet that needs a taller or wider box
      // mid-drilldown doesn't shift the panel out from under the cursor.
      right: Math.max(MARGIN, window.innerWidth - rect.right),
      maxHeight: Math.max(
        180,
        Math.min(PANEL_MAX_H, window.innerHeight - rect.bottom - gap - MARGIN),
      ),
    };
  }

  function openPanel() {
    activeFieldId = null;
    query = "";
    place();
    open = true;
  }

  function closePanel() {
    open = false;
    activeFieldId = null;
    query = "";
  }

  function toggleOpen() {
    if (open) closePanel();
    else openPanel();
  }

  function drillInto(fieldId: string) {
    activeFieldId = fieldId;
    query = "";
    place();
  }

  function onSort(field: FilterField) {
    sortEntries = toggleSortEntry(sortEntries, field.id, field);
  }

  function onWindowKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape" || !open) return;
    if (activeFieldId) activeFieldId = null;
    else closePanel();
  }

  function onWindowPointerDown(event: PointerEvent) {
    if (!open) return;
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("[data-filter-popover]")) {
      closePanel();
    }
  }

  // The panel is `position: fixed` against the rect measured on open, so
  // anything that moves the trigger afterwards strands it. Capture phase so a
  // scrolling ancestor counts too — which also means this fires for scrolls
  // inside the panel's own option list, so coalesce to one measure per frame.
  $effect(() => {
    if (!open) return;
    let frame = 0;
    const remeasure = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        place();
      });
    };
    window.addEventListener("scroll", remeasure, true);
    window.addEventListener("resize", remeasure);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", remeasure, true);
      window.removeEventListener("resize", remeasure);
    };
  });
</script>

<svelte:window onkeydown={onWindowKeydown} onpointerdown={onWindowPointerDown} />

<div class="wrap" data-filter-popover>
  <button
    bind:this={triggerEl}
    type="button"
    class="trigger"
    class:active={activeCount > 0}
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={toggleOpen}
  >
    <ListFilter size={14} strokeWidth={2} />
    <span>Filter</span>
    {#if activeCount > 0}
      <span class="badge">{activeCount}</span>
    {/if}
  </button>

  {#if open}
    <div
      class="panel"
      role="menu"
      tabindex="-1"
      style="top: {pos.top}px; right: {pos.right}px; width: {PANEL_W}px; max-height: {pos.maxHeight}px"
    >
      {#if !activeField}
        <div class="scroll">
          {#each facetFields as field (field.id)}
            <button
              type="button"
              class="row"
              disabled={field.filterDisabled}
              onclick={() => drillInto(field.id)}
            >
              <span class="row-label">{field.header}</span>
              <span class="row-value">{summaryFor(field)}</span>
              <ChevronRight size={13} strokeWidth={2} />
            </button>
          {/each}

          {#if sortFields.length}
            <div class="section">Sort</div>
            {#each sortFields as field (field.id)}
              {@const entry = sortEntries.find((s) => s.columnId === field.id)}
              <button type="button" class="row" onclick={() => onSort(field)}>
                <span class="row-label">{field.header}</span>
                {#if entry}
                  <span class="row-value">{sortDirectionLabel(field, entry.dir)}</span>
                  <Check size={13} strokeWidth={2.5} />
                {/if}
              </button>
            {/each}
          {/if}
        </div>

        {#if activeCount > 0}
          <div class="footer">
            <button type="button" class="clear" onclick={() => (filters = [])}>
              Clear all
            </button>
          </div>
        {/if}
      {:else}
        <div class="head">
          <button
            type="button"
            class="back"
            aria-label="Back to filters"
            onclick={() => (activeFieldId = null)}
          >
            <ArrowLeft size={13} strokeWidth={2} />
          </button>
          <span class="head-title">{activeField.header}</span>
          {#if countFor(activeField.id) > 0}
            <button type="button" class="clear" onclick={() => setValues(activeField.id, [])}>
              Clear
            </button>
          {/if}
        </div>

        {#if activeField.filterNote}
          <p class="note">{activeField.filterNote}</p>
        {/if}

        {#if activeField.filterKind === "date"}
          {@const value = valuesFor(activeField.id)[0]}
          <DateRangeFilter
            presets={datePresets}
            isAllTime={value === undefined}
            isPresetSelected={(preset) => value === preset}
            onSelectAllTime={() => setValues(activeField.id, [])}
            onSelectPreset={(preset) =>
              setValues(activeField.id, value === preset ? [] : [preset])}
            sinceValue={value?.startsWith(SINCE_PREFIX)
              ? value.slice(SINCE_PREFIX.length)
              : undefined}
            maxValue={today}
            onSelectSince={(date) =>
              setValues(activeField.id, date ? [`${SINCE_PREFIX}${date}`] : [])}
          />
        {:else}
          {#if allOptions.length > 8}
            <div class="search">
              <Search size={13} strokeWidth={2} />
              <input
                class="search-input"
                type="search"
                placeholder="Search {activeField.header.toLowerCase()}…"
                bind:value={query}
              />
            </div>
          {/if}

          <div class="options">
            {#each visibleOptions as option (option.value)}
              {@const on = valuesFor(activeField.id).includes(option.value)}
              <button
                type="button"
                class="row"
                onclick={() => toggleValue(activeField.id, option.value)}
              >
                <span class="check" class:on>
                  {#if on}<Check size={11} strokeWidth={3} />{/if}
                </span>
                {#if activeField.filterKind === "people"}
                  {#if option.imageUrl}
                    <img class="avatar" src={option.imageUrl} alt="" loading="lazy" />
                  {:else}
                    <span class="avatar mono">{monogram(option.label)}</span>
                  {/if}
                {:else if option.icon}
                  <option.icon size={13} strokeWidth={2} />
                {/if}
                <span class="row-label">{option.label}</span>
              </button>
            {:else}
              <p class="note">No matches.</p>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .wrap {
    position: relative;
    flex-shrink: 0;
  }

  .trigger,
  .row,
  .back,
  .clear {
    border: 0;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }

  .trigger {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 30px;
    padding: 0 9px;
    border-radius: var(--radius-sm);
    color: var(--color-text-2);
    background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-line) 75%, transparent);
    font-size: 12px;
    font-weight: 500;
    transition: background 120ms ease;
  }

  .trigger:hover,
  .trigger.active {
    background: color-mix(in srgb, var(--color-elevate) 92%, transparent);
  }

  .badge {
    min-width: 16px;
    padding: 0 4px;
    border-radius: 999px;
    color: var(--color-paper);
    background: var(--color-accent);
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 10px;
    line-height: 16px;
    text-align: center;
  }

  .panel {
    position: fixed;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    /* The panel clips; the option list inside it scrolls, so the drilldown
       header, search box and "Clear all" footer stay pinned. */
    overflow: hidden;
    padding: 4px;
    border: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
    border-radius: var(--radius-sm);
    background: color-mix(in srgb, var(--color-paper) 96%, var(--color-elevate));
    box-shadow: 0 8px 24px rgba(15, 15, 20, 0.1);
  }

  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border-radius: 5px;
    color: var(--color-text-3);
    font-size: 12px;
    text-align: left;
  }

  .row:hover:not(:disabled) {
    background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
  }

  .row:disabled {
    cursor: default;
    opacity: 0.5;
  }

  .row-label {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row-value {
    flex-shrink: 0;
    max-width: 110px;
    overflow: hidden;
    color: var(--color-muted);
    font-size: 11.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .section {
    padding: 8px 8px 4px;
    margin-top: 2px;
    border-top: 1px solid color-mix(in srgb, var(--color-line) 55%, transparent);
    color: var(--color-muted);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 4px 6px;
  }

  .back {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 5px;
    color: var(--color-muted);
  }

  .back:hover {
    color: var(--color-ink);
    background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
  }

  .head-title {
    flex: 1;
    color: var(--color-ink);
    font-size: 12px;
    font-weight: 600;
  }

  .clear {
    padding: 2px 6px;
    border-radius: 5px;
    color: var(--color-accent);
    font-size: 11.5px;
  }

  .clear:hover {
    background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    margin-top: 2px;
    padding-top: 4px;
    border-top: 1px solid color-mix(in srgb, var(--color-line) 55%, transparent);
  }

  .search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px 6px;
    color: var(--color-muted);
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

  .scroll,
  .options {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .check {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    border: 1px solid color-mix(in srgb, var(--color-line) 90%, transparent);
    border-radius: 4px;
    color: var(--color-paper);
  }

  .check.on {
    border-color: var(--color-accent);
    background: var(--color-accent);
  }

  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    object-fit: cover;
    color: var(--color-text-2);
    background: color-mix(in srgb, var(--color-line) 40%, transparent);
    font-size: 9px;
    font-weight: 600;
  }

  .note {
    margin: 0;
    padding: 4px 8px 8px;
    color: var(--color-muted);
    font-size: 11.5px;
    line-height: 1.4;
  }
</style>
