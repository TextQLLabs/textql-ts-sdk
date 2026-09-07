<script lang="ts">
	/**
	 * A vendor mark from static/ — connector logos and LLM provider logos are
	 * both raster/vector assets rather than icon-font glyphs, so they can't go
	 * through $lib/featureIcons.
	 *
	 * `src` is empty for any type with no registered logo, and a copied asset can
	 * go missing, so both cases fall back to the initial rather than a broken
	 * image.
	 */
	let {
		src,
		name,
		size = 18
	}: {
		src: string | undefined;
		name: string;
		size?: number;
	} = $props();

	let failed = $state(false);
	// A new src is a new asset; an earlier failure says nothing about it.
	$effect(() => {
		src;
		failed = false;
	});
</script>

{#if src && !failed}
	<img
		{src}
		alt=""
		width={size}
		height={size}
		style:width="{size}px"
		style:height="{size}px"
		class="brand-logo"
		onerror={() => (failed = true)}
	/>
{:else}
	<span class="brand-logo fallback" style:width="{size}px" style:height="{size}px" aria-hidden="true">
		{name.slice(0, 1).toUpperCase()}
	</span>
{/if}

<style>
	.brand-logo {
		flex: 0 0 auto;
		object-fit: contain;
		border-radius: 3px;
	}
	.fallback {
		display: grid;
		place-items: center;
		background: var(--color-fill);
		color: var(--color-muted);
		font-family: var(--font-mono);
		font-size: 9px;
		line-height: 1;
	}
</style>
