<script lang="ts">
	import { Check, LockKeyhole } from '@lucide/svelte';

	import { CATALOG_MODELS, PROVIDERS, getModelIconSrc } from '$lib/modelCatalog';
	import { BrandLogo, EmptyState, SearchField } from '$lib/primitives';

	let {
		selected = $bindable<string[]>([]),
		unavailable = [],
		disabled = false,
		dense = false,
		minSelected = 0,
		selectedLabel = 'Available',
		unselectedLabel = 'Not available',
		unavailableLabel = 'Blocked by organization policy'
	}: {
		selected?: string[];
		unavailable?: string[];
		disabled?: boolean;
		dense?: boolean;
		/** Floor the selection cannot go below. The API rejects an empty catalog. */
		minSelected?: number;
		selectedLabel?: string;
		unselectedLabel?: string;
		unavailableLabel?: string;
	} = $props();

	let query = $state('');
	const unavailableSet = $derived(new Set(unavailable));
	const normalizedQuery = $derived(query.trim().toLowerCase());
	const groups = $derived(
		PROVIDERS.map((provider) => ({
			provider,
			models: CATALOG_MODELS.filter(
				(model) =>
					model.providerId === provider.id &&
					(!normalizedQuery || model.name.toLowerCase().includes(normalizedQuery))
			)
		})).filter((group) => group.models.length > 0)
	);
	const selectedCount = $derived(selected.filter((model) => !unavailableSet.has(model)).length);
	const atFloor = $derived(minSelected > 0 && selectedCount <= minSelected);

	function toggle(enumName: string): void {
		if (disabled || unavailableSet.has(enumName)) return;
		if (atFloor && selected.includes(enumName)) return;
		selected = selected.includes(enumName)
			? selected.filter((model) => model !== enumName)
			: [...selected, enumName];
	}

	function toggleProvider(available: string[]): void {
		if (!available.every((enumName) => selected.includes(enumName))) {
			selected = [...new Set([...selected, ...available])];
			return;
		}
		if (minSelected > 0 && selectedCount - available.length < minSelected) return;
		selected = selected.filter((enumName) => !available.includes(enumName));
	}
</script>

<div class:dense class="catalog-picker">
	<div class="catalog-toolbar">
		<strong>{selectedCount} {selectedCount === 1 ? 'model' : 'models'} selected</strong>
		<span>{atFloor ? `Keep at least ${minSelected} selected.` : 'Applies on save.'}</span>
		<SearchField bind:value={query} placeholder="Find a model" class="catalog-search" />
	</div>

	{#each groups as group (group.provider.id)}
		{@const availableModels = group.models.filter((model) => !unavailableSet.has(model.enumName))}
		{@const providerSelected = availableModels.filter((model) => selected.includes(model.enumName)).length}
		{@const wouldClear = providerSelected === availableModels.length}
		{@const blockedClear = wouldClear && minSelected > 0 && selectedCount - providerSelected < minSelected}
		<section class="provider-group">
			<div class="provider-heading">
				<BrandLogo src={group.provider.iconPath} name={group.provider.name} size={13} />
				<strong>{group.provider.name}</strong>
				<span class="provider-count">{providerSelected}/{availableModels.length}</span>
				{#if availableModels.length > 1 && !disabled && !blockedClear}
					<button type="button" onclick={() => toggleProvider(availableModels.map((model) => model.enumName))}>
						{wouldClear ? 'Clear' : 'Select all'}
					</button>
				{/if}
			</div>

			<div class="model-chips">
				{#each group.models as model (model.enumName)}
					{@const blocked = unavailableSet.has(model.enumName)}
					{@const checked = selected.includes(model.enumName) && !blocked}
					{@const pinned = checked && atFloor}
					<button
						type="button"
						class:checked
						class:blocked
						class:pinned
						disabled={disabled || blocked || pinned}
						role="checkbox"
						aria-checked={checked}
						title={blocked
							? unavailableLabel
							: pinned
								? `At least ${minSelected} ${minSelected === 1 ? 'model' : 'models'} must stay selected.`
								: checked
									? selectedLabel
									: unselectedLabel}
						onclick={() => toggle(model.enumName)}
					>
						<BrandLogo src={getModelIconSrc(model.id)} name={model.name} size={dense ? 13 : 14} />
						<span>{model.name}</span>
						{#if blocked}
							<LockKeyhole size={11} />
						{:else if checked}
							<Check size={12} strokeWidth={2.6} />
						{/if}
					</button>
				{/each}
			</div>
		</section>
	{/each}

	{#if groups.length === 0}
		<EmptyState title="No models match" description="Nothing in the catalog matches “{query}”." />
	{/if}
</div>

<style>
	.catalog-picker { border-top: 1px solid var(--color-line); }
	.catalog-toolbar { display: flex; align-items: baseline; gap: 8px; padding: 9px 14px; }
	.catalog-toolbar strong { font-size: 11px; font-weight: 600; }
	.catalog-toolbar > span { flex: 1; color: var(--color-muted); font-size: 9px; }
	.catalog-toolbar :global(.catalog-search) { width: 170px; flex: 0 0 auto; }
	.provider-group { border-top: 1px solid var(--color-line); }
	.provider-heading { display: flex; align-items: center; gap: 6px; background: color-mix(in srgb, var(--color-paper) 72%, transparent); padding: 6px 14px; }
	.provider-heading strong { font-size: 9px; font-weight: 650; }
	.provider-count { color: var(--color-muted); font-family: var(--font-mono); font-size: 8px; }
	.provider-heading > button { margin-left: auto; border: 0; background: transparent; padding: 2px 0; color: var(--color-access); font-size: 8px; cursor: pointer; }
	.provider-heading > button:hover { text-decoration: underline; }
	.model-chips { display: flex; flex-wrap: wrap; gap: 5px; padding: 9px 14px; }
	.model-chips > button { display: flex; align-items: center; gap: 6px; border: 1px solid var(--color-line); border-radius: 7px; background: var(--color-elevate); padding: 4px 8px 4px 6px; color: var(--color-muted); font-size: 10.5px; font-weight: 550; cursor: pointer; }
	.model-chips > button:hover:not(:disabled) { border-color: color-mix(in srgb, var(--color-access) 45%, var(--color-line)); color: var(--color-ink); }
	.model-chips > button.checked { border-color: color-mix(in srgb, var(--color-access) 55%, transparent); background: var(--color-access-soft); color: var(--color-access); }
	/* Dashed, not faded: blocked is policy, not a rejected click. */
	.model-chips > button.blocked { border-style: dashed; color: var(--color-subtle); cursor: default; }
	.model-chips > button:disabled:not(.blocked) { cursor: not-allowed; opacity: .55; }
	/* Pinned stays opaque so a required pick does not look unavailable. */
	.model-chips > button.pinned:disabled { cursor: not-allowed; opacity: 1; }
	.model-chips :global(img), .model-chips :global(svg) { flex: 0 0 auto; }
	.dense .catalog-toolbar { padding: 8px 12px; }
	.dense .provider-heading { padding: 5px 12px; }
	.dense .model-chips { gap: 4px; padding: 8px 12px; }
	.dense .model-chips > button { padding: 3px 7px 3px 5px; font-size: 10px; }
	@media (max-width: 620px) { .catalog-toolbar { flex-wrap: wrap; } .catalog-toolbar :global(.catalog-search) { width: 100%; } }
</style>
