<script lang="ts">
	import '../app.css';
	import { Toaster } from '$lib/primitives';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="theme-color" content="#f7f7f8" />
</svelte:head>

<Toaster />
{@render children()}
