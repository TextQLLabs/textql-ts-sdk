<script lang="ts">
	import { formatElapsed } from '$lib/cells';

	let {
		startedAtMs = null,
		prefix = 'Running',
		class: className = ''
	}: {
		/** API timestamp in ms, or null to start the clock on mount. */
		startedAtMs?: number | null;
		prefix?: string;
		class?: string;
	} = $props();

	let now = $state(Date.now());
	/** Local fallback when the cell has no timestamp yet (set once). */
	let localStartMs = $state<number | null>(null);

	// Capture a local start the first time we render without an API timestamp.
	$effect(() => {
		if (startedAtMs != null) return;
		if (localStartMs != null) return;
		localStartMs = Date.now();
	});

	$effect(() => {
		now = Date.now();
		const id = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(id);
	});

	const startMs = $derived(startedAtMs ?? localStartMs ?? now);
	const label = $derived(`${prefix} ${formatElapsed(now - startMs)}`);
</script>

<span class={['running-duration', className]} aria-live="polite">{label}</span>

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
