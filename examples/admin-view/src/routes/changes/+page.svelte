<script lang="ts">
	import { Download, History } from '@lucide/svelte';

	import ConnectionEmpty from '$lib/ConnectionEmpty.svelte';
	import {
		addDays,
		Badge,
		Button,
		DatePicker,
		EmptyState,
		endOfDay,
		Page,
		Panel,
		SearchField,
		Select,
		startOfDay,
		startOfMonth
	} from '$lib/primitives';

	let { data } = $props();
	const admin = $derived(data.admin);
	let query = $state('');
	let category = $state('all');
	let from = $state<Date | undefined>();
	let to = $state<Date | undefined>();

	const TODAY = startOfDay(new Date());
	const RANGE_PRESETS = [
		{ label: 'All time' },
		{ label: 'Last 7 days', from: addDays(TODAY, -6), to: TODAY },
		{ label: 'Last 30 days', from: addDays(TODAY, -29), to: TODAY },
		{ label: 'This month', from: startOfMonth(TODAY), to: TODAY }
	];

	const categories = $derived([...new Set(admin.changes.map((change) => change.category))].sort());
	const categoryOptions = $derived([
		{ value: 'all', label: 'All categories' },
		...categories.map((item) => ({ value: item, label: item }))
	]);
	const changes = $derived(
		admin.changes.filter((change) => {
			if (category !== 'all' && change.category !== category) return false;
			const needle = query.trim().toLowerCase();
			if (needle && !`${change.actor} ${change.action} ${change.resourceType} ${change.resourceId ?? ''}`.toLowerCase().includes(needle)) {
				return false;
			}
			const stamp = new Date(change.createdAt).getTime();
			if (from && stamp < startOfDay(from).getTime()) return false;
			if (to && stamp > endOfDay(to).getTime()) return false;
			return true;
		})
	);

	function day(value: string): string {
		return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
	}

	function time(value: string): string {
		return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
	}
</script>

{#snippet actions()}<Button variant="surface" size="sm" disabled={admin.mode !== 'live'}><Download size={14} /> Export</Button>{/snippet}
<Page title="Audit log" lead="Security and operational events across the organization." wide {actions}>

{#if admin.mode !== 'live'}
	<ConnectionEmpty mode={admin.mode} error={admin.error} />
{:else}
	<Panel class="change-panel">
		<div class="change-toolbar">
			<SearchField bind:value={query} placeholder="Search actor, action, or resource" class="change-search" />
			<div class="change-filter">
				<Select bind:value={category} options={categoryOptions} label="Filter by category" searchable={categoryOptions.length > 8} />
			</div>
			<div class="change-range">
				<DatePicker
					mode="range"
					bind:from
					bind:to
					placeholder="All time"
					label="Filter by date"
					presets={RANGE_PRESETS}
					max={TODAY}
				/>
			</div>
		</div>

		{#if changes.length}
			<div class="change-list">
				{#each changes as change, index (change.id)}
					{@const previous = changes[index - 1]}
					{#if !previous || day(previous.createdAt) !== day(change.createdAt)}
						<div class="day-divider"><span>{day(change.createdAt)}</span></div>
					{/if}
					<article class="change-row">
						<div class="change-time">{time(change.createdAt)}</div>
						<div class="change-mark"><span></span></div>
						<div class="change-copy">
							<strong>{change.action}</strong>
							<p><span>{change.actor}</span> changed <span>{change.resourceType}</span>{change.resourceId ? ` · ${change.resourceId}` : ''}</p>
						</div>
						<div class="change-meta"><Badge>{change.category}</Badge>{#if change.authMethod}<code>{change.authMethod}</code>{/if}</div>
					</article>
				{/each}
			</div>
		{:else}
			<EmptyState icon={History} title="No matching events" description="Adjust the search, category, or date range." />
		{/if}
	</Panel>
{/if}
</Page>

<style>
	:global(.change-panel) { overflow: hidden; }
	.change-toolbar { display: flex; align-items: center; gap: 9px; border-bottom: 1px solid var(--color-line); padding: 11px 12px; background: var(--color-paper); }
	.change-toolbar :global(.change-search) { min-width: 260px; flex: 1; }
	.change-filter { width: 180px; flex: 0 0 auto; }
	.change-range { width: 220px; flex: 0 0 auto; }
	.day-divider { border-bottom: 1px solid var(--color-line); background: var(--color-paper); padding: 6px 17px; color: var(--color-subtle); font-family: var(--font-mono); font-size: 8px; text-transform: uppercase; }
	.change-row { display: grid; grid-template-columns: 58px 18px minmax(0,1fr) auto; align-items: center; gap: 9px; border-bottom: 1px solid var(--color-line); padding: 13px 17px; }.change-row:last-child { border: 0; }.change-time { color: var(--color-subtle); font-family: var(--font-mono); font-size: 8px; }.change-mark { position: relative; display: grid; height: 28px; place-items: center; }.change-mark::before { position: absolute; top: -20px; bottom: -20px; width: 1px; background: var(--color-line); content: ''; }.change-mark span { position: relative; z-index: 1; height: 7px; width: 7px; border: 2px solid white; border-radius: 50%; background: var(--color-access); box-shadow: 0 0 0 1px var(--color-access); }
	.change-copy strong { display: block; font-size: 10px; font-weight: 650; }.change-copy p { margin: 4px 0 0; color: var(--color-muted); font-size: 9px; }.change-copy p span { color: var(--color-ink); }.change-meta { display: flex; align-items: center; gap: 8px; }.change-meta code { color: var(--color-subtle); font-size: 8px; }
	@media (max-width: 650px) { .change-toolbar { align-items: stretch; flex-direction: column; }.change-toolbar :global(.change-search) { min-width: 0; }.change-range, .change-filter { width: auto; }.change-row { grid-template-columns: 45px 14px 1fr; }.change-meta { display: none; } }
</style>
