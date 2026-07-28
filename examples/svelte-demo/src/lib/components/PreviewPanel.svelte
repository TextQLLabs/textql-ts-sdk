<script lang="ts">
	import ExternalLink from "@lucide/svelte/icons/external-link";
	import PanelRightClose from "@lucide/svelte/icons/panel-right-close";
	import X from "@lucide/svelte/icons/x";
	import { cubicOut } from "svelte/easing";
	import type { TransitionConfig } from "svelte/transition";
	import {
		clampPreviewWidth,
		guessPreviewType,
		previewPanel,
		type PreviewItem,
	} from "$lib/previewPanel.svelte";
	import { toEmbeddablePreviewUrl } from "$lib/previewUrl";
	import { withChartFitShim } from "$lib/chartFitShim";
	import Markdown from "$lib/components/Markdown.svelte";
	import PierreCode from "$lib/components/PierreCode.svelte";

	/** Chart-ish embeds we want to force-fit (not interactive data-apps). */
	const CHART_TYPES = new Set([
		"chart",
		"echarts",
		"plotly",
		"vega",
		"visualization",
	]);

	const item = $derived(previewPanel.selected);
	const tabs = $derived(previewPanel.tabs);
	const rawEmbedUrl = $derived(toEmbeddablePreviewUrl(item?.url));
	const isChart = $derived(item ? CHART_TYPES.has(previewKind(item)) : false);
	// For proxied chart URLs, ask the proxy to inject the fit shim.
	const embedUrl = $derived(
		isChart && rawEmbedUrl?.startsWith("/api/preview-proxy")
			? `${rawEmbedUrl}&fit=chart`
			: rawEmbedUrl,
	);

	let panelEl: HTMLElement | undefined = $state();
	const resizing = $derived(previewPanel.resizing);

	const CHART_W_DEFAULT = 1100;
	const CHART_H_DEFAULT = 720;
	let chartFitW = $state(0); // panel content width (the wrapper)
	let chartNatW = $state(CHART_W_DEFAULT); // chart's reported natural width
	let chartNatH = $state(CHART_H_DEFAULT); // chart's reported natural height
	const chartScale = $derived(
		chartFitW > 0 ? Math.min(1, chartFitW / chartNatW) : 1,
	);

	// Reset to defaults when the shown item changes; the iframe re-reports.
	$effect(() => {
		item?.id;
		chartNatW = CHART_W_DEFAULT;
		chartNatH = CHART_H_DEFAULT;
	});

	// Receive the natural chart size from the injected shim.
	$effect(() => {
		function onMessage(event: MessageEvent) {
			const d = event.data;
			if (
				d &&
				typeof d === "object" &&
				d.__chartFit &&
				d.w > 0 &&
				d.h > 0
			) {
				chartNatW = d.w;
				chartNatH = d.h;
			}
		}
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	});

	/** Animate width so chat reflows with the drawer (fly alone would snap the grid). */
	function drawerSlide(
		_node: HTMLElement,
		{ duration = 220 }: { duration?: number } = {},
	): TransitionConfig {
		const width = previewPanel.width;
		return {
			duration,
			easing: cubicOut,
			css: (t) => {
				const w = Math.max(0, width * t);
				return `width:${w}px;min-width:${w}px;max-width:${w}px;overflow:hidden;opacity:${0.88 + 0.12 * t}`;
			},
		};
	}

	function typeLabel(previewType: string): string {
		if (!previewType) return "File";
		return previewType.charAt(0).toUpperCase() + previewType.slice(1);
	}

	/** Charts / HTML / echarts — always iframe, never navigate or download. */
	const HTML_EMBED_TYPES = new Set([
		"html",
		"chart",
		"echarts",
		"plotly",
		"vega",
		"visualization",
		"iframe",
		"app",
	]);
	const TABLE_TYPES = new Set(["table", "dataframe", "csv"]);

	/** Trust a recognized declared type; otherwise sniff the URL extension. */
	function previewKind(preview: PreviewItem): string {
		const t = preview.previewType.toLowerCase();
		if (
			t === "image" ||
			t === "pdf" ||
			HTML_EMBED_TYPES.has(t) ||
			TABLE_TYPES.has(t)
		) {
			return t;
		}
		return guessPreviewType(preview.url ?? "", t || "file");
	}

	function isImage(preview: PreviewItem): boolean {
		return previewKind(preview) === "image";
	}

	function isHtmlEmbed(preview: PreviewItem): boolean {
		return HTML_EMBED_TYPES.has(previewKind(preview));
	}

	function isPdf(preview: PreviewItem): boolean {
		return previewKind(preview) === "pdf";
	}

	function isTable(preview: PreviewItem): boolean {
		return TABLE_TYPES.has(previewKind(preview));
	}

	function shouldIframe(preview: PreviewItem): boolean {
		if (!embedUrl) return false;
		if (isImage(preview) || isTable(preview)) return false;
		if (isHtmlEmbed(preview) || isPdf(preview)) return true;
		// Unknown typed URL on the preview proxy — embed rather than <a download>.
		return Boolean(
			embedUrl.startsWith("/asset/") ||
				embedUrl.startsWith("/api/preview-proxy"),
		);
	}

	function onResizePointerDown(event: PointerEvent) {
		if (event.button !== 0) return;
		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		previewPanel.resizing = true;

		const workspace = panelEl?.closest(".workspace") as HTMLElement | null;

		const startX = event.clientX;
		const startW = previewPanel.width;
		let latestX = startX;
		let latestW = startW;
		let raf = 0;

		const flush = () => {
			raf = 0;
			latestW = clampPreviewWidth(startW + (startX - latestX));
			// Direct CSS var — skip Svelte width state until pointerup
			workspace?.style.setProperty(
				"--preview-panel-width",
				`${latestW}px`,
			);
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
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onUp);
			document.body.style.removeProperty("cursor");
			document.body.style.removeProperty("user-select");
		};

		document.body.style.cursor = "col-resize";
		document.body.style.userSelect = "none";
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
	}

	function onTabClose(event: MouseEvent, id: string) {
		event.stopPropagation();
		event.preventDefault();
		previewPanel.closeTab(id);
	}

	/** Minimal, quote-aware CSV/TSV parser → rows of cells. */
	function parseCsv(text: string): string[][] {
		const firstLine = text.slice(0, text.indexOf("\n") + 1 || text.length);
		const delim = firstLine.split("\t").length > firstLine.split(",").length ? "\t" : ",";
		const rows: string[][] = [];
		let row: string[] = [];
		let field = "";
		let quoted = false;
		for (let i = 0; i < text.length; i++) {
			const c = text[i];
			if (quoted) {
				if (c === '"' && text[i + 1] === '"') {
					field += '"';
					i++;
				} else if (c === '"') quoted = false;
				else field += c;
			} else if (c === '"') quoted = true;
			else if (c === delim) {
				row.push(field);
				field = "";
			} else if (c === "\n" || c === "\r") {
				if (c === "\r" && text[i + 1] === "\n") i++;
				row.push(field);
				rows.push(row);
				row = [];
				field = "";
			} else field += c;
		}
		if (field !== "" || row.length) {
			row.push(field);
			rows.push(row);
		}
		return rows.filter((r) => r.length > 1 || (r[0] ?? "") !== "");
	}

	const NUM_RE = /^-?[$€£]?\s?[\d,]+(\.\d+)?%?$/;
	const isNum = (v: string) => NUM_RE.test((v ?? "").trim());
	const CSV_ROW_CAP = 500;

	/** A column is numeric if every non-empty cell (in the shown rows) is a
	 *  number — used to right-align the whole column, header included. */
	function numericColumns(rows: string[][]): boolean[] {
		const header = rows[0] ?? [];
		const last = Math.min(rows.length, CSV_ROW_CAP + 1);
		return header.map((_, col) => {
			let seen = 0;
			for (let r = 1; r < last; r++) {
				const v = (rows[r]?.[col] ?? "").trim();
				if (!v) continue;
				seen++;
				if (!isNum(v)) return false;
			}
			return seen > 0;
		});
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
				<div
					class="tab"
					class:active={tab.id === item?.id}
					role="presentation"
				>
					<button
						type="button"
						class="tab-main"
						role="tab"
						aria-selected={tab.id === item?.id}
						title={tab.name}
						onclick={() => previewPanel.select(tab.id)}
					>
						<span class="tab-name">{tab.name}</span>
						<span class="tab-type"
							>{typeLabel(tab.previewType)}</span
						>
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
		{:else if isChart && (embedUrl || item.content)}
			<div
				class="chart-fit"
				bind:clientWidth={chartFitW}
				style="height:{Math.round(chartNatH * chartScale)}px"
			>
				<iframe
					class="chart-frame"
					title={item.name}
					sandbox="allow-scripts"
					referrerpolicy="no-referrer"
					src={embedUrl ?? undefined}
					srcdoc={!embedUrl && item.content
						? withChartFitShim(item.content)
						: undefined}
					style="width:{chartNatW}px;height:{chartNatH}px;transform:scale({chartScale})"
				></iframe>
			</div>
		{:else if shouldIframe(item) && embedUrl}
			<iframe
				class="preview-frame"
				src={embedUrl}
				title={item.name}
				sandbox="allow-scripts"
				referrerpolicy="no-referrer"
			></iframe>
		{:else if isHtmlEmbed(item) && item.content}
			<iframe
				class="preview-frame"
				title={item.name}
				sandbox="allow-scripts"
				srcdoc={item.content}
			></iframe>
		{:else if isTable(item) && item.content}
			{@render csvTable(parseCsv(item.content), item.content)}
		{:else if isTable(item) && embedUrl}
			{#await fetch(embedUrl).then((r) => r.text())}
				<p class="empty">Loading…</p>
			{:then text}
				{@render csvTable(parseCsv(text), text)}
			{:catch}
				<iframe
					class="preview-frame"
					src={embedUrl}
					title={item.name}
					sandbox="allow-scripts"
					referrerpolicy="no-referrer"
				></iframe>
			{/await}
		{:else if item.content}
			{#if item.previewType === "markdown" || item.previewType === "md"}
				<div class="preview-md">
					<Markdown content={item.content} />
				</div>
			{:else}
				<PierreCode
					fileName={item.name || "preview.txt"}
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
				href={embedUrl ?? item.url}
				target="_blank"
				rel="noreferrer noopener"
			>
				Open in new tab
				<ExternalLink size={12} />
			</a>
		</footer>
	{/if}
</aside>

{#snippet csvTable(rows: string[][], raw: string)}
	{#if rows.length > 0 && rows[0].length > 1}
		{@const numCols = numericColumns(rows)}
		<div class="csv-wrap">
			<table class="csv">
				<thead>
					<tr>
						<th class="csv-rownum"></th>
						{#each rows[0] as h, i}
							<th class:num={numCols[i]} title={h}>{h}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each rows.slice(1, CSV_ROW_CAP + 1) as r, i}
						<tr>
							<td class="csv-rownum">{i + 1}</td>
							{#each r as c, ci}
								<td class:num={numCols[ci]} title={c}>{c}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if rows.length - 1 > CSV_ROW_CAP}
			<p class="csv-note">Showing first {CSV_ROW_CAP} of {rows.length - 1} rows</p>
		{/if}
	{:else}
		<pre class="preview-table">{raw}</pre>
	{/if}
{/snippet}

<style>
	.preview-panel {
		position: relative;
		display: flex;
		/* Width set by ChatPage / drawerSlide transition / resize handle */
		min-width: 0;
		min-height: 0;
		flex-direction: column;
		border-left: 1px solid
			color-mix(in srgb, var(--color-line) 85%, transparent);
		background: var(--color-fill);
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
		border-bottom: 1px solid
			color-mix(in srgb, var(--color-line) 80%, transparent);
		background: var(--color-elevate);
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
		border-right: 1px solid
			color-mix(in srgb, var(--color-line) 70%, transparent);
		color: #71717a;
		background: transparent;
	}

	.tab:hover {
		color: var(--color-text-3);
		background: color-mix(in srgb, var(--color-ink) 3%, transparent);
	}

	.tab.active {
		color: var(--color-ink);
		background: var(--color-fill);
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
		border-bottom: 1px solid
			color-mix(in srgb, var(--color-line) 70%, transparent);
		color: #71717a;
		font-size: 12px;
		line-height: 1.4;
	}

	.panel-body {
		flex: 1;
		min-width: 0;
		min-height: 0;
		overflow-x: hidden;
		overflow-y: auto;
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
		background: var(--color-elevate);
	}

	.preview-frame {
		width: 100%;
		height: min(70vh, 640px);
		border: 1px solid var(--color-line);
		border-radius: 8px;
		background: var(--color-elevate);
	}

	/* Chart: scale a fixed-size iframe down to the panel so the whole chart
	   shows with no overflow either axis. */
	.chart-fit {
		position: relative;
		width: 100%;
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: 8px;
		background: var(--color-elevate);
	}

	.chart-frame {
		display: block;
		border: 0;
		background: var(--color-elevate);
		transform-origin: top left;
	}

	.preview-table {
		margin: 0;
		overflow: auto;
		padding: 10px 12px;
		border: 1px solid var(--color-line);
		border-radius: 8px;
		background: var(--color-elevate);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 11.5px;
		line-height: 1.45;
		white-space: pre;
	}

	.csv-wrap {
		overflow: auto;
		max-height: 100%;
		border: 1px solid var(--color-line);
		border-radius: 10px;
		background: var(--color-elevate);
	}

	.csv {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		font-size: 12.5px;
		color: var(--color-text-strong);
	}

	.csv th,
	.csv td {
		max-width: 260px;
		overflow: hidden;
		padding: 7px 12px;
		text-align: left;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* thin separators: rows get a bottom rule, columns a light right rule */
	.csv td {
		border-bottom: 1px solid color-mix(in srgb, var(--color-line) 55%, transparent);
	}

	.csv tbody tr:last-child td {
		border-bottom: 0;
	}

	.csv th {
		position: sticky;
		top: 0;
		z-index: 1;
		border-bottom: 1px solid var(--color-line);
		background: var(--color-fill);
		color: var(--color-muted);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.csv td.num,
	.csv th.num {
		text-align: right;
	}

	.csv td.num {
		font-variant-numeric: tabular-nums;
	}

	.csv tbody tr:hover td {
		background: color-mix(in srgb, var(--color-ink) 3%, transparent);
	}

	/* muted row-number gutter */
	.csv-rownum {
		position: sticky;
		left: 0;
		width: 1%;
		max-width: none;
		border-right: 1px solid color-mix(in srgb, var(--color-line) 55%, transparent);
		background: var(--color-fill);
		color: var(--color-muted);
		font-variant-numeric: tabular-nums;
		text-align: right;
		user-select: none;
	}

	thead .csv-rownum {
		z-index: 2;
	}

	.csv-note {
		margin: 8px 2px 0;
		color: var(--color-muted);
		font-size: 11px;
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
		border-top: 1px solid
			color-mix(in srgb, var(--color-line) 80%, transparent);
		background: var(--color-elevate);
	}
</style>
