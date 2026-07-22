<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { cubicOut } from 'svelte/easing';
	import { SvelteSet } from 'svelte/reactivity';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		buildSegments,
		getActiveSummary,
		getBatchHeadline,
		getBatchStartedAtMs,
		getCellCase,
		getCellPayload,
		getCellStartedAtMs,
		getSegmentKey,
		getStepLabel,
		isCellExecuting,
		type CellLike,
		type Segment
	} from '$lib/cells';
	import CellDetail from '$lib/components/CellDetail.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import QuestionsCell from '$lib/components/QuestionsCell.svelte';
	import RunningDuration from '$lib/components/RunningDuration.svelte';
	import ThinkingCell from '$lib/components/ThinkingCell.svelte';
	import UnicodeSpinner from '$lib/components/UnicodeSpinner.svelte';
	import {
		cellOpensInPreviewPanel,
		previewItemsFromCell,
		previewPanel
	} from '$lib/previewPanel.svelte';
	import { prefersReducedMotion } from '$lib/utils';

	/** Height + opacity so expand/collapse feels soft, not a hard cut. */
	function softSlide(
		node: Element,
		{ duration = 220 }: { duration?: number } = {}
	): TransitionConfig {
		if (prefersReducedMotion()) return { duration: 0 };

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

	let {
		cells,
		streaming = false,
		onAnswered
	}: { cells: CellLike[]; streaming?: boolean; onAnswered?: () => void } = $props();

	// ChatPage's upsertAssistantCell reassigns the cells array on every stream
	// snapshot, so array identity alone invalidates this derived.
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

	function openPreview(cell: CellLike) {
		const items = previewItemsFromCell(cell);
		if (items.length === 0) return;
		for (const item of items) previewPanel.openItem(item);
		previewPanel.select(items[0].id);
	}

	function onStepClick(cell: CellLike, sKey: string) {
		if (cellOpensInPreviewPanel(cell)) {
			openPreview(cell);
			return;
		}
		toggleStep(sKey);
	}

	function isAssetStepOpen(cell: CellLike): boolean {
		if (!previewPanel.open) return false;
		const items = previewItemsFromCell(cell);
		return items.some((item) => item.id === previewPanel.selectedId);
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
				{@const live = active && !segment.cell.complete}
				<div class="assistant-block">
					<Markdown
						renderedHtml={live ? '' : assistantHtml(segment.cell)}
						content={assistantText(segment.cell)}
					/>
				</div>
			{:else if segment.type === 'questions'}
				<QuestionsCell cell={segment.cell} {onAnswered} />
			{:else}
				{@const open = expandedBatches.has(key)}
				{@const batchRunning = segment.cells.some((cell) =>
					isCellExecuting(cell, active)
				)}
				{@const liveThoughts = active
					? segment.cells.filter(
							(cell) =>
								getCellCase(cell) === 'thinkingCell' &&
								isCellExecuting(cell, true)
						)
					: []}
				<div class="segment">
					<button
						type="button"
						class="batch-header"
						aria-expanded={open}
						onclick={() => toggleBatch(key)}
					>
						<span class="batch-summary" class:shimmer={batchRunning}>
							{batchLabel(segment.cells, batchRunning)}
						</span>
						{#if batchRunning}
							<span class="batch-status">
								<UnicodeSpinner label="Running tools" />
								<RunningDuration startedAtMs={getBatchStartedAtMs(segment.cells)} />
							</span>
						{/if}
						<ChevronRight
							size={14}
							class={['batch-chevron', open && 'open']}
						/>
					</button>

					{#if liveThoughts.length > 0 && !open}
						<div class="live-thoughts">
							{#each liveThoughts as thought (thought.id)}
								<ThinkingCell cell={thought} active />
							{/each}
						</div>
					{/if}

					{#if open}
						<div class="batch-steps" transition:softSlide>
							{#each segment.cells as cell, cellIdx (cell.id || `${getCellCase(cell)}:${cellIdx}`)}
								{@const sKey = stepKey(key, cell, cellIdx)}
								{@const stepOpen = expandedSteps.has(sKey)}
								{@const isThought = getCellCase(cell) === 'thinkingCell'}
								{@const isAsset = cellOpensInPreviewPanel(cell)}
								{@const running = isCellExecuting(cell, active)}
								<div class="step">
									{#if isThought && running}
										<ThinkingCell {cell} active />
									{:else}
										<button
											type="button"
											class="step-header"
											class:tool-step={!isThought}
											aria-expanded={isAsset ? isAssetStepOpen(cell) : stepOpen}
											onclick={() => onStepClick(cell, sKey)}
										>
											<span class="step-label">{getStepLabel(cell, active)}</span>
											<span class="step-trailing">
												{#if running}
													<RunningDuration
														startedAtMs={getCellStartedAtMs(cell)}
													/>
												{/if}
												{#if isAsset}
													<span class="step-open-label">Open</span>
												{/if}
												<ChevronRight
													size={12}
													class={['step-chevron', !isAsset && stepOpen && 'open']}
												/>
											</span>
										</button>
										{#if stepOpen && !isAsset}
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

	.live-thoughts {
		padding: 2px 0 4px 8px;
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

	.batch-status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
		margin-left: 4px;
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

	/* .shimmer comes from app.css */

	@media (prefers-reduced-motion: reduce) {
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

	.step-trailing {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
		margin-left: auto;
	}

	.step-open-label {
		color: #a1a1aa;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.step-header:hover .step-open-label {
		color: #52525b;
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
