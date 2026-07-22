<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { cubicOut } from 'svelte/easing';
	import { SvelteSet } from 'svelte/reactivity';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		buildSegments,
		getActiveSummary,
		getBatchHeadline,
		getCellCase,
		getCellPayload,
		getSegmentKey,
		getStepLabel,
		getUniqueToolIcons,
		type CellLike,
		type Segment
	} from '$lib/cells';
	import CellDetail from '$lib/components/CellDetail.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import UnicodeSpinner from '$lib/components/UnicodeSpinner.svelte';

	/** Height + opacity so expand/collapse feels soft, not a hard cut. */
	function softSlide(
		node: Element,
		{ duration = 220 }: { duration?: number } = {}
	): TransitionConfig {
		const reduced =
			typeof matchMedia !== 'undefined' &&
			matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) return { duration: 0 };

		const style = getComputedStyle(node);
		const opacity = +style.opacity;
		const height = node.getBoundingClientRect().height;
		const paddingTop = parseFloat(style.paddingTop) || 0;
		const paddingBottom = parseFloat(style.paddingBottom) || 0;

		return {
			duration,
			easing: cubicOut,
			css: (t) =>
				`overflow: hidden;` +
				`opacity: ${t * opacity};` +
				`height: ${t * height}px;` +
				`padding-top: ${t * paddingTop}px;` +
				`padding-bottom: ${t * paddingBottom}px;`
		};
	}

	let { cells, streaming = false }: { cells: CellLike[]; streaming?: boolean } = $props();

	const segments = $derived(buildSegments(cells));
	/** Batches stay collapsed until the user clicks. */
	const expandedBatches = new SvelteSet<string>();
	/** Nested step detail inside an open batch. */
	const expandedSteps = new SvelteSet<string>();

	function toggleBatch(key: string) {
		if (expandedBatches.has(key)) {
			expandedBatches.delete(key);
		} else {
			expandedBatches.add(key);
		}
	}

	function toggleStep(key: string) {
		if (expandedSteps.has(key)) {
			expandedSteps.delete(key);
		} else {
			expandedSteps.add(key);
		}
	}

	/** A segment is live while it has incomplete cells, or is the trailing segment mid-stream. */
	function isSegmentActive(segment: Segment, index: number): boolean {
		if (!streaming) return false;
		if (index === segments.length - 1) return true;
		const segCells = segment.type === 'toolgroup' ? segment.cells : [segment.cell];
		return segCells.some((cell) => !cell.complete);
	}

	function assistantHtml(cell: CellLike): string {
		const payload = getCellPayload(cell);
		return typeof payload.renderedHtml === 'string' ? payload.renderedHtml : '';
	}

	function assistantText(cell: CellLike): string {
		const payload = getCellPayload(cell);
		return typeof payload.content === 'string' ? payload.content : '';
	}

	function batchLabel(cells: CellLike[], active: boolean): string {
		if (active) return getActiveSummary(cells);
		return getBatchHeadline(cells);
	}

	function stepKey(batchKey: string, cell: CellLike, idx: number): string {
		return `${batchKey}:${cell.id || idx}`;
	}

	function thoughtContent(cell: CellLike): string {
		const payload = getCellPayload(cell);
		if (payload.redacted === true) return '_Thinking (redacted)_';
		return typeof payload.content === 'string' ? payload.content : '';
	}
</script>

