<script lang="ts">
	import { ExternalLink } from "@lucide/svelte";
	import { buildCellBlocks } from "$lib/cellBlocks";
	import {
		getCellCase,
		getCellTypeInfo,
		getToolDisplayName,
		type CellLike,
	} from "$lib/cells";
	import Markdown from "./Markdown.svelte";
	import PierreCode from "./PierreCode.svelte";

	let { cell }: { cell: CellLike } = $props();

	const cellCase = $derived(getCellCase(cell));
	const info = $derived(getCellTypeInfo(cellCase));
	const execError = $derived(
		typeof cell.execError === "string" ? cell.execError : "",
	);
	const blocks = $derived(buildCellBlocks(cell));
	const Icon = $derived(info.icon);

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
			<a
				class="block-link"
				href={block.href}
				target="_blank"
				rel="noreferrer noopener"
			>
				{block.label}
				<ExternalLink size={12} />
			</a>
		{:else if block.kind === "image"}
			<img
				class="cell-image"
				src={block.url}
				alt={block.alt ?? ""}
				loading="lazy"
			/>
		{:else if block.kind === "list"}
			{#if block.label}
				<p class="block-label">{block.label}</p>
			{/if}
			<ul class="block-list">
				{#each block.items as item, j (j)}
					<li>
						{#if item.href}
							<a
								href={item.href}
								target="_blank"
								rel="noreferrer noopener">{item.title}</a
							>
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
		background: color-mix(in srgb, #fff 55%, transparent);
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
		color: #27272a;
		font-size: 13px;
		line-height: 1.55;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.block-text.error-text {
		color: #dc2626;
	}

	.block-link {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		align-self: flex-start;
		color: #2563eb;
		font-size: 12.5px;
		font-weight: 500;
		text-decoration: none;
	}

	.block-link:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
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

	.block-list a {
		color: #2563eb;
		font-size: 12.5px;
		font-weight: 500;
		text-decoration: none;
	}

	.block-list a:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
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
