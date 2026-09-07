<script lang="ts">
	import { enhance } from '$app/forms';
	import { AlertTriangle, ChevronDown } from '@lucide/svelte';

	import ConnectionEmpty from '$lib/ConnectionEmpty.svelte';
	import { toolIcon } from '$lib/featureIcons';
	import { FEATURE_GROUPS, readSource, type Source } from '$lib/features';
	import { MutationTracker } from '$lib/mutate.svelte';
	import { Badge, Checkbox, Page, Panel, SearchField, Switch } from '$lib/primitives';

	let { data } = $props();
	const saving = new MutationTracker();
	const admin = $derived(data.admin);
	let query = $state('');
	let onlyAvailable = $state(false);
	let expanded = $state<string[]>([]);

	const SDK_ORG_FIELDS = new Set([
		'hideExampleConnectors', 'trainingMode', 'dashboardsEnabled', 'methodologyEnabled',
		'feedEnabled', 'observabilityEnabled', 'notificationsEnabled', 'fastModeEnabled',
		'maxThinkingEnabled', 'tracesEnabled', 'sandboxObservabilityEnabled', 'dataAppsEnabled',
		'subagentsEnabled'
	]);

	const groups = $derived(
		FEATURE_GROUPS.map((group) => ({
			...group,
			rows: group.rows.filter((row) => {
				// Rows Settings -> Features would not render for this org are not
				// rendered here either — see FeatureRow.hiddenFor.
				if (row.hiddenFor?.(admin.organization)) return false;
				// A row whose Available switch the SDK cannot write has no working
				// control, so it is dropped rather than shown as a dead cell.
				if (!canManage(row.available) || row.available.kind === 'none') return false;
				const state = readSource(row.available, admin.organization);
				if (onlyAvailable && state.kind !== 'on') return false;
				const needle = query.toLowerCase();
				return !needle || `${row.name} ${row.description} ${row.key}`.toLowerCase().includes(needle);
			})
		})).filter((group) => group.rows.length)
	);

	function canManage(source: Source): boolean {
		return source.kind === 'restriction' || source.kind === 'paradigm' ||
			(source.kind === 'org' && SDK_ORG_FIELDS.has(source.field));
	}

	function isOn(source: Source): boolean {
		return readSource(source, admin.organization).kind === 'on';
	}

	function toggleExpanded(key: string): void {
		expanded = expanded.includes(key) ? expanded.filter((item) => item !== key) : [...expanded, key];
	}
</script>

<Page title="Features" lead="Organization availability and default behavior." wide>

