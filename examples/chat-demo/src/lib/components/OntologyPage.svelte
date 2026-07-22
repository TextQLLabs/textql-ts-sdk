<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import Markdown from '$lib/components/Markdown.svelte';
	import OntologyTreeNode from '$lib/components/OntologyTreeNode.svelte';
	import PierreCode from '$lib/components/PierreCode.svelte';
	import UnicodeSpinner from '$lib/components/UnicodeSpinner.svelte';
	import { Page } from '$lib/primitives';
	import { isRecord } from '$lib/utils';

	type Entry = { path: string; name: string; isDir: boolean; sizeBytes: number };
	type OpenFile = { path: string; name: string; content: string };

	let roots = $state<Entry[]>([]);
	let listing = $state(false);
	let listError = $state<string | undefined>();

	let file = $state<OpenFile | undefined>();
	let fileLoading = $state(false);
	let fileError = $state<string | undefined>();

	const LANGS: Record<string, string> = {
		py: 'python',
		sql: 'sql',
		yaml: 'yaml',
		yml: 'yaml',
		json: 'json',
		ts: 'typescript',
		js: 'javascript',
		toml: 'toml',
		txt: 'text'
	};
	function extOf(name: string) {
		return name.split('.').pop()?.toLowerCase() ?? '';
	}
	// Pick a viewer per native format.
	const kind = $derived.by<'md' | 'csv' | 'code' | null>(() => {
		if (!file) return null;
		const e = extOf(file.name);
		if (e === 'md' || e === 'markdown') return 'md';
		if (e === 'csv') return 'csv';
		return 'code';
	});
	const csvRows = $derived(kind === 'csv' && file ? parseCsv(file.content) : []);

	// Minimal RFC-4180-ish CSV parse (quotes + escaped quotes), capped for perf.
	function parseCsv(text: string): string[][] {
		const rows: string[][] = [];
		let row: string[] = [];
		let cur = '';
		let quoted = false;
		for (let i = 0; i < text.length; i++) {
			const c = text[i];
			if (quoted) {
				if (c === '"') {
					if (text[i + 1] === '"') {
						cur += '"';
						i++;
					} else quoted = false;
				} else cur += c;
			} else if (c === '"') quoted = true;
			else if (c === ',') {
				row.push(cur);
				cur = '';
			} else if (c === '\n') {
				row.push(cur);
				rows.push(row);
				row = [];
				cur = '';
				if (rows.length >= 1000) break; // safety cap
			} else if (c !== '\r') cur += c;
		}
		if (cur !== '' || row.length) {
			row.push(cur);
			rows.push(row);
		}
		return rows;
	}

	async function loadRoots() {
		listing = true;
		listError = undefined;
		try {
			const res = await fetch('/api/ontology');
			const body: unknown = await res.json();
			if (!res.ok || !isRecord(body) || !Array.isArray(body.entries)) {
				throw new Error(
					isRecord(body) && typeof body.error === 'string' ? body.error : 'Failed to load.'
				);
			}
			roots = body.entries as Entry[];
		} catch (err) {
			listError = err instanceof Error ? err.message : 'Failed to load the ontology.';
		} finally {
			listing = false;
		}
	}

	async function open(path: string) {
		fileLoading = true;
		fileError = undefined;
		file = undefined;
		try {
			const res = await fetch(`/api/ontology/file?path=${encodeURIComponent(path)}`);
			const body: unknown = await res.json();
			if (!res.ok || !isRecord(body) || typeof body.content !== 'string') {
				throw new Error(
					isRecord(body) && typeof body.error === 'string' ? body.error : 'Failed to read the file.'
				);
			}
			file = {
				path,
				name: String(body.name ?? path.split('/').pop() ?? path),
				content: body.content
			};
		} catch (err) {
			fileError = err instanceof Error ? err.message : 'Failed to read the file.';
		} finally {
			fileLoading = false;
		}
	}

	// Reflect the open file in the URL so it can be shared / reloaded.
	function selectFile(entry: Entry) {
		const url = new URL(page.url);
		url.searchParams.set('file', entry.path);
		replaceState(url, page.state);
		void open(entry.path);
	}

	onMount(() => {
		void loadRoots();
		const deepLink = page.url.searchParams.get('file');
		if (deepLink) void open(deepLink);
	});
