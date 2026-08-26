<script lang="ts">
	import { CalendarDays, Download, Filter, History, Search } from '@lucide/svelte';

	import ConnectionEmpty from '$lib/ConnectionEmpty.svelte';
	import { Button, Page } from '$lib/primitives';

	let { data } = $props();
	const admin = $derived(data.admin);
	let query = $state('');
	let category = $state('all');

	const categories = $derived([...new Set(admin.changes.map((change) => change.category))].sort());
	const changes = $derived(
		admin.changes.filter((change) => {
			if (category !== 'all' && change.category !== category) return false;
			const needle = query.trim().toLowerCase();
			return !needle || `${change.actor} ${change.action} ${change.resourceType} ${change.resourceId ?? ''}`.toLowerCase().includes(needle);
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
	<section class="panel change-panel">
		<div class="change-toolbar">
			<div class="change-search"><Search size={14} /><input bind:value={query} placeholder="Search actor, action, or resource" /></div>
			<label><Filter size={13} /><select bind:value={category}><option value="all">All categories</option>{#each categories as item}<option value={item}>{item}</option>{/each}</select></label>
			<label><CalendarDays size={13} /><span>All time</span></label>
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
						<div class="change-meta"><span class="badge neutral">{change.category}</span>{#if change.authMethod}<code>{change.authMethod}</code>{/if}</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="change-empty"><div class="empty-state-icon"><History size={19} /></div><strong>No matching events</strong><span>Adjust the search or category filter.</span></div>
		{/if}
	</section>
{/if}
</Page>

<style>
	.change-panel { overflow: hidden; }
	.change-toolbar { display: flex; align-items: center; gap: 9px; border-bottom: 1px solid var(--color-line); padding: 11px 12px; background: var(--color-paper); }
	.change-search { display: flex; min-width: 260px; flex: 1; align-items: center; gap: 8px; border: 1px solid var(--color-line); border-radius: 7px; background: white; padding: 7px 9px; color: var(--color-subtle); }.change-search input { width: 100%; border: 0; outline: 0; font-size: 10px; }
	.change-toolbar label { display: flex; align-items: center; gap: 6px; border: 1px solid var(--color-line); border-radius: 7px; background: white; padding: 7px 9px; color: var(--color-muted); font-size: 9px; }.change-toolbar select { border: 0; outline: 0; background: transparent; color: var(--color-muted); font-size: 9px; }
	.day-divider { border-bottom: 1px solid var(--color-line); background: var(--color-paper); padding: 6px 17px; color: var(--color-subtle); font-family: var(--font-mono); font-size: 8px; text-transform: uppercase; }
	.change-row { display: grid; grid-template-columns: 58px 18px minmax(0,1fr) auto; align-items: center; gap: 9px; border-bottom: 1px solid var(--color-line); padding: 13px 17px; }.change-row:last-child { border: 0; }.change-time { color: var(--color-subtle); font-family: var(--font-mono); font-size: 8px; }.change-mark { position: relative; display: grid; height: 28px; place-items: center; }.change-mark::before { position: absolute; top: -20px; bottom: -20px; width: 1px; background: var(--color-line); content: ''; }.change-mark span { position: relative; z-index: 1; height: 7px; width: 7px; border: 2px solid white; border-radius: 50%; background: var(--color-access); box-shadow: 0 0 0 1px var(--color-access); }
	.change-copy strong { display: block; font-size: 10px; font-weight: 650; }.change-copy p { margin: 4px 0 0; color: var(--color-muted); font-size: 9px; }.change-copy p span { color: var(--color-ink); }.change-meta { display: flex; align-items: center; gap: 8px; }.change-meta code { color: var(--color-subtle); font-size: 8px; }
	.change-empty { display: grid; place-items: center; padding: 54px; text-align: center; }.change-empty strong, .change-empty span { display: block; }.change-empty strong { font-size: 12px; }.change-empty span { margin-top: 4px; color: var(--color-muted); font-size: 10px; }
	@media (max-width: 650px) { .change-toolbar { align-items: stretch; flex-direction: column; }.change-search { min-width: 0; }.change-row { grid-template-columns: 45px 14px 1fr; }.change-meta { display: none; } }
</style>
