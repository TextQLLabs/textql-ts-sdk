<script lang="ts">
	import { AlertTriangle, Search } from '@lucide/svelte';

	import {
		CATEGORY_LABELS,
		ENFORCEMENT_LABELS,
		ORG_FIELDS,
		type Category,
		type Enforcement,
		type Surface
	} from '$lib/catalog';

	let { data } = $props();

	let query = $state('');
	let category = $state<Category | 'all'>('all');
	let surface = $state<Surface | 'all'>('all');
	let onlyGotchas = $state(false);

	const organization = $derived(data.live.organization);

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

	const SURFACE_STYLES: Record<Surface, string> = {
		public: 'bg-ok-bg text-ok',
		internal: 'bg-warn-bg text-warn',
		'not-settable': 'bg-dead-bg text-dead'
	};

	const SURFACE_LABELS: Record<Surface, string> = {
		public: 'Public',
		internal: 'Internal',
		'not-settable': 'Not settable'
	};

	const ENFORCEMENT_STYLES: Record<Enforcement, string> = {
		enforced: 'text-muted',
		ignored: 'text-dead font-medium',
		deprecated: 'text-dead',
		vestigial: 'text-dead',
		computed: 'text-warn'
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
</script>

<div class="space-y-6">
	<section>
		<h1 class="text-2xl font-semibold tracking-tight">Field catalog</h1>
		<p class="text-muted mt-2 max-w-3xl text-sm leading-relaxed">
			Every organization-level setting the backend reads, with where it is stored, whether the
			public API can set it, and whether anything still enforces it. Public / Internal reflects
			<code class="text-ink">google.api.visibility</code> — internal fields are stripped from the
			generated OpenAPI spec and so from the SDKs.
		</p>
	</section>

	<!-- filters -->
	<div class="border-line bg-panel flex flex-wrap items-center gap-3 rounded-sm border p-3">
		<div class="relative min-w-52 flex-1">
			<Search size={14} class="text-muted absolute top-1/2 left-2.5 -translate-y-1/2" />
			<input
				bind:value={query}
				placeholder="Search name, column or description"
				class="border-line w-full rounded-sm border bg-white py-1.5 pr-2 pl-8 text-xs"
			/>
		</div>

		<select
			bind:value={category}
			class="border-line rounded-sm border bg-white px-2 py-1.5 text-xs"
		>
			{#each CATEGORIES as c (c)}
				<option value={c}>{c === 'all' ? 'All categories' : CATEGORY_LABELS[c]}</option>
			{/each}
		</select>

		<select bind:value={surface} class="border-line rounded-sm border bg-white px-2 py-1.5 text-xs">
			{#each SURFACES as s (s)}
				<option value={s}>{s === 'all' ? 'All surfaces' : SURFACE_LABELS[s]}</option>
			{/each}
		</select>

		<label class="flex items-center gap-1.5 text-xs">
			<input type="checkbox" bind:checked={onlyGotchas} />
			Only fields with caveats
		</label>

		<span class="text-muted ml-auto font-mono text-xs">{filtered.length}/{ORG_FIELDS.length}</span>
	</div>

	<!-- table -->
	<div class="border-line bg-panel overflow-x-auto rounded-sm border">
		<table class="w-full text-left text-xs">
			<thead class="border-line text-muted border-b">
				<tr>
					<th class="px-3 py-2 font-medium">Field</th>
					<th class="px-3 py-2 font-medium">Storage</th>
					<th class="px-3 py-2 font-medium">Surface</th>
					<th class="px-3 py-2 font-medium">State</th>
					<th class="px-3 py-2 font-medium">Live</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered as f (f.key)}
					{@const value = live(f.key)}
					<tr class="border-line border-b align-top last:border-0">
						<td class="max-w-md px-3 py-2.5">
							<div class="text-ink font-mono">{f.key}</div>
							{#if f.column && f.column !== f.key}
								<div class="text-muted font-mono text-[10px]">{f.column}</div>
							{/if}
							<p class="text-muted mt-1 leading-relaxed">{f.summary}</p>
							{#if f.gotcha}
								<p class="text-warn mt-1.5 flex items-start gap-1.5 leading-relaxed">
									<AlertTriangle size={12} class="mt-0.5 shrink-0" />
									<span>{f.gotcha}</span>
								</p>
							{/if}
						</td>
						<td class="text-muted px-3 py-2.5 font-mono text-[10px] whitespace-nowrap">
							{f.storage}
						</td>
						<td class="px-3 py-2.5">
							<span class="rounded-sm px-1.5 py-0.5 text-[10px] {SURFACE_STYLES[f.surface]}">
								{SURFACE_LABELS[f.surface]}
							</span>
						</td>
						<td class="px-3 py-2.5 whitespace-nowrap {ENFORCEMENT_STYLES[f.enforcement]}">
							{ENFORCEMENT_LABELS[f.enforcement]}
						</td>
						<td class="px-3 py-2.5 font-mono text-[10px] whitespace-nowrap">
							{#if value === null}
								<span class="text-muted">—</span>
							{:else if value === 'absent'}
								<span class="text-muted" title="proto3 omits false booleans, so this is false"
									>false*</span
								>
							{:else}
								<span class="text-ink">{String(value)}</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<p class="text-muted text-xs leading-relaxed">
		{#if organization}
			<span class="font-mono">false*</span> means the key was absent from the response. proto3 omits
			false booleans, so absent is a real <span class="font-mono">false</span>, not missing data.
		{:else}
			Set <code>TEXTQL_API_KEY</code> in <code>.env</code> to populate the Live column.
		{/if}
	</p>
</div>
