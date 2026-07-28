<script lang="ts">
	import { ExternalLink } from "@lucide/svelte";
	import { buildCellBlocks } from "$lib/cellBlocks";
	import {
		getCellCase,
		getCellTypeInfo,
		getToolDisplayName,
		type CellLike,
	} from "$lib/cells";
	import {
		guessPreviewType,
		previewItemsFromCell,
		previewPanel,
	} from "$lib/previewPanel.svelte";
	import { toEmbeddablePreviewUrl } from "$lib/previewUrl";
	import Markdown from "./Markdown.svelte";
	import PierreCode from "./PierreCode.svelte";

	let { cell }: { cell: CellLike } = $props();

	const cellCase = $derived(getCellCase(cell));
	const info = $derived(getCellTypeInfo(cellCase));
	const execError = $derived(
		typeof cell.execError === "string" ? cell.execError : "",
	);
	// buildCellBlocks owns the Time row: it only appends one once the cell finishes.
	const blocks = $derived(buildCellBlocks(cell));
	const Icon = $derived(info.icon);
	const cellAssets = $derived(previewItemsFromCell(cell));
	const cellKey = $derived(
		typeof cell.id === "string" && cell.id ? cell.id : "cell",
	);

	// Pierre detects language from the filename extension.
	const LANG_FILENAMES: Record<string, string> = {
		sql: "query.sql",
		python: "code.py",
		javascript: "code.js",
		bash: "script.sh",
		json: "data.json",
		diff: "changes.diff",
	};

	function codeFileName(lang: string): string {
		return LANG_FILENAMES[lang] ?? `code.${lang}`;
	}

	/** Prefer the collected chat-asset identity so topbar / steps share tabs. */
	function openUrlAsset(url: string, name: string, suffix: string, previewType?: string) {
		const match = cellAssets.find((item) => item.url === url);
		if (match) {
			previewPanel.openItem(match);
			return;
		}
		previewPanel.openItem({
			id: `${cellKey}:${suffix}`,
			name,
			previewType: previewType ?? guessPreviewType(url),
			url,
			content: null,
			error: null,
			toolSummary:
				typeof cell.toolSummary === "string" ? cell.toolSummary : null,
		});
	}
</script>

