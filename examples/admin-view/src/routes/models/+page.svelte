<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, Layers3, ShieldCheck, Sparkles } from '@lucide/svelte';

	import ConnectionEmpty from '$lib/ConnectionEmpty.svelte';
	import ModelCatalogPicker from '$lib/ModelCatalogPicker.svelte';
	import {
		CATALOG_MODELS,
		getModelEnumName,
		getModelIconSrcByEnum,
		getModelNameByEnum
	} from '$lib/modelCatalog';
	import { MutationTracker } from '$lib/mutate.svelte';
	import { BrandLogo, Button, Page, Select } from '$lib/primitives';

	let { data } = $props();
	const saving = new MutationTracker();
	const admin = $derived(data.admin);
	const organization = $derived(admin.organization ?? {});

	function numberList(value: unknown): number[] {
		return Array.isArray(value) ? value.filter((item): item is number => typeof item === 'number') : [];
	}

	const enabledIds = $derived(numberList(organization.enabledModelIds));
	const restrictedIds = $derived(numberList(organization.restrictedModelIds));
	const deploymentIds = $derived(numberList(organization.deploymentEnabledModelIds));
	const unavailableModels = $derived(
		CATALOG_MODELS.filter(
			(model) =>
				restrictedIds.includes(model.id) ||
				(deploymentIds.length > 0 && !deploymentIds.includes(model.id))
		).map((model) => model.enumName)
	);
	const eligibleModels = $derived(
		CATALOG_MODELS.filter((model) => !unavailableModels.includes(model.enumName)).map((model) => model.enumName)
	);

	let initialized = $state(false);
	let scope = $state<'all' | 'selected'>('all');
	let draftModels = $state<string[]>([]);
	let draftDefault = $state<string | number>('MODEL_UNKNOWN');

	$effect(() => {
		if (initialized || admin.mode !== 'live') return;
		scope = enabledIds.length === 0 ? 'all' : 'selected';
		draftModels = enabledIds.length === 0
			? [...eligibleModels]
			: enabledIds.map(getModelEnumName).filter((model): model is string => Boolean(model));
		const defaultId = typeof organization.defaultLlmModel === 'number' ? organization.defaultLlmModel : 0;
		draftDefault = getModelEnumName(defaultId) ?? 'MODEL_UNKNOWN';
		initialized = true;
	});

	const effectiveDraftModels = $derived(
		(scope === 'all' ? eligibleModels : draftModels).filter((model) => !unavailableModels.includes(model))
	);
	const defaultOptions = $derived([
		{
			value: 'MODEL_UNKNOWN',
			label: 'Use the system default',
			hint: 'No organization override'
		},
		...CATALOG_MODELS.filter((model) => effectiveDraftModels.includes(model.enumName)).map((model) => ({
			value: model.enumName,
			label: model.name,
			iconSrc: getModelIconSrcByEnum(model.enumName)
		}))
	]);
	const originalModels = $derived(
		enabledIds.map(getModelEnumName).filter((model): model is string => Boolean(model)).sort()
	);
	const currentModels = $derived(
		(scope === 'all' ? [] : effectiveDraftModels).slice().sort()
	);
	const originalDefault = $derived(
		getModelEnumName(typeof organization.defaultLlmModel === 'number' ? organization.defaultLlmModel : 0) ?? 'MODEL_UNKNOWN'
	);
	const hasChanges = $derived(
		(scope === 'all') !== (enabledIds.length === 0) ||
		currentModels.join(',') !== originalModels.join(',') ||
		String(draftDefault) !== originalDefault
	);
	const saveDisabled = $derived(
		!hasChanges || (scope === 'selected' && effectiveDraftModels.length === 0)
	);

	function setScope(next: 'all' | 'selected'): void {
		scope = next;
		if (next === 'selected' && draftModels.length === 0) draftModels = [...eligibleModels];
	}
</script>

