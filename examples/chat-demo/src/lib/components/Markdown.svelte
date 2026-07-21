<script lang="ts">
	/**
	 * Assistant markdown: prefer server `renderedHtml` (goldmark + highlighting),
	 * fall back to client-side marked when only raw content is available.
	 */
	import { marked } from 'marked';

	let {
		renderedHtml = '',
		content = ''
	}: {
		renderedHtml?: string;
		content?: string;
	} = $props();

	marked.setOptions({ gfm: true, breaks: true });

	const html = $derived.by(() => {
		if (renderedHtml.trim()) return renderedHtml;
		if (!content.trim()) return '';
		try {
			return marked.parse(content, { async: false }) as string;
		} catch {
			return '';
		}
	});
</script>

{#if html}
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- TextQL server HTML or local marked of chat content -->
	<div class="md">{@html html}</div>
{:else if content}
	<p class="md-plain">{content}</p>
{/if}

<style>
	.md {
		color: #27272a;
		font-size: 14px;
		line-height: 1.65;
		overflow-wrap: anywhere;
	}

	.md :global(p) {
		margin: 0 0 0.65em;
	}

	.md :global(p:last-child) {
		margin-bottom: 0;
	}

	.md :global(h1),
	.md :global(h2),
	.md :global(h3),
	.md :global(h4) {
		margin: 1em 0 0.4em;
		font-weight: 650;
		line-height: 1.3;
		color: var(--color-ink);
	}

	.md :global(h1) {
		font-size: 1.25em;
	}
	.md :global(h2) {
		font-size: 1.15em;
	}
	.md :global(h3),
	.md :global(h4) {
		font-size: 1.05em;
	}

	.md :global(ul),
	.md :global(ol) {
		margin: 0 0 0.65em;
		padding-left: 1.35em;
	}

	.md :global(li) {
		margin: 0.15em 0;
	}

	.md :global(blockquote) {
		margin: 0 0 0.65em;
		padding: 0.15em 0 0.15em 0.85em;
		border-left: 3px solid var(--color-line);
		color: var(--color-muted);
	}

	.md :global(a) {
		color: #2563eb;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.md :global(code) {
		padding: 0.1em 0.35em;
		border-radius: 4px;
		background: color-mix(in srgb, var(--color-ink) 6%, transparent);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.88em;
	}

	.md :global(pre) {
		margin: 0 0 0.75em;
		overflow-x: auto;
		padding: 10px 12px;
		border-radius: 8px;
		background: color-mix(in srgb, var(--color-ink) 5%, transparent);
		font-size: 12px;
		line-height: 1.5;
	}

	.md :global(pre code) {
		padding: 0;
		background: transparent;
		font-size: inherit;
	}

	.md :global(table) {
		display: block;
		max-width: 100%;
		margin: 0 0 0.75em;
		overflow-x: auto;
		border-collapse: collapse;
		font-size: 12.5px;
	}

	.md :global(th),
	.md :global(td) {
		padding: 4px 10px;
		border: 1px solid var(--color-line);
		text-align: left;
	}

	.md :global(th) {
		background: color-mix(in srgb, var(--color-ink) 4%, transparent);
		font-weight: 600;
	}

	.md :global(hr) {
		margin: 0.9em 0;
		border: 0;
		border-top: 1px solid var(--color-line);
	}

	.md :global(img) {
		max-width: 100%;
		border-radius: 6px;
	}

	.md-plain {
		margin: 0;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		color: #27272a;
		font-size: 14px;
		line-height: 1.65;
	}
</style>
