<script lang="ts">
	import { formatElapsed } from "$lib/cells";

	let {
		startedAtMs = null,
	}: {
		/** API timestamp in ms, or null to start the clock on mount. */
		startedAtMs?: number | null;
	} = $props();

	const mountMs = Date.now();
	let now = $state(Date.now());

	$effect(() => {
		now = Date.now();
		const id = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(id);
	});

	const label = $derived(
		`Running ${formatElapsed(now - (startedAtMs ?? mountMs))}`,
	);
</script>

<span class="running-duration" aria-live="polite">{label}</span>

<style>
	.running-duration {
		flex-shrink: 0;
		color: #a1a1aa;
		font-size: 11.5px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.01em;
		white-space: nowrap;
	}
</style>
