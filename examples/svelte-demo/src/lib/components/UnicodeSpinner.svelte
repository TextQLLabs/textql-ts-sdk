<script lang="ts">
	import spinners, { type BrailleSpinnerName } from "unicode-animations";
	import { prefersReducedMotion } from "$lib/utils";

	const spinnerNames = Object.keys(spinners) as BrailleSpinnerName[];

	function randomSpinnerName(): BrailleSpinnerName {
		return spinnerNames[Math.floor(Math.random() * spinnerNames.length)]!;
	}

	let {
		label = "Loading",
		class: className = "",
	}: {
		label?: string;
		class?: string;
	} = $props();

	let name = $state<BrailleSpinnerName>("braille");
	let frame = $state(0);
	let ready = $state(false);
	const spinner = $derived(spinners[name]);

	$effect(() => {
		const resolved = randomSpinnerName();
		name = resolved;
		ready = true;

		const { frames, interval } = spinners[resolved];
		frame = 0;

		if (prefersReducedMotion() || frames.length === 0) return;

		const timer = setInterval(() => {
			frame = (frame + 1) % frames.length;
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
	<span aria-hidden="true">{ready ? (spinner.frames[frame] ?? "") : ""}</span>
</span>

<style>
	.unicode-spinner {
		display: inline-block;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
			monospace;
		font-size: 12px;
		line-height: 1;
		color: var(--color-muted, #71717a);
		user-select: none;
	}
</style>
