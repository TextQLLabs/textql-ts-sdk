<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import type { TableColumn } from './types';

	let {
		columns,
		items,
		key,
		row,
		empty
	}: {
		columns: TableColumn[];
		items: T[];
		key: (item: T) => string | number;
		/** Renders the <td> cells for one item — one per column, in order. */
		row: Snippet<[T]>;
		empty?: Snippet;
	} = $props();
</script>

<div class="table-wrap">
	<table>
		<thead>
			<tr>
				{#each columns as column (column.label)}
					<th style:width={column.width} style:text-align={column.align ?? 'left'}>{column.label}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each items as item (key(item))}
				<tr>{@render row(item)}</tr>
			{/each}
		</tbody>
	</table>
	{#if !items.length && empty}{@render empty()}{/if}
</div>

<style>
	.table-wrap { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; text-align: left; font-size: 11px; }
	thead { border-bottom: 1px solid var(--color-line); background: var(--color-paper); }
	th { padding: 8px 13px; color: var(--color-subtle); font-size: 8.5px; font-weight: 680; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; }
	tbody :global(tr) { border-bottom: 1px solid var(--color-line); vertical-align: top; }
	tbody :global(tr:last-child) { border: 0; }
	tbody :global(td) { padding: 9px 13px; }
</style>
