<script lang="ts">
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import PanelRightClose from '@lucide/svelte/icons/panel-right-close';
	import X from '@lucide/svelte/icons/x';
	import { cubicOut } from 'svelte/easing';
	import type { TransitionConfig } from 'svelte/transition';
	import {
		clampPreviewWidth,
		previewPanel,
		type PreviewItem
	} from '$lib/previewPanel.svelte';
	import { toEmbeddablePreviewUrl } from '$lib/previewUrl';
	import Markdown from '$lib/components/Markdown.svelte';
	import PierreCode from '$lib/components/PierreCode.svelte';

	const item = $derived(previewPanel.selected);
	const tabs = $derived(previewPanel.tabs);
	const embedUrl = $derived(toEmbeddablePreviewUrl(item?.url));

	let panelEl: HTMLElement | undefined = $state();
	const resizing = $derived(previewPanel.resizing);

	/** Animate width so chat reflows with the drawer (fly alone would snap the grid). */
	function drawerSlide(
		_node: HTMLElement,
		{ duration = 220 }: { duration?: number } = {}
	): TransitionConfig {
		const width = previewPanel.width;
		return {
			duration,
			easing: cubicOut,
			css: (t) => {
				const w = Math.max(0, width * t);
				return `width:${w}px;min-width:${w}px;max-width:${w}px;overflow:hidden;opacity:${0.88 + 0.12 * t}`;
			}
		};
	}

	function typeLabel(previewType: string): string {
		if (!previewType) return 'File';
		return previewType.charAt(0).toUpperCase() + previewType.slice(1);
	}

	function isImage(preview: PreviewItem): boolean {
		const t = preview.previewType.toLowerCase();
		return t === 'image' || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(preview.url ?? '');
	}

	/** Charts / HTML / echarts — always iframe, never navigate or download. */
	function isHtmlEmbed(preview: PreviewItem): boolean {
		const t = preview.previewType.toLowerCase();
		if (
			t === 'html' ||
			t === 'chart' ||
			t === 'echarts' ||
			t === 'plotly' ||
			t === 'vega' ||
			t === 'visualization' ||
			t === 'iframe' ||
			t === 'app'
		) {
			return true;
		}
		return /\.html?(\?|$)/i.test(preview.url ?? '');
	}

	function isPdf(preview: PreviewItem): boolean {
		const t = preview.previewType.toLowerCase();
		return t === 'pdf' || /\.pdf(\?|$)/i.test(preview.url ?? '');
	}

	function isTable(preview: PreviewItem): boolean {
		const t = preview.previewType.toLowerCase();
		return t === 'table' || t === 'dataframe' || t === 'csv';
	}

	function shouldIframe(preview: PreviewItem): boolean {
		if (!embedUrl) return false;
		if (isImage(preview) || isTable(preview)) return false;
		if (isHtmlEmbed(preview) || isPdf(preview)) return true;
		// Unknown typed URL on the preview proxy — embed rather than <a download>.
		return Boolean(embedUrl.startsWith('/asset/') || embedUrl.startsWith('/api/preview-proxy'));
	}

	function onResizePointerDown(event: PointerEvent) {
		if (event.button !== 0) return;
		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		previewPanel.resizing = true;

		const workspace = panelEl?.closest('.workspace') as HTMLElement | null;

		const startX = event.clientX;
		const startW = previewPanel.width;
		let latestX = startX;
		let latestW = startW;
		let raf = 0;

		const flush = () => {
			raf = 0;
			latestW = clampPreviewWidth(startW + (startX - latestX));
			// Direct CSS var — skip Svelte width state until pointerup
			workspace?.style.setProperty('--preview-panel-width', `${latestW}px`);
		};

		const onMove = (ev: PointerEvent) => {
			latestX = ev.clientX;
			if (!raf) raf = requestAnimationFrame(flush);
		};

		const onUp = () => {
			if (raf) cancelAnimationFrame(raf);
			flush();
			previewPanel.setWidth(latestW);
			previewPanel.commitWidth();
			previewPanel.resizing = false;
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			document.body.style.removeProperty('cursor');
			document.body.style.removeProperty('user-select');
		};

		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
	}

	function onTabClose(event: MouseEvent, id: string) {
		event.stopPropagation();
		event.preventDefault();
		previewPanel.closeTab(id);
	}
