<script lang="ts">
	import { AlertTriangle } from '@lucide/svelte';

	import {
		CATEGORY_LABELS,
		ENFORCEMENT_LABELS,
		ORG_FIELDS,
		type Category,
		type Enforcement,
		type OrgField,
		type Surface
	} from '$lib/catalog';
	import {
		Badge,
		Checkbox,
		DataTable,
		EmptyState,
		Page,
		Panel,
		SearchField,
		Select,
		type BadgeTone,
		type TableColumn
	} from '$lib/primitives';

	let { data } = $props();

	let query = $state('');
	let category = $state<Category | 'all'>('all');
	let surface = $state<Surface | 'all'>('all');
	let onlyGotchas = $state(false);

	const organization = $derived(data.admin.organization);

	const filtered = $derived(
		ORG_FIELDS.filter((f) => {
			if (category !== 'all' && f.category !== category) return false;
			if (surface !== 'all' && f.surface !== surface) return false;
			if (onlyGotchas && !f.gotcha) return false;
			if (!query.trim()) return true;
			const q = query.toLowerCase();
			return (
				f.key.toLowerCase().includes(q) ||
				f.column?.toLowerCase().includes(q) ||
				f.summary.toLowerCase().includes(q)
			);
		})
	);

	const SURFACE_TONES: Record<Surface, BadgeTone> = {
		public: 'success',
		internal: 'warning',
		'not-settable': 'danger'
	};

	const SURFACE_LABELS: Record<Surface, string> = {
		public: 'Public',
		internal: 'Internal',
		'not-settable': 'Not settable'
	};

	/** Only "enforced" is unremarkable; the rest are all degrees of dead. */
	const ENFORCEMENT_TONES: Record<Enforcement, BadgeTone> = {
		enforced: 'neutral',
		ignored: 'danger',
		deprecated: 'danger',
		vestigial: 'danger',
		computed: 'warning'
	};

	/** proto3 drops false booleans, so an absent key is a real false. */
	function live(key: string) {
		if (!organization) return null;
		const raw = organization[key];
		if (typeof raw === 'boolean') return raw;
		if (typeof raw === 'string' || typeof raw === 'number') return raw;
		if (raw === undefined) return 'absent';
		return null;
	}

	const CATEGORIES: (Category | 'all')[] = ['all', 'identity', 'config', 'policy', 'feature-gate'];
	const SURFACES: (Surface | 'all')[] = ['all', 'public', 'internal', 'not-settable'];

	const categoryOptions = $derived(
		CATEGORIES.map((c) => ({ value: c, label: c === 'all' ? 'All categories' : CATEGORY_LABELS[c] }))
	);
	const surfaceOptions = $derived(
		SURFACES.map((s) => ({ value: s, label: s === 'all' ? 'All surfaces' : SURFACE_LABELS[s] }))
	);

	const columns: TableColumn[] = [
		{ label: 'Field' },
		{ label: 'Storage' },
		{ label: 'Surface' },
		{ label: 'State' },
		{ label: 'Live' }
	];
</script>

<Page title="Field catalog" lead="Every organization-level setting the backend reads." wide>
	<Panel class="intro-panel" padded>
		<p class="intro">
			Where each setting is stored, whether the public API can set it, and whether anything still
			enforces it. Public / Internal reflects <code>google.api.visibility</code> — internal fields are
			stripped from the generated OpenAPI spec and so from the SDKs.
		</p>
	</Panel>

	<Panel class="filter-panel">
		<div class="filter-bar">
			<SearchField
				bind:value={query}
				placeholder="Search name, column or description"
				class="field-search"
			/>
			<div class="filter-select">
				<Select bind:value={category} options={categoryOptions} label="Filter by category" />
			</div>
			<div class="filter-select">
				<Select bind:value={surface} options={surfaceOptions} label="Filter by surface" />
			</div>
			<Checkbox bind:checked={onlyGotchas} label="Only fields with caveats" />
			<span class="filter-count">{filtered.length}/{ORG_FIELDS.length}</span>
		</div>
	</Panel>

	<Panel class="table-panel">
		<DataTable {columns} items={filtered} key={(f: OrgField) => f.key} {row} {empty} />
	</Panel>

	<p class="footnote">
		{#if organization}
			<span class="mono">false*</span> means the key was absent from the response. proto3 omits false
			booleans, so absent is a real <span class="mono">false</span>, not missing data.
		{:else}
			Set <code>TEXTQL_API_KEY</code> in <code>.env</code> to populate the Live column.
		{/if}
	</p>
</Page>

{#snippet empty()}
	<EmptyState title="No matching fields" description="Adjust the search or filters." />
{/snippet}

{#snippet row(f: OrgField)}
	{@const value = live(f.key)}
	<td class="field-cell">
		<div class="mono field-key">{f.key}</div>
		{#if f.column && f.column !== f.key}<div class="mono field-column">{f.column}</div>{/if}
		<p class="field-summary">{f.summary}</p>
		{#if f.gotcha}
			<p class="field-gotcha"><AlertTriangle size={12} /><span>{f.gotcha}</span></p>
		{/if}
	</td>
	<td class="mono nowrap muted">{f.storage}</td>
	<td><Badge tone={SURFACE_TONES[f.surface]}>{SURFACE_LABELS[f.surface]}</Badge></td>
	<td><Badge tone={ENFORCEMENT_TONES[f.enforcement]}>{ENFORCEMENT_LABELS[f.enforcement]}</Badge></td>
	<td class="mono nowrap">
		{#if value === null}
			<span class="muted">—</span>
		{:else if value === 'absent'}
			<span class="muted" title="proto3 omits false booleans, so this is false">false*</span>
		{:else}
			{String(value)}
		{/if}
	</td>
{/snippet}

<style>
	:global(.intro-panel), :global(.filter-panel) { margin-bottom: 14px; }
	:global(.table-panel) { overflow: hidden; }
	.intro { margin: 0; max-width: 70ch; color: var(--color-muted); font-size: 11px; line-height: 1.6; }
	.filter-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 11px 12px; }
	.filter-bar :global(.field-search) { min-width: 220px; flex: 1; }
	.filter-select { width: 170px; flex: 0 0 auto; }
	.filter-count { margin-left: auto; color: var(--color-muted); font-family: var(--font-mono); font-size: 10px; }
	.field-cell { max-width: 34rem; }
	.field-key { color: var(--color-ink); font-size: 11px; }
	.field-column { color: var(--color-muted); font-size: 9.5px; }
	.field-summary { margin: 4px 0 0; color: var(--color-muted); font-size: 10px; line-height: 1.55; }
	.field-gotcha { display: flex; align-items: flex-start; gap: 6px; margin: 6px 0 0; color: var(--color-warning); font-size: 10px; line-height: 1.5; }
	.field-gotcha :global(svg) { flex: 0 0 auto; margin-top: 1px; }
	.mono { font-family: var(--font-mono); }
	.nowrap { white-space: nowrap; }
	.muted { color: var(--color-muted); }
	.footnote { margin: 14px 0 0; color: var(--color-muted); font-size: 10px; line-height: 1.6; }
</style>
