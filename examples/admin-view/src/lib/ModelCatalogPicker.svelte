<script lang="ts">
	import { Check, LockKeyhole, Search } from '@lucide/svelte';

	import { CATALOG_MODELS, PROVIDERS, getModelIconSrc } from '$lib/modelCatalog';
	import { BrandLogo } from '$lib/primitives';

	let {
		selected = $bindable<string[]>([]),
		unavailable = [],
		disabled = false,
		dense = false,
		selectedLabel = 'Available',
		unselectedLabel = 'Not available',
		unavailableLabel = 'Blocked by organization policy'
	}: {
		selected?: string[];
		unavailable?: string[];
		disabled?: boolean;
		dense?: boolean;
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

	function toggle(enumName: string): void {
		if (disabled || unavailableSet.has(enumName)) return;
		selected = selected.includes(enumName)
			? selected.filter((model) => model !== enumName)
			: [...selected, enumName];
	}

	function toggleProvider(enumNames: string[]): void {
		const available = enumNames.filter((enumName) => !unavailableSet.has(enumName));
		const everySelected = available.every((enumName) => selected.includes(enumName));
		selected = everySelected
			? selected.filter((enumName) => !available.includes(enumName))
			: [...new Set([...selected, ...available])];
	}
</script>

<div class:dense class="catalog-picker">
	<div class="catalog-toolbar">
		<div>
			<strong>{selected.filter((model) => !unavailableSet.has(model)).length} models selected</strong>
			<span>Changes apply after you save this policy.</span>
		</div>
		<label class="catalog-search">
			<Search size={13} />
			<input bind:value={query} placeholder="Find a model" aria-label="Find a model" />
		</label>
	</div>

	<div class="provider-groups">
		{#each groups as group (group.provider.id)}
			{@const availableModels = group.models.filter((model) => !unavailableSet.has(model.enumName))}
			{@const providerSelected = availableModels.filter((model) => selected.includes(model.enumName)).length}
			<section class="provider-group">
				<div class="provider-heading">
					<div class="provider-name">
						<BrandLogo src={group.provider.iconPath} name={group.provider.name} size={15} />
						<strong>{group.provider.name}</strong>
						<span>{providerSelected}/{availableModels.length}</span>
					</div>
					{#if availableModels.length > 1 && !disabled}
						<button type="button" onclick={() => toggleProvider(group.models.map((model) => model.enumName))}>
							{providerSelected === availableModels.length ? 'Clear' : 'Select all'}
						</button>
					{/if}
				</div>
				<div class="model-grid">
					{#each group.models as model (model.enumName)}
						{@const blocked = unavailableSet.has(model.enumName)}
						{@const checked = selected.includes(model.enumName) && !blocked}
						<button
							type="button"
							class:checked
							class:blocked
							disabled={disabled || blocked}
							role="checkbox"
							aria-checked={checked}
							onclick={() => toggle(model.enumName)}
						>
							<span class="model-logo">
								<BrandLogo src={getModelIconSrc(model.id)} name={model.name} size={dense ? 16 : 18} />
							</span>
							<span class="model-copy">
								<strong>{model.name}</strong>
								<small>{blocked ? unavailableLabel : checked ? selectedLabel : unselectedLabel}</small>
							</span>
							<span class="model-check">
								{#if blocked}<LockKeyhole size={11} />{:else if checked}<Check size={12} />{/if}
							</span>
						</button>
					{/each}
				</div>
			</section>
		{/each}
		{#if groups.length === 0}<div class="no-results">No models match “{query}”.</div>{/if}
	</div>
</div>

<style>
	.catalog-picker { border-top: 1px solid var(--color-line); }
	.catalog-toolbar { display: flex; min-height: 54px; align-items: center; justify-content: space-between; gap: 16px; padding: 10px 14px; }
	.catalog-toolbar strong, .catalog-toolbar span { display: block; }
	.catalog-toolbar strong { font-size: 11px; font-weight: 600; }
	.catalog-toolbar span { margin-top: 2px; color: var(--color-muted); font-size: 9px; }
	.catalog-search { display: flex; width: 190px; align-items: center; gap: 7px; border: 1px solid var(--color-line); border-radius: 8px; background: var(--color-elevate); padding: 7px 9px; color: var(--color-muted); }
	.catalog-search input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; color: var(--color-ink); font-size: 10px; }
	.provider-groups { border-top: 1px solid var(--color-line); }
	.provider-group + .provider-group { border-top: 1px solid var(--color-line); }
	.provider-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: color-mix(in srgb, var(--color-paper) 72%, transparent); padding: 8px 14px; }
	.provider-name { display: flex; align-items: center; gap: 7px; }
	.provider-name strong { font-size: 9px; font-weight: 650; }
	.provider-name span { color: var(--color-muted); font-family: var(--font-mono); font-size: 8px; }
	.provider-heading > button { border: 0; background: transparent; padding: 2px 0; color: var(--color-access); font-size: 8px; cursor: pointer; }
	.model-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; background: var(--color-line); }
	.model-grid > button { display: grid; min-height: 64px; grid-template-columns: 32px minmax(0, 1fr) 18px; align-items: center; gap: 8px; border: 0; background: var(--color-elevate); padding: 10px 12px; color: var(--color-ink); text-align: left; cursor: pointer; }
	.model-grid > button:hover:not(:disabled) { background: color-mix(in srgb, var(--color-access-soft) 38%, var(--color-elevate)); }
	.model-grid > button.checked { background: color-mix(in srgb, var(--color-access-soft) 58%, var(--color-elevate)); }
	.model-grid > button.blocked { cursor: default; opacity: .55; }
	.model-logo { display: grid; width: 30px; height: 30px; place-items: center; border: 1px solid color-mix(in srgb, var(--color-line) 75%, transparent); border-radius: 8px; background: var(--color-elevate); }
	.model-copy { min-width: 0; }
	.model-copy strong, .model-copy small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.model-copy strong { font-size: 10px; font-weight: 620; }
	.model-copy small { margin-top: 3px; color: var(--color-muted); font-size: 8px; }
	.model-check { display: grid; width: 17px; height: 17px; place-items: center; border: 1px solid var(--color-line); border-radius: 5px; color: var(--color-muted); }
	.checked .model-check { border-color: var(--color-access); background: var(--color-access); color: white; }
	.no-results { padding: 30px 14px; color: var(--color-muted); font-size: 10px; text-align: center; }
	.dense .catalog-toolbar { min-height: 48px; padding: 8px 12px; }
	.dense .provider-heading { padding: 7px 12px; }
	.dense .model-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	.dense .model-grid > button { min-height: 54px; grid-template-columns: 28px minmax(0, 1fr) 18px; padding: 8px 10px; }
	.dense .model-logo { width: 26px; height: 26px; border-radius: 7px; }
	@media (max-width: 1050px) { .model-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 620px) { .catalog-toolbar { align-items: stretch; flex-direction: column; }.catalog-search { width: 100%; }.model-grid, .dense .model-grid { grid-template-columns: 1fr; } }
</style>
