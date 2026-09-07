<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	let {
		page = $bindable(0),
		pageCount,
		total,
		/** Rows visible on the current page, for the "1–6 of 35" readout. */
		shown,
		perPage
	}: {
		page?: number;
		pageCount: number;
		total: number;
		shown: number;
		perPage: number;
	} = $props();

	const start = $derived(page * perPage);
</script>

{#if pageCount > 1}
	<div class="pager">
		<button type="button" onclick={() => (page -= 1)} disabled={page === 0} aria-label="Previous page">
			<ChevronLeft size={13} />
		</button>
		<span>{start + 1}–{start + shown} of {total}</span>
		<button type="button" onclick={() => (page += 1)} disabled={page >= pageCount - 1} aria-label="Next page">
			<ChevronRight size={13} />
		</button>
	</div>
{/if}

<style>
	.pager { display: flex; align-items: center; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--color-line); padding: 7px 18px; color: var(--color-muted); font-family: var(--font-mono); font-size: 9px; }
	.pager button { display: grid; height: 20px; width: 20px; place-items: center; border: 1px solid var(--color-line); border-radius: 5px; background: var(--color-elevate); color: var(--color-ink); cursor: pointer; }
	.pager button:disabled { color: var(--color-line); cursor: default; }
</style>