{#if segments.length === 0}
	{#if streaming}
		<UnicodeSpinner class="streaming-indicator" label="Waiting for response" />
	{/if}
{:else}
	<div class="tool-sequence">
		{#each segments as segment, segIdx (getSegmentKey(segment, segIdx))}
			{@const key = getSegmentKey(segment, segIdx)}
			{@const active = isSegmentActive(segment, segIdx)}

			{#if segment.type === 'assistant'}
				<div class="assistant-block">
					<Markdown
						renderedHtml={assistantHtml(segment.cell)}
						content={assistantText(segment.cell)}
					/>
				</div>
			{:else}
				{@const icons = getUniqueToolIcons(segment.cells)}
				{@const open = expandedBatches.has(key)}
				<div class="segment">
					<button
						type="button"
						class="batch-header"
						aria-expanded={open}
						onclick={() => toggleBatch(key)}
					>
						{#if active && segment.cells.some((cell) => !cell.complete)}
							<UnicodeSpinner label="Running tools" />
						{:else if icons.length > 0}
							<span class="icon-stack">
								{#each icons.slice(0, 3) as iconInfo (iconInfo.key)}
									{@const Icon = iconInfo.icon}
									<span class="icon-chip"><Icon size={13} /></span>
								{/each}
								{#if icons.length > 3}
									<span class="icon-chip icon-more">+{icons.length - 3}</span>
								{/if}
							</span>
						{/if}
						<span class="batch-summary" class:shimmer={active}>
							{batchLabel(segment.cells, active)}
						</span>
						<ChevronRight
							size={14}
							class={['batch-chevron', open && 'open']}
						/>
					</button>

					{#if open}
						<div class="batch-steps" transition:softSlide>
							{#each segment.cells as cell, cellIdx (cell.id || `${getCellCase(cell)}:${cellIdx}`)}
								{@const sKey = stepKey(key, cell, cellIdx)}
								{@const stepOpen = expandedSteps.has(sKey)}
								{@const isThought = getCellCase(cell) === 'thinkingCell'}
								<div class="step">
									<button
										type="button"
										class="step-header"
										class:tool-step={!isThought}
										aria-expanded={stepOpen}
										onclick={() => toggleStep(sKey)}
									>
										<span class="step-label">{getStepLabel(cell)}</span>
										<ChevronRight
											size={12}
											class={['step-chevron', stepOpen && 'open']}
										/>
									</button>
									{#if stepOpen}
										<div class="step-detail" transition:softSlide>
											{#if isThought}
												<div class="thought-body">
													<Markdown content={thoughtContent(cell)} />
												</div>
											{:else}
												<CellDetail {cell} />
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.tool-sequence {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.assistant-block {
		padding: 2px 0;
	}

	.segment {
		border-radius: var(--radius-sm, 8px);
	}

	.batch-header {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 5px 8px;
		border: 0;
		border-radius: var(--radius-sm, 8px);
		background: color-mix(in srgb, var(--color-ink) 3.5%, transparent);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.batch-header:hover {
		background: color-mix(in srgb, var(--color-ink) 6%, transparent);
	}

	.icon-stack {
		display: flex;
		flex-shrink: 0;
		align-items: center;
	}

	.icon-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 999px;
		margin-left: -6px;
		color: #52525b;
		background: color-mix(in srgb, var(--color-ink) 6%, #fff);
		box-shadow: 0 0 0 2px var(--color-paper);
	}

	.icon-chip:first-child {
		margin-left: 0;
	}

	.icon-more {
		color: var(--color-muted);
		font-size: 10px;
		font-weight: 600;
	}

	.batch-summary {
		overflow: hidden;
		min-width: 0;
		flex: 1;
		color: var(--color-muted);
		font-size: 13px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.batch-header :global(.batch-chevron),
	.step-header :global(.step-chevron) {
		flex-shrink: 0;
		color: #a1a1aa;
		transition: transform 0.15s ease;
	}

	.batch-header :global(.batch-chevron.open),
	.step-header :global(.step-chevron.open) {
		transform: rotate(90deg);
	}

	.shimmer {
		background: linear-gradient(90deg, #a1a1aa 25%, #3f3f46 50%, #a1a1aa 75%);
		background-size: 200% 100%;
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		animation: shimmer 1.6s linear infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shimmer {
			background: none;
			-webkit-text-fill-color: currentColor;
			animation: none;
		}

		.batch-header :global(.batch-chevron),
		.step-header :global(.step-chevron) {
			transition: none;
		}
	}

	.batch-steps {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 4px 0 2px 8px;
	}

	.step-header {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		max-width: 100%;
		padding: 4px 6px;
		border: 0;
		border-radius: 6px;
		background: transparent;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	/* Tools span the row so the chevron sits on the right of the label. */
	.step-header.tool-step {
		display: flex;
		width: 100%;
	}

	.step-header:hover {
		background: transparent;
	}

	.step-header:hover .step-label {
		color: #52525b;
	}

	.step-label {
		flex: 0 1 auto;
		min-width: 0;
		overflow: hidden;
		color: #a1a1aa;
		font-size: 12.5px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.step-header.tool-step .step-label {
		flex: 1;
	}

	.step-header.tool-step :global(.step-chevron) {
		margin-left: auto;
	}

	.step-detail {
		padding: 2px 6px 8px 4px;
	}

	.thought-body {
		padding-left: 2px;
		color: #a1a1aa;
		font-size: 12.5px;
		line-height: 1.55;
	}

	.thought-body :global(.md),
	.thought-body :global(.md-plain) {
		color: #a1a1aa;
		font-size: 12.5px;
		line-height: 1.55;
	}

	.thought-body :global(.md p) {
		margin: 0 0 0.45em;
	}

	.thought-body :global(.md p:last-child) {
		margin-bottom: 0;
	}

	.thought-body :global(.md code) {
		font-size: 0.92em;
	}
</style>