</script>

<svelte:head>
	<title>Ontology</title>
</svelte:head>

<Page title="Ontology" lead="Browse ontology files." wide>
	<div class="ontology">
		<aside class="tree">
			<header class="tree-head">Files</header>
			<div class="tree-body">
				{#if listing}
					<div class="hint"><UnicodeSpinner label="Loading ontology" /></div>
				{:else if listError}
					<p class="hint error">{listError}</p>
				{:else if roots.length === 0}
					<p class="hint">Ontology is empty</p>
				{:else}
					{#each roots as entry (entry.path)}
						<OntologyTreeNode {entry} selectedPath={file?.path} onSelect={selectFile} />
					{/each}
				{/if}
			</div>
		</aside>

		<section class="viewer">
			{#if fileLoading}
				<div class="hint"><UnicodeSpinner label="Loading file" /></div>
			{:else if fileError}
				<p class="hint error">{fileError}</p>
			{:else if file && kind === 'md'}
				<div class="md"><Markdown content={file.content} /></div>
			{:else if file && kind === 'csv'}
				<div class="csv-wrap">
					<table class="csv">
						{#if csvRows.length}
							<thead>
								<tr>{#each csvRows[0] as cell (cell)}<th>{cell}</th>{/each}</tr>
							</thead>
							<tbody>
								{#each csvRows.slice(1) as row, r (r)}
									<tr>{#each row as cell, c (c)}<td>{cell}</td>{/each}</tr>
								{/each}
							</tbody>
						{/if}
					</table>
				</div>
			{:else if file}
				<PierreCode fileName={file.name} contents={file.content} lang={LANGS[extOf(file.name)]} />
			{:else}
				<p class="hint">Select a file to view it.</p>
			{/if}
		</section>
	</div>
</Page>

<style>
	.ontology {
		display: grid;
		grid-template-columns: minmax(240px, 340px) 1fr;
		/* Explicit row so the columns stretch to full height (an implicit row
		   would size to content and leave the panes short). */
		grid-template-rows: minmax(0, 1fr);
		gap: 1rem;
		flex: 1;
		min-height: 0;
	}
	.tree {
		display: flex;
		flex-direction: column;
		min-height: 0;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm, 10px);
		background: color-mix(in srgb, var(--color-ink) 2.5%, transparent);
		overflow: hidden;
	}
	.tree-head {
		padding: 0.6rem 0.75rem;
		border-bottom: 1px solid var(--color-line);
		font-size: 12px;
		font-weight: 600;
		color: var(--color-muted);
	}
	.tree-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 0.35rem;
	}
	.viewer {
		min-height: 0;
		overflow: auto;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm, 10px);
		background: color-mix(in srgb, var(--color-ink) 2.5%, transparent);
		padding: 0.5rem;
	}
	.md {
		padding: 0.5rem 0.75rem;
		font-size: 13px;
		line-height: 1.55;
	}
	.csv-wrap {
		overflow: auto;
		max-width: 100%;
	}
	.csv {
		border-collapse: collapse;
		font-size: 12px;
		font-family: var(--font-mono, monospace);
	}
	.csv th,
	.csv td {
		border: 1px solid var(--color-line);
		padding: 0.25rem 0.5rem;
		text-align: left;
		white-space: nowrap;
	}
	.csv th {
		position: sticky;
		top: 0;
		background: color-mix(in srgb, var(--color-ink) 6%, var(--color-paper));
		font-weight: 600;
	}
	.hint {
		font-size: 12.5px;
		color: var(--color-muted);
		padding: 0.6rem;
	}
	.hint.error {
		color: #dc2626;
	}
</style>
