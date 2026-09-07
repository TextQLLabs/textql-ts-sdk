<script lang="ts">
	import { LoaderCircle } from '@lucide/svelte';

	let { size = 13, label }: { size?: number; label?: string } = $props();
</script>

<span class="spinner" role={label ? 'status' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
	<LoaderCircle {size} />
</span>

<style>
	.spinner {
		display: inline-flex;
		flex: 0 0 auto;
		color: currentColor;
	}
	.spinner :global(svg) {
		animation: spin 700ms linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spinner :global(svg) {
			animation-duration: 2s;
		}
	}
</style>
