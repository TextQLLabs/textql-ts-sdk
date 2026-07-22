<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="theme-color" content="#f7f7f8" />
</svelte:head>

{@render children()}
