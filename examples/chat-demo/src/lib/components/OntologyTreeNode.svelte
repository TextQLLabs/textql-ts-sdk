<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Database from '@lucide/svelte/icons/database';
	import FileIcon from '@lucide/svelte/icons/file';
	import FileCode from '@lucide/svelte/icons/file-code';
	import FileCog from '@lucide/svelte/icons/file-cog';
	import FileJson from '@lucide/svelte/icons/file-json';
	import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
	import FileText from '@lucide/svelte/icons/file-text';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import ImageIcon from '@lucide/svelte/icons/image';
	import { pierreFileIconId, pierreIconsReady } from '$lib/pierreIcons.svelte';
	import { isRecord } from '$lib/utils';
	// Self-reference: a node renders its children as more nodes.
	import Self from './OntologyTreeNode.svelte';

	// Per-extension file icons (lucide), falling back to a generic file icon.
	const FILE_ICONS: Record<string, typeof FileIcon> = {
		json: FileJson,
		csv: FileSpreadsheet,
		tsv: FileSpreadsheet,
		sql: Database,
		md: FileText,
		markdown: FileText,
		txt: FileText,
		yaml: FileCog,
		yml: FileCog,
		toml: FileCog,
		py: FileCode,
		ts: FileCode,
		tsx: FileCode,
		js: FileCode,
		jsx: FileCode,
		go: FileCode,
		rs: FileCode,
		rb: FileCode,
		java: FileCode,
		c: FileCode,
		cpp: FileCode,
		sh: FileCode,
		bash: FileCode,
		png: ImageIcon,
		jpg: ImageIcon,
		jpeg: ImageIcon,
		gif: ImageIcon,
		svg: ImageIcon,
		webp: ImageIcon
	};
	function fileIcon(name: string): typeof FileIcon {
		return FILE_ICONS[name.split('.').pop()?.toLowerCase() ?? ''] ?? FileIcon;
	}

	type Entry = { path: string; name: string; isDir: boolean; sizeBytes: number };

	let {
		entry,
		depth = 0,
		selectedPath,
		revealPath,
		onSelect
	}: {
		entry: Entry;
		depth?: number;
		selectedPath: string | undefined;
		/** Deep-link target: ancestor dirs of this path auto-expand to reveal it. */
		revealPath?: string;
		onSelect: (entry: Entry) => void;
	} = $props();

	let expanded = $state(false);
	let children = $state<Entry[] | null>(null);
	let loading = $state(false);
	let error = $state(false);

	// Auto-expand once if this directory is an ancestor of the deep-linked path,
	// cascading down as children mount.
	let autoRevealed = false;
	$effect(() => {
		if (autoRevealed || !entry.isDir || !revealPath) return;
		if (revealPath === entry.path || revealPath.startsWith(`${entry.path}/`)) {
			autoRevealed = true;
			if (!expanded) {
				expanded = true;
				if (children === null) void loadChildren();
			}
		}
	});

	// Children are fetched lazily the first time a directory is opened.
	async function loadChildren() {
		loading = true;
		error = false;
		try {
			const res = await fetch(`/api/ontology?path=${encodeURIComponent(entry.path)}`);
			const body: unknown = await res.json();
			if (!res.ok || !isRecord(body) || !Array.isArray(body.entries)) throw new Error();
			children = body.entries as Entry[];
		} catch {
			error = true;
		} finally {
			loading = false;
		}
	}

	function activate() {
		if (!entry.isDir) {
			onSelect(entry);
			return;
		}
		expanded = !expanded;
		if (expanded && children === null) void loadChildren();
	}

	const indent = $derived(depth * 14 + 8);
</script>

<button
	class="node"
	class:selected={selectedPath === entry.path}
	style="padding-left: {indent}px"
	onclick={activate}
>
	{#if entry.isDir}
		<ChevronRight size={13} class={['chev', expanded && 'open']} />
		{#if expanded}
			<FolderOpenIcon size={15} strokeWidth={1.75} />
		{:else}
			<FolderIcon size={15} strokeWidth={1.75} />
		{/if}
	{:else}
		<span class="chev-spacer"></span>
		{@const pid = pierreIconsReady() ? pierreFileIconId(entry.name) : undefined}
		{#if pid}
			<svg class="file-icon" width="15" height="15" aria-hidden="true"><use href="#{pid}" /></svg>
		{:else}
			{@const Icon = fileIcon(entry.name)}
			<Icon size={15} strokeWidth={1.75} />
		{/if}
	{/if}
	<span class="node-name">{entry.name}</span>
</button>

{#if entry.isDir && expanded}
	{#if loading}
		<p class="node-hint" style="padding-left: {indent + 14}px">Loading…</p>
	{:else if error}
		<p class="node-hint error" style="padding-left: {indent + 14}px">Failed to load</p>
	{:else if children && children.length === 0}
		<p class="node-hint" style="padding-left: {indent + 14}px">Empty</p>
	{:else if children}
		{#each children as child (child.path)}
			<Self entry={child} depth={depth + 1} {selectedPath} {revealPath} {onSelect} />
		{/each}
	{/if}
{/if}

<style>
	.node {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		width: 100%;
		text-align: left;
		font: inherit;
		font-size: 12.5px;
		color: var(--color-ink);
		padding: 0.28rem 0.45rem;
		border: 0;
		border-radius: var(--radius-xs, 6px);
		background: transparent;
		cursor: pointer;
	}
	.node:hover {
		background: color-mix(in srgb, var(--color-ink) 5%, transparent);
	}
	.node.selected {
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
	}
	:global(.node .chev) {
		flex: 0 0 auto;
		color: var(--color-muted);
		transition: transform 0.12s ease;
	}
	:global(.node .chev.open) {
		transform: rotate(90deg);
	}
	.chev-spacer {
		display: inline-block;
		width: 13px;
		flex: 0 0 auto;
	}
	.file-icon {
		flex: 0 0 auto;
	}
	.node-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.node-hint {
		margin: 0;
		font-size: 11.5px;
		color: var(--color-muted);
		padding-top: 0.15rem;
		padding-bottom: 0.15rem;
	}
	.node-hint.error {
		color: #dc2626;
	}
</style>