</script>

<aside
	bind:this={panelEl}
	class="preview-panel"
	class:resizing
	aria-label="Preview panel"
	transition:drawerSlide
>
	<button
		type="button"
		class="resize-handle"
		aria-label="Resize preview panel"
		onpointerdown={onResizePointerDown}
	></button>

	<header class="panel-head">
		<div class="tabs" role="tablist" aria-label="Open previews">
			{#each tabs as tab (tab.id)}
				<div class="tab" class:active={tab.id === item?.id} role="presentation">
					<button
						type="button"
						class="tab-main"
						role="tab"
						aria-selected={tab.id === item?.id}
						title={tab.name}
						onclick={() => previewPanel.select(tab.id)}
					>
						<span class="tab-name">{tab.name}</span>
						<span class="tab-type">{typeLabel(tab.previewType)}</span>
					</button>
					<button
						type="button"
						class="tab-close"
						aria-label="Close {tab.name}"
						onclick={(e) => onTabClose(e, tab.id)}
					>
						<X size={12} />
					</button>
				</div>
			{/each}
		</div>

		<button
			type="button"
			class="close-btn"
			aria-label="Close preview panel"
			onclick={() => previewPanel.close()}
		>
			<PanelRightClose size={16} />
		</button>
	</header>

	{#if item?.toolSummary}
		<p class="summary">{item.toolSummary}</p>
	{/if}

	<div class="panel-body">
		{#if !item}
			<p class="empty">No preview selected.</p>
		{:else if item.error}
			<p class="error">{item.error}</p>
		{:else if isImage(item) && embedUrl}
			<img class="preview-image" src={embedUrl} alt={item.name} />
		{:else if shouldIframe(item) && embedUrl}
			<iframe
				class="preview-frame"
				src={embedUrl}
				title={item.name}
				referrerpolicy="no-referrer"
			></iframe>
		{:else if isHtmlEmbed(item) && item.content}
			<iframe
				class="preview-frame"
				title={item.name}
				sandbox="allow-scripts allow-same-origin"
				srcdoc={item.content}
			></iframe>
		{:else if isTable(item) && item.content}
			<pre class="preview-table">{item.content}</pre>
		{:else if isTable(item) && embedUrl}
			<iframe
				class="preview-frame"
				src={embedUrl}
				title={item.name}
				referrerpolicy="no-referrer"
			></iframe>
		{:else if item.content}
			{#if item.previewType === 'markdown' || item.previewType === 'md'}
				<div class="preview-md">
					<Markdown content={item.content} />
				</div>
			{:else}
				<PierreCode
					fileName={item.name || 'preview.txt'}
					contents={item.content}
				/>
			{/if}
		{:else}
			<p class="empty">Nothing to preview yet.</p>
		{/if}
	</div>

	{#if item?.url}
		<footer class="panel-foot">
			<a
				class="open-external"
				href={toEmbeddablePreviewUrl(item.url) ?? item.url}
				target="_blank"
				rel="noreferrer noopener"
			>
				Open in new tab
				<ExternalLink size={12} />
			</a>
		</footer>
	{/if}
</aside>

<style>
	.preview-panel {
		position: relative;
		display: flex;
		/* Width set by ChatPage / drawerSlide transition / resize handle */
		min-width: 0;
		min-height: 0;
		flex-direction: column;
		border-left: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
		background: #fafafa;
	}

	.preview-panel.resizing {
		user-select: none;
	}

	/* Avoid iframe/layout thrash while dragging the splitter */
	.preview-panel.resizing .panel-body {
		pointer-events: none;
		contain: strict;
	}

	.preview-panel.resizing :global(iframe),
	.preview-panel.resizing :global(img) {
		pointer-events: none;
	}

	.resize-handle {
		position: absolute;
		top: 0;
		left: -4px;
		z-index: 4;
		width: 8px;
		height: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: col-resize;
		touch-action: none;
	}

	.resize-handle:hover,
	.preview-panel.resizing .resize-handle {
		background: color-mix(in srgb, var(--color-ink) 14%, transparent);
	}

	.panel-head {
		display: flex;
		align-items: stretch;
		gap: 4px;
		min-height: 36px;
		padding: 0 6px 0 0;
		border-bottom: 1px solid color-mix(in srgb, var(--color-line) 80%, transparent);
		background: #fff;
	}

	.tabs {
		display: flex;
		min-width: 0;
		flex: 1;
		align-items: stretch;
		overflow-x: auto;
		scrollbar-width: thin;
	}

	.tab {
		display: inline-flex;
		max-width: 200px;
		min-width: 88px;
		flex-shrink: 0;
		align-items: stretch;
		border-right: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
		color: #71717a;
		background: transparent;
	}

	.tab:hover {
		color: #52525b;
		background: color-mix(in srgb, var(--color-ink) 3%, transparent);
	}

	.tab.active {
		color: var(--color-ink);
		background: #fafafa;
		box-shadow: inset 0 -1px 0 var(--color-ink);
	}

	.tab-main {
		display: inline-flex;
		min-width: 0;
		flex: 1;
		align-items: center;
		gap: 5px;
		padding: 0 2px 0 10px;
		border: 0;
		color: inherit;
		background: transparent;
		font: inherit;
		cursor: pointer;
	}

	.tab-name {
		overflow: hidden;
		min-width: 0;
		flex: 1;
		font-size: 12px;
		font-weight: 550;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tab-type {
		display: none;
		color: #a1a1aa;
		font-size: 10px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.tab.active .tab-type {
		display: inline;
	}

	.tab-close {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		align-self: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		margin-right: 4px;
		padding: 0;
		border: 0;
		border-radius: 4px;
		color: #a1a1aa;
		background: transparent;
		opacity: 0;
		cursor: pointer;
	}

	.tab:hover .tab-close,
	.tab.active .tab-close,
	.tab-close:focus-visible {
		opacity: 1;
	}

	.tab-close:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-ink) 8%, transparent);
	}

	.close-btn {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		align-self: center;
		width: 28px;
		height: 28px;
		border: 0;
		border-radius: 7px;
		color: #71717a;
		background: transparent;
		cursor: pointer;
	}

	.close-btn:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-ink) 5%, transparent);
	}

	.summary {
		margin: 0;
		padding: 8px 14px;
		border-bottom: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
		color: #71717a;
		font-size: 12px;
		line-height: 1.4;
	}

	.panel-body {
		flex: 1;
		min-height: 0;
		overflow: auto;
		padding: 12px;
	}

	.empty,
	.error {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
	}

	.empty {
		color: #a1a1aa;
	}

	.error {
		color: #dc2626;
		white-space: pre-wrap;
	}

	.preview-image {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid var(--color-line);
		border-radius: 8px;
		background: #fff;
	}

	.preview-frame {
		width: 100%;
		height: min(70vh, 640px);
		border: 1px solid var(--color-line);
		border-radius: 8px;
		background: #fff;
	}

	.preview-table {
		margin: 0;
		overflow: auto;
		padding: 10px 12px;
		border: 1px solid var(--color-line);
		border-radius: 8px;
		background: #fff;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 11.5px;
		line-height: 1.45;
		white-space: pre;
	}

	.preview-md {
		padding: 4px 2px;
	}

	.open-external {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #2563eb;
		font-size: 13px;
		font-weight: 500;
		text-decoration: none;
	}

	.open-external:hover {
		text-decoration: underline;
	}

	.panel-foot {
		padding: 10px 14px;
		border-top: 1px solid color-mix(in srgb, var(--color-line) 80%, transparent);
		background: #fff;
	}
</style>