{#if admin.mode !== 'live'}
	<ConnectionEmpty mode={admin.mode} error={admin.error} />
{:else}
	<div class="feature-toolbar panel">
		<SearchField bind:value={query} placeholder="Find a feature" class="feature-search" />
		<Checkbox bind:checked={onlyAvailable} label="Show available only" />
		<Badge>{groups.reduce((count, group) => count + group.rows.length, 0)} features</Badge>
	</div>

	<div class="feature-groups">
		{#each groups as group (group.label)}
			<section class="feature-section">
				<div class="group-heading"><div><h2>{group.label}</h2><p>{group.description}</p></div><span>{group.rows.length}</span></div>
				<div class="panel feature-list">
					<div class="feature-columns"><span>Capability</span><span>Available</span><span>Default</span></div>
					{#each group.rows as row (row.key)}
						{@const Icon = toolIcon(row.key)}
						{@const availableOn = isOn(row.available)}
						<div class="feature-row" class:open={expanded.includes(row.key)}>
							<div class="feature-main">
								<button class="feature-copy" type="button" onclick={() => toggleExpanded(row.key)} aria-expanded={expanded.includes(row.key)}>
									<span class="feature-icon"><Icon /></span>
									<span><strong>{row.name}</strong><small>{row.description}</small></span>
									{#if row.caveat}<AlertTriangle size={12} class="caveat-icon" />{/if}
									<ChevronDown size={13} class={expanded.includes(row.key) ? 'rotate-180' : ''} />
								</button>

								<div class="feature-control">
									<!-- Always true after the row filter; the block narrows Source for `field`. -->
									{#if row.available.kind !== 'none'}
										{@const key = `available:${row.key}`}
										<form
											method="POST"
											action="?/setFeature"
											use:enhance={saving.submit(key, () => `${row.name} — Available`)}
										>
											<input type="hidden" name="kind" value={row.available.kind} />
											<input type="hidden" name="field" value={row.available.field} />
											<input type="hidden" name="desired" value={String(!availableOn)} />
											<!-- Off only: a tool that becomes unavailable must not keep a
											     default that would switch it on the moment it returns. -->
											{#if availableOn && row.cascadeDefault}
												<input type="hidden" name="clearDefault" value={row.cascadeDefault} />
											{/if}
											<Switch
												type="submit"
												checked={availableOn}
												pending={saving.is(key)}
												disabled={saving.busy}
												label={`Turn ${row.name} ${availableOn ? 'off' : 'on'}`}
											/>
										</form>
									{/if}
								</div>

								<div class="feature-control">
									{#if row.default.kind === 'none'}
										<span class="dash">—</span>
									{:else if canManage(row.default)}
										{@const key = `default:${row.key}`}
										{@const defaultOn = availableOn && isOn(row.default)}
										<form
											method="POST"
											action="?/setFeature"
											use:enhance={saving.submit(key, () => `${row.name} — Default`)}
										>
											<input type="hidden" name="kind" value={row.default.kind} />
											<input type="hidden" name="field" value={row.default.field} />
											<input type="hidden" name="desired" value={String(!defaultOn)} />
											<Switch
												type="submit"
												checked={defaultOn}
												pending={saving.is(key)}
												disabled={saving.busy || !availableOn}
												label={availableOn
													? `Change ${row.name} default`
													: `${row.name} is unavailable to this organization`}
											/>
										</form>
									{:else}<span class="dash">—</span>{/if}
								</div>
							</div>

							{#if expanded.includes(row.key)}
								<div class="feature-detail">
									<p>{row.details}</p>
									{#if row.caveat}<div class="feature-warning"><AlertTriangle size={13} /><span>{row.caveat}</span></div>{/if}
									<dl>
										<div><dt>Available source</dt><dd><code>{row.storage}</code></dd></div>
										{#if row.defaultNote}<div><dt>No default</dt><dd>{row.defaultNote}</dd></div>{/if}
										{#if row.hiddenWhen}<div><dt>Visibility</dt><dd>{row.hiddenWhen}</dd></div>{/if}
									</dl>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}
</Page>

<style>
	.feature-toolbar { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; padding: 11px 12px; }
	.feature-toolbar :global(.feature-search) { min-width: 250px; flex: 1; }
	.feature-groups { display: grid; gap: 28px; }.group-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin: 0 3px 10px; }.group-heading h2 { margin: 0; font-size: 12px; font-weight: 680; }.group-heading p { max-width: 650px; margin: 4px 0 0; color: var(--color-muted); font-size: 9px; line-height: 1.5; }.group-heading > span { color: var(--color-subtle); font-family: var(--font-mono); font-size: 9px; }
	.feature-list { overflow: hidden; }.feature-columns { display: grid; grid-template-columns: minmax(0,1fr) 104px 104px; border-bottom: 1px solid var(--color-line); background: var(--color-paper); padding: 8px 14px; color: var(--color-subtle); font-size: 8px; font-weight: 680; letter-spacing: .06em; text-transform: uppercase; }.feature-columns span:not(:first-child) { text-align: center; }
	.feature-row { border-bottom: 1px solid var(--color-line); }.feature-row:last-child { border: 0; }.feature-main { display: grid; grid-template-columns: minmax(0,1fr) 104px 104px; align-items: center; min-height: 58px; padding: 0 14px; }.feature-row.open .feature-main { background: var(--color-paper); }
	.feature-copy { display: grid; grid-template-columns: 31px minmax(0,1fr) auto auto; align-items: center; gap: 9px; border: 0; background: transparent; padding: 10px 12px 10px 0; text-align: left; cursor: pointer; }.feature-icon { display: grid; height: 29px; width: 29px; place-items: center; border-radius: 7px; background: var(--color-access-soft); color: var(--color-access); }.feature-icon :global(svg) { height: 15px; width: 15px; }.feature-copy strong, .feature-copy small { display: block; }.feature-copy strong { font-size: 10px; font-weight: 650; }.feature-copy small { margin-top: 3px; color: var(--color-muted); font-size: 8px; line-height: 1.4; }.feature-copy > :global(svg:last-child) { color: var(--color-subtle); transition: transform 120ms ease; }.feature-copy :global(.caveat-icon) { color: var(--color-warning); }
	.feature-control { display: grid; place-items: center; }.dash { color: var(--color-line); }
	.feature-detail { border-top: 1px solid var(--color-line); background: var(--color-paper); padding: 14px 54px; }.feature-detail > p { max-width: 730px; margin: 0; color: var(--color-muted); font-size: 10px; line-height: 1.55; }.feature-warning { display: flex; align-items: flex-start; gap: 7px; max-width: 760px; margin-top: 10px; color: var(--color-warning); font-size: 9px; line-height: 1.5; }.feature-warning :global(svg) { flex: 0 0 auto; margin-top: 1px; }.feature-detail dl { display: grid; gap: 7px; margin: 12px 0 0; }.feature-detail dl div { display: grid; grid-template-columns: 100px minmax(0,1fr); gap: 10px; }.feature-detail dt { color: var(--color-subtle); font-size: 8px; text-transform: uppercase; }.feature-detail dd { margin: 0; color: var(--color-muted); font-size: 9px; }
	@media (max-width: 650px) { .feature-toolbar { align-items: stretch; flex-direction: column; }.feature-toolbar :global(.feature-search) { min-width: 0; }.feature-columns, .feature-main { grid-template-columns: minmax(0,1fr) 72px 72px; }.feature-detail { padding: 14px 20px; }.feature-copy small { display: none; } }
</style>
