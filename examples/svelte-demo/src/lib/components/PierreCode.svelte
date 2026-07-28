<script lang="ts">
	import { browser } from "$app/environment";
	import { onDestroy, onMount, tick } from "svelte";
	import type { FileContents } from "@pierre/diffs";

	let {
		fileName,
		contents,
		lang,
		fill = false,
	}: {
		fileName: string;
		contents: string;
		lang?: string;
		/** Fill the parent's height and scroll, instead of the 320px inline cap. */
		fill?: boolean;
	} = $props();

	let wrapper: HTMLDivElement | undefined = $state();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Pierre File conflicts with Web File
	let fileViewer: any;
	let host: HTMLElement | undefined;
	let lastKey = "";
	let destroyed = false;
	let loadError = $state(false);

	const currentKey = $derived(
		`${fileName}\0${lang ?? ""}\0${contents ?? ""}`,
	);

	function toFileContents(): FileContents {
		return {
			name: fileName,
			contents: contents ?? "",
			lang: lang as FileContents["lang"] | undefined,
			cacheKey: currentKey,
		};
	}

	onMount(() => {
		if (!browser) return;
		void initializeFileViewer();
	});

	async function initializeFileViewer() {
		try {
			const {
				File: PierreFile,
				DEFAULT_THEMES,
				DIFFS_TAG_NAME,
			} = await import("@pierre/diffs");
			if (destroyed || !wrapper) return;

			const el = document.createElement(DIFFS_TAG_NAME);
			el.className = "block w-full";
			el.setAttribute("aria-label", `Contents of ${fileName}`);
			wrapper.appendChild(el);
			host = el;

			fileViewer = new PierreFile({
				theme: DEFAULT_THEMES,
				themeType: "light",
				disableFileHeader: true,
				disableLineNumbers: true,
				overflow: "wrap",
				unsafeCSS: `
:host {
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
pre {
  margin: 0 !important;
  padding: 0.5rem 0.625rem !important;
  background: transparent !important;
  font-size: 11.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
code, pre, [class*="line"] {
  font-family: var(--font-mono) !important;
}
				`.trim(),
			});

			await tick();
			if (destroyed || !fileViewer || !host) return;
			renderFile();
		} catch {
			loadError = true;
		}
	}

	$effect(() => {
		const key = currentKey;
		if (!browser || !fileViewer || !host) return;
		host.setAttribute("aria-label", `Contents of ${fileName}`);
		if (key !== lastKey) renderFile();
	});

	function renderFile() {
		if (!fileViewer || !host) return;
		fileViewer.render({
			file: toFileContents(),
			fileContainer: host,
			forceRender: true,
		});
		lastKey = currentKey;
	}

	onDestroy(() => {
		destroyed = true;
		if (fileViewer) {
			fileViewer.cleanUp();
			fileViewer = undefined;
		}
		host = undefined;
	});
</script>

<div class="pierre-code" class:fill bind:this={wrapper}>
	{#if loadError}
		<pre class="fallback">{contents}</pre>
	{/if}
</div>

<style>
	.pierre-code {
		max-height: 320px;
		overflow: auto;
		border-radius: 6px;
		background: color-mix(in srgb, var(--color-ink) 5%, transparent);
	}

	/* Fill the parent (e.g. the ontology viewer) and scroll instead of capping. */
	.pierre-code.fill {
		max-height: none;
		flex: 1;
		min-height: 0;
	}

	.fallback {
		margin: 0;
		padding: 8px 10px;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 11.5px;
		line-height: 1.5;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
</style>
