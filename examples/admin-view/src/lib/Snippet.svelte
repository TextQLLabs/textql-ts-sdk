<script lang="ts">
	import { AlertTriangle, Check, Copy } from '@lucide/svelte';

	import type { RequestSnippet } from '$lib/curl';

	let { snippet }: { snippet: RequestSnippet } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(snippet.code);
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1600);
		} catch {
			copied = false;
		}
	}
</script>

<div class="border-line rounded-sm border">
	<div class="border-line flex items-center gap-2 border-b px-2.5 py-1.5">
		<span class="text-muted flex-1 text-[11px] font-medium">{snippet.title}</span>
		<button
			type="button"
			onclick={copy}
			class="text-muted hover:text-ink flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px]"
		>
			{#if copied}
				<Check size={11} class="text-ok" />
				Copied
			{:else}
				<Copy size={11} />
				Copy
			{/if}
		</button>
	</div>

	{#if snippet.warning}
		<p class="text-warn bg-warn-bg flex items-start gap-1.5 px-2.5 py-2 text-[11px] leading-relaxed">
			<AlertTriangle size={12} class="mt-0.5 shrink-0" />
			<span>{snippet.warning}</span>
		</p>
	{/if}

	<pre class="text-ink overflow-x-auto px-2.5 py-2 font-mono text-[11px] leading-relaxed">{snippet.code}</pre>
</div>
