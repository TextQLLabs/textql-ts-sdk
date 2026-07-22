<script lang="ts">
	import spinners, {
		type BrailleSpinnerName,
	} from "unicode-animations";

	let {
		name = "braille",
		label = "Loading",
		class: className = "",
	}: {
		name?: BrailleSpinnerName;
		label?: string;
		class?: string;
	} = $props();

	let frame = $state(0);
	const spinner = $derived(spinners[name]);

	// $effect only runs in the browser — start/stop the interval there and clean up on destroy.
	$effect(() => {
		const { frames, interval } = spinner;
		frame = 0;

		const reduced =
			typeof matchMedia === "function" &&
			matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reduced || frames.length === 0) return;

		let i = 0;
		const timer = setInterval(() => {
			i = (i + 1) % frames.length;
			frame = i;
		}, interval);

		return () => clearInterval(timer);
	});
</script>

<span
	class={["unicode-spinner", className]}
	role="status"
	aria-label={label}
	aria-live="polite"
>
	<span aria-hidden="true">{spinner.frames[frame] ?? ""}</span>
</span>

<style>
	.unicode-spinner {
		display: inline-block;
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 12px;
		line-height: 1;
		color: var(--color-muted, #71717a);
		user-select: none;
	}
</style>
