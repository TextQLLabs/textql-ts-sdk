<script lang="ts">
  import Check from "@lucide/svelte/icons/check";

  type Preset = { value: string; label: string };

  let {
    presets,
    isPresetSelected,
    onSelectPreset,
    isAllTime = false,
    onSelectAllTime,
    sinceValue,
    maxValue,
    onSelectSince,
  }: {
    presets: Preset[];
    isPresetSelected: (value: string) => boolean;
    onSelectPreset: (value: string) => void;
    /** No date facet value selected — the default, "All time". */
    isAllTime?: boolean;
    onSelectAllTime: () => void;
    /** `YYYY-MM-DD` when a custom since-date is active. */
    sinceValue?: string;
    /** `YYYY-MM-DD` upper bound — a since-date in the future selects nothing. */
    maxValue: string;
    onSelectSince: (date: string | undefined) => void;
  } = $props();
</script>

<button type="button" class="row" onclick={onSelectAllTime}>
  <span class="check" class:on={isAllTime}>
    {#if isAllTime}<Check size={11} strokeWidth={3} />{/if}
  </span>
  <span class="row-label">All time</span>
</button>

{#each presets as preset (preset.value)}
  {@const on = isPresetSelected(preset.value)}
  <button type="button" class="row" onclick={() => onSelectPreset(preset.value)}>
    <span class="check" class:on>
      {#if on}<Check size={11} strokeWidth={3} />{/if}
    </span>
    <span class="row-label">{preset.label}</span>
  </button>
{/each}

<!-- A *since* date, not a range — the same shape demo2's feed date filter uses.
     There is deliberately no end-date control. -->
<div class="since">
  <label class="since-label" for="filter-since">Since</label>
  <input
    id="filter-since"
    type="date"
    class="since-input"
    max={maxValue}
    value={sinceValue ?? ""}
    onchange={(event) => onSelectSince(event.currentTarget.value || undefined)}
  />
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 8px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--color-text-3);
    font: inherit;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
  }

  .row:hover {
    background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
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

  .row-label {
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .since {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    padding: 8px 8px 2px;
    border-top: 1px solid color-mix(in srgb, var(--color-line) 55%, transparent);
  }

  .since-label {
    color: var(--color-muted);
    font-size: 11px;
  }

  .since-input {
    min-width: 0;
    flex: 1;
    padding: 4px 6px;
    border: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
    border-radius: 5px;
    background: var(--color-paper);
    color: var(--color-ink);
    font: inherit;
    font-size: 11.5px;
  }
</style>