<Page title="Models" lead="Set the organization model catalog first; roles can narrow it further." wide>
	{#if admin.mode !== 'live'}
		<ConnectionEmpty mode={admin.mode} error={admin.error} />
	{:else}
		<form
			class="panel policy-panel"
			method="POST"
			action="?/savePolicy"
			use:enhance={saving.submit('policy', 'Save model policy')}
		>
			<input type="hidden" name="scope" value={scope} />
			<input type="hidden" name="enabledModels" value={effectiveDraftModels.join(',')} />
			<input type="hidden" name="defaultModel" value={draftDefault} />

			<div class="policy-heading">
				<div class="policy-icon"><Layers3 size={16} /></div>
				<div>
					<strong>Organization model catalog</strong>
					<span>This is the ceiling for every role and member in the organization.</span>
				</div>
				<span class="badge access">{effectiveDraftModels.length} available</span>
			</div>

			<div class="policy-controls">
				<div class="scope-control">
					<span class="control-label">Availability</span>
					<div class="scope-options">
						<button type="button" class:active={scope === 'all'} disabled={saving.busy} onclick={() => setScope('all')}>
							<span class="scope-check">{#if scope === 'all'}<Check size={11} />{/if}</span>
							<span><strong>All available models</strong><small>New models become available automatically.</small></span>
						</button>
						<button type="button" class:active={scope === 'selected'} disabled={saving.busy} onclick={() => setScope('selected')}>
							<span class="scope-check">{#if scope === 'selected'}<Check size={11} />{/if}</span>
							<span><strong>Selected models</strong><small>Only models chosen below can be used.</small></span>
						</button>
					</div>
				</div>
				<div class="default-control">
					<label for="organization-default">Organization default</label>
					<Select
						id="organization-default"
						bind:value={draftDefault}
						options={defaultOptions}
						searchable
						disabled={saving.busy}
						label="Organization default model"
						searchPlaceholder="Find a default model"
					/>
					<p>Used unless a role defines a more specific default.</p>
				</div>
			</div>

			{#if scope === 'all'}
				<div class="all-models-summary">
					<div class="summary-mark"><Sparkles size={17} /></div>
					<div><strong>Catalog follows the deployment</strong><span>{eligibleModels.length} models are available now. Deployment and data-policy restrictions still apply.</span></div>
					<div class="logo-stack">
						{#each effectiveDraftModels.slice(0, 7) as enumName (enumName)}
							<span title={getModelNameByEnum(enumName)}><BrandLogo src={getModelIconSrcByEnum(enumName)} name={getModelNameByEnum(enumName)} size={18} /></span>
						{/each}
						{#if effectiveDraftModels.length > 7}<em>+{effectiveDraftModels.length - 7}</em>{/if}
					</div>
				</div>
			{:else}
				<ModelCatalogPicker bind:selected={draftModels} unavailable={unavailableModels} disabled={saving.busy} unavailableLabel="Unavailable to this organization" />
			{/if}

			<div class="policy-footer">
				<div>
					<ShieldCheck size={14} />
					<span>{scope === 'all' ? 'Roles inherit the full organization catalog unless narrowed.' : `${effectiveDraftModels.length} models can be granted to roles.`}</span>
				</div>
				<Button
					variant="solid"
					size="sm"
					type="submit"
					loading={saving.is('policy')}
					disabled={saveDisabled || saving.busy}
				>
					{saving.is('policy') ? 'Saving…' : 'Save model policy'}
				</Button>
			</div>
		</form>
	{/if}
</Page>

<style>
	.policy-panel { overflow: hidden; }
	.policy-heading { display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; align-items: center; gap: 11px; border-bottom: 1px solid var(--color-line); padding: 14px 16px; }
	.policy-icon { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 9px; background: var(--color-access-soft); color: var(--color-access); }
	.policy-heading strong, .policy-heading span { display: block; }
	.policy-heading strong { font-size: 12px; font-weight: 620; }
	.policy-heading > div > span { margin-top: 3px; color: var(--color-muted); font-size: 9px; }
	.policy-controls { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(260px, .75fr); gap: 20px; padding: 16px; }
	.control-label, .default-control > label { display: block; margin-bottom: 7px; color: var(--color-muted); font-size: 8px; font-weight: 650; letter-spacing: .07em; text-transform: uppercase; }
	.scope-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
	.scope-options > button { display: grid; grid-template-columns: 18px minmax(0, 1fr); align-items: start; gap: 8px; border: 1px solid var(--color-line); border-radius: 9px; background: var(--color-elevate); padding: 10px; color: var(--color-ink); text-align: left; cursor: pointer; }
	.scope-options > button:disabled { cursor: default; opacity: .6; }
	.scope-options > button.active { border-color: color-mix(in srgb, var(--color-access) 50%, var(--color-line)); background: var(--color-access-soft); }
	.scope-check { display: grid; width: 16px; height: 16px; place-items: center; border: 1px solid var(--color-line); border-radius: 999px; color: white; }
	.active .scope-check { border-color: var(--color-access); background: var(--color-access); }
	.scope-options strong, .scope-options small { display: block; }
	.scope-options strong { font-size: 10px; font-weight: 620; }
	.scope-options small { margin-top: 3px; color: var(--color-muted); font-size: 8px; line-height: 1.35; }
	.default-control p { margin: 6px 0 0; color: var(--color-muted); font-size: 8px; }
	.all-models-summary { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; align-items: center; gap: 11px; border-top: 1px solid var(--color-line); background: color-mix(in srgb, var(--color-paper) 72%, transparent); padding: 16px; }
	.summary-mark { display: grid; width: 36px; height: 36px; place-items: center; border: 1px solid var(--color-line); border-radius: 9px; background: var(--color-elevate); color: var(--color-access); }
	.all-models-summary strong, .all-models-summary span { display: block; }
	.all-models-summary strong { font-size: 10px; }
	.all-models-summary span { margin-top: 3px; color: var(--color-muted); font-size: 8px; }
	.logo-stack { display: flex; align-items: center; padding-left: 7px; }
	.logo-stack > span { display: grid; width: 27px; height: 27px; margin-left: -7px; place-items: center; border: 2px solid var(--color-paper); border-radius: 8px; background: white; }
	.logo-stack em { margin-left: 6px; color: var(--color-muted); font-family: var(--font-mono); font-size: 8px; font-style: normal; }
	.policy-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-top: 1px solid var(--color-line); padding: 11px 16px; }
	.policy-footer > div { display: flex; align-items: center; gap: 7px; color: var(--color-muted); font-size: 9px; }
	.policy-footer > div :global(svg) { color: var(--color-access); }
	@media (max-width: 820px) { .policy-controls { grid-template-columns: 1fr; }.all-models-summary { grid-template-columns: 38px minmax(0, 1fr); }.logo-stack { grid-column: 2; padding: 0; }.logo-stack > span:first-child { margin-left: 0; } }
	@media (max-width: 560px) { .scope-options { grid-template-columns: 1fr; }.policy-footer { align-items: stretch; flex-direction: column; }.policy-footer :global(.primitive-button) { width: 100%; } }
</style>