<div class="cell-detail" class:errored={!!execError}>
	<div class="cell-head">
		<Icon size={14} />
		<span class="cell-name">{getToolDisplayName(cell)}</span>
		{#if cell.toolSummary}
			<span class="cell-summary">{cell.toolSummary}</span>
		{/if}
	</div>

	{#if execError}
		<p class="cell-error">{execError}</p>
	{/if}

	{#each blocks as block, i (i)}
		{#if block.kind === "kv"}
			<dl class="block-kv">
				{#each block.rows as row (row.label)}
					<dt>{row.label}</dt>
					<dd>{row.value}</dd>
				{/each}
			</dl>
		{:else if block.kind === "code"}
			{#if block.label}
				<p class="block-label">{block.label}</p>
			{/if}
			{#if block.lang}
				<PierreCode
					fileName={codeFileName(block.lang)}
					contents={block.text}
					lang={block.lang}
				/>
			{:else}
				<pre class="block-code">{block.text}</pre>
			{/if}
		{:else if block.kind === "md"}
			{#if block.label}
				<p class="block-label">{block.label}</p>
			{/if}
			<div class="block-md">
				<Markdown content={block.text} />
			</div>
		{:else if block.kind === "text"}
			{#if block.label}
				<p class="block-label">{block.label}</p>
			{/if}
			<p class="block-text" class:error-text={block.label === "Error"}>
				{block.text}
			</p>
		{:else if block.kind === "link"}
			<button
				type="button"
				class="block-link"
				onclick={() =>
					openUrlAsset(block.href, block.label || "Link", `link-${i}`)}
			>
				{block.label}
				<ExternalLink size={12} />
			</button>
		{:else if block.kind === "image"}
			<button
				type="button"
				class="cell-image-btn"
				onclick={() =>
					openUrlAsset(
						block.url,
						block.alt || "Image",
						`image-${i}`,
						"image",
					)}
			>
				<img
					class="cell-image"
					src={toEmbeddablePreviewUrl(block.url) ?? block.url}
					alt={block.alt ?? ""}
					loading="lazy"
				/>
			</button>
		{:else if block.kind === "list"}
			{#if block.label}
				<p class="block-label">{block.label}</p>
			{/if}
			<ul class="block-list">
				{#each block.items as item, j (j)}
					<li>
						{#if item.href}
							<button
								type="button"
								class="list-link"
								onclick={() =>
									openUrlAsset(
										item.href!,
										item.title || "File",
										`list-${i}-${j}`,
									)}
							>
								{item.title}
							</button>
						{:else}
							<span class="list-title">{item.title}</span>
						{/if}
						{#if item.subtitle}
							<span class="list-subtitle">{item.subtitle}</span>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
</div>

<style>
	.cell-detail {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px 12px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm, 8px);
		background: color-mix(in srgb, var(--color-elevate) 55%, transparent);
	}

	.cell-detail.errored {
		border-color: color-mix(in srgb, #dc2626 35%, var(--color-line));
	}

	.cell-head {
		display: flex;
		align-items: center;
		gap: 7px;
		min-width: 0;
		color: var(--color-ink);
	}

	.cell-head :global(svg) {
		flex-shrink: 0;
		color: var(--color-muted);
	}

	.cell-name {
		flex-shrink: 0;
		font-size: 12.5px;
		font-weight: 600;
	}

	.cell-summary {
		overflow: hidden;
		color: var(--color-muted);
		font-size: 12.5px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.cell-error {
		margin: 0;
		color: #dc2626;
		font-size: 12px;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.block-label {
		margin: 2px 0 0;
		color: var(--color-muted);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.block-kv {
		display: grid;
		margin: 0;
		grid-template-columns: max-content 1fr;
		column-gap: 14px;
		row-gap: 2px;
	}

	.block-kv dt {
		color: var(--color-muted);
		font-size: 11.5px;
		font-weight: 500;
		line-height: 1.6;
	}

	.block-kv dd {
		margin: 0;
		min-width: 0;
		color: var(--color-ink);
		font-size: 12px;
		line-height: 1.6;
		overflow-wrap: anywhere;
	}

	.block-code {
		margin: 0;
		max-height: 320px;
		overflow: auto;
		padding: 8px 10px;
		border-radius: 6px;
		background: color-mix(in srgb, var(--color-ink) 5%, transparent);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 11.5px;
		line-height: 1.5;
		white-space: pre;
	}

	.block-md {
		font-size: 13px;
	}

	.block-md :global(.md) {
		font-size: 13px;
	}

	.block-text {
		margin: 0;
		color: var(--color-text-strong);
		font-size: 13px;
		line-height: 1.55;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.block-text.error-text {
		color: #dc2626;
	}

	.block-link,
	.list-link {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		align-self: flex-start;
		padding: 0;
		border: 0;
		background: transparent;
		color: #2563eb;
		font: inherit;
		font-size: 12.5px;
		font-weight: 500;
		text-align: left;
		text-decoration: none;
		cursor: pointer;
	}

	.block-link:hover,
	.list-link:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.cell-image-btn {
		display: block;
		max-width: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: zoom-in;
		text-align: left;
	}

	.block-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.block-list li {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.list-title {
		color: var(--color-ink);
		font-size: 12.5px;
		font-weight: 500;
	}

	.list-subtitle {
		color: var(--color-muted);
		font-size: 11.5px;
		line-height: 1.45;
	}

	.cell-image {
		max-width: 100%;
		border: 1px solid var(--color-line);
		border-radius: 6px;
	}
</style>
