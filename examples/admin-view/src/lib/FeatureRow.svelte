<script lang="ts">
	import { AlertTriangle, ChevronDown } from '@lucide/svelte';
	import { slide } from 'svelte/transition';

	import { requestsFor } from '$lib/curl';
	import Snippet from '$lib/Snippet.svelte';
	import {
		MECHANISM_BLURBS,
		MECHANISM_LABELS,
		mechanismOf,
		readMode,
		readSource,
		sourceLabel,
		type CellState,
		type FeatureRow
	} from '$lib/features';

	let {
		row,
		organization,
		serverUrl,
		orgId,
		expandAll = false
	}: {
		row: FeatureRow;
		organization: Record<string, unknown> | undefined;
		serverUrl: string;
		orgId: string;
		expandAll?: boolean;
	} = $props();

	let openedByUser = $state(false);
	const expanded = $derived(expandAll || openedByUser);

	const available = $derived(readSource(row.available, organization));
	const defaultCell = $derived(readSource(row.default, organization));
	const mechanism = $derived(mechanismOf(row));
	const modeIsNew = $derived(row.mode ? readMode(row.mode, organization) : null);

	/** Snippets flip whatever the current state is, so they are useful by default. */
	const snippets = $derived(
		requestsFor(
			row,
			organization,
			serverUrl,
			orgId,
			available.kind !== 'on',
			defaultCell.kind !== 'on'
		)
	);

	const MECHANISM_STYLES = {
		'tool-layer': 'bg-info-bg text-info',
		'org-column': 'bg-paper text-muted',
		'feature-flag': 'bg-warn-bg text-warn'
	} as const;

	/** Available off dims the row, matching the product page. */
	const off = $derived(available.kind === 'off');
</script>

{#snippet cell(state: CellState)}
	<div class="flex w-24 flex-shrink-0 items-center justify-center">
		{#if state.kind === 'dash'}
			<span class="text-line select-none" aria-hidden="true">—</span>
		{:else if state.kind === 'unknown'}
			<span class="text-muted text-[11px]">?</span>
		{:else if state.kind === 'value'}
			<span class="text-ink font-mono text-[11px]">{state.text}</span>
		{:else}
			<!-- Read-only pill rather than a switch: this view never writes. -->
			<span
				class="rounded-sm px-2 py-0.5 text-[11px] font-medium
					{state.kind === 'on' ? 'bg-ok-bg text-ok' : 'bg-paper text-muted'}"
			>
				{state.kind === 'on' ? 'On' : 'Off'}
			</span>
		{/if}
	</div>
{/snippet}

<div class="border-line border-b last:border-0">
	<div class="flex items-center gap-4 px-2 py-3">
		<button
			type="button"
			onclick={() => (openedByUser = !expanded)}
			class="flex min-w-0 flex-1 items-start gap-2 text-left"
			aria-expanded={expanded}
		>
			<ChevronDown
				size={14}
				class="text-muted mt-0.5 shrink-0 transition-transform {expanded ? 'rotate-180' : ''}"
			/>
			<div class="min-w-0 flex-1 {off ? 'opacity-50' : ''}">
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-ink text-[13px] font-medium">{row.name}</span>
					{#if row.badge}
						<span class="bg-info-bg text-info rounded-sm px-1.5 text-[10px] font-semibold uppercase">
							{row.badge}
						</span>
					{/if}
					{#if row.mode}
						<!-- Old / New experience selector, read-only. -->
						<span class="border-line flex items-center gap-0.5 rounded-sm border p-0.5">
							{#each [[false, row.mode.oldLabel], [true, row.mode.newLabel]] as [isNew, label] (label)}
								<span
									class="rounded-sm px-1.5 py-0.5 text-[10px] font-medium
										{modeIsNew === isNew ? 'bg-info-bg text-info' : 'text-muted'}"
								>
									{label}
								</span>
							{/each}
						</span>
					{/if}
					{#if row.caveat}
						<AlertTriangle size={12} class="text-warn shrink-0" />
					{/if}
				</div>
				<p class="text-muted mt-0.5 text-xs leading-relaxed">{row.description}</p>
			</div>
		</button>

		<span
			class="w-24 flex-shrink-0 rounded-sm px-1.5 py-0.5 text-center text-[10px] font-medium {MECHANISM_STYLES[
				mechanism
			]}"
			title={MECHANISM_BLURBS[mechanism]}
		>
			{MECHANISM_LABELS[mechanism]}
		</span>

		{@render cell(available)}
		{@render cell(defaultCell)}
	</div>

	{#if expanded}
		<div transition:slide={{ duration: 140 }} class="bg-paper space-y-2.5 px-8 py-3 text-xs">
			<p class="text-muted max-w-3xl leading-relaxed">{row.details}</p>

			{#if row.mode}
				<p class="text-muted leading-relaxed">
					<span class="text-ink font-medium">{row.mode.oldLabel} / {row.mode.newLabel}.</span>
					{row.mode.note}
				</p>
			{/if}

			{#if row.hiddenWhen}
				<p class="text-muted leading-relaxed">
					<span class="text-ink font-medium">Sometimes hidden.</span>
					{row.hiddenWhen}
				</p>
			{/if}

			{#if row.caveat}
				<p class="text-warn flex items-start gap-1.5 leading-relaxed">
					<AlertTriangle size={12} class="mt-0.5 shrink-0" />
					<span>{row.caveat}</span>
				</p>
			{/if}

			<p class="text-muted leading-relaxed">
				<span class="text-ink font-medium">{MECHANISM_LABELS[mechanism]}.</span>
				{MECHANISM_BLURBS[mechanism]}
			</p>

			<dl class="text-muted grid gap-x-4 gap-y-1 font-mono text-[11px] sm:grid-cols-[80px_1fr]">
				<dt>Available</dt>
				<dd class="text-ink">{sourceLabel(row.available)}</dd>
				<dt>Default</dt>
				<dd class="text-ink">{sourceLabel(row.default)}</dd>
				<dt>Stored in</dt>
				<dd class="text-ink">{row.storage}</dd>
			</dl>

			{#if snippets.length}
				<div class="space-y-2 pt-1">
					<p class="text-muted text-[11px]">
						Requests below flip the current value. <code>$TEXTQL_API_KEY</code> is read from your
						shell.
					</p>
					{#each snippets as snippet (snippet.title)}
						<Snippet {snippet} />
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
