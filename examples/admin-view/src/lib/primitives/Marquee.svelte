<script lang="ts">
	let { text, speed = 40, gap = 32, center = false, class: className = '' }: { text: string; speed?: number; gap?: number; center?: boolean; class?: string } = $props();
	let outer: HTMLDivElement;
	let first: HTMLSpanElement;
	let scrolling = $state(false);

	$effect(() => {
		if (!outer || !first || typeof ResizeObserver === 'undefined') return;
		let animation: Animation | undefined;
		const measure = () => {
			animation?.cancel();
			scrolling = first.scrollWidth > outer.clientWidth + 1;
			if (!scrolling || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
			const shift = first.scrollWidth + gap;
			animation = first.parentElement?.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${-shift}px)` }], { duration: shift / speed * 1000, iterations: Infinity, easing: 'linear' });
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(outer);
		return () => { observer.disconnect(); animation?.cancel(); };
	});
</script>

<div class={`marquee ${className}`} bind:this={outer}>
	<div class:centered={center && !scrolling} class="track" style:gap={`${gap}px`}>
		<span bind:this={first}>{text}</span>
		{#if scrolling}<span aria-hidden="true">{text}</span>{/if}
	</div>
</div>

<style>
	.marquee { overflow: hidden; }
	.track { display: flex; width: max-content; white-space: nowrap; }
	.track.centered { width: 100%; justify-content: center; }
</style>
