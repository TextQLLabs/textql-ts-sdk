<script lang="ts">
	import { AlertTriangle, ChevronDown, Search } from '@lucide/svelte';

	import ConnectionEmpty from '$lib/ConnectionEmpty.svelte';
	import { toolIcon } from '$lib/featureIcons';
	import { FEATURE_GROUPS, readSource, type Source } from '$lib/features';
	import { Page, Switch } from '$lib/primitives';

	let { data, form } = $props();
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
	{#if form?.message}<div class="form-message">{form.message}</div>{/if}
	<div class="feature-toolbar panel">
		<div class="feature-search"><Search size={14} /><input bind:value={query} placeholder="Find a feature" /></div>
		<label><input type="checkbox" bind:checked={onlyAvailable} /> Show available only</label>
		<span>{groups.reduce((count, group) => count + group.rows.length, 0)} features</span>
	</div>

	<div class="feature-groups">
		{#each groups as group (group.label)}
			<section class="feature-section">
				<div class="group-heading"><div><h2>{group.label}</h2><p>{group.description}</p></div><span>{group.rows.length}</span></div>
				<div class="panel feature-list">
					<div class="feature-columns"><span>Capability</span><span>Available</span><span>Default</span></div>
					{#each group.rows as row (row.key)}
						{@const Icon = toolIcon(row.key)}
						<div class="feature-row" class:open={expanded.includes(row.key)}>
							<div class="feature-main">
								<button class="feature-copy" type="button" onclick={() => toggleExpanded(row.key)} aria-expanded={expanded.includes(row.key)}>
									<span class="feature-icon"><Icon /></span>
									<span><strong>{row.name}</strong><small>{row.description}</small></span>
									{#if row.caveat}<AlertTriangle size={12} class="caveat-icon" />{/if}
									<ChevronDown size={13} class={expanded.includes(row.key) ? 'rotate-180' : ''} />
								</button>

								<div class="feature-control">
									{#if canManage(row.available) && row.available.kind !== 'none'}
										<form method="POST" action="?/setFeature">
											<input type="hidden" name="kind" value={row.available.kind} />
											<input type="hidden" name="field" value={row.available.field} />
											<input type="hidden" name="desired" value={String(!isOn(row.available))} />
											<Switch type="submit" checked={isOn(row.available)} label={`Turn ${row.name} ${isOn(row.available) ? 'off' : 'on'}`} />
										</form>
									{:else}<span class="not-managed">SDK unavailable</span>{/if}
								</div>

								<div class="feature-control">
									{#if row.default.kind === 'none'}
										<span class="dash">—</span>
									{:else if canManage(row.default)}
										<form method="POST" action="?/setFeature">
											<input type="hidden" name="kind" value={row.default.kind} />
											<input type="hidden" name="field" value={row.default.field} />
											<input type="hidden" name="desired" value={String(!isOn(row.default))} />
											<Switch type="submit" checked={isOn(row.default)} label={`Change ${row.name} default`} />
										</form>
									{:else}<span class="not-managed">SDK unavailable</span>{/if}
								</div>
							</div>

							{#if expanded.includes(row.key)}
								<div class="feature-detail">
									<p>{row.details}</p>
									{#if row.caveat}<div class="feature-warning"><AlertTriangle size={13} /><span>{row.caveat}</span></div>{/if}
									<dl><div><dt>Available source</dt><dd><code>{row.storage}</code></dd></div>{#if row.hiddenWhen}<div><dt>Visibility</dt><dd>{row.hiddenWhen}</dd></div>{/if}</dl>
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
	.form-message { margin-bottom: 14px; border: 1px solid var(--color-line); border-radius: 8px; background: white; padding: 10px 12px; color: var(--color-access); font-size: 11px; }
	.feature-toolbar { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; padding: 11px 12px; }
	.feature-search { display: flex; min-width: 250px; flex: 1; align-items: center; gap: 8px; border: 1px solid var(--color-line); border-radius: 7px; padding: 7px 9px; color: var(--color-subtle); }.feature-search input { width: 100%; border: 0; outline: 0; font-size: 10px; }.feature-toolbar label, .feature-toolbar > span { color: var(--color-muted); font-size: 9px; }.feature-toolbar label { display: flex; align-items: center; gap: 6px; }.feature-toolbar > span { font-family: var(--font-mono); }
	.feature-groups { display: grid; gap: 28px; }.group-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin: 0 3px 10px; }.group-heading h2 { margin: 0; font-size: 12px; font-weight: 680; }.group-heading p { max-width: 650px; margin: 4px 0 0; color: var(--color-muted); font-size: 9px; line-height: 1.5; }.group-heading > span { color: var(--color-subtle); font-family: var(--font-mono); font-size: 9px; }
	.feature-list { overflow: hidden; }.feature-columns { display: grid; grid-template-columns: minmax(0,1fr) 104px 104px; border-bottom: 1px solid var(--color-line); background: var(--color-paper); padding: 8px 14px; color: var(--color-subtle); font-size: 8px; font-weight: 680; letter-spacing: .06em; text-transform: uppercase; }.feature-columns span:not(:first-child) { text-align: center; }
	.feature-row { border-bottom: 1px solid var(--color-line); }.feature-row:last-child { border: 0; }.feature-main { display: grid; grid-template-columns: minmax(0,1fr) 104px 104px; align-items: center; min-height: 58px; padding: 0 14px; }.feature-row.open .feature-main { background: var(--color-paper); }
	.feature-copy { display: grid; grid-template-columns: 31px minmax(0,1fr) auto auto; align-items: center; gap: 9px; border: 0; background: transparent; padding: 10px 12px 10px 0; text-align: left; cursor: pointer; }.feature-icon { display: grid; height: 29px; width: 29px; place-items: center; border-radius: 7px; background: var(--color-access-soft); color: var(--color-access); }.feature-icon :global(svg) { height: 15px; width: 15px; }.feature-copy strong, .feature-copy small { display: block; }.feature-copy strong { font-size: 10px; font-weight: 650; }.feature-copy small { margin-top: 3px; color: var(--color-muted); font-size: 8px; line-height: 1.4; }.feature-copy > :global(svg:last-child) { color: var(--color-subtle); transition: transform 120ms ease; }.feature-copy :global(.caveat-icon) { color: var(--color-warning); }
	.feature-control { display: grid; place-items: center; }.dash { color: var(--color-line); }.not-managed { color: var(--color-subtle); font-size: 7px; text-align: center; }
	.feature-detail { border-top: 1px solid var(--color-line); background: var(--color-paper); padding: 14px 54px; }.feature-detail > p { max-width: 730px; margin: 0; color: var(--color-muted); font-size: 10px; line-height: 1.55; }.feature-warning { display: flex; align-items: flex-start; gap: 7px; max-width: 760px; margin-top: 10px; color: var(--color-warning); font-size: 9px; line-height: 1.5; }.feature-warning :global(svg) { flex: 0 0 auto; margin-top: 1px; }.feature-detail dl { display: grid; gap: 7px; margin: 12px 0 0; }.feature-detail dl div { display: grid; grid-template-columns: 100px minmax(0,1fr); gap: 10px; }.feature-detail dt { color: var(--color-subtle); font-size: 8px; text-transform: uppercase; }.feature-detail dd { margin: 0; color: var(--color-muted); font-size: 9px; }
	@media (max-width: 650px) { .feature-toolbar { align-items: stretch; flex-direction: column; }.feature-search { min-width: 0; }.feature-columns, .feature-main { grid-template-columns: minmax(0,1fr) 72px 72px; }.feature-detail { padding: 14px 20px; }.feature-copy small { display: none; } }
</style>
