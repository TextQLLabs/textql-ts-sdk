<script lang="ts">
	import spinners, {
		type BrailleSpinnerName,
	} from "unicode-animations";

	const spinnerNames = Object.keys(spinners) as BrailleSpinnerName[];

	function randomSpinnerName(): BrailleSpinnerName {
		return spinnerNames[Math.floor(Math.random() * spinnerNames.length)]!;
	}

	let {
		name: nameProp,
		label = "Loading",
		class: className = "",
	}: {
		name?: BrailleSpinnerName;
		label?: string;
		class?: string;
	} = $props();

	let name = $state<BrailleSpinnerName>("braille");
	let frame = $state(0);
	let ready = $state(false);
	const spinner = $derived(spinners[name]);

	// Randomize once per mount after hydration (avoids SSR mismatch). Explicit `name` still wins.
	$effect(() => {
		const resolved = nameProp ?? randomSpinnerName();
		name = resolved;
		ready = true;

		const { frames, interval } = spinners[resolved];
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
	<span aria-hidden="true">{ready ? (spinner.frames[frame] ?? "") : ""}</span>
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
