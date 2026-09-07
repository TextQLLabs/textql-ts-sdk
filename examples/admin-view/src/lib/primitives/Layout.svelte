<script lang="ts">
	import type { Snippet } from 'svelte';
	import Debug from './Debug.svelte';
	let { children, debug = false }: { children?: Snippet; debug?: boolean } = $props();
	let showDebug = $state(false);
	$effect(() => { if (debug) showDebug = true; });
</script>

{#if showDebug}<Debug onClose={() => (showDebug = false)} />{/if}
<div class="primitive-layout">{@render children?.()}</div>

<style>.primitive-layout { position: relative; z-index: 1; min-height: 100vh; }</style>
